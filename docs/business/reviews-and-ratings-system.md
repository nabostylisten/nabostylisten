# Reviews and Ratings System

## Overview

The Reviews and Ratings System enables customers to leave detailed feedback about their completed bookings, including star ratings, text comments, and photos. This system builds trust between customers and stylists while providing valuable feedback for service improvement.

## Business Purpose

- **Trust Building**: Help customers make informed decisions through genuine peer reviews
- **Quality Assurance**: Provide stylists with constructive feedback to improve their services
- **Platform Credibility**: Establish Nabostylisten as a trusted marketplace through transparency
- **Service Discovery**: Enable customers to find highly-rated stylists and services
- **Customer Retention**: Encourage engagement through the review process

## Key Features

### Review Creation

- **5-Star Rating System**: Simple 1-5 star rating with visual star display
- **Written Comments**: Optional detailed text feedback up to 1000 characters
- **Photo Upload**: Support for up to 5 images per review showing service results
- **Image Management**: Drag-and-drop interface with file validation and compression
- **Single Review Per Booking**: One review allowed per completed booking
- **Customer-Only Reviews**: Only customers who received the service can leave reviews

### Review Display

- **Service Cards**: Average rating and review count displayed on all service listings
- **Stylist Profiles**: Comprehensive rating overview with recent reviews
- **Review Lists**: Paginated, filterable, and searchable review displays
- **Review Cards**: Rich display including photos, ratings, and booking context

### Review Management

- **Customer View**: List of all reviews they've written across bookings
- **Review Editing**: Full edit capability including rating, comment, and image updates
- **Review Deletion**: Complete review removal with confirmation dialog
- **Image Management**: Individual image deletion from existing reviews
- **Image Carousel**: Visual browsing of multiple review images
- **Stylist View**: Dual tabs showing reviews received vs reviews written (as customer)
- **Review Reminders**: Proactive alerts encouraging review completion
- **Review Analytics**: Average ratings and review counts for performance tracking

## User Workflows

### Customer Review Journey

1. **Booking Completion**: Booking status changes to "completed"
2. **Review Reminder**: Alert appears on chat page, booking details, and dashboard
3. **Review Creation**:
   - Click "Write Review" button
   - Rate experience (1-5 stars)
   - Add optional written comment
   - Upload up to 5 optional photos (drag-and-drop)
   - Preview and manage uploaded images
   - Submit review
4. **Review Published**: Review appears on stylist's profile and service listings
5. **Review Management**: Access and edit all written reviews through "Anmeldelser" page
6. **Review Updates**:
   - Edit existing reviews with prepopulated values
   - Add or remove images from published reviews
   - Update ratings and comments
   - Delete entire reviews if needed

### Stylist Review Monitoring

1. **Receive Reviews**: Customers leave reviews for completed bookings
2. **Review Notifications**: System tracks new reviews for dashboard display
3. **Review Analysis**: View all received reviews with filtering and search
4. **Performance Tracking**: Monitor average rating and review trends
5. **Customer Engagement**: Understand service strengths and improvement areas

### Review Discovery (All Users)

1. **Service Browsing**: See average ratings on service cards during discovery
2. **Stylist Evaluation**: Read detailed reviews on stylist public profiles
3. **Trust Indicators**: Use ratings and review counts to assess service quality
4. **Informed Decisions**: Make booking decisions based on peer feedback

## Business Rules

### Review Eligibility

- Only customers of completed bookings can leave reviews
- One review per booking (no multiple reviews allowed)
- Reviews can only be left after booking status is "completed"
- Customer must have been the actual recipient of the service

### Review Content Guidelines

- **Rating**: Required 1-5 star rating
- **Comment**: Optional, maximum 1000 characters
- **Photos**: Optional, maximum 5 images per review (JPEG, PNG, WebP formats)
- **Image Size**: Maximum 5MB per image with automatic compression
- **Image Display**: Carousel view for multiple images with navigation controls
- **Content**: Must be relevant to the actual service experience
- **Editability**: Reviews can be updated or deleted by the original author

### Review Timing

- Reviews can be submitted immediately after booking completion
- Reviews can be updated or deleted at any time after creation
- No expiration date for review submission or editing
- Review reminders appear until review is completed
- Historical bookings remain eligible for review indefinitely
- Image updates and deletions are processed immediately

