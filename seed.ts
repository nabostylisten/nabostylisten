import { createSeedClient } from "@snaplet/seed";

/**
 * If we console log, then remember to prefix the console log with an SQL comment.
 * Example: console.log("-- Successfully seeded database!")
 */
async function main() {
  const seed = await createSeedClient({ dryRun: true });

  // Clear existing data
  await seed.$resetDatabase();

  // Create service categories with hierarchy
  const { service_categories: mainCategories } = await seed.service_categories([
    {
      name: "Hår",
      description: "Hårtjenester inkludert klipp, farge og styling",
    },
    {
      name: "Negler",
      description: "Manikyr, pedikyr og negledesign",
    },
    {
      name: "Makeup",
      description: "Profesjonell makeup for alle anledninger",
    },
    {
      name: "Bryn & Vipper",
      description: "Forming av bryn og vippeextensions",
    },
    {
      name: "Bryllup",
      description: "Spesialtjenester for bryllup",
    },
  ]);

  // Create subcategories
  await seed.service_categories([
    {
      name: "Herreklipp",
      description: "Klipp og styling for menn",
      parent_category_id: mainCategories[0].id,
    },
    {
      name: "Dameklipp",
      description: "Klipp og styling for damer",
      parent_category_id: mainCategories[0].id,
    },
    {
      name: "Farge & Striper",
      description: "Hårfarge, striper og balayage",
      parent_category_id: mainCategories[0].id,
    },
    {
      name: "Gellack",
      description: "Holdbar gellakk manikyr",
      parent_category_id: mainCategories[1].id,
    },
    {
      name: "Negleextensions",
      description: "Forlengelse av negler",
      parent_category_id: mainCategories[1].id,
    },
    {
      name: "Dagsmakeup",
      description: "Naturlig makeup for hverdagen",
      parent_category_id: mainCategories[2].id,
    },
    {
      name: "Festmakeup",
      description: "Glamorøs makeup for spesielle anledninger",
      parent_category_id: mainCategories[2].id,
    },
    {
      name: "Vippeextensions",
      description: "Profesjonelle vippeextensions",
      parent_category_id: mainCategories[3].id,
    },
    {
      name: "Brynslaminering",
      description: "Laminering og forming av bryn",
      parent_category_id: mainCategories[3].id,
    },
    {
      name: "Brudemakeup",
      description: "Spesialmakeup for bruden",
      parent_category_id: mainCategories[4].id,
    },
    {
      name: "Brudefrisyre",
      description: "Frisyre for bruden",
      parent_category_id: mainCategories[4].id,
    },
  ]);

  // Create users - profiles will be created automatically by trigger
  await seed.users([
    {
      email: "admin@nabostylisten.no",
      email_confirmed_at: new Date(),
      raw_user_meta_data: {
        full_name: "Admin User",
        role: "admin",
        phone_number: "+4712345678",
      },
    },
  ]);

  const { users: stylistUsers } = await seed.users([
    {
      email: "maria.hansen@example.com",
      email_confirmed_at: new Date(),
      raw_user_meta_data: {
        full_name: "Maria Hansen",
        role: "stylist",
        phone_number: "+4790123456",
      },
    },
    {
      email: "emma.nilsen@example.com",
      email_confirmed_at: new Date(),
      raw_user_meta_data: {
        full_name: "Emma Nilsen",
        role: "stylist",
        phone_number: "+4791234567",
      },
    },
    {
      email: "sophia.larsen@example.com",
      email_confirmed_at: new Date(),
      raw_user_meta_data: {
        full_name: "Sophia Larsen",
        role: "stylist",
        phone_number: "+4792345678",
      },
    },
  ]);

  const { users: customerUsers } = await seed.users([
    {
      email: "kari.nordmann@example.com",
      email_confirmed_at: new Date(),
      raw_user_meta_data: {
        full_name: "Kari Nordmann",
        role: "customer",
        phone_number: "+4793456789",
      },
    },
    {
      email: "ole.hansen@example.com",
      email_confirmed_at: new Date(),
      raw_user_meta_data: {
        full_name: "Ole Hansen",
        role: "customer",
        phone_number: "+4794567890",
      },
    },
  ]);

  // Create stylist details (profiles will exist due to trigger)
  await seed.stylist_details([
    {
      profile_id: stylistUsers[0].id,
      bio:
        "Erfaren frisør med over 10 års erfaring. Spesialiserer meg på moderne klipp og fargeteknikker.",
      can_travel: true,
      has_own_place: true,
      travel_distance_km: 15,
      instagram_profile: "@mariahansen_hair",
    },
    {
      profile_id: stylistUsers[1].id,
      bio:
        "Makeup artist og negletekniker. Elsker å skape unike looks for mine kunder!",
      can_travel: true,
      has_own_place: false,
      travel_distance_km: 20,
      instagram_profile: "@emma_beauty",
      tiktok_profile: "@emmabeautyoslo",
    },
    {
      profile_id: stylistUsers[2].id,
      bio:
        "Spesialist på bryn og vipper. Sertifisert lash technician med fokus på naturlige resultater.",
      can_travel: false,
      has_own_place: true,
      travel_distance_km: null,
      instagram_profile: "@sophialashes",
      facebook_profile: "sophialarsenlashes",
    },
  ]);

  // Create addresses
  await seed.addresses([
    // Stylist addresses
    {
      user_id: stylistUsers[0].id,
      nickname: "Salong",
      street_address: "Storgata 15",
      city: "Oslo",
      postal_code: "0154",
      country: "Norge",
      is_primary: true,
    },
    {
      user_id: stylistUsers[1].id,
      nickname: "Hjemmekontor",
      street_address: "Løkkeveien 8",
      city: "Bergen",
      postal_code: "5003",
      country: "Norge",
      is_primary: true,
    },
    {
      user_id: stylistUsers[2].id,
      nickname: "Studio",
      street_address: "Markveien 35",
      city: "Oslo",
      postal_code: "0554",
      country: "Norge",
      is_primary: true,
    },
    // Customer addresses
    {
      user_id: customerUsers[0].id,
      nickname: "Hjemme",
      street_address: "Grønlandsleiret 44",
      city: "Oslo",
      postal_code: "0190",
      country: "Norge",
      is_primary: true,
    },
    {
      user_id: customerUsers[1].id,
      nickname: "Leilighet",
      street_address: "Torgallmenningen 8",
      city: "Bergen",
      postal_code: "5014",
      country: "Norge",
      is_primary: true,
    },
  ]);

  // Create services for each stylist
  const { services } = await seed.services([
    // Maria's services
    {
      stylist_id: stylistUsers[0].id,
      title: "Dameklipp",
      description:
        "Profesjonell klipp med vask og føn. Konsultasjon inkludert.",
      price: 650,
      currency: "NOK",
      duration_minutes: 60,
      is_published: true,
      at_customer_place: true,
      at_stylist_place: true,
    },
    {
      stylist_id: stylistUsers[0].id,
      title: "Balayage farge",
      description: "Moderne fargeteknikk for naturlig solkysset hår",
      price: 2500,
      currency: "NOK",
      duration_minutes: 180,
      is_published: true,
      at_customer_place: false,
      at_stylist_place: true,
    },
    {
      stylist_id: stylistUsers[0].id,
      title: "Brudefrisyre",
      description: "Eksklusiv styling for din store dag. Prøvetime inkludert.",
      price: 1800,
      currency: "NOK",
      duration_minutes: 120,
      is_published: true,
      at_customer_place: true,
      at_stylist_place: true,
    },
    // Emma's services
    {
      stylist_id: stylistUsers[1].id,
      title: "Festmakeup",
      description: "Glamorøs makeup perfekt for fest og spesielle anledninger",
      price: 800,
      currency: "NOK",
      duration_minutes: 60,
      is_published: true,
      at_customer_place: true,
      at_stylist_place: false,
    },
    {
      stylist_id: stylistUsers[1].id,
      title: "Gellack med design",
      description: "Holdbar gellack med kreativt negledesign",
      price: 550,
      currency: "NOK",
      duration_minutes: 90,
      is_published: true,
      at_customer_place: true,
      at_stylist_place: false,
    },
    {
      stylist_id: stylistUsers[1].id,
      title: "Brudemakeup inkl. prøvetime",
      description:
        "Perfekt brudemakeup med prøvetime for å finne din drømmelook",
      price: 2200,
      currency: "NOK",
      duration_minutes: 150,
      is_published: true,
      at_customer_place: true,
      at_stylist_place: false,
    },
    // Sophia's services
    {
      stylist_id: stylistUsers[2].id,
      title: "Klassiske vippeextensions",
      description: "Naturlige vippeextensions for en elegant look",
      price: 900,
      currency: "NOK",
      duration_minutes: 90,
      is_published: true,
      at_customer_place: false,
      at_stylist_place: true,
    },
    {
      stylist_id: stylistUsers[2].id,
      title: "Volum vippeextensions",
      description: "Fyldige volum-vipper for dramatisk effekt",
      price: 1200,
      currency: "NOK",
      duration_minutes: 120,
      is_published: true,
      at_customer_place: false,
      at_stylist_place: true,
    },
    {
      stylist_id: stylistUsers[2].id,
      title: "Brynslaminering og farging",
      description: "Få perfekte bryn med laminering og farging",
      price: 650,
      currency: "NOK",
      duration_minutes: 60,
      is_published: true,
      at_customer_place: false,
      at_stylist_place: true,
    },
  ]);

  // Link services to categories
  await seed.service_service_categories([
    // Maria's services (Hair and Wedding)
    { service_id: services[0].id, category_id: mainCategories[0].id }, // Dameklipp -> Hår
    { service_id: services[1].id, category_id: mainCategories[0].id }, // Balayage -> Hår
    { service_id: services[2].id, category_id: mainCategories[4].id }, // Brudefrisyre -> Bryllup

    // Emma's services (Makeup, Nails, Wedding)
    { service_id: services[3].id, category_id: mainCategories[2].id }, // Festmakeup -> Makeup
    { service_id: services[4].id, category_id: mainCategories[1].id }, // Gellack -> Negler
    { service_id: services[5].id, category_id: mainCategories[4].id }, // Brudemakeup -> Bryllup

    // Sophia's services (Brows & Lashes)
    { service_id: services[6].id, category_id: mainCategories[3].id }, // Klassiske vipper -> Bryn & Vipper
    { service_id: services[7].id, category_id: mainCategories[3].id }, // Volum vipper -> Bryn & Vipper
    { service_id: services[8].id, category_id: mainCategories[3].id }, // Brynslaminering -> Bryn & Vipper
  ]);

  // Create availability rules for stylists
  await seed.stylist_availability_rules([
    // Maria - Monday to Friday, 9-17, Saturday 10-15
    {
      stylist_id: stylistUsers[0].id,
      day_of_week: "monday",
      start_time: "09:00",
      end_time: "17:00",
    },
    {
      stylist_id: stylistUsers[0].id,
      day_of_week: "tuesday",
      start_time: "09:00",
      end_time: "17:00",
    },
    {
      stylist_id: stylistUsers[0].id,
      day_of_week: "wednesday",
      start_time: "09:00",
      end_time: "17:00",
    },
    {
      stylist_id: stylistUsers[0].id,
      day_of_week: "thursday",
      start_time: "09:00",
      end_time: "17:00",
    },
    {
      stylist_id: stylistUsers[0].id,
      day_of_week: "friday",
      start_time: "09:00",
      end_time: "17:00",
    },
    {
      stylist_id: stylistUsers[0].id,
      day_of_week: "saturday",
      start_time: "10:00",
      end_time: "15:00",
    },

    // Emma - Tuesday to Saturday with varied hours
    {
      stylist_id: stylistUsers[1].id,
      day_of_week: "tuesday",
      start_time: "12:00",
      end_time: "20:00",
    },
    {
      stylist_id: stylistUsers[1].id,
      day_of_week: "wednesday",
      start_time: "12:00",
      end_time: "20:00",
    },
    {
      stylist_id: stylistUsers[1].id,
      day_of_week: "thursday",
      start_time: "12:00",
      end_time: "20:00",
    },
    {
      stylist_id: stylistUsers[1].id,
      day_of_week: "friday",
      start_time: "10:00",
      end_time: "18:00",
    },
    {
      stylist_id: stylistUsers[1].id,
      day_of_week: "saturday",
      start_time: "09:00",
      end_time: "17:00",
    },

    // Sophia - Monday, Wednesday, Friday, Saturday
    {
      stylist_id: stylistUsers[2].id,
      day_of_week: "monday",
      start_time: "10:00",
      end_time: "18:00",
    },
    {
      stylist_id: stylistUsers[2].id,
      day_of_week: "wednesday",
      start_time: "10:00",
      end_time: "18:00",
    },
    {
      stylist_id: stylistUsers[2].id,
      day_of_week: "friday",
      start_time: "10:00",
      end_time: "18:00",
    },
    {
      stylist_id: stylistUsers[2].id,
      day_of_week: "saturday",
      start_time: "09:00",
      end_time: "16:00",
    },
  ]);

  // Create one-off unavailability periods
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const lunchDate = new Date(nextWeek);
  lunchDate.setHours(13, 0, 0, 0);

  await seed.stylist_unavailability([
    {
      stylist_id: stylistUsers[0].id,
      start_time: lunchDate,
      end_time: new Date(lunchDate.getTime() + 60 * 60 * 1000), // 1 hour later
      reason: "Lunsj",
    },
    {
      stylist_id: stylistUsers[1].id,
      start_time: new Date(nextWeek.setHours(15, 0, 0, 0)),
      end_time: new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      reason: "Tannlegetime",
    },
  ]);

  // Create recurring unavailability patterns
  const seriesStartDate = new Date();
  seriesStartDate.setDate(1); // Start from the 1st of current month

  await seed.stylist_recurring_unavailability([
    {
      stylist_id: stylistUsers[0].id,
      title: "Lunsj pause",
      start_time: "12:00:00",
      end_time: "13:00:00",
      series_start_date: seriesStartDate,
      series_end_date: null, // Continues indefinitely
      rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", // Every weekday
    },
    {
      stylist_id: stylistUsers[1].id,
      title: "Ukentlig teammøte",
      start_time: "09:00:00",
      end_time: "10:00:00",
      series_start_date: seriesStartDate,
      series_end_date: null,
      rrule: "FREQ=WEEKLY;BYDAY=TU", // Every Tuesday
    },
    {
      stylist_id: stylistUsers[2].id,
      title: "Månedlig planlegging",
      start_time: "14:00:00",
      end_time: "16:00:00",
      series_start_date: seriesStartDate,
      series_end_date: null,
      rrule: "FREQ=MONTHLY;BYMONTHDAY=1", // First day of every month
    },
  ]);

  // Create stylist applications and link to categories
  const { applications } = await seed.applications([
    {
      full_name: "Lars Eriksen",
      email: "lars.eriksen@example.com",
      phone_number: "+4795678901",
      birth_date: new Date("1990-05-15"),
      street_address: "Kirkegata 24",
      city: "Trondheim",
      postal_code: "7013",
      country: "Norge",
      professional_experience:
        "5 års erfaring som frisør hos Cutters. Spesialiserer meg på herreklipp og skjeggpleie.",
      price_range_from: 300,
      price_range_to: 800,
      price_range_currency: "NOK",
      status: "applied",
    },
    {
      full_name: "Anna Svendsen",
      email: "anna.svendsen@example.com",
      phone_number: "+4796789012",
      birth_date: new Date("1995-08-22"),
      street_address: "Dronningens gate 15",
      city: "Stavanger",
      postal_code: "4006",
      country: "Norge",
      professional_experience:
        "Utdannet makeupartist fra Norges Makeup Akademi. 3 års erfaring med brude- og festmakeup.",
      price_range_from: 500,
      price_range_to: 2500,
      price_range_currency: "NOK",
      status: "pending_info",
    },
    {
      full_name: "Ingrid Olsen",
      email: "ingrid.olsen@example.com",
      phone_number: "+4797890123",
      birth_date: new Date("1988-11-30"),
      street_address: "Håkons gate 5",
      city: "Oslo",
      postal_code: "0123",
      country: "Norge",
      professional_experience:
        "Sertifisert negletekniker med 7 års erfaring. Ekspert på gel og akryl.",
      price_range_from: 400,
      price_range_to: 1200,
      price_range_currency: "NOK",
      status: "approved",
    },
  ]);

  // Link applications to categories
  await seed.application_categories([
    { application_id: applications[0].id, category_id: mainCategories[0].id }, // Lars -> Hår
    { application_id: applications[1].id, category_id: mainCategories[2].id }, // Anna -> Makeup
    { application_id: applications[1].id, category_id: mainCategories[4].id }, // Anna -> Bryllup
    { application_id: applications[2].id, category_id: mainCategories[1].id }, // Ingrid -> Negler
  ]);

  // Create discount codes
  await seed.discounts([
    {
      code: "VELKOMMEN20",
      description: "20% rabatt for nye kunder",
      discount_percentage: 20,
      discount_amount: null,
      currency: "NOK",
      max_uses: 100,
      current_uses: 12,
      max_uses_per_user: 1,
      is_active: true,
      valid_from: new Date("2024-01-01"),
      expires_at: new Date("2024-12-31"),
      minimum_order_amount: 50000, // 500 NOK in øre
    },
    {
      code: "SOMMER100",
      description: "100 kr rabatt på alle tjenester",
      discount_percentage: null,
      discount_amount: 10000, // 100 NOK in øre
      currency: "NOK",
      max_uses: 50,
      current_uses: 5,
      max_uses_per_user: 2,
      is_active: true,
      valid_from: new Date("2024-06-01"),
      expires_at: new Date("2024-08-31"),
      minimum_order_amount: 80000, // 800 NOK in øre
    },
  ]);

  process.exit(0);
}

main().catch((e) => {
  console.error("-- Seed failed:", e);
  process.exit(1);
});
