"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
    createFlexibleStripePaymentIntent,
    updateStripePaymentIntentMetadata,
} from "@/lib/stripe/connect";
import type { DatabaseTables } from "@/types";

interface CreateBookingWithServicesInput {
    // Service details
    serviceIds: string[];
    stylistId: string;

    // Timing
    startTime: Date;
    endTime: Date;

    // Location
    location: "stylist" | "customer";
    customerAddress?: {
        streetAddress: string;
        city: string;
        postalCode: string;
        country: string;
        entryInstructions?: string;
    };
    customerAddressId?: string; // ID of existing address from addresses table

    // Trial session fields
    includeTrialSession?: boolean;
    trialSessionStartTime?: Date;
    trialSessionEndTime?: Date;
    trialSessionPrice?: number;
    trialSessionDurationMinutes?: number;

    // Additional details
    messageToStylist?: string;
    discountCode?: string;
    affiliateCode?: string; // For affiliate attribution

    // Calculated totals
    totalPrice: number; // Final price after discount
    originalTotalPrice: number; // Original price before discount
    totalDurationMinutes: number;
}

export async function createBookingWithServices(
    input: CreateBookingWithServicesInput,
) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return { error: "User not authenticated", data: null };
    }

    // Start a transaction-like operation
    try {
        // 1. Handle discount validation and affiliate attribution if provided
        let validatedDiscount: {
            id: string;
            discountPercentage?: number;
            discountAmountNOK?: number;
        } | null = null;

        let affiliateData: {
            id: string;
            commissionPercentage: number;
            discountAmount: number;
        } | null = null;

        // Handle both discount codes and affiliate codes
        if (input.discountCode || input.affiliateCode) {
            // Use enhanced validation that handles both discount and affiliate codes
            const { validateDiscountOrAffiliateCode, trackDiscountUsage } =
                await import(
                    "../discounts.actions"
                );

            // Prepare cart items for validation
            const cartItems = input.serviceIds.map((serviceId) => ({
                serviceId,
                quantity: 1, // Each service in booking is treated as quantity 1
            }));

            const validationResult = await validateDiscountOrAffiliateCode({
                code: input.discountCode || input.affiliateCode!,
                orderAmountNOK: input.originalTotalPrice,
                cartItems,
                profileId: user.id,
            });

            if (!validationResult.isValid || validationResult.error) {
                return {
                    error: validationResult.error ||
                        "Invalid discount or affiliate code",
                    data: null,
                };
            }

            if (
                validationResult.type === "discount" &&
                validationResult.discount
            ) {
                // Traditional discount code - track usage
                const trackingResult = await trackDiscountUsage({
                    discountId: validationResult.discount.id,
                    profileId: user.id,
                    bookingId: undefined, // Will be set later after booking creation
                });

                if (trackingResult.error) {
                    return { error: trackingResult.error, data: null };
                }

                validatedDiscount = {
                    id: validationResult.discount.id,
                    discountPercentage:
                        validationResult.discount.discount_percentage ||
                        undefined,
                    discountAmountNOK: validationResult.discountAmount ||
                        undefined,
                };
            } else if (
                validationResult.type === "affiliate" &&
                validationResult.affiliateInfo
            ) {
                // Affiliate code - set up commission tracking (no immediate usage tracking)
                affiliateData = {
                    id: validationResult.affiliateInfo.stylistId,
                    commissionPercentage:
                        validationResult.affiliateInfo.commissionPercentage,
                    discountAmount: validationResult.discountAmount,
                };
            }
        }

        // 2. Handle address for customer location
        let addressId: string | null = null;

        if (input.location === "customer") {
            if (input.customerAddressId) {
                // Use existing address ID
                addressId = input.customerAddressId;

                // Verify the address belongs to the user
                const { data: existingAddress, error: verifyError } =
                    await supabase
                        .from("addresses")
                        .select("id")
                        .eq("id", input.customerAddressId)
                        .eq("user_id", user.id)
                        .single();

                if (verifyError || !existingAddress) {
                    return { error: "Invalid address selected", data: null };
                }
            } else if (input.customerAddress) {
                // Get geometry coordinates from Mapbox
                const { getGeometryFromAddressComponents } = await import(
                    "@/lib/mapbox"
                );
                const geometry = await getGeometryFromAddressComponents({
                    streetAddress: input.customerAddress.streetAddress,
                    city: input.customerAddress.city,
                    postalCode: input.customerAddress.postalCode,
                    country: input.customerAddress.country,
                });

                // Create a new address with location coordinates
                const { data: address, error: addressError } = await supabase
                    .from("addresses")
                    .insert({
                        user_id: user.id,
                        street_address: input.customerAddress.streetAddress,
                        city: input.customerAddress.city,
                        postal_code: input.customerAddress.postalCode,
                        country: input.customerAddress.country,
                        entry_instructions:
                            input.customerAddress.entryInstructions,
                        nickname: "Booking Address",
                        is_primary: false,
                        // Add location coordinates from Mapbox
                        location: geometry
                            ? `POINT(${geometry[0]} ${geometry[1]})`
                            : null,
                    })
                    .select()
                    .single();

                if (addressError || !address) {
                    return { error: "Failed to create address", data: null };
                }

                addressId = address.id;
            }
        }

        // 3. Use the prices calculated by the frontend
        const finalPrice = input.totalPrice; // Final price after discount
        const originalPrice = input.originalTotalPrice; // Original price before discount
        const discountAmountNOK = (validatedDiscount?.discountAmountNOK || 0) +
            (affiliateData?.discountAmount || 0);

        // Calculate platform fee breakdown for payment processing
        const { calculatePlatformFee } = await import(
            "@/schemas/platform-config.schema"
        );

        const platformFeeBreakdown = calculatePlatformFee({
            totalAmountNOK: finalPrice,
            hasAffiliate: !!affiliateData,
        });

        // Get stylist details including verification status for pre-flight checks
        const { data: stylistDetails } = await supabase
            .from("stylist_details")
            .select("stripe_account_id, identity_verification_completed_at")
            .eq("profile_id", input.stylistId)
            .single();

        // CRITICAL: Pre-flight verification check
        // Only verified stylists should be able to receive bookings
        if (!stylistDetails?.identity_verification_completed_at) {
            // Notify the stylist about the verification requirement
            const { notifyStripeOnboardingRequired } = await import(
                "./notifications.actions"
            );

            // Get user profile for notification
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", user.id)
                .single();

            // Send notification to stylist about verification requirement (don't await to avoid blocking)
            notifyStripeOnboardingRequired({
                stylistId: input.stylistId,
                customerName: profile?.full_name || user.email || "Kunde",
            }).catch((error) => {
                console.error(
                    "Failed to send verification notification emails:",
                    error,
                );
            });

            return {
                error: "Denne stylisten har ikke fullført identitetsverifiseringen og kan ikke motta bestillinger ennå. Stylisten har fått en e-post med instruksjoner for å fullføre verifiseringen. Vennligst prøv igjen senere eller velg en annen stylist.",
                data: null,
            };
        }

        let stripePaymentIntentId: string | null = null;
        let paymentIntentClientSecret: string | null = null;
        let needsDestinationUpdate = false;

        // ALWAYS create payment intent, regardless of stylist onboarding status
        const paymentIntentResult = await createFlexibleStripePaymentIntent({
            totalAmountNOK: finalPrice,
            stylistStripeAccountId: stylistDetails?.stripe_account_id ||
                undefined,
            bookingId: `temp_${Date.now()}`, // Temporary ID, will be updated after booking creation
            customerId: user.id,
            stylistId: input.stylistId,
            hasAffiliate: !!affiliateData,
            discountAmountNOK: discountAmountNOK,
            discountCode: input.discountCode || input.affiliateCode,
        });

        if (paymentIntentResult.error || !paymentIntentResult.data) {
            return {
                error: paymentIntentResult.error ||
                    "Failed to create payment intent",
                data: null,
            };
        }

        stripePaymentIntentId = paymentIntentResult.data.paymentIntentId;
        paymentIntentClientSecret = paymentIntentResult.data.clientSecret;
        needsDestinationUpdate =
            paymentIntentResult.data.needsDestinationUpdate || false;

        // Log whether payment intent needs destination update
        if (needsDestinationUpdate) {
            console.log(
                "Payment intent created without destination - stylist needs to complete onboarding",
            );
        } else {
            console.log("Payment intent created with destination charges");
        }

        // Send notification emails if stylist needs to complete onboarding
        if (needsDestinationUpdate) {
            const { notifyStripeOnboardingRequired } = await import(
                "./notifications.actions"
            );

            // Get user profile for full name
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", user.id)
                .single();

            // Trigger notification emails in the background (don't await to avoid blocking user)
            // Send email to stylist and admin about missing Stripe setup
            notifyStripeOnboardingRequired({
                stylistId: input.stylistId,
                customerName: profile?.full_name || user.email || "Kunde",
            }).catch((error) => {
                console.error(
                    "Failed to send onboarding notification emails:",
                    error,
                );
            });
        }

        // 4. Create the booking
        const bookingData: DatabaseTables["bookings"]["Insert"] = {
            customer_id: user.id,
            stylist_id: input.stylistId,
            start_time: input.startTime.toISOString(),
            end_time: input.endTime.toISOString(),
            message_to_stylist: input.messageToStylist,
            status: "pending",
            address_id: addressId,
            discount_id: validatedDiscount?.id || null,
            discount_applied: discountAmountNOK,
            total_price: finalPrice,
            total_duration_minutes: input.totalDurationMinutes,
            stripe_payment_intent_id: stripePaymentIntentId,
            needs_destination_update: needsDestinationUpdate,
        };

        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .insert(bookingData)
            .select()
            .single();

        if (bookingError || !booking) {
            // TODO: Cancel Stripe PaymentIntent if booking creation fails
            // This should be implemented with proper error handling
            console.error(
                "Booking creation failed, PaymentIntent may need cleanup:",
                stripePaymentIntentId,
            );
            return { error: "Failed to create booking", data: null };
        }

        // Update PaymentIntent metadata with the real booking ID (only if we have a payment intent)
        if (stripePaymentIntentId) {
            const metadataUpdateResult =
                await updateStripePaymentIntentMetadata({
                    paymentIntentId: stripePaymentIntentId,
                    metadata: {
                        booking_id: booking.id,
                        customer_id: user.id,
                        stylist_id: input.stylistId,
                    },
                });

            if (metadataUpdateResult.error) {
                console.error(
                    "Failed to update PaymentIntent metadata:",
                    metadataUpdateResult.error,
                );
                // Don't fail the entire booking creation for metadata update failure
            }
        }

        // 5. Link services to the booking
        const bookingServices = input.serviceIds.map((serviceId) => ({
            booking_id: booking.id,
            service_id: serviceId,
        }));

        const { error: servicesError } = await supabase
            .from("booking_services")
            .insert(bookingServices);

        if (servicesError) {
            // Rollback: delete the booking
            await supabase.from("bookings").delete().eq("id", booking.id);
            // TODO: Cancel Stripe PaymentIntent
            console.error(
                "Service linking failed, PaymentIntent may need cleanup:",
                stripePaymentIntentId,
            );
            return { error: "Failed to link services to booking", data: null };
        }

        // Create trial session booking if requested
        if (
            input.includeTrialSession && input.trialSessionStartTime &&
            input.trialSessionEndTime
        ) {
            // Get service names to construct meaningful message
            const { data: services, error: servicesError } = await supabase
                .from("services")
                .select("title")
                .in("id", input.serviceIds);

            if (servicesError) {
                console.error("Failed to get services:", servicesError);
            }

            let trialMessage = `Prøvetime for hovedbooking ${booking.id}`;
            if (services && services.length > 0) {
                const firstService = services[0].title;
                if (services.length === 1) {
                    trialMessage =
                        `Prøvetime for hovedbooking "${firstService}"`;
                } else {
                    trialMessage =
                        `Prøvetime for hovedbooking "${firstService}" og ${
                            services.length - 1
                        } til`;
                }
            }

            const trialBookingData: DatabaseTables["bookings"]["Insert"] = {
                customer_id: user.id,
                stylist_id: input.stylistId,
                start_time: input.trialSessionStartTime.toISOString(),
                end_time: input.trialSessionEndTime.toISOString(),
                message_to_stylist: trialMessage,
                status: "pending",
                address_id: addressId, // Same location as main booking
                total_price: input.trialSessionPrice || 0,
                total_duration_minutes: input.trialSessionDurationMinutes || 0,
                is_trial_session: true,
                main_booking_id: booking.id, // Link to main booking
                discount_applied: 0, // Trial sessions don't have discounts
            };

            const { data: trialBookingResult, error: trialBookingError } =
                await supabase
                    .from("bookings")
                    .insert(trialBookingData)
                    .select()
                    .single();

            if (trialBookingError) {
                console.error(
                    "Trial booking creation failed:",
                    trialBookingError,
                );
                // Don't fail the entire booking for trial session failure, but log it
                // The main booking can proceed without trial session
            } else if (trialBookingResult) {
                // Link the same services to the trial booking
                const trialBookingServices = input.serviceIds.map((
                    serviceId,
                ) => ({
                    booking_id: trialBookingResult.id,
                    service_id: serviceId,
                }));

                const { error: trialServicesError } = await supabase
                    .from("booking_services")
                    .insert(trialBookingServices);

                if (trialServicesError) {
                    console.error(
                        "Trial booking service linking failed:",
                        trialServicesError,
                    );
                }

                // Update main booking with trial booking reference
                const { error: mainBookingUpdateError } = await supabase
                    .from("bookings")
                    .update({ trial_booking_id: trialBookingResult.id })
                    .eq("id", booking.id);

                if (mainBookingUpdateError) {
                    console.error(
                        "Failed to update main booking with trial reference:",
                        mainBookingUpdateError,
                    );
                }
            }
        }

        // 6. Create a chat for the booking
        const { error: chatError } = await supabase
            .from("chats")
            .insert({
                booking_id: booking.id,
            });

        if (chatError) {
            // Chat creation failure is not critical, log but don't fail the booking
            console.error("Failed to create chat for booking:", chatError);
        }

        // Always create payment record since we always have a payment intent now
        if (stripePaymentIntentId) {
            // Use service client for payment record creation to bypass RLS
            const serviceClient = createServiceClient();
            const { error: paymentError } = await serviceClient
                .from("payments")
                .insert({
                    booking_id: booking.id,
                    payment_intent_id: stripePaymentIntentId,
                    original_amount: originalPrice, // Original amount before discount in NOK
                    discount_amount: discountAmountNOK, // Discount amount in NOK
                    final_amount: finalPrice, // Final amount after discount in NOK
                    platform_fee: platformFeeBreakdown.platformFeeNOK, // Platform fee in NOK
                    stylist_payout: platformFeeBreakdown.stylistPayoutNOK, // Stylist payout in NOK
                    affiliate_commission:
                        platformFeeBreakdown.affiliateCommissionNOK || 0, // Affiliate commission in NOK
                    stripe_application_fee_amount: Math.round(
                        platformFeeBreakdown.platformFeeNOK * 100,
                    ), // Stripe application fee in øre (only this field needs øre for Stripe)
                    currency: "NOK",
                    status: "pending",
                    refunded_amount: 0, // Default to 0, will be updated when refunds occur
                    discount_code: input.discountCode || input.affiliateCode,
                    discount_percentage:
                        validatedDiscount?.discountPercentage ||
                        null,
                    discount_fixed_amount:
                        validatedDiscount?.discountAmountNOK ||
                        null, // Fixed discount amount in NOK
                    affiliate_id: affiliateData?.id || null,
                    affiliate_commission_percentage:
                        affiliateData?.commissionPercentage || null,
                    needs_destination_update: needsDestinationUpdate,
                });

            if (paymentError) {
                console.error("Failed to create payment record:", paymentError);
                // Don't fail the booking creation, but log the error
            }
        } else {
            // This should never happen now since we always create payment intent
            console.error("Unexpected: No payment intent ID after creation");
        }

        // Note: Customer will always go through payment flow now
        // No need for special "awaiting payment" emails to customer

        // Note: Normal booking request emails are sent after successful payment
        // via the sendPostPaymentEmails function called from checkout success

        return {
            data: {
                booking,
                stripePaymentIntentId,
                paymentIntentClientSecret,
                finalPrice: finalPrice,
                discountAmount: discountAmountNOK,
                platformFeeNOK: platformFeeBreakdown.platformFeeNOK,
                stylistPayoutNOK: platformFeeBreakdown.stylistPayoutNOK,
                affiliateCommissionNOK:
                    platformFeeBreakdown.affiliateCommissionNOK || 0,
                // Additional breakdown for transparency
                originalTotalAmountNOK: originalPrice,
                needsDestinationUpdate,
            },
            error: null,
        };
    } catch (error) {
        console.error("Error creating booking:", error);
        return { error: "An unexpected error occurred", data: null };
    }
}
