#!/usr/bin/env bun
/**
 * Phase 5 - Step 2: Create Payments in Supabase
 *
 * This script takes the extracted payments and creates them in Supabase.
 * Also updates bookings with payment intent IDs.
 */

import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { MigrationLogger } from "../shared/logger";
import type { Database } from "../../../types/database.types";
import type { ProcessedPayment } from "./01-extract-payments";

interface CreationResult {
  created_payments: Array<{
    id: string;
    booking_id: string;
    payment_intent_id: string;
    status: string;
  }>;
  failed_payments: Array<{
    payment: ProcessedPayment;
    error: string;
  }>;
  updated_bookings: number;
  metadata: {
    total_to_create: number;
    successful_creations: number;
    failed_creations: number;
    updated_bookings: number;
    duration_ms: number;
  };
}

async function createPayments(): Promise<CreationResult> {
  const tempDir = path.join(__dirname, "..", "temp");
  const startTime = Date.now();
  const logger = new MigrationLogger();

  logger.info("Starting payment creation in Supabase...");

  try {
    // Load extracted payments
    const extractedData = JSON.parse(
      await fs.readFile(path.join(tempDir, "payments-extracted.json"), "utf-8"),
    );
    const payments: ProcessedPayment[] = extractedData.processedPayments;

    logger.info(`Loaded ${payments.length} payments to create`);

    // Connect to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    logger.info("Connected to Supabase");

    const created_payments: CreationResult["created_payments"] = [];
    const failed_payments: CreationResult["failed_payments"] = [];
    let updated_bookings = 0;

    // Process in batches to avoid overwhelming the database
    const BATCH_SIZE = 50;

    for (let i = 0; i < payments.length; i += BATCH_SIZE) {
      const batch = payments.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(payments.length / BATCH_SIZE);

      logger.info(
        `Processing batch ${batchNumber}/${totalBatches} (${batch.length} payments)`,
      );

      // Process each payment in the batch
      const batchPromises = batch.map(async (payment) => {
        try {
          // Check if payment already exists
          const { data: existingPayment, error: checkError } = await supabase
            .from("payments")
            .select("id")
            .eq("payment_intent_id", payment.payment_intent_id)
            .single();

          if (checkError) {
            logger.error(
              `Failed to check if payment already exists: ${checkError}`,
            );
          }

          if (existingPayment) {
            logger.warn(
              `Payment already exists for intent ${payment.payment_intent_id}, skipping`,
            );
            return;
          }

          // Create the payment
          const { data: createdPayment, error: createError } = await supabase
            .from("payments")
            .insert({
              id: payment.id,
              booking_id: payment.booking_id,
              payment_intent_id: payment.payment_intent_id,
              original_amount: payment.original_amount,
              discount_amount: payment.discount_amount,
              final_amount: payment.final_amount,
              platform_fee: payment.platform_fee,
              stylist_payout: payment.stylist_payout,
              affiliate_commission: payment.affiliate_commission,
              currency: payment.currency,
              discount_code: payment.discount_code,
              discount_percentage: payment.discount_percentage,
              discount_fixed_amount: payment.discount_fixed_amount,
              affiliate_id: payment.affiliate_id,
              affiliate_commission_percentage:
                payment.affiliate_commission_percentage,
              stripe_application_fee_amount:
                payment.stripe_application_fee_amount,
              stylist_transfer_id: payment.stylist_transfer_id,
              status: payment.status,
              authorized_at: payment.authorized_at,
              captured_at: payment.captured_at,
              succeeded_at: payment.succeeded_at,
              payout_initiated_at: payment.payout_initiated_at,
              payout_completed_at: payment.payout_completed_at,
              refunded_amount: payment.refunded_amount,
              refund_reason: payment.refund_reason,
              created_at: payment.created_at,
              updated_at: payment.updated_at,
            })
            .select("id, booking_id, payment_intent_id, status")
            .single();

          if (createError) {
            throw createError;
          }

          if (createdPayment) {
            created_payments.push({
              id: createdPayment.id,
              booking_id: createdPayment.booking_id,
              payment_intent_id: createdPayment.payment_intent_id,
              status: createdPayment.status,
            });

            // Update the booking with payment intent ID
            const { error: updateError } = await supabase
              .from("bookings")
              .update({
                stripe_payment_intent_id: payment.payment_intent_id,
                payment_captured_at: payment.captured_at,
              })
              .eq("id", payment.booking_id);

            if (updateError) {
              logger.warn(
                `Failed to update booking ${payment.booking_id} with payment intent:`,
                updateError,
              );
            } else {
              updated_bookings++;
            }

            logger.debug(`✓ Created payment: ${payment.id}`);
          }
        } catch (error) {
          logger.error(`Failed to create payment ${payment.id}:`, error);
          failed_payments.push({
            payment,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);

      logger.info(
        `Batch ${batchNumber} completed: ${created_payments.length} created, ${failed_payments.length} failed`,
      );
    }

    const duration = Date.now() - startTime;

    const result: CreationResult = {
      created_payments,
      failed_payments,
      updated_bookings,
      metadata: {
        total_to_create: payments.length,
        successful_creations: created_payments.length,
        failed_creations: failed_payments.length,
        updated_bookings,
        duration_ms: duration,
      },
    };

    // Save results
    await fs.writeFile(
      path.join(tempDir, "payments-created.json"),
      JSON.stringify(
        {
          created_at: new Date().toISOString(),
          created_payments,
          metadata: result.metadata,
        },
        null,
        2,
      ),
    );

    if (failed_payments.length > 0) {
      await fs.writeFile(
        path.join(tempDir, "failed-payments-creation.json"),
        JSON.stringify(
          {
            failed_at: new Date().toISOString(),
            failed_payments,
          },
          null,
          2,
        ),
      );
    }

    // Save migration statistics
    await fs.writeFile(
      path.join(tempDir, "payment-creation-stats.json"),
      JSON.stringify(
        {
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round(duration / 1000),
          total_payments: payments.length,
          successfully_created: created_payments.length,
          failed_creations: failed_payments.length,
          updated_bookings,
          success_rate: `${
            ((created_payments.length / payments.length) * 100).toFixed(2)
          }%`,
        },
        null,
        2,
      ),
    );

    // Log summary
    logger.info("Payment creation completed:");
    logger.info(`  - Total to create: ${result.metadata.total_to_create}`);
    logger.info(
      `  - Successfully created: ${result.metadata.successful_creations}`,
    );
    logger.info(`  - Failed creations: ${result.metadata.failed_creations}`);
    logger.info(`  - Updated bookings: ${result.metadata.updated_bookings}`);
    logger.info(`  - Duration: ${(duration / 1000).toFixed(2)}s`);
    logger.info(
      `  - Success rate: ${
        ((created_payments.length / payments.length) * 100).toFixed(2)
      }%`,
    );

    return result;
  } catch (error) {
    logger.error("Payment creation failed:", error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  createPayments()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { createPayments, type CreationResult };
