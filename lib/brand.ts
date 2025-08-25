import type { Metadata } from "next";

type BrandColors = {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  muted: string;
  accent: string;
  destructive: string;
};

export const brandColors: Record<"light" | "dark", BrandColors> = {
  light: {
    background: "#f8f6ff",
    foreground: "#453676",
    primary: "#a494c4",
    secondary: "#fdeae3",
    muted: "#eae8f1",
    accent: "#e9fbe4",
    destructive: "#ff3434",
  },
  dark: {
    background: "#1c1723",
    foreground: "#f8f6ff",
    primary: "#a494c4",
    secondary: "#7cb36d",
    muted: "#3a3145",
    accent: "#48405c",
    destructive: "#930909",
  },
};

// Company configuration
export const companyConfig = {
  name: "Nabostylisten",
  tagline: "Book din stylist hjemme",
  description:
    "Norges ledende platform for skjønnhetstjenester hjemme eller på salong. Finn din perfekte stylist i dag.",
  shortDescription: "Norges ledende platform for skjønnhetstjenester",
  domain: "nabostylisten.no",
  url: "https://nabostylisten.no",

  // Page-specific content
  pages: {
    home: {
      title: "Nabostylisten - Book din stylist hjemme",
      description:
        "Norges ledende platform for skjønnhetstjenester hjemme eller på salong. Finn din perfekte stylist i dag.",
      ogTitle: "Nabostylisten",
      ogSubtitle: "Book din stylist hjemme",
      ogDescription: "Norges ledende platform for skjønnhetstjenester",
    },
    tjenester: {
      title: "Tjenester - Nabostylisten",
      description:
        "Finn din perfekte stylist for hår, negler, makeup, lashes & brows og bryllup på Nabostylisten.",
      ogTitle: "Tjenester",
      ogSubtitle: "Finn din perfekte stylist",
      ogDescription: "Hår • Negler • Makeup • Lashes & Brows • Bryllup",
    },
    bliStylist: {
      title: "Bli stylist - Nabostylisten",
      description:
        "Start din egen virksomhet som stylist. Møt kunder i ditt område og øk inntektene dine på Nabostylisten.",
      ogTitle: "Bli stylist",
      ogSubtitle: "Start din egen virksomhet",
      ogDescription: "Møt kunder i ditt område og øk inntektene dine",
    },
    kontakt: {
      title: "Kontakt oss - Nabostylisten",
      description:
        "Har du spørsmål om våre tjenester? Vi er her for å hjelpe deg. Kontakt Nabostylisten.",
      ogTitle: "Kontakt oss",
      ogSubtitle: "Vi er her for å hjelpe deg",
      ogDescription: "Har du spørsmål om våre tjenester?",
    },
    omOss: {
      title: "Om oss - Nabostylisten",
      description:
        "Lær mer om vår historie og misjon. Nabostylisten er Norges ledende platform for skjønnhetstjenester.",
      ogTitle: "Om oss",
      ogSubtitle: "Vår historie og misjon",
      ogDescription: "Norges ledende platform for skjønnhetstjenester",
    },
    faq: {
      title: "FAQ - Nabostylisten",
      description:
        "Finn svar på ofte stilte spørsmål om Nabostylisten og våre skjønnhetstjenester.",
    },
    privacy: {
      title: "Personvernerklæring - Nabostylisten",
      description:
        "Les om hvordan Nabostylisten behandler og beskytter dine personlige opplysninger.",
    },
    termsOfService: {
      title: "Bruksvilkår - Nabostylisten",
      description:
        "Les våre bruksvilkår for bruk av Nabostylisten sin plattform og tjenester.",
    },
    handlekurv: {
      title: "Handlekurv - Nabostylisten",
      description:
        "Se dine valgte tjenester og fullfør bestillingen på Nabostylisten.",
    },
  },
} as const;

// Helper function to create complete metadata for a page
export function createPageMetadata(
  pageKey: keyof typeof companyConfig.pages,
  customMetadata?: Partial<{
    title: string;
    description: string;
    url: string;
    type: string;
  }>,
): Metadata {
  const pageConfig = companyConfig.pages[pageKey];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || companyConfig.url;

  return {
    title: customMetadata?.title || pageConfig.title,
    description: customMetadata?.description || pageConfig.description,
    applicationName: companyConfig.name,
    openGraph: {
      title: customMetadata?.title || pageConfig.title,
      description: customMetadata?.description || pageConfig.description,
      type: "website" as const,
      url: customMetadata?.url ? `${baseUrl}${customMetadata.url}` : baseUrl,
      siteName: companyConfig.name,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: customMetadata?.title || pageConfig.title,
      description: customMetadata?.description || pageConfig.description,
    },
  };
}
