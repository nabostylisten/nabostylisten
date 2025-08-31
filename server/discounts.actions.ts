"use server";

import { createClient } from "@/lib/supabase/server";
import {
  discountsInsertSchema,
  discountsUpdateSchema,
} from "@/schemas/database.schema";
import type { DatabaseTables, UserSearchFilters } from "@/types";

// Types for discount operations
type Discount = DatabaseTables["discounts"]["Row"];
type DiscountInsert = DatabaseTables["discounts"]["Insert"];
type DiscountUpdate = DatabaseTables["discounts"]["Update"];

// Validation result type
interface DiscountValidationResult {
  isValid: boolean;
  error?: string;
  discount?: Discount;
  discountAmount?: number;
}

/**
 * Get discount by code - used for validation and application
 */
export async function getDiscountByCode(code: string) {
  const supabase = await createClient();

  const result = await supabase
    .from("discounts")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  return result;
}

/**
 * Validate discount code for a specific user and order amount
 * This performs all business logic validation but doesn't apply the discount
 */
export async function validateDiscountCode({
  code,
  orderAmountCents,
  profileId,
}: {
  code: string;
  orderAmountCents: number;
  profileId?: string;
}): Promise<DiscountValidationResult> {
  const supabase = await createClient();

  try {
    // Get current user if not provided
    let userId = profileId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          isValid: false,
          error: "Du må være logget inn for å bruke rabattkoder",
        };
      }
      userId = user.id;
    }

    // 1. Check if discount exists and is active
    const { data: discount, error: discountError } = await getDiscountByCode(
      code,
    );

    if (discountError || !discount) {
      return { isValid: false, error: "Rabattkoden finnes ikke" };
    }

    if (!discount.is_active) {
      return { isValid: false, error: "Rabattkoden er ikke aktiv" };
    }

    // 2. Check validity period
    const now = new Date();
    const validFrom = new Date(discount.valid_from);
    const expiresAt = discount.expires_at
      ? new Date(discount.expires_at)
      : null;

    if (now < validFrom) {
      return { isValid: false, error: "Rabattkoden er ikke gyldig ennå" };
    }

    if (expiresAt && now > expiresAt) {
      return { isValid: false, error: "Rabattkoden har utløpt" };
    }

    // 3. Check total usage limits
    if (
      discount.max_uses !== null && discount.current_uses >= discount.max_uses
    ) {
      return {
        isValid: false,
        error: "Rabattkoden har nådd maksimalt antall bruk",
      };
    }

    // 4. Check per-user usage limits
    const { data: userUsage, error: usageError } = await supabase
      .from("discount_usage")
      .select("id")
      .eq("discount_id", discount.id)
      .eq("profile_id", userId);

    if (usageError) {
      return { isValid: false, error: "Kunne ikke validere rabattkode" };
    }

    const userUsageCount = userUsage?.length || 0;
    if (userUsageCount >= discount.max_uses_per_user) {
      return {
        isValid: false,
        error:
          "Du har allerede brukt denne rabattkoden maksimalt antall ganger",
      };
    }

    // 5. Check user restrictions (if any exist)
    const { data: restrictionCheck, error: restrictionError } = await supabase
      .from("discount_restrictions")
      .select("profile_id")
      .eq("discount_id", discount.id);

    if (restrictionError) {
      return { isValid: false, error: "Kunne ikke validere rabattkode" };
    }

    // If there are restrictions and the user is not in the list, deny access
    if (restrictionCheck && restrictionCheck.length > 0) {
      const userHasAccess = restrictionCheck.some(
        (restriction) => restriction.profile_id === userId
      );
      
      if (!userHasAccess) {
        return {
          isValid: false,
          error: "Du har ikke tilgang til å bruke denne rabattkoden",
        };
      }
    }

    // 6. Check minimum order amount
    if (
      discount.minimum_order_amount &&
      orderAmountCents < discount.minimum_order_amount
    ) {
      const minAmount = discount.minimum_order_amount / 100;
      return {
        isValid: false,
        error: `Minimum ordrebeløp for denne rabattkoden er ${
          minAmount.toLocaleString("no-NO")
        } kr`,
      };
    }

    // 7. Calculate discount amount with maximum order amount as cap
    let discountAmount = 0;
    let discountableAmount = orderAmountCents;

    // If there's a maximum order amount, cap the discountable amount
    if (discount.maximum_order_amount) {
      discountableAmount = Math.min(
        orderAmountCents,
        discount.maximum_order_amount,
      );
    }

    if (discount.discount_percentage !== null) {
      discountAmount = Math.round(
        (discountableAmount * discount.discount_percentage) / 100,
      );
    } else if (discount.discount_amount !== null) {
      discountAmount = Math.min(discount.discount_amount, discountableAmount);
    }

    // Ensure discount doesn't exceed discountable amount
    discountAmount = Math.min(discountAmount, discountableAmount);

    return {
      isValid: true,
      discount,
      discountAmount,
    };
  } catch (error) {
    console.error("Error validating discount code:", error);
    return { isValid: false, error: "Kunne ikke validere rabattkode" };
  }
}

