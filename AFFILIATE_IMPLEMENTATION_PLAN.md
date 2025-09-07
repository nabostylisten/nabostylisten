# Affiliate Management System - Complete Implementation Plan

## Simplified Discount Code Approach (Customer-facing: "Partner", Codebase: "Affiliate")

## Overview

This implementation uses traditional discount codes instead of complex link tracking. Stylists get approved for affiliate status and receive a unique discount code. Customers use URL parameters (e.g., `app.no?code=xyz`) or enter codes at checkout. The system auto-applies discounts when the customer buys from the same stylist who provided the code.

## 🔄 CURRENT IMPLEMENTATION STATUS

### What's Working

- ✅ **Database**: All affiliate tables exist (`affiliate_links`, `affiliate_clicks`, `affiliate_commissions`, `affiliate_payouts`)
- ✅ **Middleware**: Detects `?code=XYZ` URL parameters and sets attribution cookies
- ✅ **Cookie System**: 30-day attribution cookies for anonymous users
- ✅ **Type Definitions**: Affiliate attribution types defined in `types/index.ts`
- ✅ **Code Generation**: `affiliate-codes.actions.ts` creates unique codes for approved stylists

### What Needs Fixing

- ⚠️ **attribution.actions.ts**: References wrong table names (`affiliate_codes` instead of `affiliate_links`, `affiliate_attributions` instead of `affiliate_clicks`)
- 🔄 **Checkout Integration**: Auto-apply discount logic not yet implemented
- 🔄 **Commission Tracking**: Commission calculation and recording not connected
- 🔄 **Admin Dashboard**: Partner management interface not built
- 🔄 **Stylist Dashboard**: Partner metrics and earnings views not created

## ⚠️ IMMEDIATE FIXES REQUIRED

The `attribution.actions.ts` file references non-existing database tables. The actual database uses different table names:

1. **Table Name Corrections**:

   - `affiliate_codes` table doesn't exist → Use `affiliate_links` table
   - `affiliate_attributions` table doesn't exist → Use `affiliate_clicks` table
   - Field `code` doesn't exist → Use `link_code` field from `affiliate_links`

2. **Required Code Changes**: See detailed fixes in Section 1.1 below

**Naming Convention**:

- **Customer-facing URLs/Text**: "partner" (Norwegian)
- **Codebase/Components**: "affiliate" (English, matches database schema)

**Current Implementation Status**:

- ✅ Database tables exist (`affiliate_links`, `affiliate_clicks`, etc.)
- ✅ Middleware handles URL parameters and cookies
- ✅ Cookie attribution works for anonymous users
- ⚠️ Attribution server actions need fixes (wrong table names)
- 🔄 Customer checkout flow needs integration
- 🔄 Admin dashboard needs implementation

**Database Table Mapping**:

- Plan mentions `affiliate_codes` → Actually `affiliate_links` (with `link_code` field)
- Plan mentions `affiliate_attributions` → Actually `affiliate_clicks`

## Database Schema Adjustments

### Current Affiliate Tables (Already Implemented)

- **affiliate_applications**: Application tracking (existing)
- **affiliate_links**: Stores affiliate codes with fields:
  - `link_code` (unique discount code, e.g., "ANNA-HAIR-2024")
  - `stylist_id` (owner of the code)
  - `commission_percentage`
  - `is_active`, `expires_at`
  - `click_count`, `conversion_count`, `total_commission_earned`
- **affiliate_clicks**: Tracks code usage/attribution with fields:
  - `affiliate_link_id` (references the affiliate_links table)
  - `user_id` (nullable - for logged in users)
  - `visitor_id` (for anonymous users)
  - `created_at` (when code was first encountered)
  - Additional tracking: `ip_address`, `user_agent`, `referrer`, `landing_page`
- **affiliate_commissions**: Commission tracking (existing)
- **affiliate_payouts**: Payout processing (existing)

### Cookie/Attribution Storage

- 30-day cookie: `affiliate_code=XYZ&attributed_at=timestamp`
- For logged-in users: store in `affiliate_attributions` table
- For anonymous users: store in cookie until login/checkout

