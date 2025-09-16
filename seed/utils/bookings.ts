import type {
  addressesScalars,
  bookingsScalars,
  discountsScalars,
  SeedClient,
  servicesScalars,
  usersScalars,
} from "@snaplet/seed";
import type { DatabaseTables } from "../../types/index";
import { addDays, addMinutes, subDays } from "date-fns";

/**
 * Creates comprehensive bookings for testing including various statuses and scenarios
 * Includes specific test bookings and additional random bookings for pagination testing
 */
export async function createComprehensiveBookings(
  seed: SeedClient,
  customerUsers: usersScalars[],
  stylistUsers: usersScalars[],
  discounts: discountsScalars[],
  customerAddresses: addressesScalars[],
) {
  console.log("-- Creating comprehensive bookings for testing...");

  const allBookingsToCreate: DatabaseTables["bookings"]["Insert"][] = [];

  // Add the specific test bookings first
  const specificBookings = createSpecificTestBookings(
    customerUsers,
    stylistUsers,
    discounts,
    customerAddresses,
  );
  allBookingsToCreate.push(...specificBookings);

  // Generate additional bookings for pagination testing
  const additionalBookings = generateAdditionalBookings(
    customerUsers,
    stylistUsers,
    customerAddresses,
    20,
  );
  allBookingsToCreate.push(...additionalBookings);

  const { bookings } = await seed.bookings(allBookingsToCreate);

  console.log(`-- Created ${bookings.length} total bookings`);
  return bookings;
}

/**
 * Creates specific test bookings with known scenarios for testing
 */
