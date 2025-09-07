"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCartStore } from "@/stores/cart.store";
import { useBookingStore } from "@/stores/booking.store";
import { ArrowLeft, Clock, User, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookingStepper, OrderSummary } from "@/components/booking";
import { createBookingWithServices } from "@/server/booking/creation.actions";
import { getStylistDetails } from "@/server/profile.actions";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Spinner } from "@/components/ui/kibo-ui/spinner";
import {
  cartItemsToBookingItems,
  getBookingBreakdown,
  formatCurrency,
} from "@/lib/booking-calculations";
import { useAffiliateAttribution } from "@/hooks/use-affiliate-attribution";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export default function BookingPage() {
  const router = useRouter();
  const { items, getTotalItems, getTotalPrice, getCurrentStylist, clearCart } =
    useCartStore();
  const { bookingData, setBookingContext, setProcessingState, clearBooking } =
    useBookingStore();
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);
  const [stripeOnboardingError, setStripeOnboardingError] = useState<{
    show: boolean;
    stylistName?: string;
  }>({ show: false });
  const { user } = useAuth();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const currentStylist = getCurrentStylist();

  // Calculate total service duration
  const totalDurationMinutes = items.reduce((total, item) => {
    return total + item.service.duration_minutes * item.quantity;
  }, 0);

  // Calculate trial session information
  const hasTrialSession = items.some((item) => item.service.has_trial_session);
  const trialSessionPrice =
    items.find((item) => item.service.has_trial_session)?.service
      .trial_session_price || undefined;
  const trialSessionDurationMinutes =
    items.find((item) => item.service.has_trial_session)?.service
      .trial_session_duration_minutes || undefined;
  const trialSessionDescription =
    items.find((item) => item.service.has_trial_session)?.service
      .trial_session_description || undefined;
  const trialSession =
    items.find((item) => item.service.has_trial_session) || undefined;

  // Prepare cart items for affiliate hook
  const cartItems = items.map((item) => ({
    serviceId: item.service.id,
    quantity: item.quantity,
  }));

  // Use affiliate attribution hook
  const {
    discountAmount: affiliateDiscountAmount,
    affiliateCode,
    stylistName: affiliateStylistName,
    applicableServices,
    canAutoApply,
  } = useAffiliateAttribution({
    cartItems,
    userId: user?.id,
    enabled: cartItems.length > 0,
  });

  // Initialize booking context when component mounts or cart changes
  useEffect(() => {
    if (currentStylist && totalPrice && totalDurationMinutes) {
      setBookingContext({
        stylistId: currentStylist.id,
        serviceDurationMinutes: totalDurationMinutes,
        serviceAmountNOK: totalPrice,
      });
    }
  }, [currentStylist, totalPrice, totalDurationMinutes, setBookingContext]);

  // Fetch stylist details
  const {
    data: stylistDetails,
    isLoading: isLoadingStylistDetails,
    error: stylistDetailsError,
  } = useQuery({
    queryKey: ["stylistDetails", currentStylist?.id],
    queryFn: () => getStylistDetails(currentStylist!.id),
    enabled: !!currentStylist?.id,
  });

  // Handle booking completion
  const handleBookingComplete = async () => {
    if (!bookingData.startTime || !bookingData.endTime || !currentStylist) {
      toast.error("Manglende booking informasjon");
      return;
    }

    setProcessingState(true);

    try {
      // Extract service IDs from cart items
      const serviceIds = items.map((item) => item.service.id);

      // Prepare address data if customer location is selected
      let customerAddressData = undefined;
      let addressId = undefined;

      if (bookingData.location === "customer") {
        if (bookingData.customerAddressId) {
          // Using an existing address from the user's saved addresses
          addressId = bookingData.customerAddressId;
        } else if (bookingData.customerAddress) {
          // Fallback: Parse the address string if no address ID is provided
          const addressParts = bookingData.customerAddress
            .split(",")
            .map((part) => part.trim());
          customerAddressData = {
            streetAddress: addressParts[0] || bookingData.customerAddress,
            city: addressParts[1] || "Oslo", // Default to Oslo for now
            postalCode: addressParts[2] || "0000",
            country: "Norge",
            entryInstructions: "",
          };
        }
      }

      // Calculate total price including trial session and discount using common utilities
      const bookingItems = cartItemsToBookingItems(items);
      const trialSessionData =
        bookingData.wantsTrialSession && trialSessionPrice
          ? { price: trialSessionPrice }
          : null;
      const appliedDiscountData = bookingData.appliedDiscount
        ? {
            discountAmount: bookingData.appliedDiscount.discountAmount,
            code: bookingData.appliedDiscount.code,
          }
        : null;

      const breakdown = getBookingBreakdown({
        items: bookingItems,
        trialSession: trialSessionData,
        appliedDiscount: appliedDiscountData,
      });

      const totalPriceWithTrial = breakdown.finalTotal;
      const originalTotalPrice = breakdown.subtotalBeforeDiscount;

      // Create the booking
      const result = await createBookingWithServices({
        serviceIds,
        stylistId: currentStylist.id,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        location: bookingData.location,
        customerAddress: customerAddressData,
        customerAddressId: addressId,
        messageToStylist: bookingData.messageToStylist,
        discountCode: bookingData.appliedDiscount?.code,
        affiliateCode:
          canAutoApply && affiliateCode ? affiliateCode : undefined,
        totalPrice: totalPriceWithTrial,
        originalTotalPrice: originalTotalPrice,
        totalDurationMinutes,
        // Trial session parameters
        includeTrialSession: bookingData.wantsTrialSession || false,
        trialSessionStartTime: bookingData.trialSessionStartTime,
        trialSessionEndTime: bookingData.trialSessionEndTime,
        trialSessionPrice: trialSessionPrice,
        trialSessionDurationMinutes: trialSessionDurationMinutes,
      });

      if (result.error) {
        // Check if this is a Stripe onboarding error
        if (result.error === "stripe_onboarding_required") {
          setStripeOnboardingError({
            show: true,
            stylistName: currentStylist?.full_name ?? undefined,
          });
          // Scroll to top to show the alert
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        toast.error(result.error);
        return;
      }

      if (result.data) {
        // Redirect to payment page with client secret
        toast.success("Videresender til betaling...");

        if (!result.data.paymentIntentClientSecret) {
          toast.error("Betalingsintegrasjon feilet. Prøv igjen.");
          return;
        }

        const searchParams = new URLSearchParams({
          payment_intent: result.data.stripePaymentIntentId,
          client_secret: result.data.paymentIntentClientSecret,
          booking_id: result.data.booking.id,
        });

        // Set flag to prevent useEffect redirect and clear cart/booking
        setIsRedirectingToCheckout(true);
        clearCart();
        clearBooking();
        router.replace(`/checkout?${searchParams.toString()}`);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("En feil oppstod ved opprettelse av booking");
    } finally {
      setProcessingState(false);
    }
  };

  useEffect(() => {
    if (totalItems === 0 && !isRedirectingToCheckout) {
      router.push("/handlekurv");
    }
  }, [totalItems, router, isRedirectingToCheckout]);

  if (totalItems === 0 && !isRedirectingToCheckout) {
    return null;
  }

  console.log(stylistDetails?.data);

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <BlurFade duration={0.5} inView>
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake
            </Button>
            <h1 className="text-3xl font-bold">Booking</h1>
          </div>
        </BlurFade>

        {/* Stripe Onboarding Error Alert */}
        {stripeOnboardingError.show && (
          <BlurFade duration={0.5} inView>
            <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Booking kunne ikke fullføres.</strong>{" "}
                {stripeOnboardingError.stylistName} mangler betalingsoppsett og
                har blitt varslet om å fullføre dette. Du kan prøve å booke
                igjen senere når oppsettet er fullført.
              </AlertDescription>
            </Alert>
          </BlurFade>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Summary */}
            <BlurFade delay={0.1} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Sammendrag av tjenester
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentStylist && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">
                        Stylist
                      </h3>
                      <p className="font-semibold">
                        {currentStylist.full_name}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.service.id}
                        className="flex justify-between items-start py-2"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{item.service.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.service.duration_minutes} min
                            </span>
                            {item.quantity > 1 && (
                              <span>Antall: {item.quantity}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(item.service.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">
                        Total varighet: {Math.floor(totalDurationMinutes / 60)}t{" "}
                        {totalDurationMinutes % 60}min
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </BlurFade>

            {/* Booking Stepper */}
            {currentStylist && (
              <BlurFade delay={0.15} duration={0.5} inView>
                {isLoadingStylistDetails ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2">
                        <Spinner className="w-5 h-5" />
                        <span>Laster stylistdetaljer...</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : stylistDetailsError || !stylistDetails?.data ? (
                  <Card>
                    <CardContent className="py-8">
                      <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <AlertDescription className="text-red-800 dark:text-red-200">
                          Kunne ikke laste stylistdetaljer. Prøv å oppdatere
                          siden.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                ) : (
                  <BookingStepper
                    stylistId={currentStylist.id}
                    serviceDurationMinutes={totalDurationMinutes}
                    serviceAmountNOK={totalPrice}
                    stylistCanTravel={stylistDetails.data.can_travel ?? true}
                    stylistHasOwnPlace={
                      stylistDetails.data.has_own_place ?? true
                    }
                    hasTrialSession={hasTrialSession}
                    trialSessionPrice={trialSessionPrice}
                    trialSessionDurationMinutes={trialSessionDurationMinutes}
                    trialSessionDescription={trialSessionDescription}
                    cartItems={cartItems}
                    onComplete={handleBookingComplete}
                  />
                )}
              </BlurFade>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <BlurFade delay={0.2} duration={0.5} inView>
              <OrderSummary
                items={items}
                appliedDiscount={bookingData.appliedDiscount}
                className="sticky top-24"
                trialSession={
                  bookingData.wantsTrialSession && trialSession
                    ? {
                        price: trialSession.service.trial_session_price || 0,
                        currency: trialSession.service.currency,
                        title: trialSession.service.title,
                      }
                    : null
                }
              />
            </BlurFade>
          </div>
        </div>
      </div>
    </div>
  );
}
