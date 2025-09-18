import { createServiceClient } from "@/lib/supabase/service";
import { uploadFile, storagePaths } from "@/lib/supabase/storage";
import { compressImage, type CompressionResult } from "./image-compressor";
import { validateImageFile, type FileTypeInfo } from "./file-type-detector";
import fs from "fs/promises";

export interface UploadResult {
  success: boolean;
  storagePath: string;
  originalPath: string;
  filename: string;
  fileInfo: FileTypeInfo;
  compressionStats: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    compressionTime: number;
  };
  uploadTime: number;
  error?: string;
}

export interface ProfileImageUploadParams {
  oldUserId: string;
  newUserId: string;
  filePath: string;
  fileInfo: FileTypeInfo;
}

export interface ServiceImageUploadParams {
  oldServiceId: string;
  newServiceId: string;
  imageId: string;
  filePath: string;
  fileInfo: FileTypeInfo;
  isPreview?: boolean;
}

export async function uploadProfileImage({
  oldUserId,
  newUserId,
  filePath,
  fileInfo,
}: ProfileImageUploadParams): Promise<UploadResult> {
  const uploadStartTime = Date.now();
  let compressionResult: CompressionResult | null = null;

  try {
    // Validate the image file first
    const validation = await validateImageFile(filePath);
    if (!validation.isValid) {
      return {
        success: false,
        storagePath: "",
        originalPath: filePath,
        filename: "",
        fileInfo,
        compressionStats: {
          originalSize: 0,
          compressedSize: 0,
          compressionRatio: 0,
          compressionTime: 0,
        },
        uploadTime: Date.now() - uploadStartTime,
        error: validation.error,
      };
    }

    // Compress the image
    compressionResult = await compressImage(filePath, fileInfo.extension);

    // Generate filename: keep original user ID for traceability
    const filename = `${oldUserId}${fileInfo.extension}`;
    const storagePath = storagePaths.avatar(newUserId, filename);

    // Create File object from compressed image
    const fileBuffer = await fs.readFile(compressionResult.compressedPath);
    const file = new File([new Uint8Array(fileBuffer)], filename, {
      type: fileInfo.mimeType,
    });

    // Upload to Supabase Storage
    const supabase = createServiceClient();
    await uploadFile(supabase, {
      bucket: storagePath.bucket,
      path: storagePath.path,
      file,
      contentType: fileInfo.mimeType,
    });

    // Cleanup compressed file
    await fs.unlink(compressionResult.compressedPath);

    const uploadTime = Date.now() - uploadStartTime;

    return {
      success: true,
      storagePath: storagePath.path,
      originalPath: filePath,
      filename,
      fileInfo,
      compressionStats: {
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        compressionRatio: compressionResult.compressionRatio,
        compressionTime: compressionResult.compressionTime,
      },
      uploadTime,
    };
  } catch (error) {
    // Cleanup on error
    if (compressionResult?.compressedPath) {
      try {
        await fs.unlink(compressionResult.compressedPath);
      } catch (cleanupError) {
        console.warn("Failed to cleanup compressed file:", cleanupError);
      }
    }

    return {
      success: false,
      storagePath: "",
      originalPath: filePath,
      filename: "",
      fileInfo,
      compressionStats: compressionResult
        ? {
            originalSize: compressionResult.originalSize,
            compressedSize: compressionResult.compressedSize,
            compressionRatio: compressionResult.compressionRatio,
            compressionTime: compressionResult.compressionTime,
          }
        : {
            originalSize: 0,
            compressedSize: 0,
            compressionRatio: 0,
            compressionTime: 0,
          },
      uploadTime: Date.now() - uploadStartTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function uploadServiceImage({
  newServiceId,
  imageId,
  filePath,
  fileInfo,
}: ServiceImageUploadParams): Promise<UploadResult> {
  const uploadStartTime = Date.now();
  let compressionResult: CompressionResult | null = null;

  try {
    // Validate the image file first
    const validation = await validateImageFile(filePath);
    if (!validation.isValid) {
      return {
        success: false,
        storagePath: "",
        originalPath: filePath,
        filename: "",
        fileInfo,
        compressionStats: {
          originalSize: 0,
          compressedSize: 0,
          compressionRatio: 0,
          compressionTime: 0,
        },
        uploadTime: Date.now() - uploadStartTime,
        error: validation.error,
      };
    }

    // Compress the image
    compressionResult = await compressImage(filePath, fileInfo.extension);

    // Generate filename: keep original image ID for traceability
    const filename = `${imageId}${fileInfo.extension}`;
    const storagePath = storagePaths.serviceMedia(newServiceId, filename);

    // Create File object from compressed image
    const fileBuffer = await fs.readFile(compressionResult.compressedPath);
    const file = new File([new Uint8Array(fileBuffer)], filename, {
      type: fileInfo.mimeType,
    });

    // Upload to Supabase Storage
    const supabase = createServiceClient();
    await uploadFile(supabase, {
      bucket: storagePath.bucket,
      path: storagePath.path,
      file,
      contentType: fileInfo.mimeType,
    });

    // Cleanup compressed file
    await fs.unlink(compressionResult.compressedPath);

    const uploadTime = Date.now() - uploadStartTime;

    return {
      success: true,
      storagePath: storagePath.path,
      originalPath: filePath,
      filename,
      fileInfo,
      compressionStats: {
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        compressionRatio: compressionResult.compressionRatio,
        compressionTime: compressionResult.compressionTime,
      },
      uploadTime,
    };
  } catch (error) {
    // Cleanup on error
    if (compressionResult?.compressedPath) {
      try {
        await fs.unlink(compressionResult.compressedPath);
      } catch (cleanupError) {
        console.warn("Failed to cleanup compressed file:", cleanupError);
      }
    }

    return {
      success: false,
      storagePath: "",
      originalPath: filePath,
      filename: "",
      fileInfo,
      compressionStats: compressionResult
        ? {
            originalSize: compressionResult.originalSize,
            compressedSize: compressionResult.compressedSize,
            compressionRatio: compressionResult.compressionRatio,
            compressionTime: compressionResult.compressionTime,
          }
        : {
            originalSize: 0,
            compressedSize: 0,
            compressionRatio: 0,
            compressionTime: 0,
          },
      uploadTime: Date.now() - uploadStartTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function batchUploadFiles<T extends ProfileImageUploadParams | ServiceImageUploadParams>(
  files: T[],
  uploadFunction: (params: T) => Promise<UploadResult>,
  concurrency: number = 3
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const chunks = [];

  // Split into chunks for controlled concurrency
  for (let i = 0; i < files.length; i += concurrency) {
    chunks.push(files.slice(i, i + concurrency));
  }

  console.log(`Batch uploading ${files.length} files with concurrency ${concurrency}`);

  for (const chunk of chunks) {
    const chunkPromises = chunk.map(uploadFunction);
    const chunkResults = await Promise.allSettled(chunkPromises);

    for (const result of chunkResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        console.error("Batch upload error:", result.reason);
        // Create a failed result entry
        results.push({
          success: false,
          storagePath: "",
          originalPath: "",
          filename: "",
          fileInfo: {
            mimeType: "unknown",
            extension: "unknown",
            isImage: false,
            isSupported: false,
          },
          compressionStats: {
            originalSize: 0,
            compressedSize: 0,
            compressionRatio: 0,
            compressionTime: 0,
          },
          uploadTime: 0,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    }
  }

  return results;
}

export function calculateUploadStats(results: UploadResult[]): {
  totalFiles: number;
  successfulUploads: number;
  failedUploads: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSizeSaved: number;
  averageCompressionRatio: number;
  totalUploadTime: number;
  totalCompressionTime: number;
  averageUploadTime: number;
  successRate: number;
} {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  const totalOriginalSize = results.reduce((sum, r) => sum + r.compressionStats.originalSize, 0);
  const totalCompressedSize = results.reduce((sum, r) => sum + r.compressionStats.compressedSize, 0);
  const totalSizeSaved = totalOriginalSize - totalCompressedSize;
  const averageCompressionRatio = successful.length > 0
    ? successful.reduce((sum, r) => sum + r.compressionStats.compressionRatio, 0) / successful.length
    : 0;
  const totalUploadTime = results.reduce((sum, r) => sum + r.uploadTime, 0);
  const totalCompressionTime = results.reduce((sum, r) => sum + r.compressionStats.compressionTime, 0);
  const averageUploadTime = results.length > 0 ? totalUploadTime / results.length : 0;
  const successRate = results.length > 0 ? (successful.length / results.length) * 100 : 0;

  return {
    totalFiles: results.length,
    successfulUploads: successful.length,
    failedUploads: failed.length,
    totalOriginalSize,
    totalCompressedSize,
    totalSizeSaved,
    averageCompressionRatio,
    totalUploadTime,
    totalCompressionTime,
    averageUploadTime,
    successRate,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatUploadReport(stats: ReturnType<typeof calculateUploadStats>): string {
  const compressionPercentage = stats.totalOriginalSize > 0
    ? (stats.totalSizeSaved / stats.totalOriginalSize) * 100
    : 0;

  return `
Upload Report:
==============
Total Files: ${stats.totalFiles}
Successful Uploads: ${stats.successfulUploads} (${stats.successRate.toFixed(1)}%)
Failed Uploads: ${stats.failedUploads}

Storage Efficiency:
Original Size: ${formatBytes(stats.totalOriginalSize)}
Compressed Size: ${formatBytes(stats.totalCompressedSize)}
Space Saved: ${formatBytes(stats.totalSizeSaved)} (${compressionPercentage.toFixed(1)}%)
Average Compression Ratio: ${stats.averageCompressionRatio.toFixed(1)}%

Performance:
Total Upload Time: ${(stats.totalUploadTime / 1000).toFixed(1)}s
Total Compression Time: ${(stats.totalCompressionTime / 1000).toFixed(1)}s
Average Upload Time: ${(stats.averageUploadTime / 1000).toFixed(2)}s per file
`;
}

export async function verifyUpload(
  storagePath: string,
  bucket: string,
  expectedSize?: number
): Promise<{ exists: boolean; size?: number; error?: string }> {
  try {
    const supabase = createServiceClient();

    // Try to download the file to verify it exists and get its size
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(storagePath);

    if (error) {
      return { exists: false, error: error.message };
    }

    const size = data.size;

    // If expected size is provided, verify it matches (within 1% tolerance)
    if (expectedSize && size) {
      const tolerance = expectedSize * 0.01; // 1% tolerance
      if (Math.abs(size - expectedSize) > tolerance) {
        return {
          exists: true,
          size,
          error: `Size mismatch: expected ${expectedSize}, got ${size}`,
        };
      }
    }

    return { exists: true, size };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}