# Chat System Rework: From Booking-Based to Customer-Stylist Pair Based Chats

## Overview

Transform the current booking-specific chat system to a unified customer-stylist conversation system. Instead of separate chats for each booking, customers and stylists will have one continuous conversation regardless of how many bookings they have together.

## 1. Database Schema Changes

### 1.1 Update `chats` table structure in `supabase/schemas/00-schema.sql`

```sql
-- BEFORE: booking-based chats
CREATE TABLE IF NOT EXISTS public.chats (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE
);

-- AFTER: customer-stylist pair based chats
CREATE TABLE IF NOT EXISTS public.chats (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    UNIQUE(customer_id, stylist_id)
);
```

### 1.2 Update Database Workflow

1. Update `supabase/schemas/00-schema.sql` with new chat table structure
2. Run `bun supabase:db:diff chat_system_rework` to generate migration
3. Inspect the generated migration file
4. Run `bun supabase:migrate:up` to apply changes
5. Run `bun gen:types` to generate new TypeScript types

### 1.3 Update RLS Policies in `supabase/schemas/01-policies.sql`

- Replace booking-based access with customer-stylist relationship access
- Update policies for `chats`, `chat_messages`, and related `media` records

## 2. Server Actions Changes (`server/chat.actions.ts`)

### 2.1 Major Function Rewrites

**getChatsByProfileId:**

```typescript
// BEFORE: Query through bookings
const { data: userBookings } = await supabase
  .from("bookings")
  .select("id")
  .or(`customer_id.eq.${profileId},stylist_id.eq.${profileId}`);

// AFTER: Direct chat participant lookup
const { data: chats } = await supabase
  .from("chats")
  .select(
    `
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
  `
  )
  .or(`customer_id.eq.${profileId},stylist_id.eq.${profileId}`);
```

**getChatsByRole:**

```typescript
// Simplify to direct customer_id or stylist_id filtering
if (role === "customer") {
  query = query.eq("customer_id", profileId);
} else {
  query = query.eq("stylist_id", profileId);
}
```

**getChatByBookingId → getChatByParticipants:**

```typescript
export async function getChatByParticipants(
  customerId: string,
  stylistId: string
) {
  const supabase = await createClient();

  // Verify user has access (is either customer or stylist)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || (user.id !== customerId && user.id !== stylistId)) {
    return { error: "Unauthorized", data: null };
  }

  // Get or create chat for this customer-stylist pair
  let { data: chat, error } = await supabase
    .from("chats")
    .select("id, customer_id, stylist_id, created_at")
    .eq("customer_id", customerId)
    .eq("stylist_id", stylistId)
    .single();

  if (error && error.code === "PGRST116") {
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
  }

  return { error: null, data: chat };
}
```

**getChatMessages, createChatMessage, markChatMessagesAsRead:**

- Update access verification to use customer-stylist relationship via chat table
- Remove booking dependency in authorization queries

**getUnreadMessageCount:**

- Update to work with customer-stylist chats instead of booking-based chats
- Query chats table directly instead of through bookings

**getPreviousBookingsBetweenUsers:**

- Keep existing functionality but remove chat history access part
- Focus only on booking history between customer and stylist

## 3. Real-time System Changes

### 3.1 Channel Naming Convention

```typescript
// Use chat-based rooms
const roomName = `chat-${chatId}`;
```

### 3.2 Hook Updates (`hooks/use-realtime-chat.tsx`)

- Update channel subscription to use chat-based room names
- Remove booking dependency from real-time messaging
- Update message broadcasting to work with unified chat system

### 3.3 Database Trigger Updates

```sql
-- Update broadcast trigger to use new chat structure
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
      'chat-' || NEW.chat_id::text, -- Updated to use chat-based naming
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 4. UI Component Changes

### 4.1 Chat Overview (`app/profiler/[profileId]/chat/page.tsx`)

**Status:** Minimal changes needed

- Same routing structure maintained
- Same access control logic
- Updated data fetching to use new customer-stylist chats

### 4.2 Chat Page Content (`components/chat/chat-page-content.tsx`)

**Changes Required:**

- Update chat filtering logic to work with customer-stylist relationships
- Modify chat processing to show partner information directly from chat table
- Update unread count calculations to work with unified chats
- Change sorting logic to prioritize recent activity across all conversations

**Key Changes:**

```typescript
// BEFORE: Filter through bookings
const filteredChats = chats.filter((chat) => {
  const booking = chat.bookings;
  const isCustomerInBooking = booking.customer_id === profileId;
  // ... booking-based logic
});