## Phase 1: Core Infrastructure & Server Actions

### 1.1 Server Actions (`/server/affiliate/`)

- **affiliate-applications.actions.ts**: Application CRUD operations
- **affiliate-codes.actions.ts**: Code generation, validation, analytics (✅ Working)
- **attribution.actions.ts**: Code attribution tracking (cookies + database)

  - ⚠️ **CRITICAL FIX REQUIRED - Table & Field Mapping Issues**:

    **Function: `validateAffiliateCode()`**

    - Line 32-45: Change from `.from("affiliate_codes")` to `.from("affiliate_links")`
    - Line 45: Change from `.eq("code", code.toUpperCase())` to `.eq("link_code", code.toUpperCase())`
    - Line 86: Change `code: affiliateCode.code` to `code: affiliateCode.link_code`

    **Function: `getAffiliateAttribution()`**

    - Line 107-112: Change from `.from("affiliate_attributions")` to `.from("affiliate_clicks")`
    - Need to map fields correctly (e.g., `affiliate_link_id` instead of direct `code`)

    **Function: `transferCookieToDatabase()`**

    - Line 200-205: Change from `.from("affiliate_attributions")` to `.from("affiliate_clicks")`
    - Line 209: Change from `.from("affiliate_attributions").insert()` to `.from("affiliate_clicks").insert()`
    - Need to resolve `affiliate_link_id` from `link_code` before inserting

    **Function: `cleanupExpiredAttributions()`**

    - Line 231-233: Change from `.from("affiliate_attributions")` to `.from("affiliate_clicks")`
    - Note: `affiliate_clicks` doesn't have `expires_at` field, need different approach

- **affiliate-checkout.actions.ts**: Auto-apply logic during checkout (TO DO)
- **affiliate-commission.actions.ts**: Commission calculation and payout processing (TO DO)

### 1.2 Middleware & URL Handling (✅ IMPLEMENTED)

- **middleware.ts**: Check for `?code=XYZ` parameter on all pages
- Set cookie with code and timestamp (✅ Working)
- Redirect cleanly to remove URL parameter (✅ Working)
- For logged-in users: Transfer attribution from cookie to database (✅ Working)
  - Calls `transferCookieToDatabase()` from attribution.actions.ts

### 1.3 Checkout Integration

- **Auto-detection**: Check if user has attributed code + buying from same stylist
- **Info box**: "Du har en rabattkode fra [Stylist Name]! Vi har automatisk brukt koden for deg."
- **Discount application**: Automatic application of stylist's commission as customer discount
- **Commission tracking**: Record commission for stylist on successful payment

## Phase 2: Stylist Experience (Customer-facing: "Partner")

### ✅ 2.1 Application Flow

- **`/app/profiler/[profileId]/partner/soknad/page.tsx`**: Application form
- Page title: "Bli Partner" / "Partner Søknad"
- **Components**:
  - **`AffiliateApplicationForm`**: Multi-step application form
  - Marketing strategy, social reach, expected referrals
  - Terms and conditions acceptance

### ✅ 2.2 Affiliate Management

- **`/app/profiler/[profileId]/partner/page.tsx`**: Main partner page
- Page title: "Partner Dashboard"
- **Components**:
  - **`AffiliateCodeCard`**: Code display with copy functionality
  - **`AffiliateInstructions`**: Usage instructions and best practices
  - **`AffiliateMetrics`**: Performance metrics (uses, conversions)
  - **`AffiliateLinkGenerator`**: Generate social media links (`app.no?code=ANNA-HAIR-2024`)
  - **`AffiliateEarningsSummary`**: Earnings overview

### 2.3 Payout Tracking

- **`/app/profiler/[profileId]/partner/utbetalinger/page.tsx`**: Payout history
- Page title: "Partner Utbetalinger"
- **Components**:
  - **`AffiliatePayoutTable`**: Commission breakdown by booking
  - **`AffiliatePayoutStatus`**: Payout status and history
  - **`AffiliateTaxInfo`**: Tax information access

## Phase 3: Customer Experience

