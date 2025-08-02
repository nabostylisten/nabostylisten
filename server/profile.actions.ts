"use server";

import { createClient } from "@/lib/supabase/server";
import { profilesInsertSchema } from "@/schemas/database.schema";
import type { Database } from "@/types/database.types";
export async function getProfile(id: string) {
    const supabase = await createClient();
    return await supabase.from("profiles").select("*").eq("id", id).single();
}

export async function createProfile(data: {
    full_name: string;
    phone_number?: string;
}) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth
            .getUser();
        if (userError || !user) {
            return { error: "User not authenticated", data: null };
        }

        // Check if profile already exists
        const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .single();

        if (existingProfile) {
            return { error: "Profile already exists", data: null };
        }

        // Create profile data
        const profileData = {
            id: user.id,
            full_name: data.full_name,
            phone_number: data.phone_number || null,
            email: user.email,
            role: "customer" as const,
            subscribed_to_newsletter: false,
        };

        const validation = profilesInsertSchema.safeParse(profileData);
        if (!validation.success) {
            return {
                error: "Invalid profile data: " + validation.error.message,
                data: null,
            };
        }

        const { data: profile, error } = await supabase
            .from("profiles")
            .insert(validation.data)
            .select()
            .single();

        if (error) {
            return { error: error.message, data: null };
        }

        return { error: null, data: profile };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "An error occurred",
            data: null,
        };
    }
}

export async function updateProfile(
    id: string,
    data: Database["public"]["Tables"]["profiles"]["Update"],
) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth
            .getUser();
        if (userError || !user) {
            return { error: "User not authenticated", data: null };
        }

        // Ensure user can only update their own profile
        if (user.id !== id) {
            return { error: "Unauthorized", data: null };
        }

        const { data: profile, error } = await supabase
            .from("profiles")
            .update(data)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return { error: error.message, data: null };
        }

        return { error: null, data: profile };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "An error occurred",
            data: null,
        };
    }
}

export async function checkProfileExists(userId: string) {
    try {
        const supabase = await createClient();

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", userId)
            .single();

        if (error && error.code !== "PGRST116") {
            return { error: error.message, exists: false };
        }

        return { error: null, exists: !!profile };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "An error occurred",
            exists: false,
        };
    }
}
