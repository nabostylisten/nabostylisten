import type { bookingsScalars, SeedClient, usersScalars } from "@snaplet/seed";
import { subDays, addDays } from "date-fns";

/**
 * Creates payment records for testing the payment processing system
 * Includes various payment statuses and affiliate commissions
 * 
 * IMPORTANT: These payment records are designed to work with the dev tools:
 * - Payments with status "requires_capture" have captured_at: NULL (not yet captured)
 * - Payments with status "succeeded" have captured_at set but payout_completed_at: NULL
 * - This aligns with the capturePaymentBeforeAppointment function which checks payments.captured_at
 * - Booking records have payment_captured_at/payout_processed_at: NULL for dev tools testing
 * - Payment dates are relative to today for realistic testing
 */
export async function createPaymentRecords(
  seed: SeedClient,
  bookings: bookingsScalars[],
  stylistUsers: usersScalars[],
) {
  console.log("-- Creating payment records for dev tools testing...");
  console.log("--   → Creating payments with 'requires_capture' status for testing payment capture");
  console.log("--   → Creating completed payments without payouts for testing payout processing");

  try {
    await seed.payments([
      // PAYMENT 1: Ready for capture - Confirmed booking with discount (booking[0])
      {
        booking_id: bookings[0].id, // Confirmed booking - Kari's balayage (7 days from now)
        payment_intent_id: "pi_test_upcoming_confirmed_001",
        original_amount: 2000, // 2000 NOK before discount
        discount_amount: 400, // 20% discount applied
        final_amount: 1600, // After discount
        platform_fee: 320, // 20% platform fee of final amount in NOK
        stylist_payout: 1280, // 80% to stylist in NOK
        affiliate_commission: 64, // 20% of platform fee for affiliate
        affiliate_id: stylistUsers[0].id, // Maria Hansen as affiliate
        affiliate_commission_percentage: 0.20, // 20% commission as decimal
        stripe_application_fee_amount: 32000, // 320 NOK in øre for Stripe
        currency: "NOK",
        status: "requires_capture", // THIS WILL BE CAPTURED BY DEV TOOLS
        authorized_at: subDays(new Date(), 1),
        captured_at: null, // NULL - not yet captured
        succeeded_at: null, // NULL - not yet succeeded
      },
      
      // PAYMENT 2: Wedding booking ready for capture (booking[4])
      {
        booking_id: bookings[4].id, // Confirmed wedding booking - Ole's wedding (14 days from now)
        payment_intent_id: "pi_test_wedding_005",
        original_amount: 3000,
        discount_amount: 100, // SOMMER100 discount
        final_amount: 2900,
        platform_fee: 580,
        stylist_payout: 2320,
        affiliate_commission: 0,
        affiliate_id: null,
        affiliate_commission_percentage: null,
        stripe_application_fee_amount: 58000,
        currency: "NOK",
        status: "requires_capture", // THIS WILL BE CAPTURED BY DEV TOOLS
        authorized_at: subDays(new Date(), 2),
        captured_at: null, // NULL - not yet captured
        succeeded_at: null, // NULL - not yet succeeded
      },
      
      // PAYMENT 3: Another confirmed booking ready for capture (booking[8])
      {
        booking_id: bookings[8].id, // Confirmed booking - conference styling (5 days from now)
        payment_intent_id: "pi_test_needs_capture_004",
        original_amount: 1500,
        discount_amount: 0,
        final_amount: 1500,
        platform_fee: 300,
        stylist_payout: 1200,
        affiliate_commission: 0,
        affiliate_id: null,
        affiliate_commission_percentage: null,
        stripe_application_fee_amount: 30000,
        currency: "NOK",
        status: "requires_capture", // THIS WILL BE CAPTURED BY DEV TOOLS
        authorized_at: new Date(),
        captured_at: null, // NULL - not yet captured
        succeeded_at: null, // NULL - not yet succeeded
      },
      
      // PAYMENT 4: Completed booking needing payout (booking[2])
      {
        booking_id: bookings[2].id, // Completed booking - Kari's lash extensions (30 days ago)
        payment_intent_id: "pi_test_completed_003",
        original_amount: 2500,
        discount_amount: 0,
        final_amount: 2500,
        platform_fee: 500,
        stylist_payout: 2000,
        affiliate_commission: 0,
        affiliate_id: null,
        affiliate_commission_percentage: null,
        stripe_application_fee_amount: 50000,
        currency: "NOK",
        status: "succeeded",
        captured_at: subDays(new Date(), 31), // Captured before service
        succeeded_at: subDays(new Date(), 30),
        payout_completed_at: null, // NULL - WILL BE PROCESSED BY DEV TOOLS
      },
      
      // PAYMENT 5: Completed booking needing payout (booking[5])
      {
        booking_id: bookings[5].id, // Completed booking - eyebrow treatment (3 days ago)
        payment_intent_id: "pi_test_needs_payout_002",
        original_amount: 1400,
        discount_amount: 0,
        final_amount: 1400,
        platform_fee: 280,
        stylist_payout: 1120,
        affiliate_commission: 0,
        affiliate_id: null,
        affiliate_commission_percentage: null,
        stripe_application_fee_amount: 28000,
        currency: "NOK",
        status: "succeeded",
        captured_at: subDays(new Date(), 4), // Captured before service
        succeeded_at: subDays(new Date(), 3),
        payout_completed_at: null, // NULL - WILL BE PROCESSED BY DEV TOOLS
      },
      
      // PAYMENT 6: Recently completed booking needing payout (booking[6])
      {
        booking_id: bookings[6].id, // Completed booking - nails for party (yesterday)
        payment_intent_id: "pi_test_needs_payout_003",
        original_amount: 1800,
        discount_amount: 0,
        final_amount: 1800,
        platform_fee: 360,
        stylist_payout: 1440,
        affiliate_commission: 0,
        affiliate_id: null,
        affiliate_commission_percentage: null,
        stripe_application_fee_amount: 36000,
        currency: "NOK",
        status: "succeeded",
        captured_at: subDays(new Date(), 2), // Captured before service
        succeeded_at: subDays(new Date(), 1),
        payout_completed_at: null, // NULL - WILL BE PROCESSED BY DEV TOOLS
      },
      
      // PAYMENT 7: Already fully processed (for comparison) (booking[7])
      {
        booking_id: bookings[7].id, // Completed booking - already has payout (10 days ago)
        payment_intent_id: "pi_test_fully_processed_001",
        original_amount: 2200,
        discount_amount: 0,
        final_amount: 2200,
        platform_fee: 440,
        stylist_payout: 1760,
        affiliate_commission: 0,
        affiliate_id: null,
        affiliate_commission_percentage: null,
        stripe_application_fee_amount: 44000,
        currency: "NOK",
        status: "succeeded",
        captured_at: subDays(new Date(), 11), // Captured before service
        succeeded_at: subDays(new Date(), 10),
        payout_completed_at: subDays(new Date(), 9), // Already has payout - NOT for dev tools
      },
    ]);
  } catch (error) {
    console.log(
      `-- Error creating payments: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
    console.log("-- Skipping payment records for now...");
  }
}
