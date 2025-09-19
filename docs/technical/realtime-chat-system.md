# Real-time Chat System - Technical Documentation

## Architecture Overview

The real-time chat system is built using **Supabase Broadcast** for real-time communication, with persistent message storage in PostgreSQL. The system provides unified, continuous messaging between customers and stylists across all their interactions, maintaining a single conversation thread per customer-stylist relationship.

### Technology Stack

- **Real-time Communication**: Supabase Broadcast (WebSockets)
- **Message Persistence**: PostgreSQL via Supabase
- **Frontend Framework**: React 19 with TypeScript
- **State Management**: React hooks and TanStack Query
- **UI Components**: shadcn/ui with Tailwind CSS

## Database Schema

### Core Tables

```sql
-- Unified chat container for customer-stylist pairs
CREATE TABLE public.chats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stylist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(customer_id, stylist_id) -- Ensures one chat per pair
);

-- Individual messages within chats
CREATE TABLE public.chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id uuid REFERENCES chats(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);
```

### Key Relationships

```
profiles (customer) ←→ chats ←→ profiles (stylist)
chats (1) ←→ (many) chat_messages
profiles (1) ←→ (many) chat_messages (as sender)
chat_messages (1) ←→ (many) media (as chat images)
bookings (many) → reference same chat via (customer_id + stylist_id)
```

### Media Support

```sql
-- Media table for chat images and other file types
CREATE TABLE public.media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    file_path text NOT NULL,
    media_type media_type NOT NULL, -- 'chat_image', 'avatar', etc.
    chat_message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);
```

## Component Architecture

### 1. RealtimeChat Component

**Location**: `components/realtime-chat.tsx`

Main chat interface component that handles real-time messaging and message display.

```typescript
interface RealtimeChatProps {
  roomName: string; // Unique room identifier (chat-${chatId})
  username: string; // Display name for current user
  userId: string; // User ID for message ownership
  onMessage?: (messages: ChatMessage[]) => void; // Callback for message persistence
  messages?: ChatMessage[]; // Initial messages from database
  onReadStatusChange?: (data: {
    chat_id: string;
    message_id: string;
    is_read: boolean;
  }) => void; // Callback for read status changes
}
```

**Key Features**:

- Merges real-time messages with initial database messages
- Removes duplicates and sorts by timestamp
- Handles message sending and receiving
- Auto-scrolls to bottom on new messages
- Shows connection status
- Processes read status change notifications
- Maintains conversation continuity across multiple bookings

### 2. useRealtimeChat Hook

**Location**: `hooks/use-realtime-chat.tsx`

Custom hook that manages Supabase Broadcast connection and message state.

```typescript
interface UseRealtimeChatProps {
  roomName: string; // chat-${chatId}
  username: string;
  userId: string;
  onReadStatusChange?: (data: {
    chat_id: string;
    message_id: string;
    is_read: boolean;
  }) => void;
}

interface ChatMessage {
  id: string;
  content: string;
  user: {
    name: string;
    senderId: string; // For message ownership comparison
  };
  createdAt: string;
  images?: Array<{
    id: string;
    file_path: string;
    url: string;
  }>;
}
```

**Core Functionality**:

- Establishes WebSocket connection to Supabase
- Listens for broadcast messages on chat-specific room
- Sends messages via broadcast channel
- Manages connection state and message array
- Handles unified conversation across all bookings
- Triggers callbacks for real-time updates

**Connection Flow**:

1. Creates channel with chat-specific room name
2. Subscribes to 'message' broadcast events
3. Subscribes to 'chat_message_read_status' events
4. Updates connection status on subscription
5. Maintains persistent connection for continuous conversation
6. Cleans up channel on component unmount

### 3. Chat Access Components

#### UnifiedChatContent Component

**Location**: `components/chat/unified-chat-content.tsx`

Central chat interface for customer-stylist conversations, accessible from multiple entry points.

```typescript
interface UnifiedChatContentProps {
  chatId: string;
  customerId: string;
  stylistId: string;
  currentUserId: string;
  customer: { id: string; full_name: string };
  stylist: { id: string; full_name: string };
  initialMessages: ChatMessage[];
  bookingContext?: { // Optional context when accessed from booking
    id: string;
    service_name: string;
    scheduled_at: string;
  };
}
```

**Features**:

- Single conversation thread regardless of entry point
- Optional booking context display
- Complete message history across all interactions
- Persistent conversation state

#### ChatCard Component

**Location**: `components/chat-card.tsx`

Chat overview card showing customer-stylist relationship status.

```typescript
interface ChatCardProps {
  chatId: string;
  partnerId: string;
  partnerName: string;
  lastMessageTime: string;
  currentUserId: string;
  isCustomer: boolean;
  unreadCount?: number;
}
```

**Key Changes from Booking-Based**:

- Displays partner name directly from chat relationship
- Links to unified chat (`/chat/${chatId}`)
- Shows overall conversation status
- No booking-specific information

