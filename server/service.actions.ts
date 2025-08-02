"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";

type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"];
type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];

// Extended types for form data that includes category_ids
type ServiceFormInsert = Omit<ServiceInsert, "stylist_id"> & {
    category_ids: string[];
};

type ServiceFormUpdate = Omit<ServiceUpdate, "stylist_id"> & {
    category_ids?: string[];
};

export async function getServices(stylistId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("services")
        .select(`
      *,
      service_service_categories!inner (
        service_categories (
          id,
          name,
          description
        )
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
      service_service_categories!inner (
        service_categories (
          id,
          name,
          description
        )
      )
    `)
        .eq("id", serviceId)
        .single();

    return { data, error };
}

export async function createService(serviceData: ServiceFormInsert) {
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

    // Extract category_ids and remove it from service data
    const { category_ids, ...serviceFields } = serviceData;

    // Ensure the service is created by the authenticated user
    const serviceToCreate = {
        ...serviceFields,
        stylist_id: user.id,
    };

    // Create the service
    const { data: service, error: serviceError } = await supabase
        .from("services")
        .insert(serviceToCreate)
        .select()
        .single();

    if (serviceError || !service) {
        return { error: serviceError, data: null };
    }

    // Create service-category relationships
    if (category_ids && category_ids.length > 0) {
        const categoryRelations = category_ids.map((categoryId) => ({
            service_id: service.id,
            category_id: categoryId,
        }));

        const { error: categoryError } = await supabase
            .from("service_service_categories")
            .insert(categoryRelations);

        if (categoryError) {
            // If category relations fail, clean up the created service
            await supabase.from("services").delete().eq("id", service.id);
            return { error: categoryError, data: null };
        }
    }

    revalidatePath(`/profiler/${user.id}/mine-tjenester`);
    return { data: service, error: null };
}

export async function updateService(
    serviceId: string,
    serviceData: ServiceFormUpdate,
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

    // Extract category_ids and remove it from service data
    const { category_ids, ...serviceFields } = serviceData;

    // Update the service
    const { data: service, error: serviceError } = await supabase
        .from("services")
        .update(serviceFields)
        .eq("id", serviceId)
        .select()
        .single();

    if (serviceError || !service) {
        return { error: serviceError, data: null };
    }

    // Update service-category relationships if category_ids is provided
    if (category_ids !== undefined) {
        // First, delete existing category relationships
        const { error: deleteError } = await supabase
            .from("service_service_categories")
            .delete()
            .eq("service_id", serviceId);

        if (deleteError) {
            return { error: deleteError, data: null };
        }

        // Then, create new category relationships
        if (category_ids.length > 0) {
            const categoryRelations = category_ids.map((categoryId) => ({
                service_id: serviceId,
                category_id: categoryId,
            }));

            const { error: categoryError } = await supabase
                .from("service_service_categories")
                .insert(categoryRelations);

            if (categoryError) {
                return { error: categoryError, data: null };
            }
        }
    }

    revalidatePath(`/profiler/${user.id}/mine-tjenester`);
    return { data: service, error: null };
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
