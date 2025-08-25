import type { SeedClient } from "@snaplet/seed";
import { addDays, subDays } from "date-fns";

/**
 * Creates chat channels for selected bookings to test real-time messaging
 */
export async function createBookingChats(seed: SeedClient, bookings: any[]) {
  console.log("-- Creating chats for selected bookings...");

  const { chats } = await seed.chats([
    { booking_id: bookings[0].id }, // Upcoming confirmed booking
    { booking_id: bookings[1].id }, // Upcoming pending booking
    { booking_id: bookings[4].id }, // Wedding booking
  ]);

  return chats;
}

/**
 * Creates old chat messages for cron job testing
 * These messages are older than 5 years and should be cleaned up by the scheduled job
 */
export async function createOldChatMessagesForCronTesting(
  seed: SeedClient, 
  chats: any[], 
  customerUsers: any[], 
  stylistUsers: any[]
) {
  console.log("-- Creating old chat messages for cron job testing...");
  
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
}

/**
 * Creates current chat messages between customers and stylists for testing
 * Includes various conversation scenarios and read/unread states
 */
export async function createCurrentChatMessages(
  seed: SeedClient, 
  chats: any[], 
  customerUsers: any[], 
  stylistUsers: any[]
) {
  console.log("-- Creating current chat messages...");

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
}