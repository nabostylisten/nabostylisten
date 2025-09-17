/**
 * Batch Processing Utility for Migration Scripts
 *
 * This utility provides helpers for processing large datasets in batches to avoid:
 * - API rate limiting
 * - Database connection overload
 * - Memory exhaustion
 * - Timeout errors
 */

import type { MigrationLogger } from "./logger";

export interface BatchProcessorOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
  maxRetries?: number;
  baseRetryDelay?: number;
  progressCallback?: (
    current: number,
    total: number,
    batchNumber: number,
  ) => void;
}

export interface BatchResult<T> {
  successful: T[];
  failed: Array<{ item: unknown; error: string }>;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

/**
 * Process items in batches with retry logic and progress tracking
 */
export async function processBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchProcessorOptions = {},
  logger?: MigrationLogger,
): Promise<R[]> {
  const {
    batchSize = 10,
    delayBetweenBatches = 100,
    progressCallback,
  } = options;

  const results: R[] = [];
  const totalBatches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    if (logger) {
      logger.debug(
        `Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`,
      );
    }

    // Call progress callback if provided
    progressCallback?.(i + batch.length, items.length, batchNumber);

    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    // Small delay between batches to avoid overwhelming the API/database
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}

/**
 * Process items in batches with detailed error handling and result tracking
 */
export async function processBatchesWithResults<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchProcessorOptions = {},
  logger?: MigrationLogger,
): Promise<BatchResult<R>> {
  const {
    batchSize = 10,
    delayBetweenBatches = 100,
    progressCallback,
  } = options;

  const result: BatchResult<R> = {
    successful: [],
    failed: [],
    totalProcessed: 0,
    successCount: 0,
    errorCount: 0,
  };

  const totalBatches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    if (logger) {
      logger.debug(
        `Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`,
      );
    }

    // Call progress callback if provided
    progressCallback?.(i + batch.length, items.length, batchNumber);

    // Process each item in the batch individually to capture failures
    for (const item of batch) {
      try {
        const itemResult = await processor(item);
        result.successful.push(itemResult);
        result.successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : "Unknown error";
        result.failed.push({ item, error: errorMessage });
        result.errorCount++;

        if (logger) {
          logger.warn(`Item processing failed in batch ${batchNumber}`, error);
        }
      }
      result.totalProcessed++;
    }

    // Small delay between batches
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return result;
}

/**
 * Retry a function with exponential backoff and jitter for rate limiting
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: BatchProcessorOptions = {},
  logger?: MigrationLogger,
): Promise<T> {
  const {
    maxRetries = 3,
    baseRetryDelay = 1000,
  } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      // Only retry on specific errors (rate limits, temporary network issues)
      const shouldRetry = isRetriableError(error);
      const isLastAttempt = attempt === maxRetries;

      if (!shouldRetry || isLastAttempt) {
        throw error;
      }

      // Calculate exponential backoff with jitter
      const exponentialDelay = baseRetryDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
      const delay = exponentialDelay + jitter;

      if (logger) {
        logger.warn(
          `Retrying operation in ${Math.round(delay)}ms (attempt ${
            attempt + 1
          }/${maxRetries + 1})`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Should not reach here");
}

/**
 * Check if an error is retriable (rate limits, temporary network issues)
 */
