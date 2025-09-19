#!/usr/bin/env bun

import fs from "fs/promises";
import path from "path";
import { detectFileType } from "./utils/file-type-detector";
import { uploadChatImage } from "./utils/storage-uploader";
import {
  calculateUploadStats,
  type UploadResult,
} from "./utils/storage-uploader";

interface ValidationResult {
  category: "profile" | "service" | "chat";
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
    chatImages: {
      total: number;
      valid: number;
      invalid: number;
      validSize: number;
      invalidSize: number;
    };
  };
}

interface ChatCreated {
  created_at: string;
  created_chats: Array<{
    id: string;
    customer_id: string;
    stylist_id: string;
  }>;
  created_messages: Array<{
    id: string;
    chat_id: string;
    sender_id: string;
  }>;
  metadata: {
    successful_chat_creations: number;
    successful_message_creations: number;
  };
}

interface ChatsExtracted {
  extracted_at: string;
  processedChats: Array<{
    id: string;
    customer_id: string;
    stylist_id: string;
  }>;
  processedMessages: Array<{
    id: string;
    chat_id: string;
    sender_id: string;
  }>;
  imageMessages: Array<{
    message: {
      id: string;
      chat_id: string;
      is_image: string;
    };
    chat_id: string;
  }>;
  imageMessageMapping: Record<string, {
    mysql_message_id: string;
    mysql_chat_id: string;
    processed_message_id: string;
    processed_chat_id: string;
  }>;
}

