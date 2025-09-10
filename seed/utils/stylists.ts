import type {
  SeedClient,
  stylist_availability_rulesScalars,
  usersScalars,
} from "@snaplet/seed";

/**
 * Creates detailed profiles for stylists including bio, social media, and travel preferences
 * Profiles will exist due to database trigger when users were created
 */
export async function createStylistDetailedProfiles(
  seed: SeedClient,
  stylistUsers: usersScalars[],
) {
  console.log("-- Creating stylist detailed profiles...");

  await seed.stylist_details([
    // Oslo stylists
    {
      profile_id: stylistUsers[0].id, // Maria Hansen
      bio:
        "Erfaren frisør med over 10 års erfaring. Spesialiserer meg på moderne klipp og fargeteknikker.",
      can_travel: true,
      has_own_place: true,
      travel_distance_km: 15,
      instagram_profile: "https://www.instagram.com/mariahansen_hair",
      stripe_account_id: null,
    },
    {
      profile_id: stylistUsers[1].id, // Sophia Larsen
      bio:
        "Spesialist på bryn og vipper. Sertifisert lash technician med fokus på naturlige resultater.",
      can_travel: false,
      has_own_place: true,
      travel_distance_km: null,
      instagram_profile: "https://www.instagram.com/sophialashes",
      facebook_profile: "https://www.facebook.com/sophialarsenlashes",
      stripe_account_id: null,
    },
    // Bergen stylists
    {
      profile_id: stylistUsers[2].id, // Emma Nilsen
      bio:
        "Makeup artist og negletekniker. Elsker å skape unike looks for mine kunder!",
      can_travel: true,
      has_own_place: false,
      travel_distance_km: 20,
      instagram_profile: "https://www.instagram.com/emma_beauty",
      tiktok_profile: "https://www.tiktok.com/@emmabeautybergen",
      stripe_account_id: null,
    },
    {
      profile_id: stylistUsers[3].id, // Lisa Berg
      bio:
        "Profesjonell hårfrisør og fargeekspert. Brenner for å skape fantastiske frisyrer som passer din stil.",
      can_travel: true,
      has_own_place: true,
      travel_distance_km: 25,
      instagram_profile: "https://www.instagram.com/lisaberg_hair",
      stripe_account_id: null,
    },
    // Trondheim stylists
    {
      profile_id: stylistUsers[4].id, // Anna Johansen
      bio:
        "Spesialiserer meg på bryllup og festmakeup. Over 8 års erfaring med å få folk til å skinne!",
      can_travel: true,
      has_own_place: true,
      travel_distance_km: 30,
      instagram_profile: "https://www.instagram.com/anna_makeup_trondheim",
      facebook_profile: "https://www.facebook.com/annamakeup",
      stripe_account_id: null,
    },
    {
      profile_id: stylistUsers[5].id, // Ingrid Solberg
      bio:
        "Sertifisert negletekniker med fokus på gel og akryl. Elsker kreative design og nail art!",
      can_travel: false,
      has_own_place: true,
      travel_distance_km: null,
      instagram_profile: "https://www.instagram.com/ingrid_nails",
      stripe_account_id: null,
    },
    // Stavanger stylists
    {
      profile_id: stylistUsers[6].id, // Camilla Eriksen
      bio:
        "Hårfrisør med spesialisering innen balayage og moderne fargeteknikker. La meg hjelpe deg finne din perfekte look!",
      can_travel: true,
      has_own_place: true,
      travel_distance_km: 20,
      instagram_profile: "https://www.instagram.com/camilla_hair_stavanger",
      tiktok_profile: "https://www.tiktok.com/@camillahair",
      stripe_account_id: null,
    },
    {
      profile_id: stylistUsers[7].id, // Thea Andersen
      bio:
        "Vippeextensions og brynforming er min spesialitet. Fokus på naturlig skjønnhet og holdbare resultater.",
      can_travel: true,
      has_own_place: false,
      travel_distance_km: 15,
      instagram_profile: "https://www.instagram.com/thea_lashes",
      stripe_account_id: null,
    },
    // Kristiansand stylists
    {
      profile_id: stylistUsers[8].id, // Marte Kristiansen
      bio:
        "Allsidig stylist med erfaring innen hår, makeup og negler. Jeg hjelper deg å se din beste ut!",
      can_travel: true,
      has_own_place: true,
      travel_distance_km: 25,
      instagram_profile: "https://www.instagram.com/marte_beauty_krs",
      youtube_profile: "https://www.youtube.com/channel/UCMarteBeautyKRS",
      stripe_account_id: null,
    },
    {
      profile_id: stylistUsers[9].id, // Sara Pedersen
      bio:
        "Spesialist på festfrisyrer og updos. Perfekt for bryllup, ball og andre spesielle anledninger.",
      can_travel: true,
      has_own_place: true,
      travel_distance_km: 20,
      instagram_profile: "https://www.instagram.com/sara_hair_kristiansand",
      stripe_account_id: null,
    },
  ]);
}

/**
 * Creates availability rules for all stylists with varied schedules
 * Most stylists work weekdays with some variation in hours and Saturday availability
 */
export async function createStylistAvailabilityRules(
  seed: SeedClient,
  stylistUsers: usersScalars[],
) {
  console.log("-- Creating stylist availability rules...");

  const availabilityRules = [];
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
        day_of_week: day as stylist_availability_rulesScalars["day_of_week"],
        start_time: `${startHour.toString().padStart(2, "0")}:00`,
        end_time: `${endHour.toString().padStart(2, "0")}:00`,
      });
    }

    // About 70% work Saturdays
    if (i % 10 < 7) {
      availabilityRules.push({
        stylist_id: stylist.id,
        day_of_week:
          "saturday" as stylist_availability_rulesScalars["day_of_week"],
        start_time: `${(10 + (i % 2)).toString().padStart(2, "0")}:00`, // 10 or 11 AM
        end_time: `${(15 + (i % 2)).toString().padStart(2, "0")}:00`, // 15 or 16 PM
      });
    }
  }

  await seed.stylist_availability_rules(availabilityRules);
}

/**
 * Creates one-off unavailability periods for stylists (appointments, breaks, etc.)
 */
export async function createStylistUnavailabilityPeriods(
  seed: SeedClient,
  stylistUsers: usersScalars[],
) {
  console.log("-- Creating stylist unavailability periods...");

  const { addDays, addHours } = await import("date-fns");

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
}

/**
 * Creates recurring unavailability patterns for stylists (regular breaks, meetings, etc.)
 */
export async function createStylistRecurringUnavailability(
  seed: SeedClient,
  stylistUsers: usersScalars[],
) {
  console.log("-- Creating stylist recurring unavailability patterns...");

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
}
