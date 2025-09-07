import { Dispatch, SVGProps } from "react";
import { z } from "zod";
import { Database } from "./database.types";

export type DatabaseTables = Database["public"]["Tables"];

// User search filters for admin components
export interface UserSearchFilters {
  searchQuery?: string;
  minQueryLength?: number;
  limit?: number;
}

// Default user search parameters
export const defaultUserSearchFilters: Required<UserSearchFilters> = {
  searchQuery: "",
  minQueryLength: 2,
  limit: 20,
};

// Convert search params to UserSearchFilters
export function searchParamsToUserFilters(
  searchParams: URLSearchParams,
): UserSearchFilters {
  return {
    searchQuery: searchParams.get("q") || undefined,
  };
}

// Convert UserSearchFilters to search params
export function userFiltersToSearchParams(
  filters: UserSearchFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.searchQuery) {
    params.set("q", filters.searchQuery);
  }
  return params;
}

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// SchedulerTypes.ts

// Define event type
export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  variant?: Variant;
}

// Define the state interface for the scheduler
export interface SchedulerState {
  events: Event[];
}

// Define actions for reducer
export type Action =
  | { type: "ADD_EVENT"; payload: Event }
  | { type: "REMOVE_EVENT"; payload: { id: string } }
  | { type: "UPDATE_EVENT"; payload: Event }
  | { type: "SET_EVENTS"; payload: Event[] };

// Define handlers interface
export interface Handlers {
  handleEventStyling: (
    event: Event,
    dayEvents: Event[],
    periodOptions?: {
      eventsInSamePeriod?: number;
      periodIndex?: number;
      adjustForPeriod?: boolean;
    },
  ) => {
    height: string;
    left: string;
    maxWidth: string;
    minWidth: string;
    top: string;
    zIndex: number;
  };
  handleAddEvent: (event: Event) => void;
  handleUpdateEvent: (event: Event, id: string) => void;
  handleDeleteEvent: (id: string) => void;
}

// Define getters interface
export interface Getters {
  getDaysInMonth: (
    month: number,
    year: number,
  ) => { day: number; events: Event[] }[];
  getEventsForDay: (day: number, currentDate: Date) => Event[];
  getDaysInWeek: (week: number, year: number) => Date[];
  getWeekNumber: (date: Date) => number;
  getDayName: (day: number) => string;
}

// Define the context value interface
export interface SchedulerContextType {
  events: SchedulerState;
  dispatch: Dispatch<Action>;
  getters: Getters;
  handlers: Handlers;
  weekStartsOn: startOfWeek;
}

// Define the variant options
export const variants = [
  "success",
  "primary",
  "default",
  "warning",
  "danger",
] as const;

export type Variant = (typeof variants)[number];

// Define Zod schema for form validation
export const eventSchema = z.object({
  title: z.string().nonempty("Event name is required"),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  variant: z.enum(["primary", "danger", "success", "warning", "default"]),
  color: z.string().nonempty("Color selection is required"),
});

export type EventFormData = z.infer<typeof eventSchema>;

export type Views = {
  mobileViews?: string[];
  views?: string[];
};

export type startOfWeek = "sunday" | "monday";

export interface CustomEventModal {
  CustomAddEventModal?: {
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CustomForm?: React.FC<{ register: any; errors: any }>;
  };
}

export interface CustomComponents {
  customButtons?: {
    CustomAddEventButton?: React.ReactNode;
    CustomPrevButton?: React.ReactNode;
    CustomNextButton?: React.ReactNode;
  };

  customTabs?: {
    CustomDayTab?: React.ReactNode;
    CustomWeekTab?: React.ReactNode;
    CustomMonthTab?: React.ReactNode;
  };
  CustomEventComponent?: React.FC<Event>; // Using custom event type
  CustomEventModal?: CustomEventModal;
}

export interface ButtonClassNames {
  prev?: string;
  next?: string;
  addEvent?: string;
}

export interface TabClassNames {
  view?: string;
}

