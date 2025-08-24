import { Calendar, CreditCard, MessageCircle, Users } from "lucide-react";

export type FAQCategory = {
  id: string;
  name: string;
  icon: React.ReactNode | null;
};

export type FAQ = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export const faqCategories: FAQCategory[] = [
  { id: "all", name: "Alle", icon: null },
  { id: "booking", name: "Booking", icon: <Calendar className="w-4 h-4" /> },
  {
    id: "payment",
    name: "Betaling",
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    id: "stylist",
    name: "For stylister",
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: "general",
    name: "Generelt",
    icon: <MessageCircle className="w-4 h-4" />,
  },
];

export const faqs: FAQ[] = [
  {
    id: "1",
    category: "booking",
    question: "Hvordan booker jeg en stylist?",
    answer:
      "Du kan enkelt booke en stylist ved å søke etter ønsket tjeneste, velge en stylist som passer deg, og følge booking-prosessen. Du trenger bare å oppgi ønsket tid, sted og eventuelle spesielle ønsker.",
  },
  {
    id: "2",
    category: "booking",
    question: "Kan jeg endre eller avbestille min booking?",
    answer:
      "Ja, du kan endre eller avbestille din booking helt gratis frem til 24 timer før avtalt tid. Ved senere avbestilling kan det påløpe gebyr. Du kan administrere dine bookinger i 'Min side'.",
  },
  {
    id: "3",
    category: "payment",
    question: "Når blir jeg belastet for tjenesten?",
    answer:
      "Betalingen trekkes automatisk 24 timer før avtalt tid. Dette sikrer at begge parter er forpliktet til avtalen og reduserer antall no-shows.",
  },
  {
    id: "4",
    category: "payment",
    question: "Hvilke betalingsmetoder godtar dere?",
    answer:
      "Vi godtar alle vanlige betalingskort (Visa, Mastercard, American Express) samt Vipps. All betaling håndteres sikkert gjennom Stripe.",
  },
  {
    id: "5",
    category: "general",
    question: "Er stylistene forsikret?",
    answer:
      "Ja, alle våre stylister må ha gyldig ansvarsforsikring før de kan tilby tjenester på plattformen. Vi verifiserer også deres utdanning og erfaring.",
  },
  {
    id: "6",
    category: "general",
    question: "Hva skjer hvis jeg ikke er fornøyd med tjenesten?",
    answer:
      "Vi tar alle klager på alvor. Kontakt vår kundeservice innen 48 timer, så hjelper vi deg med å finne en løsning. Dette kan inkludere refusjon eller ny behandling.",
  },
  {
    id: "7",
    category: "stylist",
    question: "Hvordan blir jeg stylist på plattformen?",
    answer:
      "Du kan søke om å bli stylist ved å klikke på 'Bli stylist' og fylle ut søknadsskjemaet. Vi krever relevant utdanning, erfaring og gyldig forsikring.",
  },
  {
    id: "8",
    category: "stylist",
    question: "Hvor mye tjener stylister på plattformen?",
    answer:
      "Stylister setter sine egne priser og beholder 85% av inntektene. Vi trekker 15% i plattformgebyr som dekker betalingsbehandling, markedsføring og support.",
  },
  {
    id: "9",
    category: "booking",
    question: "Kan stylisten komme hjem til meg?",
    answer:
      "Ja, mange av våre stylister tilbyr hjemmebesøk. Du kan filtrere søkeresultatene for å se hvilke stylister som kommer hjem til deg i ditt område.",
  },
  {
    id: "10",
    category: "general",
    question: "Hvordan fungerer ratingsystemet?",
    answer:
      "Etter hver fullførte tjeneste kan både kunde og stylist gi hverandre rating og anmeldelse. Dette hjelper andre brukere med å ta informerte valg og opprettholder høy kvalitet på plattformen.",
  },
];

export function filterFAQs({
  faqs,
  category,
  searchTerm,
}: {
  faqs: FAQ[];
  category: string;
  searchTerm: string;
}) {
  return faqs.filter((faq) => {
    const matchesCategory = category === "all" || faq.category === category;
    const matchesSearch =
      searchTerm === "" ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}

export function getFAQsByCategory(category: string) {
  return faqs.filter((faq) => faq.category === category);
}

export function getPopularFAQs(category: string, limit: number = 3) {
  const categoryFAQs = category === "all" ? faqs : getFAQsByCategory(category);
  return categoryFAQs.slice(0, limit);
}
