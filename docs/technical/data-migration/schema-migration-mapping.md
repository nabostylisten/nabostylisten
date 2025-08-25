# Database Schema Migration Mapping

## Overview

This document provides a comprehensive mapping between the legacy MySQL database schema and the new Supabase PostgreSQL schema for Nabostylisten. The migration involves significant architectural changes, consolidating user types, simplifying relationships, and adding new functionality.

## High-Level Architecture Changes

### User Model Transformation
- **MySQL**: Separate tables for `buyer`, `stylist`, `salon` (3 user types)
- **Supabase**: Unified `profiles` table with role enum + `stylist_details` extension table

### Key Simplifications
1. **Polymorphic Relationships** → Direct foreign keys
2. **MySQL JSON fields** → Proper relational structures  
3. **Complex booking statuses** → Simplified workflow
4. **Multiple chat systems** → Single booking-based chat
5. **Separate image systems** → Centralized media management

### New Features in Supabase
- Affiliate marketing system
- Booking notes for stylists
- Advanced recurring availability system
- Comprehensive user preferences
- Platform configuration management

## Table-by-Table Migration Mapping

### 1. User Management

#### MySQL: `buyer` → Supabase: `profiles` (role='customer')
```sql
-- Mapping Fields
buyer.id → profiles.id (UUID transformation needed)
buyer.name → profiles.full_name  
buyer.email → profiles.email
buyer.phone_number → profiles.phone_number
buyer.phone_verified → (built into Supabase Auth)
buyer.email_verified → (built into Supabase Auth) 
buyer.bankid_verified → profiles.bankid_verified
buyer.last_login_at → (tracked by Supabase Auth)
buyer.created_at → profiles.created_at
buyer.updated_at → profiles.updated_at
buyer.deleted_at → (soft deletes not used in new system)
buyer.gender → (not migrated - can be added later)
buyer.stripe_customer_id → profiles.stripe_customer_id
buyer.is_blocked → (not migrated - use Supabase Auth blocking)
buyer.sms_enabled → user_preferences.sms_delivery
buyer.email_enabled → user_preferences.email_delivery
buyer.profile_picture_uploaded → (handled via media table)
buyer.default_address_id → addresses.is_primary flag
```

#### MySQL: `stylist` → Supabase: `profiles` (role='stylist') + `stylist_details`
```sql
-- Core Profile Fields (profiles table)
stylist.id → profiles.id
stylist.name → profiles.full_name
stylist.email → profiles.email
stylist.phone_number → profiles.phone_number
stylist.bankid_verified → profiles.bankid_verified
stylist.created_at → profiles.created_at
stylist.updated_at → profiles.updated_at
stylist.gender → (not migrated)
stylist.default_address_id → addresses.is_primary flag

-- Stylist-Specific Fields (stylist_details table)
stylist.bio → stylist_details.bio
stylist.can_travel → stylist_details.can_travel
stylist.travel_distance → stylist_details.travel_distance_km
stylist.instagram_profile → stylist_details.instagram_profile  
stylist.facebook_profile → stylist_details.facebook_profile
stylist.twitter_profile → (not migrated - add other_social_media_urls)
stylist.stripe_account_id → stylist_details.stripe_account_id
stylist.commission_percentage → (business logic, not stored)
stylist.is_active → (use profile deletion or application status)

-- Notification Preferences → user_preferences table
stylist.sms_enabled → user_preferences.sms_delivery
stylist.email_enabled → user_preferences.email_delivery
```

#### MySQL: `salon` → **NOT MIGRATED** (Business decision to remove salon model)
```sql
-- Salon model removed from new system
-- Any salon-related data should be migrated as stylist data
-- Revenue sharing logic simplified to platform-stylist only
```

### 2. Address Management

