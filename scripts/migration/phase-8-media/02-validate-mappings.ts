#!/usr/bin/env bun

import fs from "fs/promises";
import path from "path";

interface MediaInventoryItem {
  originalPath: string;
  relativePath: string;
  fileSize: number;
  category: "profile" | "service" | "chat";
  userId?: string;
  serviceId?: string;
  chatId?: string;
  imageId?: string;
  role?: "buyer" | "stylist" | "salon";
  canMigrate: boolean;
  skipReason?: string;
}

interface MediaInventory {
  scannedAt: string;
  backupPath: string;
  totalFiles: number;
  totalSize: number;
  migratableFiles: number;
  migratableSize: number;
  items: MediaInventoryItem[];
}

interface UserMapping {
  [oldUserId: string]: string; // maps old UUID to new UUID
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
  inventoryFile: string;
  userMappingFile: string;
  servicesCreatedFile: string;
  totalValidated: number;
  validMappings: number;
  invalidMappings: number;
  results: ValidationResult[];
  summary: {
    profilePics: {
      total: number;
      valid: number;
      invalid: number;
      validSize: number;
      invalidSize: number;
    };
    serviceImages: {
      total: number;
      valid: number;
      invalid: number;
      validSize: number;
      invalidSize: number;
    };
  };
  errors: {
    missingUserMappings: string[];
    missingServiceMappings: string[];
    invalidFileStructures: string[];
  };
}

const TEMP_DIR = path.join(__dirname, "../temp");
const INVENTORY_PATH = path.join(TEMP_DIR, "media-inventory.json");
const USER_MAPPING_PATH = path.join(TEMP_DIR, "user-id-mapping.json");
const SERVICES_CREATED_PATH = path.join(TEMP_DIR, "services-created.json");
const OUTPUT_PATH = path.join(TEMP_DIR, "mapping-validation-results.json");

async function loadJsonFile<T>(filePath: string, fileName: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error(`Failed to load ${fileName} from ${filePath}: ${error}`);
  }
}