function isRetriableError(error: unknown): boolean {
  if (error && typeof error === "object") {
    // Check for HTTP status codes that are retriable
    const errorObj = error as {
      statusCode?: number;
      status?: number;
      code?: number | string;
      message?: string;
    };
    const statusCode = errorObj.statusCode || errorObj.status || errorObj.code;

    // 429 = Rate Limit, 502/503/504 = Server errors, ECONNRESET = Connection reset
    if (
      statusCode === 429 || statusCode === 502 || statusCode === 503 ||
      statusCode === 504
    ) {
      return true;
    }

    // Check for network connection errors
    const message = errorObj.message || "";
    if (
      message.includes("ECONNRESET") || message.includes("ENOTFOUND") ||
      message.includes("ETIMEDOUT")
    ) {
      return true;
    }

    // Check for Supabase-specific rate limiting
    if (
      message.includes("rate limit") || message.includes("too many requests")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Utility for processing database inserts in optimized batches
 * Determines if operations can be batched based on operation type
 */
export interface DatabaseBatchOptions extends BatchProcessorOptions {
  canBatch?: boolean; // Whether the operation supports batch inserts
  fallbackToIndividual?: boolean; // Whether to fall back to individual operations on batch failure
}

/**
 * Process database operations in optimized batches
 * Some operations (like auth user creation) CANNOT be batched
 * Others (like profile/service creation) CAN be batched for better performance
 */
export async function processDatabaseBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchProcessor: (items: T[]) => Promise<R[]>,
  options: DatabaseBatchOptions = {},
  logger?: MigrationLogger,
): Promise<BatchResult<R>> {
  const {
    batchSize = 50,
    delayBetweenBatches = 200,
    canBatch = true,
    fallbackToIndividual = true,
    progressCallback,
  } = options;

  // If operation cannot be batched, use individual processing
  if (!canBatch) {
    return processBatchesWithResults(items, processor, {
      batchSize: Math.min(batchSize, 10), // Smaller batches for individual operations
      delayBetweenBatches,
      progressCallback,
    }, logger);
  }

  const result: BatchResult<R> = {
    successful: [],
    failed: [],
    totalProcessed: 0,
    successCount: 0,
    errorCount: 0,
  };

  const totalBatches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    if (logger) {
      logger.debug(
        `Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`,
      );
    }

    progressCallback?.(i + batch.length, items.length, batchNumber);

    try {
      // Try batch operation first
      const batchResults = await batchProcessor(batch);
      result.successful.push(...batchResults);
      result.successCount += batchResults.length;
      result.totalProcessed += batch.length;

      if (logger) {
        logger.debug(
          `Batch ${batchNumber} completed successfully: ${batchResults.length} items`,
        );
      }
    } catch (error) {
      if (logger) {
        logger.warn(
          `Batch ${batchNumber} failed, ${
            fallbackToIndividual
              ? "falling back to individual processing"
              : "skipping"
          }`,
          error,
        );
      }

      if (fallbackToIndividual) {
        // Fall back to individual processing for this batch
        for (const item of batch) {
          try {
            const itemResult = await processor(item);
            result.successful.push(itemResult);
            result.successCount++;
          } catch (itemError) {
            const errorMessage = itemError instanceof Error
              ? itemError.message
              : "Unknown error";
            result.failed.push({ item, error: errorMessage });
            result.errorCount++;
          }
          result.totalProcessed++;
        }
      } else {
        // Skip this entire batch
        const errorMessage = error instanceof Error
          ? error.message
          : "Unknown error";
        batch.forEach((item) => {
          result.failed.push({ item, error: errorMessage });
        });
        result.errorCount += batch.length;
        result.totalProcessed += batch.length;
      }
    }

    // Delay between batches
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return result;
}

export type OperationType =
  | "auth_users"
  | "profiles"
  | "services"
  | "addresses"
  | "bookings"
  | "payments"
  | "chats"
  | "reviews"
  | "default";

/**
 * Determine optimal batch size based on operation type and data size
 */
export function getOptimalBatchSize(
  operationType: OperationType,
  itemCount: number,
): number {
  // Different operations have different optimal batch sizes
  const batchSizes: Record<OperationType, number> = {
    "auth_users": 10, // Auth operations are expensive and rate-limited
    "profiles": 100, // Database inserts can be larger
    "services": 50, // Medium complexity
    "addresses": 75, // PostGIS operations are moderately expensive
    "bookings": 25, // Complex relationships
    "payments": 25, // Financial data, process carefully
    "chats": 100, // Simple records
    "reviews": 100, // Simple records
    "default": 50,
  };

  const baseBatchSize = batchSizes[operationType] || batchSizes.default;

  // Scale down for very small datasets to avoid overhead
  if (itemCount < 10) {
    return Math.min(baseBatchSize, itemCount);
  }

  // Scale down for very large datasets to avoid memory issues
  if (itemCount > 10000) {
    return Math.min(baseBatchSize, 25);
  }

  return baseBatchSize;
}
