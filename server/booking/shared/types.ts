import type { DatabaseTables } from "@/types";

type BookingRow = DatabaseTables["bookings"]["Row"];

// Extended booking type for reschedule operations
export interface BookingWithRelated extends BookingRow {
    trial_booking?: {
        id: string;
        start_time: string;
        end_time: string;
        status: string;
        is_trial_session: boolean | null;
    } | null;
    main_booking?: {
        id: string;
        start_time: string;
        end_time: string;
        status: string;
        is_trial_session: boolean | null;
    } | null;
}