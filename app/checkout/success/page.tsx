import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import Link from "next/link";

// Get Stripe instance for server-side payment intent retrieval
import { stripe } from "@/lib/stripe/config";

const STATUS_CONTENT_MAP = {
  succeeded: {
    title: "Betaling fullført!",
    description: "Din betaling er mottatt og booking er bekreftet.",
    icon: CheckCircle,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  processing: {
    title: "Betaling behandles",
    description: "Betalingen din behandles. Du vil motta en bekreftelse snart.",
    icon: Clock,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  requires_payment_method: {
    title: "Betaling feilet",
    description: "Betalingen var ikke vellykket. Vennligst prøv igjen.",
    icon: XCircle,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  default: {
    title: "Noe gikk galt",
    description: "En uventet feil oppstod. Vennligst kontakt oss hvis problemet vedvarer.",
    icon: AlertCircle,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
} as const;

interface SuccessPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function PaymentStatus({ paymentIntentId, bookingId }: { paymentIntentId: string; bookingId: string }) {
  let paymentIntent;
  
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error("Failed to retrieve payment intent:", error);
    return (
      <PaymentStatusCard
        status="default"
        paymentIntentId={paymentIntentId}
        bookingId={bookingId}
      />
    );
  }

  return (
    <PaymentStatusCard
      status={paymentIntent.status as keyof typeof STATUS_CONTENT_MAP}
      paymentIntentId={paymentIntentId}
      bookingId={bookingId}
      paymentIntent={paymentIntent}
    />
  );
}

function PaymentStatusCard({
  status,
  paymentIntentId,
  bookingId,
  paymentIntent,
}: {
  status: keyof typeof STATUS_CONTENT_MAP;
  paymentIntentId: string;
  bookingId: string;
  paymentIntent?: any;
}) {
  const content = STATUS_CONTENT_MAP[status] || STATUS_CONTENT_MAP.default;
  const Icon = content.icon;

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-12">
      <div className="max-w-2xl mx-auto">
        <BlurFade duration={0.5} inView>
          <Card className={`${content.bgColor} ${content.borderColor} border-2`}>
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-3 rounded-full bg-white/80">
                <Icon className={`w-12 h-12 ${content.iconColor}`} />
              </div>
              <CardTitle className="text-2xl font-bold">{content.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground text-lg">
                {content.description}
              </p>

              {/* Payment details */}
              {paymentIntent && (
                <BlurFade delay={0.1} duration={0.5} inView>
                  <div className="bg-white/80 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      Betalingsdetaljer
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Betalings-ID:</span>
                        <p className="font-mono text-xs break-all">{paymentIntentId}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <p className="capitalize font-medium">{status}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Booking-ID:</span>
                        <p className="font-mono text-xs break-all">{bookingId}</p>
                      </div>
                      {paymentIntent.amount && (
                        <div>
                          <span className="text-muted-foreground">Beløp:</span>
                          <p className="font-semibold">
                            {(paymentIntent.amount / 100).toLocaleString("no-NO", {
                              style: "currency",
                              currency: "NOK",
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </BlurFade>
              )}

              {/* Action buttons */}
              <BlurFade delay={0.15} duration={0.5} inView>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {status === "succeeded" && (
                    <>
                      <Link href={`/bookinger/${bookingId}`} className="flex-1">
                        <Button className="w-full" size="lg">
                          Se booking
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      <Link href="/profiler" className="flex-1">
                        <Button variant="outline" className="w-full" size="lg">
                          Mine bookinger
                        </Button>
                      </Link>
                    </>
                  )}
                  
                  {status === "requires_payment_method" && (
                    <>
                      <Link href={`/checkout?booking_id=${bookingId}`} className="flex-1">
                        <Button className="w-full" size="lg">
                          Prøv igjen
                        </Button>
                      </Link>
                      <Link href="/handlekurv" className="flex-1">
                        <Button variant="outline" className="w-full" size="lg">
                          Tilbake til kurv
                        </Button>
                      </Link>
                    </>
                  )}
                  
                  {(status === "processing" || status === "default") && (
                    <Link href="/profiler" className="flex-1">
                      <Button variant="outline" className="w-full" size="lg">
                        Mine bookinger
                      </Button>
                    </Link>
                  )}
                </div>
              </BlurFade>

              {/* Stripe dashboard link for development */}
              {process.env.NODE_ENV === "development" && paymentIntent && (
                <BlurFade delay={0.2} duration={0.5} inView>
                  <div className="pt-4 border-t">
                    <a
                      href={`https://dashboard.stripe.com/payments/${paymentIntentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary underline flex items-center gap-1"
                    >
                      Se i Stripe Dashboard
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </BlurFade>
              )}
            </CardContent>
          </Card>
        </BlurFade>

        {/* Additional info */}
        <BlurFade delay={0.25} duration={0.5} inView>
          <div className="mt-8 text-center text-sm text-muted-foreground space-y-2">
            <p>
              {status === "succeeded" 
                ? "Du vil motta en e-post med bekreftelse og detaljer om din booking." 
                : "Trenger du hjelp? Kontakt oss på support@nabostylisten.no"
              }
            </p>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}

async function SuccessContent({ searchParams }: { searchParams: Awaited<SuccessPageProps['searchParams']> }) {
  const paymentIntentId = searchParams.payment_intent as string;
  const bookingId = searchParams.booking_id as string;

  if (!paymentIntentId || !bookingId) {
    redirect("/");
  }

  return (
    <PaymentStatus 
      paymentIntentId={paymentIntentId}
      bookingId={bookingId}
    />
  );
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Kontrollerer betalingsstatus...</p>
          </div>
        </div>
      }
    >
      <SuccessContent searchParams={await searchParams} />
    </Suspense>
  );
}