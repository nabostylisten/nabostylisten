import type { SeedClient } from "@snaplet/seed";
import { subDays } from "date-fns";

/**
 * Creates payment records for testing the payment processing system
 * Includes various payment statuses and affiliate commissions
 */
export async function createPaymentRecords(seed: SeedClient, bookings: any[], stylistUsers: any[]) {
  console.log("-- Creating payment records...");

  try {
    await seed.payments([
      {
        booking_id: bookings[0].id, // Upcoming confirmed booking with affiliate
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
        status: "requires_capture",
        authorized_at: subDays(new Date(), 1),
      },
      {
        booking_id: bookings[2].id, // Completed lash extensions
        payment_intent_id: "pi_test_completed_003",
        original_amount: 2500, // 2500 NOK
        discount_amount: 0,
        final_amount: 2500,
        platform_fee: 500, // 20% platform fee in NOK
        stylist_payout: 2000, // 80% to stylist in NOK
        affiliate_commission: 0, // No affiliate for this booking
        affiliate_id: null, // No affiliate
        affiliate_commission_percentage: null, // No affiliate
        stripe_application_fee_amount: 50000, // 500 NOK in øre for Stripe
        currency: "NOK",
        status: "succeeded",
        succeeded_at: subDays(new Date(), 29),
        payout_completed_at: subDays(new Date(), 28),
      },
      {
        booking_id: bookings[5].id, // Completed bryn services
        payment_intent_id: "pi_test_multiple_services_006",
        original_amount: 1400, // 1400 NOK
        discount_amount: 0,
        final_amount: 1400,
        platform_fee: 280, // 20% platform fee in NOK
        stylist_payout: 1120, // 80% to stylist in NOK
        affiliate_commission: 0, // No affiliate for this booking
        affiliate_id: null, // No affiliate
        affiliate_commission_percentage: null, // No affiliate
        stripe_application_fee_amount: 28000, // 280 NOK in øre for Stripe
        currency: "NOK",
        status: "succeeded",
        succeeded_at: subDays(new Date(), 44),
        payout_completed_at: subDays(new Date(), 43),
      },
    ]);
  } catch (error) {
    console.log(`-- Error creating payments: ${error.message}`);
    console.log("-- Skipping payment records for now...");
  }
}