interface ChatImageMigrationReport {
  migratedAt: string;
  sourceValidationFile: string;
  totalChatImages: number;
  totalChats: number;
  totalMessages: number;
  successfulUploads: number;
  failedUploads: number;
  skippedImages: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSizeSaved: number;
  averageCompressionRatio: number;
  uploads: Array<{
    oldChatId: string;
    newChatId: string;
    messageId: string;
    imageId: string;
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
  chatsSummary: Array<{
    oldChatId: string;
    newChatId: string;
    totalImages: number;
    successfulImages: number;
    failedImages: number;
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
const CHATS_CREATED_PATH = path.join(TEMP_DIR, "chats-created.json");
const CHATS_EXTRACTED_PATH = path.join(TEMP_DIR, "chats-extracted.json");
const OUTPUT_PATH = path.join(TEMP_DIR, "chat-images-migrated.json");

async function loadJsonFile<T>(filePath: string, fileName: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error(`Failed to load ${fileName} from ${filePath}: ${error}`);
  }
}

async function migrateChatImages(): Promise<void> {
  console.log("🚀 Starting chat image migration...");

  // Load validation results, chat mappings, and image mappings
  console.log(
    "📄 Loading validation results, chat mappings, and image mappings...",
  );
  const [validationReport, chatsCreated, chatsExtracted] = await Promise.all([
    loadJsonFile<MappingValidationReport>(
      VALIDATION_PATH,
      "mapping validation results",
    ),
    loadJsonFile<ChatCreated>(CHATS_CREATED_PATH, "chats created"),
    loadJsonFile<ChatsExtracted>(CHATS_EXTRACTED_PATH, "chats extracted"),
  ]);

  // Create chat mapping lookup
  const chatMapping: Record<string, string> = {};
  for (const chat of chatsCreated.created_chats) {
    // The chat ID should be the same in old and new system (lowercased)
    chatMapping[chat.id] = chat.id;
  }

  // Create message mapping for images using imageMessageMapping from Phase 6
  const messageMapping: Record<string, { messageId: string; chatId: string }> =
    {};
  for (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, mapping] of Object.entries(chatsExtracted.imageMessageMapping)
  ) {
    // Map using the processed message ID and chat ID
    messageMapping[mapping.processed_message_id] = {
      messageId: mapping.processed_message_id,
      chatId: mapping.processed_chat_id,
    };
    // Also map using MySQL message ID as key for lookups
    messageMapping[mapping.mysql_message_id] = {
      messageId: mapping.processed_message_id,
      chatId: mapping.processed_chat_id,
    };
  }

  console.log(
    `✅ Loaded ${
      Object.keys(chatsExtracted.imageMessageMapping).length
    } image message mappings`,
  );

  // Filter for valid chat images only
  const validChatResults = validationReport.results.filter(
    (r) => r.category === "chat" && r.isValid,
  );

  if (validChatResults.length === 0) {
    console.log("⚠️  No valid chat images found to migrate");
    return;
  }

  console.log(
    `✅ Found ${validChatResults.length} valid chat images to migrate`,
  );
  console.log(
    `📊 Total size: ${
      formatBytes(validChatResults.reduce((sum, r) => sum + r.fileSize, 0))
    }`,
  );

  // Group by chat to organize processing
  const chatGroups = new Map<string, ValidationResult[]>();
  for (const result of validChatResults) {
    // Extract chat ID from path: Chat-Images/{chatId}/{filename}
    const pathSegments = result.originalPath.split(path.sep);
    const chatIdFromPath = pathSegments[pathSegments.length - 2]; // Second to last segment

    if (!chatGroups.has(chatIdFromPath)) {
      chatGroups.set(chatIdFromPath, []);
    }
    chatGroups.get(chatIdFromPath)!.push(result);
  }

  console.log(`📦 Processing ${chatGroups.size} chats with images`);

  // Process each chat
  const uploads: UploadResult[] = [];
  const errors: string[] = [];
  const chatsSummary: ChatImageMigrationReport["chatsSummary"] = [];
  let processedImages = 0;
  let processedChats = 0;

  console.log("\n🔄 Processing chat images...");

  for (const [oldChatId, chatResults] of chatGroups) {
    try {
      processedChats++;
      const chatProgress = `[Chat ${processedChats}/${chatGroups.size}]`;

      const newChatId = chatMapping[oldChatId.toLowerCase()];
      if (!newChatId) {
        console.log(
          `${chatProgress} ⚠️  Skipping chat ${oldChatId} - no mapping found`,
        );
        errors.push(`No chat mapping found for ${oldChatId}`);
        continue;
      }

      console.log(
        `${chatProgress} Processing chat ${oldChatId} (${chatResults.length} images)...`,
      );

      let chatUploads = 0;
      let chatFailed = 0;

      // Sort images for consistent processing
      const sortedResults = chatResults.sort((a, b) =>
        a.originalPath.localeCompare(b.originalPath)
      );

      for (const result of sortedResults) {
        processedImages++;
        const imageProgress = `[${processedImages}/${validChatResults.length}]`;

        try {
          console.log(
            `${imageProgress} Processing image ${
              path.basename(result.originalPath)
            }...`,
          );

          // Extract image ID from filename (without extension)
          const pathSegments = result.originalPath.split(path.sep);
          const filename = pathSegments[pathSegments.length - 1];
          const imageId = filename.split(".")[0]; // Remove extension

          // For chat images, we need to find the corresponding message using Phase 6 mapping
          // First try using the image ID directly
          let messageId = imageId;
          let messageInfo = messageMapping[imageId];

          // If not found, try using the image ID as MySQL message ID
          if (!messageInfo) {
            messageInfo = messageMapping[imageId.toLowerCase()];
          }

          if (
            messageInfo &&
            messageInfo.chatId.toLowerCase() === newChatId.toLowerCase()
          ) {
            messageId = messageInfo.messageId;
            console.log(
              `${imageProgress} Found message mapping: image ${imageId} -> message ${messageId}`,
            );
          } else {
            // Fallback: use image ID as message ID and warn
            console.log(
              `${imageProgress} ⚠️  No message mapping found for image ${imageId}, using as message ID`,
            );
            console.log(
              `${imageProgress} Available mappings for chat ${newChatId}:`,
              Object.entries(messageMapping)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .filter(([_, info]) =>
                  info.chatId.toLowerCase() === newChatId.toLowerCase()
                )
                .map(([key, info]) => `${key} -> ${info.messageId}`)
                .slice(0, 3),
            );
          }

          // Detect file type
          const fileInfo = await detectFileType(result.originalPath);

          if (!fileInfo.isSupported) {
            console.log(
              `${imageProgress} ⚠️  Skipping unsupported file type: ${fileInfo.mimeType}`,
            );
            errors.push(
              `Unsupported file type for ${result.originalPath}: ${fileInfo.mimeType}`,
            );
            chatFailed++;
            continue;
          }

          // Upload with compression
          const uploadResult = await uploadChatImage({
            oldChatId,
            newChatId,
            messageId,
            imageId,
            filePath: result.originalPath,
            fileInfo,
          });

          // Add chat context to upload result
          const extendedUpload: UploadResult & {
            oldChatId: string;
            newChatId: string;
            messageId: string;
            imageId: string;
          } = {
            ...uploadResult,
            oldChatId,
            newChatId,
            messageId,
            imageId,
          };

          uploads.push(extendedUpload);

          if (uploadResult.success) {
            chatUploads++;
            const compressionSavings =
              uploadResult.compressionStats.originalSize -
              uploadResult.compressionStats.compressedSize;
            console.log(
              `${imageProgress} ✅ Uploaded ${uploadResult.filename} ` +
                `(${formatBytes(compressionSavings)} saved, ${
                  uploadResult.compressionStats.compressionRatio.toFixed(1)
                }% compression)`,
            );
          } else {
            chatFailed++;
            console.log(
              `${imageProgress} ❌ Failed to upload: ${uploadResult.error}`,
            );
            errors.push(
              `Upload failed for ${result.originalPath}: ${uploadResult.error}`,
            );
          }
        } catch (error) {
          chatFailed++;
          const errorMessage = error instanceof Error
            ? error.message
            : String(error);
          console.log(
            `${imageProgress} ❌ Error processing image: ${errorMessage}`,
          );
          errors.push(
            `Processing error for ${result.originalPath}: ${errorMessage}`,
          );
        }
      }

      // Add chat summary
      chatsSummary.push({
        oldChatId,
        newChatId,
        totalImages: chatResults.length,
        successfulImages: chatUploads,
        failedImages: chatFailed,
      });

      console.log(
        `${chatProgress} ✅ Chat completed: ${chatUploads}/${chatResults.length} images uploaded`,
      );

      // Brief pause between chats to avoid overwhelming the system
      if (processedChats % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.log(`❌ Error processing chat ${oldChatId}: ${errorMessage}`);
      errors.push(`Chat processing error for ${oldChatId}: ${errorMessage}`);
    }
  }

  // Calculate statistics
  const stats = calculateUploadStats(uploads);
  const successful = uploads.filter((u) => u.success);
  const failed = uploads.filter((u) => !u.success);

  // Create migration report
  const report: ChatImageMigrationReport = {
    migratedAt: new Date().toISOString(),
    sourceValidationFile: VALIDATION_PATH,
    totalChatImages: validChatResults.length,
    totalChats: chatGroups.size,
    totalMessages: chatsCreated.created_messages.length,
    successfulUploads: successful.length,
    failedUploads: failed.length,
    skippedImages: validChatResults.length - uploads.length,
    totalOriginalSize: stats.totalOriginalSize,
    totalCompressedSize: stats.totalCompressedSize,
    totalSizeSaved: stats.totalSizeSaved,
    averageCompressionRatio: stats.averageCompressionRatio,
    uploads: uploads.map((upload) => {
      const extended = upload as UploadResult & {
        oldChatId?: string;
        newChatId?: string;
        messageId?: string;
        imageId?: string;
      };
      return {
        oldChatId: extended.oldChatId || "unknown",
        newChatId: extended.newChatId || "unknown",
        messageId: extended.messageId || "unknown",
        imageId: extended.imageId || "unknown",
        originalPath: upload.originalPath,
        filename: upload.filename,
        storagePath: upload.storagePath,
        originalSize: upload.compressionStats.originalSize,
        compressedSize: upload.compressionStats.compressedSize,
        compressionRatio: upload.compressionStats.compressionRatio,
        uploadTime: upload.uploadTime,
        success: upload.success,
        error: upload.error,
      };
    }),
    chatsSummary,
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
  console.log("\n📋 Chat Image Migration Summary:");
  console.log("=".repeat(50));
  console.log(
    `Total Images Processed: ${validChatResults.length.toLocaleString()}`,
  );
  console.log(`Total Chats: ${chatGroups.size.toLocaleString()}`);
  console.log(
    `Successful Uploads: ${successful.length.toLocaleString()} (${
      stats.successRate.toFixed(1)
    }%)`,
  );
  console.log(`Failed Uploads: ${failed.length.toLocaleString()}`);
  console.log(`Skipped Images: ${report.skippedImages.toLocaleString()}`);

  console.log("\n💾 Storage Efficiency:");
  console.log(`Original Size: ${formatBytes(stats.totalOriginalSize)}`);
  console.log(`Compressed Size: ${formatBytes(stats.totalCompressedSize)}`);
  console.log(
    `Space Saved: ${formatBytes(stats.totalSizeSaved)} (${
      ((stats.totalSizeSaved / stats.totalOriginalSize) * 100).toFixed(1)
    }%)`,
  );
  console.log(
    `Average Compression: ${stats.averageCompressionRatio.toFixed(1)}%`,
  );

  console.log("\n📦 Chat Summary:");
  const chatsFullyMigrated =
    chatsSummary.filter((c) => c.successfulImages === c.totalImages).length;
  console.log(
    `Chats Fully Migrated: ${chatsFullyMigrated}/${chatsSummary.length}`,
  );

  console.log("\n⚡ Performance:");
  console.log(
    `Total Upload Time: ${(stats.totalUploadTime / 1000).toFixed(1)}s`,
  );
  console.log(
    `Total Compression Time: ${
      (stats.totalCompressionTime / 1000).toFixed(1)
    }s`,
  );
  console.log(
    `Average Time per Image: ${(stats.averageUploadTime / 1000).toFixed(2)}s`,
  );

  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`);
    errors.slice(0, 10).forEach((error) => console.log(`  - ${error}`));
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more errors`);
    }
  }

  console.log(`\n✅ Migration report saved to: ${OUTPUT_PATH}`);

  // Migration success assessment
  if (stats.successRate >= 95) {
    console.log("\n🟢 EXCELLENT - Chat image migration highly successful!");
  } else if (stats.successRate >= 85) {
    console.log(
      "\n🟡 GOOD - Chat image migration mostly successful, review errors",
    );
  } else {
    console.log(
      "\n🔴 POOR - Chat image migration had significant issues, investigate errors",
    );
  }

  console.log(`\n📊 Compression Benefits:`);
  console.log(
    `  • Storage Cost Reduction: ${
      ((stats.totalSizeSaved / stats.totalOriginalSize) * 100).toFixed(1)
    }%`,
  );
  console.log(
    `  • Estimated Monthly Savings: $${
      ((stats.totalSizeSaved / (1024 * 1024 * 1024)) * 0.02).toFixed(2)
    } (at $0.02/GB)`,
  );
  console.log(
    `  • Load Time Improvement: ~${
      Math.round((stats.totalSizeSaved / stats.totalOriginalSize) * 100 * 0.4)
    }% faster`,
  );
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
  migrateChatImages().catch((error) => {
    console.error("❌ Chat image migration failed:", error);
    process.exit(1);
  });
}
