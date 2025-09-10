import type {
  booking_servicesScalars,
  bookingsScalars,
  public_reviewsScalars,
  SeedClient,
  servicesScalars,
  usersScalars,
} from "@snaplet/seed";
import type { DatabaseTables } from "../../types/index";
import { addHours, addMinutes, subDays } from "date-fns";
import { reviewImagesUrls } from "./shared";

/**
 * Creates comprehensive reviews system with multiple booking types
 * Ensures every service has adequate review coverage for testing
 */
export async function createComprehensiveReviewsSystem(
  seed: SeedClient,
  bookings: bookingsScalars[],
  services: servicesScalars[],
  customerUsers: usersScalars[],
  stylistUsers: usersScalars[],
  bookingServiceLinks: Partial<booking_servicesScalars>[],
) {
  console.log("-- Creating reviews and ratings...");

  // Get completed bookings for review creation
  const completedBookings = bookings.filter((b) => b.status === "completed");

  // Create reviews for existing completed bookings
  const initialReviews = await createReviewsForCompletedBookings(
    seed,
    completedBookings,
  );

  // Create additional bookings between stylists as customers
  const { extraBookings, additionalReviews } =
    await createStylistCrossBookingsWithReviews(
      seed,
      customerUsers,
      stylistUsers,
    );

  // Ensure every service has adequate reviews
  const serviceReviews = await ensureEveryServiceHasReviews(
    seed,
    services,
    customerUsers,
    stylistUsers,
    bookingServiceLinks,
    [...bookings, ...extraBookings],
    [...initialReviews, ...additionalReviews],
  );

  // Add review images for visual variety
  await addReviewImages(seed, [
    ...initialReviews,
    ...additionalReviews,
    ...serviceReviews,
  ]);

  const totalReviews = initialReviews.length + additionalReviews.length +
    serviceReviews.length;

  console.log("-- Successfully seeded database with reviews and ratings!");
  console.log(`--   Total reviews: ${totalReviews}`);
  console.log(`--   Every published service has at least 3 reviews`);
}

/**
 * Creates reviews for existing completed bookings
 */
