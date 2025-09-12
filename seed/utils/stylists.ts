import type {
  SeedClient,
  stylist_availability_rulesScalars,
  usersScalars,
} from "@snaplet/seed";

// Predefined social media URLs for random selection (other platforms not in main schema)
const OTHER_SOCIAL_MEDIA_URLS = [
  "https://www.pinterest.com/beautyinspiration",
  "https://www.linkedin.com/in/professional-stylist",
  "https://www.behance.net/beautycreative",
  "https://vimeo.com/beautytutorials",
  "https://www.twitch.tv/livestyling",
  "https://discord.gg/beautycommunity",
  "https://www.clubhouse.com/@beautytalk",
  "https://www.reddit.com/user/professionalstylist",
  "https://medium.com/@beautyblogger",
  "https://www.tumblr.com/beautytrends",
  "https://www.threads.net/@beautystylist",
];

// Helper function to get random social media URLs
function getRandomSocialMediaUrls(count: number = 1): string[] {
  const shuffled = [...OTHER_SOCIAL_MEDIA_URLS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Helper function to generate varied social media profiles
function generateSocialMediaProfiles(
  stylistName: string,
  city: string,
  specialty: string,
) {
  const firstName = stylistName.split(" ")[0].toLowerCase();
  const lastName = stylistName.split(" ")[1].toLowerCase();
  const cityShort = city.toLowerCase();
  const randomNum = Math.floor(Math.random() * 999);

  const profiles: {
    instagram_profile: string | null;
    facebook_profile: string | null;
    tiktok_profile: string | null;
    youtube_profile: string | null;
    snapchat_profile: string | null;
    other_social_media_urls: string[];
  } = {
    instagram_profile: null,
    facebook_profile: null,
    tiktok_profile: null,
    youtube_profile: null,
    snapchat_profile: null,
    other_social_media_urls: [],
  };

  // Instagram (most stylists have this)
  if (Math.random() > 0.1) { // 90% chance
    const instagramHandles = [
      `${firstName}${lastName}_${specialty}`,
      `${firstName}_${specialty}_${cityShort}`,
      `${firstName}${specialty}${randomNum}`,
      `${firstName}.${lastName}.${specialty}`,
    ];
    profiles.instagram_profile = `https://www.instagram.com/${
      instagramHandles[Math.floor(Math.random() * instagramHandles.length)]
    }`;
  }

  // Facebook (about 40% chance)
  if (Math.random() > 0.6) {
    const facebookHandles = [
      `${firstName}${lastName}${specialty}`,
      `${firstName}.${lastName}.${specialty}`,
      `${specialty}with${firstName}`,
    ];
    profiles.facebook_profile = `https://www.facebook.com/${
      facebookHandles[Math.floor(Math.random() * facebookHandles.length)]
    }`;
  }

  // TikTok (about 30% chance, younger stylists)
  if (Math.random() > 0.7) {
    const tiktokHandles = [
      `${firstName}${specialty}${cityShort}`,
      `${firstName}_${specialty}_tips`,
      `${specialty}by${firstName}`,
    ];
    profiles.tiktok_profile = `https://www.tiktok.com/@${
      tiktokHandles[Math.floor(Math.random() * tiktokHandles.length)]
    }`;
  }

  // YouTube (about 20% chance)
  if (Math.random() > 0.8) {
    const youtubeChannels = [
      `${firstName}${lastName}Tutorials`,
      `${specialty}With${firstName}`,
      `${firstName}${specialty}Channel`,
    ];
    profiles.youtube_profile = `https://www.youtube.com/@${
      youtubeChannels[Math.floor(Math.random() * youtubeChannels.length)]
    }`;
  }

  // Snapchat (about 15% chance)
  if (Math.random() > 0.85) {
    profiles.snapchat_profile =
      `https://www.snapchat.com/add/${firstName}${specialty}${randomNum}`;
  }

  // Other social media (about 25% chance)
  if (Math.random() > 0.75) {
    profiles.other_social_media_urls = getRandomSocialMediaUrls(1) || [];
  }

  return profiles;
}

/**
 * Creates detailed profiles for stylists including bio, social media, and travel preferences
 * Profiles will exist due to database trigger when users were created
 */
export async function createStylistDetailedProfiles(
  seed: SeedClient,
  stylistUsers: usersScalars[],
) {
  console.log("-- Creating stylist detailed profiles...");

  // Stylist data with names, cities, and specialties
  const stylistData = [
    { name: "Maria Hansen", city: "Oslo", specialty: "hair" },
    { name: "Sophia Larsen", city: "Oslo", specialty: "lashes" },
    { name: "Emma Nilsen", city: "Bergen", specialty: "beauty" },
    { name: "Lisa Berg", city: "Bergen", specialty: "hair" },
    { name: "Anna Johansen", city: "Trondheim", specialty: "makeup" },
    { name: "Ingrid Solberg", city: "Trondheim", specialty: "nails" },
    { name: "Camilla Eriksen", city: "Stavanger", specialty: "hair" },
    { name: "Thea Andersen", city: "Stavanger", specialty: "lashes" },
    { name: "Marte Kristiansen", city: "Kristiansand", specialty: "beauty" },
    { name: "Sara Pedersen", city: "Kristiansand", specialty: "hair" },
  ];

  const stylistProfiles = stylistData.map((stylist, index) => {
    const socialMedia = generateSocialMediaProfiles(
      stylist.name,
      stylist.city,
      stylist.specialty,
    );

    return {
      profile_id: stylistUsers[index].id,
      bio: getBioForStylist(stylist.specialty),
      can_travel: Math.random() > 0.3, // 70% can travel
      has_own_place: Math.random() > 0.2, // 80% have own place
      travel_distance_km: Math.random() > 0.3
        ? Math.floor(Math.random() * 25) + 10
        : null, // 10-35km
      instagram_profile: socialMedia.instagram_profile || null,
      facebook_profile: socialMedia.facebook_profile || null,
      tiktok_profile: socialMedia.tiktok_profile || null,
      youtube_profile: socialMedia.youtube_profile || null,
      snapchat_profile: socialMedia.snapchat_profile || null,
      other_social_media_urls: socialMedia.other_social_media_urls,
      stripe_account_id: null,
      identity_verification_completed_at: null,
      stripe_verification_session_id: null,
    };
  });

  await seed.stylist_details(stylistProfiles);
}

// Helper function to generate bios based on specialty
function getBioForStylist(specialty: string): string {
  const bios = {
    hair: [
      `Erfaren frisør med over 10 års erfaring. Spesialiserer meg på moderne klipp og fargeteknikker.`,
      `Profesjonell hårfrisør og fargeekspert. Brenner for å skape fantastiske frisyrer som passer din stil.`,
      `Hårfrisør med spesialisering innen balayage og moderne fargeteknikker. La meg hjelpe deg finne din perfekte look!`,
      `Spesialist på festfrisyrer og updos. Perfekt for bryllup, ball og andre spesielle anledninger.`,
    ],
    lashes: [
      `Spesialist på bryn og vipper. Sertifisert lash technician med fokus på naturlige resultater.`,
      `Vippeextensions og brynforming er min spesialitet. Fokus på naturlig skjønnhet og holdbare resultater.`,
    ],
    beauty: [
      `Makeup artist og negletekniker. Elsker å skape unike looks for mine kunder!`,
      `Allsidig stylist med erfaring innen hår, makeup og negler. Jeg hjelper deg å se din beste ut!`,
    ],
    makeup: [
      `Spesialiserer meg på bryllup og festmakeup. Over 8 års erfaring med å få folk til å skinne!`,
    ],
    nails: [
      `Sertifisert negletekniker med fokus på gel og akryl. Elsker kreative design og nail art!`,
    ],
  };

  const specialtyBios = bios[specialty as keyof typeof bios] || bios.beauty;
  return specialtyBios[Math.floor(Math.random() * specialtyBios.length)];
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