#### MySQL: `address` → Supabase: `addresses`
```sql
-- Direct Field Mapping
address.id → addresses.id
address.created_at → addresses.created_at
address.updated_at → addresses.updated_at
address.formatted_address → addresses.street_address (parse required)
address.street_name + street_no → addresses.street_address  
address.city → addresses.city
address.zipcode → addresses.postal_code
address.country → addresses.country
address.coordinates → addresses.location (PostGIS conversion)
address.short_address + tag → addresses.nickname
address.deleted_at → (not migrated - hard delete unused addresses)

-- Relationship Changes
address.buyer_id → addresses.user_id (if buyer)
address.stylist_id → addresses.user_id (if stylist)  
address.salon_id → (not migrated)

-- New Fields
→ addresses.country_code (derive from country)
→ addresses.entry_instructions (default empty)
→ addresses.is_primary (derive from default_address_id references)
```

### 3. Service Categories

#### MySQL: `category` + `subcategory` → Supabase: `service_categories` (self-referential)
```sql
-- Category Migration
category.id → service_categories.id
category.name → service_categories.name
category.description → service_categories.description
NULL → service_categories.parent_category_id (top-level categories)

-- Subcategory Migration  
subcategory.id → service_categories.id
subcategory.name → service_categories.name
subcategory.description → service_categories.description
subcategory.category_id → service_categories.parent_category_id
```

### 4. Services

#### MySQL: `service` → Supabase: `services`
```sql
-- Core Service Fields
service.id → services.id
service.stylist_id → services.stylist_id
service.created_at → services.created_at
service.updated_at → services.updated_at
service.description → services.description + services.title (split content)
service.duration → services.duration_minutes
service.amount → services.price
service.currency → services.currency  
service.is_published → services.is_published
service.deleted_at → (hard delete unused services)

-- Categorization (junction table)
service.subcategory_id → service_service_categories.category_id

-- New Fields (default values)
→ services.at_customer_place (default: false)
→ services.at_stylist_place (default: true)
→ services.includes (default: empty array)
→ services.requirements (default: empty array)
```

#### MySQL: `service_images_image` → Supabase: `media`
```sql
-- Image Association Migration
service_images_image.service_id → media.service_id
service_images_image.image_id → media.file_path (derive from image table)
→ media.media_type = 'service_image'
→ media.is_preview_image (first image = true)
```

### 5. Bookings System

#### MySQL: `booking` → Supabase: `bookings`
```sql
-- Core Booking Fields
booking.id → bookings.id
booking.buyer_id → bookings.customer_id
booking.stylist_id → bookings.stylist_id  
booking.date_time → bookings.start_time
booking.date_time + duration → bookings.end_time
booking.additional_notes → bookings.message_to_stylist
booking.amount → bookings.total_price
booking.currency → (all NOK in new system)
booking.created_at → bookings.created_at
booking.updated_at → bookings.updated_at
booking.address_id → bookings.address_id
booking.scheduler_booking_id → (not migrated)

-- Status Mapping (simplification required)
booking.status = 'payment_pending' → bookings.status = 'pending'
booking.status = 'needs_confirmation' → bookings.status = 'pending'  
booking.status = 'confirmed' → bookings.status = 'confirmed'
booking.status = 'cancelled' → bookings.status = 'cancelled'
booking.status = 'completed' → bookings.status = 'completed'
booking.status = 'rejected' → bookings.status = 'cancelled'
booking.status = 'system_cancel' → bookings.status = 'cancelled'
booking.status = 'expired' → bookings.status = 'cancelled'
booking.status = 'failed' → bookings.status = 'cancelled'

-- Service Association Migration
booking.service (JSON) → booking_services junction table
```

#### MySQL: `booking_services_service` → Supabase: `booking_services`
```sql
-- Direct Junction Table Migration
booking_services_service.booking_id → booking_services.booking_id
booking_services_service.service_id → booking_services.service_id
```

### 6. Payment System

