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

  // Create chats between specific customer-stylist pairs
  const { chats } = await seed.chats([
    {
      customer_id: customerUsers[0].id, // Kari
      stylist_id: stylistUsers[0].id, // Maria
    },
    {
      customer_id: customerUsers[0].id, // Kari
      stylist_id: stylistUsers[1].id, // Emma
    },
    {
      customer_id: customerUsers[1].id, // Ole
      stylist_id: stylistUsers[1].id, // Emma
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

  await seed.chat_messages([
    // Chat 1: Kari (customer) <-> Maria (stylist) - Multiple booking context
    {
      chat_id: chats[0].id,
      sender_id: customerUsers[0].id, // Kari
      content:
        "Hei Maria! Takk for forrige balayage. Kan jeg booke en oppfriskning?",
      is_read: true,
    },
    {
      chat_id: chats[0].id,
      sender_id: stylistUsers[0].id, // Maria
      content:
        "Hei Kari! Så hyggelig å høre fra deg igjen! Selvfølgelig, la oss finne en tid som passer 😊",
      is_read: true,
    },
    {
      chat_id: chats[0].id,
      sender_id: customerUsers[0].id, // Kari
      content: "Kan du i dag klokka 15? Samme sted som sist?",
      is_read: false, // Unread message for demo
    },

    // Chat 2: Kari (customer) <-> Emma (stylist) - Different stylist
    {
      chat_id: chats[1].id,
      sender_id: customerUsers[0].id, // Kari
      content:
        "Hei Emma! Jeg har booket neglene hos deg. Har du tid til å diskutere design?",
      is_read: true,
    },
    {
      chat_id: chats[1].id,
      sender_id: stylistUsers[1].id, // Emma
      content:
        "Hei! Ja, la oss finne et design du vil like. Har du noen inspirasjon?",
      is_read: false,
    },

    // Chat 3: Ole (customer) <-> Emma (stylist) - Wedding booking
    {
      chat_id: chats[2].id,
      sender_id: customerUsers[1].id, // Ole
      content:
        "Hei Emma! Dette er for bryllupet vårt. Vi trenger både hår og makeup.",
      is_read: true,
    },
    {
      chat_id: chats[2].id,
      sender_id: stylistUsers[1].id, // Emma
      content:
        "Gratulerer! 🎉 Jeg elsker bryllupsstyling. Skal vi møtes for en prøve først?",
      is_read: true,
    },
  ]);
}
