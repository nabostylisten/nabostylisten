#!/usr/bin/env bun

import fs from "fs/promises";
import path from "path";
import {
  calculateMediaRecordStats,
  createChatMediaRecord,
  createProfileMediaRecord,
  createServiceMediaRecord,
  formatMediaRecordReport,
  type MediaRecordResult,
} from "./utils/media-record-creator";

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

interface ChatUpload {
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
}

interface Phase6CreationResult {
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
    total_chats_to_create: number;
    total_messages_to_create: number;
    successful_chat_creations: number;
    successful_message_creations: number;
    failed_chat_creations: number;
    failed_message_creations: number;
    duration_ms: number;
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

interface ChatImageMigrationReport {
  migratedAt: string;
  successfulUploads: number;
  failedUploads: number;
  uploads: ChatUpload[];
}

interface MediaRecordCreationReport {
  createdAt: string;
  sourceFiles: {
    profileImagesReport: string;
    serviceImagesReport: string;
    chatImagesReport: string;
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
  chatRecords: {
    total: number;
    successful: number;
    failed: number;
  };
  records: Array<{
    mediaType: "profile" | "service" | "chat";
    mediaId?: string;
    storagePath: string;
    userId: string;
    serviceId?: string;
    messageId?: string;
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
const CHAT_REPORT_PATH = path.join(TEMP_DIR, "chat-images-migrated.json");
const PHASE6_CHAT_PATH = path.join(TEMP_DIR, "chats-created.json"); // Phase 6 output
const CHATS_EXTRACTED_PATH = path.join(TEMP_DIR, "chats-extracted.json"); // Phase 6 extraction output
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
  const [profileReport, serviceReport, chatReport, phase6ChatData, chatsExtracted] =
    await Promise.all([
      loadJsonFile<ProfileImageMigrationReport>(
        PROFILE_REPORT_PATH,
        "profile images migration report",
      ),
      loadJsonFile<ServiceImageMigrationReport>(
        SERVICE_REPORT_PATH,
        "service images migration report",
      ),
      loadJsonFile<ChatImageMigrationReport>(
        CHAT_REPORT_PATH,
        "chat images migration report",
      ).catch(() => {
        console.log(
          "⚠️  Chat images report not found, skipping chat records creation",
        );
        return null;
      }),
      loadJsonFile<Phase6CreationResult>(
        PHASE6_CHAT_PATH,
        "Phase 6 chat creation report",
      ).catch(() => {
        console.log(
          "⚠️  Phase 6 chat creation report not found",
        );
        return null;
      }),
      loadJsonFile<ChatsExtracted>(
        CHATS_EXTRACTED_PATH,
        "chats extracted data",
      ).catch(() => {
        console.log(
          "⚠️  Phase 6 extraction data not found, skipping chat image mapping",
        );
        return null;
      }),
    ]);

  // Filter for successful uploads only
  const successfulProfileUploads = profileReport.uploads.filter((u) =>
    u.success
  );
  const successfulServiceUploads = serviceReport.uploads.filter((u) =>
    u.success
  );
  const successfulChatUploads = chatReport?.uploads.filter((u) => u.success) ||
    [];

  // Get Phase 6 chat messages with images
  const phase6ChatMessages =
    phase6ChatData?.created_messages.filter((m) => m.has_image === true) || [];

  console.log(
    `✅ Found ${successfulProfileUploads.length} successful profile image uploads`,
  );
  console.log(
    `✅ Found ${successfulServiceUploads.length} successful service image uploads`,
  );
  console.log(
    `✅ Found ${successfulChatUploads.length} successful legacy chat image uploads`,
  );
  console.log(
    `✅ Found ${phase6ChatMessages.length} Phase 6 chat messages with images`,
  );

  if (
    successfulProfileUploads.length === 0 &&
    successfulServiceUploads.length === 0 &&
    successfulChatUploads.length === 0 &&
    phase6ChatMessages.length === 0
  ) {
    console.log(
      "⚠️  No successful uploads or chat messages found to create records for",
    );
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
      const progress = `[${processed}/${
        successfulProfileUploads.length + successfulServiceUploads.length +
        successfulChatUploads.length
      }]`;

      console.log(
        `${progress} Creating record for profile ${upload.newUserId}...`,
      );

      const result = await createProfileMediaRecord({
        userId: upload.newUserId,
        storagePath: upload.storagePath,
      });

      allRecords.push(result);

      if (result.success) {
        console.log(`${progress} ✅ Created media record ${result.mediaId}`);
      } else {
        console.log(`${progress} ❌ Failed to create record: ${result.error}`);
        errors.push(
          `Profile record creation failed for ${upload.storagePath}: ${result.error}`,
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.log(
        `❌ Error creating profile record for ${upload.storagePath}: ${errorMessage}`,
      );
      errors.push(
        `Profile record error for ${upload.storagePath}: ${errorMessage}`,
      );

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
      const progress = `[${processed}/${
        successfulProfileUploads.length + successfulServiceUploads.length +
        successfulChatUploads.length
      }]`;

      console.log(
        `${progress} Creating record for service ${upload.newServiceId} (${
          upload.isPreview ? "PREVIEW" : "IMAGE"
        })...`,
      );

      const result = await createServiceMediaRecord({
        userId: upload.stylistId,
        serviceId: upload.newServiceId,
        storagePath: upload.storagePath,
        isPreview: upload.isPreview,
      });

      allRecords.push(result);

      if (result.success) {
        console.log(
          `${progress} ✅ Created media record ${result.mediaId} ${
            upload.isPreview ? "(PREVIEW)" : ""
          }`,
        );
      } else {
        console.log(`${progress} ❌ Failed to create record: ${result.error}`);
        errors.push(
          `Service record creation failed for ${upload.storagePath}: ${result.error}`,
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.log(
        `❌ Error creating service record for ${upload.storagePath}: ${errorMessage}`,
      );
      errors.push(
        `Service record error for ${upload.storagePath}: ${errorMessage}`,
      );

      allRecords.push({
        success: false,
        storagePath: upload.storagePath,
        mediaType: "service_image",
        error: errorMessage,
      });
    }
  }

  console.log("\n🔄 Creating chat image records...");

  // Create chat image records
  for (const upload of successfulChatUploads) {
    try {
      processed++;
      const progress = `[${processed}/${
        successfulProfileUploads.length + successfulServiceUploads.length +
        successfulChatUploads.length
      }]`;

      console.log(
        `${progress} Creating record for chat message ${upload.messageId}...`,
      );

      // Find the sender ID from the chat messages with uploads
      const messageWithUpload = chatMessagesWithUploads.find(
        m => m.messageId === upload.messageId
      );

      if (!messageWithUpload) {
        console.log(`${progress} ⚠️  No sender info found for message ${upload.messageId}, skipping...`);
        errors.push(`No sender info found for chat message ${upload.messageId}`);
        continue;
      }

      const result = await createChatMediaRecord({
        userId: messageWithUpload.senderId,
        messageId: upload.messageId,
        storagePath: upload.storagePath,
      });

      allRecords.push(result);

      if (result.success) {
        console.log(`${progress} ✅ Created media record ${result.mediaId}`);
      } else {
        console.log(`${progress} ❌ Failed to create record: ${result.error}`);
        errors.push(
          `Chat record creation failed for ${upload.storagePath}: ${result.error}`,
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.log(
        `❌ Error creating chat record for ${upload.storagePath}: ${errorMessage}`,
      );
      errors.push(
        `Chat record error for ${upload.storagePath}: ${errorMessage}`,
      );

      allRecords.push({
        success: false,
        storagePath: upload.storagePath,
        mediaType: "chat_image",
        error: errorMessage,
      });
    }
  }

  // Note: Chat image records are created above for uploaded images only
  // No need for separate Phase 6 processing since we create records for uploaded images

  // Calculate statistics
  const stats = calculateMediaRecordStats(allRecords);
  const profileRecords = allRecords.filter((r) => r.mediaType === "avatar");
  const serviceRecords = allRecords.filter((r) =>
    r.mediaType === "service_image"
  );
  const chatRecords = allRecords.filter((r) => r.mediaType === "chat_image");

  const successfulProfileRecords = profileRecords.filter((r) => r.success);
  const failedProfileRecords = profileRecords.filter((r) => !r.success);
  const successfulServiceRecords = serviceRecords.filter((r) => r.success);
  const failedServiceRecords = serviceRecords.filter((r) => !r.success);
  const successfulChatRecords = chatRecords.filter((r) => r.success);
  const failedChatRecords = chatRecords.filter((r) => !r.success);

  // Count preview images
  const serviceUploadsWithPreview = successfulServiceUploads.filter((u) =>
    u.isPreview
  );

  // Create comprehensive report
  const report: MediaRecordCreationReport = {
    createdAt: new Date().toISOString(),
    sourceFiles: {
      profileImagesReport: PROFILE_REPORT_PATH,
      serviceImagesReport: SERVICE_REPORT_PATH,
      chatImagesReport: CHAT_REPORT_PATH,
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
    chatRecords: {
      total: chatRecords.length,
      successful: successfulChatRecords.length,
      failed: failedChatRecords.length,
    },
    records: allRecords.map((record) => {
      // Find corresponding upload for additional context
      const profileUpload = successfulProfileUploads.find((u) =>
        u.storagePath === record.storagePath
      );
      const serviceUpload = successfulServiceUploads.find((u) =>
        u.storagePath === record.storagePath
      );
      const chatUpload = successfulChatUploads.find((u) =>
        u.storagePath === record.storagePath
      );
      const chatMessageWithUpload = chatMessagesWithUploads.find((m: { storagePath: string }) =>
        m.storagePath === record.storagePath
      );

      return {
        mediaType: record.mediaType === "avatar"
          ? "profile" as const
          : record.mediaType === "service_image"
          ? "service" as const
          : "chat" as const,
        mediaId: record.mediaId,
        storagePath: record.storagePath,
        userId: profileUpload?.newUserId || serviceUpload?.stylistId ||
          chatMessageWithUpload?.senderId || "unknown",
        serviceId: serviceUpload?.newServiceId,
        messageId: chatUpload?.messageId || chatMessageWithUpload?.messageId,
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
  console.log("=".repeat(50));
  console.log(`Total Records: ${stats.totalRecords.toLocaleString()}`);
  console.log(
    `Successful: ${stats.successfulRecords.toLocaleString()} (${
      stats.successRate.toFixed(1)
    }%)`,
  );
  console.log(`Failed: ${stats.failedRecords.toLocaleString()}`);

  console.log("\n📂 Record Type Breakdown:");
  console.log(`Profile Images (avatars):`);
  console.log(`  └─ Total: ${report.profileRecords.total.toLocaleString()}`);
  console.log(
    `  └─ Successful: ${report.profileRecords.successful.toLocaleString()}`,
  );
  console.log(`  └─ Failed: ${report.profileRecords.failed.toLocaleString()}`);

  console.log(`Service Images:`);
  console.log(`  └─ Total: ${report.serviceRecords.total.toLocaleString()}`);
  console.log(
    `  └─ Successful: ${report.serviceRecords.successful.toLocaleString()}`,
  );
  console.log(`  └─ Failed: ${report.serviceRecords.failed.toLocaleString()}`);
  console.log(
    `  └─ Preview Images: ${report.serviceRecords.withPreview.toLocaleString()}`,
  );

  console.log(`Chat Images:`);
  console.log(`  └─ Total: ${report.chatRecords.total.toLocaleString()}`);
  console.log(
    `  └─ Successful: ${report.chatRecords.successful.toLocaleString()}`,
  );
  console.log(`  └─ Failed: ${report.chatRecords.failed.toLocaleString()}`);
  console.log(
    `  └─ Chat Image Uploads: ${successfulChatUploads.length.toLocaleString()}`,
  );

  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`);
    errors.slice(0, 10).forEach((error) => console.log(`  - ${error}`));
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more errors`);
    }
  }

  console.log(`\n✅ Media record creation report saved to: ${OUTPUT_PATH}`);

  // Success assessment
  if (stats.successRate >= 95) {
    console.log("\n🟢 EXCELLENT - Media record creation highly successful!");
  } else if (stats.successRate >= 85) {
    console.log(
      "\n🟡 GOOD - Media record creation mostly successful, review errors",
    );
  } else {
    console.log(
      "\n🔴 POOR - Media record creation had significant issues, investigate errors",
    );
  }

  console.log("\n📊 Database Integration Complete:");
  console.log(
    `  • Profile avatars linked: ${successfulProfileRecords.length.toLocaleString()}`,
  );
  console.log(
    `  • Service images linked: ${successfulServiceRecords.length.toLocaleString()}`,
  );
  console.log(
    `  • Chat images linked: ${successfulChatRecords.length.toLocaleString()}`,
  );
  console.log(
    `  • Preview images set: ${serviceUploadsWithPreview.length.toLocaleString()}`,
  );
  console.log(
    `  • Total media records in database: ${stats.successfulRecords.toLocaleString()}`,
  );

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