#### MySQL: `payment` → Supabase: `payments` (Significant Simplification)
```sql
-- Core Payment Fields
payment.id → payments.id
payment.payment_intent_id → payments.payment_intent_id
payment.created_at → payments.created_at
payment.updated_at → payments.updated_at
payment.stylist_amount + platform_amount → payments.final_amount (derive)
payment.stylist_amount → payments.stylist_payout
payment.platform_amount → payments.platform_fee
payment.stylist_transfer_id → payments.stylist_transfer_id

-- Status Mapping (complex → simplified)
payment.status = 'pending' → payments.status = 'pending'
payment.status = 'needs_capture' → payments.status = 'requires_capture' 
payment.status = 'captured' → payments.status = 'succeeded'
payment.status = 'cancelled' → payments.status = 'cancelled'
payment.status = 'refunded' → payments.status = 'succeeded' + refunded_amount
payment.status = 'failed' → payments.status = 'cancelled'

-- Fields NOT Migrated (business logic changes)
payment.salon_amount → (removed - no salon support)
payment.salon_percentage → (removed)
payment.session_id → (not needed with new Stripe integration)
payment.payout_status → (tracked via timestamps)
payment.platform_tax, stylist_tax → (handled at application level)

-- New Fields (default values)
→ payments.original_amount = final_amount (no historical discount data)
→ payments.discount_amount = 0
→ payments.affiliate_commission = 0
→ payments.currency = 'NOK'
```

### 7. Reviews System

#### MySQL: `rating` → Supabase: `reviews`
```sql
-- Direct Field Mapping
rating.id → reviews.id
rating.buyer_id → reviews.customer_id
rating.stylist_id → reviews.stylist_id
rating.booking_id → reviews.booking_id
rating.rating → reviews.rating
rating.review → reviews.comment
rating.created_at → reviews.created_at
```

#### MySQL: `ratings` (aggregate) → **NOT MIGRATED** (Calculated at runtime)
```sql
-- Aggregate ratings table not migrated
-- Ratings calculated dynamically via SQL queries
-- Better performance with proper indexing
```

### 8. Communication System

#### MySQL: `chat` → Supabase: `chats`
```sql
-- Core Chat Fields
chat.id → chats.id
chat.buyer_id → (derive via booking relationship)
chat.stylist_id → (derive via booking relationship)
chat.booking_id → chats.booking_id
chat.created_at → chats.created_at
chat.updated_at → chats.updated_at
chat.is_active → (all migrated chats considered active)

-- Unread Status (not directly migrated)
chat.buyer_has_unread → (calculated from chat_messages.is_read)
chat.stylist_has_unread → (calculated from chat_messages.is_read)
```

#### MySQL: `message` → Supabase: `chat_messages`
```sql
-- Core Message Fields
message.id → chat_messages.id
message.message → chat_messages.content
message.chat_id → chat_messages.chat_id  
message.created_at → chat_messages.created_at
message.is_unread → chat_messages.is_read (invert logic)

-- Sender Mapping (complex transformation)
message.is_from = 'buyer' → chat_messages.sender_id = booking.customer_id
message.is_from = 'stylist' → chat_messages.sender_id = booking.stylist_id

-- Media Handling
message.is_image = 1 → create media record with media_type = 'chat_image'
```

#### MySQL: `personalchat` + `personal_message` → **NOT MIGRATED**
```sql
-- Personal chat system removed
-- All communication tied to bookings in new system
-- Reduces complexity and improves moderation
```

### 9. Media Management

#### MySQL: Multiple image tables → Supabase: `media` (centralized)

#### MySQL: `image` → Supabase: `media`
```sql
-- Core Image Fields
image.id → media.id
image.file_name → media.file_path (adjust path structure)
image.original_file_name → (store as metadata in file_path)
image.created_at → media.created_at
image.deleted_at → (hard delete unused media)

-- New Fields (context-dependent)
→ media.media_type = 'other' (unless linked via junction tables)
→ media.owner_id (derive from context)
```

#### MySQL: `portfolio` + `portfolio_image` → Supabase: `media`
```sql
-- Portfolio System Simplified
portfolio.stylist_id → media.owner_id
portfolio.category_id → (not directly migrated)
portfolio_image.file_name → media.file_path
→ media.media_type = 'service_image'
```

### 10. Features NOT Migrated

