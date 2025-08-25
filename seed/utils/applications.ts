import type {
  applicationsScalars,
  SeedClient,
  service_categoriesScalars,
} from "@snaplet/seed";

/**
 * Creates stylist applications with various statuses for testing the approval workflow
 * Applications demonstrate different stages: applied, pending_info, approved, etc.
 */
export async function createStylistApplications(seed: SeedClient) {
  console.log(
    "-- Creating stylist applications for approval workflow testing...",
  );

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

  return applications;
}

/**
 * Links applications to service categories they want to offer
 * This helps admins understand what services applicants want to provide
 */
export async function linkApplicationsToCategories(
  seed: SeedClient,
  applications: applicationsScalars[],
  mainCategories: service_categoriesScalars[],
) {
  console.log("-- Linking applications to service categories...");

  await seed.application_categories([
    { application_id: applications[0].id, category_id: mainCategories[0].id }, // Lars -> Hår
    { application_id: applications[1].id, category_id: mainCategories[2].id }, // Anna -> Makeup
    { application_id: applications[1].id, category_id: mainCategories[4].id }, // Anna -> Bryllup
    { application_id: applications[2].id, category_id: mainCategories[1].id }, // Ingrid -> Negler
  ]);
}
