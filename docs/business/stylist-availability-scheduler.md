# Stylist Availability Scheduler

## Overview

The Stylist Availability Scheduler is a comprehensive weekly calendar management system that allows stylists to define their working hours and manage their availability for customer bookings. This feature is essential for the booking flow, as it determines when customers can schedule appointments with specific stylists.

## Core Purpose

- **Primary Goal**: Enable stylists to control when they are available for customer bookings
- **Secondary Goals**:
  - Reduce scheduling conflicts and double-bookings
  - Improve customer experience by showing accurate availability
  - Allow flexible work schedule management
  - Support recurring patterns for regular unavailability (lunch breaks, meetings, etc.)

## Access & Permissions

- **Who Can Use**: Only users with the `stylist` role
- **Access Point**: `/profiler/[profileId]/tilgjengelighet` (Norwegian for "availability")
- **Authentication**: Must be the profile owner (stylists can only manage their own availability)

## Core Functionality

### 1. Work Schedule Configuration

**Purpose**: Define the stylist's general working hours and days.

**How It Works**:

- Stylists set which days of the week they work (Monday through Sunday)
- Define start and end times for their workday (e.g., 08:00 to 15:00)
- This creates the baseline "available" time slots shown in green

**Business Rules**:

- Each day can have only one work period (no split shifts)
- Work hours apply to all selected work days
- Times are stored in 24-hour format
- Changes affect all future availability calculations

### 2. Weekly Calendar View

**Purpose**: Visual interface for managing availability with intuitive time slot interaction.

**Features**:

- Shows all 24 hours of each day (regardless of work hours)
- Week starts on Monday, ends on Sunday (Norwegian standard)
- Navigate between weeks using previous/next buttons or date picker
- Color-coded time slots:
  - **Green**: Available for booking (work day + work hours + not marked unavailable)
  - **Red**: Unavailable (marked as busy or recurring pattern)
  - **Gray**: Not a work day or outside work hours

**Navigation**:

- Previous/Next week buttons
- "Today" button to return to current week
- Date picker for jumping to specific dates
- Week number and month display for context

### 3. One-Off Unavailability

**Purpose**: Mark specific date/time ranges as unavailable (vacation, appointments, etc.).

**How It Works**:

- Click any available (green) time slot to mark as unavailable
- Set start and end date/time
- Add optional reason (e.g., "Vacation", "Doctor appointment")
- Immediately shows as red in the calendar

**Use Cases**:

- Single-day vacations or sick days
- Specific appointments or commitments
- Emergency unavailability
- One-time schedule changes

### 4. Recurring Unavailability Patterns

**Purpose**: Set repeating unavailability for regular commitments.

**Features**:

- **Title**: Descriptive name (e.g., "Lunch Break", "Team Meeting")
- **Time Range**: Daily start and end times
- **Recurrence Patterns**:
  - Every day
  - Weekdays only (Monday-Friday)
  - Specific days of the week
  - Every other week
  - Monthly patterns
- **Date Range**: Start date and optional end date
- **Standards**: Uses iCalendar RRULE format for pattern storage

**Common Patterns**:

- Daily lunch break (11:00-12:00, weekdays)
- Weekly team meetings (every Monday 09:00-10:00)
- Bi-weekly training sessions
- Monthly administrative time

### 5. Exception Handling

**Purpose**: Handle conflicts and special cases in recurring patterns.

**Technical Foundation** (stored for future use):

- Override specific instances of recurring patterns
- Reschedule or cancel individual occurrences
- Maintain pattern integrity while allowing flexibility

## User Workflows

### Setting Up Initial Availability

1. **Access**: Navigate to Tilgjengelighet page from stylist profile
2. **Configure Work Schedule**:
   - Click "Settings" button
   - Select work days (checkboxes for Monday-Sunday)
   - Set start and end times using dropdown selectors
   - Save settings
3. **View Results**: Calendar immediately shows green slots for available times

### Marking One-Off Unavailability

1. **Select Time**: Click any green (available) time slot
2. **Set Details**:
   - Adjust start/end times if needed
   - Add optional reason
3. **Confirm**: Click "Add" to save
4. **Visual Update**: Slot immediately turns red with "Unavailable" badge

### Creating Recurring Patterns

1. **Access**: Click "Recurring" button in header
2. **Configure Pattern**:
   - Enter descriptive title
   - Set daily time range
   - Choose recurrence pattern from dropdown
   - Set start date and optional end date
3. **Save**: Pattern immediately applies to all matching dates
4. **Visual Result**: All matching time slots show as red/unavailable

### Managing Existing Unavailability

- **View**: All unavailability shows as red slots with "Unavailable" badges
- **Future Enhancement**: Click on unavailable slots to edit/remove (planned)

## Integration Points

### Customer Booking Flow

**How Availability Affects Bookings**:

1. **Service Selection**: Customer chooses stylist and services
2. **Available Time Calculation**: System queries stylist's availability rules and unavailability
3. **Time Slot Generation**: Creates available 30-minute slots based on:
   - Work schedule (baseline availability)
   - Minus one-off unavailability
   - Minus recurring pattern instances
   - Minus existing confirmed bookings
4. **Customer Choice**: Only available slots shown to customer

**Database Integration**:

- `getAvailableTimeSlots()` function processes all availability data
- Real-time calculation ensures accuracy
- Prevents double-booking scenarios

### Real-Time Updates

**Immediate Effects**:

- Changes to availability immediately affect customer booking options
- No delay between stylist updates and customer-facing availability
- Cache invalidation ensures data consistency

## Technical Components

### Frontend Components

**Main Components**:

- `AvailabilityScheduler` (`components/availability-scheduler.tsx`)

  - Primary scheduler interface
  - Handles work schedule and unavailability management
  - Integrates all sub-features

