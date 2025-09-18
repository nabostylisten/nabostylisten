#!/usr/bin/env bun

import fs from "fs/promises";
import path from "path";
import { createProfileMediaRecord, createServiceMediaRecord, calculateMediaRecordStats, formatMediaRecordReport, type MediaRecordResult } from "./utils/media-record-creator";

interface ProfileUpload {
  oldUserId: string;
  newUserId: string;
  originalPath: string;
  filename: string;
  storagePath: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  uploadTime: number;
  success: boolean;
  error?: string;
}

interface ServiceUpload {
  oldServiceId: string;
  newServiceId: string;
  stylistId: string;
  imageId: string;
  originalPath: string;
  filename: string;
  storagePath: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  uploadTime: number;
  isPreview: boolean;
  success: boolean;
  error?: string;
}

interface ProfileImageMigrationReport {
  migratedAt: string;
  successfulUploads: number;
  failedUploads: number;
  uploads: ProfileUpload[];
}

interface ServiceImageMigrationReport {
  migratedAt: string;
  successfulUploads: number;
  failedUploads: number;
  uploads: ServiceUpload[];
}

interface MediaRecordCreationReport {
  createdAt: string;
  sourceFiles: {
    profileImagesReport: string;
    serviceImagesReport: string;
  };
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  profileRecords: {
    total: number;
    successful: number;
    failed: number;
  };
  serviceRecords: {
    total: number;
    successful: number;
    failed: number;
    withPreview: number;
  };
  records: Array<{
    mediaType: "profile" | "service";
    mediaId?: string;
    storagePath: string;
    userId: string;
    serviceId?: string;
    isPreview: boolean;
    success: boolean;
    error?: string;
  }>;
  errors: string[];
  validation: {
    foreignKeyChecks: {
      validUserIds: number;
      invalidUserIds: number;
      validServiceIds: number;
      invalidServiceIds: number;
    };
  };
}

const TEMP_DIR = path.join(__dirname, "../temp");
const PROFILE_REPORT_PATH = path.join(TEMP_DIR, "profile-images-migrated.json");
const SERVICE_REPORT_PATH = path.join(TEMP_DIR, "service-images-migrated.json");
const OUTPUT_PATH = path.join(TEMP_DIR, "media-records-created.json");

async function loadJsonFile<T>(filePath: string, fileName: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error(`Failed to load ${fileName} from ${filePath}: ${error}`);
  }
}

