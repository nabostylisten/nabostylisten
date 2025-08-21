import { createSeedClient } from "@snaplet/seed";
import type { DatabaseTables } from "./types/index";
import { addDays, addHours, addMinutes, subDays } from "date-fns";
import { Database } from "./types/database.types";

// Service category types
type ServiceCategoryKey =
  | "hair"
  | "nails"
  | "makeup"
  | "browsLashes"
  | "wedding";

// Curated images organized by main category
const categoryImages: Record<ServiceCategoryKey, string[]> = {
  hair: [
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800", // hair styling
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800", // hair cut
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800", // hair color
    "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800", // hair treatment
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800", // salon
  ],

  nails: [
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800", // nail art
    "https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800", // manicure
    "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=800", // gel nails
    "https://images.unsplash.com/photo-1563401289-e8010d13da76?w=800", // nail polish
    "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800", // nail salon
  ],

  makeup: [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800", // makeup artist
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800", // makeup brushes
    "https://images.unsplash.com/photo-1522338140262-f46f5913618c?w=800", // makeup application
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800", // cosmetics
    "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=800", // makeup palette
  ],

  browsLashes: [
    "https://images.unsplash.com/photo-1614807536394-cd67bd4a634b?w=800", // close-up eyes
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800", // eyelashes
    "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800", // hair close-up
    "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=800", // woman's face with eyeliner
    "https://images.unsplash.com/photo-1577565177023-d0f29c354b69?w=800", // eyeglasses
  ],

  wedding: [
    "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800", // bride and groom at altar
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800", // bride and groom silhouettes
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce2d2?w=800", // wedding party selfie
    "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=800", // wedding details
    "https://images.unsplash.com/photo-1594736797933-d0f71d2d7222?w=800", // bride with flower in hair
    "https://images.unsplash.com/photo-1627916607164-7b20241db935?w=800", // hair styling
  ],
};

