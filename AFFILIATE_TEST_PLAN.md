# Affiliate System Test Plan

## Overview

This test plan validates the complete affiliate (partner) system functionality, covering all user roles and critical workflows. The system allows stylists to become partners, generate affiliate codes, and earn commissions when customers use their codes.

## Test Environment Setup

### Prerequisites

- Local development environment with Supabase running
- Test data seeded with stylists, customers, and services
- Admin user account for management testing
- Multiple test browsers for cookie/session testing

### Test Data Requirements

- 3+ approved stylists (potential affiliates)
- 1+ pending affiliate application
- 10+ customers for booking testing
- Various services across different price ranges
- Test affiliate codes in different states (active, expired, inactive)

## System Roles & Responsibilities

### 1. **Customer Role**

- Discovers and uses affiliate codes
- Gets automatic discounts at checkout
- Completes bookings with attribution

### 2. **Stylist Role**

- Applies for affiliate/partner status
- Manages affiliate codes and sharing
- Tracks performance and earnings
- Receives commission payouts

### 3. **Admin Role**

- Reviews and approves affiliate applications
- Manages affiliate codes and performance
- Processes payouts and analytics
- Monitors system health

### 4. **System Role**

- Tracks code usage and attribution
- Applies discounts automatically
- Calculates and records commissions
- Handles cookie/session management

---

## Test Execution Order

### Phase 1: Infrastructure & Foundation Testing

#### 1.1 Database Schema Validation

**Priority: Critical | Dependencies: None**

- [x] **Test**: Verify all affiliate tables exist and have correct structure
  - `affiliate_applications`, `affiliate_links`, `affiliate_clicks`, `affiliate_commissions`, `affiliate_payouts`
- [x] **Test**: Validate table relationships and foreign key constraints
- [x] **Test**: Confirm RLS policies are properly configured
- [x] **Test**: Verify database triggers and indexes are in place

#### 1.2 Server Actions Testing

**Priority: Critical | Dependencies: Database Schema**

- [x] **Test**: `affiliate-codes.actions.ts` - Code generation and validation
- [x] **Test**: `attribution.actions.ts` - Attribution tracking (after table name fixes)
- [x] **Test**: `affiliate-applications.actions.ts` - Application CRUD operations
- [x] **Test**: Error handling for all server actions
- [x] **Test**: Database query performance under load

#### 1.3 Middleware & Cookie System

**Priority: High | Dependencies: Server Actions**

- [x] **Test**: URL parameter detection (`?code=XYZ`)
- [x] **Test**: Cookie creation and 30-day expiration
- [x] **Test**: Clean URL redirect functionality
- [x] **Test**: Cookie to database transfer for logged-in users
- [x] **Test**: Cookie persistence across browser sessions
- [x] **Test**: Cookie behavior in incognito/private mode

### Phase 2: Stylist Affiliate Journey

#### 2.1 Affiliate Application Process

**Priority: High | Dependencies: Infrastructure**

**Test Order:**

1. [x] **Application Form Submission**

   - Navigate to `/profiler/[profileId]/partner/soknad`
   - Fill out complete application form
   - Validate required field enforcement
   - Submit application successfully
   - Verify data saved to `affiliate_applications` table

2. [x] **Application Status Tracking**

   - Check application appears in stylist's partner dashboard
   - Verify status shows as "pending"
   - Test email notification sent to stylist (application received)

3. [x] **Admin Review Process**

   - Admin can view pending applications in `/admin/partner`
   - Admin can approve application
   - Admin can reject application with reason
   - Test status updates in real-time

4. [x] **Post-Approval Code Generation**
   - Approved application triggers code generation
   - Code appears in `affiliate_links` table
   - Code follows naming convention (e.g., "ANNA-HAIR-2024")
   - Approval email sent with affiliate code

#### 2.2 Affiliate Code Management

**Priority: High | Dependencies: Application Approval**

**Test Order:**

1. [x] **Code Display & Sharing**

   - Approved stylist can view code in `/profiler/[profileId]/partner`
   - Copy code functionality works
   - Social media link generation (`app.no?code=XYZ`)
   - QR code generation for offline sharing

2. [x] **Performance Metrics**
   - View click count and conversion metrics
   - Earnings summary display
   - Historical performance charts
   - Export functionality for tax purposes

### Phase 3: Customer Attribution Journey

#### 3.1 Code Discovery & Attribution

**Priority: Critical | Dependencies: Active Affiliate Codes**

**Test Order:**