/**
 * Track discount usage - called when a booking is created with a discount
 */
export async function trackDiscountUsage({
  discountId,
  profileId,
  bookingId,
}: {
  discountId: string;
  profileId: string;
  bookingId?: string;
}) {
  const supabase = await createClient();

  try {
    // Insert usage record
    const { error: usageError } = await supabase
      .from("discount_usage")
      .insert({
        discount_id: discountId,
        profile_id: profileId,
        booking_id: bookingId || null,
      });

    if (usageError) {
      return { error: "Kunne ikke spore rabattkodebruk", data: null };
    }

    // Increment current_uses counter
    // Get current discount to increment usage count
    const { data: currentDiscount } = await supabase
      .from("discounts")
      .select("current_uses")
      .eq("id", discountId)
      .single();

    if (currentDiscount) {
      const { error: updateError } = await supabase
        .from("discounts")
        .update({
          current_uses: (currentDiscount.current_uses || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", discountId);

      if (updateError) {
        return {
          error: "Kunne ikke oppdatere rabattkode-statistikk",
          data: null,
        };
      }
    }

    return { error: null, data: "success" };
  } catch (error) {
    console.error("Error tracking discount usage:", error);
    return { error: "Kunne ikke spore rabattkodebruk", data: null };
  }
}

/**
 * Admin function - Create new discount
 */
export async function createDiscount(discount: DiscountInsert) {
  const { success, data } = discountsInsertSchema.safeParse(discount);
  if (!success) {
    return {
      error: "Ugyldig rabattkode-data",
      data: null,
    };
  }

  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Du må være logget inn", data: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return {
      error: "Du har ikke tilgang til å opprette rabattkoder",
      data: null,
    };
  }

  // Convert code to uppercase for consistency
  const discountData = {
    ...data,
    code: data.code.toUpperCase(),
  };

  return await supabase.from("discounts").insert(discountData).select()
    .single();
}

/**
 * Admin function - Create new discount with restricted users
 */
export async function createDiscountWithRestrictions(
  discount: DiscountInsert,
  restrictedUserIds: string[] = [],
) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Du må være logget inn", data: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return {
      error: "Du har ikke tilgang til å opprette rabattkoder",
      data: null,
    };
  }

  try {
    // Create the discount first
    const discountResult = await createDiscount(discount);
    if (discountResult.error || !discountResult.data) {
      return discountResult;
    }

    const discountId = discountResult.data.id;

    // Add restricted users if any
    if (restrictedUserIds.length > 0) {
      const restrictions = restrictedUserIds.map((userId) => ({
        discount_id: discountId,
        profile_id: userId,
      }));

      const { error: restrictionsError } = await supabase
        .from("discount_restrictions")
        .insert(restrictions);

      if (restrictionsError) {
        // If restrictions fail, we should probably delete the discount to maintain consistency
        await supabase.from("discounts").delete().eq("id", discountId);
        return { error: "Kunne ikke opprette brukerbegrensninger", data: null };
      }
    }

    return discountResult;
  } catch (error) {
    console.error("Error creating discount with restrictions:", error);
    return { error: "Kunne ikke opprette rabattkode", data: null };
  }
}

