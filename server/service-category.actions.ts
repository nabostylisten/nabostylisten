"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/permissions";
import type { Database } from "@/types/database.types";

type ServiceCategory =
    Database["public"]["Tables"]["service_categories"]["Row"];
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

    // Check if category has children
    const { data: children } = await supabase
        .from("service_categories")
        .select("id")
        .eq("parent_category_id", categoryId);

    if (children && children.length > 0) {
        return {
            error: "Cannot delete category with subcategories",
            data: null,
        };
    }

    // Check if category is used by services
    const { data: services } = await supabase
        .from("services")
        .select("id")
        .eq("category_id", categoryId);

    if (services && services.length > 0) {
        return { error: "Cannot delete category used by services", data: null };
    }

    const { error } = await supabase
        .from("service_categories")
        .delete()
        .eq("id", categoryId);

    if (!error) {
        revalidatePath("/admin/tjenester");
    }

    return { error };
}
