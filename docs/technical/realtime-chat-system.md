# Real-time Chat System - Technical Documentation

## Architecture Overview

The real-time chat system is built using **Supabase Broadcast** for real-time communication, with persistent message storage in PostgreSQL. The system provides instant messaging between customers and stylists within the context of specific bookings.

### Technology Stack

- **Real-time Communication**: Supabase Broadcast (WebSockets)
- **Message Persistence**: PostgreSQL via Supabase
- **Frontend Framework**: React 19 with TypeScript
- **State Management**: React hooks and Zustand (for cart integration)
- **UI Components**: shadcn/ui with Tailwind CSS

## Database Schema

### Core Tables

```sql
-- Chat container for each booking
CREATE TABLE public.chats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
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
bookings (1) ←→ (1) chats ←→ (many) chat_messages
profiles (1) ←→ (many) chat_messages (as sender)
chat_messages (1) ←→ (many) media (as chat images)
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
  roomName: string; // Unique room identifier (booking-${bookingId})
  username: string; // Display name for current user
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
- Triggers UI updates when message read status changes

### 2. useRealtimeChat Hook

**Location**: `hooks/use-realtime-chat.tsx`

Custom hook that manages Supabase Broadcast connection and message state.

```typescript
interface UseRealtimeChatProps {
  roomName: string;
  username: string;
  onReadStatusChange?: (data: {
    chat_id: string;
    message_id: string;
    is_read: boolean;
  }) => void;
}

interface ChatMessage {
  id: string;
  content: string;
  user: { name: string };
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
- Listens for broadcast messages on the specified room
- Sends messages via broadcast channel
- Manages connection state and local message array
- Listens for read status change broadcasts
- Triggers callbacks when read status changes occur

**Connection Flow**:

1. Creates channel with unique room name
2. Subscribes to 'message' broadcast events
3. Subscribes to 'chat_message_read_status' broadcast events
4. Updates connection status on subscription success
5. Cleans up channel on component unmount

### 3. ChatMessageItem Component

**Location**: `components/chat-message.tsx`

Individual message display component with support for message grouping and styling.

```typescript
interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showHeader: boolean;
}
```

**Features**:

- Different styling for sent vs received messages
- Conditional header display for message grouping
- Timestamp formatting with localization
- Responsive design with proper message bubbles
- **Image Support**:
  - Single image display with rounded corners
  - Multiple images with "+X flere" overlay on first image
  - Click to open full-screen image gallery with carousel
  - Thumbnail navigation for multiple images

### 4. Image Support Components

#### UploadImagesDialog Component

**Location**: `components/chat/upload-images-dialog.tsx`

Modal dialog for uploading multiple images to chat messages with drag-and-drop support.

```typescript
interface UploadImagesDialogProps {
  chatId: string;
  onUploadComplete: (images: Array<{ id: string; file_path: string; url: string }>, messageId: string) => void;
  children?: React.ReactNode;
}
```

**Key Features**:

- **Multiple File Selection**: Accumulates files across multiple selections
- **Drag & Drop Interface**: Uses existing dropzone component
- **File Validation**: Supports JPEG, PNG, WebP, GIF up to 5MB
- **Preview & Management**: Shows selected files with ability to remove individual items
- **Extension Badges**: Displays file type badges for easy identification
- **Smart Filename Handling**: Truncates long filenames while preserving extensions
- **Client-side Upload**: Direct upload to Supabase storage without server intermediation

**Upload Flow**:

1. Generate unique message ID
2. Create chat message record in database
3. Upload images to Supabase storage (`chat-media` bucket)
4. Create media records linked to message ID
5. Return signed URLs for immediate display

#### ImageGalleryDialog Component

**Location**: `components/chat/image-gallery-dialog.tsx`

Full-screen image gallery with carousel navigation for viewing multiple chat images.

```typescript
interface ImageGalleryDialogProps {
  images: Array<{ id: string; file_path: string; url: string }>;
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Key Features**:

- **Shadcn Carousel Integration**: Uses `@/components/ui/carousel` for smooth navigation
- **Full-screen Viewing**: Large dialog (80vh height, 6xl width) for optimal image viewing
- **Image Counter Badge**: Shows current position (e.g., "2 / 5") above the main image
- **Thumbnail Navigation**: Clickable thumbnails at bottom for quick image jumping
- **Keyboard Navigation**: Arrow keys and escape key support
- **Responsive Design**: Adapts to different screen sizes
- **Accessibility**: Proper ARIA labels and screen reader support

#### useUploadChatImages Hook

**Location**: `hooks/use-upload-chat-images.ts`

Custom hook for handling client-side image uploads to chat messages.

```typescript
interface UploadChatImagesParams {
  chatId: string;
  messageId?: string;
  files: File[];
}
```

**Core Functionality**:

- **Image Compression**: Reduces file size before upload (max 1920px, preserves quality)
- **File Validation**: Checks file types and sizes against bucket configuration
- **Batch Upload**: Handles multiple files efficiently
- **Error Handling**: Comprehensive error reporting with user-friendly messages
- **Progress Tracking**: Loading states for UI feedback
- **Storage Path Generation**: Creates organized file paths (`chatId/messageId/filename`)

### 5. useChatScroll Hook

**Location**: `hooks/use-chat-scroll.tsx`

Utility hook for managing scroll behavior in chat containers.

```typescript
export function useChatScroll() {
  return {
    containerRef: React.RefObject<HTMLDivElement>;
    scrollToBottom: () => void;
  };
}
```

**Implementation**:

- Provides ref for chat container
- Smooth scroll to bottom functionality
- Automatically called when new messages arrive

## Real-time Communication Flow

### Message Broadcasting

```typescript
// Room naming convention
const roomName = `booking-${bookingId}`;

// Text message structure
const textMessage: ChatMessage = {
  id: crypto.randomUUID(),
  content: userInput,
  user: { name: username },
  createdAt: new Date().toISOString(),
};

// Image message structure
const imageMessage: ChatMessage = {
  id: messageId, // Pre-generated ID used for uploads
  content: "", // Empty content for image-only messages
  user: { name: username },
  createdAt: new Date().toISOString(),
  images: uploadedImages, // Array of uploaded image objects
};

// Broadcasting
await channel.send({
  type: "broadcast",
  event: "message",
  payload: message,
});
```

### Message Reception

```typescript
// Subscribe to broadcast events
channel.on("broadcast", { event: "message" }, (payload) => {
  setMessages((current) => [...current, payload.payload as ChatMessage]);
});

// Subscribe to read status change events
channel.on("broadcast", { event: "chat_message_read_status" }, (payload) => {
  if (onReadStatusChange && payload.payload) {
    onReadStatusChange(payload.payload);
  }
});
```

### Connection Management

```typescript
// Channel subscription with status monitoring
channel.subscribe(async (status) => {
  if (status === "SUBSCRIBED") {
    setIsConnected(true);
  }
});

// Cleanup on unmount
return () => {
  supabase.removeChannel(channel);
};
```

## Storage Architecture

### Supabase Storage Integration

The system uses Supabase Storage for chat media with organized bucket structure:

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
- **Compression**: Client-side compression before upload (max 1920px)

### Row Level Security (RLS) Policies

```sql
-- Chat participants can view chat media
CREATE POLICY "Chat participants can view chat media" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-media' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM public.chats c
    JOIN public.bookings b ON c.booking_id = b.id
    WHERE b.customer_id = (select auth.uid()) OR b.stylist_id = (select auth.uid())
  )
);