async function validateMappings(): Promise<void> {
  console.log("🔍 Starting mapping validation...");

  // Load required files
  console.log("📄 Loading inventory and mapping files...");

  const [inventory, userMapping, servicesCreated] = await Promise.all([
    loadJsonFile<MediaInventory>(INVENTORY_PATH, "media inventory"),
    loadJsonFile<UserMapping>(USER_MAPPING_PATH, "user ID mapping"),
    loadJsonFile<ServiceCreated>(SERVICES_CREATED_PATH, "services created"),
  ]);

  console.log(`✅ Loaded inventory with ${inventory.items.length} items`);
  console.log(`✅ Loaded ${Object.keys(userMapping).length} user mappings`);
  console.log(`✅ Loaded ${servicesCreated.services.length} service records`);

  // Create service mapping lookup
  const serviceMapping: Record<string, string> = {};
  const serviceStylistMapping: Record<string, string> = {};

  for (const service of servicesCreated.services) {
    if (service.success) {
      serviceMapping[service.old_service_id] = service.new_service_id;
      serviceStylistMapping[service.old_service_id] = service.stylist_id;
    }
  }

  console.log(`✅ Created service mapping with ${Object.keys(serviceMapping).length} valid services`);

  // Validate each migratable item
  console.log("🔬 Validating mappings...");
  const results: ValidationResult[] = [];
  const errors = {
    missingUserMappings: [] as string[],
    missingServiceMappings: [] as string[],
    invalidFileStructures: [] as string[],
  };

  // Filter for items that should be migratable (excluding chat images and salon profiles)
  const migratableItems = inventory.items.filter(item => {
    if (!item.canMigrate) return false;
    if (item.category === "chat") return false;
    if (item.category === "profile" && item.role === "salon") return false;
    return true;
  });

  console.log(`📊 Validating ${migratableItems.length} migratable items...`);

  for (const item of migratableItems) {
    if (item.category === "profile") {
      // Validate profile image
      if (!item.userId) {
        results.push({
          category: "profile",
          originalPath: item.originalPath,
          oldId: "unknown",
          isValid: false,
          errorMessage: "No user ID found in path",
          fileSize: item.fileSize,
        });
        errors.invalidFileStructures.push(item.originalPath);
        continue;
      }

      const newUserId = userMapping[item.userId];
      if (!newUserId) {
        results.push({
          category: "profile",
          originalPath: item.originalPath,
          oldId: item.userId,
          isValid: false,
          errorMessage: "User ID not found in mapping",
          fileSize: item.fileSize,
        });
        errors.missingUserMappings.push(item.userId);
        continue;
      }

      results.push({
        category: "profile",
        originalPath: item.originalPath,
        oldId: item.userId,
        newId: newUserId,
        isValid: true,
        fileSize: item.fileSize,
      });

    } else if (item.category === "service") {
      // Validate service image
      if (!item.serviceId) {
        results.push({
          category: "service",
          originalPath: item.originalPath,
          oldId: "unknown",
          isValid: false,
          errorMessage: "No service ID found in path",
          fileSize: item.fileSize,
        });
        errors.invalidFileStructures.push(item.originalPath);
        continue;
      }

      const newServiceId = serviceMapping[item.serviceId];
      const stylistId = serviceStylistMapping[item.serviceId];

      if (!newServiceId || !stylistId) {
        results.push({
          category: "service",
          originalPath: item.originalPath,
          oldId: item.serviceId,
          isValid: false,
          errorMessage: "Service ID not found in mapping or service not migrated",
          fileSize: item.fileSize,
        });
        errors.missingServiceMappings.push(item.serviceId);
        continue;
      }

      results.push({
        category: "service",
        originalPath: item.originalPath,
        oldId: item.serviceId,
        newId: newServiceId,
        isValid: true,
        fileSize: item.fileSize,
      });
    }
  }

  // Calculate statistics
  const validResults = results.filter(r => r.isValid);
  const invalidResults = results.filter(r => !r.isValid);

  const profileResults = results.filter(r => r.category === "profile");
  const serviceResults = results.filter(r => r.category === "service");

  const validProfileResults = profileResults.filter(r => r.isValid);
  const invalidProfileResults = profileResults.filter(r => !r.isValid);
  const validServiceResults = serviceResults.filter(r => r.isValid);
  const invalidServiceResults = serviceResults.filter(r => !r.isValid);

  const summary = {
    profilePics: {
      total: profileResults.length,
      valid: validProfileResults.length,
      invalid: invalidProfileResults.length,
      validSize: validProfileResults.reduce((sum, r) => sum + r.fileSize, 0),
      invalidSize: invalidProfileResults.reduce((sum, r) => sum + r.fileSize, 0),
    },
    serviceImages: {
      total: serviceResults.length,
      valid: validServiceResults.length,
      invalid: invalidServiceResults.length,
      validSize: validServiceResults.reduce((sum, r) => sum + r.fileSize, 0),
      invalidSize: invalidServiceResults.reduce((sum, r) => sum + r.fileSize, 0),
    },
  };

  // Create validation report
  const report: MappingValidationReport = {
    validatedAt: new Date().toISOString(),
    inventoryFile: INVENTORY_PATH,
    userMappingFile: USER_MAPPING_PATH,
    servicesCreatedFile: SERVICES_CREATED_PATH,
    totalValidated: results.length,
    validMappings: validResults.length,
    invalidMappings: invalidResults.length,
    results,
    summary,
    errors: {
      missingUserMappings: [...new Set(errors.missingUserMappings)],
      missingServiceMappings: [...new Set(errors.missingServiceMappings)],
      invalidFileStructures: [...new Set(errors.invalidFileStructures)],
    },
  };

  // Save validation report
  console.log("💾 Saving validation report...");
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2));

  // Print summary
  console.log("\n📋 Mapping Validation Summary:");
  console.log("=" .repeat(50));
  console.log(`Total Items Validated: ${results.length.toLocaleString()}`);
  console.log(`Valid Mappings: ${validResults.length.toLocaleString()} (${((validResults.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`Invalid Mappings: ${invalidResults.length.toLocaleString()} (${((invalidResults.length / results.length) * 100).toFixed(1)}%)`);

  console.log("\n📂 Category Breakdown:");
  console.log(`Profile Pictures:`);
  console.log(`  └─ Total: ${summary.profilePics.total.toLocaleString()} files (${formatBytes(summary.profilePics.validSize + summary.profilePics.invalidSize)})`);
  console.log(`  └─ Valid: ${summary.profilePics.valid.toLocaleString()} files (${formatBytes(summary.profilePics.validSize)})`);
  console.log(`  └─ Invalid: ${summary.profilePics.invalid.toLocaleString()} files (${formatBytes(summary.profilePics.invalidSize)})`);

  console.log(`Service Images:`);
  console.log(`  └─ Total: ${summary.serviceImages.total.toLocaleString()} files (${formatBytes(summary.serviceImages.validSize + summary.serviceImages.invalidSize)})`);
  console.log(`  └─ Valid: ${summary.serviceImages.valid.toLocaleString()} files (${formatBytes(summary.serviceImages.validSize)})`);
  console.log(`  └─ Invalid: ${summary.serviceImages.invalid.toLocaleString()} files (${formatBytes(summary.serviceImages.invalidSize)})`);

  if (report.errors.missingUserMappings.length > 0) {
    console.log(`\n❌ Missing User Mappings: ${report.errors.missingUserMappings.length.toLocaleString()}`);
    if (report.errors.missingUserMappings.length <= 10) {
      report.errors.missingUserMappings.forEach(id => console.log(`  - ${id}`));
    } else {
      report.errors.missingUserMappings.slice(0, 10).forEach(id => console.log(`  - ${id}`));
      console.log(`  ... and ${report.errors.missingUserMappings.length - 10} more`);
    }
  }

  if (report.errors.missingServiceMappings.length > 0) {
    console.log(`\n❌ Missing Service Mappings: ${report.errors.missingServiceMappings.length.toLocaleString()}`);
    if (report.errors.missingServiceMappings.length <= 10) {
      report.errors.missingServiceMappings.forEach(id => console.log(`  - ${id}`));
    } else {
      report.errors.missingServiceMappings.slice(0, 10).forEach(id => console.log(`  - ${id}`));
      console.log(`  ... and ${report.errors.missingServiceMappings.length - 10} more`);
    }
  }

  if (report.errors.invalidFileStructures.length > 0) {
    console.log(`\n❌ Invalid File Structures: ${report.errors.invalidFileStructures.length.toLocaleString()}`);
  }

  console.log(`\n✅ Validation report saved to: ${OUTPUT_PATH}`);

  // Final migration readiness assessment
  const readinessScore = (validResults.length / results.length) * 100;
  console.log("\n🎯 Migration Readiness Assessment:");
  if (readinessScore >= 95) {
    console.log("🟢 READY - Excellent mapping coverage, proceed with migration");
  } else if (readinessScore >= 85) {
    console.log("🟡 CAUTION - Good mapping coverage, review invalid mappings");
  } else {
    console.log("🔴 NOT READY - Poor mapping coverage, investigate mapping issues");
  }
  console.log(`   Readiness Score: ${readinessScore.toFixed(1)}%`);

  if (invalidResults.length > 0) {
    console.log("\n⚠️  Note: Invalid mappings will be skipped during migration");
    console.log("   Review the validation report for details on missing mappings");
  }
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
  validateMappings().catch((error) => {
    console.error("❌ Mapping validation failed:", error);
    process.exit(1);
  });
}