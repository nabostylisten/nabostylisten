import type {
  chatsScalars,
  SeedClient,
  usersScalars,
} from "@snaplet/seed";
import { addDays, subDays } from "date-fns";

/**
 * Creates customer-stylist chat channels for continuous conversations
 */
export async function createCustomerStylistChats(
  seed: SeedClient,
  customerUsers: usersScalars[],
  stylistUsers: usersScalars[],
) {
  console.log("-- Creating customer-stylist chats...");

  // Create more diverse chat relationships
  const { chats } = await seed.chats([
    // Kari's chats (active customer with multiple stylists)
    {
      customer_id: customerUsers[0].id, // Kari
      stylist_id: stylistUsers[0].id, // Maria
    },
    {
      customer_id: customerUsers[0].id, // Kari
      stylist_id: stylistUsers[1].id, // Emma
    },
    {
      customer_id: customerUsers[0].id, // Kari
      stylist_id: stylistUsers[2].id, // Sofia
    },

    // Ole's chats (wedding planning customer)
    {
      customer_id: customerUsers[1].id, // Ole
      stylist_id: stylistUsers[1].id, // Emma (wedding specialist)
    },
    {
      customer_id: customerUsers[1].id, // Ole
      stylist_id: stylistUsers[3].id, // Linda (makeup)
    },

    // Per's chats (new customer exploring services)
    {
      customer_id: customerUsers[2].id, // Per
      stylist_id: stylistUsers[0].id, // Maria
    },
    {
      customer_id: customerUsers[2].id, // Per
      stylist_id: stylistUsers[2].id, // Sofia
    },

    // Ingrid's chats (regular customer)
    {
      customer_id: customerUsers[3].id, // Ingrid
      stylist_id: stylistUsers[1].id, // Emma
    },
    {
      customer_id: customerUsers[3].id, // Ingrid
      stylist_id: stylistUsers[3].id, // Linda
    },
    {
      customer_id: customerUsers[3].id, // Ingrid
      stylist_id: stylistUsers[4].id, // Nina
    },

    // Additional diverse chats
    {
      customer_id: customerUsers[4].id, // Erik
      stylist_id: stylistUsers[2].id, // Sofia
    },
    {
      customer_id: customerUsers[5].id, // Astrid
      stylist_id: stylistUsers[0].id, // Maria
    },
    {
      customer_id: customerUsers[5].id, // Astrid
      stylist_id: stylistUsers[4].id, // Nina
    },
  ]);

  return chats;
}

/**
 * Creates old chat messages for cron job testing
 * These messages are older than 5 years and should be cleaned up by the scheduled job
 */