/**
 * Admin function - Update discount
 */
export async function updateDiscount(id: string, discount: DiscountUpdate) {
  const { success, data } = discountsUpdateSchema.safeParse(discount);
  if (!success) {
    return {
      error: "Ugyldig rabattkode-data",
      data: null,
    };
  }

  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Du må være logget inn", data: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return {
      error: "Du har ikke tilgang til å oppdatere rabattkoder",
      data: null,
    };
  }

  // Convert code to uppercase if provided
  const discountData = {
    ...data,
    ...(data.code && { code: data.code.toUpperCase() }),
  };

  return await supabase
    .from("discounts")
    .update(discountData)
    .eq("id", id)
    .select()
    .single();
}

/**
 * Admin function - Update discount with restricted users
 */
export async function updateDiscountWithRestrictions(
  id: string,
  discount: DiscountUpdate,
  restrictedUserIds: string[] = [],
) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Du må være logget inn", data: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return {
      error: "Du har ikke tilgang til å oppdatere rabattkoder",
      data: null,
    };
  }

  try {
    // Update the discount first
    const discountResult = await updateDiscount(id, discount);
    if (discountResult.error || !discountResult.data) {
      return discountResult;
    }

    // Clear existing restrictions
    const { error: clearError } = await supabase
      .from("discount_restrictions")
      .delete()
      .eq("discount_id", id);

    if (clearError) {
      return { error: "Kunne ikke oppdatere brukerbegrensninger", data: null };
    }

    // Add new restrictions if any
    if (restrictedUserIds.length > 0) {
      const restrictions = restrictedUserIds.map((userId) => ({
        discount_id: id,
        profile_id: userId,
      }));

      const { error: restrictionsError } = await supabase
        .from("discount_restrictions")
        .insert(restrictions);

      if (restrictionsError) {
        console.error("Error adding restrictions:", restrictionsError);
        return {
          error: "Kunne ikke legge til brukerbegrensninger",
          data: null,
        };
      }
    }

    return discountResult;
  } catch (error) {
    console.error("Error updating discount with restrictions:", error);
    return { error: "Kunne ikke oppdatere rabattkode", data: null };
  }
}

/**
 * Get discount with restricted users
 */
export async function getDiscountWithRestrictions(discountId: string) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Du må være logget inn", data: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Du har ikke tilgang", data: null };
  }

  // Get the discount
  const { data: discount, error: discountError } = await supabase
    .from("discounts")
    .select("*")
    .eq("id", discountId)
    .single();

  if (discountError || !discount) {
    return { error: "Rabattkode ikke funnet", data: null };
  }

  // Get restricted users with their profile information
  const { data: restrictedUsers, error: restrictionsError } = await supabase
    .from("discount_restrictions")
    .select(`
      profile_id,
      profiles:profile_id (
        id,
        full_name,
        email,
        role
      )
    `)
    .eq("discount_id", discountId);

  if (restrictionsError) {
    return { error: "Kunne ikke hente brukerbegrensninger", data: null };
  }

  // Format the restricted users data
  const formattedRestrictedUsers = restrictedUsers?.map((restriction) => ({
    id: restriction.profiles.id,
    full_name: restriction.profiles.full_name,
    email: restriction.profiles.email,
    role: restriction.profiles.role,
  })) || [];

  return {
    data: {
      discount,
      restricted_users: formattedRestrictedUsers,
    },
    error: null,
  };
}

/**
 * Admin function - Delete discount
 */
export async function deleteDiscount(id: string) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Du må være logget inn", data: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return {
      error: "Du har ikke tilgang til å slette rabattkoder",
      data: null,
    };
  }

  return await supabase.from("discounts").delete().eq("id", id);
}

