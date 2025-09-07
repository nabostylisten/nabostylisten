import type {
  affiliate_applicationsScalars,
  affiliate_linksScalars,
  affiliate_commissionsScalars,
  bookingsScalars,
  SeedClient,
  usersScalars,
} from "@snaplet/seed";
import { addDays, subDays } from "date-fns";

/**
 * Creates affiliate applications for testing the affiliate program workflow
 * Includes approved, pending, rejected, and suspended applications
 */
export async function createAffiliateApplications(
  seed: SeedClient,
  stylistUsers: usersScalars[],
  allUsers: usersScalars[],
) {
  console.log("-- Creating affiliate system test data...");

  const { affiliate_applications } = await seed.affiliate_applications([
    {
      stylist_id: stylistUsers[0].id, // Maria Hansen
      reason:
        "Jeg vil gjerne hjelpe andre stylister finne gode kunder gjennom plattformen.",
      marketing_strategy:
        "Jeg har 5000 følgere på Instagram og deler regelmessig tips og før/etter bilder.",
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
      reason:
        "Ønsker å dele plattformen med mine kolleger og kunder som spør om andre tjenester.",
      marketing_strategy:
        "Deler på Facebook-side med 2000 følgere og gjennom mund-til-munn markedsføring.",
      expected_referrals: 5,
      social_media_reach: 2000,
      status: "pending",
      terms_accepted: true,
      terms_accepted_at: subDays(new Date(), 2),
    },
    {
      stylist_id: stylistUsers[2].id, // Third stylist
      reason:
        "Vil tjene ekstra gjennom å henvise kunder til andre stylister på plattformen.",
      marketing_strategy:
        "Har ingen spesiell markedsføringsstrategi, bare tenkte det kunne være greit å tjene litt ekstra.",
      expected_referrals: 20,
      social_media_reach: 100,
      status: "rejected",
      reviewed_by: allUsers[0].id, // Admin user
      reviewed_at: subDays(new Date(), 3),
      review_notes: "Ingen klar markedsføringsstrategi. Virker kun interessert i økonomisk gevinst.",
      terms_accepted: true,
      terms_accepted_at: subDays(new Date(), 4),
    },
    {
      stylist_id: stylistUsers[3].id, // Fourth stylist
      reason:
        "Har bygd opp et sterkt nettverk av kunder som ofte spør om andre tjenester.",
      marketing_strategy:
        "Bruker TikTok og Instagram stories til å dele tips og anbefale andre stylister.",
      expected_referrals: 8,
      social_media_reach: 3000,
      status: "approved",
      reviewed_by: allUsers[0].id, // Admin user
      reviewed_at: subDays(new Date(), 10),
      review_notes: "God tilnærming til deling og nettverk. Godkjent.",
      terms_accepted: true,
      terms_accepted_at: subDays(new Date(), 11),
    },
    {
      stylist_id: stylistUsers[4].id, // Fifth stylist
      reason:
        "Ønsker å hjelpe andre stylister og bygge et sterkere fellesskap.",
      marketing_strategy:
        "Blogger om skjønhet og deler erfaringer med andre stylister.",
      expected_referrals: 6,
      social_media_reach: 1500,
      status: "suspended",
      reviewed_by: allUsers[0].id, // Admin user
      reviewed_at: subDays(new Date(), 20),
      review_notes: "Tidligere godkjent, men suspendert på grunn av spam-aktivitet.",
      terms_accepted: true,
      terms_accepted_at: subDays(new Date(), 25),
    },
  ]);

  return affiliate_applications;
}

/**
 * Creates affiliate links for approved applications with tracking data
 * Includes active, inactive, and expired links for comprehensive testing
 */
