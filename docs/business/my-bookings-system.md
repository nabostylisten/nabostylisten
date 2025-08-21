# My Bookings System

## Overview

The My Bookings system is a comprehensive booking management interface that serves both customers and stylists on the Nabostylisten platform. It provides role-based functionality for viewing, managing, and interacting with bookings throughout their lifecycle.

## Business Purpose

- **Customer Experience**: Allow customers to track their booked services, view booking details, and manage their appointments
- **Stylist Management**: Enable stylists to efficiently manage incoming booking requests and client appointments
- **Dual Role Support**: Support stylists who also book services as customers on the platform
- **Status Transparency**: Provide clear visibility into booking status and workflow progression

## User Roles and Access

### Customer Role

- **Primary Use Case**: Track personal bookings for services they have purchased
- **Access Level**: Can only view their own bookings as a customer
- **Key Actions**: View booking details, access booking history

### Stylist Role

- **Dual Functionality**: Can operate in two distinct modes
  1. **Personal Mode**: View their own bookings as a customer (services they've purchased)
  2. **Services Mode**: Manage bookings for services they provide to clients
- **Access Level**: Can view and manage both personal and client bookings
- **Key Actions**: Confirm/cancel booking requests, communicate with customers, manage appointment workflow

## Core Features

### 1. Role-Based Interface Adaptation

**Customer Interface**

- Simple two-tab layout: "Kommende" (Upcoming) and "Tidligere" (Previous)
- Focused on personal booking consumption
- Read-only booking information display

**Stylist Interface - Personal Mode**

- Identical to customer interface when viewing personal bookings
- Shows services the stylist has booked as a customer
- Maintains separation between professional and personal activities

**Stylist Interface - Services Mode**

- Three-tab workflow management system:
  - **"Til godkjenning"** (To Be Confirmed): Pending booking requests requiring action
  - **"Planlagt"** (Planned): Confirmed bookings scheduled for service delivery
  - **"Fullført"** (Completed): Finished or cancelled appointments

### 2. Mode Toggle System (Stylists Only)

**Purpose**: Allows stylists to seamlessly switch between managing their business and personal activities

**Implementation**:

- Toggle buttons at the top of the interface
- **"Mine bookinger"** (My Bookings): Personal bookings as a customer
- **"Mine kunder"** (My Clients): Professional bookings to manage
- Automatic tab state synchronization when switching modes
- Default mode selection based on primary user role

### 3. Booking Status Management

**Customer Status Flow**:

- **Pending**: Booking submitted, awaiting stylist confirmation
- **Confirmed**: Stylist has accepted the booking
- **Completed**: Service has been delivered
- **Cancelled**: Booking has been cancelled by either party

**Stylist Workflow Management**:

- **Pending Requests**: New bookings requiring confirmation or rejection
- **Active Management**: Tools to confirm, cancel, or communicate about bookings
- **Status Updates**: Real-time booking status changes with customer notifications

### 4. Booking Actions and Interactions

**Customer Actions**:

- View comprehensive booking details
- Access booking history and receipts
- Navigate to individual booking detail pages

**Stylist Actions**:

- **Booking Confirmation**: Accept pending booking requests with optional messages
- **Booking Cancellation**: Decline or cancel bookings with reason communication
- **Status Management**: Update booking status through intuitive dialog interface
- **Customer Communication**: Send messages related to booking status changes

### 5. Pagination and Performance

**Data Management**:

- Paginated results with 4 bookings per page
- Intelligent pagination controls with ellipsis for large datasets
- Optimized loading states and error handling
- Real-time cache invalidation for status updates

**Search and Filtering**:

- Integrated search functionality across booking details
- Status-based filtering options
- Date range filtering for different booking categories
- Sort options by date, price, and booking creation time

## Business Rules and Workflow

### Booking Request Lifecycle

1. **Customer Initiates**: Customer books a service through the platform
2. **Stylist Notification**: Booking appears in stylist's "Til godkjenning" tab
3. **Stylist Decision**: Stylist confirms or cancels the booking request
4. **Status Update**: Booking moves to appropriate tab based on stylist action
5. **Service Delivery**: Confirmed bookings are tracked through completion
6. **Historical Record**: Completed bookings archived for future reference

### Status Transition Rules

**From Pending**:

- Can transition to **Confirmed** (stylist accepts)
- Can transition to **Cancelled** (stylist declines or customer cancels)

**From Confirmed**:

- Can transition to **Completed** (after service delivery)
- Can transition to **Cancelled** (with appropriate cancellation policies)

**Terminal States**:

- **Completed**: No further status changes allowed
- **Cancelled**: Final state with historical record retention

### Communication Integration

**Status Change Notifications**:

- Automatic customer notifications for booking confirmations
- Cancellation notifications with optional stylist messages
- Status update emails through transactional email system

**Message Customization**:

- Stylists can add personal messages when confirming bookings
- Cancellation reasons can be communicated to customers
- Professional tone maintained through template suggestions

## Data Architecture and Integration

### Server Actions Integration

- **getUserBookings**: Retrieves paginated booking data with role-based filtering
- **updateBookingStatus**: Handles status changes with audit trail
- Optimistic UI updates with real-time cache synchronization

### Database Relationships

- **Bookings Table**: Core booking information and status tracking
- **User Profiles**: Role-based access control and user identification
- **Services**: Detailed service information and pricing
- **Addresses**: Location data for mobile and salon services
- **Chat Integration**: Linked communication channels for booking discussions

### Real-time Updates

- **TanStack Query**: Efficient cache management and background synchronization
- **Automatic Refreshing**: Cache invalidation triggers after status changes
- **Loading States**: Skeleton loaders maintain responsive user experience

## Success Metrics and KPIs

### Customer Satisfaction

- **Booking Visibility**: Clear status tracking reduces customer support inquiries
- **Response Time**: Quick stylist responses to booking requests improve satisfaction
- **Completion Rates**: Track percentage of confirmed bookings that reach completion

### Stylist Efficiency

- **Response Time**: Average time from booking request to stylist action
- **Confirmation Rate**: Percentage of pending bookings that get confirmed
- **Workflow Efficiency**: Time spent managing bookings vs. service delivery

### Platform Health

- **Booking Conversion**: Percentage of requests that become completed services
- **Cancellation Analysis**: Reasons and patterns in booking cancellations
- **User Engagement**: Frequency of booking management interface usage

## Future Enhancement Opportunities

### Advanced Features

- **Bulk Actions**: Allow stylists to manage multiple bookings simultaneously
- **Calendar Integration**: Sync bookings with external calendar applications
- **Automated Reminders**: Scheduled notifications for upcoming appointments
- **Mobile Optimization**: Enhanced mobile interface for on-the-go management

### Analytics and Insights

- **Booking Patterns**: Analytics on customer booking behavior and preferences
- **Stylist Performance**: Metrics on response times and customer satisfaction
- **Revenue Tracking**: Financial analytics linked to booking completion rates

### Integration Enhancements

- **Payment Status**: Real-time payment processing status within booking interface
- **Review Integration**: Seamless transition from completed bookings to review prompts
- **Loyalty Programs**: Integration with customer loyalty and reward systems

## Technical Implementation

### Component Architecture

- **MyBookingsPageContent**: Main container with role-based rendering logic
- **MyBookingsList**: Data fetching and pagination management
- **BookingCard**: Individual booking display with action buttons
- **BookingStatusDialog**: Status management interface for stylists

### State Management

- **Controlled Tab State**: Synchronized tab navigation across mode switches
- **Form Validation**: Zod schemas ensure data integrity for status updates
- **Loading States**: Comprehensive loading and error state management

### Type Safety

- **String Unions**: Type-safe tab definitions and status management
- **Database Types**: Generated TypeScript types from Supabase schema
- **Shared Types**: Runtime-agnostic type definitions for client-server communication

This system provides a comprehensive foundation for booking management that scales with business growth while maintaining excellent user experience for both customers and service providers.