#### MySQL Tables Removed:
```sql
-- Business Logic Changes
salon                    → Removed (business model change)
ratings                  → Calculated dynamically  
personalchat             → Removed (booking-only communication)
personal_message         → Removed
chat_notes               → Replaced with booking_notes

-- Replaced by New Systems  
favourite                → Not migrated (can be re-implemented)
promocode                → Replaced with discounts table
stripe_webhook_event     → Handled by Supabase Edge Functions

-- Scheduling System Redesign
stylist_availability     → Replaced with stylist_availability_rules
stylist_special_hours    → Replaced with stylist_unavailability + recurring system
```

## Data Transformation Requirements

### 1. UUID Conversion
```sql
-- MySQL uses VARCHAR(36) UUIDs, PostgreSQL uses native UUID type
-- All primary keys need CAST(id AS UUID) during migration
```

### 2. Timestamp Conversion  
```sql
-- MySQL: datetime(6) → PostgreSQL: timestamp with time zone
-- All timestamps need timezone conversion
```

### 3. Geographic Data
```sql
-- MySQL: POINT → PostgreSQL: PostGIS geography(Point, 4326)
-- Coordinate system transformation required
```

### 4. Enum Mapping
```sql
-- MySQL enums → PostgreSQL custom types
-- Status mappings required with business logic validation
```

### 5. JSON Field Migration
```sql
-- MySQL JSON fields need parsing and normalization
booking.service (JSON) → booking_services (junction table)
stylist_availability.opening_hours_* → stylist_availability_rules (normalized)
```

## Migration Complexity Assessment

### High Complexity (Custom Logic Required)
1. **User Model Consolidation** - 3 tables → 1 + extension
2. **Payment System Simplification** - Remove salon revenue sharing
3. **Booking Status Mapping** - 9 statuses → 4 statuses  
4. **JSON Field Normalization** - Services, availability schedules
5. **Geographic Data Conversion** - POINT → PostGIS

### Medium Complexity (Direct Mapping + Transformation)
1. **Address System** - Polymorphic → Direct relationships
2. **Category Hierarchy** - 2 tables → Self-referential table
3. **Media Consolidation** - Multiple image tables → Single media table
4. **Chat System** - Remove personal chat, keep booking chat
5. **UUID Format Conversion** - String → Native UUID

### Low Complexity (Direct Field Mapping)
1. **Reviews System** - Nearly identical structure
2. **Service Definitions** - Minor field additions
3. **Basic Profile Data** - Standard field mapping
4. **Timestamps** - Timezone conversion only

## Migration Script Architecture

### Phase 1: Schema Preparation
1. Create new Supabase database
2. Run schema migrations
3. Create temporary staging tables

### Phase 2: Data Migration
1. **Users & Authentication** (Critical first)
2. **Addresses** (Dependency for services)
3. **Service Categories** (Dependency for services)
4. **Services** (Core business logic)
5. **Bookings & Reviews** (Transaction data)
6. **Payments** (Financial data)
7. **Communication** (Chat history)
8. **Media Assets** (File references)

### Phase 3: Data Validation
1. Record count validation
2. Referential integrity checks
3. Business logic validation
4. Data quality assessment

### Phase 4: Cleanup
1. Remove temporary staging tables
2. Enable RLS policies
3. Create indexes
4. Test application integration

## Business Logic Considerations

### Breaking Changes
1. **No Salon Support** - Existing salon accounts need manual conversion to stylist accounts
2. **Simplified Payment Model** - Revenue sharing percentages may need adjustment
3. **Booking Status Simplification** - Some status nuances will be lost
4. **Personal Chat Removal** - Chat history outside bookings will be lost

### Data Quality Issues
1. **Soft Deletes** - Need to determine which deleted records to migrate
2. **Orphaned Records** - Clean up references to deleted entities
3. **Invalid Data** - Handle enum values that don't map cleanly
4. **Duplicate Records** - Deduplicate users with multiple accounts

### New Feature Onboarding
1. **User Preferences** - All users get default notification preferences
2. **Affiliate System** - New revenue model needs stakeholder setup
3. **Advanced Scheduling** - Stylists need to reconfigure availability
4. **Booking Notes** - New workflow for service documentation

This mapping serves as the foundation for building migration scripts that will safely transfer data from the legacy MySQL system to the new Supabase PostgreSQL platform while maintaining data integrity and business continuity.