export async function createAffiliateLinksAndTracking(
  seed: SeedClient,
  stylistUsers: usersScalars[],
  affiliate_applications: affiliate_applicationsScalars[],
) {
  console.log("-- Creating affiliate links and tracking data...");

  // Create affiliate links for approved applications
  const { affiliate_links } = await seed.affiliate_links([
    {
      stylist_id: stylistUsers[0].id, // Maria Hansen - Active link
      application_id: affiliate_applications[0].id,
      link_code: "MARIA-HAIR-OSLO",
      commission_percentage: 0.20, // 20% commission as decimal
      is_active: true,
      expires_at: addDays(new Date(), 365), // Expires in 1 year
      click_count: 45,
      conversion_count: 8,
      total_commission_earned: 1240.50,
      notes: "Performant affiliate med gode konverteringer.",
    },
    {
      stylist_id: stylistUsers[3].id, // Fourth stylist - Active link with different performance
      application_id: affiliate_applications[3].id,
      link_code: "EMMA-BEAUTY-BERGEN",
      commission_percentage: 0.15, // 15% commission as decimal
      is_active: true,
      expires_at: addDays(new Date(), 180), // Expires in 6 months
      click_count: 23,
      conversion_count: 3,
      total_commission_earned: 450.75,
      notes: "Ny affiliate med lovende start.",
    },
    {
      stylist_id: stylistUsers[4].id, // Fifth stylist - Inactive (suspended)
      application_id: affiliate_applications[4].id,
      link_code: "SUSPENDED-CODE",
      commission_percentage: 0.18,
      is_active: false, // Inactive due to suspension
      expires_at: addDays(new Date(), 90), // Would expire in 3 months but is inactive
      click_count: 67,
      conversion_count: 12,
      total_commission_earned: 890.25,
      notes: "Deaktivert på grunn av suspensjon av affiliate.",
    },
    {
      stylist_id: stylistUsers[1].id, // Create expired link for testing
      application_id: affiliate_applications[1].id, // Use pending application ID (will need manual update)
      link_code: "EXPIRED-TEST-CODE",
      commission_percentage: 0.25,
      is_active: true,
      expires_at: subDays(new Date(), 10), // Expired 10 days ago - THIS is the expired test case
      click_count: 5,
      conversion_count: 0,
      total_commission_earned: 0,
      notes: "Testlink som har utløpt for testing av lifecycle.",
    },
  ]);

  return affiliate_links;
}

/**
 * Creates affiliate clicks for testing the tracking system
 * Includes both converted and non-converted clicks from multiple sources
 */
export async function createAffiliateClickTracking(
  seed: SeedClient,
  affiliate_links: affiliate_linksScalars[],
  stylistUsers: usersScalars[],
  customerUsers: usersScalars[],
  bookings: bookingsScalars[],
) {
  console.log("-- Creating affiliate click tracking data...");

  await seed.affiliate_clicks([
    // Maria's active link - converted clicks
    {
      affiliate_link_id: affiliate_links[0].id, // MARIA-HAIR-OSLO
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
      booking_id: bookings[0].id, // Converted to booking
      commission_amount: 120.50, // Commission earned
    },
    {
      affiliate_link_id: affiliate_links[0].id, // MARIA-HAIR-OSLO
      stylist_id: stylistUsers[0].id,
      visitor_id: "visitor_67890",
      user_id: customerUsers[1].id,
      ip_address: "10.0.0.1",
      user_agent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      referrer: "https://facebook.com",
      landing_page: "/services",
      country_code: "NO",
      city: "Bergen",
      converted: true,
      converted_at: subDays(new Date(), 15),
      booking_id: bookings[1].id,
      commission_amount: 95.75,
    },
    // Maria's active link - non-converted clicks
    {
      affiliate_link_id: affiliate_links[0].id, // MARIA-HAIR-OSLO
      stylist_id: stylistUsers[0].id,
      visitor_id: "visitor_anonymous_1",
      ip_address: "203.45.67.89",
      user_agent: "Mozilla/5.0 (Android 10; Mobile; rv:85.0) Gecko/85.0",
      referrer: "https://tiktok.com",
      landing_page: "/",
      country_code: "NO",
      city: "Trondheim",
      converted: false, // Just browsed, didn't book
    },
    // Emma's active link - some activity
    {
      affiliate_link_id: affiliate_links[1].id, // EMMA-BEAUTY-BERGEN
      stylist_id: stylistUsers[3].id,
      visitor_id: "visitor_54321",
      user_id: customerUsers[2].id,
      ip_address: "85.164.123.45",
      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      referrer: "https://instagram.com",
      landing_page: "/services",
      country_code: "NO",
      city: "Bergen",
      converted: true,
      converted_at: subDays(new Date(), 8),
      booking_id: bookings[2].id,
      commission_amount: 67.25,
    },
    // Suspended link - clicks before suspension
    {
      affiliate_link_id: affiliate_links[2].id, // SUSPENDED-CODE
      stylist_id: stylistUsers[4].id,
      visitor_id: "visitor_old_1",
      user_id: customerUsers[3].id,
      ip_address: "192.168.10.5",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      referrer: "https://google.com",
      landing_page: "/",
      country_code: "NO",
      city: "Oslo",
      converted: true,
      converted_at: subDays(new Date(), 30), // Before suspension
      booking_id: bookings[3].id,
      commission_amount: 145.80,
    },
    // Expired link - clicks that happened before expiration
    {
      affiliate_link_id: affiliate_links[3].id, // EXPIRED-TEST-CODE
      stylist_id: stylistUsers[1].id,
      visitor_id: "visitor_expired_1",
      ip_address: "129.45.67.23",
      user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
      referrer: "https://facebook.com",
      landing_page: "/services",
      country_code: "NO",
      city: "Stavanger",
      converted: false, // Clicked before expiration but never converted
      created_at: subDays(new Date(), 15), // Before expiration
    },
  ]);
}

/**
 * Creates affiliate commission records for testing payout workflows
 */
