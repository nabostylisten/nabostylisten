#!/usr/bin/env bun
/**
 * Phase 5 - Step 1: Extract Payments from MySQL
 *
 * This script extracts payment data from MySQL dump and transforms it for PostgreSQL.
 * Handles status mapping, amount calculations, and removes salon-related fields.
 * Creates proper mapping from payment_id -> booking_id using MySQL booking table.
 */

import fs from "fs/promises";
import path from "path";
import { MySQLParser } from "../phase-1-users/utils/mysql-parser";
import { MigrationLogger } from "../shared/logger";
import type { Database } from "../../../types/database.types";

interface MySQLPayment {
  id: string;
  payment_intent_id: string;
  stylist_amount: string; // MySQL decimal as string
  platform_amount: string; // MySQL decimal as string
  salon_amount: string | null;
  salon_percentage: string | null;
  stylist_transfer_id: string | null;
  salon_transfer_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface MySQLBooking {
  id: string;
  buyer_id: string;
  stylist_id: string;
  payment_id: string;
  date_time: string;
  status: string;
}

interface ProcessedPayment extends
  Omit<
    Database["public"]["Tables"]["payments"]["Insert"],
    "created_at" | "updated_at"
  > {
  created_at: string;
  updated_at: string;
}

interface ExtractionResult {
  processedPayments: ProcessedPayment[];
  skippedPayments: Array<{ payment: MySQLPayment; reason: string }>;
  metadata: {
    total_mysql_payments: number;
    total_mysql_bookings: number;
    processed_payments: number;
    skipped_payments: number;
    unique_bookings: number;
    status_distribution: Record<string, number>;
  };
}

async function mapPaymentStatus(
  mysqlStatus: string,
): Promise<Database["public"]["Enums"]["payment_status"]> {
  const statusMap: Record<
    string,
    Database["public"]["Enums"]["payment_status"]
  > = {
    "pending": "pending",
    "needs_capture": "requires_capture",
    "captured": "succeeded",
    "cancelled": "cancelled",
    "refunded": "succeeded", // Will be handled with refunded_amount > 0
    "failed": "cancelled",
  };

  return statusMap[mysqlStatus] || "pending";
}

async function extractPayments(): Promise<ExtractionResult> {
  const tempDir = path.join(__dirname, "..", "temp");
  await fs.mkdir(tempDir, { recursive: true });
  const logger = new MigrationLogger();

  logger.info("Starting payment extraction from MySQL...");

  try {
    // Load MySQL dump
    const dumpPath = path.join(process.cwd(), "nabostylisten_dump.sql");
    const parser = new MySQLParser(dumpPath, logger);

    logger.info("Parsing payments and bookings from MySQL dump...");

    // Parse payments and bookings
    const [payments, bookings] = await Promise.all([
      parser.parseTable<MySQLPayment>("payment"),
      parser.parseTable<MySQLBooking>("booking"),
    ]);

    logger.info(
      `Found ${payments.length} payments and ${bookings.length} bookings in MySQL`,
    );

    // Create payment_id -> booking_id mapping
    const paymentToBookingMap = new Map<string, string>();
    for (const booking of bookings) {
      paymentToBookingMap.set(booking.payment_id, booking.id);
    }

    logger.info(
      `Created mapping for ${paymentToBookingMap.size} payment-booking relationships`,
    );

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
        "Could not load booking creation results, will process all payments",
      );
    }

    const processedPayments: ProcessedPayment[] = [];
    const skippedPayments: Array<{ payment: MySQLPayment; reason: string }> =
      [];
    const statusDistribution: Record<string, number> = {};

