"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
    createStripePaymentIntent,
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
            const { validateDiscountOrAffiliateCode, trackDiscountUsage } = await import(
                "../discounts.actions"
            );

            // Prepare cart items for validation
            const cartItems = input.serviceIds.map(serviceId => ({
                serviceId,
                quantity: 1 // Each service in booking is treated as quantity 1
            }));

            const validationResult = await validateDiscountOrAffiliateCode({
                code: input.discountCode || input.affiliateCode!,
                orderAmountNOK: input.originalTotalPrice,
                cartItems,
                profileId: user.id,
            });

            if (!validationResult.isValid || validationResult.error) {
                return {
                    error: validationResult.error || "Invalid discount or affiliate code",
                    data: null,
                };
            }

            if (validationResult.type === 'discount' && validationResult.discount) {
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
                    discountPercentage: validationResult.discount.discount_percentage || undefined,
                    discountAmountNOK: validationResult.discountAmount || undefined,
                };
            } else if (validationResult.type === 'affiliate' && validationResult.affiliateInfo) {
                // Affiliate code - set up commission tracking (no immediate usage tracking)
                affiliateData = {
                    id: validationResult.affiliateInfo.stylistId,
                    commissionPercentage: validationResult.affiliateInfo.commissionPercentage,
                    discountAmount: validationResult.discountAmount
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
        const discountAmountNOK = (validatedDiscount?.discountAmountNOK || 0) + (affiliateData?.discountAmount || 0);

        // Calculate platform fee breakdown for payment processing
        const { calculatePlatformFee } = await import(
            "@/schemas/platform-config.schema"
        );

        const platformFeeBreakdown = calculatePlatformFee({
            totalAmountNOK: finalPrice,
            hasAffiliate: !!affiliateData,
        });

        // Get stylist Stripe account ID for payment processing
        const { data: stylistDetails, error: stylistError } = await supabase
            .from("stylist_details")
            .select("stripe_account_id")
            .eq("profile_id", input.stylistId)
            .single();

        let stripePaymentIntentId: string | null = null;
        let paymentIntentClientSecret: string | null = null;
        let awaitingPaymentSetup = false;

        // Check if stylist has Stripe account set up
        if (!stylistError && stylistDetails?.stripe_account_id) {
            // Stylist has Stripe setup, proceed with payment intent creation
            const paymentIntentResult = await createStripePaymentIntent({
                totalAmountNOK: finalPrice,
                stylistStripeAccountId: stylistDetails.stripe_account_id,
                bookingId: `temp_${Date.now()}`, // Temporary ID, will be updated after booking creation
                customerId: user.id,
                stylistId: input.stylistId,
                hasAffiliate: !!affiliateData,
                discountAmountNOK: discountAmountNOK,
                discountCode: input.discountCode || input.affiliateCode,
            });

            if (paymentIntentResult.error || !paymentIntentResult.data) {
                // Check if this is a Stripe onboarding error
                const isOnboardingError =
                    paymentIntentResult.error?.includes("transfers") ||
                    paymentIntentResult.error?.includes("capabilities") ||
                    paymentIntentResult.error?.includes("crypto_transfers") ||
                    paymentIntentResult.error?.includes("legacy_payments");

                if (isOnboardingError) {
                    // Even if there's an onboarding error, allow booking creation
                    console.log("Stripe onboarding incomplete, creating booking without payment intent");
                    awaitingPaymentSetup = true;
                } else {
                    // This is a different error, fail the booking
                    return {
                        error: paymentIntentResult.error ||
                            "Failed to create payment intent",
                        data: null,
                    };
                }
            } else {
                stripePaymentIntentId = paymentIntentResult.data.paymentIntentId;
                paymentIntentClientSecret = paymentIntentResult.data.clientSecret;
            }
        } else {
            // Stylist doesn't have Stripe setup, create booking without payment intent
            console.log("Stylist has not completed Stripe onboarding, creating booking without payment intent");
            awaitingPaymentSetup = true;
        }

        // Send notification emails if awaiting payment setup
        if (awaitingPaymentSetup) {
            const { notifyStripeOnboardingRequired } = await import("./notifications.actions");
            
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
            awaiting_payment_setup: awaitingPaymentSetup,
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
            const metadataUpdateResult = await updateStripePaymentIntentMetadata({
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

        // Create comprehensive payment record only if we have a payment intent
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
                    discount_percentage: validatedDiscount?.discountPercentage ||
                        null,
                    discount_fixed_amount: validatedDiscount?.discountAmountNOK ||
                        null, // Fixed discount amount in NOK
                    affiliate_id: affiliateData?.id || null,
                    affiliate_commission_percentage: affiliateData?.commissionPercentage || null,
                });

            if (paymentError) {
                console.error("Failed to create payment record:", paymentError);
                // Don't fail the booking creation, but log the error
            }
        } else {
            console.log("No payment intent created - booking is awaiting stylist payment setup");
        }

        // Send customer email notification if booking is awaiting payment setup
        if (awaitingPaymentSetup && booking) {
            const { sendBookingAwaitingPaymentEmails } = await import("./notifications.actions");
            
            // Get user profile for full name
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", user.id)
                .single();
            
            // Send email to customer about booking awaiting payment
            sendBookingAwaitingPaymentEmails({
                bookingId: booking.id,
                customerEmail: user.email || "",
                customerName: profile?.full_name || user.email || "Kunde",
                customerProfileId: user.id,
            }).catch((error) => {
                console.error(
                    "Failed to send customer awaiting payment email:",
                    error,
                );
            });
        }

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
                awaitingPaymentSetup,
            },
            error: null,
        };
    } catch (error) {
        console.error("Error creating booking:", error);
        return { error: "An unexpected error occurred", data: null };
    }
}