export interface TabsClassNames {
  cursor?: string;
  panel?: string;
  tab?: string;
  tabContent?: string;
  tabList?: string;
  wrapper?: string;
}

export interface ViewClassNames {
  dayView?: string;
  weekView?: string;
  monthView?: string;
}

export interface ClassNames {
  event?: string;
  buttons?: ButtonClassNames;
  tabs?: TabsClassNames;
  views?: ViewClassNames;
}

// Public services listing with search and filtering
export interface ServiceFilters {
  search?: string;
  // Enhanced category filtering - multiple categories including subcategories
  categories?: string[];
  // Enhanced location filtering with coordinates and radius
  location?: {
    address: string;
    coordinates?: { lat: number; lng: number };
    radius?: number; // kilometers
  };
  // Service destination preferences
  serviceDestination?: {
    atCustomerPlace?: boolean;
    atStylistPlace?: boolean;
  };
  stylistIds?: string[];
  minPrice?: string; // Store as string for form handling, converted to øre in backend
  maxPrice?: string; // Store as string for form handling, converted to øre in backend
  sortBy?:
    | "newest"
    | "price_asc"
    | "price_desc"
    | "rating_desc"
    | "rating_asc"
    | "distance_asc";
  page?: number;
  limit?: number;
}

// URL search parameters (as they appear in the URL)
export interface ServiceSearchParams {
  search?: string;
  categories?: string; // Comma-separated category IDs
  location?: string; // Address string
  locationLat?: string; // Latitude coordinate
  locationLng?: string; // Longitude coordinate
  locationRadius?: string; // Search radius in kilometers
  atCustomerPlace?: string; // "true" | "false"
  atStylistPlace?: string; // "true" | "false"
  stylists?: string; // Comma-separated stylist IDs
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
}

// Utility function to convert URL search params to ServiceFilters
export function searchParamsToFilters(
  searchParams: ServiceSearchParams,
): ServiceFilters {
  const location = searchParams.location &&
      (searchParams.locationLat && searchParams.locationLng)
    ? {
      address: searchParams.location,
      coordinates: {
        lat: parseFloat(searchParams.locationLat),
        lng: parseFloat(searchParams.locationLng),
      },
      radius: searchParams.locationRadius
        ? parseFloat(searchParams.locationRadius)
        : 10,
    }
    : searchParams.location
    ? { address: searchParams.location, radius: 10 }
    : undefined;

  const serviceDestination =
    (searchParams.atCustomerPlace || searchParams.atStylistPlace)
      ? {
        atCustomerPlace: searchParams.atCustomerPlace === "true",
        atStylistPlace: searchParams.atStylistPlace === "true",
      }
      : undefined;

  return {
    search: searchParams.search,
    categories: searchParams.categories
      ? searchParams.categories.split(",")
      : undefined,
    location,
    serviceDestination,
    stylistIds: searchParams.stylists
      ? searchParams.stylists.split(",")
      : undefined,
    minPrice: searchParams.minPrice,
    maxPrice: searchParams.maxPrice,
    sortBy: searchParams.sort as ServiceFilters["sortBy"] || "newest",
    page: searchParams.page ? parseInt(searchParams.page) : 1,
  };
}

// Reviews listing with search, filtering and sorting
export interface ReviewFilters {
  search?: string;
  rating?: number;
  reviewerIds?: string[]; // customer IDs for "stylist" view, stylist IDs for "customer" view
  sortBy?: "newest" | "oldest" | "highest" | "lowest";
  page?: number;
  limit?: number;
}

// URL search params for reviews
export interface ReviewSearchParams {
  search?: string;
  rating?: string;
  sort?: string;
  page?: string;
}

// Utility function to convert URL search params to ReviewFilters
export function searchParamsToReviewFilters(
  searchParams: ReviewSearchParams,
): ReviewFilters {
  return {
    search: searchParams.search,
    rating: searchParams.rating ? parseInt(searchParams.rating) : undefined,
    sortBy: searchParams.sort as ReviewFilters["sortBy"] || "newest",
    page: searchParams.page ? parseInt(searchParams.page) : 1,
  };
}

