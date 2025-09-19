#!/usr/bin/env bun
/**
 * Phase 6 - Step 1: Extract Chats and Messages from MySQL
 *
 * This script extracts chat and message data from MySQL dump and transforms it for PostgreSQL.
 * Handles sender resolution, image handling, and filtering active chats.
 * Creates proper mapping for booking-based chat system.
 */

import fs from "fs/promises";
import path from "path";
import { MySQLParser } from "../phase-1-users/utils/mysql-parser";
import { MigrationLogger } from "../shared/logger";
import type { Database } from "../../../types/database.types";

interface MySQLChat {
  id: string;
  buyer_id: string;
  stylist_id: string;
  booking_id: string | null; // Still exists in MySQL table but not used for new system
  buyer_has_unread: string | null; // "0" or "1"
  stylist_has_unread: string | null; // "0" or "1"
  is_active: string; // "0" or "1"
  created_at: string;
  updated_at: string;
}

interface MySQLMessage {
  id: string;
  chat_id: string;
  message: string;
  is_from: string; // "buyer" or "stylist"
  is_unread: string; // "0" or "1"
  is_image: string; // "0" or "1"
  created_at: string;
}


interface ProcessedChat extends
  Omit<
    Database["public"]["Tables"]["chats"]["Insert"],
    "created_at" | "updated_at"
  > {
  created_at: string;
  updated_at: string;
}

interface ProcessedMessage extends
  Omit<
    Database["public"]["Tables"]["chat_messages"]["Insert"],
    "created_at"
  > {
  created_at: string;
}

interface ExtractionResult {
  processedChats: ProcessedChat[];
  processedMessages: ProcessedMessage[];
  skippedChats: Array<{ chat: MySQLChat; reason: string }>;
  skippedMessages: Array<{ message: MySQLMessage; reason: string }>;
  imageMessages: Array<{ message: MySQLMessage; chat_id: string }>;
  // Enhanced mapping for Phase 8 consumption
  imageMessageMapping: Record<string, {
    mysql_message_id: string;
    mysql_chat_id: string;
    processed_message_id: string;
    processed_chat_id: string;
  }>;
  metadata: {
    total_mysql_chats: number;
    total_mysql_messages: number;
    processed_chats: number;
    processed_messages: number;
    skipped_chats: number;
    skipped_messages: number;
    active_chats: number;
    image_messages: number;
    sender_distribution: Record<string, number>;
  };
}

