/**
 * Zod schemas for platform configuration stored in the database
 * These schemas ensure type safety and consistency between database and application
 */

import { z } from "zod";

/**
 * Platform fees configuration schema
 * Stored in platform_config table with key 'platform_fees'
 */
export const PlatformFeesConfigSchema = z.object({
    defaultPlatformFeePercentage: z
        .number()
        .min(0)
        .max(1)
        .describe("Platform fee as decimal (0.20 = 20%)"),
    affiliate: z.object({
        defaultCommissionPercentage: z
            .number()
            .min(0)
            .max(1)
            .describe(
                "Affiliate commission as percentage of platform fee (0.20 = 20%)",
            ),
    }),
});

/**
 * Payment configuration schema
 * Stored in platform_config table with key 'payment_config'
 */
export const PaymentConfigSchema = z.object({
    defaultCurrency: z.literal("NOK"),
    captureHoursBeforeAppointment: z
        .number()
        .min(0)
        .describe("Hours before appointment to capture payment"),
    refunds: z.object({
        fullRefundHours: z
            .number()
            .min(0)
            .describe("Hours before appointment for full refund"),
        partialRefundHours: z
            .number()
            .min(0)
            .describe("Hours before appointment for partial refund"),
        partialRefundPercentage: z
            .number()
            .min(0)
            .max(1)
            .describe("Refund percentage for partial refunds (0.50 = 50%)"),
    }),
});

/**
 * Discount limits configuration schema
 * Stored in platform_config table with key 'discount_limits'
 */
export const DiscountLimitsConfigSchema = z.object({
    maxPercentageDiscount: z
        .number()
        .min(0)
        .max(1)
        .describe("Maximum discount percentage allowed (0.50 = 50%)"),
    maxFixedDiscountNOK: z
        .number()
        .min(0)
        .describe("Maximum fixed discount amount in NOK"),
});

/**
 * Complete platform config entry schema
 * This represents a single row in the platform_config table
 */
export const PlatformConfigEntrySchema = z.object({
    id: z.uuid(),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime(),
    created_by: z.uuid(),
    config_key: z.string(),
    config_value: z.unknown(), // Will be validated based on config_key
    description: z.string().nullable(),
    is_active: z.boolean(),
    environment: z.enum(["production", "staging", "development"]),
});

/**
 * Map of config keys to their respective schemas
 * Used to validate config_value based on config_key
 */
export const CONFIG_KEY_SCHEMAS = {
    platform_fees: PlatformFeesConfigSchema,
    payment_config: PaymentConfigSchema,
    discount_limits: DiscountLimitsConfigSchema,
} as const;

/**
 * Union type for all valid config keys
 */
export type ConfigKey = keyof typeof CONFIG_KEY_SCHEMAS;

/**
 * Helper function to validate config value based on key
 */
export function validateConfigValue(key: string, value: unknown) {
    const schema = CONFIG_KEY_SCHEMAS[key as ConfigKey];
    if (!schema) {
        throw new Error(`Unknown config key: ${key}`);
    }
    return schema.parse(value);
}

/**
 * Type-safe platform config entry with validated value
 */
export type ValidatedPlatformConfigEntry<K extends ConfigKey> =
    & Omit<
        z.infer<typeof PlatformConfigEntrySchema>,
        "config_value"
    >
    & {
        config_key: K;
        config_value: z.infer<typeof CONFIG_KEY_SCHEMAS[K]>;
    };

/**
 * Complete platform configuration combining all config entries
 */
export const CompletePlatformConfigSchema = z.object({
    fees: PlatformFeesConfigSchema,
    payment: PaymentConfigSchema,
    discounts: DiscountLimitsConfigSchema,
});

/**
 * Type exports for use in application
 */
export type PlatformFeesConfig = z.infer<typeof PlatformFeesConfigSchema>;
export type PaymentConfig = z.infer<typeof PaymentConfigSchema>;
export type DiscountLimitsConfig = z.infer<typeof DiscountLimitsConfigSchema>;
export type PlatformConfigEntry = z.infer<typeof PlatformConfigEntrySchema>;
export type CompletePlatformConfig = z.infer<
    typeof CompletePlatformConfigSchema
>;

/**
 * Default configuration values
 */
