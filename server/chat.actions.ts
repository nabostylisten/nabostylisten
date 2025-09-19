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

  // Direct chat participant lookup
  const { data: chats, error } = await supabase
    .from("chats")
    .select(`
      id,
      customer_id,
      stylist_id,
      created_at,
      updated_at,
      customer:profiles!customer_id (
        id,
        full_name
      ),
      stylist:profiles!stylist_id (
        id,
        full_name
      ),
      chat_messages (
        id,
        is_read,
        sender_id,
        created_at
      )
    `)
    .or(`customer_id.eq.${profileId},stylist_id.eq.${profileId}`)
    .order("updated_at", { ascending: false });

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data: chats };
}

export async function getChatsByRole(
  profileId: string,
  role: "customer" | "stylist",
) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== profileId) {
    return { error: "Unauthorized", data: null };
  }

  // Direct customer_id or stylist_id filtering
  let query = supabase
    .from("chats")
    .select(`
      id,
      customer_id,
      stylist_id,
      created_at,
      updated_at,
      customer:profiles!customer_id (
        id,
        full_name
      ),
      stylist:profiles!stylist_id (
        id,
        full_name
      ),
      chat_messages (
        id,
        is_read,
        sender_id,
        created_at
      )
    `);

  if (role === "customer") {
    query = query.eq("customer_id", profileId);
  } else {
    query = query.eq("stylist_id", profileId);
  }

  const { data: chats, error } = await query.order("updated_at", {
    ascending: false,
  });

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data: chats };
}

export async function getChatByParticipants(
  customerId: string,
  stylistId: string,
) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", data: null };
  }

  // Verify user has access (is either customer or stylist)
  if (user.id !== customerId && user.id !== stylistId) {
    return { error: "Unauthorized", data: null };
  }

  // Get or create chat for this customer-stylist pair
  const chatResult = await supabase
    .from("chats")
    .select("id, customer_id, stylist_id, created_at")
    .eq("customer_id", customerId)
    .eq("stylist_id", stylistId)
    .single();
  let chat = chatResult.data;
  const chatError = chatResult.error;

  if (chatError && chatError.code === "PGRST116") {
    // Chat doesn't exist, create it
    const { data: newChat, error: createError } = await supabase
      .from("chats")
      .insert({ customer_id: customerId, stylist_id: stylistId })
      .select("id, customer_id, stylist_id, created_at")
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

  // Verify user has access to this chat via customer-stylist relationship
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("id, customer_id, stylist_id")
    .eq("id", chatId)
    .single();

  if (chatError || !chat) {
    return { error: "Chat not found", data: null };
  }

  const hasAccess = chat.customer_id === user.id || chat.stylist_id === user.id;

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

  // Verify user has access to this chat via customer-stylist relationship
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("id, customer_id, stylist_id")
    .eq("id", chatId)
    .single();

  if (chatError || !chat) {
    return { error: "Chat not found", data: null };
  }

  const hasAccess = chat.customer_id === user.id || chat.stylist_id === user.id;

  if (!hasAccess) {
    return { error: "Unauthorized", data: null };
  }

  // Create the message with optional predefined ID
  const insertData: Database["public"]["Tables"]["chat_messages"]["Insert"] = {
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

  // Verify user has access to this chat via customer-stylist relationship
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("id, customer_id, stylist_id")
    .eq("id", chatId)
    .single();

  if (chatError || !chat) {
    return { error: "Chat not found", data: null };
  }

  const hasAccess = chat.customer_id === user.id || chat.stylist_id === user.id;

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

  // Get chat IDs for this user (either as customer or stylist)
  const { data: userChats, error: chatsError } = await supabase
    .from("chats")
    .select("id")
    .or(`customer_id.eq.${profileId},stylist_id.eq.${profileId}`);

  if (chatsError) {
    return { error: chatsError.message, data: null };
  }

  if (!userChats || userChats.length === 0) {
    return { error: null, data: { count: 0 } };
  }

  const chatIds = userChats.map((c) => c.id);

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
      const signedUrl = await getSignedUrl(
        supabase,
        "chat-media",
        image.file_path,
        86400,
      );
      return {
        id: image.id,
        file_path: image.file_path,
        url: signedUrl,
      };
    }),
  );

  return { error: null, data: imagesWithUrls };
}

export async function getPreviousBookingsBetweenUsers(
  stylistId: string,
  customerId: string,
  currentBookingId?: string,
) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", data: null };
  }

  // Verify user is either the stylist or customer in question
  if (user.id !== stylistId && user.id !== customerId) {
    return { error: "Unauthorized", data: null };
  }

  // Get previous bookings between this stylist and customer
  let query = supabase
    .from("bookings")
    .select(`
      id,
      customer_id,
      stylist_id,
      start_time,
      end_time,
      status,
      total_price,
      total_duration_minutes,
      message_to_stylist,
      discount_applied,
      customer:profiles!customer_id (
        id,
        full_name,
        email,
        role
      ),
      stylist:profiles!stylist_id (
        id,
        full_name,
        email,
        role,
        addresses!addresses_user_id_fkey(
          street_address,
          postal_code,
          city,
          is_primary
        )
      ),
      addresses (
        street_address,
        city,
        postal_code,
        entry_instructions
      ),
      discounts (
        code,
        discount_percentage,
        discount_amount
      ),
      booking_services (
        services (
          id,
          title,
          description,
          price,
          currency,
          duration_minutes
        )
      )
    `)
    .eq("customer_id", customerId)
    .eq("stylist_id", stylistId)
    .order("start_time", { ascending: false });

  // Exclude current booking if provided
  if (currentBookingId) {
    query = query.neq("id", currentBookingId);
  }

  const { data: bookings, error } = await query;

  if (error) {
    return { error: error.message, data: null };
  }

  return { error: null, data: bookings };
}