-- Users can upload chat images for messages in chats they participate in
CREATE POLICY "Users can insert chat images for their chats." ON public.media
FOR INSERT TO authenticated
WITH CHECK (
  media_type = 'chat_image' AND
  (select auth.uid()) = owner_id AND
  chat_message_id IN (
    SELECT cm.id 
    FROM public.chat_messages cm
    JOIN public.chats c ON cm.chat_id = c.id
    JOIN public.bookings b ON c.booking_id = b.id
    WHERE b.customer_id = (select auth.uid()) OR b.stylist_id = (select auth.uid())
  )
);
```

## Message Persistence

### Database Integration

Messages are persisted through server actions that provide:

- **Authorization**: Verify user access to chat
- **Validation**: Ensure message content and chat permissions
- **Storage**: Save to PostgreSQL with proper relationships
- **Media Linking**: Connect uploaded images to message records

```typescript
// Server action for message creation
export async function createChatMessage({
  chatId,
  content,
  messageId,
}: {
  chatId: string;
  content: string;
  messageId?: string; // Optional pre-generated ID for image messages
}) {
  // 1. Authenticate user
  // 2. Verify chat access
  // 3. Insert message (with predefined ID if provided)
  // 4. Return created message with any linked media
}

// Server action for retrieving message images
export async function getChatMessageImages(messageId: string) {
  // 1. Authenticate user
  // 2. Verify access to message/chat
  // 3. Retrieve media records for message
  // 4. Generate signed URLs for images
  // 5. Return image objects with URLs
}
```

### Persistence Strategy

#### Text Messages
1. **Immediate Local Update**: Messages appear instantly for sender
2. **Broadcast to Room**: Real-time delivery to other participants
3. **Database Storage**: Async persistence via server action
4. **Error Handling**: Toast notifications for persistence failures

#### Image Messages
1. **Message Creation**: Create empty message record in database first
2. **File Upload**: Upload images to Supabase storage with message ID
3. **Media Records**: Create media table entries linking images to message
4. **Local Update**: Display message with images immediately
5. **Broadcast to Room**: Send complete message with image URLs to other participants
6. **Error Handling**: Comprehensive error handling at each step with rollback capability

#### Image Loading Strategy
- **Initial Load**: Fetch existing message images via `getChatMessageImages()`
- **Signed URLs**: Generate 24-hour expiry URLs for secure access
- **Lazy Loading**: Images loaded on-demand with Next.js Image optimization
- **Caching**: Browser caches images with proper cache headers

## Unread Message Tracking

### Read Status Management

The system automatically marks messages as read when a user enters a chat and provides real-time updates to all participants.

```sql
-- Mark messages as read when user enters chat
UPDATE chat_messages
SET is_read = true
WHERE chat_id = $1
  AND is_read = false
  AND sender_id != $2; -- Don't mark user's own messages
