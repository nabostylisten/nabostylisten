#!/usr/bin/env bun

import fs from "fs/promises";
import path from "path";
import { detectFileType } from "./utils/file-type-detector";
import { uploadProfileImage } from "./utils/storage-uploader";
import { calculateUploadStats, type UploadResult } from "./utils/storage-uploader";

interface ValidationResult {
  category: "profile" | "service";
  originalPath: string;
  oldId: string;
  newId?: string;
  isValid: boolean;
  errorMessage?: string;
  fileSize: number;
}

interface MappingValidationReport {
  validatedAt: string;
  results: ValidationResult[];
  summary: {
    profilePics: {
      total: number;
      valid: number;
      invalid: number;
      validSize: number;
      invalidSize: number;
    };
  };
}


interface ProfileImageMigrationReport {
  migratedAt: string;
  sourceValidationFile: string;
  totalProfileImages: number;
  successfulUploads: number;
  failedUploads: number;
  skippedImages: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSizeSaved: number;
  averageCompressionRatio: number;
  uploads: Array<{
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
  }>;
  errors: string[];
  compressionStats: {
    totalFiles: number;
    avgCompressionRatio: number;
    totalSizeSaved: number;
    totalCompressionTime: number;
  };
}

const TEMP_DIR = path.join(__dirname, "../temp");
const VALIDATION_PATH = path.join(TEMP_DIR, "mapping-validation-results.json");
const OUTPUT_PATH = path.join(TEMP_DIR, "profile-images-migrated.json");

async function loadJsonFile<T>(filePath: string, fileName: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error(`Failed to load ${fileName} from ${filePath}: ${error}`);
  }
}

