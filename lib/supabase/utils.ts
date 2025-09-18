import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export function getSupabaseAssetUrl(filename: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
  }

  return `${supabaseUrl}/storage/v1/object/public/assets/${filename}`;
}

export function getNabostylistenLogoUrl(format: "svg" | "png" = "png"): string {
  const filename = format === "svg"
    ? "nabostylisten_logo.svg"
    : "nabostylisten_logo.png";
  return getSupabaseAssetUrl(filename);
}

/**
 * Fetches all rows from a Supabase query by automatically handling pagination.
 * Bypasses the default 1000 row limit by fetching data in batches.
 *
 * @param queryBuilder - A function that returns a Supabase query builder
 * @param batchSize - Number of rows to fetch per batch (default: 1000)
 * @returns Promise with all rows combined
 *
 * @example
 * ```typescript
 * // Fetch all addresses
 * const { data, error } = await fetchAllRows((offset, limit) =>
 *   supabase
 *     .from('addresses')
 *     .select('*')
 *     .range(offset, offset + limit - 1)
 * );
 *
 * // Fetch all addresses with user data
 * const { data, error } = await fetchAllRows((offset, limit) =>
 *   supabase
 *     .from('addresses')
 *     .select(`
 *       *,
 *       profiles!inner(role, first_name, last_name, email)
 *     `)
 *     .not('location', 'is', null)
 *     .range(offset, offset + limit - 1)
 * );
 * ```
 */
export async function fetchAllRows<T>(
  queryBuilder: (
    offset: number,
    limit: number,
  ) => Promise<{ data: T[] | null; error: unknown }>,
  batchSize: number = 1000,
): Promise<{ data: T[]; error: string | null }> {
  const allRows: T[] = [];
  let offset = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      const { data, error } = await queryBuilder(offset, batchSize);

      if (error) {
        console.error("Error fetching batch:", error);
        return {
          data: [],
          error: error instanceof Error
            ? error.message
            : "Failed to fetch data",
        };
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      allRows.push(...(data as T[]));

      // If we got fewer rows than the batch size, we've reached the end
      if (data.length < batchSize) {
        hasMore = false;
      } else {
        offset += batchSize;
      }
    }

    return { data: allRows, error: null };
  } catch (error) {
    console.error("Error in fetchAllRows:", error);
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Fetches all rows from a Supabase RPC function by automatically handling pagination.
 * Only supports RPC functions that have been explicitly configured for pagination.
 *
 * @param supabase - Supabase client instance
 * @param rpcName - Name of the RPC function (must be in SupportedPaginatedRpc)
 * @param params - Parameters specific to the RPC function
 * @param batchSize - Number of rows to fetch per batch (default: 1000)
 * @returns Promise with all rows combined
 *
 * @example
 * ```typescript
 * const { data, error } = await fetchAllRowsFromRPC(
 *   supabase,
 *   'get_map_addresses',
 *   {}
 * );
 * ```
 *
 * To add support for a new RPC function:
 * 1. Add the function name to SupportedPaginatedRpc type
 * 2. Update the function in supabase/schemas/00-schema.sql to accept limit_param and offset_param
 * 3. Add a case to the createPaginatedParams switch statement
 */
export async function fetchAllRowsFromRPC<
  TRpcName extends SupportedPaginatedRpc,
  TReturn,
>(
  supabase: SupabaseClient<Database>,
  rpcName: TRpcName,
  params: GetRpcParams<TRpcName>,
  batchSize: number = 1000,
): Promise<{ data: TReturn[]; error: string | null }> {
  const allRows: TReturn[] = [];
  let offset = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      // Create the paginated parameters for the supported RPC function
      const paginatedParams = createPaginatedParams(
        rpcName,
        params,
        batchSize,
        offset,
      );

      const { data, error } = await supabase.rpc(
        rpcName,
        paginatedParams as GetRpcParams<TRpcName>,
      );

      if (error) {
        console.error("Error fetching RPC batch:", error);
        return { data: [], error: error.message || "Failed to fetch data" };
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      allRows.push(...(data as TReturn[]));

      // If we got fewer rows than the batch size, we've reached the end
      if (data.length < batchSize) {
        hasMore = false;
      } else {
        offset += batchSize;
      }
    }

    return { data: allRows, error: null };
  } catch (error) {
    console.error("Error in fetchAllRowsFromRPC:", error);
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Type helper to extract RPC function parameter types
 */
type GetRpcParams<TRpcName extends keyof Database["public"]["Functions"]> =
  Database["public"]["Functions"][TRpcName]["Args"];

/**
 * RPC functions that are currently supported by fetchAllRowsFromRPC
 * To add support for a new RPC function:
 * 1. Add the function name to this type
 * 2. Update the function in supabase/schemas/00-schema.sql to accept limit_param and offset_param
 * 3. Add a case to the switch statement below
 */
type SupportedPaginatedRpc = "get_map_addresses";

/**
 * Creates paginated parameters for supported RPC functions
 */
function createPaginatedParams<TRpcName extends SupportedPaginatedRpc>(
  rpcName: TRpcName,
  params: GetRpcParams<TRpcName>,
  batchSize: number,
  offset: number,
): GetRpcParams<TRpcName> & { limit_param: number; offset_param: number } {
  switch (rpcName) {
    case "get_map_addresses":
      return {
        ...params,
        limit_param: batchSize,
        offset_param: offset,
      };

    default:
      // Exhaustiveness check - TypeScript will error if we miss a case
      const _exhaustiveCheck = rpcName as never;
      throw new Error(
        `Unhandled paginated RPC function: ${String(_exhaustiveCheck)}`,
      );
  }
}