/**
 * Admin function - Get all discounts with usage statistics
 */
export async function getAllDiscounts({
  searchTerm,
  statusFilter,
  limit = 20,
}: {
  searchTerm?: string;
  statusFilter?: "all" | "active" | "inactive" | "expired";
  limit?: number;
} = {}) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Du må være logget inn", data: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Du har ikke tilgang til å se rabattkoder", data: null };
  }

  let query = supabase
    .from("discounts")
    .select(`
      *,
      discount_restrictions(count)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Apply search filter
  if (searchTerm) {
    query = query.or(
      `code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`,
    );
  }

  // Apply status filter
  if (statusFilter && statusFilter !== "all") {
    const now = new Date().toISOString();

    switch (statusFilter) {
      case "active":
        query = query.eq("is_active", true)
          .lte("valid_from", now)
          .or(`expires_at.is.null,expires_at.gte.${now}`);
        break;
      case "inactive":
        query = query.eq("is_active", false);
        break;
      case "expired":
        query = query.lt("expires_at", now);
        break;
    }
  }

  return await query;
}

/**
 * Get discount usage statistics for admin
 */
export async function getDiscountUsageStats(discountId: string) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Du må være logget inn", data: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Du har ikke tilgang", data: null };
  }

  // Get usage details with profile information
  return await supabase
    .from("discount_usage")
    .select(`
      *,
      profiles:profile_id (
        full_name,
        email
      ),
      bookings:booking_id (
        id,
        start_time
      )
    `)
    .eq("discount_id", discountId)
    .order("used_at", { ascending: false });
}

/**
 * Generate a unique discount code
 * Creates a 6-character uppercase alphanumeric code and ensures it's unique
 */
export async function generateDiscountCode(): Promise<
  { data: string | null; error: string | null }
> {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Du må være logget inn", data: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return {
      error: "Du har ikke tilgang til å generere rabattkoder",
      data: null,
    };
  }

  const characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate 6-character random code
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const { data: existingDiscount } = await supabase
      .from("discounts")
      .select("id")
      .eq("code", code)
      .single();

    if (!existingDiscount) {
      // Code is unique, return it
      return { data: code, error: null };
    }
  }

  // If we've exhausted all attempts, return an error
  return {
    error: "Kunne ikke generere en unik rabattkode. Prøv igjen.",
    data: null,
  };
}

/**
 * Search users for discount restriction combobox
 */
export async function searchUsers(filters: UserSearchFilters) {
  const supabase = await createClient();

  // Only search if there's a query with minimum length
  if (
    !filters.searchQuery ||
    filters.searchQuery.trim().length < (filters.minQueryLength || 2)
  ) {
    return { data: [], error: null };
  }

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Du må være logget inn", data: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Du har ikke tilgang", data: null };
  }

  const trimmedQuery = filters.searchQuery.trim().toLowerCase();

  // Search users with debounced query
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .or(`full_name.ilike.%${trimmedQuery}%,email.ilike.%${trimmedQuery}%`)
    .order("full_name", { ascending: true })
    .limit(filters.limit || 20);

  if (error) {
    return { error: error.message, data: null };
  }

  return { data: data || [], error: null };
}

/**
 * Get discount counts for admin dashboard tabs
 */
export async function getDiscountCounts() {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Du må være logget inn", data: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Du har ikke tilgang", data: null };
  }

  const { data: discounts, error } = await supabase
    .from("discounts")
    .select("id, is_active, valid_from, expires_at")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, data: null };
  }

  const now = new Date().toISOString();

  const counts = {
    all: discounts.length,
    active: discounts.filter((d) =>
      d.is_active &&
      new Date(d.valid_from) <= new Date(now) &&
      (!d.expires_at || new Date(d.expires_at) >= new Date(now))
    ).length,
    inactive: discounts.filter((d) => !d.is_active).length,
    expired:
      discounts.filter((d) =>
        d.expires_at && new Date(d.expires_at) < new Date(now)
      ).length,
  };

  return { data: counts, error: null };
}