```

**Automatic Mark-as-Read Flow**:

1. User enters chat page → `markChatMessagesAsRead()` server action called
2. Database updates `is_read = true` for relevant messages
3. Database trigger detects read status change
4. Realtime broadcast sent to all chat participants
5. React Query caches invalidated for immediate UI updates

### Unread Count Calculation

```typescript
// Count unread messages across all user chats
const unreadCount = chat_messages.filter(
  (msg) => !msg.is_read && msg.sender_id !== currentUserId
).length;
```

### Real-time Read Status Updates

The system uses Supabase's realtime broadcast to provide instant read status updates across all connected clients. This ensures that unread counts and chat indicators are always synchronized in real-time.

```sql
-- Database trigger broadcasts read status changes
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
      'booking-' || booking_id,
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

```typescript
// Client-side real-time listening in BookingChatContent
const handleReadStatusChange = useCallback(
  (data: { chat_id: string; message_id: string; is_read: boolean }) => {
    // Invalidate queries to refresh unread counts across the application
    queryClient.invalidateQueries({ queryKey: ["unread-messages", currentUserId] });
    queryClient.invalidateQueries({ queryKey: ["chats", currentUserId] });
  },
  [queryClient, currentUserId]
);

// Integration with RealtimeChat component
<RealtimeChat
  roomName={`booking-${bookingId}`}
  username={currentUserName}
  messages={convertedMessages}
  onMessage={handleMessage}
  onReadStatusChange={handleReadStatusChange}
/>
```

**End-to-End Read Status Flow**:

1. **User A** enters chat → Messages marked as read in database
2. **Database trigger** broadcasts read status change to `booking-${bookingId}` room
3. **User B** (other participant) receives broadcast via WebSocket
4. **React Query caches** invalidated for User B
5. **UI updates** instantly show updated unread counts in navbar and chat overview
6. **No page refresh** required - all updates happen in real-time

### UI Indicators

The system provides multiple visual indicators that update in real-time:

- **Navbar**:
  - Chat icon with animated ping notification only appears when unread count > 0
  - Displays "9+" for counts over 9
  - Automatically disappears when all messages are read
- **Chat Overview Page**:
  - Unread chats sorted to top with visual emphasis
  - Individual unread badges showing count per chat
  - "Lest" (Read) separator dividing read and unread chats
- **Chat Cards**:
  - Enhanced styling for unread conversations
  - Real-time badge updates as messages are read/received
  - Ping animation for active unread indicators

## Security Considerations

### Access Control

- **Booking-based Authorization**: Users can only access chats for their bookings
- **Role Verification**: Customer/stylist roles verified before chat access
- **Server-side Validation**: All database operations validated on server
- **Realtime Authorization**: Simplified policies for authenticated users, with main security enforced at database table level

```sql
-- Simplified realtime authorization - main security handled by table RLS
CREATE POLICY "authenticated can receive broadcasts" ON "realtime"."messages"
FOR SELECT TO authenticated
USING ( true );

CREATE POLICY "authenticated can send broadcasts" ON "realtime"."messages"
FOR INSERT TO authenticated
WITH CHECK ( true );
```

**Security Rationale**: The realtime broadcast layer uses simplified authentication-only policies because:

- Primary security is enforced by RLS policies on `chat_messages`, `chats`, and `bookings` tables
- Complex realtime policies can cause connection issues and increased latency
- Message persistence and access are protected at the database level where it matters most
- Broadcast events are ephemeral and don't persist sensitive data

### Data Protection

- **Message Encryption**: Handled by Supabase transport layer (HTTPS/WSS)
- **Content Validation**: Messages sanitized before storage
- **Audit Trail**: All messages timestamped with sender information

## Performance Optimization

### Connection Management

