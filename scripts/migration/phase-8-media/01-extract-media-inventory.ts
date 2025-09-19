#!/usr/bin/env bun

import fs from "fs/promises";
import path from "path";
import { detectFileType, type FileTypeInfo } from "./utils/file-type-detector";

interface MediaInventoryItem {
  originalPath: string;
  relativePath: string;
  fileSize: number;
  fileType: FileTypeInfo;
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
  summary: {
    profilePics: {
      total: number;
      migratable: number;
      size: number;
      migratableSize: number;
    };
    serviceImages: {
      total: number;
      migratable: number;
      size: number;
      migratableSize: number;
    };
    chatImages: {
      total: number;
      migratable: number;
      size: number;
      migratableSize: number;
    };
  };
}

const S3_BACKUP_PATH = process.env.S3_BACKUP_PATH ||
  "/Users/magnusrodseth/dev/personal/nabostylisten/nabostylisten-prod-backup";
const OUTPUT_PATH = path.join(__dirname, "../temp/media-inventory.json");

async function scanDirectory(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        const subFiles = await scanDirectory(fullPath);
        files.push(...subFiles);
      } else if (item.isFile()) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Failed to scan directory ${dirPath}:`, error);
  }

  return files;
}

async function analyzeFile(
  filePath: string,
  backupPath: string,
): Promise<MediaInventoryItem> {
  const relativePath = path.relative(backupPath, filePath);
  const pathSegments = relativePath.split(path.sep);

  // Get file stats
  const stats = await fs.stat(filePath);
  const fileSize = stats.size;

  // Detect file type
  const fileType = await detectFileType(filePath);

  // Parse path to extract metadata
  const category = pathSegments[0]?.toLowerCase().includes("profile")
    ? "profile"
    : pathSegments[0]?.toLowerCase().includes("service")
    ? "service"
    : pathSegments[0]?.toLowerCase().includes("chat")
    ? "chat"
    : "unknown";

  let userId: string | undefined;
  let serviceId: string | undefined;
  let chatId: string | undefined;
  let imageId: string | undefined;
  let role: "buyer" | "stylist" | "salon" | undefined;
  let canMigrate = false;
  let skipReason: string | undefined;

  if (category === "profile") {
    // Profile-Pics/{role}/{userId}
    if (pathSegments.length >= 3) {
      role = pathSegments[1] as "buyer" | "stylist" | "salon";
      userId = pathSegments[2];

      // Skip salon profiles (salon model was removed)
      if (role === "salon") {
        skipReason = "Salon profiles not migrated (salon model removed)";
      } else {
        canMigrate = fileType.isSupported;
        if (!fileType.isSupported) {
          skipReason = `Unsupported file type: ${fileType.mimeType}`;
        }
      }
    } else {
      skipReason = "Invalid profile path structure";
    }
  } else if (category === "service") {
    // Service-Images/{serviceId}/{imageId}
    if (pathSegments.length >= 3) {
      serviceId = pathSegments[1];
      imageId = pathSegments[2];

      canMigrate = fileType.isSupported;
      if (!fileType.isSupported) {
        skipReason = `Unsupported file type: ${fileType.mimeType}`;
      }
      // Note: We'll validate if the service was actually migrated in the next script
    } else {
      skipReason = "Invalid service path structure";
    }
  } else if (category === "chat") {
    // Chat-Images/{chatId}/{filename}
    if (pathSegments.length >= 3) {
      chatId = pathSegments[1];
      imageId = pathSegments[2];

      canMigrate = fileType.isSupported;
      if (!fileType.isSupported) {
        skipReason = `Unsupported file type: ${fileType.mimeType}`;
      }
      // Note: We'll validate if the chat was actually migrated in the next script
    } else {
      skipReason = "Invalid chat path structure";
    }
  } else {
    skipReason = "Unknown file category";
  }

  return {
    originalPath: filePath,
    relativePath,
    fileSize,
    fileType,
    category: category as "profile" | "service" | "chat",
    userId,
    serviceId,
    chatId,
    imageId,
    role,
    canMigrate,
    skipReason,
  };
}

async function extractMediaInventory(): Promise<void> {
  console.log("🔍 Starting media inventory extraction...");
  console.log(`📁 Scanning backup directory: ${S3_BACKUP_PATH}`);

  // Verify backup directory exists
  try {
    await fs.access(S3_BACKUP_PATH);
  } catch (error) {
    console.error(`Error accessing backup directory: ${error}`);
    throw new Error(`S3 backup directory not found: ${S3_BACKUP_PATH}`);
  }

  // Create temp directory if it doesn't exist
  const tempDir = path.dirname(OUTPUT_PATH);
  await fs.mkdir(tempDir, { recursive: true });

  // Scan all files in backup directory
  console.log("📊 Scanning files...");
  const allFiles = await scanDirectory(S3_BACKUP_PATH);
  console.log(`Found ${allFiles.length} total files`);

  // Analyze each file
  console.log("🔬 Analyzing files...");
  const items: MediaInventoryItem[] = [];
  let processed = 0;

  for (const filePath of allFiles) {
    try {
      const item = await analyzeFile(filePath, S3_BACKUP_PATH);
      items.push(item);
      processed++;

      if (processed % 100 === 0) {
        console.log(`Processed ${processed}/${allFiles.length} files...`);
      }
    } catch (error) {
      console.warn(`Failed to analyze file ${filePath}:`, error);
    }
  }

  console.log(`✅ Analyzed ${processed} files`);

  // Calculate statistics
  const totalFiles = items.length;
  const totalSize = items.reduce((sum, item) => sum + item.fileSize, 0);
  const migratableItems = items.filter((item) => item.canMigrate);
  const migratableFiles = migratableItems.length;
  const migratableSize = migratableItems.reduce(
    (sum, item) => sum + item.fileSize,
    0,
  );

  // Category breakdown
  const profileItems = items.filter((item) => item.category === "profile");
  const serviceItems = items.filter((item) => item.category === "service");
  const chatItems = items.filter((item) => item.category === "chat");

  const migratableProfileItems = profileItems.filter((item) => item.canMigrate);
  const migratableServiceItems = serviceItems.filter((item) => item.canMigrate);
  const migratableChatItems = chatItems.filter((item) => item.canMigrate);

  const summary = {
    profilePics: {
      total: profileItems.length,
      migratable: migratableProfileItems.length,
      size: profileItems.reduce((sum, item) => sum + item.fileSize, 0),
      migratableSize: migratableProfileItems.reduce(
        (sum, item) => sum + item.fileSize,
        0,
      ),
    },
    serviceImages: {
      total: serviceItems.length,
      migratable: migratableServiceItems.length,
      size: serviceItems.reduce((sum, item) => sum + item.fileSize, 0),
      migratableSize: migratableServiceItems.reduce(
        (sum, item) => sum + item.fileSize,
        0,
      ),
    },
    chatImages: {
      total: chatItems.length,
      migratable: migratableChatItems.length,
      size: chatItems.reduce((sum, item) => sum + item.fileSize, 0),
      migratableSize: migratableChatItems.reduce(
        (sum, item) => sum + item.fileSize,
        0,
      ),
    },
  };

  // Create inventory object
  const inventory: MediaInventory = {
    scannedAt: new Date().toISOString(),
    backupPath: S3_BACKUP_PATH,
    totalFiles,
    totalSize,
    migratableFiles,
    migratableSize,
    items,
    summary,
  };

  // Save inventory to file
  console.log("💾 Saving inventory...");
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(inventory, null, 2));

  // Print summary
  console.log("\n📋 Media Inventory Summary:");
  console.log("=".repeat(50));
  console.log(`Total Files: ${totalFiles.toLocaleString()}`);
  console.log(`Total Size: ${formatBytes(totalSize)}`);
  console.log(
    `Migratable Files: ${migratableFiles.toLocaleString()} (${
      ((migratableFiles / totalFiles) * 100).toFixed(1)
    }%)`,
  );
  console.log(
    `Migratable Size: ${formatBytes(migratableSize)} (${
      ((migratableSize / totalSize) * 100).toFixed(1)
    }%)`,
  );

  console.log("\n📂 Category Breakdown:");
  console.log(
    `Profile Pictures: ${summary.profilePics.total.toLocaleString()} files (${
      formatBytes(summary.profilePics.size)
    })`,
  );
  console.log(
    `  └─ Migratable: ${summary.profilePics.migratable.toLocaleString()} files (${
      formatBytes(summary.profilePics.migratableSize)
    })`,
  );
  console.log(
    `Service Images: ${summary.serviceImages.total.toLocaleString()} files (${
      formatBytes(summary.serviceImages.size)
    })`,
  );
  console.log(
    `  └─ Migratable: ${summary.serviceImages.migratable.toLocaleString()} files (${
      formatBytes(summary.serviceImages.migratableSize)
    })`,
  );
  console.log(
    `Chat Images: ${summary.chatImages.total.toLocaleString()} files (${
      formatBytes(summary.chatImages.size)
    })`,
  );
  console.log(
    `  └─ Migratable: ${summary.chatImages.migratable.toLocaleString()} files (${
      formatBytes(summary.chatImages.migratableSize)
    })`,
  );

  console.log(`\n✅ Inventory saved to: ${OUTPUT_PATH}`);

  // Show top skip reasons
  const skipReasons = items
    .filter((item) => !item.canMigrate && item.skipReason)
    .reduce((acc, item) => {
      acc[item.skipReason!] = (acc[item.skipReason!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  if (Object.keys(skipReasons).length > 0) {
    console.log("\n❌ Skip Reasons:");
    Object.entries(skipReasons)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([reason, count]) => {
        console.log(`  ${reason}: ${count.toLocaleString()} files`);
      });
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
  extractMediaInventory().catch((error) => {
    console.error("❌ Media inventory extraction failed:", error);
    process.exit(1);
  });
}
