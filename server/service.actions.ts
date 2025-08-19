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
      ),
      media (
        id,
        file_path,
        media_type,
        is_preview_image,
        created_at
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
      ),
      media (
        id,
        file_path,
        media_type,
        is_preview_image,
        created_at
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

/**
 * Delete a service image
 */
export async function deleteServiceImage(imageId: string) {
    try {
        const supabase = await createClient();

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth
            .getUser();
        if (userError || !user) {
            return { data: null, error: "Du må være logget inn" };
        }

        // Get image details first
        const { data: imageData, error: imageError } = await supabase
            .from("media")
            .select(`
                id,
                file_path,
                service_id,
                services!inner (
                    stylist_id
                )
            `)
            .eq("id", imageId)
            .single();

        if (imageError) {
            return { data: null, error: "Bildet ble ikke funnet" };
        }

        // Check if user owns the service
        if (imageData.services.stylist_id !== user.id) {
            return {
                data: null,
                error: "Du har ikke tilgang til å slette dette bildet",
            };
        }

        // Delete from storage
        const { error: storageError } = await supabase.storage
            .from("service-media")
            .remove([imageData.file_path]);

        if (storageError) {
            console.error("Storage deletion error:", storageError);
            // Continue with database deletion even if storage fails
        }

        // Delete from database
        const { error: deleteError } = await supabase
            .from("media")
            .delete()
            .eq("id", imageId);

        if (deleteError) {
            return {
                data: null,
                error: "Kunne ikke slette bildet fra databasen",
            };
        }

        return { data: { success: true }, error: null };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "En ukjent feil oppstod",
        };
    }
}

/**
 * Set a service image as preview
 */
export async function setServiceImageAsPreview(imageId: string) {
    try {
        const supabase = await createClient();

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth
            .getUser();
        if (userError || !user) {
            return { data: null, error: "Du må være logget inn" };
        }

        // Get image details first
        const { data: imageData, error: imageError } = await supabase
            .from("media")
            .select(`
                id,
                service_id,
                services!inner (
                    stylist_id
                )
            `)
            .eq("id", imageId)
            .single();

        if (imageError) {
            return { data: null, error: "Bildet ble ikke funnet" };
        }

        // Check if user owns the service
        if (imageData.services.stylist_id !== user.id) {
            return {
                data: null,
                error: "Du har ikke tilgang til å endre dette bildet",
            };
        }

        // First, unset any existing preview image for this service
        if (imageData.service_id) {
            const { error: unsetError } = await supabase
                .from("media")
                .update({ is_preview_image: false })
                .eq("service_id", imageData.service_id)
                .eq("is_preview_image", true);

            if (unsetError) {
                console.error("Error unsetting preview:", unsetError);
            }
        }

        // Set this image as preview
        const { error: setError } = await supabase
            .from("media")
            .update({ is_preview_image: true })
            .eq("id", imageId);

        if (setError) {
            return {
                data: null,
                error: "Kunne ikke sette bildet som hovedbilde",
            };
        }

        return { data: { success: true }, error: null };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "En ukjent feil oppstod",
        };
    }
}

/**
 * Get service images with preview first
 */
export async function getServiceImages(serviceId: string) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("media")
            .select("*")
            .eq("service_id", serviceId)
            .eq("media_type", "service_image")
            .order("is_preview_image", { ascending: false })
            .order("created_at", { ascending: true });

        if (error) {
            return { data: null, error: error.message };
        }

        // Generate public URLs for each image
        const imagesWithUrls = data.map((image) => {
            const { data: urlData } = supabase.storage
                .from("service-media")
                .getPublicUrl(image.file_path);

            return {
                ...image,
                publicUrl: urlData.publicUrl,
            };
        });

        return { data: imagesWithUrls, error: null };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "En ukjent feil oppstod",
        };
    }
}
