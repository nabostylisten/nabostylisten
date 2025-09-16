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
  booking_id: string;
  buyer_id: string;
  stylist_id: string;
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

interface MySQLBooking {
  id: string;
  buyer_id: string;
  stylist_id: string;
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
  has_image?: boolean; // For media handling
}

interface ExtractionResult {
  processedChats: ProcessedChat[];
  processedMessages: ProcessedMessage[];
  skippedChats: Array<{ chat: MySQLChat; reason: string }>;
  skippedMessages: Array<{ message: MySQLMessage; reason: string }>;
  imageMessages: Array<{ message: MySQLMessage; chat_id: string }>;
  metadata: {
    total_mysql_chats: number;
    total_mysql_messages: number;
    total_mysql_bookings: number;
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
    const dumpPath = process.env.MYSQL_DUMP_PATH || path.join(process.cwd(), "nabostylisten_dump.sql");
    const parser = new MySQLParser(dumpPath, logger);

    logger.info("Parsing chats, messages, and bookings from MySQL dump...");

    // Parse all required tables
    const [chats, messages, bookings] = await Promise.all([
      parser.parseTable<MySQLChat>("chat"),
      parser.parseTable<MySQLMessage>("message"),
      parser.parseTable<MySQLBooking>("booking"),
    ]);

    logger.info(
      `Found ${chats.length} chats, ${messages.length} messages, and ${bookings.length} bookings in MySQL`,
    );

    // Create booking ID to buyer/stylist mapping
    const bookingMap = new Map<string, { buyer_id: string; stylist_id: string }>();
    for (const booking of bookings) {
      bookingMap.set(booking.id, {
        buyer_id: booking.buyer_id,
        stylist_id: booking.stylist_id,
      });
    }

    logger.info(`Created booking mapping for ${bookingMap.size} bookings`);

    // Get list of migrated booking IDs from PostgreSQL bookings
    const bookingMappingPath = path.join(tempDir, "bookings-created.json");
    let migratedBookingIds = new Set<string>();

    try {
      const bookingMapping = JSON.parse(
        await fs.readFile(bookingMappingPath, "utf-8"),
      );
      // The file contains booking IDs that were successfully migrated
      if (bookingMapping.results) {
        migratedBookingIds = new Set(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          bookingMapping.results.map((r: any) => r.id),
        );
      }
      logger.info(`Found ${migratedBookingIds.size} migrated booking IDs`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      logger.warn(
        "Could not load booking creation results, will process all chats",
      );
    }

    const processedChats: ProcessedChat[] = [];
    const processedMessages: ProcessedMessage[] = [];
    const skippedChats: Array<{ chat: MySQLChat; reason: string }> = [];
    const skippedMessages: Array<{ message: MySQLMessage; reason: string }> = [];
    const imageMessages: Array<{ message: MySQLMessage; chat_id: string }> = [];
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

        // Check if the booking was successfully migrated to PostgreSQL
        if (migratedBookingIds.size > 0 && !migratedBookingIds.has(chat.booking_id)) {
          skippedChats.push({
            chat,
            reason: "Booking was not migrated to PostgreSQL",
          });
          continue;
        }

        // Validate booking exists in our mapping
        if (!bookingMap.has(chat.booking_id)) {
          skippedChats.push({
            chat,
            reason: "No booking found for this chat",
          });
          continue;
        }

        const processedChat: ProcessedChat = {
          id: chat.id.toLowerCase(),
          booking_id: chat.booking_id,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
        };

        processedChats.push(processedChat);

        logger.debug(`✓ Processed chat: ${chat.id} for booking: ${chat.booking_id}`);
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

        // Get booking information for sender resolution
        const bookingInfo = bookingMap.get(chat.booking_id);
        if (!bookingInfo) {
          skippedMessages.push({
            message,
            reason: "Could not find booking information for sender resolution",
          });
          continue;
        }

        // Resolve sender_id based on is_from field
        let sender_id: string;
        if (message.is_from === "buyer") {
          sender_id = bookingInfo.buyer_id;
          senderDistribution["customer"] = (senderDistribution["customer"] || 0) + 1;
        } else if (message.is_from === "stylist") {
          sender_id = bookingInfo.stylist_id;
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

        const processedMessage: ProcessedMessage = {
          id: message.id.toLowerCase(),
          chat_id: message.chat_id.toLowerCase(),
          sender_id: sender_id,
          content: message.message,
          is_read: message.is_unread !== "1", // Invert the logic
          created_at: message.created_at,
          has_image: hasImage,
        };

        processedMessages.push(processedMessage);

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
      metadata: {
        total_mysql_chats: chats.length,
        total_mysql_messages: messages.length,
        total_mysql_bookings: bookings.length,
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