async function createReviewsForCompletedBookings(
  seed: SeedClient,
  completedBookings: bookingsScalars[],
) {
  const reviewTemplates = [
    {
      ratings: [5, 5, 4, 5],
      comments: [
        "Absolutt fantastisk! Emma er så dyktig og profesjonell. Resultatet overgikk mine forventninger. Kommer definitivt tilbake!",
        "Perfekt service fra start til slutt. Hun lyttet til ønskene mine og leverte akkurat det jeg ba om. Anbefales på det sterkeste!",
        "Så fornøyd med resultatet! Profesjonell og hyggelig betjening. Stedet var rent og pent. Kommer igjen!",
        "Emma er fantastisk! Hun gjorde en utrolig jobb og jeg følte meg så velkommen. Kunne ikke vært mer fornøyd!",
      ],
    },
    {
      ratings: [4, 5, 5, 4],
      comments: [
        "Veldig fornøyd med tjenesten! Sofia er dyktig og jobbet nøye. Litt travelt den dagen, men resultatet var bra.",
        "Utrolig bra jobb! Sofia har virkelig peiling på det hun driver med. Anbefaler henne til alle!",
        "Så glad for at jeg valgte Sofia! Hun er så profesjonell og resultatet ble bedre enn jeg hadde forventet.",
        "Bra service og hyggelig betjening. Sofia tok seg god tid og forklarte alt hun gjorde. Kommer tilbake!",
      ],
    },
    {
      ratings: [5, 4, 5, 5],
      comments: [
        "Maria er helt fantastisk! Hun har gullhender og er så snill. Resultatet ble perfekt!",
        "Veldig fornøyd med opplevelsen. Maria er profesjonell og gjorde en grundig jobb. Anbefales!",
        "Kunne ikke vært mer fornøyd! Maria lyttet til ønskene mine og leverte akkurat det jeg ønsket meg.",
        "Fantastisk service! Maria er så dyktig og hyggelig. Stedet er også veldig koselig og rent.",
      ],
    },
  ];

  const reviewsToCreate: DatabaseTables["reviews"]["Insert"][] = [];

  for (let i = 0; i < completedBookings.length; i++) {
    const booking = completedBookings[i];
    const templateIndex = i % reviewTemplates.length;
    const template = reviewTemplates[templateIndex];
    const commentIndex = i % template.comments.length;

    if (booking.id && booking.customer_id && booking.stylist_id) {
      reviewsToCreate.push({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        stylist_id: booking.stylist_id,
        rating: template.ratings[commentIndex],
        comment: template.comments[commentIndex],
      });
    }
  }

  if (reviewsToCreate.length > 0) {
    try {
      const { public_reviews } = await seed.public_reviews(reviewsToCreate);
      return public_reviews;
    } catch (error) {
      console.log(
        `-- Error creating reviews: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      return [];
    }
  }

  return [];
}

/**
 * Creates additional bookings between stylists as customers for cross-reviews
 */
async function createStylistCrossBookingsWithReviews(
  seed: SeedClient,
  customerUsers: usersScalars[],
  stylistUsers: usersScalars[],
) {
  const stylistAsCustomerBookings: DatabaseTables["bookings"]["Insert"][] = [];

  // Create specific stylist-to-stylist bookings
  const specificBookings = [
    {
      customer_id: stylistUsers[1].id, // Sofia as customer
      stylist_id: stylistUsers[0].id, // Emma as stylist
      start_time: subDays(new Date(), 15).toISOString(),
      end_time: addHours(subDays(new Date(), 15), 1).toISOString(),
      message_to_stylist: "Trenger en oppfriskning av håret mitt!",
      status: "completed" as const,
      total_price: 800,
      total_duration_minutes: 60,
      stripe_payment_intent_id: "pi_test_stylist_customer_001",
    },
    // Add a few more specific cross-bookings...
  ];

  // Add random cross-bookings
  for (let i = 0; i < 25; i++) {
    const randomCustomer = [...customerUsers, ...stylistUsers][
      Math.floor(Math.random() * (customerUsers.length + stylistUsers.length))
    ];
    const randomStylist =
      stylistUsers[Math.floor(Math.random() * stylistUsers.length)];

    // Avoid self-booking
    if (randomCustomer.id === randomStylist.id) continue;

    const randomDaysAgo = Math.floor(Math.random() * 60) + 10;
    const randomDuration = [60, 90, 120, 150][Math.floor(Math.random() * 4)];
    const randomPrice =
      [500, 650, 800, 1200, 1500][Math.floor(Math.random() * 5)];

    stylistAsCustomerBookings.push({
      customer_id: randomCustomer.id,
      stylist_id: randomStylist.id,
      start_time: subDays(new Date(), randomDaysAgo).toISOString(),
      end_time: addMinutes(subDays(new Date(), randomDaysAgo), randomDuration)
        .toISOString(),
      message_to_stylist: [
        "Gleder meg!",
        "Første gang hos deg!",
        "Samme som sist takk!",
        "Noe nytt og spennende!",
        "Trenger en fresh look!",
      ][Math.floor(Math.random() * 5)],
      status: "completed" as const,
      total_price: randomPrice,
      total_duration_minutes: randomDuration,
      stripe_payment_intent_id: `pi_test_extra_${
        i.toString().padStart(3, "0")
      }`,
    });
  }

  const allCrossBookings = [...specificBookings, ...stylistAsCustomerBookings];
  const { bookings: extraBookings } = await seed.bookings(allCrossBookings);

  // Create reviews for these cross-bookings
  const stylistReviewComments = [
    "Som stylist selv kan jeg si at dette var virkelig profesjonelt utført! Imponert over teknikken og resultatet.",
    "Fantastisk jobb! Jeg jobber selv i bransjen og kan virkelig sette pris på kvaliteten her.",
    "Så bra å finne en kollega som leverer så høy kvalitet! Kommer definitivt tilbake.",
    "Utrolig dyktig! Som stylist vet jeg hva som kreves, og dette var toppklasse.",
  ];

  const additionalReviews = [];
  for (const booking of extraBookings) {
    if (booking.id && booking.customer_id && booking.stylist_id) {
      const rating = [3, 4, 4, 4, 5, 5, 5, 5][Math.floor(Math.random() * 8)];
      const comment = stylistReviewComments[
        Math.floor(Math.random() * stylistReviewComments.length)
      ];

      additionalReviews.push({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        stylist_id: booking.stylist_id,
        rating,
        comment,
      });
    }
  }

  let createdAdditionalReviews: public_reviewsScalars[] = [];
  if (additionalReviews.length > 0) {
    try {
      const { public_reviews } = await seed.public_reviews(additionalReviews);
      createdAdditionalReviews = public_reviews;
    } catch (error) {
      console.log(
        `-- Error creating additional reviews: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  return { extraBookings, additionalReviews: createdAdditionalReviews };
}

/**
 * Ensures every published service has at least 3 reviews by creating additional bookings if needed
 */
async function ensureEveryServiceHasReviews(
  seed: SeedClient,
  services: servicesScalars[],
  customerUsers: usersScalars[],
  stylistUsers: usersScalars[],
  bookingServiceLinks: Partial<booking_servicesScalars>[],
  allBookings: bookingsScalars[],
  existingReviews: public_reviewsScalars[],
) {
  console.log("-- Ensuring every service has reviews...");

  const additionalBookingsForReviews = [];
  const servicesToEnsureReviews = [];

  for (const service of services) {
    if (!service.is_published) continue;

    // Count existing reviews for this service
    const serviceBookings = bookingServiceLinks.filter((link) =>
      link.service_id === service.id
    );
    const serviceReviews = existingReviews.filter((review) => {
      const reviewBooking = allBookings.find((b) => b.id === review.booking_id);
      if (!reviewBooking) return false;
      return serviceBookings.some((sb) => sb.booking_id === reviewBooking.id);
    });

    const reviewsNeeded = Math.max(0, 3 - serviceReviews.length);

    if (reviewsNeeded > 0) {
      console.log(
        `-- Service "${service.title}" needs ${reviewsNeeded} more reviews`,
      );

      for (let i = 0; i < reviewsNeeded; i++) {
        let randomCustomer;
        let attempts = 0;

        do {
          randomCustomer = [...customerUsers, ...stylistUsers][
            Math.floor(
              Math.random() * (customerUsers.length + stylistUsers.length),
            )
          ];
          attempts++;
        } while (randomCustomer.id === service.stylist_id && attempts < 10);

        if (randomCustomer.id === service.stylist_id) continue;

        const randomDaysAgo = Math.floor(Math.random() * 90) + 10;
        const startTime = subDays(new Date(), randomDaysAgo);
        const endTime = addMinutes(startTime, service.duration_minutes);

        additionalBookingsForReviews.push({
          customer_id: randomCustomer.id,
          stylist_id: service.stylist_id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          message_to_stylist: [
            "Gleder meg til denne tjenesten!",
            "Første gang jeg prøver dette!",
            "Hørt mye bra om deg!",
            "Trenger en oppfriskning!",
            "Anbefalt av en venninne!",
          ][Math.floor(Math.random() * 5)],
          status: "completed" as const,
          total_price: service.price,
          total_duration_minutes: service.duration_minutes,
          stripe_payment_intent_id: `pi_ensure_reviews_${service.id}_${i}`,
        });

        servicesToEnsureReviews.push(service);
      }
    }
  }

  if (additionalBookingsForReviews.length === 0) return [];

  const { bookings: newBookings } = await seed.bookings(
    additionalBookingsForReviews,
  );

  // Link these bookings to their specific services
  const newBookingServiceLinks = [];
  for (let i = 0; i < newBookings.length; i++) {
    const booking = newBookings[i];
    const service = servicesToEnsureReviews[i];

    if (service && booking.id) {
      newBookingServiceLinks.push({
        booking_id: booking.id,
        service_id: service.id,
      });
    }
  }

  if (newBookingServiceLinks.length > 0) {
    await seed.booking_services(newBookingServiceLinks);
  }

  // Create reviews for these additional bookings
  const additionalReviews: public_reviewsScalars[] = [];
  for (const booking of newBookings) {
    if (booking.id && booking.customer_id && booking.stylist_id) {
      const rating = [3, 4, 4, 4, 5, 5, 5, 5][Math.floor(Math.random() * 8)];
      const comment = [
        "Fantastisk opplevelse! Akkurat det jeg trengte.",
        "Så fornøyd med resultatet. Kommer definitivt tilbake!",
        "Profesjonell og hyggelig service. Anbefales på det sterkeste!",
        "Utrolig dyktig! Resultatet overgikk mine forventninger.",
      ][Math.floor(Math.random() * 4)];

      additionalReviews.push({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        stylist_id: booking.stylist_id,
        rating,
        comment,
      });
    }
  }

  if (additionalReviews.length > 0) {
    try {
      const { public_reviews } = await seed.public_reviews(additionalReviews);
      console.log(
        `-- Created ${additionalReviews.length} additional reviews to ensure service coverage`,
      );
      return public_reviews;
    } catch (error) {
      console.log(
        `-- Error creating additional reviews: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      return [];
    }
  }

  return [];
}

/**
 * Adds review images to some reviews for visual variety
 */
async function addReviewImages(
  seed: SeedClient,
  reviews: public_reviewsScalars[],
) {
  const reviewImagesData: DatabaseTables["media"]["Insert"][] = [];
  const reviewsWithImages = reviews.filter((_, index) => index % 3 === 0); // Every 3rd review gets images

  for (const review of reviewsWithImages) {
    const numImages = Math.floor(Math.random() * 3) + 1; // 1-3 images per review
    for (let i = 0; i < numImages; i++) {
      const randomImageUrl =
        reviewImagesUrls[Math.floor(Math.random() * reviewImagesUrls.length)];
      reviewImagesData.push({
        owner_id: review.customer_id,
        file_path: randomImageUrl,
        media_type: "review_image",
        is_preview_image: false,
        review_id: review.id,
      });
    }
  }

  if (reviewImagesData.length > 0) {
    await seed.media(reviewImagesData);
    console.log(`-- Added ${reviewImagesData.length} review images`);
  }
}
