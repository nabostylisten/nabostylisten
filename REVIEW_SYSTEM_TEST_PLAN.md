# Review System Test Plan

## Overview

This test plan covers comprehensive testing of the Reviews and Ratings system implementation. Follow this plan to verify all functionality works correctly across different user roles and scenarios.

## Pre-Test Setup

### 1. Database Preparation

```bash
# Ensure fresh seed data with reviews
bun seed:reset
bun seed
```

### 2. User Accounts Needed

- **Customer Account**: Regular customer with completed bookings
- **Stylist Account**: Stylist with services and completed bookings (both as stylist and customer)
- **Admin Account**: Admin user for verification

### 3. Test Environment

- Local development environment running
- Database properly seeded with review test data
- All components built and running without errors

---

## Test Scenarios

### A. Review Creation Flow

#### A1. Customer Review Creation (Happy Path)

**Objective**: Verify customers can successfully create reviews for completed bookings

**Test Steps**:

1. Login as a customer account
2. Navigate to "Mine bookinger" page
3. **Verify**: Review reminder alert appears for completed bookings without reviews
4. Click "Skriv anmeldelse" button on the alert
5. **Verify**: Review dialog opens with correct booking and stylist information
6. Rate the service (click on stars 1-5)
7. **Verify**: Star rating updates visually
8. Add a text comment (test with both short and long comments)
9. Upload 1-3 test images
10. **Verify**: Images preview correctly
11. Click "Publiser anmeldelse"
12. **Verify**: Success toast appears
13. **Verify**: Dialog closes
14. **Verify**: Review reminder alert disappears

**Expected Results**:

- Review created successfully
- Alert removed from mine-bookinger page
- Review appears in customer's "Anmeldelser" page
- Review appears on stylist's profile and service cards

#### A2. Review Creation from Chat Page

**Test Steps**:

1. Navigate to chat page for a completed booking
2. **Verify**: Review reminder alert appears at top
3. Follow steps 4-14 from A1
4. **Verify**: Alert disappears from chat page

#### A3. Review Creation from Booking Details

**Test Steps**:

1. Navigate to booking details page for completed booking
2. **Verify**: Review reminder alert appears
3. Follow review creation flow
4. **Verify**: Alert disappears from booking details

#### A4. Review with Images

**Test Steps**:

1. Start review creation flow
2. Upload multiple images (test 1, 3, and 5 images)
3. **Verify**: Image previews show correctly
4. Remove an image using X button
5. **Verify**: Image removed from preview
6. Complete review submission
7. **Verify**: Images uploaded and display in review card

#### A5. Review Validation

**Test Steps**:

1. Try to submit review without rating
2. **Verify**: Validation error appears
3. Try to submit with very long comment (>1000 chars)
4. **Verify**: Character limit enforced
5. Try to upload non-image files
6. **Verify**: Only image files accepted

### B. Review Display and Discovery

#### B1. Service Card Rating Display

**Test Steps**:

1. Navigate to service discovery page
2. **Verify**: Service cards show average rating and review count
3. **Verify**: Only stylists with reviews show rating display
4. **Verify**: Rating display shows stars and "(X anmeldelser)" text

#### B2. Stylist Profile Rating

**Test Steps**:

1. Navigate to a stylist's public profile
2. **Verify**: Average rating displayed in header section
3. **Verify**: Recent reviews shown in reviews section
4. **Verify**: Star ratings display correctly
5. **Verify**: Review comments and photos display properly

#### B3. Review Card Display

**Test Steps**:

1. Find a review with images
2. **Verify**: Customer name displayed
3. **Verify**: Review date displayed correctly
4. **Verify**: Star rating matches submitted rating
5. **Verify**: Service information shown
6. **Verify**: Review images display in grid
7. **Verify**: "Se booking detaljer" link works

### C. Review Management Pages

#### C1. Customer Anmeldelser Page

**Test Steps**:

1. Login as customer
2. Navigate to "Anmeldelser" from profile sidebar
3. **Verify**: Page shows "Mine anmeldelser" title
4. **Verify**: List shows all reviews written by customer
5. **Verify**: Reviews show stylist names and service info
6. **Verify**: Search functionality works
7. **Verify**: Rating filter works (test "5 stjerner", "4 stjerner", etc.)
8. **Verify**: Pagination works if multiple pages

#### C2. Stylist Anmeldelser Page - Received Tab

**Test Steps**:

1. Login as stylist account
2. Navigate to "Anmeldelser" from profile sidebar
3. **Verify**: Page shows tabs "Mottatt" and "Skrevet"
4. **Verify**: "Mottatt" tab is active by default
5. **Verify**: Shows reviews received by this stylist
6. **Verify**: Reviews show customer names and services
7. Test filtering and search functionality

