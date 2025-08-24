import { Suspense } from "react";
import { BlurFade } from "@/components/magicui/blur-fade";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

// Return page component that handles the redirect from Stripe onboarding
function ReturnPageContent() {
  // In a real implementation, you would:
  // 1. Get the account ID from the URL params or user session
  // 2. Check the account status with Stripe API
  // 3. Show appropriate success/pending messages
  // 4. Actually put in correct links to go to your personal profile page and the my services page

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <BlurFade delay={0.1} duration={0.5} inView>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Velkommen tilbake!</CardTitle>
            <CardDescription>
              Du har fullført Stripe-konfigurasjonen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Vi sjekker statusen på kontoen din. Dette kan ta noen minutter.
              </p>

              <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">
                      Kontoverifisering pågår
                    </p>
                    <p className="text-amber-700 mt-1">
                      Du vil motta en e-post når kontoen din er klar til bruk.
                      Inntil da kan du begynne å sette opp tjenestene dine.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/protected/dashboard">Gå til dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/protected/services">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Opprett tjenester
                </Link>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Har du spørsmål?{" "}
              <Link
                href="/kontakt"
                target="_blank"
                className="text-primary hover:underline"
              >
                Kontakt oss
              </Link>
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
}

export default function StylistStripeReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-2xl mx-auto py-12">
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Laster...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ReturnPageContent />
    </Suspense>
  );
}