```typescript
// Efficient channel cleanup
useEffect(() => {
  const channel = supabase.channel(roomName);
  // ... setup

  return () => supabase.removeChannel(channel);
}, [roomName, username, supabase]);
```

### Message Deduplication

```typescript
// Remove duplicates when merging real-time and database messages
const uniqueMessages = mergedMessages.filter(
  (message, index, self) => index === self.findIndex((m) => m.id === message.id)
);
```

### Optimistic Updates

- Messages appear immediately for sender
- Real-time updates for other participants
- Database persistence happens asynchronously
- Error handling for failed operations

## Integration Points

### Booking System Integration

- **Chat Creation**: Automatically created when first accessed for a booking
- **Permission Inheritance**: Chat access follows booking participant rules
- **Lifecycle Management**: Chats persist after booking completion

### Notification System

- **Unread Counts**: Real-time updates in navbar and chat overview
- **Visual Indicators**: Badges, highlighting, and sorting by unread status
- **Auto-refresh**: Periodic polling for unread count updates

### Profile System Integration

- **User Identification**: Messages linked to profile system
- **Role-based Display**: Different UI for customers vs stylists
- **Avatar Integration**: Profile pictures in message headers

## Error Handling & Resilience

### Connection Failures

```typescript
// Connection status monitoring
const [isConnected, setIsConnected] = useState(false);

// Graceful degradation when offline
if (!isConnected) {
  // Disable send button
  // Show connection status
  // Queue messages for retry
}
```

### Message Delivery Failures

- **Retry Logic**: Automatic retry for failed broadcasts
- **User Feedback**: Toast notifications for persistent errors
- **Offline Handling**: Messages queued when connection lost

### Database Errors

- **Validation Errors**: Clear error messages for invalid data
- **Permission Errors**: Proper authorization error handling
- **Fallback Behavior**: Local storage for message recovery

## Monitoring & Debugging

### Development Tools

```typescript
// Debug mode for development
const DEBUG_CHAT = process.env.NODE_ENV === "development";

if (DEBUG_CHAT) {
  console.log("Chat message sent:", message);
  console.log("Channel status:", channel.state);
}
```

### Performance Metrics

- **Message Latency**: Time from send to receive
- **Connection Stability**: WebSocket connection uptime
- **Database Performance**: Message persistence timing

### Error Tracking

- **Client Errors**: JavaScript errors in chat components
- **Server Errors**: Database and authentication failures
- **Network Errors**: WebSocket connection issues

## Future Enhancements

### Immediate Improvements

- **Message Reactions**: Emoji reactions to messages
- **Message Editing**: Edit/delete sent messages
- ✅ **Image Sharing**: Multiple image uploads with gallery view (IMPLEMENTED)
- **Document Sharing**: PDF and document uploads
- **Read Receipts**: Show when messages are read

### Advanced Features

- **Voice Messages**: Audio recording and playback
- **Video Calls**: Integration with WebRTC
- **Message Search**: Full-text search within chat history
- **Message Threading**: Reply to specific messages

### Performance Enhancements

- **Message Pagination**: Load messages in chunks
- **Virtual Scrolling**: Handle large message histories
- **Compression**: Optimize message payloads
- **Caching**: Intelligent message caching strategies

## Summary

This real-time chat system provides a comprehensive solution for customer-stylist communication with the following key achievements:

### ✅ **Core Features Implemented**

- **Real-time messaging** with instant delivery via Supabase Broadcast
- **Message persistence** with proper authorization and validation
- **Automatic read status tracking** with real-time synchronization
- **Unread count management** with live UI updates
- **Booking-based chat isolation** ensuring security and privacy
- **Multi-image support** with client-side uploads and gallery viewing
- **Image compression and optimization** for efficient storage and loading
- **Secure media access** with time-limited signed URLs

### ✅ **Technical Achievements**

- **Zero-refresh updates** - all status changes happen in real-time
- **Optimistic UI updates** for instant user feedback
- **Proper cache invalidation** preventing stale data issues
- **Connection resilience** with simplified realtime policies
- **Database-level security** with comprehensive RLS policies
- **Client-side file processing** with compression and validation
- **Efficient storage architecture** with organized bucket structure
- **Carousel-based image viewing** with keyboard and touch navigation

### ✅ **User Experience**

- **Intuitive notifications** with conditional chat icon visibility
- **Visual read/unread separation** in chat overview
- **Responsive design** across all chat components
- **Seamless integration** with existing booking workflows
- **Drag-and-drop image uploads** with file management interface
- **Full-screen image gallery** with smooth carousel navigation
- **Smart file handling** with extension badges and truncated names
- **Instant image previews** with optimized loading and caching

The system successfully balances real-time performance, security, and user experience while providing a solid foundation for future enhancements like file sharing, message reactions, and advanced notification features.
