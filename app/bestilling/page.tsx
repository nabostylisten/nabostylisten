"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart.store";
import { ArrowLeft, Clock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookingStepper } from "@/components/booking";
import { createBookingWithServices } from "@/server/booking.actions";
import { toast } from "sonner";
import { BlurFade } from "@/components/magicui/blur-fade";

export default function BookingPage() {
  const router = useRouter();
  const { items, getTotalItems, getTotalPrice, getCurrentStylist, clearCart } =
    useCartStore();
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const currentStylist = getCurrentStylist();

  // Calculate total service duration
  const totalDurationMinutes = items.reduce((total, item) => {
    return total + item.service.duration_minutes * item.quantity;
  }, 0);

  // Handle booking completion
  const handleBookingComplete = async (bookingData: {
    startTime?: Date;
    endTime?: Date;
    location: "stylist" | "customer";
    customerAddress?: string;
    customerAddressId?: string;
    messageToStylist?: string;
    discountCode?: string;
  }) => {
    if (!bookingData.startTime || !bookingData.endTime || !currentStylist) {
      toast.error("Manglende booking informasjon");
      return;
    }

    setIsProcessingBooking(true);

    try {
      // Extract service IDs from cart items
      const serviceIds = items.map(item => item.service.id);

      // Prepare address data if customer location is selected
      let customerAddressData = undefined;
      let addressId = undefined;
      
      if (bookingData.location === "customer") {
        if (bookingData.customerAddressId) {
          // Using an existing address from the user's saved addresses
          addressId = bookingData.customerAddressId;
        } else if (bookingData.customerAddress) {
          // Fallback: Parse the address string if no address ID is provided
          const addressParts = bookingData.customerAddress.split(',').map(part => part.trim());
          customerAddressData = {
            streetAddress: addressParts[0] || bookingData.customerAddress,
            city: addressParts[1] || "Oslo", // Default to Oslo for now
            postalCode: addressParts[2] || "0000",
            country: "Norge",
            entryInstructions: "",
          };
        }
      }

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
        discountCode: bookingData.discountCode,
        totalPrice,
        totalDurationMinutes,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        // Clear the cart after successful booking
        clearCart();
        
        // TODO: Redirect to Stripe checkout or payment confirmation page
        // For now, redirect to a success page or bookings list
        toast.success("Booking opprettet! Videresender til betaling...");
        
        // TODO: Implement Stripe Elements or redirect to Stripe Checkout
        // router.push(`/checkout/${result.data.booking.id}?payment_intent=${result.data.stripePaymentIntentId}`);
        
        // Redirect to user's bookings page
        router.push(`/profiler/${result.data.booking.customer_id}/mine-bookinger`);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("En feil oppstod ved opprettelse av booking");
    } finally {
      setIsProcessingBooking(false);
    }
  };

  useEffect(() => {
    if (totalItems === 0) {
      router.push("/handlekurv");
    }
  }, [totalItems, router]);

  if (totalItems === 0) {
    return null;
  }

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
                    <p className="font-semibold">{currentStylist.full_name}</p>
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
                          {(item.service.price * item.quantity).toFixed(2)}{" "}
                          {item.service.currency}
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
                <BookingStepper
                stylistId={currentStylist.id}
                serviceDurationMinutes={totalDurationMinutes}
                stylistCanTravel={true} // TODO: Get from stylist details
                stylistHasOwnPlace={true} // TODO: Get from stylist details
                onComplete={handleBookingComplete}
                isProcessing={isProcessingBooking}
                />
              </BlurFade>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <BlurFade delay={0.2} duration={0.5} inView>
              <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Bestillingssammendrag</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.service.id}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {item.service.title}
                        {item.quantity > 1 && ` x${item.quantity}`}
                      </span>
                      <span>
                        {(item.service.price * item.quantity).toFixed(2)}{" "}
                        {item.service.currency}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{totalPrice.toFixed(2)} NOK</span>
                </div>
              </CardContent>
              </Card>
            </BlurFade>
          </div>
        </div>
      </div>
    </div>
  );
}
