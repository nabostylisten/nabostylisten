import { Database } from "@/types/database.types";

// Service category types
export type ServiceCategoryKey =
  | "hair"
  | "nails"
  | "makeup"
  | "browsLashes"
  | "wedding";

// Curated images organized by main category
export const categoryImages: Record<ServiceCategoryKey, string[]> = {
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

export type SeedPassword = "demo-password";

export const seedPasswordToEncrypted: Record<SeedPassword, string> = {
  "demo-password":
    "$2a$10$JEpaf.puIXxfqjkPaNCLle3a0yB4x2XbnTUH7L5SoK7J45bpeykla",
};

// Mock includes and requirements data organized by category
export const categoryIncludes: Record<ServiceCategoryKey, string[]> = {
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

export const categoryRequirements: Record<ServiceCategoryKey, string[]> = {
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

// Utility functions for generating valid numeric values within database ranges
export function generateValidPercentage(min = 0.05, max = 0.50): number {
  // Generate percentage as decimal (0.20 = 20%) within valid range for numeric(3,2)
  // numeric(3,2) allows values from -9.99 to 9.99, but we use 0.xx for percentages
  const value = Math.random() * (max - min) + min;
  return Math.round(value * 100) / 100; // Round to 2 decimal places
}

export function generateValidCommissionPercentage(): number {
  // Generate affiliate commission percentage between 15% and 25%
  return generateValidPercentage(0.15, 0.25);
}

export function getRandomImagesForCategory(
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

export function getRandomItemsFromArray<T>(
  array: T[],
  min: number = 3,
  max: number = 5,
): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

export type AuthUser = {
  email: string;
  full_name: string;
  role: Database["public"]["Enums"]["user_role"];
  phone_number: string;
};

export const reviewImagesUrls = [
  "https://images.unsplash.com/photo-1560869713-c9e73ac4e93f?w=400", // hair result
  "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400", // makeup result
  "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400", // nails result
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400", // lashes result
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400", // salon selfie
];
