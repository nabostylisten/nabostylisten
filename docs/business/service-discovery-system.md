# Service Discovery System

## Overview

The service discovery system is the core of Nabostylisten's marketplace functionality, enabling customers to find, filter, and browse beauty services offered by professional stylists. The system comprises the landing page (hjemmeside) and the dedicated services page (tjenester), connected through a seamless search and filtering experience with high-performance infinite scroll capabilities.

## Business Purpose

### Primary Objectives

- **Service Discovery**: Help customers quickly find beauty services that match their specific needs and preferences
- **Geographic Relevance**: Connect customers with stylists in their area or those willing to travel
- **Category-Based Browsing**: Allow customers to explore services by beauty category (hair, nails, makeup, etc.)
- **Price Transparency**: Display clear pricing information to help customers make informed decisions
- **Performance**: Provide a fast, responsive browsing experience even with hundreds of services

### Key Business Value

- Reduces time-to-discovery for customers seeking specific services
- Increases stylist visibility through enhanced search and filtering capabilities
- Drives booking conversions through optimized user experience
- Supports scalable growth with high-performance data loading

## User Workflows

### Primary Customer Journey: Landing Page to Service Discovery

1. **Landing Page Entry Point** (`/`)

   - Customer arrives at the homepage and sees the main value proposition
   - Two primary action paths are presented:
     - Direct navigation via "Se tjenester" button to browse all services
     - Immediate search using the embedded filter form

2. **Search-First Approach** (Landing Page)

   - Customer uses the search form directly on the homepage
   - Applies filters for location, category, specific stylists, and sorting preferences
   - System redirects to services page with applied filters
   - This workflow optimizes for users who know exactly what they're looking for

3. **Browse-First Approach** (Direct to Services Page)
   - Customer clicks "Se tjenester" to explore all available services
   - Lands on `/tjenester` page showing infinite scroll grid of services
   - Can then apply filters to narrow down options
   - This workflow optimizes for discovery and browsing behavior

### Service Discovery and Filtering

4. **Filter Application Process**

   - **Search Term**: Free-text search across service titles and descriptions
   - **Location Filter**: Geographic filtering by city (e.g., "Oslo", "Bergen")
   - **Category Selection**: Filter by beauty service categories with service counts
   - **Stylist Selection**: Multi-select filtering by specific stylists
   - **Price Sorting**: Sort by price (ascending/descending) or recency
   - **Real-time Feedback**: Active filters display shows current search state

5. **Infinite Scroll Browsing**

   - Services load in batches of 12 items for optimal performance
   - Responsive grid layout (1-3 columns based on screen size)
   - Virtual scrolling for smooth performance with large datasets
   - Automatic loading as user approaches end of current content

6. **Service Selection**
   - Customer clicks service card to view detailed service information
   - Card displays preview information: title, price, duration, location, stylist
   - Includes image carousel for visual service representation

## Technical Implementation

### Architecture Pattern: Server-Client Hybrid

The system uses a sophisticated hybrid approach:

#### Server-Side Components

- **Data Fetching**: Server actions handle complex database queries with joins
- **SEO Optimization**: Landing page renders with server-side data for search engine visibility
- **Filter State Management**: URL-based state persistence for bookmarkable searches

#### Client-Side Components

- **Real-time Filtering**: Immediate UI updates without page refreshes
- **Infinite Scroll**: Client-side virtualization and progressive loading
- **Responsive Adaptation**: Dynamic column calculations based on screen size

### Performance Optimizations

#### Virtual Scrolling Implementation

- **Row-Based Virtualization**: Services grouped into responsive rows (1-3 items per row)
- **Dynamic Height Calculation**: Adaptive row heights based on screen size configuration
- **Overscan Strategy**: Pre-renders 2 additional rows for smoother scrolling
- **Memory Management**: Only visible items remain in DOM, preventing memory bloat

#### Data Loading Strategy

- **Batch Loading**: 12 services per request for optimal balance of performance and UX
- **Prefetch Trigger**: Next page loads when user reaches second-to-last row
- **Caching**: TanStack Query provides intelligent caching and background updates
- **Error Recovery**: Graceful error handling with retry mechanisms

### Filter Form Architecture

#### Dual-Mode Operation

- **Redirect Mode** (Landing Page): Navigates to `/tjenester` with applied filters
- **Update Mode** (Services Page): Updates current page URL with new filter parameters

#### State Synchronization

- **URL as Source of Truth**: All filter state persisted in URL search parameters
- **Form State Hydration**: Component initializes from URL parameters on load
- **Real-time Updates**: Form changes immediately update URL and trigger new data fetching

## Business Rules and Logic

### Service Visibility Rules

- Only published services (`is_published: true`) appear in search results
- Services must have associated stylist profile to be displayed
- Category filtering requires active service-category relationships

