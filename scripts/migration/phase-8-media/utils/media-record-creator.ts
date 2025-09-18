import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database.types";
import type { UploadResult } from "./storage-uploader";

type MediaInsert = Database["public"]["Tables"]["media"]["Insert"];
type MediaType = Database["public"]["Enums"]["media_type"];

export interface MediaRecordResult {
  success: boolean;
  mediaId?: string;
  storagePath: string;
  mediaType: MediaType;
  error?: string;
}

export interface ProfileMediaParams {
  userId: string;
  storagePath: string;
}

export interface ServiceMediaParams {
  userId: string; // stylist owner ID
  serviceId: string;
  storagePath: string;
  isPreview: boolean;
}

export async function createProfileMediaRecord({
  userId,
  storagePath,
}: ProfileMediaParams): Promise<MediaRecordResult> {
  try {
    const supabase = createServiceClient();

    const mediaData: MediaInsert = {
      owner_id: userId,
      file_path: storagePath,
      media_type: "avatar",
      is_preview_image: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("media")
      .insert(mediaData)
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        storagePath,
        mediaType: "avatar",
        error: error.message,
      };
    }

    return {
      success: true,
      mediaId: data.id,
      storagePath,
      mediaType: "avatar",
    };
  } catch (error) {
    return {
      success: false,
      storagePath,
      mediaType: "avatar",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function createServiceMediaRecord({
  userId,
  serviceId,
  storagePath,
  isPreview,
}: ServiceMediaParams): Promise<MediaRecordResult> {
  try {
    const supabase = createServiceClient();

    const mediaData: MediaInsert = {
      owner_id: userId,
      service_id: serviceId,
      file_path: storagePath,
      media_type: "service_image",
      is_preview_image: isPreview,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("media")
      .insert(mediaData)
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        storagePath,
        mediaType: "service_image",
        error: error.message,
      };
    }

    return {
      success: true,
      mediaId: data.id,
      storagePath,
      mediaType: "service_image",
    };
  } catch (error) {
    return {
      success: false,
      storagePath,
      mediaType: "service_image",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function createMediaRecordsFromUploads(
  uploadResults: UploadResult[],
  getOwnerIdForProfile: (storagePath: string) => string,
  getServiceInfo?: (
    storagePath: string,
  ) => { ownerId: string; serviceId: string; isPreview: boolean },
): Promise<MediaRecordResult[]> {
  const results: MediaRecordResult[] = [];

  for (const upload of uploadResults) {
    if (!upload.success) {
      // Skip failed uploads
      results.push({
        success: false,
        storagePath: upload.storagePath,
        mediaType: "avatar", // default, will be overridden if needed
        error: `Upload failed: ${upload.error}`,
      });
      continue;
    }

    try {
      let mediaResult: MediaRecordResult;

      // Determine if this is a profile image or service image based on storage path
      if (
        upload.storagePath.includes("avatars/") ||
        isProfileImagePath(upload.storagePath)
      ) {
        // Profile image
        const userId = getOwnerIdForProfile(upload.storagePath);
        mediaResult = await createProfileMediaRecord({
          userId,
          storagePath: upload.storagePath,
        });
      } else if (getServiceInfo) {
        // Service image
        const serviceInfo = getServiceInfo(upload.storagePath);
        mediaResult = await createServiceMediaRecord({
          userId: serviceInfo.ownerId,
          serviceId: serviceInfo.serviceId,
          storagePath: upload.storagePath,
          isPreview: serviceInfo.isPreview,
        });
      } else {
        // Unknown type
        mediaResult = {
          success: false,
          storagePath: upload.storagePath,
          mediaType: "avatar",
          error: "Unable to determine media type from storage path",
        };
      }

      results.push(mediaResult);
    } catch (error) {
      results.push({
        success: false,
        storagePath: upload.storagePath,
        mediaType: "avatar",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

function isProfileImagePath(storagePath: string): boolean {
  // Profile images are stored in format: userId/filename.ext
  // Service images are stored in format: serviceId/filename.ext
  // We can distinguish by checking if the path has exactly 2 segments
  // and doesn't contain service-specific patterns
  const segments = storagePath.split("/");
  return segments.length === 2 && !storagePath.includes("service-");
}

export async function batchCreateMediaRecords(
  records: Array<ProfileMediaParams | ServiceMediaParams>,
  recordType: "profile" | "service",
  concurrency: number = 5,
): Promise<MediaRecordResult[]> {
  const results: MediaRecordResult[] = [];
  const chunks = [];

  // Split into chunks for controlled concurrency
  for (let i = 0; i < records.length; i += concurrency) {
    chunks.push(records.slice(i, i + concurrency));
  }

  console.log(
    `Batch creating ${records.length} ${recordType} media records with concurrency ${concurrency}`,
  );

  for (const chunk of chunks) {
    const chunkPromises = chunk.map((record) =>
      recordType === "profile"
        ? createProfileMediaRecord(record as ProfileMediaParams)
        : createServiceMediaRecord(record as ServiceMediaParams)
    );

    const chunkResults = await Promise.allSettled(chunkPromises);

    for (const result of chunkResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        console.error("Batch media record creation error:", result.reason);
        results.push({
          success: false,
          storagePath: "",
          mediaType: recordType === "profile" ? "avatar" : "service_image",
          error: result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
        });
      }
    }
  }

  return results;
}

export function calculateMediaRecordStats(results: MediaRecordResult[]): {
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  recordsByType: Record<MediaType, number>;
  successRate: number;
  errors: string[];
} {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  const recordsByType: Record<MediaType, number> = {
    avatar: 0,
    service_image: 0,
    review_image: 0,
    chat_image: 0,
    application_image: 0,
    landing_asset: 0,
    logo_asset: 0,
    booking_note_image: 0,
    other: 0,
  };

  for (const result of results) {
    recordsByType[result.mediaType]++;
  }

  const errors = failed.map((r) => r.error || "Unknown error");
  const successRate = results.length > 0
    ? (successful.length / results.length) * 100
    : 0;

  return {
    totalRecords: results.length,
    successfulRecords: successful.length,
    failedRecords: failed.length,
    recordsByType,
    successRate,
    errors,
  };
}

export function formatMediaRecordReport(
  stats: ReturnType<typeof calculateMediaRecordStats>,
): string {
  const typeBreakdown = Object.entries(stats.recordsByType)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `  ${type}: ${count}`)
    .join("\n");

  const errorBreakdown = stats.errors.length > 0
    ? `\nErrors:\n${
      stats.errors.slice(0, 10).map((e) => `  - ${e}`).join("\n")
    }${
      stats.errors.length > 10
        ? `\n  ... and ${stats.errors.length - 10} more`
        : ""
    }`
    : "";

  return `
Media Record Creation Report:
=============================
Total Records: ${stats.totalRecords}
Successful: ${stats.successfulRecords} (${stats.successRate.toFixed(1)}%)
Failed: ${stats.failedRecords}

Records by Type:
${typeBreakdown}${errorBreakdown}
`;
}

export async function validateMediaRecords(mediaIds: string[]): Promise<{
  validRecords: number;
  invalidRecords: number;
  missingRecords: string[];
  foreignKeyErrors: string[];
}> {
  try {
    const supabase = createServiceClient();

    const { data: records, error } = await supabase
      .from("media")
      .select(`
        id,
        owner_id,
        service_id,
        file_path,
        media_type,
        profiles!media_owner_id_fkey (id),
        services!media_service_id_fkey (id)
      `)
      .in("id", mediaIds);

    if (error) {
      throw new Error(`Failed to validate media records: ${error.message}`);
    }

    const missingRecords: string[] = [];
    const foreignKeyErrors: string[] = [];
    let validRecords = 0;

    for (const id of mediaIds) {
      const record = records?.find((r) => r.id === id);

      if (!record) {
        missingRecords.push(id);
        continue;
      }

      // Check foreign key constraints
      if (!record.profiles) {
        foreignKeyErrors.push(
          `Media ${id}: Invalid owner_id ${record.owner_id}`,
        );
        continue;
      }

      if (record.service_id && !record.services) {
        foreignKeyErrors.push(
          `Media ${id}: Invalid service_id ${record.service_id}`,
        );
        continue;
      }

      validRecords++;
    }

    return {
      validRecords,
      invalidRecords: missingRecords.length + foreignKeyErrors.length,
      missingRecords,
      foreignKeyErrors,
    };
  } catch (error) {
    throw new Error(`Media record validation failed: ${error}`);
  }
}