export const DEFAULT_PLATFORM_CONFIG: CompletePlatformConfig = {
    fees: {
        defaultPlatformFeePercentage: 0.20,
        affiliate: {
            defaultCommissionPercentage: 0.20,
        },
    },
    payment: {
        defaultCurrency: "NOK",
        captureHoursBeforeAppointment: 24,
        refunds: {
            fullRefundHours: 48,
            partialRefundHours: 24,
            partialRefundPercentage: 0.50,
        },
    },
    discounts: {
        maxPercentageDiscount: 0.50,
        maxFixedDiscountNOK: 5000,
    },
};

/**
 * Helper function to convert database entries to complete config
 */
export function entriesToConfig(
    entries: PlatformConfigEntry[],
): Partial<CompletePlatformConfig> {
    const config: Partial<CompletePlatformConfig> = {};

    for (const entry of entries) {
        if (!entry.is_active) continue;

        switch (entry.config_key) {
            case "platform_fees":
                config.fees = validateConfigValue(
                    entry.config_key,
                    entry.config_value,
                ) as PlatformFeesConfig;
                break;
            case "payment_config":
                config.payment = validateConfigValue(
                    entry.config_key,
                    entry.config_value,
                ) as PaymentConfig;
                break;
            case "discount_limits":
                config.discounts = validateConfigValue(
                    entry.config_key,
                    entry.config_value,
                ) as DiscountLimitsConfig;
                break;
        }
    }

    return config;
}

/**
 * Helper function to merge config with defaults
 */
export function mergeWithDefaults(
    partial: Partial<CompletePlatformConfig>,
): CompletePlatformConfig {
    return {
        fees: partial.fees || DEFAULT_PLATFORM_CONFIG.fees,
        payment: partial.payment || DEFAULT_PLATFORM_CONFIG.payment,
        discounts: partial.discounts || DEFAULT_PLATFORM_CONFIG.discounts,
    };
}

/**
 * Helper functions for fee calculations
 */
export const calculatePlatformFee = ({
    totalAmountNOK,
    hasAffiliate = false,
    affiliateCommissionPercentage =
        DEFAULT_PLATFORM_CONFIG.fees.affiliate.defaultCommissionPercentage,
}: {
    totalAmountNOK: number;
    hasAffiliate?: boolean;
    affiliateCommissionPercentage?: number;
}) => {
    const platformFeeNOK = totalAmountNOK *
        DEFAULT_PLATFORM_CONFIG.fees.defaultPlatformFeePercentage;

    let affiliateCommissionNOK = 0;
    let finalPlatformFeeNOK = platformFeeNOK;

    if (hasAffiliate) {
        // Calculate affiliate commission as percentage of platform fee
        affiliateCommissionNOK = platformFeeNOK * affiliateCommissionPercentage;

        // Reduce platform fee by affiliate commission
        finalPlatformFeeNOK = platformFeeNOK - affiliateCommissionNOK;
    }

    const stylistPayoutNOK = totalAmountNOK - platformFeeNOK;

    return {
        totalAmountNOK,
        platformFeeNOK: finalPlatformFeeNOK,
        stylistPayoutNOK,
        affiliateCommissionNOK,
        // Breakdown for transparency
        originalPlatformFeeNOK: platformFeeNOK,
    };
};

/**
 * Calculate discount amount based on discount configuration
 */
export const calculateDiscountAmount = ({
    totalAmountNOK,
    discountPercentage,
    discountAmountNOK,
}: {
    totalAmountNOK: number;
    discountPercentage?: number;
    discountAmountNOK?: number;
}) => {
    if (discountPercentage !== undefined) {
        const calculatedDiscountNOK = totalAmountNOK * discountPercentage;
        return Math.min(
            calculatedDiscountNOK,
            totalAmountNOK *
                DEFAULT_PLATFORM_CONFIG.discounts.maxPercentageDiscount,
        );
    }

    if (discountAmountNOK !== undefined) {
        return Math.min(
            discountAmountNOK,
            Math.min(
                DEFAULT_PLATFORM_CONFIG.discounts.maxFixedDiscountNOK,
                totalAmountNOK, // Can't discount more than total amount
            ),
        );
    }

    return 0;
};

/**
 * Type definitions for configuration
 */
export type PlatformConfig = typeof DEFAULT_PLATFORM_CONFIG;
export type FeeCalculationResult = ReturnType<typeof calculatePlatformFee>;
