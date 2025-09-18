#!/usr/bin/env bun

import fs from "fs/promises";
import path from "path";
import { detectFileType } from "./utils/file-type-detector";
import { uploadServiceImage } from "./utils/storage-uploader";
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
    serviceImages: {
      total: number;
      valid: number;
      invalid: number;
      validSize: number;
      invalidSize: number;
    };
  };
}

interface ServiceCreated {
  migrated_at: string;
  successful_services: number;
  failed_services: number;
  services: Array<{
    old_service_id: string;
    new_service_id: string;
    stylist_id: string;
    name: string;
    success: boolean;
  }>;
}

interface ServiceImageMigrationReport {
  migratedAt: string;
  sourceValidationFile: string;
  totalServiceImages: number;
  totalServices: number;
  successfulUploads: number;
  failedUploads: number;
  skippedImages: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSizeSaved: number;
  averageCompressionRatio: number;
  uploads: Array<{
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
  }>;
  servicesSummary: Array<{
    oldServiceId: string;
    newServiceId: string;
    stylistId: string;
    totalImages: number;
    successfulImages: number;
    failedImages: number;
    hasPreviewImage: boolean;
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
const SERVICES_CREATED_PATH = path.join(TEMP_DIR, "services-created.json");
const OUTPUT_PATH = path.join(TEMP_DIR, "service-images-migrated.json");

async function loadJsonFile<T>(filePath: string, fileName: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error(`Failed to load ${fileName} from ${filePath}: ${error}`);
  }
}

async function migrateServiceImages(): Promise<void> {
  console.log("🚀 Starting service image migration...");

  // Load validation results and service mappings
  console.log("📄 Loading validation results and service mappings...");
  const [validationReport, servicesCreated] = await Promise.all([
    loadJsonFile<MappingValidationReport>(VALIDATION_PATH, "mapping validation results"),
    loadJsonFile<ServiceCreated>(SERVICES_CREATED_PATH, "services created"),
  ]);

  // Create service mapping lookup
  const serviceMapping: Record<string, { newServiceId: string; stylistId: string }> = {};
  for (const service of servicesCreated.services) {
    if (service.success) {
      serviceMapping[service.old_service_id] = {
        newServiceId: service.new_service_id,
        stylistId: service.stylist_id,
      };
    }
  }

  // Filter for valid service images only
  const validServiceResults = validationReport.results.filter(
    r => r.category === "service" && r.isValid && r.newId
  );

  if (validServiceResults.length === 0) {
    console.log("⚠️  No valid service images found to migrate");
    return;
  }

  console.log(`✅ Found ${validServiceResults.length} valid service images to migrate`);
  console.log(`📊 Total size: ${formatBytes(validServiceResults.reduce((sum, r) => sum + r.fileSize, 0))}`);

  // Group by service to handle preview image logic
  const serviceGroups = new Map<string, ValidationResult[]>();
  for (const result of validServiceResults) {
    const serviceId = result.oldId;
    if (!serviceGroups.has(serviceId)) {
      serviceGroups.set(serviceId, []);
    }
    serviceGroups.get(serviceId)!.push(result);
  }

  console.log(`📦 Processing ${serviceGroups.size} services with images`);

  // Process each service
  const uploads: UploadResult[] = [];
  const errors: string[] = [];
  const servicesSummary: ServiceImageMigrationReport["servicesSummary"] = [];
  let processedImages = 0;
  let processedServices = 0;

  console.log("\n🔄 Processing service images...");

  for (const [oldServiceId, serviceResults] of serviceGroups) {
    try {
      processedServices++;
      const serviceProgress = `[Service ${processedServices}/${serviceGroups.size}]`;

      const serviceInfo = serviceMapping[oldServiceId];
      if (!serviceInfo) {
        console.log(`${serviceProgress} ⚠️  Skipping service ${oldServiceId} - no mapping found`);
        errors.push(`No service mapping found for ${oldServiceId}`);
        continue;
      }

      console.log(`${serviceProgress} Processing service ${oldServiceId} (${serviceResults.length} images)...`);

      let serviceUploads = 0;
      let serviceFailed = 0;
      let hasPreviewImage = false;

      // Sort images to ensure consistent preview selection (first one becomes preview)
      const sortedResults = serviceResults.sort((a, b) => a.originalPath.localeCompare(b.originalPath));

      for (let i = 0; i < sortedResults.length; i++) {
        const result = sortedResults[i];
        const isPreview = i === 0; // First image is preview
        processedImages++;

        const imageProgress = `[${processedImages}/${validServiceResults.length}]`;

        try {
          console.log(`${imageProgress} Processing image ${path.basename(result.originalPath)}${isPreview ? ' (PREVIEW)' : ''}...`);

          // Extract image ID from path
          const pathSegments = result.originalPath.split(path.sep);
          const imageId = pathSegments[pathSegments.length - 1] || "unknown";

          // Detect file type
          const fileInfo = await detectFileType(result.originalPath);

          if (!fileInfo.isSupported) {
            console.log(`${imageProgress} ⚠️  Skipping unsupported file type: ${fileInfo.mimeType}`);
            errors.push(`Unsupported file type for ${result.originalPath}: ${fileInfo.mimeType}`);
            serviceFailed++;
            continue;
          }

          // Upload with compression
          const uploadResult = await uploadServiceImage({
            oldServiceId,
            newServiceId: serviceInfo.newServiceId,
            imageId,
            filePath: result.originalPath,
            fileInfo,
          });

          // Add service context to upload result
          const extendedUpload: UploadResult & {
            oldServiceId: string;
            newServiceId: string;
            stylistId: string;
            imageId: string;
            isPreview: boolean;
          } = {
            ...uploadResult,
            oldServiceId,
            newServiceId: serviceInfo.newServiceId,
            stylistId: serviceInfo.stylistId,
            imageId,
            isPreview,
          };

          uploads.push(extendedUpload);

          if (uploadResult.success) {
            serviceUploads++;
            if (isPreview) hasPreviewImage = true;

            const compressionSavings = uploadResult.compressionStats.originalSize - uploadResult.compressionStats.compressedSize;
            console.log(
              `${imageProgress} ✅ Uploaded ${uploadResult.filename}${isPreview ? ' (PREVIEW)' : ''} ` +
              `(${formatBytes(compressionSavings)} saved, ${uploadResult.compressionStats.compressionRatio.toFixed(1)}% compression)`
            );
          } else {
            serviceFailed++;
            console.log(`${imageProgress} ❌ Failed to upload: ${uploadResult.error}`);
            errors.push(`Upload failed for ${result.originalPath}: ${uploadResult.error}`);
          }

        } catch (error) {
          serviceFailed++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`${imageProgress} ❌ Error processing image: ${errorMessage}`);
          errors.push(`Processing error for ${result.originalPath}: ${errorMessage}`);
        }
      }

      // Add service summary
      servicesSummary.push({
        oldServiceId,
        newServiceId: serviceInfo.newServiceId,
        stylistId: serviceInfo.stylistId,
        totalImages: serviceResults.length,
        successfulImages: serviceUploads,
        failedImages: serviceFailed,
        hasPreviewImage,
      });

      console.log(`${serviceProgress} ✅ Service completed: ${serviceUploads}/${serviceResults.length} images uploaded`);

      // Brief pause between services to avoid overwhelming the system
      if (processedServices % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Error processing service ${oldServiceId}: ${errorMessage}`);
      errors.push(`Service processing error for ${oldServiceId}: ${errorMessage}`);
    }
  }

  // Calculate statistics
  const stats = calculateUploadStats(uploads);
  const successful = uploads.filter(u => u.success);
  const failed = uploads.filter(u => !u.success);

  // Create migration report
  const report: ServiceImageMigrationReport = {
    migratedAt: new Date().toISOString(),
    sourceValidationFile: VALIDATION_PATH,
    totalServiceImages: validServiceResults.length,
    totalServices: serviceGroups.size,
    successfulUploads: successful.length,
    failedUploads: failed.length,
    skippedImages: validServiceResults.length - uploads.length,
    totalOriginalSize: stats.totalOriginalSize,
    totalCompressedSize: stats.totalCompressedSize,
    totalSizeSaved: stats.totalSizeSaved,
    averageCompressionRatio: stats.averageCompressionRatio,
    uploads: uploads.map(upload => {
      const extended = upload as UploadResult & {
        oldServiceId?: string;
        newServiceId?: string;
        stylistId?: string;
        imageId?: string;
        isPreview?: boolean;
      };
      return {
        oldServiceId: extended.oldServiceId || "unknown",
        newServiceId: extended.newServiceId || "unknown",
        stylistId: extended.stylistId || "unknown",
        imageId: extended.imageId || "unknown",
        originalPath: upload.originalPath,
        filename: upload.filename,
        storagePath: upload.storagePath,
        originalSize: upload.compressionStats.originalSize,
        compressedSize: upload.compressionStats.compressedSize,
        compressionRatio: upload.compressionStats.compressionRatio,
        uploadTime: upload.uploadTime,
        isPreview: extended.isPreview || false,
        success: upload.success,
        error: upload.error,
      };
    }),
    servicesSummary,
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
  console.log("\n📋 Service Image Migration Summary:");
  console.log("=" .repeat(50));
  console.log(`Total Images Processed: ${validServiceResults.length.toLocaleString()}`);
  console.log(`Total Services: ${serviceGroups.size.toLocaleString()}`);
  console.log(`Successful Uploads: ${successful.length.toLocaleString()} (${stats.successRate.toFixed(1)}%)`);
  console.log(`Failed Uploads: ${failed.length.toLocaleString()}`);
  console.log(`Skipped Images: ${report.skippedImages.toLocaleString()}`);

  console.log("\n💾 Storage Efficiency:");
  console.log(`Original Size: ${formatBytes(stats.totalOriginalSize)}`);
  console.log(`Compressed Size: ${formatBytes(stats.totalCompressedSize)}`);
  console.log(`Space Saved: ${formatBytes(stats.totalSizeSaved)} (${((stats.totalSizeSaved / stats.totalOriginalSize) * 100).toFixed(1)}%)`);
  console.log(`Average Compression: ${stats.averageCompressionRatio.toFixed(1)}%`);

  console.log("\n📦 Service Summary:");
  const servicesWithPreview = servicesSummary.filter(s => s.hasPreviewImage).length;
  const servicesFullyMigrated = servicesSummary.filter(s => s.successfulImages === s.totalImages).length;
  console.log(`Services with Preview Image: ${servicesWithPreview}/${servicesSummary.length}`);
  console.log(`Services Fully Migrated: ${servicesFullyMigrated}/${servicesSummary.length}`);

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
    console.log("\n🟢 EXCELLENT - Service image migration highly successful!");
  } else if (stats.successRate >= 85) {
    console.log("\n🟡 GOOD - Service image migration mostly successful, review errors");
  } else {
    console.log("\n🔴 POOR - Service image migration had significant issues, investigate errors");
  }

  console.log(`\n📊 Compression Benefits:`);
  console.log(`  • Storage Cost Reduction: ${((stats.totalSizeSaved / stats.totalOriginalSize) * 100).toFixed(1)}%`);
  console.log(`  • Estimated Monthly Savings: $${((stats.totalSizeSaved / (1024 * 1024 * 1024)) * 0.02).toFixed(2)} (at $0.02/GB)`);
  console.log(`  • Load Time Improvement: ~${Math.round((stats.totalSizeSaved / stats.totalOriginalSize) * 100 * 0.4)}% faster`);

  console.log(`\n🎯 Preview Image Coverage: ${((servicesWithPreview / servicesSummary.length) * 100).toFixed(1)}%`);
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
  migrateServiceImages().catch((error) => {
    console.error("❌ Service image migration failed:", error);
    process.exit(1);
  });
}