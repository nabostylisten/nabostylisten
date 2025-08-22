"use server";

import { createClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/supabase/storage";
import type { Database } from "@/types/database.types";

export async function getChatsByProfileId(profileId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== profileId) {
    return { error: "Unauthorized", data: null };
  }

  // First get bookings where user is involved, then get their chats
  const { data: userBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id")
    .or(`customer_id.eq.${profileId},stylist_id.eq.${profileId}`);

  if (bookingsError) {
    return { error: bookingsError.message, data: null };
  }

  if (!userBookings || userBookings.length === 0) {
    return { error: null, data: [] };
  }

  const bookingIds = userBookings.map(b => b.id);

  // Get all chats for those bookings with unread message counts
  const { data: chats, error } = await supabase
    .from("chats")
    .select(`
      id,
      booking_id,
      created_at,
      updated_at,
      bookings!inner (
        id,
        customer_id,
        stylist_id,
        start_time,
        status,
        customer:profiles!customer_id (
          id,
          full_name
        ),
        stylist:profiles!stylist_id (
          id,
          full_name
        ),
        booking_services (
          services (
            title
          )
        )
      ),
      chat_messages (
        id,
        is_read,
        sender_id,
        created_at
      )
    `)
    .in('booking_id', bookingIds)
    .order("updated_at", { ascending: false });

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data: chats };
}

export async function getChatByBookingId(bookingId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", data: null };
  }

  // First check if user has access to this booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("customer_id, stylist_id")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return { error: "Booking not found", data: null };
  }

  const hasAccess =
    booking.customer_id === user.id || booking.stylist_id === user.id;

  if (!hasAccess) {
    return { error: "Unauthorized", data: null };
  }

  // Get or create chat for this booking
  let { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("id, booking_id, created_at")
    .eq("booking_id", bookingId)
    .single();

  if (chatError && chatError.code === "PGRST116") {
    // Chat doesn't exist, create it
    const { data: newChat, error: createError } = await supabase
      .from("chats")
      .insert({ booking_id: bookingId })
      .select("id, booking_id, created_at")
      .single();

    if (createError) {
      return { error: createError.message, data: null };
    }

    chat = newChat;
  } else if (chatError) {
    return { error: chatError.message, data: null };
  }

  return { error: null, data: chat };
}

export async function getChatMessages(chatId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", data: null };
  }

  // Verify user has access to this chat through the booking
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select(`
      id,
      bookings!inner (
        customer_id,
        stylist_id
      )
    `)
    .eq("id", chatId)
    .single();

  if (chatError || !chat) {
    return { error: "Chat not found", data: null };
  }

  const hasAccess =
    chat.bookings.customer_id === user.id || 
    chat.bookings.stylist_id === user.id;

  if (!hasAccess) {
    return { error: "Unauthorized", data: null };
  }

  // Get messages for this chat
  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select(`
      id,
      content,
      created_at,
      sender:profiles!sender_id (
        id,
        full_name
      )
    `)
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data: messages };
}

export async function createChatMessage({
  chatId,
  content,
  messageId,
}: {
  chatId: string;
  content: string;
  messageId?: string;
}) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", data: null };
  }

  // Verify user has access to this chat
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select(`
      id,
      bookings!inner (
        customer_id,
        stylist_id
      )
    `)
    .eq("id", chatId)
    .single();

  if (chatError || !chat) {
    return { error: "Chat not found", data: null };
  }

  const hasAccess =
    chat.bookings.customer_id === user.id || 
    chat.bookings.stylist_id === user.id;

  if (!hasAccess) {
    return { error: "Unauthorized", data: null };
  }

  // Create the message with optional predefined ID
  const insertData: any = {
    chat_id: chatId,
    sender_id: user.id,
    content,
  };

  // Add the ID if provided (for client-generated IDs)
  if (messageId) {
    insertData.id = messageId;
  }

  const { data: message, error } = await supabase
    .from("chat_messages")
    .insert(insertData)
    .select(`
      id,
      content,
      created_at,
      sender:profiles!sender_id (
        id,
        full_name
      )
    `)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data: message };
}

export async function markChatMessagesAsRead(chatId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", data: null };
  }

  // Verify user has access to this chat
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select(`
      id,
      bookings!inner (
        customer_id,
        stylist_id
      )
    `)
    .eq("id", chatId)
    .single();

  if (chatError || !chat) {
    return { error: "Chat not found", data: null };
  }

  const hasAccess =
    chat.bookings.customer_id === user.id || 
    chat.bookings.stylist_id === user.id;

  if (!hasAccess) {
    return { error: "Unauthorized", data: null };
  }

  // Mark all unread messages in this chat as read (except messages sent by current user)
  const { error } = await supabase
    .from("chat_messages")
    .update({ is_read: true })
    .eq("chat_id", chatId)
    .eq("is_read", false)
    .neq("sender_id", user.id);

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data: { success: true } };
}

export async function getUnreadMessageCount(profileId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== profileId) {
    return { error: "Unauthorized", data: null };
  }

  // First get bookings where user is involved
  const { data: userBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id")
    .or(`customer_id.eq.${profileId},stylist_id.eq.${profileId}`);

  if (bookingsError) {
    return { error: bookingsError.message, data: null };
  }

  if (!userBookings || userBookings.length === 0) {
    return { error: null, data: { count: 0 } };
  }

  const bookingIds = userBookings.map(b => b.id);

  // First get chat IDs for these bookings
  const { data: userChats, error: chatsError } = await supabase
    .from("chats")
    .select("id")
    .in("booking_id", bookingIds);

  if (chatsError) {
    return { error: chatsError.message, data: null };
  }

  if (!userChats || userChats.length === 0) {
    return { error: null, data: { count: 0 } };
  }

  const chatIds = userChats.map(c => c.id);

  // Get unread message count for user's chats
  const { count, error } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .in("chat_id", chatIds)
    .eq("is_read", false)
    .neq("sender_id", profileId); // Don't count user's own messages

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data: { count: count || 0 } };
}


export async function getChatMessageImages(messageId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", data: null };
  }

  // Get images for this message
  const { data: images, error } = await supabase
    .from("media")
    .select("id, file_path")
    .eq("chat_message_id", messageId)
    .eq("media_type", "chat_image");

  if (error) {
    return { error: error.message, data: null };
  }

  // Generate signed URLs for images
  const imagesWithUrls = await Promise.all(
    images.map(async (image) => {
      const signedUrl = await getSignedUrl(supabase, "chat-media", image.file_path, 86400);
      return {
        id: image.id,
        file_path: image.file_path,
        url: signedUrl,
      };
    })
  );

  return { error: null, data: imagesWithUrls };
}