### 4. Server Actions

**Location**: `server/chat.actions.ts`

#### getChatByParticipants

Creates or retrieves chat for customer-stylist pair.

```typescript
export async function getChatByParticipants(
  customerId: string,
  stylistId: string
) {
  const supabase = await createClient();

  // Verify user has access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || (user.id !== customerId && user.id !== stylistId)) {
    return { error: "Unauthorized", data: null };
  }

  // Get existing chat
  let { data: chat, error } = await supabase
    .from("chats")
    .select("id, customer_id, stylist_id, created_at")
    .eq("customer_id", customerId)
    .eq("stylist_id", stylistId)
    .single();

  // Create if doesn't exist
  if (error && error.code === "PGRST116") {
    const { data: newChat, error: createError } = await supabase
      .from("chats")
      .insert({ customer_id: customerId, stylist_id: stylistId })
      .select("id, customer_id, stylist_id, created_at")
      .single();

    if (createError) {
      return { error: createError.message, data: null };
    }
    chat = newChat;
  }

  return { error: null, data: chat };
}
```

#### getChatsByProfileId

Retrieves all chats for a user (as customer or stylist).

```typescript
export async function getChatsByProfileId(profileId: string) {
  const supabase = await createClient();

  const { data: chats } = await supabase
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
    .or(`customer_id.eq.${profileId},stylist_id.eq.${profileId}`);

  return { data: chats, error: null };
}
```

## Real-time Communication Flow

### Room Naming Convention

```typescript
// Chat-based rooms (not booking-based)
const roomName = `chat-${chatId}`;
```

### Message Broadcasting

```typescript
// Text message structure
const textMessage: ChatMessage = {
  id: crypto.randomUUID(),
  content: userInput,
  user: {
    name: username,
    senderId: userId
  },
  createdAt: new Date().toISOString(),
};

// Broadcasting to chat room
await channel.send({
  type: "broadcast",
  event: "message",
  payload: message,
});
```

### Persistent Conversation Management

```typescript
// Messages persist across all bookings
// No need to switch rooms when viewing different bookings
// Complete history always available
const { data: messages } = await getChatMessages(chatId);
// Returns all messages regardless of booking context
```

## Storage Architecture

### Supabase Storage Integration

```
chat-media/
├── {chatId}/
│   ├── {messageId}/
│   │   ├── {timestamp}-{random}.{extension}
│   │   └── {timestamp}-{random}.{extension}
│   └── {messageId}/
│       └── ...
└── ...
```

**Storage Configuration**:

- **Bucket**: `chat-media` (private bucket)
- **File Types**: JPEG, PNG, WebP, GIF
- **Size Limit**: 5MB per file
- **Access**: Signed URLs with 24-hour expiry
- **Organization**: By chat ID for unified access

### Row Level Security (RLS) Policies

```sql
-- Chat participants can access their chat
CREATE POLICY "Chat participants can access chat" ON public.chats
FOR ALL TO authenticated
USING (
  customer_id = (select auth.uid()) OR
  stylist_id = (select auth.uid())
);

-- Chat participants can view all messages in their chats
CREATE POLICY "Chat participants can view messages" ON public.chat_messages
FOR SELECT TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.chats
    WHERE customer_id = (select auth.uid()) OR stylist_id = (select auth.uid())
  )
);

-- Users can insert messages in their chats
CREATE POLICY "Users can send messages" ON public.chat_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = (select auth.uid()) AND
  chat_id IN (
    SELECT id FROM public.chats
    WHERE customer_id = (select auth.uid()) OR stylist_id = (select auth.uid())
  )
);
```

## Message Persistence

### Unified Conversation Storage

Messages are stored in a single conversation thread per customer-stylist pair:

```typescript
export async function createChatMessage({
  chatId,
  content,
  messageId,
}: {
  chatId: string; // Chat ID for the customer-stylist pair
  content: string;
  messageId?: string; // Optional pre-generated ID
}) {
  // 1. Authenticate user
  // 2. Verify user is participant in chat
  // 3. Insert message into unified conversation
  // 4. Message appears in all contexts (profile, bookings, etc.)
}
```

### Cross-Booking Message Access

```typescript
// From booking context
const booking = await getBooking(bookingId);
const chat = await getChatByParticipants(
  booking.customer_id,
  booking.stylist_id
);
// Access complete conversation history

// From profile context
const chats = await getChatsByProfileId(userId);
// Access all conversations with different partners
```

## Unread Message Tracking

### Real-time Read Status Broadcasting

