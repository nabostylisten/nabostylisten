"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

// TODO: This page will handle Stripe checkout
// 1. Load the booking details from the database
// 2. Initialize Stripe Elements or redirect to Stripe Checkout
// 3. Handle payment confirmation
// 4. Update booking status to 'confirmed' after successful payment
// 5. Show success message and redirect to booking details page

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake
          </Button>
          <h1 className="text-3xl font-bold">Betaling</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Fullfør betaling
            </CardTitle>
            <CardDescription>
              Booking ID: {bookingId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                TODO: Stripe checkout vil bli implementert her
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• Stripe Elements for kortinformasjon</li>
                <li>• 3D Secure autentisering</li>
                <li>• Automatisk capture 24 timer før timen</li>
                <li>• Refusjon ved kansellering 24+ timer før</li>
              </ul>
            </div>

            {/* TODO: Replace with actual Stripe Elements */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <label className="text-sm font-medium">Kortnummer</label>
                <div className="mt-2 h-10 bg-muted rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <label className="text-sm font-medium">Utløpsdato</label>
                  <div className="mt-2 h-10 bg-muted rounded" />
                </div>
                <div className="border rounded-lg p-4">
                  <label className="text-sm font-medium">CVC</label>
                  <div className="mt-2 h-10 bg-muted rounded" />
                </div>
              </div>
            </div>

            <Button className="w-full" disabled>
              Betal (kommer snart)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}