1. [x] **Social Media Link Flow**

   - Click social media link with `?code=XYZ` parameter
   - Verify cookie is set with correct attribution data
   - Confirm URL is cleaned (parameter removed)
   - Test attribution persists across page navigation
   - Verify attribution expires after 30 days

2. [x] **Direct Code Entry**

   - Add service to cart from any stylist
   - Enter affiliate code manually at checkout
   - Validate code is accepted/rejected appropriately
   - Test case sensitivity handling
   - Test invalid code error messages

3. [x] **Anonymous vs Logged-in Attribution**
   - Test attribution while logged out (cookie only)
   - Login and verify attribution transfers to database
   - Test multiple device/browser scenarios
   - Verify attribution ownership can't be stolen

#### 3.2 Cross-Browser & Device Testing

**Priority: Medium | Dependencies: Code Attribution**

- [x] **Multi-Browser Cookie Handling**

  - Chrome, Firefox, Safari, Edge
  - Test cookie sync limitations
  - Verify clean fallbacks when cookies disabled

- [x] **Mobile Device Testing**
  - Test URL parameter handling in mobile browsers
  - Verify responsive design for affiliate interfaces
  - Test deep link behavior from social media apps

### Phase 4: Checkout Integration & Commission Flow

#### 4.1 Automatic Discount Application

**Priority: Critical | Dependencies: Customer Attribution**

**Test Order:**

1. [x] **Same-Stylist Booking Flow**

   - Customer has attribution for Stylist A's code
   - Add Stylist A's service to cart
   - Navigate to checkout
   - Verify discount banner appears automatically
   - Confirm discount amount is correct
   - Complete booking and verify commission recorded

2. [x] **Cross-Stylist Prevention**

   - Customer has attribution for Stylist A's code
   - Add Stylist B's service to cart
   - Verify NO discount is applied
   - Confirm no commission is recorded
   - Test error handling/messaging

#### 4.2 Commission Calculation & Tracking

**Priority: Critical | Dependencies: Checkout Integration**

**Test Order:**

1. [x] **Commission Recording**

   - Complete booking with affiliate attribution
   - Verify entry created in `affiliate_commissions` table
   - Confirm commission percentage calculation
   - Test commission status workflow (pending → confirmed → paid)

2. [x] **Aggregate Statistics Update**

   - Verify `click_count` increments on attribution
   - Verify `conversion_count` increments on booking
   - Confirm `total_commission_earned` is updated
   - Test performance metric accuracy

3. [ ] **Refund Handling**
   - Cancel/refund booking with affiliate commission
   - Verify commission is reversed
   - Test partial refund scenarios
   - Confirm statistics are decremented correctly

### Phase 5: Admin Management Interface

#### 5.1 Application Management

**Priority: High | Dependencies: Stylist Applications**

**Test Order:**

1. [x] **Application Review Interface**

   - View all pending applications in admin dashboard
   - Review application details and supporting information
   - Approve applications in bulk or individually
   - Reject with custom reasons

2. [x] **Code Management**
   - View all active affiliate codes
   - Deactivate/reactivate codes
   - Modify commission percentages
   - Set expiration dates
   - Generate replacement codes

#### 5.2 Analytics & Reporting

**Priority: Medium | Dependencies: Commission Data**

**Test Order:**

1. [ ] **Performance Analytics**

   - View platform-wide affiliate performance
   - Top performer leaderboards
   - Conversion funnel analysis
   - Revenue attribution reports

2. [ ] **Payout Management**
   - Calculate pending payouts
   - Generate payout batches
   - Export payout data for processing
   - Mark payouts as completed

### Phase 6: Integration & System Testing

#### 6.1 Email Notification System

**Priority: Medium | Dependencies: All Previous Phases**

- [ ] **Application Flow Emails**

  - Application received confirmation
  - Application approved with code
  - Application rejected with reason
  - Code expiring warning

- [ ] **Commission & Payout Emails**
  - Commission earned notification
  - Payout processed confirmation
  - Monthly earning summaries

#### 6.2 Security & Access Control

**Priority: Critical | Dependencies: All User Interfaces**

- [ ] **Role-Based Access Control**

  - Customers cannot access admin interfaces
  - Stylists cannot access other stylists' affiliate data
  - Admins have appropriate access levels
  - Unauthenticated users handled properly

- [ ] **Data Protection**
  - Attribution cookies are secure and httpOnly
  - Affiliate codes cannot be guessed/brute forced
  - Commission data is properly isolated
  - No sensitive data exposed in client-side code

### Phase 7: Edge Cases & Error Handling

