import { createSeedClient } from "@snaplet/seed";
import {
  addImagesToServices,
  createAdditionalCustomerAddresses,
  // Affiliate system
  createAffiliateApplications,
  createAffiliateClickTracking,
  createAffiliateCommissions,
  createAffiliateLinksAndTracking,
  createAffiliatePayouts,
  // Chat system
  createCustomerStylistChats,
  // Booking system
  createBookingNotes,
  createComprehensiveBookings,
  // Review system
  createComprehensiveReviewsSystem,
  createCurrentChatMessages,
  createCustomerPrimaryAddresses,
  // Discounts
  createDiscountCodes,
  createDiscountRestrictions,
  createDiscountUsage,
  // Service categories
  createMainServiceCategories,
  createOldChatMessagesForCronTesting,
  // Payment system
  createPaymentRecords,
  // Service management
  createRandomizedServices,
  createServiceSubcategories,
  // Address management
  createStylistAddresses,
  // Applications
  createStylistApplications,
  createStylistAvailabilityRules,
  // Stylist management
  createStylistDetailedProfiles,
  createStylistRecurringUnavailability,
  createStylistUnavailabilityPeriods,
  // User management
  createTestUsersWithAuth,
  createUserEmailIdentities,
  linkApplicationsToCategories,
  linkServicesToBookings,
  separateUsersByRole,
} from "./utils";

/**
 * Main seed function that orchestrates the entire database seeding process
 * Creates a comprehensive test dataset for the Nabostylisten platform
 */
async function main() {
  console.log("-- Starting comprehensive database seeding...");
  const seed = await createSeedClient({ dryRun: true });

  // Clear existing data
  await seed.$resetDatabase();

  // 1. Create service category hierarchy
  console.log("-- Phase 1: Service Categories");
  const mainCategories = await createMainServiceCategories(seed);
  await createServiceSubcategories(seed, mainCategories);

  // 2. Create users with authentication
  console.log("-- Phase 2: User Management");
  const allUsers = await createTestUsersWithAuth(seed);
  await createUserEmailIdentities(seed, allUsers);
  const { stylistUsers, customerUsers } = separateUsersByRole(allUsers);

  // 3. Create stylist profiles and availability
  console.log("-- Phase 3: Stylist Management");
  await createStylistDetailedProfiles(seed, stylistUsers);
  await createStylistAvailabilityRules(seed, stylistUsers);
  await createStylistUnavailabilityPeriods(seed, stylistUsers);
  await createStylistRecurringUnavailability(seed, stylistUsers);

  // 4. Create addresses for users
  console.log("-- Phase 4: Address Management");
  await createStylistAddresses(seed, stylistUsers);
  await createCustomerPrimaryAddresses(seed, customerUsers);
  const customerAddresses = await createAdditionalCustomerAddresses(
    seed,
    customerUsers,
  );

  // 5. Create services and media
  console.log("-- Phase 5: Service Management");
  const { services } = await createRandomizedServices(
    seed,
    stylistUsers,
    mainCategories,
  );
  await addImagesToServices(seed, services);

  // 6. Create applications
  console.log("-- Phase 6: Application Management");
  const applications = await createStylistApplications(seed);
  await linkApplicationsToCategories(seed, applications, mainCategories);

  // 7. Create discount codes and user restrictions
  console.log("-- Phase 7: Discount Management");
  const discounts = await createDiscountCodes(seed);
  await createDiscountRestrictions(seed, discounts, allUsers);

  // 8. Create comprehensive booking system
  console.log("-- Phase 8: Booking System");
  const bookings = await createComprehensiveBookings(
    seed,
    customerUsers,
    stylistUsers,
    discounts,
    customerAddresses,
  );
  const bookingServiceLinks = await linkServicesToBookings(
    seed,
    bookings,
    services,
  );

  // Create discount usage records after bookings are available
  console.log("-- Creating discount usage records...");
  await createDiscountUsage(seed, discounts, allUsers, bookings);

  // Create booking notes for completed bookings
  console.log("-- Creating booking notes...");
  await createBookingNotes(seed, bookings);

  // 9. Create chat system
  console.log("-- Phase 9: Chat System");
  const chats = await createCustomerStylistChats(
    seed,
    customerUsers,
    stylistUsers,
  );
  await createOldChatMessagesForCronTesting(
    seed,
    chats,
    customerUsers,
    stylistUsers,
  );
  await createCurrentChatMessages(seed, chats, customerUsers, stylistUsers);

  // 10. Create affiliate system
  console.log("-- Phase 10: Affiliate System");
  const affiliate_applications = await createAffiliateApplications(
    seed,
    stylistUsers,
    allUsers,
  );
  const affiliate_links = await createAffiliateLinksAndTracking(
    seed,
    stylistUsers,
    affiliate_applications,
  );
  await createAffiliateClickTracking(
    seed,
    affiliate_links,
    stylistUsers,
    customerUsers,
    bookings,
  );
  const affiliate_commissions = await createAffiliateCommissions(
    seed,
    affiliate_links,
    stylistUsers,
    bookings,
  );
  await createAffiliatePayouts(
    seed,
    affiliate_links,
    affiliate_commissions,
    stylistUsers,
    allUsers,
  );

  // 11. Create payment records
  console.log("-- Phase 11: Payment System");
  await createPaymentRecords(seed, bookings, stylistUsers);

  // 12. Create comprehensive review system
  console.log("-- Phase 12: Review System");
  await createComprehensiveReviewsSystem(
    seed,
    bookings,
    services,
    customerUsers,
    stylistUsers,
    bookingServiceLinks,
  );

  console.log("--  Database seeding completed successfully!");
  console.log("-- ");
  console.log("-- =� Seeding Summary:");
  console.log(
    `--   =e Users: ${allUsers.length} (${stylistUsers.length} stylists, ${customerUsers.length} customers)`,
  );
  console.log(
    `--   <�  Service categories: ${mainCategories.length} main categories with subcategories`,
  );
  console.log(
    `--   =� Services: ${services.length} services with images and category links`,
  );
  console.log(
    `--   =� Bookings: ${bookings.length} bookings across various statuses with notes`,
  );
  console.log(`--   =� Chats: ${chats.length} active chat conversations`);
  console.log(
    `--   =� Discounts: ${discounts.length} discount codes for testing`,
  );
  console.log(
    `--   > Applications: ${applications.length} stylist applications`,
  );
  console.log(
    `--   🤝 Affiliates: ${affiliate_applications.length} applications, ${affiliate_links.length} codes (active, expired, suspended)`,
  );
  console.log(
    `--   💰 Commissions: ${affiliate_commissions.length} commission records with payouts`,
  );
  console.log("-- ");
  console.log("-- >� Test Accounts:");
  console.log("--   =d Admin: admin@nabostylisten.no");
  console.log("--   <� Stylist: maria.hansen@example.com (Oslo)");
  console.log(
    "--   =�  Customer: kari.nordmann@example.com (multiple bookings)",
  );
  console.log("--   = Password for all: demo-password");
  console.log("-- ");
  console.log("-- = Cron Job Testing:");
  console.log("--   =� Old chat messages added for cleanup testing");
  console.log("--   =' Test endpoint: GET /api/cron/cleanup-old-messages");
  console.log("--   = Remember to set CRON_SECRET environment variable");

  process.exit(0);
}

main().catch((e) => {
  console.error("-- L Seed failed:", e);
  process.exit(1);
});