function createSpecificTestBookings(
  customerUsers: usersScalars[],
  stylistUsers: usersScalars[],
  discounts: discountsScalars[],
  customerAddresses: addressesScalars[],
): DatabaseTables["bookings"]["Insert"][] {
  return [
    // 1. Upcoming confirmed booking with discount - Kari Nordmann
    // PAYMENT NEEDS CAPTURE - for dev tools testing
    {
      customer_id: customerUsers[0].id, // Kari Nordmann
      stylist_id: stylistUsers[0].id, // Maria Hansen
      start_time: addDays(new Date(), 7).toISOString(), // Next week
      end_time: addMinutes(addDays(new Date(), 7), 90).toISOString(), // 90 minutes later
      message_to_stylist:
        "Håper du kan hjelpe meg med en fin balayage som passer til hudfarge!",
      status: "confirmed",
      address_id: null, // At stylist's place
      discount_id: discounts[0].id, // VELKOMMEN20
      discount_applied: 400, // 20% of 2000 NOK
      total_price: 1600, // After discount
      total_duration_minutes: 90,
      stripe_payment_intent_id: "pi_test_upcoming_confirmed_001",
      payment_captured_at: null, // NULL - needs capture for dev tools testing
    },

    // 2. Upcoming pending booking at customer's place - Kari Nordmann
    {
      customer_id: customerUsers[0].id, // Kari Nordmann
      stylist_id: stylistUsers[1].id, // Emma Nilsen
      start_time: addDays(new Date(), 3).toISOString(), // In 3 days
      end_time: addMinutes(addDays(new Date(), 3), 60).toISOString(), // 60 minutes later
      message_to_stylist: "Første gang jeg skal ha festmakeup, er litt nervøs!",
      status: "pending",
      address_id: customerAddresses[0].id, // At customer's sommerhus
      discount_id: null,
      discount_applied: 0,
      total_price: 1200,
      total_duration_minutes: 60,
      stripe_payment_intent_id: "pi_test_upcoming_pending_002",
    },

    // 3. Completed booking from last month - Kari Nordmann
    {
      customer_id: customerUsers[0].id, // Kari Nordmann
      stylist_id: stylistUsers[2].id, // Sophia Larsen
      start_time: subDays(new Date(), 30).toISOString(), // 30 days ago
      end_time: addMinutes(subDays(new Date(), 30), 120).toISOString(), // 120 minutes later
      message_to_stylist:
        "Trenger klassiske vipper for bryllupet til min søster",
      status: "completed",
      address_id: null, // At stylist's place
      discount_id: null,
      discount_applied: 0,
      total_price: 2500,
      total_duration_minutes: 120,
      stripe_payment_intent_id: "pi_test_completed_003",
    },

    // 4. Cancelled booking from last week - Kari Nordmann
    {
      customer_id: customerUsers[0].id, // Kari Nordmann
      stylist_id: stylistUsers[0].id, // Maria Hansen
      start_time: subDays(new Date(), 7).toISOString(), // 7 days ago
      end_time: addMinutes(subDays(new Date(), 7), 45).toISOString(), // 45 minutes later
      message_to_stylist: "Bare et enkelt klipp, takk!",
      status: "cancelled",
      cancelled_at: subDays(new Date(), 8).toISOString(), // Cancelled day before
      cancellation_reason: "Måtte reise på jobb uventet",
      address_id: null,
      discount_id: null,
      discount_applied: 0,
      total_price: 800,
      total_duration_minutes: 45,
      stripe_payment_intent_id: "pi_test_cancelled_004",
    },

    // 5. Upcoming wedding booking - Ole Hansen
    // PAYMENT NEEDS CAPTURE - for dev tools testing
    {
      customer_id: customerUsers[1].id, // Ole Hansen
      stylist_id: stylistUsers[1].id, // Emma Nilsen
      start_time: addDays(new Date(), 14).toISOString(), // In 2 weeks
      end_time: addMinutes(addDays(new Date(), 14), 180).toISOString(), // 3 hours later
      message_to_stylist:
        "Dette er til bryllupet mitt! Ønsker både makeup og hår til forloveden min. Vi møtes hjemme hos oss.",
      status: "confirmed",
      address_id: null, // Will be added as customer address in the booking
      discount_id: discounts[1].id, // SOMMER100
      discount_applied: 100,
      total_price: 2900, // 3000 - 100 discount
      total_duration_minutes: 180,
      stripe_payment_intent_id: "pi_test_wedding_005",
      payment_captured_at: null, // NULL - needs capture for dev tools testing
    },

    // 6. COMPLETED booking - needs payout processing
    {
      customer_id: customerUsers[2].id,
      stylist_id: stylistUsers[0].id,
      start_time: subDays(new Date(), 3).toISOString(), // 3 days ago
      end_time: addMinutes(subDays(new Date(), 3), 70).toISOString(),
      message_to_stylist: "Vanlig brynspluking og farging",
      status: "completed", // COMPLETED - for payout testing
      address_id: null,
      discount_id: null,
      discount_applied: 0,
      total_price: 1400,
      total_duration_minutes: 70,
      stripe_payment_intent_id: "pi_test_needs_payout_002",
      payment_captured_at: subDays(new Date(), 4).toISOString(), // Captured before service
      payout_processed_at: null, // NULL - needs payout for dev tools testing
    },

    // 7. COMPLETED booking - needs payout processing
    {
      customer_id: customerUsers[1].id,
      stylist_id: stylistUsers[2].id,
      start_time: subDays(new Date(), 1).toISOString(), // Yesterday
      end_time: addMinutes(subDays(new Date(), 1), 90).toISOString(),
      message_to_stylist: "Negler til fest",
      status: "completed", // COMPLETED - for payout testing
      address_id: null,
      discount_id: null,
      discount_applied: 0,
      total_price: 1800,
      total_duration_minutes: 90,
      stripe_payment_intent_id: "pi_test_needs_payout_003",
      payment_captured_at: subDays(new Date(), 2).toISOString(), // Captured before service
      payout_processed_at: null, // NULL - needs payout for dev tools testing
    },

    // 8. COMPLETED booking - already has payout (for comparison)
    {
      customer_id: customerUsers[0].id,
      stylist_id: stylistUsers[1].id,
      start_time: subDays(new Date(), 10).toISOString(), // 10 days ago
      end_time: addMinutes(subDays(new Date(), 10), 60).toISOString(),
      message_to_stylist: "Klipp og farge",
      status: "completed",
      address_id: null,
      discount_id: null,
      discount_applied: 0,
      total_price: 2200,
      total_duration_minutes: 60,
      stripe_payment_intent_id: "pi_test_fully_processed_001",
      payment_captured_at: subDays(new Date(), 11).toISOString(),
      payout_processed_at: subDays(new Date(), 9).toISOString(), // Already has payout
    },

    // 9. Another CONFIRMED booking - needs payment capture
    {
      customer_id: customerUsers[2].id,
      stylist_id: stylistUsers[1].id,
      start_time: addDays(new Date(), 5).toISOString(), // In 5 days
      end_time: addMinutes(addDays(new Date(), 5), 60).toISOString(),
      message_to_stylist: "Klassisk hårstyling til konferanse",
      status: "confirmed", // CONFIRMED - for payment capture testing
      address_id: null,
      discount_id: null,
      discount_applied: 0,
      total_price: 1500,
      total_duration_minutes: 60,
      stripe_payment_intent_id: "pi_test_needs_capture_004",
      payment_captured_at: null, // NULL - needs capture for dev tools testing
    },

    // 10. Completed booking with multiple services - Ole Hansen
    {
      customer_id: customerUsers[1].id, // Ole Hansen
      stylist_id: stylistUsers[2].id, // Sophia Larsen
      start_time: subDays(new Date(), 45).toISOString(), // 45 days ago
      end_time: addMinutes(subDays(new Date(), 45), 75).toISOString(), // 75 minutes later
      message_to_stylist: "Både brynslaminering og forming, takk!",
      status: "completed",
      address_id: null,
      discount_id: null,
      discount_applied: 0,
      total_price: 1400,
      total_duration_minutes: 75,
      stripe_payment_intent_id: "pi_test_multiple_services_006",
    },
  ];
}