// Utility function to convert ReviewFilters back to URL search params
export function reviewFiltersToSearchParams(
  filters: ReviewFilters,
): ReviewSearchParams {
  return {
    search: filters.search,
    rating: filters.rating?.toString(),
    sort: filters.sortBy !== "newest" ? filters.sortBy : undefined,
    page: filters.page && filters.page > 1
      ? filters.page.toString()
      : undefined,
  };
}

// Utility function to convert ServiceFilters back to URL search params
export function filtersToSearchParams(
  filters: ServiceFilters,
): ServiceSearchParams {
  return {
    search: filters.search,
    categories: filters.categories?.length
      ? filters.categories.join(",")
      : undefined,
    location: filters.location?.address,
    locationLat: filters.location?.coordinates?.lat.toString(),
    locationLng: filters.location?.coordinates?.lng.toString(),
    locationRadius: filters.location?.radius?.toString(),
    atCustomerPlace: filters.serviceDestination?.atCustomerPlace?.toString(),
    atStylistPlace: filters.serviceDestination?.atStylistPlace?.toString(),
    stylists: filters.stylistIds?.length
      ? filters.stylistIds.join(",")
      : undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sortBy === "newest" ? undefined : filters.sortBy,
    page: filters.page === 1 ? undefined : filters.page?.toString(),
  };
}