    for (const payment of payments) {
      try {
        // Find the booking ID for this payment
        const bookingId = paymentToBookingMap.get(payment.id);
        if (!bookingId) {
          skippedPayments.push({
            payment,
            reason: "No booking found for this payment",
          });
          continue;
        }

        // Check if the booking was successfully migrated to PostgreSQL
        if (migratedBookingIds.size > 0 && !migratedBookingIds.has(bookingId)) {
          skippedPayments.push({
            payment,
            reason: "Booking was not migrated to PostgreSQL",
          });
          continue;
        }

        // Skip payments without payment_intent_id (incomplete payments)
        if (!payment.payment_intent_id) {
          skippedPayments.push({
            payment,
            reason: "Payment has no payment_intent_id (incomplete payment)",
          });
          continue;
        }

        // Parse amounts (MySQL stores as strings)
        const stylistAmount = parseFloat(payment.stylist_amount);
        const platformAmount = parseFloat(payment.platform_amount);

        // Calculate amounts
        const finalAmount = stylistAmount + platformAmount;
        const stripeApplicationFeeAmount = Math.round(platformAmount * 100); // Convert to øre

        // Map status
        const newStatus = await mapPaymentStatus(payment.status);
        statusDistribution[newStatus] = (statusDistribution[newStatus] || 0) +
          1;

        // Determine timestamps based on status
        let capturedAt: string | null = null;
        let succeededAt: string | null = null;
        let refundedAmount = 0;

        if (payment.status === "captured") {
          capturedAt = payment.updated_at;
          succeededAt = payment.updated_at;
        } else if (payment.status === "refunded") {
          succeededAt = payment.updated_at;
          refundedAmount = finalAmount; // Assume full refund if status is refunded
        }

        const processedPayment: ProcessedPayment = {
          id: payment.id.toLowerCase(),
          booking_id: bookingId,
          payment_intent_id: payment.payment_intent_id,

          // Amounts
          original_amount: finalAmount,
          discount_amount: 0,
          final_amount: finalAmount,
          platform_fee: platformAmount,
          stylist_payout: stylistAmount,
          affiliate_commission: 0,
          currency: "NOK",

          // Discount tracking (not in old system)
          discount_code: null,
          discount_percentage: null,
          discount_fixed_amount: null,

          // Affiliate tracking (not in old system)
          affiliate_id: null,
          affiliate_commission_percentage: null,

          // Stripe tracking
          stripe_application_fee_amount: stripeApplicationFeeAmount,
          stylist_transfer_id: payment.stylist_transfer_id,

          // Status
          status: newStatus,

          // Timestamps
          created_at: payment.created_at,
          updated_at: payment.updated_at,
          authorized_at: null, // Not tracked in old system
          captured_at: capturedAt,
          succeeded_at: succeededAt,
          payout_initiated_at: payment.stylist_transfer_id
            ? payment.updated_at
            : null,
          payout_completed_at: null, // Not tracked in old system

          // Refund tracking
          refunded_amount: refundedAmount,
          refund_reason: payment.status === "refunded"
            ? "Customer requested refund"
            : null,
        };

        processedPayments.push(processedPayment);

        logger.debug(
          `✓ Processed payment: ${payment.id} -> booking: ${bookingId} (${payment.status} → ${newStatus})`,
        );
      } catch (error) {
        logger.error(`Failed to process payment ${payment.id}:`, error);
        skippedPayments.push({
          payment,
          reason: `Processing error: ${error}`,
        });
      }
    }

    const result: ExtractionResult = {
      processedPayments,
      skippedPayments,
      metadata: {
        total_mysql_payments: payments.length,
        total_mysql_bookings: bookings.length,
        processed_payments: processedPayments.length,
        skipped_payments: skippedPayments.length,
        unique_bookings: new Set(processedPayments.map((p) =>
          p.booking_id
        )).size,
        status_distribution: statusDistribution,
      },
    };

    // Save results to temp files
    await fs.writeFile(
      path.join(tempDir, "payments-extracted.json"),
      JSON.stringify(
        {
          extracted_at: new Date().toISOString(),
          processedPayments,
          metadata: result.metadata,
        },
        null,
        2,
      ),
    );

    if (skippedPayments.length > 0) {
      await fs.writeFile(
        path.join(tempDir, "skipped-payments.json"),
        JSON.stringify(
          {
            skipped_at: new Date().toISOString(),
            skipped_payments: skippedPayments,
          },
          null,
          2,
        ),
      );
    }

    // Log summary
    logger.info("Payment extraction completed:");
    logger.info(
      `  - Total MySQL payments: ${result.metadata.total_mysql_payments}`,
    );
    logger.info(
      `  - Total MySQL bookings: ${result.metadata.total_mysql_bookings}`,
    );
    logger.info(
      `  - Successfully processed: ${result.metadata.processed_payments}`,
    );
    logger.info(`  - Skipped payments: ${result.metadata.skipped_payments}`);
    logger.info(
      `  - Unique bookings with payments: ${result.metadata.unique_bookings}`,
    );

    logger.info("Status distribution:");
    for (const [status, count] of Object.entries(statusDistribution)) {
      logger.info(`  - ${status}: ${count}`);
    }

    if (skippedPayments.length > 0) {
      logger.info("Skipped payment reasons:");
      const reasonCounts = skippedPayments.reduce((acc, sp) => {
        acc[sp.reason] = (acc[sp.reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      for (const [reason, count] of Object.entries(reasonCounts)) {
        logger.info(`  - ${reason}: ${count}`);
      }
    }

    return result;
  } catch (error) {
    logger.error("Payment extraction failed:", error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  extractPayments()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}

export { type ExtractionResult, extractPayments, type ProcessedPayment };