```sql
-- Database trigger for read status changes
CREATE OR REPLACE FUNCTION public.broadcast_chat_message_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.is_read != NEW.is_read THEN
    PERFORM realtime.send(
      jsonb_build_object(
        'type', 'message_read_status_change',
        'chat_id', NEW.chat_id,
        'message_id', NEW.id,
        'is_read', NEW.is_read,
        'sender_id', NEW.sender_id
      ),
      'chat_message_read_status',
      'chat-' || NEW.chat_id::text, -- Chat-based room naming
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Unified Unread Count

```typescript
// Count unread across entire conversation
const unreadCount = chat_messages.filter(
  (msg) => !msg.is_read &&
          msg.sender_id !== currentUserId &&
          msg.chat_id === chatId
).length;
```

## Navigation & Routing

### Chat-Centric URLs

```typescript
// Primary chat access
/chat/[chatId] // Direct chat access

// Legacy support (redirects to chat)
/bookinger/[bookingId]/chat → /chat/[chatId]?from=booking-[bookingId]

// Profile access
/profiler/[profileId]/chat // Chat overview
```

### Navigation Flow

```typescript
// From any booking
const chat = await getChatByParticipants(customerId, stylistId);
router.push(`/chat/${chat.id}?from=booking-${bookingId}`);

// From chat overview
router.push(`/chat/${chatId}`);

// From stylist profile
const chat = await getChatByParticipants(currentUserId, stylistId);
router.push(`/chat/${chat.id}`);
```

## Performance Optimization

### Conversation Continuity

- **Single WebSocket Connection**: One connection per chat relationship
- **Persistent Message Cache**: Messages cached across navigation
- **Optimistic Updates**: Immediate UI updates before server confirmation
- **Efficient Queries**: Direct chat access without booking lookups

### Query Optimization

```sql
-- Efficient chat lookup with composite index
CREATE INDEX idx_chats_participants ON chats(customer_id, stylist_id);

-- Fast message retrieval
CREATE INDEX idx_messages_chat_created ON chat_messages(chat_id, created_at DESC);
```

## Integration Points

### Booking System Integration

- **Chat Discovery**: Bookings reference existing chats via participant IDs
- **Context Display**: Optional booking information in chat header
- **Seamless Navigation**: Direct chat access from any booking
- **Historical Context**: All past booking discussions in one place

### Profile System Integration

- **Chat Hub**: Central location for all conversations
- **Role Switching**: View as customer or stylist
- **Relationship Management**: Track all active conversations
- **Quick Access**: Direct navigation to any chat

## Benefits of Unified Architecture

### Technical Benefits

- **Simplified Data Model**: One chat per relationship, not per booking
- **Reduced Complexity**: No need to manage multiple chat instances
- **Better Performance**: Single query for entire conversation history
- **Easier Maintenance**: Cleaner codebase with less duplication

### User Experience Benefits

- **Conversation Continuity**: Never lose context between bookings
- **Relationship Building**: Natural, ongoing dialogue
- **Service History**: Complete interaction history in one place
- **Reduced Friction**: No need to start new conversations

### Business Benefits

- **Higher Retention**: Stronger customer-stylist relationships
- **Increased Engagement**: Continuous conversation encourages interaction
- **Better Insights**: Complete relationship data for analytics
- **Competitive Advantage**: Unique relationship-focused approach

## Migration Strategy

### From Booking-Based to Unified Chats

1. **Data Migration**: Not required - new architecture starts fresh
2. **URL Redirects**: Old booking chat URLs redirect to unified chat
3. **User Education**: Clear messaging about improved chat experience
4. **Gradual Rollout**: Feature flag controlled deployment

## Future Enhancements

### Immediate Improvements

- **Conversation Search**: Find messages across long histories
- **Message Pinning**: Highlight important information
- **Smart Summaries**: AI-generated conversation overviews
- **Relationship Analytics**: Insights on communication patterns

### Advanced Features

- **Conversation Templates**: Quick responses for common scenarios
- **Scheduled Messages**: Plan future communications
- **Multi-Party Chats**: Group conversations for team services
- **Integration APIs**: Connect with external CRM systems

## Summary

This unified chat system represents a fundamental shift from transactional, booking-specific communication to relationship-based, continuous conversations. The architecture provides:

### ✅ **Core Achievements**

- **Unified Conversations**: One chat per customer-stylist relationship
- **Persistent History**: Complete conversation across all bookings
- **Real-time Synchronization**: Instant updates across all contexts
- **Seamless Navigation**: Access from bookings, profiles, or directly
- **Automatic Chat Creation**: Zero-friction conversation initiation
- **Cross-Booking Context**: Reference any booking in the conversation

### ✅ **Technical Excellence**

- **Simplified Architecture**: Cleaner data model and codebase
- **Improved Performance**: Efficient queries and caching
- **Better Scalability**: Grows with relationships, not bookings
- **Enhanced Security**: Simplified RLS policies
- **Future-Proof Design**: Ready for advanced features

### ✅ **User Experience**

- **Natural Conversations**: Mirrors real-world relationships
- **Complete Context**: Never lose conversation history
- **Reduced Cognitive Load**: One place for all communication
- **Stronger Relationships**: Continuous engagement builds loyalty

The system successfully transforms the platform from a booking-centric to a relationship-centric model, creating lasting value through enhanced customer-stylist bonds and significantly improved user retention.