# Stripe Identity Verification Integration Plan

Based on the Stripe docs and preference to keep minimal state in the application, this document outlines a simplified approach using the **redirect flow** for stylist identity verification.

## Overview

This integration adds identity verification as part of stylist onboarding, using Stripe's hosted verification pages to minimize complexity while ensuring compliance requirements are met.

## Simplified Identity Verification Integration

### 1. Minimal Database Changes

**File**: New migration in `supabase/migrations/`

Add just two fields to `stylist_details`:

```sql
ALTER TABLE public.stylist_details
ADD COLUMN stripe_verification_session_id text,
ADD COLUMN identity_verification_completed_at timestamptz;
```

### 2. Simple Onboarding Status System

**File**: `lib/stylist-onboarding-status.ts`

Instead of complex state tracking, use a simple function:

```typescript
export function getStylistOnboardingStatus(
  stripeAccountStatus: any,
  hasVerificationSession: boolean,
  verificationCompletedAt: string | null
) {
  // Basic Stripe checks first
  if (!stripeAccountStatus) return "not_started";
  if (!stripeAccountStatus.charges_enabled) return "charges_pending";
  if (!stripeAccountStatus.payouts_enabled) return "payouts_pending";

  // Identity verification check
  if (!hasVerificationSession) return "identity_verification_required";
  if (!verificationCompletedAt) return "identity_verification_pending";

  return "fully_verified";
}

export function canCreateServices(
  stripeAccountStatus: any,
  verificationCompletedAt: string | null
): boolean {
  const status = getStylistOnboardingStatus(
    stripeAccountStatus,
    !!verificationCompletedAt,
    verificationCompletedAt
  );

  return status === "fully_verified";
}
```

### 3. Stripe Identity Integration

**File**: Extend `lib/stripe/connect.ts`

```typescript
export async function createIdentityVerificationSession({
  profileId,
  email,
  returnUrl,
}: {
  profileId: string;
  email: string;
  returnUrl: string;
}) {
  try {
    const verificationSession =
      await stripe.identity.verificationSessions.create({
        type: "document",
        provided_details: {
          email,
        },
        return_url: returnUrl,
        metadata: {
          profile_id: profileId,
        },
      });

    return {
      data: {
        sessionId: verificationSession.id,
        url: verificationSession.url,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error creating identity verification session:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create verification session",
    };
  }
}

export async function getIdentityVerificationSessionStatus({
  sessionId,
}: {
  sessionId: string;
}) {
  try {
    const session =
      await stripe.identity.verificationSessions.retrieve(sessionId);

    return {
      data: {
        id: session.id,
        status: session.status,
        verified_outputs: session.verified_outputs,
        last_error: session.last_error,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error retrieving identity verification session:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get verification status",
    };
  }
}
```

**File**: Extend `server/stripe.actions.ts`

```typescript
export async function createIdentityVerificationForCurrentUser() {
  const supabase = await createClient();

  try {
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: "Du må være logget inn for å starte identitetsverifisering.",
      };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { data: null, error: "Kunne ikke finne brukerprofil." };
    }

    // Check if user is a stylist
    if (profile.role !== "stylist") {
      return {
        data: null,
        error: "Kun stylister kan utføre identitetsverifisering.",
      };
    }

    // Get stylist details
    const { data: stylistDetails, error: stylistError } = await supabase
      .from("stylist_details")
      .select("stripe_verification_session_id")
      .eq("profile_id", user.id)
      .single();

    if (stylistError || !stylistDetails) {
      return { data: null, error: "Kunne ikke finne stylistinformasjon." };
    }

    // Check if verification session already exists
    if (stylistDetails.stripe_verification_session_id) {
      return {
        data: null,
        error: "Identitetsverifisering er allerede startet.",
      };
    }

    // Create verification session
    const verificationResult = await createIdentityVerificationSession({
      profileId: user.id,
      email: profile.email,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/stylist/stripe/identity-verification/return`,
    });

    if (verificationResult.error || !verificationResult.data) {
      return { data: null, error: verificationResult.error };
    }

    // Store session ID in database
    const { error: updateError } = await supabase
      .from("stylist_details")
      .update({
        stripe_verification_session_id: verificationResult.data.sessionId,
      })
      .eq("profile_id", user.id);

    if (updateError) {
      console.error("Failed to store verification session ID:", updateError);
      return {
        data: null,
        error: "Kunne ikke lagre verifiseringssesjon.",
      };
    }

    return {
      data: {
        verificationUrl: verificationResult.data.url,
        sessionId: verificationResult.data.sessionId,
      },
      error: null,
    };
  } catch (error) {
    console.error(
      "Unexpected error in createIdentityVerificationForCurrentUser:",
      error
    );
    return {
      data: null,
      error: "En uventet feil oppstod. Prøv igjen senere.",
    };
  }
}