- `RecurringUnavailabilityDialog` (`components/recurring-unavailability-dialog.tsx`)

  - Dedicated dialog for recurring pattern creation
  - Form validation and pattern configuration
  - RRULE generation

- `AvailabilitySchedulerSkeleton` (`components/skeletons/availability-scheduler-skeleton.tsx`)
  - Loading state that mirrors actual calendar layout
  - Improved perceived performance

**Supporting Components**:

- `AvailabilitySchedulerWrapper` (page-level wrapper)
- Various shadcn/ui components (Dialog, Select, Calendar, etc.)

### Backend Operations

**Server Actions** (`server/availability.actions.ts`):

- `getAvailabilityRules()` - Fetch work schedule
- `updateAvailabilityRules()` - Update work schedule
- `getUnavailability()` - Fetch one-off unavailability
- `addUnavailability()` - Create unavailability entries
- `removeUnavailability()` - Delete unavailability
- `getRecurringUnavailability()` - Fetch recurring patterns
- `addRecurringUnavailability()` - Create recurring patterns
- `getAvailableTimeSlots()` - Calculate available booking times

### Database Schema

**Core Tables**:

1. **`stylist_availability_rules`**

   - Purpose: Store work schedule (days and hours)
   - Key Fields: `stylist_id`, `day_of_week`, `start_time`, `end_time`
   - Constraint: One rule per stylist per day

2. **`stylist_unavailability`**

   - Purpose: One-off unavailable periods
   - Key Fields: `stylist_id`, `start_time`, `end_time`, `reason`
   - Use: Specific dates/times marked as unavailable

3. **`stylist_recurring_unavailability`**

   - Purpose: Recurring unavailability patterns
   - Key Fields: `stylist_id`, `title`, `start_time`, `end_time`, `rrule`, `series_start_date`, `series_end_date`
   - Standards: Uses iCalendar RRULE format

4. **`recurring_unavailability_exceptions`**
   - Purpose: Handle exceptions to recurring patterns
   - Key Fields: `series_id`, `original_start_time`, `new_start_time`, `new_end_time`
   - Future Use: Override specific instances of recurring patterns

## Business Rules & Validation

### Work Schedule Rules

- Must select at least one work day
- Start time must be before end time
- Times stored in 24-hour format (HH:MM:SS)
- Same hours apply to all selected work days

### Unavailability Rules

- Can only mark available time slots as unavailable
- End time must be after start time
- Cannot create overlapping unavailability periods
- Recurring patterns override one-off unavailability if conflicts exist

### Display Rules

- Always show all 24 hours for each day
- Green = Available (work day + work hours + not unavailable)
- Red = Unavailable (any type of unavailability)
- Gray = Not available (non-work day or outside work hours)

### Customer Booking Rules

- Only available (green) time slots can be booked
- Booking duration must fit within available periods
- Real-time validation prevents conflicts

## User Experience Features

### Visual Design

- **Clean Interface**: Minimal, calendar-focused design
- **Color Coding**: Intuitive green/red/gray system
- **Loading States**: Skeleton loader maintains layout during loading
- **Responsive**: Works on desktop and tablet devices

### Interaction Design

- **Click to Add**: Single click on available slots to add unavailability
- **Scroll Areas**: Long dropdown lists (hours) use scroll areas to prevent UI overflow
- **Modal Dialogs**: Clean, centered dialogs for complex forms
- **Week Navigation**: Intuitive previous/next week navigation

### Accessibility

- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: Sufficient contrast for all text and backgrounds
- **Clear Labeling**: All form fields and buttons clearly labeled

## Performance Considerations

### Data Loading

- **Optimized Queries**: Only fetch 3 months of unavailability data
- **Efficient Caching**: TanStack Query handles caching and invalidation
- **Skeleton Loading**: Immediate feedback while data loads

### Performance Updates

- **Optimistic Updates**: UI updates immediately, syncs with server
- **Cache Invalidation**: Automatic refresh of related data
- **Error Handling**: Graceful degradation and error recovery

## Future Enhancements

### Planned Features

1. **Edit Unavailability**: Click existing unavailable slots to edit/remove
2. **Bulk Operations**: Select multiple slots for batch unavailability
3. **Template Patterns**: Save and reuse common recurring patterns
4. **Availability Import**: Import from external calendar systems
5. **Advanced RRULE Support**: More complex recurring patterns

### Integration Opportunities

1. **Calendar Sync**: Two-way sync with Google Calendar, Outlook
2. **Mobile App**: Native mobile interface for on-the-go management
3. **Notification System**: Alerts for scheduling conflicts
4. **Analytics**: Availability utilization reports
5. **Team Coordination**: Multi-stylist availability views for salons

## Success Metrics

### User Adoption

- Percentage of stylists who complete availability setup
- Frequency of availability updates
- Time spent on availability management

### Booking Efficiency

- Reduction in booking conflicts
- Increase in successful booking completion rate
- Customer satisfaction with available time options

### Business Impact

- Reduction in manual scheduling overhead
- Increase in stylist autonomy
- Improved customer experience scores

## Support & Troubleshooting

### Common Issues

1. **No Available Slots**: Check work schedule configuration
2. **Recurring Pattern Not Showing**: Verify RRULE and date ranges
3. **Calendar Not Loading**: Network connectivity or permission issues

### User Training Points

1. **Work Schedule First**: Always set up basic work schedule before adding unavailability
2. **Recurring vs One-off**: Understand when to use each type
3. **Date Ranges**: Pay attention to start/end dates for recurring patterns
4. **Visual Feedback**: Trust the color coding for slot availability

This comprehensive availability management system ensures stylists have full control over their schedules while providing customers with accurate, real-time booking options.
