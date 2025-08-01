"use server";

import { createClient } from "@/lib/supabase/server";
import {
    bookingsInsertSchema,
    bookingsUpdateSchema,
} from "@/schemas/database.schema";
import { DatabaseTables } from "@/types";

export const bookingService = {
    async getBooking(id: string) {
        const supabase = await createClient();
        return await supabase.from("bookings").select("*").eq(
            "id",
            id,
        );
    },
    async createBooking(
        booking: DatabaseTables["bookings"]["Insert"],
    ) {
        const { success, data } = bookingsInsertSchema.safeParse(booking);
        if (!success) {
            return {
                error: "Invalid booking data",
                data: null,
            };
        }

        const supabase = await createClient();
        return await supabase.from("bookings").insert(data);
    },
    async updateBooking(
        id: string,
        booking: DatabaseTables["bookings"]["Update"],
    ) {
        const { success, data } = bookingsUpdateSchema.safeParse(booking);
        if (!success) {
            return {
                error: "Invalid booking data",
                data: null,
            };
        }
        const supabase = await createClient();

        return await supabase.from("bookings").update(data).eq("id", id);
    },
    async deleteBooking(
        id: DatabaseTables["bookings"]["Row"]["id"],
    ) {
        const supabase = await createClient();
        return await supabase.from("bookings").delete().eq("id", id);
    },
};
