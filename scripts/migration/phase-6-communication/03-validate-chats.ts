#!/usr/bin/env bun
/**
 * Phase 6 - Step 3: Validate Chat Migration
 *
 * This script validates that chats and messages have been correctly migrated
 * and that all relationships are intact.
 */

import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { MySQLParser } from "../phase-1-users/utils/mysql-parser";
import { MigrationLogger } from "../shared/logger";
import type { Database } from "../../../types/database.types";

interface ValidationResult {
  is_valid: boolean;
  total_mysql_chats: number;
  total_mysql_messages: number;
  total_pg_chats: number;
  total_pg_messages: number;
  missing_chats: string[];
  missing_messages: string[];
  orphaned_chats: string[];
  orphaned_messages: string[];
  invalid_customer_stylist_relationships: number;
  message_sender_mismatches: Array<{
    message_id: string;
    expected_sender: string;
    actual_sender: string;
  }>;
  validation_errors: string[];
}

async function validateChats(): Promise<ValidationResult> {
  const tempDir = path.join(__dirname, "..", "temp");
  const logger = new MigrationLogger();

  logger.info("Starting chat migration validation...");

  try {
    // Connect to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Load MySQL dump
    const dumpPath = process.env.MYSQL_DUMP_PATH || path.join(process.cwd(), "nabostylisten_prod.sql");
    const parser = new MySQLParser(dumpPath, logger);

    logger.info("Connected to both data sources");

    const validation_errors: string[] = [];
    const message_sender_mismatches: ValidationResult["message_sender_mismatches"] = [];

    // 1. Get MySQL data
    const [mysqlChats, mysqlMessages, mysqlBookings] = await Promise.all([
      parser.parseTable<{
        id: string;
        booking_id: string;
        is_active: string;
      }>("chat"),
      parser.parseTable<{
        id: string;
        chat_id: string;
        is_from: string;
      }>("message"),
      parser.parseTable<{
        id: string;
        buyer_id: string;
        stylist_id: string;
      }>("booking"),
    ]);

    // Filter for active chats only (matching extraction logic)
    const activeChats = mysqlChats.filter(chat => chat.is_active === "1");
    const totalMysqlChats = activeChats.length;
    const totalMysqlMessages = mysqlMessages.length;

    logger.info(
      `MySQL: ${totalMysqlChats} active chats, ${totalMysqlMessages} messages`,
    );

    // Create booking mapping for sender validation
    const bookingMap = new Map<string, { buyer_id: string; stylist_id: string }>();
    for (const booking of mysqlBookings) {
      bookingMap.set(booking.id, {
        buyer_id: booking.buyer_id,
        stylist_id: booking.stylist_id,
      });
    }

    // 2. Count PostgreSQL data
    const [
      { count: totalPgChats, error: chatCountError },
      { count: totalPgMessages, error: messageCountError }
    ] = await Promise.all([
      supabase.from("chats").select("*", { count: "exact", head: true }),
      supabase.from("chat_messages").select("*", { count: "exact", head: true }),
    ]);

    if (chatCountError) {
      validation_errors.push(
        `Failed to count PostgreSQL chats: ${chatCountError.message}`,
      );
    }

    if (messageCountError) {
      validation_errors.push(
        `Failed to count PostgreSQL messages: ${messageCountError.message}`,
      );
    }

    logger.info(
      `PostgreSQL: ${totalPgChats || 0} chats, ${totalPgMessages || 0} messages`,
    );

    // 3. Fetch all PostgreSQL data for detailed validation
    const [
      { data: pgChats, error: chatFetchError },
      { data: pgMessages, error: messageFetchError }
    ] = await Promise.all([
      supabase.from("chats").select("id, customer_id, stylist_id"),
      supabase.from("chat_messages").select("id, chat_id, sender_id"),
    ]);

    if (chatFetchError) {
      validation_errors.push(
        `Failed to fetch PostgreSQL chats: ${chatFetchError.message}`,
      );
    }

    if (messageFetchError) {
      validation_errors.push(
        `Failed to fetch PostgreSQL messages: ${messageFetchError.message}`,
      );
    }

    // 4. Check for missing chats
    const pgChatIds = new Set(pgChats?.map((c) => c.id) || []);
    const missing_chats = activeChats
      .map((c) => c.id.toLowerCase())
      .filter((id) => !pgChatIds.has(id));

    if (missing_chats.length > 0) {
      validation_errors.push(
        `${missing_chats.length} chats missing in PostgreSQL`,
      );
      logger.warn(`Found ${missing_chats.length} missing chats`);
    }

    // 5. Check for missing messages (only for chats that were migrated)
    const validChatIds = new Set(activeChats.map(c => c.id));
    const validMessages = mysqlMessages.filter(m => validChatIds.has(m.chat_id));
    
    const pgMessageIds = new Set(pgMessages?.map((m) => m.id) || []);
    const missing_messages = validMessages
      .map((m) => m.id.toLowerCase())
      .filter((id) => !pgMessageIds.has(id));

    if (missing_messages.length > 0) {
      validation_errors.push(
        `${missing_messages.length} messages missing in PostgreSQL`,
      );
      logger.warn(`Found ${missing_messages.length} missing messages`);
    }

    // 6. Check for chats with invalid customer/stylist references
    const { data: orphanedChats, error: orphanError } = await supabase
      .from("chats")
      .select(`
        id,
        customer_id,
        stylist_id,
        customer:profiles!customer_id(id, role),
        stylist:profiles!stylist_id(id, role)
      `);

    if (orphanError) {
      validation_errors.push(
        `Failed to check for orphaned chats: ${orphanError.message}`,
      );
    }

    const orphaned_chats = orphanedChats?.map((c) => c.id) || [];
    if (orphaned_chats.length > 0) {
      validation_errors.push(
        `${orphaned_chats.length} chats have no associated booking`,
      );
    }

    // 7. Check for orphaned messages (no corresponding chat)
    const { data: orphanedMessages, error: messageOrphanError } = await supabase
      .from("chat_messages")
      .select("id, chat_id")
      .is("chat_id", null);

    if (messageOrphanError) {
      validation_errors.push(
        `Failed to check for orphaned messages: ${messageOrphanError.message}`,
      );
    }

    const orphaned_messages = orphanedMessages?.map((m) => m.id) || [];
    if (orphaned_messages.length > 0) {
      validation_errors.push(
        `${orphaned_messages.length} messages have no associated chat`,
      );
    }

    // 8. Validate chat-booking relationships
    const { data: bookingsWithChats, error: bookingError } = await supabase
      .from("bookings")
      .select("id")
      .in("id", pgChats?.map(c => c.booking_id) || []);

    if (bookingError) {
      validation_errors.push(
        `Failed to validate chat-booking relationships: ${bookingError.message}`,
      );
    }

    const existingBookingIds = new Set(bookingsWithChats?.map(b => b.id) || []);
    const chatsWithMissingBookings = pgChats?.filter(c => 
      c.booking_id && !existingBookingIds.has(c.booking_id)
    ) || [];

    const chat_booking_mismatches = chatsWithMissingBookings.length;
    if (chat_booking_mismatches > 0) {
      validation_errors.push(
        `${chat_booking_mismatches} chats reference non-existent bookings`,
      );
    }

    // 9. Validate message senders (sample check)
    const sampleSize = Math.min(50, pgMessages?.length || 0);
    if (pgMessages && pgChats && sampleSize > 0) {
      logger.info(`Validating sender mapping for ${sampleSize} sample messages...`);

      // Create chat to booking mapping for PostgreSQL data
      const pgChatToBookingMap = new Map<string, string>();
      for (const chat of pgChats) {
        if (chat.booking_id) {
          pgChatToBookingMap.set(chat.id, chat.booking_id);
        }
      }

      for (let i = 0; i < sampleSize; i++) {
        const pgMessage = pgMessages[i];
        const mysqlMessage = mysqlMessages.find((m) =>
          m.id.toLowerCase() === pgMessage.id
        );

        if (mysqlMessage && pgMessage.chat_id) {
          const bookingId = pgChatToBookingMap.get(pgMessage.chat_id);
          if (bookingId) {
            const bookingInfo = bookingMap.get(bookingId);
            if (bookingInfo) {
              const expectedSender = mysqlMessage.is_from === "buyer" 
                ? bookingInfo.buyer_id 
                : bookingInfo.stylist_id;

              if (expectedSender !== pgMessage.sender_id) {
                message_sender_mismatches.push({
                  message_id: pgMessage.id,
                  expected_sender: expectedSender,
                  actual_sender: pgMessage.sender_id,
                });
              }
            }
          }
        }
      }

      if (message_sender_mismatches.length > 0) {
        validation_errors.push(
          `${message_sender_mismatches.length} messages have incorrect sender mapping`,
        );
      }
    }

    // 10. Check message counts per chat (sample validation)
    if (pgChats && pgMessages) {
      logger.info("Validating message counts per chat...");
      
      const chatMessageCounts = new Map<string, number>();
      for (const message of pgMessages) {
        if (message.chat_id) {
          chatMessageCounts.set(
            message.chat_id,
            (chatMessageCounts.get(message.chat_id) || 0) + 1
          );
        }
      }

      logger.info(`Chat message distribution:`);
      const counts = Array.from(chatMessageCounts.values());
      const avgMessages = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
      const maxMessages = counts.length > 0 ? Math.max(...counts) : 0;
      const minMessages = counts.length > 0 ? Math.min(...counts) : 0;
      
      logger.info(`  - Average messages per chat: ${avgMessages.toFixed(2)}`);
      logger.info(`  - Max messages in a chat: ${maxMessages}`);
      logger.info(`  - Min messages in a chat: ${minMessages}`);
    }

    const is_valid = validation_errors.length === 0 &&
      missing_chats.length === 0 &&
      missing_messages.length === 0 &&
      orphaned_chats.length === 0 &&
      orphaned_messages.length === 0 &&
      message_sender_mismatches.length === 0;

    const result: ValidationResult = {
      is_valid,
      total_mysql_chats: totalMysqlChats,
      total_mysql_messages: totalMysqlMessages,
      total_pg_chats: totalPgChats || 0,
      total_pg_messages: totalPgMessages || 0,
      missing_chats,
      missing_messages,
      orphaned_chats,
      orphaned_messages,
      chat_booking_mismatches,
      message_sender_mismatches,
      validation_errors,
    };

    // Save validation results
    await fs.writeFile(
      path.join(tempDir, "chat-validation-results.json"),
      JSON.stringify(
        {
          validated_at: new Date().toISOString(),
          ...result,
        },
        null,
        2,
      ),
    );

    // Log summary
    if (is_valid) {
      logger.info("✅ Chat migration validation PASSED");
    } else {
      logger.error("❌ Chat migration validation FAILED");
      if (validation_errors.length > 0) {
        logger.error("Validation errors:");
        validation_errors.forEach((error) => logger.error(`  - ${error}`));
      }
    }

    logger.info("Validation summary:");
    logger.info(`  - Total MySQL active chats: ${totalMysqlChats}`);
    logger.info(`  - Total MySQL messages: ${totalMysqlMessages}`);
    logger.info(`  - Total PostgreSQL chats: ${totalPgChats || 0}`);
    logger.info(`  - Total PostgreSQL messages: ${totalPgMessages || 0}`);
    logger.info(`  - Missing chats: ${missing_chats.length}`);
    logger.info(`  - Missing messages: ${missing_messages.length}`);
    logger.info(`  - Orphaned chats: ${orphaned_chats.length}`);
    logger.info(`  - Orphaned messages: ${orphaned_messages.length}`);
    logger.info(`  - Chat-booking mismatches: ${chat_booking_mismatches}`);
    logger.info(`  - Message sender mismatches: ${message_sender_mismatches.length}`);

    return result;
  } catch (error) {
    logger.error("Chat validation failed:", error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  validateChats()
    .then((result) => {
      if (result.is_valid) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { validateChats, type ValidationResult };