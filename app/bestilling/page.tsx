"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart.store";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
              </CardContent>
            </Card>

            {/* Availability Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Velg tid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Arbeid pågår</h3>
                  <p className="text-muted-foreground mb-6">
                    Vi jobber med å implementere kalenderbooking-funksjonaliteten. 
                    Snart vil du kunne velge ledig tid direkte fra stylistens kalender.
                  </p>
                  <div className="bg-muted rounded-lg p-4 text-sm">
                    <p className="font-medium mb-2">Kommende funksjoner:</p>
                    <ul className="text-left space-y-1 text-muted-foreground">
                      <li>• Sanntids tilgjengelighet</li>
                      <li>• Kalendervisning med ledige tider</li>
                      <li>• Automatisk bekreftelse</li>
                      <li>• Påminnelser via e-post og SMS</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                
                <div className="space-y-3 pt-4">
                  <Button className="w-full" disabled>
                    Fortsett til betaling
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Betalingsfunksjonalitet kommer når kalenderbooking er klar
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Hvordan det fungerer
                  </p>
                  <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                    <li>1. Velg ønsket tidspunkt</li>
                    <li>2. Bekreft booking og betal</li>
                    <li>3. Motta bekreftelse på e-post</li>
                    <li>4. Chat med stylist ved behov</li>
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