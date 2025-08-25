import type { SeedClient } from "@snaplet/seed";
import { subDays } from "date-fns";

/**
 * Creates affiliate applications for testing the affiliate program workflow
 * Includes both approved and pending applications
 */
export async function createAffiliateApplications(seed: SeedClient, stylistUsers: any[], allUsers: any[]) {
  console.log("-- Creating affiliate system test data...");

  const { affiliate_applications } = await seed.affiliate_applications([
    {
      stylist_id: stylistUsers[0].id, // Maria Hansen
      reason: "Jeg vil gjerne hjelpe andre stylister finne gode kunder gjennom plattformen.",
      marketing_strategy: "Jeg har 5000 følgere på Instagram og deler regelmessig tips og før/etter bilder.",
      expected_referrals: 10,
      social_media_reach: 5000,
      status: "approved",
      reviewed_by: allUsers[0].id, // Admin user
      reviewed_at: subDays(new Date(), 5),
      review_notes: "Erfaren stylist med god online tilstedeværelse. Godkjent.",
      terms_accepted: true,
      terms_accepted_at: subDays(new Date(), 6),
    },
    {
      stylist_id: stylistUsers[1].id, // Sophia Larsen
      reason: "Ønsker å dele plattformen med mine kolleger og kunder som spør om andre tjenester.",
      marketing_strategy: "Deler på Facebook-side med 2000 følgere og gjennom mund-til-munn markedsføring.",
      expected_referrals: 5,
      social_media_reach: 2000,
      status: "pending",
      terms_accepted: true,
      terms_accepted_at: subDays(new Date(), 2),
    },
  ]);

  return affiliate_applications;
}

/**
 * Creates affiliate links for approved applications with tracking data
 */
export async function createAffiliateLinksAndTracking(
  seed: SeedClient, 
  stylistUsers: any[], 
  affiliate_applications: any[]
) {
  console.log("-- Creating affiliate links and tracking data...");

  // Create affiliate link for approved application
  const { affiliate_links } = await seed.affiliate_links([
    {
      stylist_id: stylistUsers[0].id, // Maria Hansen
      application_id: affiliate_applications[0].id,
      link_code: "maria-hair-oslo",
      commission_percentage: 0.20, // 20% commission as decimal
      is_active: true,
      click_count: 45,
      conversion_count: 8,
      total_commission_earned: 320.50,
      notes: "Performant affiliate med gode konverteringer.",
    },
  ]);

  return affiliate_links;
}

/**
 * Creates affiliate clicks for testing the tracking system
 * Includes both converted and non-converted clicks
 */
export async function createAffiliateClickTracking(
  seed: SeedClient, 
  affiliate_links: any[], 
  stylistUsers: any[], 
  customerUsers: any[], 
  bookings: any[]
) {
  console.log("-- Creating affiliate click tracking data...");

  await seed.affiliate_clicks([
    {
      affiliate_link_id: affiliate_links[0].id,
      stylist_id: stylistUsers[0].id,
      visitor_id: "visitor_12345",
      user_id: customerUsers[0].id, // Kari clicked the link
      ip_address: "192.168.1.1",
      user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
      referrer: "https://instagram.com",
      landing_page: "/",
      country_code: "NO",
      city: "Oslo",
      converted: true,
      converted_at: subDays(new Date(), 25),
      booking_id: bookings[0].id, // Converted to the balayage booking
      commission_amount: 80, // 20% of 400 NOK platform fee
    },
    {
      affiliate_link_id: affiliate_links[0].id,
      stylist_id: stylistUsers[0].id,
      visitor_id: "visitor_67890",
      ip_address: "10.0.0.1",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      referrer: "https://facebook.com",
      landing_page: "/services",
      country_code: "NO",
      city: "Bergen",
      converted: false, // Clicked but didn't convert
    },
  ]);
}