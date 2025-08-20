import type { Database } from "./database.types";

// Extract table types
export type DatabaseTables = Database["public"]["Tables"];
export type DatabaseEnums = Database["public"]["Enums"];

// Common table row types
export type Profile = DatabaseTables["profiles"]["Row"];
export type Service = DatabaseTables["services"]["Row"];
export type Review = DatabaseTables["reviews"]["Row"];
export type Address = DatabaseTables["addresses"]["Row"];
export type StylistDetails = DatabaseTables["stylist_details"]["Row"];
export type ServiceCategory = DatabaseTables["service_categories"]["Row"];
export type Media = DatabaseTables["media"]["Row"];
export type Booking = DatabaseTables["bookings"]["Row"];

// Insert types
export type ProfileInsert = DatabaseTables["profiles"]["Insert"];
export type ServiceInsert = DatabaseTables["services"]["Insert"];
export type ReviewInsert = DatabaseTables["reviews"]["Insert"];

// Update types  
export type ProfileUpdate = DatabaseTables["profiles"]["Update"];
export type ServiceUpdate = DatabaseTables["services"]["Update"];

// Enums
export type UserRole = DatabaseEnums["user_role"];
export type BookingStatus = DatabaseEnums["booking_status"];
export type ApplicationStatus = DatabaseEnums["application_status"];
export type MediaType = DatabaseEnums["media_type"];
export type DayOfWeek = DatabaseEnums["day_of_week"];

// Extended types with relations (for joined queries)
export type ProfileWithDetails = Profile & {
  stylist_details?: StylistDetails | null;
  addresses?: Address[];
  media?: Media[];
};

export type ServiceWithRelations = Service & {
  service_service_categories?: {
    service_categories: ServiceCategory;
  }[];
  media?: (Media & { publicUrl?: string })[];
};

export type ReviewWithRelations = Review & {
  profiles?: Profile;
  bookings?: Booking & {
    booking_services?: {
      services: Service;
    }[];
  };
};