### 3.1 URL Parameter Handling

- **Social media flow**: `app.no?code=ANNA-HAIR-2024` → clean redirect + cookie
- **Manual entry**: Code input field in cart/checkout
- **Attribution preservation**: 30-day window across sessions

### 3.2 Checkout Experience

- **Auto-detection**: "Vi fant en partnerkode fra [Stylist] i din handlekurv!"
- **Components**:
  - **`AffiliateDiscountBanner`**: Info box for auto-applied discounts
  - **`AffiliateTransparencyInfo`**: Clear explanation of stylist commission
- **Seamless application**: No additional user action required

## Phase 4: Admin Management System (Customer-facing: "Partner")

### ✅ 4.1 Unified Admin Interface

- **`/app/admin/partner/page.tsx`**: Single page with tabs
- Page title: "Partner Administrasjon"

### ✅ 4.2 Tab Structure (Following admin-dashboard.tsx pattern)

```typescript
const affiliateTabs = [
  {
    value: "applications",
    label: "Søknader",
    icon: FileText,
    component: AffiliateApplicationsTab,
  },
  {
    value: "codes",
    label: "Koder",
    icon: Tag,
    component: AffiliateCodesTab,
  },
  {
    value: "payouts",
    label: "Utbetalinger",
    icon: DollarSign,
    component: AffiliatePayoutsTab,
  },
  {
    value: "analytics",
    label: "Analyse",
    icon: BarChart3,
    component: AffiliateAnalyticsTab,
  },
];
```

### ✅ 4.3 Tab Components (`/components/admin/affiliate/`)

- **`AffiliateApplicationsTab`**: Application queue, approval/rejection workflow
- **`AffiliateCodesTab`**: Active codes, performance metrics, bulk operations
- **`AffiliatePayoutsTab`**: Commission processing, Stripe Connect integration
- **`AffiliateAnalyticsTab`**: Platform-wide affiliate performance, top performers

### ✅ 4.4 Individual Tab Components

- **`AffiliateApplicationReview`**: Application review interface
- **`AffiliateCodeManagement`**: Code management table
- **`AffiliatePayoutProcessor`**: Batch payout processing
- **`AffiliateAnalyticsDashboard`**: Performance analytics

## ✅ Phase 5: Email System (Customer-facing: "Partner")

### ✅ 5.1 Stylist Emails (`/transactional/emails/affiliate/`)

- **`affiliate-application-received.tsx`**: "Din partnersøknad er mottatt"
- **`affiliate-application-approved.tsx`**: "Søknaden din er godkjent! Din partnerkode: [CODE]"
- **`affiliate-application-rejected.tsx`**: "Partnersøknaden din er dessverre avvist"
- **`affiliate-payout-processed.tsx`**: "Partner provisjon utbetalt: [AMOUNT] kr"
- **`affiliate-code-expiring.tsx`**: "Din partnerkode utløper snart"

### ✅ 5.2 Customer Emails

- **Enhanced booking-receipt**: Include partner attribution if applicable
- **`affiliate-discount-applied.tsx`**: "Du brukte [Stylist]s partnerkode og sparte [AMOUNT] kr"

## Phase 6: Technical Implementation Details

### 6.0 Customer Flow (How Affiliate Codes Work)

1. **Code Discovery**: Customer encounters affiliate code via:

   - Social media link: `app.no?code=ANNA-HAIR-2024`
   - Direct sharing from stylist
   - Manual entry at checkout

2. **Code Attribution** (Handled by middleware.ts):

   - URL parameter `?code=XYZ` detected on any page
   - Cookie set with attribution data (30-day expiration)
   - Clean redirect to remove URL parameter
   - For logged-in users: Attribution transferred to `affiliate_clicks` table

3. **Code Validation** (attribution.actions.ts):

   - Validates code exists in `affiliate_links` table (via `link_code` field)
   - Checks if code is active and not expired
   - Verifies stylist is still active
   - Returns validation result with stylist info

