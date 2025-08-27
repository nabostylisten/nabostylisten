#!/usr/bin/env bun
/**
 * Phase 6 - Step 2: Create Chats and Messages in Supabase
 *
 * This script takes the extracted chats and messages and creates them in Supabase.
 * Handles chat creation first, then messages, and image media records.
 */

import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { MigrationLogger } from "../shared/logger";
import type { Database } from "../../../types/database.types";
import type { ProcessedChat, ProcessedMessage } from "./01-extract-chats";

interface CreationResult {
  created_chats: Array<{
    id: string;
    booking_id: string;
  }>;
  created_messages: Array<{
    id: string;
    chat_id: string;
    sender_id: string;
    has_image?: boolean;
  }>;
  created_media: Array<{
    id: string;
    message_id: string;
    media_type: string;
  }>;
  failed_chats: Array<{
    chat: ProcessedChat;
    error: string;
  }>;
  failed_messages: Array<{
    message: ProcessedMessage;
    error: string;
  }>;
  metadata: {
    total_chats_to_create: number;
    total_messages_to_create: number;
    successful_chat_creations: number;
    successful_message_creations: number;
    successful_media_creations: number;
    failed_chat_creations: number;
    failed_message_creations: number;
    duration_ms: number;
  };
}

async function createChats(): Promise<CreationResult> {
  const tempDir = path.join(__dirname, "..", "temp");
  const startTime = Date.now();
  const logger = new MigrationLogger();

  logger.info("Starting chat and message creation in Supabase...");

  try {
    // Load extracted chats and messages
    const extractedData = JSON.parse(
      await fs.readFile(path.join(tempDir, "chats-extracted.json"), "utf-8"),
    );
    const chats: ProcessedChat[] = extractedData.processedChats;
    const messages: ProcessedMessage[] = extractedData.processedMessages;
    const imageMessages = extractedData.imageMessages || [];

    logger.info(`Loaded ${chats.length} chats and ${messages.length} messages to create`);

    // Connect to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    logger.info("Connected to Supabase");

    const created_chats: CreationResult["created_chats"] = [];
    const created_messages: CreationResult["created_messages"] = [];
    const created_media: CreationResult["created_media"] = [];
    const failed_chats: CreationResult["failed_chats"] = [];
    const failed_messages: CreationResult["failed_messages"] = [];

    // Phase 1: Create chats first (since messages depend on them)
    logger.info("Phase 1: Creating chats...");
    const CHAT_BATCH_SIZE = 50;

    for (let i = 0; i < chats.length; i += CHAT_BATCH_SIZE) {
      const batch = chats.slice(i, i + CHAT_BATCH_SIZE);
      const batchNumber = Math.floor(i / CHAT_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chats.length / CHAT_BATCH_SIZE);

      logger.info(
        `Processing chat batch ${batchNumber}/${totalBatches} (${batch.length} chats)`,
      );

      // Process each chat in the batch
      const batchPromises = batch.map(async (chat) => {
        try {
          // Check if chat already exists
          const { data: existingChat, error: checkError } = await supabase
            .from("chats")
            .select("id")
            .eq("booking_id", chat.booking_id)
            .single();

          if (checkError && checkError.code !== "PGRST116") {
            logger.error(`Failed to check if chat already exists: ${checkError}`);
          }

          if (existingChat) {
            logger.warn(
              `Chat already exists for booking ${chat.booking_id}, skipping`,
            );
            return;
          }

          // Create the chat
          const { data: createdChat, error: createError } = await supabase
            .from("chats")
            .insert({
              id: chat.id,
              booking_id: chat.booking_id,
              created_at: chat.created_at,
              updated_at: chat.updated_at,
            })
            .select("id, booking_id")
            .single();

          if (createError) {
            throw createError;
          }

          if (createdChat) {
            created_chats.push({
              id: createdChat.id,
              booking_id: createdChat.booking_id,
            });

            logger.debug(`✓ Created chat: ${chat.id} for booking: ${chat.booking_id}`);
          }
        } catch (error) {
          logger.error(`Failed to create chat ${chat.id}:`, error);
          failed_chats.push({
            chat,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);

      logger.info(
        `Chat batch ${batchNumber} completed: ${created_chats.length} created, ${failed_chats.length} failed`,
      );
    }

    // Phase 2: Create messages
    logger.info("Phase 2: Creating messages...");
    const MESSAGE_BATCH_SIZE = 100;

    for (let i = 0; i < messages.length; i += MESSAGE_BATCH_SIZE) {
      const batch = messages.slice(i, i + MESSAGE_BATCH_SIZE);
      const batchNumber = Math.floor(i / MESSAGE_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(messages.length / MESSAGE_BATCH_SIZE);

      logger.info(
        `Processing message batch ${batchNumber}/${totalBatches} (${batch.length} messages)`,
      );

      // Process each message in the batch
      const batchPromises = batch.map(async (message) => {
        try {
          // Check if message already exists
          const { data: existingMessage, error: checkError } = await supabase
            .from("chat_messages")
            .select("id")
            .eq("id", message.id)
            .single();

          if (checkError && checkError.code !== "PGRST116") {
            logger.error(`Failed to check if message already exists: ${checkError}`);
          }

          if (existingMessage) {
            logger.warn(`Message ${message.id} already exists, skipping`);
            return;
          }

          // Create the message (exclude has_image from insert)
          const { has_image, ...messageData } = message;
          const { data: createdMessage, error: createError } = await supabase
            .from("chat_messages")
            .insert(messageData)
            .select("id, chat_id, sender_id")
            .single();

          if (createError) {
            throw createError;
          }

          if (createdMessage) {
            created_messages.push({
              id: createdMessage.id,
              chat_id: createdMessage.chat_id,
              sender_id: createdMessage.sender_id,
              has_image: has_image,
            });

            logger.debug(`✓ Created message: ${message.id} in chat: ${message.chat_id}`);
          }
        } catch (error) {
          logger.error(`Failed to create message ${message.id}:`, error);
          failed_messages.push({
            message,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);

      logger.info(
        `Message batch ${batchNumber} completed: ${created_messages.length} created, ${failed_messages.length} failed`,
      );
    }

    // Phase 3: Create media records for image messages
    logger.info("Phase 3: Creating media records for image messages...");
    
    const imageMessageIds = new Set(imageMessages.map((img: any) => img.message.id));
    const createdImageMessages = created_messages.filter(msg => 
      msg.has_image && imageMessageIds.has(msg.id)
    );

    if (createdImageMessages.length > 0) {
      logger.info(`Creating ${createdImageMessages.length} media records for image messages`);

      const mediaPromises = createdImageMessages.map(async (message) => {
        try {
          // Create media record
          const { data: createdMedia, error: createError } = await supabase
            .from("media")
            .insert({
              media_type: "chat_image",
              chat_message_id: message.id,
              file_path: `/chats/images/${message.id}`, // Placeholder path
              file_name: `${message.id}.jpg`, // Placeholder name
              file_size: 0, // Unknown size
              mime_type: "image/jpeg", // Default type
            })
            .select("id, media_type")
            .single();

          if (createError) {
            throw createError;
          }

          if (createdMedia) {
            created_media.push({
              id: createdMedia.id,
              message_id: message.id,
              media_type: createdMedia.media_type,
            });

            logger.debug(`✓ Created media record for message: ${message.id}`);
          }
        } catch (error) {
          logger.warn(`Failed to create media record for message ${message.id}:`, error);
          // Non-critical error, don't fail the migration
        }
      });

      await Promise.all(mediaPromises);
    }

    const duration = Date.now() - startTime;

    const result: CreationResult = {
      created_chats,
      created_messages,
      created_media,
      failed_chats,
      failed_messages,
      metadata: {
        total_chats_to_create: chats.length,
        total_messages_to_create: messages.length,
        successful_chat_creations: created_chats.length,
        successful_message_creations: created_messages.length,
        successful_media_creations: created_media.length,
        failed_chat_creations: failed_chats.length,
        failed_message_creations: failed_messages.length,
        duration_ms: duration,
      },
    };

    // Save results
    await fs.writeFile(
      path.join(tempDir, "chats-created.json"),
      JSON.stringify(
        {
          created_at: new Date().toISOString(),
          created_chats,
          created_messages,
          created_media,
          metadata: result.metadata,
        },
        null,
        2,
      ),
    );

    if (failed_chats.length > 0 || failed_messages.length > 0) {
      await fs.writeFile(
        path.join(tempDir, "failed-chats-creation.json"),
        JSON.stringify(
          {
            failed_at: new Date().toISOString(),
            failed_chats,
            failed_messages,
          },
          null,
          2,
        ),
      );
    }

    // Save creation statistics
    await fs.writeFile(
      path.join(tempDir, "chat-creation-stats.json"),
      JSON.stringify(
        {
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round(duration / 1000),
          total_chats: chats.length,
          total_messages: messages.length,
          successfully_created_chats: created_chats.length,
          successfully_created_messages: created_messages.length,
          successfully_created_media: created_media.length,
          failed_chat_creations: failed_chats.length,
          failed_message_creations: failed_messages.length,
          chat_success_rate: `${((created_chats.length / chats.length) * 100).toFixed(2)}%`,
          message_success_rate: `${((created_messages.length / messages.length) * 100).toFixed(2)}%`,
        },
        null,
        2,
      ),
    );

    // Log summary
    logger.info("Chat and message creation completed:");
    logger.info(`  - Total chats to create: ${result.metadata.total_chats_to_create}`);
    logger.info(`  - Total messages to create: ${result.metadata.total_messages_to_create}`);
    logger.info(`  - Successfully created chats: ${result.metadata.successful_chat_creations}`);
    logger.info(`  - Successfully created messages: ${result.metadata.successful_message_creations}`);
    logger.info(`  - Successfully created media: ${result.metadata.successful_media_creations}`);
    logger.info(`  - Failed chat creations: ${result.metadata.failed_chat_creations}`);
    logger.info(`  - Failed message creations: ${result.metadata.failed_message_creations}`);
    logger.info(`  - Duration: ${(duration / 1000).toFixed(2)}s`);
    logger.info(
      `  - Chat success rate: ${((created_chats.length / chats.length) * 100).toFixed(2)}%`,
    );
    logger.info(
      `  - Message success rate: ${((created_messages.length / messages.length) * 100).toFixed(2)}%`,
    );

    return result;
  } catch (error) {
    logger.error("Chat and message creation failed:", error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  createChats()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { createChats, type CreationResult };