import { Suspense } from "react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";

// Refresh page component that handles expired/invalid onboarding links
function RefreshPageContent() {
  // In a real implementation, you would:
  // 1. Get the user's Stripe account ID from the session/database
  // 2. Generate a new account link
  // 3. Redirect them to the new onboarding flow

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <BlurFade delay={0.1} duration={0.5} inView>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">Lenken har utløpt</CardTitle>
            <CardDescription>
              Vi trenger å opprette en ny lenke for deg
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Lenken du fulgte har utløpt eller er allerede brukt. 
                Dette skjer av sikkerhetsmessige årsaker.
              </p>
              
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">
                      Hva skjer nå?
                    </p>
                    <p className="text-blue-700 mt-1">
                      Kontakt oss så sender vi deg en ny lenke for å fullføre 
                      oppsettet av betalingsmottaket ditt.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/contact">
                  Kontakt oss
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/protected/dashboard">
                  Tilbake til dashboard
                </Link>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Lenker utløper etter noen minutter av sikkerhetshensyn.</p>
              <p>Vi beklager ulempen dette kan medføre.</p>
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
}

export default function StylistStripeRefreshPage() {
  return (
    <Suspense fallback={
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
    }>
      <RefreshPageContent />
    </Suspense>
  );
}