export async function createAffiliateCommissions(
  seed: SeedClient,
  affiliate_links: affiliate_linksScalars[],
  stylistUsers: usersScalars[],
  bookings: bookingsScalars[],
) {
  console.log("-- Creating affiliate commission records...");

  const { affiliate_commissions } = await seed.affiliate_commissions([
    {
      booking_id: bookings[0].id, // From converted click
      affiliate_id: stylistUsers[0].id, // Maria Hansen
      amount: 120.50,
      currency: "NOK",
      commission_percentage: 20.00, // 20%
      status: "paid", // Already paid out
      paid_at: subDays(new Date(), 5),
      notes: "Commission for balayage booking via MARIA-HAIR-OSLO code",
    },
    {
      booking_id: bookings[1].id,
      affiliate_id: stylistUsers[0].id, // Maria Hansen
      amount: 95.75,
      currency: "NOK",
      commission_percentage: 20.00,
      status: "pending", // Awaiting payout
      notes: "Commission for color treatment via MARIA-HAIR-OSLO code",
    },
    {
      booking_id: bookings[2].id,
      affiliate_id: stylistUsers[3].id, // Emma (4th stylist)
      amount: 67.25,
      currency: "NOK",
      commission_percentage: 15.00, // 15%
      status: "pending",
      notes: "Commission for manicure via EMMA-BEAUTY-BERGEN code",
    },
    {
      booking_id: bookings[3].id,
      affiliate_id: stylistUsers[4].id, // Suspended stylist
      amount: 145.80,
      currency: "NOK",
      commission_percentage: 18.00, // 18%
      status: "paid", // Was paid before suspension
      paid_at: subDays(new Date(), 25),
      notes: "Commission earned before account suspension",
    },
    {
      booking_id: bookings[4].id, // Additional commission
      affiliate_id: stylistUsers[0].id, // Maria Hansen
      amount: 78.90,
      currency: "NOK",
      commission_percentage: 20.00,
      status: "pending",
      notes: "Commission for hair styling via MARIA-HAIR-OSLO code",
    },
  ]);

  return affiliate_commissions;
}

/**
 * Creates affiliate payout records for testing payout management
 */
export async function createAffiliatePayouts(
  seed: SeedClient,
  affiliate_links: affiliate_linksScalars[],
  affiliate_commissions: affiliate_commissionsScalars[],
  stylistUsers: usersScalars[],
  allUsers: usersScalars[],
) {
  console.log("-- Creating affiliate payout records...");

  await seed.affiliate_payouts([
    {
      stylist_id: stylistUsers[0].id, // Maria Hansen
      affiliate_link_id: affiliate_links[0].id,
      payout_amount: 120.50,
      currency: "NOK",
      period_start: subDays(new Date(), 35),
      period_end: subDays(new Date(), 6),
      total_bookings: 1,
      total_commission_earned: 120.50,
      status: "paid",
      processed_by: allUsers[0].id, // Admin user
      processed_at: subDays(new Date(), 5),
      stripe_transfer_id: "tr_test_1234567890abcdef",
      stripe_payout_id: "po_test_abcdef1234567890",
      email_sent: true,
      notes: "Monthly payout for September 2024",
    },
    {
      stylist_id: stylistUsers[4].id, // Suspended stylist - final payout before suspension
      affiliate_link_id: affiliate_links[2].id,
      payout_amount: 145.80,
      currency: "NOK",
      period_start: subDays(new Date(), 60),
      period_end: subDays(new Date(), 31),
      total_bookings: 1,
      total_commission_earned: 145.80,
      status: "paid",
      processed_by: allUsers[0].id, // Admin user
      processed_at: subDays(new Date(), 25),
      stripe_transfer_id: "tr_test_suspended_final",
      email_sent: true,
      notes: "Final payout before account suspension",
    },
    {
      stylist_id: stylistUsers[0].id, // Maria Hansen - pending payout
      affiliate_link_id: affiliate_links[0].id,
      payout_amount: 174.65, // 95.75 + 78.90 from pending commissions
      currency: "NOK",
      period_start: subDays(new Date(), 30),
      period_end: new Date(),
      total_bookings: 2,
      total_commission_earned: 174.65,
      status: "pending",
      email_sent: false,
      notes: "Accumulated commissions for current period",
    },
    {
      stylist_id: stylistUsers[3].id, // Emma - first payout pending
      affiliate_link_id: affiliate_links[1].id,
      payout_amount: 67.25,
      currency: "NOK",
      period_start: subDays(new Date(), 14),
      period_end: new Date(),
      total_bookings: 1,
      total_commission_earned: 67.25,
      status: "processing",
      processed_by: allUsers[0].id, // Admin started processing
      processed_at: subDays(new Date(), 1),
      email_sent: false,
      notes: "First payout for new affiliate",
    },
  ]);
}