/**
 * Generates additional random bookings for pagination and volume testing
 */
function generateAdditionalBookings(
  customerUsers: usersScalars[],
  stylistUsers: usersScalars[],
  customerAddresses: addressesScalars[],
  count: number,
): DatabaseTables["bookings"]["Insert"][] {
  const statuses: Array<bookingsScalars["status"]> = [
    "confirmed",
    "completed",
    "pending",
    "cancelled",
  ];
  const messages = [
    "Gleder meg til timen!",
    "Første gang hos dere, er spent!",
    "Håper dere kan hjelpe meg med en fin look",
    "Trenger en quick fix før fest",
    "Vanlig trim og styling, takk",
    "Vil gjerne prøve noe nytt",
    "Samme som sist, det var perfekt",
    "Kan vi gjøre dette litt raskere denne gangen?",
  ];

  const bookings = [];

  for (let i = 0; i < count; i++) {
    const customer =
      customerUsers[Math.floor(Math.random() * customerUsers.length)];
    const stylist =
      stylistUsers[Math.floor(Math.random() * stylistUsers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const isUpcoming = Math.random() > 0.5;
    const baseDate = isUpcoming
      ? addDays(new Date(), Math.floor(Math.random() * 30))
      : subDays(new Date(), Math.floor(Math.random() * 60));
    const duration = 60 + (Math.floor(Math.random() * 3) * 30); // 60, 90, or 120 minutes
    const price = 800 + Math.floor(Math.random() * 1500); // 800-2300 NOK

    const bookingData: DatabaseTables["bookings"]["Insert"] = {
      customer_id: customer.id,
      stylist_id: stylist.id,
      start_time: baseDate.toISOString(),
      end_time: addMinutes(baseDate, duration).toISOString(),
      message_to_stylist: messages[Math.floor(Math.random() * messages.length)],
      status: status,
      address_id: Math.random() > 0.7 ? customerAddresses[0].id : null, // 30% at customer's place
      discount_id: null,
      discount_applied: 0,
      total_price: price,
      total_duration_minutes: duration,
      stripe_payment_intent_id: `pi_test_generated_${i + 7}`, // Starting from 7
      ...(status === "cancelled" && {
        cancelled_at: subDays(baseDate, 1).toISOString(),
        cancellation_reason: "Endret planer",
      }),
    };

    bookings.push(bookingData);
  }

  return bookings;
}

/**
 * Links services to bookings for testing service-booking relationships
 * Each booking gets 1-2 services linked to it
 */
export async function linkServicesToBookings(
  seed: SeedClient,
  bookings: bookingsScalars[],
  services: servicesScalars[],
) {
  console.log("-- Linking services to bookings...");

  const bookingServiceLinks = [
    // Booking 1: Balayage service
    { booking_id: bookings[0].id, service_id: services[2].id }, // Balayage service

    // Booking 2: Festmakeup
    { booking_id: bookings[1].id, service_id: services[22].id }, // Festmakeup service

    // Booking 3: Vippeextensions
    { booking_id: bookings[2].id, service_id: services[27].id }, // Classic lash extensions

    // Booking 4: Dameklipp
    { booking_id: bookings[3].id, service_id: services[0].id }, // Dameklipp service

    // Booking 5: Wedding package - multiple services
    { booking_id: bookings[4].id, service_id: services[38].id }, // Brudemakeup
    { booking_id: bookings[4].id, service_id: services[39].id }, // Brudefrisyre

    // Booking 6: Bryn services - multiple
    { booking_id: bookings[5].id, service_id: services[31].id }, // Brynslaminering
    { booking_id: bookings[5].id, service_id: services[33].id }, // Brynspluking
  ];

  // Link random services to the generated bookings (starting from index 6)
  for (let i = 6; i < bookings.length; i++) {
    const booking = bookings[i];
    // Pick 1-2 random services
    const numServices = Math.random() > 0.7 ? 2 : 1;
    const usedServices = new Set();

    for (let j = 0; j < numServices; j++) {
      let attempts = 0;
      let randomService;

      // Try to find a service we haven't already linked to this booking
      do {
        randomService = services[Math.floor(Math.random() * services.length)];
        attempts++;
      } while (usedServices.has(randomService?.id) && attempts < 10);

      if (randomService && booking && !usedServices.has(randomService.id)) {
        bookingServiceLinks.push({
          booking_id: booking.id,
          service_id: randomService.id,
        });
        usedServices.add(randomService.id);
      }
    }
  }

  await seed.booking_services(bookingServiceLinks);
  return bookingServiceLinks;
}

/**
 * Creates booking notes for completed bookings to test the notes functionality
 * Stylists can add notes about services, customer preferences, and follow-up suggestions
 */
export async function createBookingNotes(
  seed: SeedClient,
  bookings: bookingsScalars[],
) {
  console.log("-- Creating booking notes for completed bookings...");

  // Filter to only completed bookings for realistic notes
  const completedBookings = bookings.filter(booking =>
    booking.status === "completed" && booking.stylist_id
  );

  const bookingNotesToCreate: DatabaseTables["booking_notes"]["Insert"][] = [];

  // Add specific notes for the first few completed bookings
  if (completedBookings.length > 0) {
    // First completed booking - detailed service notes
    bookingNotesToCreate.push({
      booking_id: completedBookings[0].id,
      stylist_id: completedBookings[0].stylist_id!,
      content: "Kunden hadde meget tynt hår som responderte bra på behandlingen. Brukte ekstra fuktighetsbehandling. Resultatet ble fantastisk! Kunden var kjempefornøyd med lengden og fargene.",
      category: "service_notes",
      customer_visible: true,
      duration_minutes: 125, // Slightly longer than scheduled
      next_appointment_suggestion: "Anbefaler å komme tilbake om 8-10 uker for touch-up. Kan prøve ombre teknikk neste gang.",
      tags: ["tynt-hår", "fuktighetsbehandling", "fornøyd-kunde", "balayage"]
    });

    // Customer preferences note (stylist-only)
    bookingNotesToCreate.push({
      booking_id: completedBookings[0].id,
      stylist_id: completedBookings[0].stylist_id!,
      content: "Kunden foretrekker varme toner og unngår aske-nyanser. Liker ikke for mye volum i toppen. Ønsker alltid soft waves til slutt.",
      category: "customer_preferences",
      customer_visible: false,
      duration_minutes: null,
      next_appointment_suggestion: null,
      tags: ["varme-toner", "unngå-aske", "soft-waves"]
    });
  }

  if (completedBookings.length > 1) {
    // Second completed booking - issues and resolution
    bookingNotesToCreate.push({
      booking_id: completedBookings[1].id,
      stylist_id: completedBookings[1].stylist_id!,
      content: "Kunden hadde sensitive øyne så vi måtte bytte mascara. Brukte hypoallergen produkter resten av behandlingen. Alt gikk bra til slutt!",
      category: "issues",
      customer_visible: true,
      duration_minutes: 65, // A bit longer due to issues
      next_appointment_suggestion: "Husk hypoallergen produkter neste gang. Kunden ønsker samme look til neste fest.",
      tags: ["sensitive-øyne", "hypoallergen", "makeup-skifte"]
    });
  }

  if (completedBookings.length > 2) {
    // Third completed booking - results focused
    bookingNotesToCreate.push({
      booking_id: completedBookings[2].id,
      stylist_id: completedBookings[2].stylist_id!,
      content: "Vippeextensions ble perfekte! Kunden fikk natural look som hun ønsket. Retention ser bra ut, forklarte efterbehandling grundig.",
      category: "results",
      customer_visible: true,
      duration_minutes: 110,
      next_appointment_suggestion: "Refill om 2-3 uker. Kan vurdere litt lengre vipper neste gang hvis ønsket.",
      tags: ["natural-look", "god-retention", "vippeextensions", "efterbehandling"]
    });

    // Follow-up note for same booking
    bookingNotesToCreate.push({
      booking_id: completedBookings[2].id,
      stylist_id: completedBookings[2].stylist_id!,
      content: "Sendte oppfølgings-SMS med tips for stellning av vipper. Kunden svarte at hun er kjempefornøyd og ønsker å booke refill snart.",
      category: "follow_up",
      customer_visible: false,
      duration_minutes: null,
      next_appointment_suggestion: null,
      tags: ["oppfølging", "fornøyd", "refill-ønsket"]
    });
  }

  // Add random notes for remaining completed bookings
  const noteTemplates = [
    {
      content: "Standard behandling utført uten problemer. Kunden fornøyd med resultatet.",
      category: "service_notes" as const,
      customer_visible: true,
      tags: ["standard", "uten-problemer", "fornøyd"]
    },
    {
      content: "Kunden kom 5 minutter for sent, men vi fikk gjennomført alt som planlagt.",
      category: "other" as const,
      customer_visible: false,
      tags: ["for-sent", "gjennomført"]
    },
    {
      content: "Brukte mindre tid enn forventet. Kundens hår var i veldig god stand fra før.",
      category: "service_notes" as const,
      customer_visible: true,
      tags: ["rask", "godt-hår", "effektiv"]
    },
    {
      content: "Kunden spør alltid om tips for styling hjemme. Liker detaljerte forklaringer.",
      category: "customer_preferences" as const,
      customer_visible: false,
      tags: ["styling-tips", "detaljert", "lærevillig"]
    },
    {
      content: "Anbefaler å prøve en annen teknikk neste gang for enda bedre resultat.",
      category: "follow_up" as const,
      customer_visible: true,
      tags: ["ny-teknikk", "forbedring", "neste-gang"]
    }
  ];

  // Add random notes for remaining completed bookings (starting from index 3)
  for (let i = 3; i < Math.min(completedBookings.length, 8); i++) {
    const booking = completedBookings[i];
    const template = noteTemplates[Math.floor(Math.random() * noteTemplates.length)];

    bookingNotesToCreate.push({
      booking_id: booking.id,
      stylist_id: booking.stylist_id!,
      content: template.content,
      category: template.category,
      customer_visible: template.customer_visible,
      duration_minutes: template.customer_visible ?
        60 + Math.floor(Math.random() * 60) : null, // Random duration for service notes
      next_appointment_suggestion: Math.random() > 0.6 ?
        "Kan booke neste time om 4-6 uker for best resultat." : null,
      tags: template.tags
    });
  }

  if (bookingNotesToCreate.length > 0) {
    await seed.booking_notes(bookingNotesToCreate);
    console.log(`-- Created ${bookingNotesToCreate.length} booking notes`);
  } else {
    console.log("-- No completed bookings found for notes creation");
  }

  return bookingNotesToCreate;
}
