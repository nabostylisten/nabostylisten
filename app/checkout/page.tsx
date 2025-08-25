"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { brandColors } from "@/lib/brand";
import { BlurFade } from "@/components/magicui/blur-fade";

// Load Stripe outside of component render to avoid recreating the Stripe object
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable"
  );
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

function PaymentForm({
  clientSecret: _clientSecret,
  bookingId,
}: {
  clientSecret: string;
  bookingId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?booking_id=${bookingId}`,
        receipt_email: email || undefined,
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`.
    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "En feil oppstod med kortet ditt.");
      } else {
        setMessage("En uventet feil oppstod. Prøv igjen.");
      }
      toast.error(error.message || "Betaling feilet");
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "accordion" as const,
  };

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-12">
      <div className="max-w-2xl mx-auto">
        <BlurFade duration={0.5} inView>
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake
            </Button>
            <h1 className="text-3xl font-bold">Betaling</h1>
          </div>
        </BlurFade>

        <BlurFade delay={0.1} duration={0.5} inView>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Fullfør betaling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email input */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-post (valgfritt)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@epost.no"
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Vi sender kvittering til denne e-posten hvis oppgitt
                  </p>
                </div>

                <Separator />

                {/* Payment Element */}
                <div className="space-y-2">
                  <Label>Betalingsmetode</Label>
                  <div className="border rounded-md p-1">
                    <PaymentElement
                      id="payment-element"
                      options={paymentElementOptions}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isLoading || !stripe || !elements}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Behandler betaling...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Betal nå
                    </>
                  )}
                </Button>

                {/* Error message */}
                {message && (
                  <div className="p-4 border border-destructive/20 bg-destructive/10 text-destructive rounded-md text-sm">
                    {message}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </BlurFade>

        {/* Security note */}
        <BlurFade delay={0.15} duration={0.5} inView>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Sikker betaling levert av Stripe</p>
            <p>Kortet ditt belastes ikke før tjenesten er bekreftet</p>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const clientSecret = searchParams.get("client_secret");
  const bookingId = searchParams.get("booking_id");

  useEffect(() => {
    if (!clientSecret || !bookingId) {
      toast.error("Manglende betalingsinformasjon");
      router.push("/handlekurv");
    }
  }, [clientSecret, bookingId, router]);

  if (!clientSecret || !bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Laster betalingsinformasjon...</p>
        </div>
      </div>
    );
  }

  // Stripe Elements appearance configuration using brand colors
  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: brandColors.light.primary,
      colorBackground: brandColors.light.background,
      colorText: brandColors.light.foreground,
      colorDanger: brandColors.light.destructive,
      fontFamily: "inherit",
      borderRadius: "6px",
    },
    rules: {
      ".Tab": {
        backgroundColor: brandColors.light.muted,
        border: `1px solid ${brandColors.light.muted}`,
      },
      ".Tab:hover": {
        backgroundColor: brandColors.light.secondary,
      },
      ".Tab--selected": {
        backgroundColor: brandColors.light.background,
        border: `1px solid ${brandColors.light.primary}`,
      },
    },
  };

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
      }}
    >
      <PaymentForm clientSecret={clientSecret} bookingId={bookingId} />
    </Elements>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Laster...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