4. **Checkout Application**:

   - System checks for attributed code (database first, then cookie)
   - If customer is buying from the same stylist who owns the code:
     - Auto-apply discount
     - Show info banner: "Du har en rabattkode fra [Stylist]!"
   - Record commission in `affiliate_commissions` table

5. **Commission Tracking**:
   - Update `click_count` in `affiliate_links` when code is used
   - Update `conversion_count` when booking is completed
   - Track `total_commission_earned` for payout processing

### 6.1 Cookie Management (✅ IMPLEMENTED in middleware.ts & types/index.ts)

```typescript
// Cookie is set by middleware.ts when ?code=XYZ is detected
// Uses createAffiliateAttributionCookie() from types/index.ts
const attribution = createAffiliateAttributionCookie(affiliateCode);

supabaseResponse.cookies.set('affiliate_attribution', JSON.stringify(attribution), {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  path: '/'
});

// Cookie structure (from types/index.ts):
{
  code: string,           // The affiliate code (uppercase)
  attributed_at: string,  // ISO timestamp when first encountered
  expires_at: string,     // ISO timestamp for 30 days later
  original_user_id?: string, // Optional: original user who clicked
  visitor_session?: string   // Optional: for anonymous tracking
}
```

### 6.2 Checkout Logic (TO BE IMPLEMENTED)

```typescript
// Check for auto-applicable discount
const checkAffiliateDiscount = async (cart: Cart, userId?: string) => {
  const attribution = await getAffiliateAttribution(userId);
  if (!attribution) return null;

  // Get the affiliate link details from the code
  const { data: affiliateLink } = await supabase
    .from("affiliate_links")
    .select("*")
    .eq("link_code", attribution.code)
    .single();

  if (!affiliateLink) return null;

  // Check if any cart items are from the attributed stylist
  const applicableServices = cart.services.filter(
    (service) => service.stylist_id === affiliateLink.stylist_id
  );

  if (applicableServices.length > 0) {
    return {
      code: affiliateLink.link_code,
      stylist_id: affiliateLink.stylist_id,
      applicableServices,
      discountAmount: calculateCommissionAsDiscount(applicableServices),
    };
  }

  return null;
};
```

### 6.3 Commission Calculation

- Use existing platform config for commission percentage
- Apply commission as customer discount (stylist absorbs cost)
- **TODO:** Note that we must make a change to this.
  Instead we'll have Platform-funded commission (most common in marketplaces)
  • Platform takes a slightly smaller cut when affiliate commission is applied.
  • ✅ Pros: Stylist keeps their normal share, customer unaffected. Commission acts as a marketing cost for the platform.
  • ❌ Cons: Platform margins are reduced.
- Track both customer savings and stylist commission
- Handle refunds by reversing commission

## Phase 7: UI/UX Components

### 7.1 Shared Components (`/components/affiliate/`)

- **`AffiliateApplicationForm`**: Application form with validation
- **`AffiliateCodeCard`**: Code display card with sharing tools
- **`AffiliateMetricsChart`**: Usage and earnings charts
- **`AffiliateDiscountBanner`**: Checkout info box for auto-applied discounts
- **`AffiliateInstructions`**: Usage instructions component
- **`AffiliateLinkGenerator`**: Social media link generator

### 7.2 Admin Components (`/components/admin/affiliate/`)

- **`AffiliateApplicationReview`**: Application review interface
- **`AffiliateCodeManagement`**: Code management table
- **`AffiliatePayoutProcessor`**: Batch payout processing
- **`AffiliateAnalyticsDashboard`**: Performance analytics dashboard
- **`AffiliateApplicationsTab`**: Applications tab component
- **`AffiliateCodesTab`**: Codes tab component
- **`AffiliatePayoutsTab`**: Payouts tab component
- **`AffiliateAnalyticsTab`**: Analytics tab component

## Phase 8: Database Approach

### 8.1 Required Code Updates

**Recommended Approach: Update attribution.actions.ts to use existing tables**

- Fix `attribution.actions.ts` to use `affiliate_links` table with `link_code` field
- Fix `attribution.actions.ts` to use `affiliate_clicks` table for attribution tracking
- Update related server actions to match existing schema