function getRandomImagesForCategory(
  categoryKey: ServiceCategoryKey,
  count: number = 3,
): string[] {
  const images = categoryImages[categoryKey];
  const selectedImages: string[] = [];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * images.length);
    selectedImages.push(images[randomIndex]);
  }

  return selectedImages;
}

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

  type AuthUser = {
    email: string;
    full_name: string;
    role: Database["public"]["Enums"]["user_role"];
    phone_number: string;
  };

  // Define test users
  const testUsers: AuthUser[] = [
    {
      email: "admin@nabostylisten.no",
      full_name: "Admin User",
      role: "admin",
      phone_number: "+4712345678",
    },
    {
      email: "maria.hansen@example.com",
      full_name: "Maria Hansen",
      role: "stylist",
      phone_number: "+4790123456",
    },
    {
      email: "emma.nilsen@example.com",
      full_name: "Emma Nilsen",
      role: "stylist",
      phone_number: "+4791234567",
    },
    {
      email: "sophia.larsen@example.com",
      full_name: "Sophia Larsen",
      role: "stylist",
      phone_number: "+4792345678",
    },
    {
      email: "kari.nordmann@example.com",
      full_name: "Kari Nordmann",
      role: "customer",
      phone_number: "+4793456789",
    },
    {
      email: "ole.hansen@example.com",
      full_name: "Ole Hansen",
      role: "customer",
      phone_number: "+4794567890",
    },
  ];

  // Helper function to create auth user with common fields
  function createAuthUser(user: AuthUser) {
    const encryptedPassword =
      "$2a$10$lzw8ZqDNq.pUUZI3/l0VoOLkKqr2bm4l8p0qGLXF2bYzKxHQl6W7K"; // password123
    const now = new Date();
    const createdAt = subDays(now, 30); // Created 30 days ago
    const invitedAt = subDays(createdAt, 1); // Invited 1 day before creation
    const confirmationSentAt = addMinutes(invitedAt, 5); // Confirmation sent 5 minutes after invite
    const confirmedAt = addHours(confirmationSentAt, 2); // Confirmed 2 hours after confirmation sent
    const lastSignInAt = subDays(now, 1); // Last signed in yesterday

    return {
      email: user.email,
      created_at: createdAt,
      updated_at: lastSignInAt, // Updated when last signed in
      invited_at: invitedAt,
      confirmation_sent_at: confirmationSentAt,
      email_confirmed_at: confirmedAt,
      last_sign_in_at: lastSignInAt,
      encrypted_password: encryptedPassword,
      banned_until: null,
      aud: "authenticated" as const,
      role: "authenticated" as const,
      raw_app_meta_data: {
        provider: "email",
        providers: ["email"],
      },
      raw_user_meta_data: {
        full_name: user.full_name,
        role: user.role,
        phone_number: user.phone_number,
      },
    };
  }

  // Create users with proper auth setup - profiles will be created automatically by trigger
  const { users: allUsers } = await seed.users(testUsers.map(createAuthUser));

  // Create email identities for all users
  await seed.identities(
    allUsers.map((user) => ({
      user_id: user.id,
      provider_id: user.id,
      provider: "email",
      identity_data: {
        sub: user.id,
        email: user.email,
      },
      last_sign_in_at: new Date(),
    })),
  );

  // Get user references for seeding related data
  const stylistUsers = allUsers.slice(1, 4); // Maria, Emma, Sophia
  const customerUsers = allUsers.slice(4, 6); // Kari, Ole

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

  // Service templates for generating randomized services
  const serviceTemplates: Array<{
    title: string;
    description: string;
    category: ServiceCategoryKey;
    categoryIndex: number; // For linking to main categories array
    duration: number[];
  }> = [
    // Hair Services
    {
      title: "Dameklipp",
      description:
        "Profesjonell klipp med vask og føn. Konsultasjon inkludert.",
      category: "hair",
      categoryIndex: 0,
      duration: [45, 60, 75],
    },
    {
      title: "Herreklipp",
      description: "Moderne herreklipp med styling. Inkluderer vask og føn.",
      category: "hair",
      categoryIndex: 0,
      duration: [30, 45, 60],
    },
    {
      title: "Balayage farge",
      description: "Moderne fargeteknikk for naturlig solkysset hår",
      category: "hair",
      categoryIndex: 0,
      duration: [120, 150, 180],
    },
    {
      title: "Highlights",
      description: "Striper som gir dimensjon og glans til håret",
      category: "hair",
      categoryIndex: 0,
      duration: [90, 120, 150],
    },
    {
      title: "Hårfarge",
      description: "Permanent hårfarge i ønsket nyanse",
      category: "hair",
      categoryIndex: 0,
      duration: [90, 120, 150],
    },
    {
      title: "Føn og styling",
      description: "Profesjonell føn med styling for spesielle anledninger",
      category: "hair",
      categoryIndex: 0,
      duration: [30, 45, 60],
    },
    {
      title: "Permanent",
      description: "Permanent for krøller og volum",
      category: "hair",
      categoryIndex: 0,
      duration: [120, 150, 180],
    },
    {
      title: "Hårbehandling",
      description: "Intensive behandling for skadet hår",
      category: "hair",
      categoryIndex: 0,
      duration: [45, 60, 90],
    },

    // Nail Services
    {
      title: "Gellack manikyr",
      description: "Holdbar gellakk manikyr som varer i uker",
      category: "nails",
      categoryIndex: 1,
      duration: [60, 75, 90],
    },
    {
      title: "Gellack med design",
      description: "Holdbar gellack med kreativt negledesign",
      category: "nails",
      categoryIndex: 1,
      duration: [75, 90, 105],
    },
    {
      title: "Franske negler",
      description: "Klassisk fransk manikyr for elegant look",
      category: "nails",
      categoryIndex: 1,
      duration: [45, 60, 75],
    },
    {
      title: "Akryl negler",
      description: "Forsterkning og forlengelse med akryl",
      category: "nails",
      categoryIndex: 1,
      duration: [90, 120, 150],
    },
    {
      title: "Pedikyr",
      description: "Komplett pedikyr med neglepleje",
      category: "nails",
      categoryIndex: 1,
      duration: [60, 75, 90],
    },
    {
      title: "Negleforlengelse",
      description: "Forlengelse av negler for ønsket lengde",
      category: "nails",
      categoryIndex: 1,
      duration: [90, 120, 150],
    },
    {
      title: "Shellac behandling",
      description: "Langtidsholdbar neglelakk behandling",
      category: "nails",
      categoryIndex: 1,
      duration: [45, 60, 75],
    },

    // Makeup Services
    {
      title: "Festmakeup",
      description: "Glamorøs makeup perfekt for fest og spesielle anledninger",
      category: "makeup",
      categoryIndex: 2,
      duration: [45, 60, 75],
    },
    {
      title: "Dagsmakeup",
      description: "Naturlig makeup for hverdagen",
      category: "makeup",
      categoryIndex: 2,
      duration: [30, 45, 60],
    },
    {
      title: "Brude makeup",
      description: "Perfekt makeup for din store dag",
      category: "makeup",
      categoryIndex: 2,
      duration: [60, 90, 120],
    },
    {
      title: "Foto makeup",
      description: "Makeup optimalisert for fotografering",
      category: "makeup",
      categoryIndex: 2,
      duration: [45, 60, 75],
    },
    {
      title: "Makeup kurs",
      description: "Lær å sminke deg selv som en proff",
      category: "makeup",
      categoryIndex: 2,
      duration: [90, 120, 150],
    },
    {
      title: "Kontur makeup",
      description: "Avansert konturering for skulpturerte fasader",
      category: "makeup",
      categoryIndex: 2,
      duration: [60, 75, 90],
    },

    // Brows & Lashes Services
    {
      title: "Klassiske vippeextensions",
      description: "Naturlige vippeextensions for en elegant look",
      category: "browsLashes",
      categoryIndex: 3,
      duration: [90, 120, 150],
    },
    {
      title: "Volum vippeextensions",
      description: "Fyldige volum-vipper for dramatisk effekt",
      category: "browsLashes",
      categoryIndex: 3,
      duration: [120, 150, 180],
    },
    {
      title: "Brynslaminering",
      description: "Laminering og forming av bryn for perfekt form",
      category: "browsLashes",
      categoryIndex: 3,
      duration: [45, 60, 75],
    },
    {
      title: "Brynsfarge",
      description: "Farging av bryn for definert look",
      category: "browsLashes",
      categoryIndex: 3,
      duration: [30, 45, 60],
    },
    {
      title: "Brynspluking",
      description: "Profesjonell forming av bryn",
      category: "browsLashes",
      categoryIndex: 3,
      duration: [30, 45, 60],
    },
    {
      title: "Vippelift",
      description: "Permanent krøll av naturlige vipper",
      category: "browsLashes",
      categoryIndex: 3,
      duration: [60, 75, 90],
    },
    {
      title: "Hybrid vipper",
      description: "Kombinasjon av klassiske og volum vipper",
      category: "browsLashes",
      categoryIndex: 3,
      duration: [105, 120, 135],
    },

    // Wedding Services
    {
      title: "Brudefrisyre",
      description: "Eksklusiv styling for din store dag. Prøvetime inkludert.",
      category: "wedding",
      categoryIndex: 4,
      duration: [90, 120, 150],
    },
    {
      title: "Brudemakeup komplett",
      description: "Komplett brudemakeup med prøvetime",
      category: "wedding",
      categoryIndex: 4,
      duration: [120, 150, 180],
    },
    {
      title: "Brudepakke",
      description: "Komplett pakke med makeup og hår for bruden",
      category: "wedding",
      categoryIndex: 4,
      duration: [180, 210, 240],
    },
    {
      title: "Brudesminke prøve",
      description: "Prøvetime for brudemakeup",
      category: "wedding",
      categoryIndex: 4,
      duration: [75, 90, 120],
    },
    {
      title: "Bryllupsgjester styling",
      description: "Makeup og hår for bryllupsgjester",
      category: "wedding",
      categoryIndex: 4,
      duration: [60, 75, 90],
    },
  ];

  // Mock includes and requirements data organized by category
  const categoryIncludes: Record<ServiceCategoryKey, string[]> = {
    hair: [
      "Konsultasjon og fargeråd",
      "Klipp og styling",
      "Profesjonelle produkter",
      "Oppfølging etter behandling",
      "Vask og balsam",
      "Føn og styling",
      "Hjemmepleieprodukter",
    ],
    nails: [
      "Base coat og top coat",
      "Neglelakk av høy kvalitet",
      "Neglefil og buffer",
      "Cuticle behandling",
      "Håndkrem og negleolje",
      "UV-lampe behandling",
      "Neglebånd massage",
    ],
    makeup: [
      "Makeup konsultasjon",
      "Profesjonelle produkter",
      "Sminke fjerner",
      "Fargeanalyse",
      "Styling tips",
      "Touchup produkter",
      "Foto-ready finish",
    ],
    browsLashes: [
      "Konsultasjon og fargetest",
      "Øyebryn forming og farge",
      "Aftercare produkter",
      "Oppfølging instruksjoner",
      "Allergi test",
      "Profesjonelle produkter",
      "Touch-up etter 2 uker",
    ],
    wedding: [
      "Prøvetime inkludert",
      "Brudemakeup og hår",
      "Touchup under dagen",
      "Profesjonelle produkter",
      "Styling konsultasjon",
      "Foto dokumentasjon",
      "Brudeparti styling tilbud",
    ],
  };

  const categoryRequirements: Record<ServiceCategoryKey, string[]> = {
    hair: [
      "Tilgang til vask og strøm",
      "God belysning",
      "Plass til arbeid (2x2 meter)",
      "Stol med ryggstø",
      "Håndkle tilgjengelig",
    ],
    nails: [
      "Godt ventilert rom",
      "Bord eller fast overflate",
      "God belysning",
      "Tilgang til strøm",
      "Stol med armstø",
    ],
    makeup: [
      "God naturlig belysning",
      "Speil i full størrelse",
      "Stol med god ryggstø",
      "Ren arbeidsplass",
      "Tilgang til vann",
    ],
    browsLashes: [
      "Godt belyst rom",
      "Komfortabel liggestol/seng",
      "Tilgang til strøm",
      "Ren og støvfri miljø",
      "Rolig omgivelser",
    ],
    wedding: [
      "Rolig og privat område",
      "God belysning (fortrinnsvis naturlig)",
      "Speil i full størrelse",
      "Strømtilgang",
      "Plass til utstyr og produkter",
      "Mulighet for å henge kjoler",
    ],
  };

  function getRandomItemsFromArray<T>(
    array: T[],
    min: number = 3,
    max: number = 5,
  ): T[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Generate 50+ randomized services
  const servicesToCreate = [];
  const serviceCategoryLinks: { service_id: string; category_id: string }[] =
    [];

  for (let i = 0; i < 55; i++) {
    const template =
      serviceTemplates[Math.floor(Math.random() * serviceTemplates.length)];
    const stylist =
      stylistUsers[Math.floor(Math.random() * stylistUsers.length)];
    const basePrice = 800 + Math.floor(Math.random() * 2200); // 800-3000 NOK
    const duration =
      template.duration[Math.floor(Math.random() * template.duration.length)];

    // Add some variation to titles to avoid duplicates
    const variation = i > serviceTemplates.length
      ? ` ${Math.floor(i / serviceTemplates.length) + 1}`
      : "";

    // Get random includes and requirements for this category
    const includes = getRandomItemsFromArray(
      categoryIncludes[template.category],
      3,
      6,
    );
    const requirements = getRandomItemsFromArray(
      categoryRequirements[template.category],
      2,
      4,
    );
    const offerHomeService = Math.random() > 0.3; // 70% offer home service

    const service: DatabaseTables["services"]["Insert"] = {
      stylist_id: stylist.id,
      title: template.title + variation,
      description: template.description,
      price: basePrice,
      currency: "NOK",
      duration_minutes: duration,
      is_published: Math.random() > 0.1, // 90% published
      at_customer_place: offerHomeService,
      at_stylist_place: Math.random() > 0.2, // 80% offer at salon
      includes: includes,
      requirements: offerHomeService ? requirements : undefined, // Only add requirements if home service is offered
    };

    servicesToCreate.push(service);
  }

  const { services } = await seed.services(servicesToCreate);

  // Create service-category relationships
  services.forEach((service, index) => {
    const template = serviceTemplates[index % serviceTemplates.length];
    const serviceId = service.id;
    const categoryId = mainCategories[template.categoryIndex].id;

    if (serviceId && categoryId) {
      serviceCategoryLinks.push({
        service_id: serviceId,
        category_id: categoryId,
      });
    }
  });

  // Link services to categories
  await seed.service_service_categories(serviceCategoryLinks);

  console.log("-- Creating service images from curated collection...");

  // Add images to services using hardcoded curated images
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const template = serviceTemplates[i % serviceTemplates.length];

    // Get 3-5 random images from the appropriate category
    const imageCount = Math.floor(Math.random() * 3) + 3; // 3-5 images
    const images = getRandomImagesForCategory(template.category, imageCount);

    console.log(
      `-- Using ${images.length} curated images for service: ${service.title}`,
    );

    // Create media entries for each image
    const mediaData: DatabaseTables["media"]["Insert"][] = images.map((
      imageUrl,
      index: number,
    ) => ({
      service_id: service.id,
      file_path: imageUrl,
      media_type: "service_image",
      is_preview_image: index === 0, // First image is preview
    }));

    await seed.media(mediaData);
  }

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
  const nextWeek = addDays(new Date(), 7);
  const lunchDate = new Date(nextWeek);
  lunchDate.setHours(13, 0, 0, 0);

  await seed.stylist_unavailability([
    {
      stylist_id: stylistUsers[0].id,
      start_time: lunchDate,
      end_time: addHours(lunchDate, 1), // 1 hour later
      reason: "Lunsj",
    },
    {
      stylist_id: stylistUsers[1].id,
      start_time: new Date(nextWeek.setHours(15, 0, 0, 0)),
      end_time: addHours(new Date(nextWeek.getTime()), 2), // 2 hours later
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
  const { discounts } = await seed.discounts([
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

  console.log("-- Creating bookings for testing...");

  // Create some addresses for booking testing
  const { addresses: customerAddresses } = await seed.addresses([
    {
      user_id: customerUsers[0].id, // Kari Nordmann
      nickname: "Sommerhus",
      street_address: "Strandveien 123",
      city: "Oslo",
      postal_code: "0250",
      country: "Norge",
      entry_instructions: "Ring på døren, kode 1234",
      is_primary: false,
    },
  ]);

  // Create diverse bookings for testing
  const { bookings } = await seed.bookings([
    // 1. Upcoming confirmed booking with discount - Kari Nordmann
    {
      customer_id: customerUsers[0].id, // Kari Nordmann
      stylist_id: stylistUsers[0].id, // Maria Hansen
      start_time: addDays(new Date(), 7), // Next week
      end_time: addMinutes(addDays(new Date(), 7), 90), // 90 minutes later
      message_to_stylist:
        "Håper du kan hjelpe meg med en fin balayage som passer til hudfarge!",
      status: "confirmed",
      address_id: null, // At stylist's place
      discount_id: discounts[0].id, // VELKOMMEN20
      discount_applied: 400, // 20% of 2000 NOK
      total_price: 1600, // After discount
      total_duration_minutes: 90,
      stripe_payment_intent_id: "pi_test_upcoming_confirmed_001",
    },

    // 2. Upcoming pending booking at customer's place - Kari Nordmann
    {
      customer_id: customerUsers[0].id, // Kari Nordmann
      stylist_id: stylistUsers[1].id, // Emma Nilsen
      start_time: addDays(new Date(), 3), // In 3 days
      end_time: addMinutes(addDays(new Date(), 3), 60), // 60 minutes later
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
      start_time: subDays(new Date(), 30), // 30 days ago
      end_time: addMinutes(subDays(new Date(), 30), 120), // 120 minutes later
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
      start_time: subDays(new Date(), 7), // 7 days ago
      end_time: addMinutes(subDays(new Date(), 7), 45), // 45 minutes later
      message_to_stylist: "Bare et enkelt klipp, takk!",
      status: "cancelled",
      cancelled_at: subDays(new Date(), 8), // Cancelled day before
      cancellation_reason: "Måtte reise på jobb uventet",
      address_id: null,
      discount_id: null,
      discount_applied: 0,
      total_price: 800,
      total_duration_minutes: 45,
      stripe_payment_intent_id: "pi_test_cancelled_004",
    },

    // 5. Upcoming wedding booking - Ole Hansen
    {
      customer_id: customerUsers[1].id, // Ole Hansen
      stylist_id: stylistUsers[1].id, // Emma Nilsen
      start_time: addDays(new Date(), 14), // In 2 weeks
      end_time: addMinutes(addDays(new Date(), 14), 180), // 3 hours later
      message_to_stylist:
        "Dette er til bryllupet mitt! Ønsker både makeup og hår til forloveden min. Vi møtes hjemme hos oss.",
      status: "confirmed",
      address_id: null, // Will be added as customer address in the booking
      discount_id: discounts[1].id, // SOMMER100
      discount_applied: 100,
      total_price: 2900, // 3000 - 100 discount
      total_duration_minutes: 180,
      stripe_payment_intent_id: "pi_test_wedding_005",
    },

    // 6. Completed booking with multiple services - Ole Hansen
    {
      customer_id: customerUsers[1].id, // Ole Hansen
      stylist_id: stylistUsers[2].id, // Sophia Larsen
      start_time: subDays(new Date(), 45), // 45 days ago
      end_time: addMinutes(subDays(new Date(), 45), 75), // 75 minutes later
      message_to_stylist: "Både brynslaminering og forming, takk!",
      status: "completed",
      address_id: null,
      discount_id: null,
      discount_applied: 0,
      total_price: 1400,
      total_duration_minutes: 75,
      stripe_payment_intent_id: "pi_test_multiple_services_006",
    },
  ]);

  console.log("-- Linking services to bookings...");

  // Link services to bookings
  await seed.booking_services([
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
  ]);

  console.log("-- Creating chats for some bookings...");

  // Create chats for some bookings
  const { chats } = await seed.chats([
    { booking_id: bookings[0].id }, // Upcoming confirmed booking
    { booking_id: bookings[1].id }, // Upcoming pending booking
    { booking_id: bookings[4].id }, // Wedding booking
  ]);

  console.log("-- Adding chat messages...");

  // Add some chat messages
  await seed.chat_messages([
    // Messages for upcoming confirmed booking
    {
      chat_id: chats[0].id,
      sender_id: customerUsers[0].id, // Kari
      content:
        "Hei Maria! Gleder meg til å få balayage neste uke. Har du noen tips til hvordan jeg skal forberede håret?",
      is_read: true,
    },
    {
      chat_id: chats[0].id,
      sender_id: stylistUsers[0].id, // Maria
      content:
        "Hei Kari! Så hyggelig at du kommer til meg. Unngå å vaske håret dagen før, så får vi best resultat 😊",
      is_read: true,
    },
    {
      chat_id: chats[0].id,
      sender_id: customerUsers[0].id, // Kari
      content: "Tusen takk for tipset! Sees neste uke!",
      is_read: false,
    },

    // Messages for pending booking
    {
      chat_id: chats[1].id,
      sender_id: customerUsers[0].id, // Kari
      content:
        "Hei Emma! Lurer på om du kan komme til sommerhuset mitt i stedet? Sender adressen i meldingen til stylisten.",
      is_read: false,
    },

    // Messages for wedding booking
    {
      chat_id: chats[2].id,
      sender_id: customerUsers[1].id, // Ole
      content:
        "Hei Emma! Dette er for bryllupet vårt. Har du gjort bryllupsstyling før?",
      is_read: true,
    },
    {
      chat_id: chats[2].id,
      sender_id: stylistUsers[1].id, // Emma
      content:
        "Gratulerer med bryllupet! Ja, jeg har mye erfaring med bryllup. Dette blir fantastisk! 💍✨",
      is_read: true,
    },
  ]);

  console.log("-- Creating payment records...");

  // Create payment records for completed bookings
  await seed.payments([
    {
      booking_id: bookings[2].id, // Completed lash extensions
      payment_intent_id: "pi_test_completed_003",
      total_amount: 250000, // 2500 NOK in øre
      platform_fee: 50000, // 20% platform fee in øre
      stylist_payout_amount: 200000, // 80% to stylist in øre
      currency: "NOK",
      status: "succeeded",
      succeeded_at: subDays(new Date(), 29),
      payout_completed_at: subDays(new Date(), 28),
    },
    {
      booking_id: bookings[5].id, // Completed bryn services
      payment_intent_id: "pi_test_multiple_services_006",
      total_amount: 140000, // 1400 NOK in øre
      platform_fee: 28000, // 20% platform fee in øre
      stylist_payout_amount: 112000, // 80% to stylist in øre
      currency: "NOK",
      status: "succeeded",
      succeeded_at: subDays(new Date(), 44),
      payout_completed_at: subDays(new Date(), 43),
    },
  ]);

  console.log("-- Successfully seeded database with bookings for testing!");
  console.log("-- Test accounts:");
  console.log("--   Customer 1: kari.nordmann@example.com (6 bookings)");
  console.log("--   Customer 2: ole.hansen@example.com (2 bookings)");

  process.exit(0);
}

main().catch((e) => {
  console.error("-- Seed failed:", e);
  process.exit(1);
});