// Unsplash API Types (minimal for seed script)
export interface UnsplashPhoto {
  urls: {
    regular: string;
    thumb: string;
  };
  alt_description?: string | null;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

export type UnsplashRandomArrayResponse = UnsplashPhoto[];

// Mapbox Geocoding API Types
export interface MapboxContextItem {
  id: string;
  mapbox_id: string;
  text: string;
  text_no?: string;
  language?: string;
  language_no?: string;
  wikidata?: string;
  short_code?: string;
}

export interface MapboxSuggestion {
  id: string;
  type: "Feature";
  place_type: string[];
  relevance: number;
  properties: {
    accuracy?: string;
    mapbox_id: string;
  };
  text: string;
  text_no?: string;
  place_name: string;
  place_name_no?: string;
  center: [number, number]; // [lng, lat]
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  address?: string; // House number/unit
  context: MapboxContextItem[];
}

// Booking filters for user bookings page
export interface BookingFilters {
  search?: string;
  status?: "pending" | "confirmed" | "cancelled" | "completed";
  dateRange?: "upcoming" | "completed" | "all" | "to_be_confirmed" | "planned";
  sortBy?: "date_asc" | "date_desc" | "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

// URL search parameters for bookings (as they appear in the URL)
export interface BookingSearchParams {
  search?: string;
  sort?: string;
}

// Utility function to convert URL search params to BookingFilters (excluding dateRange and pagination)
export function searchParamsToBookingFilters(
  searchParams: BookingSearchParams,
  dateRange?: "upcoming" | "completed" | "all" | "to_be_confirmed" | "planned",
  page?: number,
  limit?: number,
): BookingFilters {
  return {
    search: searchParams.search,
    dateRange,
    sortBy: searchParams.sort as BookingFilters["sortBy"] || "date_desc",
    page: page || 1,
    limit: limit || 4,
  };
}

// Utility function to convert BookingFilters back to URL search params
export function bookingFiltersToSearchParams(
  filters: BookingFilters,
): BookingSearchParams {
  return {
    search: filters.search,
    sort: filters.sortBy === "date_desc" ? undefined : filters.sortBy,
  };
}

// Discount types for shared usage across components
export interface RestrictedUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
}

type DiscountRow = DatabaseTables["discounts"]["Row"];

export interface DiscountWithRestrictedUsers extends DiscountRow {
  restricted_users?: RestrictedUser[];
}

export interface DiscountFormData {
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountPercentage?: number;
  discountAmount?: number;
  maxUses?: number;
  maxUsesPerUser: number;
  validFrom: Date;
  expiresAt?: Date;
  minimumOrderAmount?: number;
  maximumOrderAmount?: number;
  isActive: boolean;
  restrictedUsers?: string[]; // Array of user IDs
}

// Affiliate attribution types with strict validation
export const affiliateAttributionSchema = z.object({
  code: z.string().min(1, "Affiliate code cannot be empty"),
  attributed_at: z.iso.datetime("Invalid attribution timestamp"),
  expires_at: z.iso.datetime("Invalid expiration timestamp"),
  original_user_id: z.uuid("Invalid user ID").optional(), // Track who originally clicked
  stylist_id: z.uuid("Invalid stylist ID"), // Critical field for matching services
});

export type AffiliateAttribution = z.infer<typeof affiliateAttributionSchema>;

// Cookie attribution (for anonymous users)
export const affiliateAttributionCookieSchema = affiliateAttributionSchema
  .extend({
    visitor_session: z.string().min(1, "Visitor session required").optional(),
  });

export type AffiliateAttributionCookie = z.infer<
  typeof affiliateAttributionCookieSchema
>;

// Database attribution (for logged-in users)
export const affiliateAttributionDbSchema = affiliateAttributionSchema.extend({
  id: z.uuid(),
  user_id: z.uuid("Invalid user ID"),
  converted_booking_id: z.uuid("Invalid booking ID").optional(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export type AffiliateAttributionDb = z.infer<
  typeof affiliateAttributionDbSchema
>;

// Affiliate code validation result
export const affiliateCodeValidationSchema = z.object({
  success: z.boolean(),
  code: z.string().optional(),
  stylist_id: z.string().uuid().optional(),
  stylist_name: z.string().optional(),
  commission_percentage: z.number().min(0).max(100).optional(),
  error: z.string().optional(),
  is_active: z.boolean().optional(),
  is_expired: z.boolean().optional(),
});

export type AffiliateCodeValidation = z.infer<
  typeof affiliateCodeValidationSchema
>;

// Affiliate discount calculation
export const affiliateDiscountSchema = z.object({
  code: z.string(),
  stylist_id: z.string().uuid(),
  stylist_name: z.string(),
  applicable_service_ids: z.array(z.string().uuid()),
  discount_amount: z.number().min(0), // Amount in øre
  commission_percentage: z.number().min(0).max(100),
  attribution: affiliateAttributionSchema,
});

export type AffiliateDiscount = z.infer<typeof affiliateDiscountSchema>;

// Commission tracking
export const affiliateCommissionSchema = z.object({
  id: z.uuid(),
  booking_id: z.string().uuid(),
  stylist_id: z.string().uuid(),
  affiliate_code: z.string(),
  commission_amount: z.number().min(0), // Amount in øre
  commission_percentage: z.number().min(0).max(100),
  status: z.enum(["pending", "paid", "reversed"]),
  attributed_user_id: z.string().uuid().optional(), // Who originally clicked the code
  created_at: z.iso.datetime(),
  paid_at: z.iso.datetime().optional(),
  reversed_at: z.iso.datetime().optional(),
});

export type AffiliateCommission = z.infer<typeof affiliateCommissionSchema>;

// Helper functions for affiliate attribution
export function parseAffiliateAttributionCookie(
  cookieValue: string,
): { success: boolean; data?: AffiliateAttributionCookie; error?: string } {
  try {
    const parsed = JSON.parse(cookieValue);
    const result = affiliateAttributionCookieSchema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: result.error.issues.map((issue) => issue.message).join(", "),
      };
    }
  } catch {
    return { success: false, error: "Invalid JSON in cookie" };
  }
}

export function createAffiliateAttributionCookie(
  code: string,
  originalUserId?: string,
): AffiliateAttributionCookie {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return {
    code: code.toUpperCase(),
    attributed_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    original_user_id: originalUserId,
  };
}