### Review Visibility

- All reviews are public and visible to platform users
- Reviews appear on stylist profiles and service listings
- Review images displayed in carousel format for multiple photos
- Review aggregations (averages) update in real-time after edits/deletions
- Reviews are sorted by date (newest first) by default
- Image thumbnails shown in review cards with full-size carousel view

## Integration Points

### Booking System Integration

- Review eligibility triggered by booking status "completed"
- Review reminders appear on booking-related pages
- One-to-one relationship between bookings and reviews
- Review creation links directly to booking context

### Chat System Integration

- Review reminders displayed in booking chat interface
- Seamless transition from chat to review dialog
- Review completion removes reminder from chat

### Profile System Integration

- Reviews accessible through user profile sidebar
- Dual-mode viewing for stylists (received vs written)
- Review counts and averages displayed on public profiles

### Service Discovery Integration

- Average ratings displayed on service cards
- Review counts shown as trust indicators
- Rating filters available in service search

## Success Metrics

### Engagement Metrics

- Review completion rate per completed booking
- Average time from booking completion to review submission
- Review reminder click-through rate
- Photo upload rate in reviews (up to 5 images per review)
- Review edit frequency and update patterns
- Image deletion and management usage
- Review deletion rate and reasons

### Quality Metrics

- Average rating across all stylists
- Distribution of ratings (1-5 stars)
- Review length and detail quality
- Review helpfulness indicators

### Business Impact Metrics

- Correlation between high ratings and booking volume
- Customer retention rate for highly-rated stylists
- New customer acquisition through review discovery
- Platform trust score improvements

## Content Moderation

### Automated Safeguards

- Character limits prevent spam (1000 character maximum)
- Image validation ensures appropriate content (5MB max, image formats only)
- File type validation (JPEG, PNG, WebP only)
- Authorization checks prevent fake reviews
- Rate limiting prevents review bombing
- Secure image storage with automatic cleanup on deletion
- Image compression for optimal performance

### Review Guidelines

- Reviews must be based on actual service experience
- Personal attacks or inappropriate language discouraged
- Focus on service quality rather than personal characteristics
- Constructive feedback encouraged over purely negative comments

## Privacy and Data Protection

### Customer Privacy

- Reviews published with customer name (as provided in profile)
- Email addresses and contact information never displayed
- Customers control their review content and can view all their reviews

### Stylist Privacy

- Stylists can view all reviews about their services
- Stylist contact information not shared in review context
- Aggregate ratings protect against single negative review impact

### Data Storage

- Reviews stored securely with proper access controls
- Review images stored in dedicated `review-media` bucket with appropriate permissions
- Public URL generation for image display with security validation
- Individual image deletion removes both database records and storage files
- Complete review deletion cascades to remove all associated images
- Review deletion cascades properly when bookings or users are removed
- Atomic operations ensure data consistency during updates

## Recent Enhancements

### Advanced Image Management

- ✅ **Carousel Display**: Multiple review images displayed in interactive carousel
- ✅ **Individual Image Deletion**: Remove specific images without deleting entire review
- ✅ **Drag-and-Drop Upload**: Intuitive file upload with visual feedback
- ✅ **Image Preview**: Real-time preview of images before submission
- ✅ **File Validation**: Automatic format and size validation with user feedback
- ✅ **Filename Truncation**: Clean display of long filenames in UI

### Review Editing Capabilities

- ✅ **Full Review Updates**: Edit ratings, comments, and images in existing reviews
- ✅ **Upsert Operations**: Seamless create/update workflow through single interface
- ✅ **Review Deletion**: Complete review removal with confirmation dialog
- ✅ **Form Prepopulation**: Existing review data automatically loaded for editing
- ✅ **Real-time Updates**: Immediate UI updates after modifications

## Future Enhancements

### Review Responses

- Enable stylists to respond to customer reviews
- Professional response guidelines and moderation
- Customer notification when stylist responds

### Review Helpfulness

- Allow users to mark reviews as helpful
- Sort reviews by helpfulness score
- Highlight most helpful reviews

### Advanced Analytics

- Detailed review analytics dashboard for stylists
- Trend analysis and performance insights
- Competitive benchmarking within categories

### Review Incentives

- Loyalty points for completing reviews
- Badge system for prolific reviewers
- Early access features for active reviewers