async function createMediaRecords(): Promise<void> {
  console.log("🚀 Starting media record creation...");

  // Load migration reports
  console.log("📄 Loading migration reports...");
  const [profileReport, serviceReport] = await Promise.all([
    loadJsonFile<ProfileImageMigrationReport>(PROFILE_REPORT_PATH, "profile images migration report"),
    loadJsonFile<ServiceImageMigrationReport>(SERVICE_REPORT_PATH, "service images migration report"),
  ]);

  // Filter for successful uploads only
  const successfulProfileUploads = profileReport.uploads.filter(u => u.success);
  const successfulServiceUploads = serviceReport.uploads.filter(u => u.success);

  console.log(`✅ Found ${successfulProfileUploads.length} successful profile image uploads`);
  console.log(`✅ Found ${successfulServiceUploads.length} successful service image uploads`);

  if (successfulProfileUploads.length === 0 && successfulServiceUploads.length === 0) {
    console.log("⚠️  No successful uploads found to create records for");
    return;
  }

  const allRecords: MediaRecordResult[] = [];
  const errors: string[] = [];
  let processed = 0;

  console.log("\n🔄 Creating profile image records...");

  // Create profile image records
  for (const upload of successfulProfileUploads) {
    try {
      processed++;
      const progress = `[${processed}/${successfulProfileUploads.length + successfulServiceUploads.length}]`;

      console.log(`${progress} Creating record for profile ${upload.newUserId}...`);

      const result = await createProfileMediaRecord({
        userId: upload.newUserId,
        storagePath: upload.storagePath,
      });

      allRecords.push(result);

      if (result.success) {
        console.log(`${progress} ✅ Created media record ${result.mediaId}`);
      } else {
        console.log(`${progress} ❌ Failed to create record: ${result.error}`);
        errors.push(`Profile record creation failed for ${upload.storagePath}: ${result.error}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Error creating profile record for ${upload.storagePath}: ${errorMessage}`);
      errors.push(`Profile record error for ${upload.storagePath}: ${errorMessage}`);

      allRecords.push({
        success: false,
        storagePath: upload.storagePath,
        mediaType: "avatar",
        error: errorMessage,
      });
    }
  }

  console.log("\n🔄 Creating service image records...");

  // Create service image records
  for (const upload of successfulServiceUploads) {
    try {
      processed++;
      const progress = `[${processed}/${successfulProfileUploads.length + successfulServiceUploads.length}]`;

      console.log(`${progress} Creating record for service ${upload.newServiceId} (${upload.isPreview ? 'PREVIEW' : 'IMAGE'})...`);

      const result = await createServiceMediaRecord({
        userId: upload.stylistId,
        serviceId: upload.newServiceId,
        storagePath: upload.storagePath,
        isPreview: upload.isPreview,
      });

      allRecords.push(result);

      if (result.success) {
        console.log(`${progress} ✅ Created media record ${result.mediaId} ${upload.isPreview ? '(PREVIEW)' : ''}`);
      } else {
        console.log(`${progress} ❌ Failed to create record: ${result.error}`);
        errors.push(`Service record creation failed for ${upload.storagePath}: ${result.error}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Error creating service record for ${upload.storagePath}: ${errorMessage}`);
      errors.push(`Service record error for ${upload.storagePath}: ${errorMessage}`);

      allRecords.push({
        success: false,
        storagePath: upload.storagePath,
        mediaType: "service_image",
        error: errorMessage,
      });
    }
  }

  // Calculate statistics
  const stats = calculateMediaRecordStats(allRecords);
  const profileRecords = allRecords.filter(r => r.mediaType === "avatar");
  const serviceRecords = allRecords.filter(r => r.mediaType === "service_image");

  const successfulProfileRecords = profileRecords.filter(r => r.success);
  const failedProfileRecords = profileRecords.filter(r => !r.success);
  const successfulServiceRecords = serviceRecords.filter(r => r.success);
  const failedServiceRecords = serviceRecords.filter(r => !r.success);

  // Count preview images
  const serviceUploadsWithPreview = successfulServiceUploads.filter(u => u.isPreview);

  // Create comprehensive report
  const report: MediaRecordCreationReport = {
    createdAt: new Date().toISOString(),
    sourceFiles: {
      profileImagesReport: PROFILE_REPORT_PATH,
      serviceImagesReport: SERVICE_REPORT_PATH,
    },
    totalRecords: allRecords.length,
    successfulRecords: stats.successfulRecords,
    failedRecords: stats.failedRecords,
    profileRecords: {
      total: profileRecords.length,
      successful: successfulProfileRecords.length,
      failed: failedProfileRecords.length,
    },
    serviceRecords: {
      total: serviceRecords.length,
      successful: successfulServiceRecords.length,
      failed: failedServiceRecords.length,
      withPreview: serviceUploadsWithPreview.length,
    },
    records: allRecords.map(record => {
      // Find corresponding upload for additional context
      const profileUpload = successfulProfileUploads.find(u => u.storagePath === record.storagePath);
      const serviceUpload = successfulServiceUploads.find(u => u.storagePath === record.storagePath);

      return {
        mediaType: record.mediaType === "avatar" ? "profile" as const : "service" as const,
        mediaId: record.mediaId,
        storagePath: record.storagePath,
        userId: profileUpload?.newUserId || serviceUpload?.stylistId || "unknown",
        serviceId: serviceUpload?.newServiceId,
        isPreview: serviceUpload?.isPreview || false,
        success: record.success,
        error: record.error,
      };
    }),
    errors,
    validation: {
      foreignKeyChecks: {
        validUserIds: 0, // Will be calculated if validation is implemented
        invalidUserIds: 0,
        validServiceIds: 0,
        invalidServiceIds: 0,
      },
    },
  };

  // Save report
  console.log("\n💾 Saving media record creation report...");
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2));

  // Print summary
  console.log("\n📋 Media Record Creation Summary:");
  console.log("=" .repeat(50));
  console.log(`Total Records: ${stats.totalRecords.toLocaleString()}`);
  console.log(`Successful: ${stats.successfulRecords.toLocaleString()} (${stats.successRate.toFixed(1)}%)`);
  console.log(`Failed: ${stats.failedRecords.toLocaleString()}`);

  console.log("\n📂 Record Type Breakdown:");
  console.log(`Profile Images (avatars):`);
  console.log(`  └─ Total: ${report.profileRecords.total.toLocaleString()}`);
  console.log(`  └─ Successful: ${report.profileRecords.successful.toLocaleString()}`);
  console.log(`  └─ Failed: ${report.profileRecords.failed.toLocaleString()}`);

  console.log(`Service Images:`);
  console.log(`  └─ Total: ${report.serviceRecords.total.toLocaleString()}`);
  console.log(`  └─ Successful: ${report.serviceRecords.successful.toLocaleString()}`);
  console.log(`  └─ Failed: ${report.serviceRecords.failed.toLocaleString()}`);
  console.log(`  └─ Preview Images: ${report.serviceRecords.withPreview.toLocaleString()}`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`);
    errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more errors`);
    }
  }

  console.log(`\n✅ Media record creation report saved to: ${OUTPUT_PATH}`);

  // Success assessment
  if (stats.successRate >= 95) {
    console.log("\n🟢 EXCELLENT - Media record creation highly successful!");
  } else if (stats.successRate >= 85) {
    console.log("\n🟡 GOOD - Media record creation mostly successful, review errors");
  } else {
    console.log("\n🔴 POOR - Media record creation had significant issues, investigate errors");
  }

  console.log("\n📊 Database Integration Complete:");
  console.log(`  • Profile avatars linked: ${successfulProfileRecords.length.toLocaleString()}`);
  console.log(`  • Service images linked: ${successfulServiceRecords.length.toLocaleString()}`);
  console.log(`  • Preview images set: ${serviceUploadsWithPreview.length.toLocaleString()}`);
  console.log(`  • Total media records in database: ${stats.successfulRecords.toLocaleString()}`);

  // Print formatted report
  console.log(formatMediaRecordReport(stats));
}

// Execute if run directly
if (require.main === module) {
  createMediaRecords().catch((error) => {
    console.error("❌ Media record creation failed:", error);
    process.exit(1);
  });
}