**Option 2: Create table aliases or views** (Alternative)

```sql
-- Create a view that maps the expected names to actual tables
CREATE VIEW affiliate_codes AS
SELECT
  id,
  link_code as code,
  stylist_id,
  commission_percentage,
  is_active,
  expires_at,
  created_at,
  updated_at
FROM affiliate_links;

CREATE VIEW affiliate_attributions AS
SELECT
  id,
  affiliate_link_id,
  visitor_id as visitor_session,
  user_id,
  created_at as attributed_at,
  (created_at + INTERVAL '30 days') as expires_at
FROM affiliate_clicks;
```

### 8.2 Update Policies

- Maintain existing RLS structure
- Update table references in policies
- Ensure proper access control for new cookie-based flow

## Phase 9: Testing Scenarios

### 9.1 Customer Journey Testing

1. **Social Media Flow**: Click `app.no?code=XYZ` → browse → add service → checkout (auto-discount)
2. **Manual Entry**: Add service → enter code at checkout → discount applied
3. **Cross-Stylist**: Code from Stylist A, buy from Stylist B → no discount
4. **Expiration**: 30+ day old attribution → no discount
5. **Refund Handling**: Cancel booking → reverse commission

### 9.2 Stylist Testing

1. **Application Flow**: Apply → admin review → approval → code generation
2. **Code Sharing**: Generate shareable links with code parameter
3. **Performance Tracking**: View attribution and conversion metrics
4. **Payout Processing**: Commission calculation and Stripe payout

## Success Metrics

- **Customer Experience**: Automatic discount application rate, customer satisfaction
- **Stylist Adoption**: Application-to-activation rate, code usage frequency
- **Platform Growth**: Revenue attribution to affiliates, new customer acquisition
- **Operational Efficiency**: Admin processing time, automated vs manual interventions

## Key Benefits of This Approach

1. **Familiar UX**: Customers understand discount codes
2. **Simple Tracking**: URL parameters + cookies instead of complex link tracking
3. **Transparent**: Clear value proposition for both customers and stylists
4. **Scalable**: Easy to manage and monitor through admin interface
5. **Norwegian-First**: Customer-facing content in Norwegian, consistent codebase in English
6. **Clean Architecture**: Separates customer presentation from technical implementation

This approach balances simplicity with functionality while maintaining clear separation between customer-facing Norwegian terminology and consistent English codebase naming.

## 🎯 IMPLEMENTATION ACTION PLAN

### Priority 1: Fix Critical Errors (Immediate)

1. **Fix attribution.actions.ts table references**:
   - Update all queries to use `affiliate_links` instead of `affiliate_codes`
   - Update all queries to use `affiliate_clicks` instead of `affiliate_attributions`
   - Map fields correctly (`link_code` instead of `code`)
   - Resolve `affiliate_link_id` when inserting into `affiliate_clicks`

### Priority 2: Complete Core Flow (This Week)

2. **Implement checkout integration**:

   - Create `affiliate-checkout.actions.ts`
   - Add auto-detection logic in checkout flow
   - Display discount banner when code applies
   - Record commission in `affiliate_commissions` table

3. **Connect commission tracking**:
   - Create `affiliate-commission.actions.ts`
   - Calculate commission based on booking amount
   - Update `affiliate_links` stats (conversion_count, total_commission_earned)
   - Handle refund reversals

### Priority 3: Build User Interfaces (Next Sprint)

4. **Stylist Partner Dashboard**:

   - Create `/profiler/[profileId]/partner/` pages
   - Display affiliate code and sharing tools
   - Show performance metrics and earnings
   - Add payout history view

5. **Admin Partner Management**:
   - Create `/admin/partner/` interface
   - Application review and approval workflow
   - Code management and analytics
   - Payout processing interface

### Priority 4: Polish & Optimize (Following Sprint)

6. **Email notifications**:

   - Application status updates
   - Commission earned notifications
   - Payout confirmations

7. **Analytics & Reporting**:
   - Conversion funnel tracking
   - Top performer leaderboards
   - Revenue attribution reports