export async function checkIdentityVerificationStatus() {
  const supabase = await createClient();

  try {
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Not authenticated" };
    }

    // Get stylist details with verification info
    const { data: stylistDetails, error: stylistError } = await supabase
      .from("stylist_details")
      .select(
        "stripe_verification_session_id, identity_verification_completed_at"
      )
      .eq("profile_id", user.id)
      .single();

    if (stylistError || !stylistDetails) {
      return { data: null, error: "Stylist details not found" };
    }

    if (!stylistDetails.stripe_verification_session_id) {
      return {
        data: {
          status: "not_started",
          hasSession: false,
          completedAt: null,
        },
        error: null,
      };
    }

    // Get session status from Stripe
    const sessionResult = await getIdentityVerificationSessionStatus({
      sessionId: stylistDetails.stripe_verification_session_id,
    });

    return {
      data: {
        status: sessionResult.data?.status || "unknown",
        hasSession: true,
        completedAt: stylistDetails.identity_verification_completed_at,
        sessionData: sessionResult.data,
      },
      error: sessionResult.error,
    };
  } catch (error) {
    console.error("Error checking identity verification status:", error);
    return {
      data: null,
      error: "Failed to check verification status",
    };
  }
}
```

### 4. Simple UI Flow

**File**: Update existing `app/stylist/stripe/page.tsx`

Add identity verification step:

```typescript
// In the existing logic, add this condition after payouts_enabled check
if (stripeAccountStatus.payouts_enabled && !stylistDetails.identity_verification_completed_at) {
  // Show identity verification step instead of final success
  return (
    <StylistIdentityVerification
      userId={user.id}
      hasVerificationSession={!!stylistDetails.stripe_verification_session_id}
    />
  );
}
```

**File**: `components/stylist-identity-verification.tsx` (NEW)

```typescript
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createIdentityVerificationForCurrentUser } from "@/server/stripe.actions";

interface StylistIdentityVerificationProps {
  userId: string;
  hasVerificationSession: boolean;
}

