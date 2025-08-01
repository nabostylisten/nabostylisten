"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"];
type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"];
type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];

export async function getServices(stylistId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("services")
        .select(`
      *,
      service_categories (
        name,
        description
      )
    `)
        .eq("stylist_id", stylistId)
        .order("created_at", { ascending: false });

    return { data, error };
}

export async function getService(serviceId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("services")
        .select(`
      *,
      service_categories (
        name,
        description
      )
    `)
        .eq("id", serviceId)
        .single();

    return { data, error };
}

export async function createService(serviceData: ServiceInsert) {
    const supabase = await createClient();

    // Get current user to verify they can create services
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Authentication required", data: null };
    }

    // Verify user is a stylist
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "stylist") {
        return { error: "Only stylists can create services", data: null };
    }

    // Ensure the service is created by the authenticated user
    const serviceToCreate = {
        ...serviceData,
        stylist_id: user.id,
    };

    const { data, error } = await supabase
        .from("services")
        .insert(serviceToCreate)
        .select()
        .single();

    if (!error) {
        revalidatePath(`/profiler/${user.id}/mine-tjenester`);
    }

    return { data, error };
}

export async function updateService(
    serviceId: string,
    serviceData: ServiceUpdate,
) {
    const supabase = await createClient();

    // Get current user to verify they can update this service
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Authentication required", data: null };
    }

    // Verify the service belongs to the current user
    const { data: existingService } = await supabase
        .from("services")
        .select("stylist_id")
        .eq("id", serviceId)
        .single();

    if (!existingService || existingService.stylist_id !== user.id) {
        return { error: "Service not found or unauthorized", data: null };
    }

    const { data, error } = await supabase
        .from("services")
        .update(serviceData)
        .eq("id", serviceId)
        .select()
        .single();

    if (!error) {
        revalidatePath(`/profiler/${user.id}/mine-tjenester`);
    }

    return { data, error };
}

export async function deleteService(serviceId: string) {
    const supabase = await createClient();

    // Get current user to verify they can delete this service
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Authentication required", data: null };
    }

    // Verify the service belongs to the current user
    const { data: existingService } = await supabase
        .from("services")
        .select("stylist_id")
        .eq("id", serviceId)
        .single();

    if (!existingService || existingService.stylist_id !== user.id) {
        return { error: "Service not found or unauthorized", data: null };
    }

    const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);

    if (!error) {
        revalidatePath(`/profiler/${user.id}/mine-tjenester`);
    }

    return { error };
}

export async function getServiceCategories() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

    return { data, error };
}
