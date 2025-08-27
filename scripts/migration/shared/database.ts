/**
 * Database connection utilities for migration
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { MigrationLogger } from "./logger";

// Environment variables for database connections
interface DatabaseConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  dumpFilePath: string;
}

export class MigrationDatabase {
  private supabase: ReturnType<typeof createClient<Database>>;
  private config: DatabaseConfig;
  private logger: MigrationLogger;

  constructor(logger: MigrationLogger) {
    this.logger = logger;
    this.config = this.loadConfig();
    this.supabase = createClient<Database>(
      this.config.supabaseUrl,
      this.config.supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  private loadConfig(): DatabaseConfig {
    const requiredEnvVars = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      dumpFilePath: process.env.MYSQL_DUMP_PATH || "./nabostylisten_dump.sql",
    };

    // Validate environment variables
    const missing = Object.entries(requiredEnvVars)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_key, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`,
      );
    }

    return requiredEnvVars as DatabaseConfig;
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .select("count", { count: "exact", head: true });

      if (error) {
        this.logger.error("Database connection test failed", error);
        return false;
      }

      this.logger.success(
        `Database connection successful. Current profiles count: ${data || 0}`,
      );
      return true;
    } catch (error) {
      this.logger.error("Database connection test failed", error);
      return false;
    }
  }

  /**
   * Get current record counts for validation
   */
  async getCurrentCounts(): Promise<Record<string, number>> {
    const tables = [
      "profiles",
      "stylist_details",
      "user_preferences",
      "addresses",
      "services",
      "bookings",
      "payments",
      "chats",
      "chat_messages",
      "reviews",
      "media",
    ];

    const counts: Record<string, number> = {};

    for (const table of tables) {
      try {
        const { count, error } = await this.supabase
          .from(table as keyof Database["public"]["Tables"])
          .select("*", { count: "exact", head: true });

        if (error) {
          this.logger.warn(`Failed to get count for table ${table}`, error);
          counts[table] = -1; // Indicate error
        } else {
          counts[table] = count || 0;
        }
      } catch (error) {
        this.logger.warn(`Failed to get count for table ${table}`, error);
        counts[table] = -1;
      }
    }

    return counts;
  }

  /**
   * Create Supabase Auth user (bypasses normal signup flow)
   */
  async createAuthUser(userData: {
    email: string;
    password?: string;
    email_confirm?: boolean;
    user_metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; user_id?: string; error?: string }> {
    try {
      // Use the admin API to create user with confirmed email
      const { data, error } = await this.supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password || this.generateTempPassword(),
        email_confirm: userData.email_confirm ?? true, // Auto-confirm for migration
        user_metadata: userData.user_metadata || {},
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: "User creation returned no user data" };
      }

      return { success: true, user_id: data.user.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create profile record
   */
  async createProfile(
    profile: Database["public"]["Tables"]["profiles"]["Insert"],
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await this.supabase
        .from("profiles")
        .insert(profile);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create stylist details record
   */
  async createStylistDetails(
    stylistDetails: Database["public"]["Tables"]["stylist_details"]["Insert"],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from("stylist_details")
        .insert(stylistDetails);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create user preferences record
   */
  async createUserPreferences(
    preferences: Database["public"]["Tables"]["user_preferences"]["Insert"],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from("user_preferences")
        .insert(preferences);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Batch create multiple records with transaction-like behavior
   */
  async batchCreate(
    table: keyof Database["public"]["Tables"],
    records: Record<string, unknown>[],
    batchSize = 100,
  ): Promise<{ success: boolean; inserted: number; errors: string[] }> {
    const errors: string[] = [];
    let inserted = 0;

    // Process in batches to avoid overwhelming the database
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      try {
        const { error, data } = await this.supabase
          .from(table)
          .insert(batch as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          .select();

        if (error) {
          errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
        } else {
          inserted += data?.length || batch.length;
        }
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : "Unknown error";
        errors.push(`Batch ${i / batchSize + 1}: ${errorMessage}`);
      }

      // Add small delay between batches to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      success: errors.length === 0,
      inserted,
      errors,
    };
  }

  /**
   * Check if email already exists in auth.users
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });

      if (error) {
        this.logger.warn("Failed to check if email exists", error);
        return false;
      }

      return data.users.some((user) =>
        user.email?.toLowerCase() === email.toLowerCase()
      );
    } catch (error) {
      this.logger.warn("Failed to check if email exists", error);
      return false;
    }
  }

  /**
   * Generate temporary password for migrated users
   * Users will use OTP login, so password is not critical
   */
  private generateTempPassword(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return `migrated-${timestamp}-${random}`;
  }

  /**
   * Clean up test data (useful for development)
   */
  async cleanupTestData(): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Cleanup not allowed in production");
    }

    this.logger.warn("Cleaning up test migration data...");

    // Delete in reverse dependency order
    const tables = [
      "user_preferences",
      "stylist_details",
      "profiles",
    ];

    for (const table of tables) {
      try {
        const { error } = await this.supabase
          .from(table as keyof Database["public"]["Tables"])
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Keep system records

        if (error) {
          this.logger.warn(`Failed to cleanup table ${table}`, error);
        } else {
          this.logger.info(`Cleaned up table ${table}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to cleanup table ${table}`, error);
      }
    }
  }

  /**
   * Get Supabase client for direct queries
   */
  getClient(): ReturnType<typeof createClient<Database>> {
    return this.supabase;
  }

  /**
   * Get dump file path
   */
  getDumpFilePath(): string {
    return this.config.dumpFilePath;
  }

  /**
   * Create address record
   */
  async createAddress(
    address: Database["public"]["Tables"]["addresses"]["Insert"]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from("addresses")
        .insert(address);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update address primary flag
   */
  async updateAddressPrimary(
    addressId: string,
    isPrimary: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from("addresses")
        .update({ is_primary: isPrimary })
        .eq("id", addressId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get count of primary addresses
   */
  async getPrimaryAddressCount(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("addresses")
        .select("*", { count: "exact", head: true })
        .eq("is_primary", true);

      if (error) {
        this.logger.error('Failed to get primary address count', error);
        return -1;
      }

      return count || 0;
    } catch (error) {
      this.logger.error('Failed to get primary address count', error);
      return -1;
    }
  }

  /**
   * Get existing profile IDs from database
   */
  async getExistingProfileIds(profileIds?: string[]): Promise<string[]> {
    try {
      // If no specific IDs requested, get all profile IDs
      if (!profileIds || profileIds.length === 0) {
        const { data, error } = await this.supabase.from('profiles').select('id');
        
        if (error) {
          this.logger.error('Failed to get existing profile IDs', error);
          return [];
        }
        
        return data?.map(p => p.id) || [];
      }

      // For large numbers of IDs, chunk them to avoid URI too long error
      const chunkSize = 100;
      const allExistingIds: string[] = [];

      for (let i = 0; i < profileIds.length; i += chunkSize) {
        const chunk = profileIds.slice(i, i + chunkSize);
        
        const { data, error } = await this.supabase
          .from('profiles')
          .select('id')
          .in('id', chunk);
          
        if (error) {
          this.logger.error(`Failed to get existing profile IDs for chunk ${i}`, error);
          continue;
        }
        
        if (data) {
          allExistingIds.push(...data.map(p => p.id));
        }
      }
      
      return allExistingIds;
    } catch (error) {
      this.logger.error('Failed to get existing profile IDs', error);
      return [];
    }
  }

  /**
   * Create service category record
   */
  async createServiceCategory(
    category: Database["public"]["Tables"]["service_categories"]["Insert"]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from("service_categories")
        .insert(category);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get count of service categories
   */
  async getServiceCategoryCount(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("service_categories")
        .select("*", { count: "exact", head: true });

      if (error) {
        this.logger.error('Failed to get service category count', error);
        return -1;
      }

      return count || 0;
    } catch (error) {
      this.logger.error('Failed to get service category count', error);
      return -1;
    }
  }

  /**
   * Create service record
   */
  async createService(
    service: Database["public"]["Tables"]["services"]["Insert"]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from("services")
        .insert(service);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create service-category junction record
   */
  async createServiceCategoryJunction(
    junction: Database["public"]["Tables"]["service_service_categories"]["Insert"]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from("service_service_categories")
        .insert(junction);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get count of services
   */
  async getServiceCount(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("services")
        .select("*", { count: "exact", head: true });

      if (error) {
        this.logger.error('Failed to get service count', error);
        return -1;
      }

      return count || 0;
    } catch (error) {
      this.logger.error('Failed to get service count', error);
      return -1;
    }
  }
}
