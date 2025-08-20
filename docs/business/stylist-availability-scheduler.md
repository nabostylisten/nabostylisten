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

### 5. Recurring Pattern Exception Management

**Purpose**: Handle conflicts and modifications to specific instances of recurring patterns while maintaining the overall series.

**Features**:

- **Cancel Individual Instances**: Remove specific occurrences without affecting the entire series
- **Reschedule Instances**: Move specific occurrences to different times/dates
- **Smart Detection**: System automatically identifies whether unavailability is one-off or recurring
- **Flexible Modification**: Change individual instances without losing the recurring pattern

**How It Works**:

1. **Instance Detection**: When clicking a red (unavailable) slot, system determines if it's part of a recurring series
2. **Smart Options**: For recurring instances, user gets three choices:
   - Cancel only this instance (makes this occurrence available)
   - Reschedule only this instance (move to different time)
   - Edit the entire recurring series
3. **Exception Storage**: Individual modifications stored as exceptions to the recurring rule
4. **Pattern Preservation**: Original recurring pattern remains intact with documented exceptions

**Use Cases**:

- Skip lunch break on a specific day for urgent appointments
- Move a weekly meeting to accommodate special events
- Cancel recurring unavailability during vacation periods
- Reschedule regular commitments for one-time conflicts

### 6. Recurring Series Management

**Purpose**: Comprehensive editing and management of entire recurring unavailability series.

**Features**:

- **Edit Series Data**: Modify title, time range, recurrence pattern, or date range
- **Delete Entire Series**: Remove complete recurring pattern with all exceptions
- **Pre-populated Forms**: Edit dialog shows current series configuration
- **Exception Cleanup**: Deleting series automatically removes all related exceptions

**Edit Options**:

- **Title/Description**: Change the name or purpose description
- **Time Range**: Adjust start and end times for all instances
- **Recurrence Pattern**: Change frequency (daily, weekly, specific days, etc.)
- **Date Range**: Modify when the series starts or ends
- **Complete Removal**: Delete the entire series with confirmation

**Business Logic**:

- Editing a series preserves existing exceptions unless they conflict with new times
- Major pattern changes may invalidate existing exceptions
- Users receive warnings if changes will affect existing exceptions
- All changes apply immediately to future instances

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

**One-Off Unavailability**:

1. **Click**: Red slot containing one-off unavailability
2. **Options**: Two main actions available:
   - "Make Available" - Removes the unavailability entirely
   - "Remove as Work Day" - Removes the entire day from work schedule
3. **Immediate Update**: Changes reflect instantly in calendar

**Recurring Unavailability**:

1. **Click**: Red slot that's part of recurring series
2. **Smart Recognition**: System detects this is recurring and shows series name
3. **Management Options**: Three sophisticated choices:
   - **Cancel This Instance**: "Cancel only this occurrence" - removes single instance
   - **Reschedule This Instance**: "Move only this occurrence" - reschedule to different time
   - **Edit Entire Series**: "Edit whole series" - modify or delete complete recurring pattern

### Managing Recurring Exceptions

**Canceling Single Instances**:

1. **Select**: Click recurring unavailability slot
2. **Choose**: "Cancel only this instance"
3. **Result**: Specific occurrence becomes available, series continues normally
4. **Visual**: Slot turns green, tooltip shows this instance was canceled

**Rescheduling Single Instances**:

1. **Select**: Click recurring unavailability slot
2. **Choose**: "Move only this instance"
3. **Set New Time**: Use date/time pickers for new schedule
4. **Result**: Original time becomes available, new time becomes unavailable
5. **Visual**: Original slot turns green, new slot shows rescheduled occurrence

**Editing Complete Series**:

1. **Select**: Click any recurring unavailability slot
2. **Choose**: "Edit whole series"
3. **Edit Form**: Pre-populated form with current series configuration
4. **Modify**: Change title, times, pattern, or date range
5. **Options**: Save changes or delete entire series
6. **Confirmation**: Delete requires explicit confirmation due to data impact

## Integration Points

### Customer Booking Flow

**How Availability Affects Bookings**:

1. **Service Selection**: Customer chooses stylist and services
2. **Available Time Calculation**: System queries stylist's availability rules and unavailability
3. **Time Slot Generation**: Creates available 30-minute slots based on:
   - Work schedule (baseline availability)
   - Minus one-off unavailability
   - Minus recurring pattern instances (with exceptions processed)
   - Minus existing confirmed bookings
4. **Exception Processing**: For recurring patterns:
   - Canceled instances become available again
   - Rescheduled instances show unavailable at new times
   - Original pattern continues normally for non-excepted instances
5. **Customer Choice**: Only available slots shown to customer

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

- `AvailabilityScheduler` (`components/availability-scheduler/availability-scheduler.tsx`)

  - Primary scheduler interface
  - Handles work schedule and unavailability management
  - Integrates all sub-features and dialogs
  - Smart detection of recurring vs one-off unavailability

- `RecurringUnavailabilityDialog` (`components/availability-scheduler/recurring-unavailability-dialog.tsx`)

  - Dedicated dialog for recurring pattern creation
  - Form validation and pattern configuration
  - RRULE generation and date range selection

- `ManageUnavailableDialog` (`components/availability-scheduler/manage-unavailable-dialog.tsx`)

  - Context-aware dialog for managing clicked unavailability
  - Automatically detects one-off vs recurring unavailability
  - Routes to appropriate management options

- `RecurringExceptionDialog` (`components/availability-scheduler/recurring-exception-dialog.tsx`)

  - Specialized dialog for managing recurring pattern instances
  - Three-option workflow: cancel, reschedule, or edit series
  - Includes reschedule mode with date/time pickers

- `EditRecurringSeriesDialog` (`components/availability-scheduler/edit-recurring-series-dialog.tsx`)

  - Complete recurring series management
  - Pre-populated form with existing series data
  - Edit all series properties or delete with confirmation

- `AddUnavailabilityDialog` (`components/availability-scheduler/add-unavailability-dialog.tsx`)

  - Simple dialog for creating one-off unavailability
  - Date/time range selection with validation

- `AvailabilitySchedulerSkeleton` (`components/availability-scheduler/availability-scheduler-skeleton.tsx`)
  - Loading state that mirrors actual calendar layout
  - Improved perceived performance

**Supporting Components**:

- `AvailabilitySchedulerWrapper` (page-level wrapper)
- Various shadcn/ui components (Dialog, Select, Calendar, etc.)

### Backend Operations

**Server Actions** (`server/availability.actions.ts`):

**Basic Availability**:

- `getAvailabilityRules()` - Fetch work schedule
- `updateAvailabilityRules()` - Update work schedule
- `getUnavailability()` - Fetch one-off unavailability (1 month past to 3 months future)
- `addUnavailability()` - Create unavailability entries
- `removeUnavailability()` - Delete unavailability

**Recurring Patterns**:

- `getRecurringUnavailability()` - Fetch recurring patterns
- `getRecurringUnavailabilityWithExceptions()` - Fetch patterns with their exceptions
- `addRecurringUnavailability()` - Create recurring patterns
- `getRecurringUnavailabilityById()` - Fetch single recurring series by ID
- `updateRecurringUnavailability()` - Update existing recurring series
- `removeRecurringUnavailability()` - Delete series and all related exceptions

**Exception Management**:

- `getRecurringExceptions()` - Fetch exceptions for specific series or all
- `addRecurringException()` - Create exception (cancel or reschedule instance)
- `removeRecurringException()` - Delete specific exception
- `updateRecurringException()` - Modify existing exception

**Booking Integration**:

- `getAvailableTimeSlots()` - Calculate available booking times with full exception processing

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
   - Logic:
     - If `new_start_time`/`new_end_time` are null = canceled instance
     - If `new_start_time`/`new_end_time` have values = rescheduled instance
   - Active Use: Fully implemented exception system for flexible recurring pattern management

## Business Rules & Validation

### Work Schedule Rules

- Must select at least one work day
- Start time must be before end time
- Times stored in 24-hour format (HH:MM:SS)
- Same hours apply to all selected work days

### Unavailability Rules

**One-Off Unavailability**:

- Can only mark available time slots as unavailable
- End time must be after start time
- Cannot create overlapping unavailability periods
- Can be removed individually without affecting other patterns

**Recurring Pattern Rules**:

- Title is required for all recurring patterns
- Start time must be before end time
- Series start date required, end date optional
- RRULE pattern must be valid iCalendar format
- Recurring patterns take precedence over work schedule

**Exception Management Rules**:

- Exceptions can only be created for existing recurring instances
- Canceled exceptions (null new times) make original time available
- Rescheduled exceptions require both new start and end times
- Exception times must follow same validation as regular unavailability
- Deleting a series automatically removes all related exceptions

### Display Rules

**Basic Color Coding**:

- Always show all 24 hours for each day
- Green = Available (work day + work hours + not unavailable)
- Red = Unavailable (any type of unavailability)
- Gray = Not available (non-work day or outside work hours)

**Enhanced Tooltips**:

- One-off unavailability: Shows reason or "Utilgjengelig"
- Recurring patterns: Shows series title (e.g., "Lunch Break")
- Canceled instances: Shows original pattern was canceled for this occurrence
- Rescheduled instances: Shows "Pattern Name (Moved to HH:MM)" in Norwegian
- Hover for details on any red slot

**Visual Indicators**:

- All unavailable slots show "Opptatt" badge
- Context-sensitive tooltips provide specific information
- Smart recognition of underlying unavailability type

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

**Smart Click Handling**:

- **Green Slots**: Single click to add one-off unavailability
- **Red Slots (One-off)**: Click to manage (remove or change work day)
- **Red Slots (Recurring)**: Click to access advanced management options
- **Gray Slots**: Click to add work day for non-work days

**Advanced Dialog Flow**:

- **Context-Aware Dialogs**: System automatically detects slot type
- **Progressive Options**: From simple to advanced based on content type
- **Confirmation Steps**: Destructive actions require explicit confirmation

**Enhanced Navigation**:

- **Scroll Areas**: Long dropdown lists (hours) use scroll areas to prevent UI overflow
- **Modal Dialogs**: Clean, centered dialogs for complex forms
- **Week Navigation**: Intuitive previous/next week navigation
- **Date Picker**: Quick jump to specific dates or weeks

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

### Recently Implemented ✅

1. **Edit Unavailability**: ✅ **COMPLETED** - Click existing unavailable slots to edit/remove
2. **Recurring Exception Management**: ✅ **COMPLETED** - Cancel or reschedule individual recurring instances
3. **Series Management**: ✅ **COMPLETED** - Edit or delete entire recurring series
4. **Smart Context Detection**: ✅ **COMPLETED** - System automatically detects unavailability type
5. **Enhanced Tooltips**: ✅ **COMPLETED** - Descriptive information for all unavailability types

### Future Enhancements

1. **Bulk Operations**: Select multiple slots for batch unavailability management
2. **Template Patterns**: Save and reuse common recurring patterns
3. **Availability Import**: Import from external calendar systems (Google Calendar, Outlook)
4. **Advanced RRULE Support**: More complex recurring patterns (monthly by day, yearly patterns)
5. **Drag and Drop**: Drag unavailability blocks to different times

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
4. **Exception Not Working**: Ensure the recurring pattern exists and times match exactly
5. **Series Edit Not Saving**: Check that all required fields are filled and times are valid
6. **Deleted Series Still Showing**: Refresh page - series deletion includes cleanup delay

### User Training Points

**Basic Setup**:

1. **Work Schedule First**: Always set up basic work schedule before adding unavailability
2. **Recurring vs One-off**: Understand when to use each type
3. **Date Ranges**: Pay attention to start/end dates for recurring patterns
4. **Visual Feedback**: Trust the color coding for slot availability

**Advanced Features**: 5. **Exception Management**: Learn the three options for recurring patterns (cancel, reschedule, edit series) 6. **Smart Clicking**: Understand that red slots behave differently based on content type 7. **Confirmation Patterns**: Destructive actions (like delete series) require explicit confirmation 8. **Tooltip Information**: Hover over red slots to understand why they're unavailable

**Best Practices**: 9. **Exception vs Edit**: Use exceptions for temporary changes, series editing for permanent changes 10. **Testing Changes**: Verify availability changes by viewing from customer perspective

This comprehensive availability management system ensures stylists have full control over their schedules while providing customers with accurate, real-time booking options.
