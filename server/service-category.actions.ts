"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/permissions";
import type { Database } from "@/types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";

type ServiceCategoryInsert =
    Database["public"]["Tables"]["service_categories"]["Insert"];
type ServiceCategoryUpdate =
    Database["public"]["Tables"]["service_categories"]["Update"];

export async function getAllServiceCategories() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

    return { data, error };
}

export async function getServiceCategory(categoryId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("id", categoryId)
        .single();

    return { data, error };
}

export async function createServiceCategory(
    categoryData: ServiceCategoryInsert,
) {
    const supabase = await createClient();

    // Get current user to verify they are admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Authentication required", data: null };
    }

    // Verify user is an admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || !isAdmin(profile.role)) {
        return { error: "Admin access required", data: null };
    }

    const { data, error } = await supabase
        .from("service_categories")
        .insert(categoryData)
        .select()
        .single();

    if (!error) {
        revalidatePath("/admin/tjenester");
    }

    return { data, error };
}

export async function updateServiceCategory(
    categoryId: string,
    categoryData: ServiceCategoryUpdate,
) {
    const supabase = await createClient();

    // Get current user to verify they are admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Authentication required", data: null };
    }

    // Verify user is an admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || !isAdmin(profile.role)) {
        return { error: "Admin access required", data: null };
    }

    const { data, error } = await supabase
        .from("service_categories")
        .update(categoryData)
        .eq("id", categoryId)
        .select()
        .single();

    if (!error) {
        revalidatePath("/admin/tjenester");
    }

    return { data, error };
}

// Helper function to recursively find all descendant category IDs
async function getAllDescendantIds(
    supabase: SupabaseClient,
    categoryId: string,
): Promise<string[]> {
    const { data: children } = await supabase
        .from("service_categories")
        .select("id")
        .eq("parent_category_id", categoryId);

    if (!children || children.length === 0) {
        return [];
    }

    const descendantIds: string[] = [...children.map((child) => child.id)];

    // Recursively get descendants of each child
    for (const child of children) {
        const childDescendants = await getAllDescendantIds(supabase, child.id);
        descendantIds.push(...childDescendants);
    }

    return descendantIds;
}

export async function deleteServiceCategory(categoryId: string) {
    const supabase = await createClient();

    // Get current user to verify they are admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Authentication required", data: null };
    }

    // Verify user is an admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || !isAdmin(profile.role)) {
        return { error: "Admin access required", data: null };
    }

    // Get all descendant category IDs that will be deleted
    const descendantIds = await getAllDescendantIds(supabase, categoryId);
    const allCategoryIds = [categoryId, ...descendantIds];

    // Check if any of the categories are used by services
    const { data: services } = await supabase
        .from("services")
        .select("id, category_id")
        .in("category_id", allCategoryIds);

    if (services && services.length > 0) {
        return {
            error:
                "Cannot delete category hierarchy - some categories are used by services",
            data: null,
        };
    }

    // Delete all categories in the hierarchy (children first, then parent)
    // Reverse the order so we delete children before parents
    const deleteOrder = [...descendantIds.reverse(), categoryId];

    for (const id of deleteOrder) {
        const { error: deleteError } = await supabase
            .from("service_categories")
            .delete()
            .eq("id", id);

        if (deleteError) {
            return {
                error: `Failed to delete category: ${deleteError.message}`,
                data: null,
            };
        }
    }

    revalidatePath("/admin/tjenester");
    return { error: null };
}