export async function createOldChatMessagesForCronTesting(
  seed: SeedClient,
  chats: chatsScalars[],
  customerUsers: usersScalars[],
  stylistUsers: usersScalars[],
) {
  console.log("-- Creating old chat messages for cron job testing...");

  const sixYearsAgo = subDays(new Date(), 365 * 6); // 6 years ago

  // Create old messages that should be deleted by cron job
  await seed.chat_messages([
    {
      chat_id: chats[0].id,
      sender_id: customerUsers[0].id,
      content:
        "Dette er en veldig gammel melding som skal slettes av cron job.",
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
}

/**
 * Creates current chat messages between customers and stylists for testing
 * Includes various conversation scenarios and read/unread states
 */
export async function createCurrentChatMessages(
  seed: SeedClient,
  chats: chatsScalars[],
  customerUsers: usersScalars[],
  stylistUsers: usersScalars[],
) {
  console.log("-- Creating current chat messages...");

  const twoWeeksAgo = subDays(new Date(), 14);
  const oneWeekAgo = subDays(new Date(), 7);
  const threeDaysAgo = subDays(new Date(), 3);
  const yesterday = subDays(new Date(), 1);
  const todayMorning = new Date();
  todayMorning.setHours(9, 0, 0, 0);
  const todayAfternoon = new Date();
  todayAfternoon.setHours(14, 30, 0, 0);

  await seed.chat_messages([
    // Chat 0: Kari <-> Maria - Long-term client relationship with multiple services
    {
      chat_id: chats[0].id,
      sender_id: customerUsers[0].id, // Kari
      content: "Hei Maria! Jeg lurer på om du har tid til en balayage i løpet av de neste ukene?",
      is_read: true,
      created_at: twoWeeksAgo,
    },
    {
      chat_id: chats[0].id,
      sender_id: stylistUsers[0].id, // Maria
      content: "Hei Kari! Så hyggelig å høre fra deg! Jeg har tid neste fredag kl 14:00 eller lørdag kl 10:00. Hva passer best for deg?",
      is_read: true,
      created_at: addDays(twoWeeksAgo, 0.1),
    },
    {
      chat_id: chats[0].id,
      sender_id: customerUsers[0].id, // Kari
      content: "Fredag kl 14 passer perfekt! Jeg ønsker litt lysere toner denne gangen.",
      is_read: true,
      created_at: addDays(twoWeeksAgo, 0.2),
    },
    {
      chat_id: chats[0].id,
      sender_id: stylistUsers[0].id, // Maria
      content: "Flott! Jeg har booket deg inn. Vi kan gå for honningblonde toner, det vil passe hudtonen din perfekt ✨",
      is_read: true,
      created_at: addDays(twoWeeksAgo, 0.3),
    },
    {
      chat_id: chats[0].id,
      sender_id: customerUsers[0].id, // Kari
      content: "Takk for sist! Resultatet ble helt fantastisk! 😍",
      is_read: true,
      created_at: oneWeekAgo,
    },
    {
      chat_id: chats[0].id,
      sender_id: stylistUsers[0].id, // Maria
      content: "Så glad for at du er fornøyd! Husk å bruke den lilla sjampoen jeg anbefalte 💜",
      is_read: true,
      created_at: addDays(oneWeekAgo, 0.1),
    },
    {
      chat_id: chats[0].id,
      sender_id: customerUsers[0].id, // Kari
      content: "Hei igjen! Jeg har et julebord om 2 uker. Har du tid til en oppfriskning?",
      is_read: true,
      created_at: yesterday,
    },
    {
      chat_id: chats[0].id,
      sender_id: stylistUsers[0].id, // Maria
      content: "Selvfølgelig! La meg sjekke kalenderen min...",
      is_read: false, // Unread
      created_at: todayMorning,
    },

    // Chat 1: Kari <-> Emma - Nail art specialist relationship
    {
      chat_id: chats[1].id,
      sender_id: customerUsers[0].id, // Kari
      content: "Hei Emma! Venninnen min anbefalte deg for neglekunst. Har du tid denne måneden?",
      is_read: true,
      created_at: addDays(twoWeeksAgo, -2),
    },
    {
      chat_id: chats[1].id,
      sender_id: stylistUsers[1].id, // Emma
      content: "Hei Kari! Så hyggelig! Jeg har flere ledige tider. Hva slags design liker du?",
      is_read: true,
      created_at: addDays(twoWeeksAgo, -1.9),
    },
    {
      chat_id: chats[1].id,
      sender_id: customerUsers[0].id, // Kari
      content: "Jeg liker minimalistiske design med geometriske mønstre. Har du noen eksempler?",
      is_read: true,
      created_at: addDays(twoWeeksAgo, -1.8),
    },
    {
      chat_id: chats[1].id,
      sender_id: stylistUsers[1].id, // Emma
      content: "Absolutt! La meg sende deg noen av mine tidligere arbeider...",
      is_read: true,
      created_at: addDays(twoWeeksAgo, -1.7),
    },
    {
      chat_id: chats[1].id,
      sender_id: stylistUsers[1].id, // Emma
      content: "[Bilde sendt] Her er noen geometriske design jeg har laget nylig",
      is_read: true,
      created_at: addDays(twoWeeksAgo, -1.6),
    },
    {
      chat_id: chats[1].id,
      sender_id: customerUsers[0].id, // Kari
      content: "WOW! Det andre designet er perfekt! Kan vi gjøre noe lignende?",
      is_read: true,
      created_at: addDays(twoWeeksAgo, -1.5),
    },
    {
      chat_id: chats[1].id,
      sender_id: stylistUsers[1].id, // Emma
      content: "Definitivt! Book en 90-minutters time så har vi god tid 💅",
      is_read: true,
      created_at: addDays(twoWeeksAgo, -1.4),
    },

    // Chat 2: Kari <-> Sofia - New service exploration
    {
      chat_id: chats[2].id,
      sender_id: stylistUsers[2].id, // Sofia
      content: "Hei Kari! Takk for bookingen. Jeg gleder meg til å møte deg på torsdag!",
      is_read: true,
      created_at: threeDaysAgo,
    },
    {
      chat_id: chats[2].id,
      sender_id: customerUsers[0].id, // Kari
      content: "Hei Sofia! Jeg også! Er det noe spesielt jeg bør forberede?",
      is_read: true,
      created_at: addDays(threeDaysAgo, 0.1),
    },
    {
      chat_id: chats[2].id,
      sender_id: stylistUsers[2].id, // Sofia
      content: "Bare kom med rent, tørt hår. Og hvis du har inspirasjonbilder, ta dem gjerne med!",
      is_read: false, // Unread
      created_at: yesterday,
    },

    // Chat 3: Ole <-> Emma - Wedding planning (extensive)
    {
      chat_id: chats[3].id,
      sender_id: customerUsers[1].id, // Ole
      content: "Hei Emma! Min forlovede og jeg skal gifte oss i juni. Vi trenger hjelp med både hår og makeup for bruden og 4 brudepiker.",
      is_read: true,
      created_at: addDays(twoWeeksAgo, -5),
    },
    {
      chat_id: chats[3].id,
      sender_id: stylistUsers[1].id, // Emma
      content: "Gratulerer med forlovelsen! 💕 Dette høres fantastisk ut! Jeg spesialiserer meg på bryllupsstyling.",
      is_read: true,
      created_at: addDays(twoWeeksAgo, -4.9),
    },
    {
      chat_id: chats[3].id,
      sender_id: stylistUsers[1].id, // Emma
      content: "For et bryllup av denne størrelsen anbefaler jeg at vi starter med en prøvesminkning og frisyre for bruden.",
      is_read: true,
      created_at: addDays(twoWeeksAgo, -4.8),
    },
    {
      chat_id: chats[3].id,
      sender_id: customerUsers[1].id, // Ole
      content: "Det høres fornuftig ut. Når kan vi gjøre prøven?",
      is_read: true,
      created_at: addDays(twoWeeksAgo, -4.7),
    },
    {
      chat_id: chats[3].id,
      sender_id: stylistUsers[1].id, // Emma
      content: "Jeg har tid neste lørdag kl 10-13. Da får vi god tid til å prøve forskjellige stiler.",
      is_read: true,
      created_at: addDays(twoWeeksAgo, -4.6),
    },
    {
      chat_id: chats[3].id,
      sender_id: customerUsers[1].id, // Ole
      content: "Perfekt! Vi kommer begge to. Hva er prisen for prøven?",
      is_read: true,
      created_at: addDays(twoWeeksAgo, -4.5),
    },
    {
      chat_id: chats[3].id,
      sender_id: stylistUsers[1].id, // Emma
      content: "Prøven koster 1500kr, men dette trekkes fra totalprisen hvis dere booker meg for bryllupet 😊",
      is_read: true,
      created_at: addDays(twoWeeksAgo, -4.4),
    },

    // Chat 4: Ole <-> Linda - Wedding makeup coordination
    {
      chat_id: chats[4].id,
      sender_id: customerUsers[1].id, // Ole
      content: "Hei Linda! Emma anbefalte deg for makeup til brudepikene våre.",
      is_read: true,
      created_at: oneWeekAgo,
    },
    {
      chat_id: chats[4].id,
      sender_id: stylistUsers[3].id, // Linda
      content: "Hei Ole! Ja, Emma og jeg samarbeider ofte på bryllup. Hvor mange brudepiker er det?",
      is_read: true,
      created_at: addDays(oneWeekAgo, 0.1),
    },
    {
      chat_id: chats[4].id,
      sender_id: customerUsers[1].id, // Ole
      content: "Det er 4 brudepiker. Kan du være på samme lokasjon som Emma på bryllupsdagen?",
      is_read: true,
      created_at: addDays(oneWeekAgo, 0.2),
    },
    {
      chat_id: chats[4].id,
      sender_id: stylistUsers[3].id, // Linda
      content: "Absolutt! Vi jobber som et team. Jeg kan sende deg en pakkeløsning for alle brudepikene.",
      is_read: false, // Unread
      created_at: yesterday,
    },

    // Chat 5: Per <-> Maria - New customer inquiry
    {
      chat_id: chats[5].id,
      sender_id: customerUsers[2].id, // Per
      content: "Hei! Jeg så profilen din og vurderer å prøve keratinbehandling. Har du erfaring med krøllete hår?",
      is_read: true,
      created_at: threeDaysAgo,
    },
    {
      chat_id: chats[5].id,
      sender_id: stylistUsers[0].id, // Maria
      content: "Hei Per! Ja, jeg har spesialisert meg på keratinbehandlinger for alle hårtyper, inkludert krøllete hår.",
      is_read: true,
      created_at: addDays(threeDaysAgo, 0.1),
    },
    {
      chat_id: chats[5].id,
      sender_id: stylistUsers[0].id, // Maria
      content: "Behandlingen tar ca 3 timer og holder i 3-4 måneder. Ønsker du mer informasjon?",
      is_read: true,
      created_at: addDays(threeDaysAgo, 0.2),
    },
    {
      chat_id: chats[5].id,
      sender_id: customerUsers[2].id, // Per
      content: "Ja takk! Og hva koster det?",
      is_read: false, // Unread
      created_at: todayMorning,
    },

    // Chat 6: Per <-> Sofia - Price negotiation
    {
      chat_id: chats[6].id,
      sender_id: customerUsers[2].id, // Per
      content: "Hei Sofia, jeg så at du tilbyr herreklipp. Har du studentrabatt?",
      is_read: true,
      created_at: oneWeekAgo,
    },
    {
      chat_id: chats[6].id,
      sender_id: stylistUsers[2].id, // Sofia
      content: "Hei! Ja, jeg gir 20% studentrabatt mot gyldig studentbevis 🎓",
      is_read: true,
      created_at: addDays(oneWeekAgo, 0.1),
    },
    {
      chat_id: chats[6].id,
      sender_id: customerUsers[2].id, // Per
      content: "Flott! Kan jeg booke tid på fredag?",
      is_read: true,
      created_at: addDays(oneWeekAgo, 0.2),
    },

    // Chat 7: Ingrid <-> Emma - Regular customer with history
    {
      chat_id: chats[7].id,
      sender_id: stylistUsers[1].id, // Emma
      content: "Hei Ingrid! Det er på tide med påfyll på neglene dine. Skal vi booke vanlig tid?",
      is_read: true,
      created_at: oneWeekAgo,
    },
    {
      chat_id: chats[7].id,
      sender_id: customerUsers[3].id, // Ingrid
      content: "Hei Emma! Ja, det passer bra. Samme tid som vanlig på tirsdag?",
      is_read: true,
      created_at: addDays(oneWeekAgo, 0.1),
    },
    {
      chat_id: chats[7].id,
      sender_id: stylistUsers[1].id, // Emma
      content: "Perfekt! Tirsdag kl 17:00 som vanlig. Samme farge eller vil du prøve noe nytt?",
      is_read: true,
      created_at: addDays(oneWeekAgo, 0.2),
    },
    {
      chat_id: chats[7].id,
      sender_id: customerUsers[3].id, // Ingrid
      content: "Jeg tenkte å prøve den nye høstkoleksjonen du la ut på Instagram!",
      is_read: true,
      created_at: addDays(oneWeekAgo, 0.3),
    },

    // Chat 8: Ingrid <-> Linda - Problem resolution
    {
      chat_id: chats[8].id,
      sender_id: customerUsers[3].id, // Ingrid
      content: "Hei Linda, jeg er litt bekymret. Vippene du satte på forrige uke har begynt å falle av.",
      is_read: true,
      created_at: threeDaysAgo,
    },
    {
      chat_id: chats[8].id,
      sender_id: stylistUsers[3].id, // Linda
      content: "Oi, det skal ikke skje så tidlig! Kan du komme innom i dag så fikser jeg det gratis?",
      is_read: true,
      created_at: addDays(threeDaysAgo, 0.1),
    },
    {
      chat_id: chats[8].id,
      sender_id: customerUsers[3].id, // Ingrid
      content: "Tusen takk! Du er en engel. Jeg kan komme etter jobb, rundt 17:30?",
      is_read: true,
      created_at: addDays(threeDaysAgo, 0.2),
    },
    {
      chat_id: chats[8].id,
      sender_id: stylistUsers[3].id, // Linda
      content: "Det går fint! Jeg venter på deg. Beklager bryderiet!",
      is_read: true,
      created_at: addDays(threeDaysAgo, 0.3),
    },

    // Chat 9: Ingrid <-> Nina - Service recommendation
    {
      chat_id: chats[9].id,
      sender_id: stylistUsers[4].id, // Nina
      content: "Hei Ingrid! Takk for at du booket brynslaminering hos meg! Har du gjort det før?",
      is_read: true,
      created_at: yesterday,
    },
    {
      chat_id: chats[9].id,
      sender_id: customerUsers[3].id, // Ingrid
      content: "Hei Nina! Nei, dette blir første gang. Noe jeg bør vite?",
      is_read: false, // Unread
      created_at: todayMorning,
    },

    // Chat 10: Erik <-> Sofia - Last-minute booking
    {
      chat_id: chats[10].id,
      sender_id: customerUsers[4].id, // Erik
      content: "Hei! Jeg har et jobbintervju i morgen. Har du noen ledige tider i dag? 🆘",
      is_read: true,
      created_at: yesterday,
    },
    {
      chat_id: chats[10].id,
      sender_id: stylistUsers[2].id, // Sofia
      content: "Hei Erik! Jeg forstår det haster. Jeg har akkurat fått en avbestilling kl 15:00. Passer det?",
      is_read: true,
      created_at: addDays(yesterday, 0.1),
    },
    {
      chat_id: chats[10].id,
      sender_id: customerUsers[4].id, // Erik
      content: "Du redder dagen min! Jeg tar den!",
      is_read: true,
      created_at: addDays(yesterday, 0.2),
    },
    {
      chat_id: chats[10].id,
      sender_id: stylistUsers[2].id, // Sofia
      content: "Flott! Jeg har booket deg inn. Lykke til med intervjuet! 🍀",
      is_read: true,
      created_at: addDays(yesterday, 0.3),
    },

    // Chat 11: Astrid <-> Maria - Product questions
    {
      chat_id: chats[11].id,
      sender_id: customerUsers[5].id, // Astrid
      content: "Hei Maria! Husker du hvilket merke hårmaske du brukte på meg sist?",
      is_read: true,
      created_at: threeDaysAgo,
    },
    {
      chat_id: chats[11].id,
      sender_id: stylistUsers[0].id, // Maria
      content: "Hei Astrid! Ja, det var Olaplex No. 8. Den fungerte veldig bra på ditt hår!",
      is_read: true,
      created_at: addDays(threeDaysAgo, 0.1),
    },
    {
      chat_id: chats[11].id,
      sender_id: customerUsers[5].id, // Astrid
      content: "Takk! Kan jeg kjøpe den hos deg?",
      is_read: true,
      created_at: addDays(threeDaysAgo, 0.2),
    },
    {
      chat_id: chats[11].id,
      sender_id: stylistUsers[0].id, // Maria
      content: "Absolutt! Jeg har den på lager. Du kan hente den når som helst eller jeg kan ta den med til neste time.",
      is_read: true,
      created_at: addDays(threeDaysAgo, 0.3),
    },

    // Chat 12: Astrid <-> Nina - Scheduling conflict
    {
      chat_id: chats[12].id,
      sender_id: customerUsers[5].id, // Astrid
      content: "Hei Nina, jeg må dessverre avbestille tiden på lørdag. Kan vi flytte den?",
      is_read: true,
      created_at: yesterday,
    },
    {
      chat_id: chats[12].id,
      sender_id: stylistUsers[4].id, // Nina
      content: "Hei! Ingen problem. Når passer det bedre for deg?",
      is_read: true,
      created_at: addDays(yesterday, 0.1),
    },
    {
      chat_id: chats[12].id,
      sender_id: customerUsers[5].id, // Astrid
      content: "Kan du neste lørdag samme tid?",
      is_read: false, // Unread
      created_at: todayMorning,
    },
    {
      chat_id: chats[12].id,
      sender_id: stylistUsers[4].id, // Nina
      content: "La meg sjekke kalenderen...",
      is_read: false, // Unread
      created_at: todayAfternoon,
    },
  ]);

  console.log("-- Created comprehensive chat message scenarios");
}