// AFTER: Direct chat relationship filtering
const filteredChats = chats.filter((chat) => {
  if (stylistMode === "personal") {
    return chat.customer_id === profileId;
  } else {
    return chat.stylist_id === profileId;
  }
});
```

### 4.3 Booking Chat Access (`app/bookinger/[bookingId]/chat/page.tsx`)

**Major Changes Required:**

- Look up booking details to get customer_id and stylist_id
- Use `getChatByParticipants(customerId, stylistId)` instead of `getChatByBookingId`
- Validate user is either the customer or stylist
- Display booking context as header information

**New Flow:**

```typescript
// Get booking details
const { data: booking } = await supabase
  .from("bookings")
  .select("customer_id, stylist_id, /* other fields */")
  .eq("id", bookingId)
  .single();

// Get chat by participants
const { data: chat } = await getChatByParticipants(
  booking.customer_id,
  booking.stylist_id
);

// Pass booking context to component
<BookingChatContent
  chatId={chat.id}
  bookingContext={booking} // New prop for booking context
  // ... other props
/>
```

### 4.4 Booking Chat Content (`components/booking-chat-content.tsx`)

**Significant Changes:**

- Show unified chat with current booking displayed as context
- Remove booking-specific chat isolation
- Update message display to show continuous conversation
- Add booking context header to show current booking details

### 4.5 Chat Card (`components/chat-card.tsx`)

**Redesign Required:**

- Display customer-stylist relationship instead of booking-specific info
- Remove booking-specific navigation
- Update to show partner name directly from chat relationship
- Show overall conversation status vs single booking status

**New Props Structure:**

```typescript
interface ChatCardProps {
  chatId: string;
  partnerId: string;
  partnerName: string;
  lastMessageTime: string;
  currentUserId: string;
  isCustomer: boolean;
  unreadCount?: number;
  // Remove booking-specific props
}
```

### 4.6 Previous Bookings Alert (`components/chat/previous-bookings-alert.tsx`)

**Simplification:**

- Remove "previous chat history" functionality (not needed with unified chat)
- Keep previous bookings context display
- Update messaging to focus on booking history rather than separate chats
- Simplify component logic since all conversation history is in current chat

**Updated Messaging:**

```typescript
// BEFORE: "Se innsikt og læring fra tidligere samtaler"
// AFTER: "Se detaljer fra tidligere bookinger"
```

### 4.7 Real-time Chat Component (`components/realtime-chat.tsx`)

- Update channel subscriptions to use `chat-${chatId}` room naming
- Remove booking dependency from real-time messaging
- Update connection management for unified conversations

## 5. Hooks and State Management

### 5.1 Chat Hooks (`hooks/use-chats.tsx`)

- Update query logic to fetch customer-stylist chats directly
- Modify data processing for new chat structure
- Update query key structure: `["chats", userId]` remains the same

### 5.2 Real-time Chat Hook (`hooks/use-realtime-chat.tsx`)

- Update room name generation to use `chat-${chatId}`
- Remove booking-specific logic
- Update message handling for unified conversations

## 6. URL Structure & Navigation

### 6.1 New Clean Structure

- `/app/profiler/[profileId]/chat/page.tsx` - Chat overview (unchanged URL)
- `/app/bookinger/[bookingId]/chat/page.tsx` - Chat accessed via booking (URL unchanged, logic changed)
- Navigation will use chat IDs internally while maintaining familiar URLs

## 7. Database Migration Strategy

### 7.1 Migration Script Approach

Since we're not maintaining backwards compatibility, the migration can:

1. Drop existing booking-based chats
2. Create new customer-stylist based chats structure
3. Let new chats be created organically as users interact

### 7.2 Alternative: Data Consolidation (if preserving existing data)

If chat history should be preserved:

1. Group existing chats by customer-stylist pairs
2. Create new unified chats for each unique pair
3. Move all messages to the unified chat
4. Update foreign key references

## 8. Testing Strategy

### 8.1 Database Schema Testing

- ✅ Test new chat table structure and constraints
- ✅ Verify RLS policies work correctly
- ✅ Test chat creation and access patterns

### 8.2 Functionality Testing

- ✅ Test chat creation for new customer-stylist pairs
- ✅ Verify access control for all user roles
- ✅ Test real-time messaging in unified chats
- ✅ Validate unread message counts and notifications
- ✅ Test booking context display in chat interfaces

### 8.3 Integration Testing

- ✅ Test chat access from profile pages
- ✅ Test chat access from booking pages
- ✅ Validate media upload/access in unified chats
- ✅ Test previous bookings context display (without separate chat history)

### 8.4 UI/UX Testing

- ✅ Verify chat overview displays correctly with new structure
- ✅ Test chat card displays with partner information
- ✅ Validate booking context is clear when accessed via booking
- ✅ Test responsive design with new chat structure

## 9. Implementation Order

### Phase 1: Database Foundation

1. Update `supabase/schemas/00-schema.sql`
2. Create and apply migration (`bun supabase:db:diff`, migrate, gen:types)
3. Update RLS policies in `supabase/schemas/01-policies.sql`

### Phase 2: Server Actions

1. Rewrite `server/chat.actions.ts` functions
2. Update authentication and access control
3. Test API endpoints with new structure

### Phase 3: Real-time System

1. Update database triggers for new chat structure
2. Modify `hooks/use-realtime-chat.tsx`
3. Update real-time channel naming and broadcasting

### Phase 4: UI Components

1. Update `hooks/use-chats.tsx`
2. Modify `components/chat/chat-page-content.tsx`
3. Redesign `components/chat-card.tsx`
4. Update `components/booking-chat-content.tsx`
5. Simplify `components/chat/previous-bookings-alert.tsx`

### Phase 5: Page Components

1. Update chat access logic in booking chat page
2. Test navigation between different chat access points
3. Verify booking context display

### Phase 6: Testing & Polish

1. Comprehensive functionality testing
2. Real-time messaging validation
3. Access control verification
4. UI/UX polish and responsive design checks

## 10. Seed Script Updates for Demo Data

### Current Seed Structure Issues

The current seed script in `/seed/utils/chats.ts` creates booking-based chats:

```typescript
export async function createBookingChats(seed, bookings) {
  const { chats } = await seed.chats([
    { booking_id: bookings[0].id },
    { booking_id: bookings[1].id },
    { booking_id: bookings[4].id },
  ]);
}
```

### New Seed Structure for Customer-Stylist Chats

#### Update `createBookingChats` → `createCustomerStylistChats`

```typescript
export async function createCustomerStylistChats(
  seed: SeedClient,
  customerUsers: usersScalars[],
  stylistUsers: usersScalars[]
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
```

#### Update Chat Message Creation

```typescript
export async function createCurrentChatMessages(
  seed: SeedClient,
  chats: chatsScalars[],
  customerUsers: usersScalars[],
  stylistUsers: usersScalars[]
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
```

#### Update Main Seed Script

```typescript
// In seed/seed.ts, update Phase 9:
console.log("-- Phase 9: Chat System");
const chats = await createCustomerStylistChats(
  seed,
  customerUsers,
  stylistUsers
);
await createOldChatMessagesForCronTesting(
  seed,
  chats,
  customerUsers,
  stylistUsers
);
await createCurrentChatMessages(seed, chats, customerUsers, stylistUsers);
```

### Benefits of New Seed Structure

1. **Realistic Demo Data**: Shows continuous conversations between customer-stylist pairs
2. **Multiple Booking Context**: Same chat pair can reference multiple bookings naturally
3. **Unread Message Testing**: Proper unread states for UI testing
4. **Role-based Testing**: Different conversation styles between different user pairs
5. **UI Component Testing**: Provides data for testing all new UI components

### Test Scenarios Created

1. **Repeat Customer**: Kari has conversations with two different stylists
2. **Ongoing Relationships**: Multiple messages showing booking context
3. **Unread Messages**: Mix of read/unread for notification testing
4. **Different Services**: Various service types (hair, nails, wedding) in conversations
5. **Old Messages**: Still supports cron job cleanup testing

## 11. Key Benefits

### 10.1 User Experience

- Continuous conversations regardless of booking count
- Simplified navigation and chat management
- Clearer relationship-based messaging
- No confusion between multiple booking-specific chats

### 10.2 Technical Benefits

- Simplified data model and queries
- More intuitive chat access patterns
- Reduced complexity in real-time messaging
- Cleaner separation of concerns between chats and bookings

### 10.3 Business Benefits

- Better customer-stylist relationship building
- More natural communication flow
- Easier chat history management
- Enhanced user engagement through continuous conversations

This rework creates a more intuitive and continuous communication experience while simplifying the underlying technical architecture.

## 12. Routing Rework: Chat-based URLs

### 12.1 Current Problem

The current routing is still booking-based:

- `/bookinger/[bookingId]/chat` - Accesses chat via booking ID
- Requires booking lookup → customer/stylist IDs → chat lookup
- Maintains booking-centric navigation

### 12.2 New Chat-based Routing

**Primary Chat Route:**

```
/chat/[chatId] - Direct chat access via chat ID
```

**Migration Strategy:**

1. **Create New Route**: `app/chat/[chatId]/page.tsx`

   - Direct chat access via chat ID
   - Validate user is chat participant (customer or stylist)
   - Show booking context as optional query parameter
   - Clean chat-centric architecture

2. **Remove Booking-based Chat Access**: Delete `/bookinger/[bookingId]/chat`

   - Replace with direct chat access from booking actions
   - Booking actions → get chat ID → navigate to `/chat/[chatId]`
   - Clean break from booking-centric chat navigation

3. **Update All Navigation**:
   - Chat cards → link to `/chat/[chatId]`
   - Chat notifications → link to `/chat/[chatId]`
   - Booking actions → link to `/chat/[chatId]?from=booking-[bookingId]`

### 12.3 Implementation Plan

**Step 1: Create `/app/chat/[chatId]/page.tsx`**

```typescript
export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get chat and validate access
  const { data: chat } = await supabase
    .from("chats")
    .select(`
      id, customer_id, stylist_id, created_at,
      customer:profiles!customer_id (id, full_name),
      stylist:profiles!stylist_id (id, full_name)
    `)
    .eq("id", chatId)
    .single();

  if (!chat) notFound();

  // Validate user is participant
  const hasAccess = chat.customer_id === user.id || chat.stylist_id === user.id;
  if (!hasAccess) notFound();

  // Get chat messages
  const { data: messages } = await getChatMessages(chatId);

  return (
    <ProfileLayout profileId={user.id}>
      <UnifiedChatContent
        chatId={chatId}
        customerId={chat.customer_id}
        stylistId={chat.stylist_id}
        currentUserId={user.id}
        customer={chat.customer}
        stylist={chat.stylist}
        initialMessages={messages || []}
      />
    </ProfileLayout>
  );
}
```

**Step 2: Remove `/bookinger/[bookingId]/chat/page.tsx`**

```bash
# Delete the old booking-based chat page
rm -rf app/bookinger/[bookingId]/chat/
```

**Step 3: Update Component Navigation**

- ChatCard: `href={/chat/${chatId}}`
- Booking actions: Get chat ID and link to `/chat/${chatId}`
- Chat notifications: Direct to `/chat/${chatId}`

### 12.4 Benefits

1. **Simplified Access**: Direct chat access without booking intermediary
2. **Future-proof**: URL structure matches data model
3. **Better UX**: Consistent chat URLs regardless of entry point
4. **Clean Architecture**: Complete separation of chat and booking concerns
5. **Cleaner Code**: Remove all booking dependencies from chat components

### 12.5 Migration Checklist

- [ ] Create `/app/chat/[chatId]/page.tsx`
- [ ] Delete `/bookinger/[bookingId]/chat/` directory
- [ ] Update `ChatCard` navigation to use chat IDs
- [ ] Update booking action navigation to use chat IDs
- [ ] Update notification system URLs
- [ ] Test direct chat access flow
- [ ] Update documentation and user guides
