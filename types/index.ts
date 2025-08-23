import { Dispatch, SVGProps } from "react";
import { z } from "zod";
import { Database } from "./database.types";

export type DatabaseTables = Database["public"]["Tables"];

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
  categoryId?: string;
  location?: string;
  stylistIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price_asc" | "price_desc" | "rating_desc" | "newest";
  page?: number;
  limit?: number;
}

// URL search parameters (as they appear in the URL)
export interface ServiceSearchParams {
  search?: string;
  category?: string;
  location?: string;
  stylists?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
}

// Utility function to convert URL search params to ServiceFilters
export function searchParamsToFilters(
  searchParams: ServiceSearchParams,
): ServiceFilters {
  return {
    search: searchParams.search,
    categoryId: searchParams.category,
    location: searchParams.location,
    stylistIds: searchParams.stylists ? searchParams.stylists.split(',') : undefined,
    minPrice: searchParams.minPrice
      ? parseInt(searchParams.minPrice)
      : undefined,
    maxPrice: searchParams.maxPrice
      ? parseInt(searchParams.maxPrice)
      : undefined,
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
    page: filters.page && filters.page > 1 ? filters.page.toString() : undefined,
  };
}

// Utility function to convert ServiceFilters back to URL search params
export function filtersToSearchParams(
  filters: ServiceFilters,
): ServiceSearchParams {
  return {
    search: filters.search,
    category: filters.categoryId,
    location: filters.location,
    stylists: filters.stylistIds?.length ? filters.stylistIds.join(',') : undefined,
    minPrice: filters.minPrice?.toString(),
    maxPrice: filters.maxPrice?.toString(),
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
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  dateRange?: 'upcoming' | 'completed' | 'all' | 'to_be_confirmed' | 'planned';
  sortBy?: 'date_asc' | 'date_desc' | 'newest' | 'price_asc' | 'price_desc';
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
  dateRange?: 'upcoming' | 'completed' | 'all' | 'to_be_confirmed' | 'planned',
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