#### 7.1 Code Lifecycle Testing

**Priority: Medium | Dependencies: Active System**

- [ ] **Expired Codes**

  - Codes past expiration date are rejected
  - Attribution from expired codes doesn't apply discounts
  - Expired codes show appropriate error messages
  - Admin can extend or replace expired codes

- [ ] **Inactive/Disabled Codes**
  - Deactivated codes are rejected at checkout
  - Existing attributions from deactivated codes are handled
  - Admin can reactivate codes
  - Proper messaging for disabled code attempts

#### 7.2 System Resilience

**Priority: Medium | Dependencies: Full System**

- [ ] **High Load Scenarios**

  - Multiple concurrent code applications
  - Heavy checkout traffic with affiliations
  - Database performance under affiliate query load
  - Cookie handling at scale

- [ ] **Failure Recovery**
  - Graceful degradation when attribution service is down
  - Checkout continues to work without affiliate features
  - Commission calculation retry mechanisms
  - Data consistency during service interruptions

### Phase 8: Performance & Optimization

#### 8.1 Database Performance

**Priority: Low | Dependencies: Full Data Set**

- [ ] **Query Optimization**

  - Attribution lookup performance
  - Commission calculation efficiency
  - Analytics query performance
  - Index effectiveness

- [ ] **Data Cleanup**
  - Old attribution cleanup processes
  - Commission archival procedures
  - Performance impact of data retention policies

### Phase 9: User Experience & Acceptance

#### 9.1 End-to-End User Flows

**Priority: Critical | Dependencies: All Systems**

**Test Scenarios:**

1. [ ] **Happy Path - Social Media to Booking**

   - Stylist shares social media link with code
   - Customer clicks link, browses services
   - Customer books service from same stylist
   - Automatic discount applied, commission recorded
   - Both parties receive confirmation

2. [ ] **Manual Code Entry Flow**

   - Customer browses services without attribution
   - Adds service to cart
   - Manually enters affiliate code at checkout
   - Discount applied if codes match stylist
   - Booking completed successfully

3. [ ] **Multi-Session Attribution**
   - Customer visits with affiliate code
   - Leaves site, returns days later
   - Attribution still active from cookie
   - Discount applied correctly on booking

#### 9.2 User Interface Testing

**Priority: Medium | Dependencies: All UIs**

- [ ] **Responsive Design**

  - All affiliate interfaces work on mobile
  - Forms are usable on small screens
  - Tables and analytics display properly
  - Touch interactions work correctly

- [ ] **Accessibility**
  - Screen reader compatibility
  - Keyboard navigation support
  - Color contrast for affiliate messaging
  - WCAG compliance for all new interfaces

---

## Critical Success Criteria

### Must Pass Before Launch

1. ✅ **Attribution System**: Codes properly tracked via URL and cookies
2. ✅ **Discount Application**: Automatic discount application works correctly
3. ✅ **Commission Tracking**: Accurate commission calculation and recording
4. ✅ **Security**: No unauthorized access to affiliate data
5. ✅ **Data Integrity**: No orphaned records or inconsistent states

### Performance Benchmarks

- Attribution lookup: < 100ms
- Discount calculation: < 200ms
- Admin dashboard load: < 2 seconds
- Cookie operations: < 50ms

## Test Data Cleanup

After testing completion:

- [ ] Remove test affiliate applications
- [ ] Clear test commission records
- [ ] Delete test attribution cookies
- [ ] Reset affiliate code counters
- [ ] Clean up test booking data

## Rollout Strategy

### Phase 1: Internal Testing

- Admin team testing with limited stylist group
- Monitor error rates and performance metrics
- Validate commission calculations manually

### Phase 2: Beta Testing

- Invite select stylists to join affiliate program
- Monitor customer experience and feedback
- Track conversion rates and system stability

### Phase 3: Full Launch

- Open affiliate applications to all stylists
- Full marketing campaign for affiliate program
- Comprehensive monitoring and analytics

## Risk Mitigation

### High Risk Areas

1. **Commission Calculation Errors**: Could cost money - extensive testing required
2. **Attribution Loss**: Could frustrate users - robust cookie handling needed
3. **Security Breaches**: Could expose financial data - thorough security testing
4. **Performance Issues**: Could hurt user experience - load testing essential

### Monitoring & Alerts

- Commission calculation accuracy alerts
- Attribution success rate monitoring
- Performance degradation alerts
- Security incident detection

---

_This test plan should be executed in order, with each phase building on the previous one. Critical issues found in early phases should halt progression until resolved._