### Search and Filtering Logic

- **Search Priority**: Matches in service titles rank higher than description matches
- **Category Filtering**: Shows service count per category to guide user selection
- **Location Matching**: Exact city name matching (future: proximity-based search)
- **Price Handling**: All prices stored in øre (Norwegian cents) for precision
- **Sorting Options**:
  - Newest first (default) - based on service creation date
  - Price ascending/descending - based on service base price

### Location Services

- **Customer Location**: Can book services "at customer place" if stylist offers travel
- **Stylist Location**: Can book services "at stylist place" if stylist has fixed location
- **Flexible Services**: Some services available at both locations
- **Travel Constraints**: Future feature to consider stylist travel distance limits

## Service Card Information Architecture

### Primary Information Display

- **Service Title**: Main service offering name
- **Price Badge**: Starting price in Norwegian kroner (converted from øre)
- **Description**: Brief service description (truncated to 2 lines)
- **Duration**: Service time in human-readable format (minutes/hours)
- **Location**: Primary stylist address (city display)
- **Stylist Name**: Service provider identification

### Visual Elements

- **Image Carousel**: Multiple service images with navigation controls
- **Category Badges**: Up to 2 category tags with overflow indicator (+N more)
- **Location Type**: Indicates where service can be performed
- **Hover Effects**: Subtle elevation changes for interactive feedback

### Responsive Design

- **Mobile First**: Single column layout for mobile devices
- **Tablet Optimization**: Two-column grid for medium screens
- **Desktop Experience**: Three-column grid for optimal browsing

## Integration Points

### Database Integration

- **Complex Queries**: Multi-table joins for services, categories, stylists, and media
- **Performance**: Optimized queries with proper indexing for fast filtering
- **Data Consistency**: Referential integrity maintained across related tables

### Media Management

- **Image Storage**: Supabase storage for uploaded service images
- **External Images**: Support for Unsplash URLs for demo/placeholder content
- **Responsive Images**: Next.js Image component for optimal loading and sizing

### Authentication Integration

- **Public Access**: Service discovery available to all users (no authentication required)
- **Future Enhancement**: Personalized recommendations for authenticated users

## Success Metrics and KPIs

### User Engagement Metrics

- **Search Usage**: Percentage of users who use filter functionality
- **Filter Abandonment**: Users who start filtering but don't complete search
- **Scroll Depth**: How far users scroll through service results
- **Click-Through Rate**: Service card clicks to detail page views

### Performance Metrics

- **Page Load Time**: Initial services page rendering performance
- **Filter Response Time**: Speed of search result updates after filter changes
- **Infinite Scroll Performance**: Time to load additional service batches
- **Virtual Scroll Efficiency**: Memory usage and rendering performance metrics

### Business Conversion Metrics

- **Discovery to Booking**: Services viewed that result in booking requests
- **Filter Effectiveness**: How filtering improves booking conversion rates
- **Geographic Performance**: Service discovery success by location
- **Category Performance**: Most searched and most converted service categories

## Future Enhancement Opportunities

### Advanced Search Features

- **Proximity-Based Search**: Replace exact city matching with distance-based filtering
- **Availability Integration**: Show real-time stylist availability in search results
- **Price Range Filtering**: Min/max price range selectors instead of just sorting
- **Advanced Sorting**: Rating-based sorting, distance sorting, availability sorting

### Personalization Features

- **Search History**: Remember user's previous searches and preferences
- **Recommended Services**: AI-powered service recommendations based on browsing behavior
- **Saved Searches**: Allow users to save and quickly re-apply filter combinations
- **Location Memory**: Remember user's preferred location for future searches

### Enhanced User Experience

- **Map Integration**: Visual map showing stylist locations for geographic browsing
- **Service Comparison**: Side-by-side comparison of similar services
- **Bulk Booking**: Select multiple services from same or different stylists
- **Service Reviews**: Integration with review system for social proof in discovery

### Performance and Scalability

- **Search Analytics**: Track search patterns to optimize indexing strategies
- **CDN Integration**: Faster image loading through content delivery networks
- **Database Optimization**: Advanced indexing and query optimization as catalog grows
- **Mobile App**: Native mobile experience with offline browsing capabilities

## Technical Dependencies

### Core Technologies

- **Next.js 15**: App Router for server/client hybrid rendering
- **TanStack Query**: Infinite query management and caching
- **TanStack Virtual**: High-performance virtual scrolling
- **React Hook Form**: Filter form state management
- **Zustand**: Client-side state management (future shopping cart integration)

### External Services

- **Supabase**: Database queries and real-time capabilities
- **Mapbox**: Future location and proximity features
- **Vercel**: Hosting and edge function deployment

This service discovery system represents a sophisticated, scalable solution for marketplace service browsing that balances user experience, performance, and business objectives while providing a foundation for future enhancements and growth.