export function StylistIdentityVerification({
  userId,
  hasVerificationSession
}: StylistIdentityVerificationProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleStartVerification = async () => {
    setIsCreating(true);

    try {
      const result = await createIdentityVerificationForCurrentUser();

      if (result.data?.verificationUrl) {
        // Redirect to Stripe's hosted verification page
        window.location.href = result.data.verificationUrl;
      } else {
        toast.error(result.error || "Kunne ikke starte identitetsverifisering");
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error starting verification:", error);
      toast.error("En uventet feil oppstod");
      setIsCreating(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Identitetsverifisering påkrevd</CardTitle>
          <CardDescription>
            For å motta betalinger må du verifisere identiteten din med Stripe
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Sikker verifisering</AlertTitle>
            <AlertDescription>
              Du vil bli omdirigert til Stripes sikre verifiseringsside hvor du kan laste opp
              et gyldig identitetsdokument (førerkort, pass, eller nasjonal ID).
            </AlertDescription>
          </Alert>

          {hasVerificationSession ? (
            <Alert>
              <AlertTitle>Verifisering startet</AlertTitle>
              <AlertDescription>
                Du har allerede startet identitetsverifisering. Hvis du ikke fullførte prosessen,
                kan du oppdatere siden for å få en ny link.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-center">
              <Button
                onClick={handleStartVerification}
                disabled={isCreating}
                className="w-full sm:w-auto"
              >
                {isCreating ? (
                  "Starter verifisering..."
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Start identitetsverifisering
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            Ved å fortsette godtar du at Stripe behandler identitetsinformasjonen din
            i henhold til deres{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              personvernerklæring
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**File**: `app/stylist/stripe/identity-verification/return/page.tsx` (NEW)

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IdentityVerificationReturnContent } from "@/components/stripe/identity-verification-return-content";

export default async function IdentityVerificationReturnPage() {
  const supabase = await createClient();

  // Fast server-side checks for authentication and authorization
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(
      `/auth/login?redirect=${encodeURIComponent("/stylist/stripe/identity-verification/return")}`
    );
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/auth/login");
  }

  // Check if user is a stylist
  if (profile.role !== "stylist") {
    redirect("/");
  }

  // Get stylist details to ensure they exist
  const { data: stylistDetails, error: stylistError } = await supabase
    .from("stylist_details")
    .select("profile_id")
    .eq("profile_id", user.id)
    .single();

  if (stylistError || !stylistDetails) {
    console.error("Stylist details not found for approved stylist:", user.id);
    redirect("/");
  }

  // All authorization checks passed, render client component
  return <IdentityVerificationReturnContent />;
}
```

**File**: `components/stripe/identity-verification-return-content.tsx` (NEW)

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { checkIdentityVerificationStatus } from "@/server/stripe.actions";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

function IdentityVerificationReturnSkeleton() {
  return (
    <div className="container max-w-2xl mx-auto py-12">
      <BlurFade delay={0.1} duration={0.5} inView>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </Alert>
            <div className="flex justify-center">
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
}

export function IdentityVerificationReturnContent() {
  const { data: verificationData, isLoading, error } = useQuery({
    queryKey: ["identity-verification-status"],
    queryFn: checkIdentityVerificationStatus,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  if (isLoading) {
    return <IdentityVerificationReturnSkeleton />;
  }

  // Handle errors
  if (error || verificationData?.error || !verificationData?.data) {
    const errorMessage = error?.message || verificationData?.error || "Kunne ikke laste verifiseringsstatus";

    return (
      <div className="container max-w-2xl mx-auto py-12">
        <BlurFade delay={0.1} duration={0.5} inView>
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-2xl">Noe gikk galt</CardTitle>
              <CardDescription>
                Vi kunne ikke laste verifiseringsstatusen din
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Feil ved lasting</AlertTitle>
                <AlertDescription>
                  {errorMessage}. Vennligst prøv igjen eller kontakt support.
                </AlertDescription>
              </Alert>

              <div className="text-center">
                <Button onClick={() => window.location.reload()}>
                  Prøv igjen
                </Button>
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    );
  }

  const { status, hasSession, completedAt } = verificationData.data;

  // Determine content based on status
  const getStatusContent = () => {
    if (!hasSession) {
      return {
        icon: <XCircle className="h-12 w-12 text-red-500" />,
        title: "Ingen verifisering funnet",
        description: "Vi fant ingen identitetsverifisering for kontoen din",
        alertType: "error" as const,
        alertTitle: "Ingen verifiseringssesjon",
        alertMessage: "Vennligst start identitetsverifiseringen på nytt.",
      };
    }

    if (completedAt) {
      return {
        icon: <CheckCircle className="h-12 w-12 text-green-500" />,
        title: "Identitet verifisert!",
        description: "Din identitet er bekreftet og du kan nå motta betalinger",
        alertType: "success" as const,
        alertTitle: "Verifiseringen er fullført",
        alertMessage: "Du kan nå opprette tjenester og motta betalinger fra kunder.",
      };
    }

    switch (status) {
      case 'verified':
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: "Verifisering fullført!",
          description: "Din identitet er bekreftet",
          alertType: "success" as const,
          alertTitle: "Identitet verifisert",
          alertMessage: "Verifiseringen din er fullført. Du kan nå motta betalinger.",
        };

      case 'processing':
        return {
          icon: <Clock className="h-12 w-12 text-blue-500" />,
          title: "Verifisering behandles",
          description: "Vi behandler identitetsdokumentet ditt",
          alertType: "info" as const,
          alertTitle: "Behandling pågår",
          alertMessage: "Dette tar vanligvis 1-3 minutter. Du vil motta en e-post når verifiseringen er ferdig.",
        };

      case 'requires_input':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-amber-500" />,
          title: "Mer informasjon kreves",
          description: "Vi trenger tilleggsinformasjon for å fullføre verifiseringen",
          alertType: "warning" as const,
          alertTitle: "Handling kreves",
          alertMessage: "Vennligst start en ny verifiseringssesjon eller kontakt support for hjelp.",
        };

      default:
        return {
          icon: <AlertTriangle className="h-12 w-12 text-amber-500" />,
          title: "Verifiseringsstatus ukjent",
          description: "Vi kunne ikke fastslå statusen for verifiseringen din",
          alertType: "warning" as const,
          alertTitle: "Ukjent status",
          alertMessage: "Vennligst kontakt support for å avklare statusen på verifiseringen din.",
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <BlurFade delay={0.1} duration={0.5} inView>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">{statusContent.icon}</div>
            <CardTitle className="text-2xl">{statusContent.title}</CardTitle>
            <CardDescription>{statusContent.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert variant={statusContent.alertType === "error" ? "destructive" : "default"}>
              <AlertTitle>{statusContent.alertTitle}</AlertTitle>
              <AlertDescription>{statusContent.alertMessage}</AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {completedAt || status === 'verified' ? (
                <>
                  <Button asChild>
                    <Link href="/stylist/stripe">
                      Gå til Stripe-dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/profiler/mine/mine-tjenester">
                      Opprett tjenester
                    </Link>
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link href="/stylist/stripe">
                    Tilbake til oversikt
                  </Link>
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Har du spørsmål?{" "}
              <a
                href="mailto:kontakt@nabostylisten.no"
                className="text-primary hover:underline"
              >
                Kontakt oss
              </a>
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
}
```

### 5. Webhook Integration (Recommended)

**File**: `app/api/webhooks/stripe/identity/route.ts` (NEW)

```typescript
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/service";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_IDENTITY_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      case "identity.verification_session.verified":
        const verifiedSession = event.data
          .object as Stripe.Identity.VerificationSession;
        const verifiedProfileId = verifiedSession.metadata?.profile_id;

        if (verifiedProfileId) {
          console.log(
            `Identity verification completed for profile: ${verifiedProfileId}`
          );

          const { error } = await supabase
            .from("stylist_details")
            .update({
              identity_verification_completed_at: new Date().toISOString(),
            })
            .eq("profile_id", verifiedProfileId)
            .eq("stripe_verification_session_id", verifiedSession.id);

          if (error) {
            console.error(
              "Failed to update identity verification completion:",
              error
            );
          }
        }
        break;

      case "identity.verification_session.requires_input":
        const failedSession = event.data
          .object as Stripe.Identity.VerificationSession;
        const failedProfileId = failedSession.metadata?.profile_id;

        if (failedProfileId) {
          console.log(
            `Identity verification requires input for profile: ${failedProfileId}`
          );

          // Optionally clear the completion timestamp to allow retry
          const { error } = await supabase
            .from("stylist_details")
            .update({
              identity_verification_completed_at: null,
            })
            .eq("profile_id", failedProfileId)
            .eq("stripe_verification_session_id", failedSession.id);

          if (error) {
            console.error(
              "Failed to clear identity verification completion:",
              error
            );
          }
        }
        break;

      case "identity.verification_session.processing":
        const processingSession = event.data
          .object as Stripe.Identity.VerificationSession;
        console.log(
          `Identity verification processing for session: ${processingSession.id}`
        );
        // Could add processing status update here if needed
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }

  return new Response("Success", { status: 200 });
}
```

### 6. Update Service Creation Blocking

**File**: Update existing checks in services page

Update `app/profiler/[profileId]/mine-tjenester/services-page-client.tsx`:

```typescript
// Import the new utility
import { canCreateServices } from "@/lib/stylist-onboarding-status";

// Update the check in the component
const canCreate = canCreateServices(
  stripeStatusResult?.data?.status,
  stripeStatusResult?.data?.stylistDetails?.identity_verification_completed_at
);

// Update the service creation blocking
const handleCreateService = () => {
  if (!canCreate) {
    router.push("/stylist/stripe");
    return;
  }
  // ... existing logic
};
```

Update `components/revenue/stylist-revenue-dashboard.tsx`:

```typescript
// Similar updates to check for identity verification completion
// before showing revenue data
```

### 7. Environment Variables

Add to your `.env` file:

```bash
STRIPE_IDENTITY_WEBHOOK_SECRET=whsec_...
```

### 8. Webhook Configuration

In your Stripe Dashboard:

1. Go to Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe/identity`
3. Select events:
   - `identity.verification_session.verified`
   - `identity.verification_session.requires_input`
   - `identity.verification_session.processing`

## Key Benefits of This Approach

1. **Minimal State**: Only track session ID and completion timestamp
2. **Stripe-Hosted**: Users go to Stripe's polished verification flow
3. **Webhook-Driven**: Automatic updates when verification completes
4. **Simple Logic**: Easy to understand onboarding progression
5. **Less Maintenance**: No complex state management or UI components
6. **Secure**: All sensitive verification data handled by Stripe
7. **Mobile-Friendly**: Stripe's hosted pages work well on mobile devices

## Flow Summary

1. **Stylist completes basic Stripe onboarding** (charges + payouts enabled)
2. **System shows identity verification step** with button to start process
3. **Stylist clicks button** → creates verification session → redirects to Stripe
4. **Stylist completes verification** on Stripe's hosted page
5. **Stripe sends webhook** → system updates completion timestamp
6. **Stylist returns to platform** → sees success message
7. **Stylist can now create services** and receive payments

This approach leverages Stripe's hosted solution completely while maintaining just enough state in your database to control access to service creation. The verification process is entirely handled by Stripe, and you only update your database when they successfully complete it.