#### C3. Stylist Anmeldelser Page - Written Tab

**Test Steps**:

1. From stylist anmeldelser page, click "Skrevet" tab
2. **Verify**: Tab switches correctly
3. **Verify**: Shows reviews written by stylist (as customer)
4. **Verify**: Different styling/context than received reviews
5. Test filtering and search functionality

### D. Authorization and Security

#### D1. Review Authorization

**Test Steps**:

1. Try to access review creation for booking you're not customer of
2. **Verify**: Proper authorization prevents access
3. Try to access someone else's anmeldelser page
4. **Verify**: Redirects to their public profile instead

#### D2. Duplicate Review Prevention

**Test Steps**:

1. Create a review for a completed booking
2. Try to create another review for same booking
3. **Verify**: System prevents duplicate reviews
4. **Verify**: Review reminder doesn't appear after review exists

#### D3. Booking Status Requirements

**Test Steps**:

1. Find a booking with status other than "completed"
2. **Verify**: No review reminder appears
3. **Verify**: Cannot access review creation for non-completed bookings

### E. Edge Cases and Error Handling

#### E1. Network Error Handling

**Test Steps**:

1. Start review creation process
2. Disconnect internet before submitting
3. Try to submit review
4. **Verify**: Appropriate error message displayed
5. Reconnect and retry
6. **Verify**: Review submits successfully

#### E2. Large Image Handling

**Test Steps**:

1. Try uploading very large images (>10MB)
2. **Verify**: Images compressed or appropriate error shown
3. Try uploading unsupported formats
4. **Verify**: Only supported formats accepted

#### E3. Empty States

**Test Steps**:

1. Login as user with no reviews
2. Navigate to anmeldelser page
3. **Verify**: Appropriate empty state message shown
4. Check stylist with no reviews
5. **Verify**: Rating display doesn't appear on their services

### F. Performance and UX

#### F1. Review List Performance

**Test Steps**:

1. Navigate to anmeldelser page with many reviews
2. **Verify**: Page loads reasonably fast
3. Test pagination navigation
4. **Verify**: Smooth transitions between pages

#### F2. Image Upload Performance

**Test Steps**:

1. Upload multiple large images
2. **Verify**: Upload progress indication
3. **Verify**: Images compress appropriately
4. **Verify**: Loading states display properly

#### F3. Real-time Updates

**Test Steps**:

1. Create a review
2. Navigate to stylist's profile in another tab
3. **Verify**: New review appears without refresh
4. Check service cards for updated rating

### G. Mobile Responsiveness

#### G1. Mobile Review Creation

**Test Steps**:

1. Switch to mobile viewport
2. Test complete review creation flow
3. **Verify**: Dialog responsive on mobile
4. **Verify**: Image upload works on mobile
5. **Verify**: Star rating interaction works on touch

#### G2. Mobile Review Display

**Test Steps**:

1. View service cards on mobile
2. **Verify**: Rating display readable
3. View anmeldelser page on mobile
4. **Verify**: Review cards stack properly
5. **Verify**: Filters accessible and functional

---

## Test Data Verification

### Expected Seed Data

Verify the following test data exists after seeding:

1. **Customers**: All should have some reviews written for completed bookings
2. **Stylists**: Should have reviews received for their services
3. **Stylists as Customers**: Should have reviews written when they used other stylists
4. **Review Distribution**: ~50 total reviews across different ratings (1-5 stars)
5. **Review Images**: Some reviews should have attached images
6. **Booking Variety**: Reviews for different service types and stylists

---

## Bug Reporting Template

When reporting issues found during testing:

```
**Bug Title**: [Brief description]
**Severity**: [High/Medium/Low]
**Steps to Reproduce**:
1.
2.
3.

**Expected Result**:
**Actual Result**:
**Screenshots**: [If applicable]
**Browser/Device**:
**Additional Notes**:
```

---

## Success Criteria

The review system passes testing when:

- [ ] All review creation flows work without errors
- [ ] Review reminders appear and disappear correctly
- [ ] All review displays show accurate information
- [ ] Authorization prevents unauthorized access
- [ ] Search and filtering work correctly
- [ ] Image upload and display functions properly
- [ ] Mobile experience is fully functional
- [ ] Performance is acceptable across all scenarios
- [ ] Error handling provides helpful feedback
- [ ] No data corruption or lost reviews

---

## Post-Test Cleanup

After completing tests:

1. Note any bugs or issues found
2. Verify database integrity
3. Clean up any test data that shouldn't persist
4. Document any edge cases discovered
5. Update this test plan with any new scenarios found

This test plan should be executed before any production deployment to ensure the review system functions correctly across all user scenarios.