async function migrateProfileImages(): Promise<void> {
  console.log("🚀 Starting profile image migration...");

  // Load validation results
  console.log("📄 Loading validation results...");
  const validationReport = await loadJsonFile<MappingValidationReport>(VALIDATION_PATH, "mapping validation results");

  // Filter for valid profile images only
  const validProfileResults = validationReport.results.filter(
    r => r.category === "profile" && r.isValid && r.newId
  );

  if (validProfileResults.length === 0) {
    console.log("⚠️  No valid profile images found to migrate");
    return;
  }

  console.log(`✅ Found ${validProfileResults.length} valid profile images to migrate`);
  console.log(`📊 Total size: ${formatBytes(validProfileResults.reduce((sum, r) => sum + r.fileSize, 0))}`);

  // Process each profile image
  const uploads: UploadResult[] = [];
  const errors: string[] = [];
  let processed = 0;

  console.log("\n🔄 Processing profile images...");

  for (const result of validProfileResults) {
    try {
      processed++;
      const progress = `[${processed}/${validProfileResults.length}]`;

      console.log(`${progress} Processing ${path.basename(result.originalPath)}...`);

      // Detect file type
      const fileInfo = await detectFileType(result.originalPath);

      if (!fileInfo.isSupported) {
        console.log(`${progress} ⚠️  Skipping unsupported file type: ${fileInfo.mimeType}`);
        errors.push(`Unsupported file type for ${result.originalPath}: ${fileInfo.mimeType}`);
        continue;
      }

      // Upload with compression
      const uploadResult = await uploadProfileImage({
        oldUserId: result.oldId,
        newUserId: result.newId!,
        filePath: result.originalPath,
        fileInfo,
      });

      uploads.push(uploadResult);

      if (uploadResult.success) {
        const compressionSavings = uploadResult.compressionStats.originalSize - uploadResult.compressionStats.compressedSize;
        console.log(
          `${progress} ✅ Uploaded ${uploadResult.filename} ` +
          `(${formatBytes(compressionSavings)} saved, ${uploadResult.compressionStats.compressionRatio.toFixed(1)}% compression)`
        );
      } else {
        console.log(`${progress} ❌ Failed to upload: ${uploadResult.error}`);
        errors.push(`Upload failed for ${result.originalPath}: ${uploadResult.error}`);
      }

      // Brief pause to avoid overwhelming the system
      if (processed % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Error processing ${result.originalPath}: ${errorMessage}`);
      errors.push(`Processing error for ${result.originalPath}: ${errorMessage}`);
    }
  }

  // Calculate statistics
  const stats = calculateUploadStats(uploads);
  const successful = uploads.filter(u => u.success);
  const failed = uploads.filter(u => !u.success);

  // Create migration report
  const report: ProfileImageMigrationReport = {
    migratedAt: new Date().toISOString(),
    sourceValidationFile: VALIDATION_PATH,
    totalProfileImages: validProfileResults.length,
    successfulUploads: successful.length,
    failedUploads: failed.length,
    skippedImages: validProfileResults.length - uploads.length,
    totalOriginalSize: stats.totalOriginalSize,
    totalCompressedSize: stats.totalCompressedSize,
    totalSizeSaved: stats.totalSizeSaved,
    averageCompressionRatio: stats.averageCompressionRatio,
    uploads: uploads.map(upload => ({
      oldUserId: upload.originalPath.includes("buyer/") ? upload.originalPath.split("buyer/")[1]?.split("/")[0] || "unknown" :
                  upload.originalPath.includes("stylist/") ? upload.originalPath.split("stylist/")[1]?.split("/")[0] || "unknown" : "unknown",
      newUserId: upload.storagePath.split("/")[0] || "unknown",
      originalPath: upload.originalPath,
      filename: upload.filename,
      storagePath: upload.storagePath,
      originalSize: upload.compressionStats.originalSize,
      compressedSize: upload.compressionStats.compressedSize,
      compressionRatio: upload.compressionStats.compressionRatio,
      uploadTime: upload.uploadTime,
      success: upload.success,
      error: upload.error,
    })),
    errors,
    compressionStats: {
      totalFiles: stats.totalFiles,
      avgCompressionRatio: stats.averageCompressionRatio,
      totalSizeSaved: stats.totalSizeSaved,
      totalCompressionTime: stats.totalCompressionTime,
    },
  };

  // Save migration report
  console.log("\n💾 Saving migration report...");
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2));

  // Print summary
  console.log("\n📋 Profile Image Migration Summary:");
  console.log("=" .repeat(50));
  console.log(`Total Images Processed: ${validProfileResults.length.toLocaleString()}`);
  console.log(`Successful Uploads: ${successful.length.toLocaleString()} (${stats.successRate.toFixed(1)}%)`);
  console.log(`Failed Uploads: ${failed.length.toLocaleString()}`);
  console.log(`Skipped Images: ${report.skippedImages.toLocaleString()}`);

  console.log("\n💾 Storage Efficiency:");
  console.log(`Original Size: ${formatBytes(stats.totalOriginalSize)}`);
  console.log(`Compressed Size: ${formatBytes(stats.totalCompressedSize)}`);
  console.log(`Space Saved: ${formatBytes(stats.totalSizeSaved)} (${((stats.totalSizeSaved / stats.totalOriginalSize) * 100).toFixed(1)}%)`);
  console.log(`Average Compression: ${stats.averageCompressionRatio.toFixed(1)}%`);

  console.log("\n⚡ Performance:");
  console.log(`Total Upload Time: ${(stats.totalUploadTime / 1000).toFixed(1)}s`);
  console.log(`Total Compression Time: ${(stats.totalCompressionTime / 1000).toFixed(1)}s`);
  console.log(`Average Time per Image: ${(stats.averageUploadTime / 1000).toFixed(2)}s`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`);
    errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more errors`);
    }
  }

  console.log(`\n✅ Migration report saved to: ${OUTPUT_PATH}`);

  // Migration success assessment
  if (stats.successRate >= 95) {
    console.log("\n🟢 EXCELLENT - Profile image migration highly successful!");
  } else if (stats.successRate >= 85) {
    console.log("\n🟡 GOOD - Profile image migration mostly successful, review errors");
  } else {
    console.log("\n🔴 POOR - Profile image migration had significant issues, investigate errors");
  }

  console.log(`\n📊 Compression Benefits:`);
  console.log(`  • Storage Cost Reduction: ${((stats.totalSizeSaved / stats.totalOriginalSize) * 100).toFixed(1)}%`);
  console.log(`  • Estimated Monthly Savings: $${((stats.totalSizeSaved / (1024 * 1024 * 1024)) * 0.02).toFixed(2)} (at $0.02/GB)`);
  console.log(`  • Load Time Improvement: ~${Math.round((stats.totalSizeSaved / stats.totalOriginalSize) * 100 * 0.4)}% faster`);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Execute if run directly
if (require.main === module) {
  migrateProfileImages().catch((error) => {
    console.error("❌ Profile image migration failed:", error);
    process.exit(1);
  });
}