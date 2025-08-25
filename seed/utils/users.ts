import type { SeedClient, usersScalars, usersScalars } from "@snaplet/seed";
import { addMinutes, subDays } from "date-fns";
import { AuthUser, generateToken, seedPasswordToEncrypted } from "./shared";

// Define test users - more stylists across Norway's main cities
export const testUsersData: AuthUser[] = [
  {
    email: "admin@nabostylisten.no",
    full_name: "Admin User",
    role: "admin",
    phone_number: "+4712345678",
  },
  // Oslo stylists (2)
  {
    email: "maria.hansen@example.com",
    full_name: "Maria Hansen",
    role: "stylist",
    phone_number: "+4790123456",
  },
  {
    email: "sophia.larsen@example.com",
    full_name: "Sophia Larsen",
    role: "stylist",
    phone_number: "+4792345678",
  },
  // Bergen stylists (2)
  {
    email: "emma.nilsen@example.com",
    full_name: "Emma Nilsen",
    role: "stylist",
    phone_number: "+4791234567",
  },
  {
    email: "lisa.berg@example.com",
    full_name: "Lisa Berg",
    role: "stylist",
    phone_number: "+4795123456",
  },
  // Trondheim stylists (2)
  {
    email: "anna.johansen@example.com",
    full_name: "Anna Johansen",
    role: "stylist",
    phone_number: "+4796234567",
  },
  {
    email: "ingrid.solberg@example.com",
    full_name: "Ingrid Solberg",
    role: "stylist",
    phone_number: "+4797345678",
  },
  // Stavanger stylists (2)
  {
    email: "camilla.eriksen@example.com",
    full_name: "Camilla Eriksen",
    role: "stylist",
    phone_number: "+4798456789",
  },
  {
    email: "thea.andersen@example.com",
    full_name: "Thea Andersen",
    role: "stylist",
    phone_number: "+4799567890",
  },
  // Kristiansand stylists (2)
  {
    email: "marte.kristiansen@example.com",
    full_name: "Marte Kristiansen",
    role: "stylist",
    phone_number: "+4790678901",
  },
  {
    email: "sara.pedersen@example.com",
    full_name: "Sara Pedersen",
    role: "stylist",
    phone_number: "+4791789012",
  },
  // Customers
  {
    email: "kari.nordmann@example.com",
    full_name: "Kari Nordmann",
    role: "customer",
    phone_number: "+4793456789",
  },
  {
    email: "ole.hansen@example.com",
    full_name: "Ole Hansen",
    role: "customer",
    phone_number: "+4794567890",
  },
  {
    email: "per.jensen@example.com",
    full_name: "Per Jensen",
    role: "customer",
    phone_number: "+4792890123",
  },
  {
    email: "anne.olsen@example.com",
    full_name: "Anne Olsen",
    role: "customer",
    phone_number: "+4793901234",
  },
];

// Helper function to create auth user with common fields
function createAuthUserWithSupabaseMetadata(user: AuthUser) {
  const encryptedPassword = seedPasswordToEncrypted["demo-password"];
  const now = new Date();
  const createdAt = subDays(now, 30); // Created 30 days ago
  const confirmedAt = addMinutes(createdAt, 5); // Confirmed 5 minutes after creation
  const lastSignInAt = subDays(now, 1); // Last signed in yesterday

  return {
    email: user.email,
    instance_id: "00000000-0000-0000-0000-000000000000",
    created_at: createdAt,
    updated_at: lastSignInAt,
    invited_at: null,
    confirmation_token: generateToken(),
    confirmation_sent_at: null,
    recovery_token: generateToken(),
    recovery_sent_at: createdAt, // Set to creation time
    email_change_token_new: generateToken(),
    email_change: generateToken(),
    email_change_sent_at: null,
    email_confirmed_at: confirmedAt,
    confirmed_at: confirmedAt,
    last_sign_in_at: lastSignInAt,
    phone: null,
    phone_confirmed_at: null,
    phone_change: generateToken(),
    phone_change_token: generateToken(),
    phone_change_sent_at: null,
    email_change_token_current: generateToken(),
    email_change_confirm_status: 0,
    reauthentication_token: generateToken(),
    reauthentication_sent_at: null,
    is_sso_user: false,
    deleted_at: null, // CRITICAL: User is NOT deleted
    is_anonymous: false,
    is_super_admin: null, // Not super admin
    encrypted_password: encryptedPassword,
    banned_until: null,
    aud: "authenticated" as const,
    role: "authenticated" as const,
    raw_app_meta_data: {
      provider: "email",
      providers: ["email"],
    },
    raw_user_meta_data: {
      sub: "", // Will be set by Supabase
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone_number: user.phone_number,
      email_verified: true,
      phone_verified: false,
    },
  };
}

/**
 * Creates test users with proper Supabase authentication setup
 * Profiles will be created automatically by database trigger
 */
export async function createTestUsersWithAuth(seed: SeedClient) {
  console.log("-- Creating test users with authentication setup...");

  // Create users with proper auth setup - profiles will be created automatically by trigger
  const { users: allUsers } = await seed.users(
    testUsersData.map(createAuthUserWithSupabaseMetadata),
  );

  return allUsers;
}

/**
 * Creates email identities for all users for Supabase authentication
 */

export async function createUserEmailIdentities(
  seed: SeedClient,
  users: usersScalars[],
) {
  console.log("-- Creating email identities for users...");

  await seed.identities(
    users.map((user) => ({
      user_id: user.id,
      provider_id: user.id,
      provider: "email",
      identity_data: {
        sub: user.id,
        email: user.email,
      },
      last_sign_in_at: new Date(),
    })),
  );
}

/**
 * Separates users by role for easier reference in other seed functions
 */
export function separateUsersByRole(allUsers: usersScalars[]) {
  const stylistUsers = allUsers.slice(1, 11); // All 10 stylists (skip admin)
  const customerUsers = allUsers.slice(11, 15); // All 4 customers

  return { stylistUsers, customerUsers };
}
