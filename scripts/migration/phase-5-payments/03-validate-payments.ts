#!/usr/bin/env bun
/**
 * Phase 5 - Step 3: Validate Payment Migration
 *
 * This script validates that payments have been correctly migrated
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
  total_mysql_payments: number;
  total_pg_payments: number;
  missing_payments: string[];
  orphaned_payments: string[];
  booking_payment_mismatches: number;
  amount_discrepancies: Array<{
    payment_id: string;
    mysql_amount: number;
    pg_amount: number;
    difference: number;
  }>;
  validation_errors: string[];
}

async function validatePayments(): Promise<ValidationResult> {
  const tempDir = path.join(__dirname, "..", "temp");
  const logger = new MigrationLogger();

  logger.info("Starting payment migration validation...");

  try {
    // Connect to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Load MySQL dump
    const dumpPath = process.env.MYSQL_DUMP_PATH || path.join(process.cwd(), "nabostylisten_dump.sql");
    const parser = new MySQLParser(dumpPath, logger);

    logger.info("Connected to both data sources");

    const validation_errors: string[] = [];
    const amount_discrepancies: ValidationResult["amount_discrepancies"] = [];

    // 1. Count total payments in both systems
    const mysqlPayments = await parser.parseTable<{
      id: string;
      stylist_amount: string;
      platform_amount: string;
    }>("payment");
    const totalMysqlPayments = mysqlPayments.length;

    const { count: totalPgPayments, error: countError } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true });

    if (countError) {
      validation_errors.push(
        `Failed to count PostgreSQL payments: ${countError.message}`,
      );
    }

    logger.info(
      `MySQL payments: ${totalMysqlPayments}, PostgreSQL payments: ${
        totalPgPayments || 0
      }`,
    );

    // 2. Load extraction results to understand what should have been migrated
    const extractedPaymentsPath = path.join(tempDir, "payments-extracted.json");
    const extractedData = JSON.parse(
      await fs.readFile(extractedPaymentsPath, "utf-8"),
    );
    const expectedPayments = extractedData.processedPayments;
    const expectedPaymentIds = new Set(expectedPayments.map((p: any) => p.id));
    
    logger.info(
      `Expected ${expectedPayments.length} payments to be migrated (out of ${totalMysqlPayments} total MySQL payments)`,
    );

    // 3. Check for missing payments (should have been migrated but not found in PostgreSQL)
    const { data: pgPayments, error: fetchError } = await supabase
      .from("payments")
      .select("id, booking_id, payment_intent_id, final_amount");

    if (fetchError) {
      validation_errors.push(
        `Failed to fetch PostgreSQL payments: ${fetchError.message}`,
      );
    }

    const pgPaymentIds = new Set(pgPayments?.map((p) => p.id) || []);
    const missing_payments = expectedPayments
      .map((p: any) => p.id)
      .filter((id: string) => !pgPaymentIds.has(id));

    if (missing_payments.length > 0) {
      validation_errors.push(
        `${missing_payments.length} expected payments missing in PostgreSQL`,
      );
      logger.warn(`Found ${missing_payments.length} missing payments`);
    }

    // 4. Check for orphaned payments (no corresponding booking)
    const { data: orphanedPayments, error: orphanError } = await supabase
      .from("payments")
      .select("id, booking_id")
      .is("booking_id", null);

    if (orphanError) {
      validation_errors.push(
        `Failed to check for orphaned payments: ${orphanError.message}`,
      );
    }

    const orphaned_payments = orphanedPayments?.map((p) => p.id) || [];
    if (orphaned_payments.length > 0) {
      validation_errors.push(
        `${orphaned_payments.length} payments have no associated booking`,
      );
    }

    // 5. Validate booking-payment relationships
    const { data: bookingsWithPaymentIntent, error: bookingError } =
      await supabase
        .from("bookings")
        .select("id")
        .not("stripe_payment_intent_id", "is", null);

    if (bookingError) {
      validation_errors.push(
        `Failed to check for bookings with payment intent: ${bookingError.message}`,
      );
    }

    const bookingIds = new Set(
      bookingsWithPaymentIntent?.map((b) => b.id) || [],
    );
    const paymentsWithBooking = pgPayments?.filter((p) => p.booking_id) || [];
    const bookingsWithPayments = new Set(
      paymentsWithBooking.map((p) => p.booking_id),
    );

    const booking_payment_mismatches = [...bookingIds].filter((id) =>
      !bookingsWithPayments.has(id)
    ).length;

    if (booking_payment_mismatches > 0) {
      validation_errors.push(
        `${booking_payment_mismatches} bookings have payment intent but no payment record`,
      );
    }

    // 6. Validate amounts (sample check)
    const sampleSize = Math.min(100, pgPayments?.length || 0);
    if (pgPayments && sampleSize > 0) {
      logger.info(`Validating amounts for ${sampleSize} sample payments...`);

      for (let i = 0; i < sampleSize; i++) {
        const pgPayment = pgPayments[i];
        const expectedPayment = expectedPayments.find((p: any) => p.id === pgPayment.id);

        if (expectedPayment) {
          const expectedAmount = expectedPayment.final_amount;
          const difference = Math.abs(expectedAmount - pgPayment.final_amount);

          if (difference > 0.01) { // Allow for small rounding differences
            amount_discrepancies.push({
              payment_id: pgPayment.id,
              mysql_amount: expectedAmount,
              pg_amount: pgPayment.final_amount,
              difference,
            });
          }
        }
      }

      if (amount_discrepancies.length > 0) {
        validation_errors.push(
          `${amount_discrepancies.length} payments have amount discrepancies`,
        );
      }
    }

    // 7. Check payment status distribution
    const { data: statusDistribution, error: statusError } = await supabase
      .from("payments")
      .select("status")
      .order("status");

    if (statusDistribution && !statusError) {
      const statusCounts = statusDistribution.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      logger.info("Payment status distribution:");
      for (const [status, count] of Object.entries(statusCounts)) {
        logger.info(`  - ${status}: ${count}`);
      }
    }

    const is_valid = validation_errors.length === 0 &&
      missing_payments.length === 0 &&
      orphaned_payments.length === 0 &&
      amount_discrepancies.length === 0;

    const result: ValidationResult = {
      is_valid,
      total_mysql_payments: totalMysqlPayments,
      total_pg_payments: totalPgPayments || 0,
      missing_payments,
      orphaned_payments,
      booking_payment_mismatches,
      amount_discrepancies,
      validation_errors,
    };

    // Save validation results
    await fs.writeFile(
      path.join(tempDir, "payment-validation-results.json"),
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
      logger.info("✅ Payment migration validation PASSED");
    } else {
      logger.error("❌ Payment migration validation FAILED");
      if (validation_errors.length > 0) {
        logger.error("Validation errors:");
        validation_errors.forEach((error) => logger.error(`  - ${error}`));
      }
    }

    logger.info("Validation summary:");
    logger.info(`  - Total MySQL payments: ${totalMysqlPayments}`);
    logger.info(`  - Expected migrated payments: ${expectedPayments.length}`);
    logger.info(`  - Total PostgreSQL payments: ${totalPgPayments || 0}`);
    logger.info(`  - Missing payments: ${missing_payments.length}`);
    logger.info(`  - Orphaned payments: ${orphaned_payments.length}`);
    logger.info(
      `  - Booking-payment mismatches: ${booking_payment_mismatches}`,
    );
    logger.info(`  - Amount discrepancies: ${amount_discrepancies.length}`);

    return result;
  } catch (error) {
    logger.error("Payment validation failed:", error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  validatePayments()
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

export { validatePayments, type ValidationResult };
