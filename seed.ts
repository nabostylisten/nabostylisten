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

type SeedPassword = "demo-password";

const seedPasswordToEncrypted: Record<SeedPassword, string> = {
  "demo-password":
    "$2a$10$JEpaf.puIXxfqjkPaNCLle3a0yB4x2XbnTUH7L5SoK7J45bpeykla",
};

// Utility functions for generating valid numeric values within database ranges
function generateValidPercentage(min = 0.05, max = 0.50): number {
  // Generate percentage as decimal (0.20 = 20%) within valid range for numeric(3,2)
  // numeric(3,2) allows values from -9.99 to 9.99, but we use 0.xx for percentages
  const value = Math.random() * (max - min) + min;
  return Math.round(value * 100) / 100; // Round to 2 decimal places
}

function generateValidCommissionPercentage(): number {
  // Generate affiliate commission percentage between 15% and 25%
  return generateValidPercentage(0.15, 0.25);
}

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

  // Define test users - more stylists across Norway's main cities
  const testUsers: AuthUser[] = [
    {
      email: "admin@nabostylisten.no",
      full_name: "Admin User",
      role: "admin",
      phone_number: "+4712345678",
    },
    // Oslo stylists (2)
    {
      email: "maria.hansen@example.com",
      full_name: "Maria Hansen",
      role: "stylist",
      phone_number: "+4790123456",
    },
    {
      email: "sophia.larsen@example.com",
      full_name: "Sophia Larsen",
      role: "stylist",
      phone_number: "+4792345678",
    },
    // Bergen stylists (2)
    {
      email: "emma.nilsen@example.com",
      full_name: "Emma Nilsen",
      role: "stylist",
      phone_number: "+4791234567",
    },
    {
      email: "lisa.berg@example.com",
      full_name: "Lisa Berg",
      role: "stylist",
      phone_number: "+4795123456",
    },
    // Trondheim stylists (2)
    {
      email: "anna.johansen@example.com",
      full_name: "Anna Johansen",
      role: "stylist",
      phone_number: "+4796234567",
    },
    {
      email: "ingrid.solberg@example.com",
      full_name: "Ingrid Solberg",
      role: "stylist",
      phone_number: "+4797345678",
    },
    // Stavanger stylists (2)
    {
      email: "camilla.eriksen@example.com",
      full_name: "Camilla Eriksen",
      role: "stylist",
      phone_number: "+4798456789",
    },
    {
      email: "thea.andersen@example.com",
      full_name: "Thea Andersen",
      role: "stylist",
      phone_number: "+4799567890",
    },
    // Kristiansand stylists (2)
    {
      email: "marte.kristiansen@example.com",
      full_name: "Marte Kristiansen",
      role: "stylist",
      phone_number: "+4790678901",
    },
    {
      email: "sara.pedersen@example.com",
      full_name: "Sara Pedersen",
      role: "stylist",
      phone_number: "+4791789012",
    },
    // Customers
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
    {
      email: "per.jensen@example.com",
      full_name: "Per Jensen",
      role: "customer",
      phone_number: "+4792890123",
    },
    {
      email: "anne.olsen@example.com",
      full_name: "Anne Olsen",
      role: "customer",
      phone_number: "+4793901234",
    },
  ];

  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  };

  // Helper function to create auth user with common fields
  function createAuthUser(user: AuthUser) {
    const encryptedPassword = seedPasswordToEncrypted["demo-password"];
    const now = new Date();
    const createdAt = subDays(now, 30); // Created 30 days ago
    const confirmedAt = addMinutes(createdAt, 5); // Confirmed 5 minutes after creation
    const lastSignInAt = subDays(now, 1); // Last signed in yesterday

    return {
      email: user.email,
      instance_id: "00000000-0000-0000-0000-000000000000",
      created_at: createdAt,
      updated_at: lastSignInAt,
      invited_at: null,
      confirmation_token: generateToken(),
      confirmation_sent_at: null,
      recovery_token: generateToken(),
      recovery_sent_at: createdAt, // Set to creation time
      email_change_token_new: generateToken(),
      email_change: generateToken(),
      email_change_sent_at: null,
      email_confirmed_at: confirmedAt,
      confirmed_at: confirmedAt,
      last_sign_in_at: lastSignInAt,
      phone: null,
      phone_confirmed_at: null,
      phone_change: generateToken(),
      phone_change_token: generateToken(),
      phone_change_sent_at: null,
      email_change_token_current: generateToken(),
      email_change_confirm_status: 0,
      reauthentication_token: generateToken(),
      reauthentication_sent_at: null,
      is_sso_user: false,
      deleted_at: null, // CRITICAL: User is NOT deleted
      is_anonymous: false,
      is_super_admin: null, // Not super admin
      encrypted_password: encryptedPassword,
      banned_until: null,
      aud: "authenticated" as const,
      role: "authenticated" as const,
      raw_app_meta_data: {
        provider: "email",
        providers: ["email"],
      },
      raw_user_meta_data: {
        sub: "", // Will be set by Supabase
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone_number: user.phone_number,
        email_verified: true,
        phone_verified: false,
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
  const stylistUsers = allUsers.slice(1, 11); // All 10 stylists
  const customerUsers = allUsers.slice(11, 15); // All 4 customers

  // Create stylist details (profiles will exist due to trigger)
  await seed.stylist_details([
    // Oslo stylists
    {
      profile_id: stylistUsers[0].id, // Maria Hansen
      bio:
        "Erfaren frisør med over 10 års erfaring. Spesialiserer meg på moderne klipp og fargeteknikker.",
      can_travel: true,
      has_own_place: true,
      travel_distance_km: 15,
      instagram_profile: "@mariahansen_hair",
    },
    {
      profile_id: stylistUsers[1].id, // Sophia Larsen
      bio:
        "Spesialist på bryn og vipper. Sertifisert lash technician med fokus på naturlige resultater.",
      can_travel: false,
      has_own_place: true,
      travel_distance_km: null,
      instagram_profile: "@sophialashes",
      facebook_profile: "sophialarsenlashes",
    },
    // Bergen stylists
    {
      profile_id: stylistUsers[2].id, // Emma Nilsen
      bio:
        "Makeup artist og negletekniker. Elsker å skape unike looks for mine kunder!",
      can_travel: true,
      has_own_place: false,
      travel_distance_km: 20,
      instagram_profile: "@emma_beauty",
      tiktok_profile: "@emmabeautybergen",
    },
    {
      profile_id: stylistUsers[3].id, // Lisa Berg
      bio:
        "Profesjonell hårfrisør og fargeekspert. Brenner for å skape fantastiske frisyrer som passer din stil.",
      can_travel: true,
      has_own_place: true,
      travel_distance_km: 25,
      instagram_profile: "@lisaberg_hair",
    },
    // Trondheim stylists
    {
      profile_id: stylistUsers[4].id, // Anna Johansen
      bio:
        "Spesialiserer meg på bryllup og festmakeup. Over 8 års erfaring med å få folk til å skinne!",
      can_travel: true,
      has_own_place: true,
      travel_distance_km: 30,
      instagram_profile: "@anna_makeup_trondheim",
      facebook_profile: "annamakeup",
    },
    {
      profile_id: stylistUsers[5].id, // Ingrid Solberg
      bio:
        "Sertifisert negletekniker med fokus på gel og akryl. Elsker kreative design og nail art!",
      can_travel: false,
      has_own_place: true,
      travel_distance_km: null,
      instagram_profile: "@ingrid_nails",
    },
    // Stavanger stylists
    {
      profile_id: stylistUsers[6].id, // Camilla Eriksen
      bio:
        "Hårfrisør med spesialisering innen balayage og moderne fargeteknikker. La meg hjelpe deg finne din perfekte look!",
      can_travel: true,
      has_own_place: true,
      travel_distance_km: 20,
      instagram_profile: "@camilla_hair_stavanger",
      tiktok_profile: "@camillahair",
    },
    {
      profile_id: stylistUsers[7].id, // Thea Andersen
      bio:
        "Vippeextensions og brynforming er min spesialitet. Fokus på naturlig skjønnhet og holdbare resultater.",
      can_travel: true,
      has_own_place: false,
      travel_distance_km: 15,
      instagram_profile: "@thea_lashes",
    },
    // Kristiansand stylists
    {
      profile_id: stylistUsers[8].id, // Marte Kristiansen
      bio:
        "Allsidig stylist med erfaring innen hår, makeup og negler. Jeg hjelper deg å se din beste ut!",
      can_travel: true,
      has_own_place: true,
      travel_distance_km: 25,
      instagram_profile: "@marte_beauty_krs",
      youtube_profile: "martebeauty",
    },
    {
      profile_id: stylistUsers[9].id, // Sara Pedersen
      bio:
        "Spesialist på festfrisyrer og updos. Perfekt for bryllup, ball og andre spesielle anledninger.",
      can_travel: true,
      has_own_place: true,
      travel_distance_km: 20,
      instagram_profile: "@sara_hair_kristiansand",
    },
  ]);

  // Create addresses with proper PostGIS geography data
  // Note: PostGIS expects POINT(longitude latitude) format
  await seed.addresses([
    // Oslo stylists addresses
    {
      user_id: stylistUsers[0].id, // Maria Hansen
      nickname: "Salong",
      street_address: "Storgata 15",
      city: "Oslo",
      postal_code: "0154",
      country: "Norge",
      location: "POINT(10.746 59.913)", // Oslo center coordinates
      is_primary: true,
    },
    {
      user_id: stylistUsers[1].id, // Sophia Larsen
      nickname: "Studio",
      street_address: "Markveien 35",
      city: "Oslo",
      postal_code: "0554",
      country: "Norge",
      location: "POINT(10.7585 59.9295)", // Grünerløkka, Oslo coordinates
      is_primary: true,
    },
    // Bergen stylists addresses
    {
      user_id: stylistUsers[2].id, // Emma Nilsen
      nickname: "Hjemmekontor",
      street_address: "Løkkeveien 8",
      city: "Bergen",
      postal_code: "5003",
      country: "Norge",
      location: "POINT(5.324 60.393)", // Bergen coordinates
      is_primary: true,
    },
    {
      user_id: stylistUsers[3].id, // Lisa Berg
      nickname: "Salong",
      street_address: "Strandgaten 55",
      city: "Bergen",
      postal_code: "5004",
      country: "Norge",
      location: "POINT(5.3260 60.3894)", // Bergen city center
      is_primary: true,
    },
    // Trondheim stylists addresses
    {
      user_id: stylistUsers[4].id, // Anna Johansen
      nickname: "Studio",
      street_address: "Munkegata 20",
      city: "Trondheim",
      postal_code: "7011",
      country: "Norge",
      location: "POINT(10.395 63.43)", // Trondheim coordinates
      is_primary: true,
    },
    {
      user_id: stylistUsers[5].id, // Ingrid Solberg
      nickname: "Neglesalong",
      street_address: "Olav Tryggvasons gate 14",
      city: "Trondheim",
      postal_code: "7013",
      country: "Norge",
      location: "POINT(10.3950 63.4305)", // Trondheim center
      is_primary: true,
    },
    // Stavanger stylists addresses
    {
      user_id: stylistUsers[6].id, // Camilla Eriksen
      nickname: "Hårstudio",
      street_address: "Klubbgaten 5",
      city: "Stavanger",
      postal_code: "4006",
      country: "Norge",
      location: "POINT(5.733 58.97)", // Stavanger coordinates
      is_primary: true,
    },
    {
      user_id: stylistUsers[7].id, // Thea Andersen
      nickname: "Skjønnhetssalong",
      street_address: "Øvre Holmegate 15",
      city: "Stavanger",
      postal_code: "4008",
      country: "Norge",
      location: "POINT(5.7330 58.9700)", // Stavanger center
      is_primary: true,
    },
    // Kristiansand stylists addresses
    {
      user_id: stylistUsers[8].id, // Marte Kristiansen
      nickname: "Beauty Studio",
      street_address: "Markens gate 33",
      city: "Kristiansand",
      postal_code: "4611",
      country: "Norge",
      location: "POINT(8.00 58.1472)", // Kristiansand coordinates
      is_primary: true,
    },
    {
      user_id: stylistUsers[9].id, // Sara Pedersen
      nickname: "Hårsalong",
      street_address: "Dronningens gate 15",
      city: "Kristiansand",
      postal_code: "4608",
      country: "Norge",
      location: "POINT(7.9956 58.1467)", // Kristiansand center
      is_primary: true,
    },
    // Customer addresses - distributed across cities
    {
      user_id: customerUsers[0].id, // Kari Nordmann
      nickname: "Hjemme",
      street_address: "Grønlandsleiret 44",
      city: "Oslo",
      postal_code: "0190",
      country: "Norge",
      location: "POINT(10.7608 59.9127)", // Grønland, Oslo coordinates
      is_primary: true,
    },
    {
      user_id: customerUsers[1].id, // Ole Hansen
      nickname: "Leilighet",
      street_address: "Torgallmenningen 8",
      city: "Bergen",
      postal_code: "5014",
      country: "Norge",
      location: "POINT(5.3247 60.3933)", // Bergen city center coordinates
      is_primary: true,
    },
    {
      user_id: customerUsers[2].id, // Per Jensen
      nickname: "Hjem",
      street_address: "Prinsens gate 44",
      city: "Trondheim",
      postal_code: "7012",
      country: "Norge",
      location: "POINT(10.3951 63.4297)", // Trondheim coordinates
      is_primary: true,
    },
    {
      user_id: customerUsers[3].id, // Anne Olsen
      nickname: "Leilighet",
      street_address: "Kirkegata 20",
      city: "Stavanger",
      postal_code: "4005",
      country: "Norge",
      location: "POINT(5.7315 58.9690)", // Stavanger coordinates
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

  // Create availability rules for all stylists
  const availabilityRules = [];
  
  // Create availability for all 10 stylists with varied schedules
  const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  
  for (let i = 0; i < stylistUsers.length; i++) {
    const stylist = stylistUsers[i];
    
    // Most stylists work weekdays
    for (const day of weekdays) {
      // Vary the hours slightly for each stylist
      const startHour = 8 + (i % 3); // 8, 9, or 10 AM start
      const endHour = 17 + (i % 3); // 17, 18, or 19 PM end
      
      // Skip some days for variety (every 3rd stylist skips Wednesday)
      if (i % 3 === 0 && day === "wednesday") continue;
      
      availabilityRules.push({
        stylist_id: stylist.id,
        day_of_week: day as Database["public"]["Enums"]["day_of_week"],
        start_time: `${startHour.toString().padStart(2, '0')}:00`,
        end_time: `${endHour.toString().padStart(2, '0')}:00`,
      });
    }
    
    // About 70% work Saturdays
    if (i % 10 < 7) {
      availabilityRules.push({
        stylist_id: stylist.id,
        day_of_week: "saturday" as Database["public"]["Enums"]["day_of_week"],
        start_time: `${(10 + (i % 2)).toString().padStart(2, '0')}:00`, // 10 or 11 AM
        end_time: `${(15 + (i % 2)).toString().padStart(2, '0')}:00`, // 15 or 16 PM
      });
    }
  }
  
  await seed.stylist_availability_rules(availabilityRules);
  
  // Keep the original specific rules commented for reference
  /*
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
  */

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
      location: "POINT(10.6831 59.8897)", // Bygdøy, Oslo coordinates
      entry_instructions: "Ring på døren, kode 1234",
      is_primary: false,
    },
  ]);

  // Create more bookings for pagination testing
  const allBookingsToCreate: DatabaseTables["bookings"]["Insert"][] = [];

  // Add the original 6 specific bookings
  const specificBookings: DatabaseTables["bookings"]["Insert"][] = [
    // 1. Upcoming confirmed booking with discount - Kari Nordmann
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
    },

    // 6. Completed booking with multiple services - Ole Hansen
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

  allBookingsToCreate.push(...specificBookings);

  // Generate additional bookings for pagination testing
  const statuses: Array<Database["public"]["Enums"]["booking_status"]> = [
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

  // Create 20 additional bookings to test pagination (total will be 26)
  for (let i = 0; i < 20; i++) {
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

    allBookingsToCreate.push(bookingData);
  }

  const { bookings } = await seed.bookings(allBookingsToCreate);

  console.log("-- Linking services to bookings...");

  // Link services to bookings - first the specific ones, then random services for the generated bookings
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

  console.log("-- Creating chats for some bookings...");

  // Create chats for some bookings
  const { chats } = await seed.chats([
    { booking_id: bookings[0].id }, // Upcoming confirmed booking
    { booking_id: bookings[1].id }, // Upcoming pending booking
    { booking_id: bookings[4].id }, // Wedding booking
  ]);

  console.log("-- Adding chat messages...");

  // Add some OLD chat messages (for cron job testing - older than 5 years)
  const sixYearsAgo = subDays(new Date(), 365 * 6); // 6 years ago
  
  // Create old messages that should be deleted by cron job
  await seed.chat_messages([
    {
      chat_id: chats[0].id,
      sender_id: customerUsers[0].id,
      content: "Dette er en veldig gammel melding som skal slettes av cron job.",
      is_read: true,
      created_at: sixYearsAgo,
    },
    {
      chat_id: chats[0].id,
      sender_id: stylistUsers[0].id,
      content: "Denne meldingen er også over 5 år gammel og skal fjernes.",
      is_read: true,
      created_at: addDays(sixYearsAgo, 1),
    },
    {
      chat_id: chats[1].id,
      sender_id: customerUsers[0].id,
      content: "Gammel chat fra 2018 som skal slettes automatisk.",
      is_read: true,
      created_at: addDays(sixYearsAgo, 10),
    },
  ]);

  console.log("-- Added old chat messages for cron job testing");

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

  // Create affiliate applications and links for testing
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

  // Create some affiliate clicks for testing
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

  console.log("-- Creating payment records...");

  // Create payment records for completed bookings (reduced for testing)
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

  console.log("-- Creating reviews and ratings...");

  // Get completed bookings for review creation
  const completedBookings = bookings.filter((b) => b.status === "completed");

  // Review templates with variety
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
    {
      ratings: [4, 4, 5, 4],
      comments: [
        "Sophia gjorde en flott jobb! Profesjonell og hyggelig. Kommer gjerne tilbake for ny behandling.",
        "Så fornøyd med resultatet! Sophia tok seg god tid og var veldig nøye med detaljene.",
        "Utmerket service! Sophia er dyktig og gjorde akkurat det jeg ba om. Anbefaler henne varmt!",
        "Bra opplevelse hos Sophia. Hun er profesjonell og resultatet ble som forventet. Kommer igjen!",
      ],
    },
  ];

  // Create reviews for completed bookings
  const reviewsToCreate: DatabaseTables["reviews"]["Insert"][] = [];

  // Ensure all customers write reviews for their completed bookings
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

  // Add more reviews to reach ~50 total
  // Generate additional completed bookings for stylists as customers
  const stylistAsCustomerBookings: DatabaseTables["bookings"]["Insert"][] = [];

  // Sofia books with Emma
  stylistAsCustomerBookings.push({
    customer_id: stylistUsers[1].id, // Sofia as customer
    stylist_id: stylistUsers[0].id, // Emma as stylist
    start_time: subDays(new Date(), 15).toISOString(),
    end_time: addHours(subDays(new Date(), 15), 1).toISOString(),
    message_to_stylist: "Trenger en oppfriskning av håret mitt!",
    status: "completed",
    total_price: 800,
    total_duration_minutes: 60,
    stripe_payment_intent_id: "pi_test_stylist_customer_001",
  });

  // Maria books with Sofia
  stylistAsCustomerBookings.push({
    customer_id: stylistUsers[2].id, // Maria as customer
    stylist_id: stylistUsers[1].id, // Sofia as stylist
    start_time: subDays(new Date(), 22).toISOString(),
    end_time: addHours(subDays(new Date(), 22), 1.5).toISOString(),
    message_to_stylist: "Vil gjerne prøve den nye gel-metoden din!",
    status: "completed",
    total_price: 650,
    total_duration_minutes: 90,
    stripe_payment_intent_id: "pi_test_stylist_customer_002",
  });

  // Sophia books with Maria
  stylistAsCustomerBookings.push({
    customer_id: stylistUsers[2].id, // Sophia as customer
    stylist_id: stylistUsers[0].id, // Maria as stylist
    start_time: subDays(new Date(), 8).toISOString(),
    end_time: addHours(subDays(new Date(), 8), 2).toISOString(),
    message_to_stylist: "Trenger makeup til fest på lørdag!",
    status: "completed",
    total_price: 1200,
    total_duration_minutes: 120,
    stripe_payment_intent_id: "pi_test_stylist_customer_003",
  });

  // Emma books with Sophia
  stylistAsCustomerBookings.push({
    customer_id: stylistUsers[1].id, // Emma as customer
    stylist_id: stylistUsers[2].id, // Sophia as stylist
      start_time: subDays(new Date(), 35).toISOString(),
      end_time: addHours(subDays(new Date(), 35), 1.5).toISOString(),
      message_to_stylist: "Vil prøve lash lift for første gang!",
      status: "completed",
      total_price: 800,
      total_duration_minutes: 90,
      stripe_payment_intent_id: "pi_test_stylist_customer_004",
    });

  // Additional cross-bookings between stylists and with regular customers
  for (let i = 0; i < 25; i++) {
    const randomCustomer = [
      ...customerUsers,
      ...stylistUsers,
    ][
      Math.floor(Math.random() * (customerUsers.length + stylistUsers.length))
    ];
    const randomStylist =
      stylistUsers[Math.floor(Math.random() * stylistUsers.length)];

    // Avoid self-booking
    if (randomCustomer.id === randomStylist.id) continue;

    const randomDaysAgo = Math.floor(Math.random() * 60) + 10; // 10-70 days ago
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
      status: "completed",
      total_price: randomPrice,
      total_duration_minutes: randomDuration,
      stripe_payment_intent_id: `pi_test_extra_${
        i.toString().padStart(3, "0")
      }`,
    });
  }

  // Create additional bookings
  const { bookings: extraBookings } = await seed.bookings(
    stylistAsCustomerBookings,
  );

  // Create reviews for stylist-as-customer bookings
  const stylistReviewComments = [
    "Som stylist selv kan jeg si at dette var virkelig profesjonelt utført! Imponert over teknikken og resultatet.",
    "Fantastisk jobb! Jeg jobber selv i bransjen og kan virkelig sette pris på kvaliteten her.",
    "Så bra å finne en kollega som leverer så høy kvalitet! Kommer definitivt tilbake.",
    "Utrolig dyktig! Som stylist vet jeg hva som kreves, og dette var toppklasse.",
    "Perfekt utførelse! Anbefaler henne til alle mine kunder også.",
    "Så profesjonell og hyggelig! Resultatet ble akkurat som jeg ønsket.",
    "Flott opplevelse! God å finne noen som tar seg tid til å gjøre jobben skikkelig.",
    "Kjempefornøyd! Hun er virkelig flink til det hun driver med.",
    "Så bra service! Kommer til å anbefale henne til venner og familie.",
    "Fantastisk resultat! Kunne ikke vært mer fornøyd med opplevelsen.",
  ];

  // Create reviews for the stylist-as-customer bookings
  for (let i = 0; i < extraBookings.length; i++) {
    const booking = extraBookings[i];
    const rating = [3, 4, 4, 4, 5, 5, 5][Math.floor(Math.random() * 7)]; // Weighted towards higher ratings
    const comment = stylistReviewComments[
      Math.floor(Math.random() * stylistReviewComments.length)
    ];

    if (booking.id && booking.customer_id && booking.stylist_id) {
      reviewsToCreate.push({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        stylist_id: booking.stylist_id,
        rating,
        comment,
      });
    }
  }

  // Create all reviews
  console.log(`-- Attempting to create ${reviewsToCreate.length} reviews...`);
  let reviews = [];
  try {
    const result = await seed.reviews(reviewsToCreate);
    reviews = result.reviews || result;
  } catch (error) {
    console.log(`-- Error creating reviews: ${error.message}`);
    console.log("-- Skipping reviews for now...");
    reviews = [];
  }

  console.log(`-- Created ${reviews.length} reviews for completed bookings`);

  // Ensure every service has at least 2-5 reviews by creating additional bookings if needed
  console.log("-- Ensuring every service has reviews...");
  
  const servicesToEnsureReviews = [];
  const additionalBookingsForReviews = [];
  const additionalReviews = [];

  // Check each service and create additional bookings/reviews if needed
  for (const service of services) {
    if (!service.is_published) continue; // Skip unpublished services
    
    // Count existing reviews for this service through booking_services
    const serviceBookings = bookingServiceLinks.filter(link => link.service_id === service.id);
    const existingReviews = reviews.filter(review => {
      const reviewBooking = [...bookings, ...extraBookings].find(b => b.id === review.booking_id);
      if (!reviewBooking) return false;
      return serviceBookings.some(sb => sb.booking_id === reviewBooking.id);
    });

    const reviewsNeeded = Math.max(0, 3 - existingReviews.length); // Ensure at least 3 reviews per service
    
    if (reviewsNeeded > 0) {
      console.log(`-- Service "${service.title}" needs ${reviewsNeeded} more reviews`);
      
      // Create additional completed bookings for this service
      for (let i = 0; i < reviewsNeeded; i++) {
        let randomCustomer;
        let attempts = 0;
        
        // Try to find a customer that's not the same as the stylist
        do {
          randomCustomer = [...customerUsers, ...stylistUsers][
            Math.floor(Math.random() * (customerUsers.length + stylistUsers.length))
          ];
          attempts++;
        } while (randomCustomer.id === service.stylist_id && attempts < 10);
        
        // If we couldn't find a different customer, skip this booking
        if (randomCustomer.id === service.stylist_id) continue;
        
        const randomDaysAgo = Math.floor(Math.random() * 90) + 10; // 10-100 days ago
        const startTime = subDays(new Date(), randomDaysAgo);
        const endTime = addMinutes(startTime, service.duration_minutes);
        
        const additionalBooking = {
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
        };
        
        additionalBookingsForReviews.push(additionalBooking);
        servicesToEnsureReviews.push(service);
      }
    }
  }

  // Create the additional bookings
  let additionalServiceBookings = [];
  if (additionalBookingsForReviews.length > 0) {
    const { bookings: newBookings } = await seed.bookings(additionalBookingsForReviews);
    additionalServiceBookings = newBookings;
    
    // Link these bookings to their specific services
    const newBookingServiceLinks = [];
    const existingLinks = new Set(bookingServiceLinks.map(link => `${link.booking_id}-${link.service_id}`));
    
    for (let i = 0; i < newBookings.length; i++) {
      const booking = newBookings[i];
      const service = servicesToEnsureReviews[i]; // Direct 1:1 mapping
      
      if (service && booking.id) {
        const linkKey = `${booking.id}-${service.id}`;
        if (!existingLinks.has(linkKey)) {
          newBookingServiceLinks.push({
            booking_id: booking.id,
            service_id: service.id,
          });
          existingLinks.add(linkKey);
        }
      }
    }
    
    if (newBookingServiceLinks.length > 0) {
      await seed.booking_services(newBookingServiceLinks);
    }

    // Create reviews for these additional bookings
    const additionalReviewComments = [
      "Fantastisk opplevelse! Akkurat det jeg trengte.",
      "Så fornøyd med resultatet. Kommer definitivt tilbake!",
      "Profesjonell og hyggelig service. Anbefales på det sterkeste!",
      "Utrolig dyktig! Resultatet overgikk mine forventninger.",
      "Perfekt! Nøyaktig som jeg ønsket meg.",
      "Så bra service og kvalitet. Veldig imponert!",
      "Flott jobb! Føler meg som en helt ny person.",
      "Kunne ikke vært mer fornøyd. Takk for en super opplevelse!",
      "Excellent work! Professional and friendly.",
      "Amazing results! Will definitely recommend to friends.",
      "Perfect service from start to finish!",
      "So happy with the outcome. Great attention to detail!",
      "Wonderful experience! Very skilled and caring.",
      "Outstanding quality! Exceeded all my expectations.",
      "Brilliant work! Could not ask for better service.",
    ];

    for (const booking of additionalServiceBookings) {
      if (booking.id && booking.customer_id && booking.stylist_id) {
        const rating = [3, 4, 4, 4, 5, 5, 5, 5][Math.floor(Math.random() * 8)]; // Weighted towards higher ratings
        const comment = additionalReviewComments[
          Math.floor(Math.random() * additionalReviewComments.length)
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

    // Create the additional reviews
    if (additionalReviews.length > 0) {
      try {
        await seed.reviews(additionalReviews);
        console.log(`-- Created ${additionalReviews.length} additional reviews to ensure service coverage`);
      } catch (error) {
        console.log(`-- Error creating additional reviews: ${error.message}`);
        console.log("-- Skipping additional reviews...");
      }
    }
  }

  const totalReviews = reviews.length + additionalReviews.length;
  console.log(`-- Total reviews created: ${totalReviews}`);

  // Create some review images for variety
  const reviewImagesUrls = [
    "https://images.unsplash.com/photo-1560869713-c9e73ac4e93f?w=400", // hair result
    "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400", // makeup result
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400", // nails result
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400", // lashes result
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400", // salon selfie
  ];

  // Add review images to some reviews (about 30% of reviews)
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

  console.log("-- Successfully seeded database with reviews and ratings!");
  console.log("-- Test accounts:");
  console.log("--   Customer 1: kari.nordmann@example.com (6 bookings)");
  console.log("--   Customer 2: ole.hansen@example.com (2 bookings)");
  console.log("--   All stylists have reviews both received and written");
  console.log(`--   Total reviews: ${totalReviews}`);
  console.log(`--   Every published service has at least 3 reviews`);
  console.log("-- ");
  console.log("-- Cron Job Testing:");
  console.log("--   Added 3 chat messages older than 5 years for cleanup testing");
  console.log("--   Test endpoint: GET /api/cron/cleanup-old-messages");
  console.log("--   Remember to set CRON_SECRET environment variable");

  process.exit(0);
}

main().catch((e) => {
  console.error("-- Seed failed:", e);
  process.exit(1);
});
