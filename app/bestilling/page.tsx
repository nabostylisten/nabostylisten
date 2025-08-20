"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart.store";
import { ArrowLeft, Clock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BookingStepper } from "@/components/booking";

export default function BookingPage() {
  const router = useRouter();
  const { 
    items, 
    getTotalItems, 
    getTotalPrice,
    getCurrentStylist 
  } = useCartStore();
  
  
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const currentStylist = getCurrentStylist();
  
  // Calculate total service duration
  const totalDurationMinutes = items.reduce((total, item) => {
    return total + (item.service.duration_minutes * item.quantity);
  }, 0);

  // Handle booking completion
  const handleBookingComplete = (bookingData: {
    startTime?: Date;
    endTime?: Date;
    location: "stylist" | "customer";
    customerAddress?: string;
    messageToStylist?: string;
    discountCode?: string;
  }) => {
    console.log("Booking completed:", bookingData);
    // TODO: Process booking data and redirect to payment/confirmation
  };

  useEffect(() => {
    if (totalItems === 0) {
      router.push('/handlekurv');
    }
  }, [totalItems, router]);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake
          </Button>
          <h1 className="text-3xl font-bold">Booking</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Summary */}
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
                    <div key={item.service.id} className="flex justify-between items-start py-2">
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
                          {(item.service.price * item.quantity).toFixed(2)} {item.service.currency}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      Total varighet: {Math.floor(totalDurationMinutes / 60)}t {totalDurationMinutes % 60}min
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Stepper */}
            {currentStylist && (
              <BookingStepper
                stylistId={currentStylist.id}
                serviceDurationMinutes={totalDurationMinutes}
                stylistCanTravel={true} // TODO: Get from stylist details
                stylistHasOwnPlace={true} // TODO: Get from stylist details
                onComplete={handleBookingComplete}
              />
            )}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Bestillingssammendrag</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.service.id} className="flex justify-between text-sm">
                      <span>
                        {item.service.title}
                        {item.quantity > 1 && ` x${item.quantity}`}
                      </span>
                      <span>
                        {(item.service.price * item.quantity).toFixed(2)} {item.service.currency}
                      </span>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{totalPrice.toFixed(2)} NOK</span>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Booking prosess
                  </p>
                  <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                    <li>• Velg ønsket tidspunkt</li>
                    <li>• Bestem lokasjon for tjenesten</li>
                    <li>• Legg til melding og rabattkode</li>
                    <li>• Fullfør betaling</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}