async function extractChats(): Promise<ExtractionResult> {
  const tempDir = path.join(__dirname, "..", "temp");
  await fs.mkdir(tempDir, { recursive: true });
  const logger = new MigrationLogger();

  logger.info("Starting chat and message extraction from MySQL...");

  try {
    // Load MySQL dump
    const dumpPath = process.env.MYSQL_DUMP_PATH || path.join(process.cwd(), "nabostylisten_prod.sql");
    const parser = new MySQLParser(dumpPath, logger);

    logger.info("Parsing chats and messages from MySQL dump...");

    // Parse required tables - no longer need bookings for chat relationships
    const [chats, messages] = await Promise.all([
      parser.parseTable<MySQLChat>("chat"),
      parser.parseTable<MySQLMessage>("message"),
    ]);

    logger.info(
      `Found ${chats.length} chats and ${messages.length} messages in MySQL`,
    );

    // Get user ID mapping for resolving buyer/stylist to new user IDs
    const userMappingPath = path.join(tempDir, "user-id-mapping.json");
    let userMapping = new Map<string, string>();

    try {
      const userMappingData = JSON.parse(
        await fs.readFile(userMappingPath, "utf-8"),
      );
      // The file has structure: { metadata: {...}, mapping: { oldId: newId } }
      if (userMappingData.mapping) {
        userMapping = new Map(Object.entries(userMappingData.mapping));
      }
      logger.info(`Found ${userMapping.size} user ID mappings`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      logger.warn(
        "Could not load user ID mappings, chat migration may fail",
      );
    }

    const processedChats: ProcessedChat[] = [];
    const processedMessages: ProcessedMessage[] = [];
    const skippedChats: Array<{ chat: MySQLChat; reason: string }> = [];
    const skippedMessages: Array<{ message: MySQLMessage; reason: string }> = [];
    const imageMessages: Array<{ message: MySQLMessage; chat_id: string }> = [];
    const imageMessageMapping: Record<string, {
      mysql_message_id: string;
      mysql_chat_id: string;
      processed_message_id: string;
      processed_chat_id: string;
    }> = {};
    const senderDistribution: Record<string, number> = {};

    // First pass: Process chats
    for (const chat of chats) {
      try {
        // Skip inactive chats
        if (chat.is_active !== "1") {
          skippedChats.push({
            chat,
            reason: "Chat is not active",
          });
          continue;
        }

        // Map old user IDs to new user IDs directly from chat
        const newCustomerId = userMapping.get(chat.buyer_id);
        const newStylistId = userMapping.get(chat.stylist_id);

        if (!newCustomerId || !newStylistId) {
          skippedChats.push({
            chat,
            reason: `Could not resolve customer or stylist ID mapping - buyer_id: ${chat.buyer_id} (found: ${!!newCustomerId}), stylist_id: ${chat.stylist_id} (found: ${!!newStylistId})`,
          });
          continue;
        }

        const processedChat: ProcessedChat = {
          id: chat.id.toLowerCase(),
          customer_id: newCustomerId,
          stylist_id: newStylistId,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
        };

        processedChats.push(processedChat);

        logger.debug(`✓ Processed chat: ${chat.id} for customer: ${newCustomerId}, stylist: ${newStylistId}`);
      } catch (error) {
        logger.error(`Failed to process chat ${chat.id}:`, error);
        skippedChats.push({
          chat,
          reason: `Processing error: ${error}`,
        });
      }
    }

    // Create set of valid chat IDs for message processing
    const validChatIds = new Set(processedChats.map((c) => c.id));

    // Second pass: Process messages
    for (const message of messages) {
      try {
        // Skip messages for chats we didn't process
        if (!validChatIds.has(message.chat_id)) {
          skippedMessages.push({
            message,
            reason: "Chat was not processed",
          });
          continue;
        }

        // Find the chat to get booking information
        const chat = chats.find((c) => c.id === message.chat_id);
        if (!chat) {
          skippedMessages.push({
            message,
            reason: "Could not find chat for this message",
          });
          continue;
        }

        // Resolve sender_id based on is_from field using chat's buyer/stylist IDs
        let sender_id: string;
        if (message.is_from === "buyer") {
          sender_id = chat.buyer_id;
          senderDistribution["customer"] = (senderDistribution["customer"] || 0) + 1;
        } else if (message.is_from === "stylist") {
          sender_id = chat.stylist_id;
          senderDistribution["stylist"] = (senderDistribution["stylist"] || 0) + 1;
        } else {
          skippedMessages.push({
            message,
            reason: `Unknown sender type: ${message.is_from}`,
          });
          continue;
        }

        // Handle image messages
        const hasImage = message.is_image === "1";
        if (hasImage) {
          imageMessages.push({
            message,
            chat_id: message.chat_id,
          });
        }

        // Map sender_id to new user ID
        const newSenderId = userMapping.get(sender_id);
        if (!newSenderId) {
          skippedMessages.push({
            message,
            reason: "Could not resolve sender ID mapping",
          });
          continue;
        }

        const processedMessage: ProcessedMessage = {
          id: message.id.toLowerCase(),
          chat_id: message.chat_id.toLowerCase(),
          sender_id: newSenderId,
          content: message.message,
          is_read: message.is_unread !== "1", // Invert the logic
          created_at: message.created_at,
        };

        processedMessages.push(processedMessage);

        // Track image message mapping for Phase 8
        if (hasImage) {
          imageMessageMapping[message.id.toLowerCase()] = {
            mysql_message_id: message.id,
            mysql_chat_id: message.chat_id,
            processed_message_id: message.id.toLowerCase(),
            processed_chat_id: message.chat_id.toLowerCase(),
          };
        }

        logger.debug(
          `✓ Processed message: ${message.id} from ${message.is_from} in chat: ${message.chat_id}`,
        );
      } catch (error) {
        logger.error(`Failed to process message ${message.id}:`, error);
        skippedMessages.push({
          message,
          reason: `Processing error: ${error}`,
        });
      }
    }

    const result: ExtractionResult = {
      processedChats,
      processedMessages,
      skippedChats,
      skippedMessages,
      imageMessages,
      imageMessageMapping,
      metadata: {
        total_mysql_chats: chats.length,
        total_mysql_messages: messages.length,
        processed_chats: processedChats.length,
        processed_messages: processedMessages.length,
        skipped_chats: skippedChats.length,
        skipped_messages: skippedMessages.length,
        active_chats: chats.filter((c) => c.is_active === "1").length,
        image_messages: imageMessages.length,
        sender_distribution: senderDistribution,
      },
    };

    // Save results to temp files
    await fs.writeFile(
      path.join(tempDir, "chats-extracted.json"),
      JSON.stringify(
        {
          extracted_at: new Date().toISOString(),
          processedChats,
          processedMessages,
          imageMessages,
          imageMessageMapping,
          metadata: result.metadata,
        },
        null,
        2,
      ),
    );

    if (skippedChats.length > 0 || skippedMessages.length > 0) {
      await fs.writeFile(
        path.join(tempDir, "skipped-chats.json"),
        JSON.stringify(
          {
            skipped_at: new Date().toISOString(),
            skipped_chats: skippedChats,
            skipped_messages: skippedMessages,
          },
          null,
          2,
        ),
      );
    }

    // Log summary
    logger.info("Chat and message extraction completed:");
    logger.info(`  - Total MySQL chats: ${result.metadata.total_mysql_chats}`);
    logger.info(`  - Total MySQL messages: ${result.metadata.total_mysql_messages}`);
    logger.info(`  - Active chats: ${result.metadata.active_chats}`);
    logger.info(`  - Successfully processed chats: ${result.metadata.processed_chats}`);
    logger.info(`  - Successfully processed messages: ${result.metadata.processed_messages}`);
    logger.info(`  - Skipped chats: ${result.metadata.skipped_chats}`);
    logger.info(`  - Skipped messages: ${result.metadata.skipped_messages}`);
    logger.info(`  - Image messages: ${result.metadata.image_messages}`);

    logger.info("Sender distribution:");
    for (const [sender, count] of Object.entries(senderDistribution)) {
      logger.info(`  - ${sender}: ${count}`);
    }

    if (skippedChats.length > 0) {
      logger.info("Skipped chat reasons:");
      const chatReasonCounts = skippedChats.reduce((acc, sc) => {
        acc[sc.reason] = (acc[sc.reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      for (const [reason, count] of Object.entries(chatReasonCounts)) {
        logger.info(`  - ${reason}: ${count}`);
      }
    }

    if (skippedMessages.length > 0) {
      logger.info("Skipped message reasons:");
      const messageReasonCounts = skippedMessages.reduce((acc, sm) => {
        acc[sm.reason] = (acc[sm.reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      for (const [reason, count] of Object.entries(messageReasonCounts)) {
        logger.info(`  - ${reason}: ${count}`);
      }
    }

    return result;
  } catch (error) {
    logger.error("Chat and message extraction failed:", error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  extractChats()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}

export { type ExtractionResult, extractChats, type ProcessedChat, type ProcessedMessage };