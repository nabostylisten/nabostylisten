# Affiliate Management System - Complete Implementation Plan

## Simplified Discount Code Approach (Customer-facing: "Partner", Codebase: "Affiliate")

## Overview

This implementation uses traditional discount codes instead of complex link tracking. Stylists get approved for affiliate status and receive a unique discount code. Customers use URL parameters (e.g., `app.no?code=xyz`) or enter codes at checkout. The system auto-applies discounts when the customer buys from the same stylist who provided the code.

**Naming Convention**:

- **Customer-facing URLs/Text**: "partner" (Norwegian)
- **Codebase/Components**: "affiliate" (English, matches database schema)

## Database Schema Adjustments

### Simplified Affiliate Tables

- **affiliate_applications**: Keep existing structure
- **affiliate_links**: Rename to **affiliate_codes** with fields:
  - `code` (unique discount code, e.g., "ANNA-HAIR-2024")
  - `stylist_id` (owner of the code)
  - `commission_percentage`
  - `is_active`, `expires_at`
- **affiliate_clicks**: Rename to **affiliate_attributions** with fields:
  - `code` (the discount code used)
  - `user_id` (nullable - for logged in users)
  - `visitor_session` (for anonymous users)
  - `attributed_at` (when code was first encountered)
  - `converted_booking_id` (nullable - when conversion happens)

### Cookie/Attribution Storage

- 30-day cookie: `affiliate_code=XYZ&attributed_at=timestamp`
- For logged-in users: store in `affiliate_attributions` table
- For anonymous users: store in cookie until login/checkout

## Phase 1: Core Infrastructure & Server Actions

### 1.1 Server Actions (`/server/affiliate/`)

- **affiliate-applications.actions.ts**: Application CRUD operations
- **affiliate-codes.actions.ts**: Code generation, validation, analytics
- **affiliate-attribution.actions.ts**: Code attribution tracking (cookies + database)
- **affiliate-checkout.actions.ts**: Auto-apply logic during checkout
- **affiliate-commission.actions.ts**: Commission calculation and payout processing

### 1.2 Middleware & URL Handling

- **middleware.ts**: Check for `?code=XYZ` parameter on all pages
- Set cookie with code and timestamp
- Redirect cleanly to remove URL parameter
- For logged-in users: immediately store attribution in database

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

## Phase 5: Email System (Customer-facing: "Partner")

### 5.1 Stylist Emails (`/transactional/emails/affiliate/`)

- **`affiliate-application-received.tsx`**: "Din partnersøknad er mottatt"
- **`affiliate-application-approved.tsx`**: "Søknaden din er godkjent! Din partnerkode: [CODE]"
- **`affiliate-application-rejected.tsx`**: "Partnersøknaden din er dessverre avvist"
- **`affiliate-payout-processed.tsx`**: "Partner provisjon utbetalt: [AMOUNT] kr"
- **`affiliate-code-expiring.tsx`**: "Din partnerkode utløper snart"

### 5.2 Customer Emails

- **Enhanced booking-receipt**: Include partner attribution if applicable
- **`affiliate-discount-applied.tsx`**: "Du brukte [Stylist]s partnerkode og sparte [AMOUNT] kr"

## Phase 6: Technical Implementation Details

### 6.1 Cookie Management

```typescript
// Set attribution cookie
const setAffiliateCookie = (code: string) => {
  const attribution = {
    code,
    attributed_at: new Date().toISOString(),
    expires_at: addDays(new Date(), 30).toISOString(),
  };
  setCookie("affiliate_attribution", JSON.stringify(attribution), {
    maxAge: 30 * 24 * 60 * 60,
    secure: true,
    sameSite: "lax",
  });
};
```

### 6.2 Checkout Logic

```typescript
// Check for auto-applicable discount
const checkAffiliateDiscount = async (cart: Cart, userId?: string) => {
  const attribution = await getAffiliateAttribution(userId);
  if (!attribution) return null;

  // Check if any cart items are from the attributed stylist
  const stylist = await getStylistByAffiliateCode(attribution.code);
  const applicableServices = cart.services.filter(
    (service) => service.stylist_id === stylist.id
  );

  if (applicableServices.length > 0) {
    return {
      code: attribution.code,
      stylist,
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

## Phase 8: Database Migrations

### 8.1 Update Existing Tables

```sql
-- Rename affiliate_links to affiliate_codes
ALTER TABLE affiliate_links RENAME TO affiliate_codes;

-- Rename affiliate_clicks to affiliate_attributions
ALTER TABLE affiliate_clicks RENAME TO affiliate_attributions;
ALTER TABLE affiliate_attributions ADD COLUMN visitor_session TEXT;
ALTER TABLE affiliate_attributions ADD COLUMN attributed_at TIMESTAMP WITH TIME ZONE;
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
