"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  Mail,
  ExternalLink,
} from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getBookingDetails } from "@/server/booking.actions";
import type { DatabaseTables } from "@/types/database-helpers";
import { DEFAULT_PLATFORM_CONFIG } from "@/schemas/platform-config.schema";

const STATUS_CONTENT_MAP = {
  succeeded: {
    title: "Betaling fullført!",
    description: "Din betaling er mottatt og booking er bekreftet.",
    icon: CheckCircle,
    iconColor: "text-chart-2",
    bgColor: "bg-accent/20",
    borderColor: "border-accent",
  },
  requires_capture: {
    title: "Booking bekreftet!",
    description: `Din betaling er autorisert og booking er bekreftet. Kortet ditt blir belastet ${DEFAULT_PLATFORM_CONFIG.payment.captureHoursBeforeAppointment} timer før timen.`,
    icon: CheckCircle,
    iconColor: "text-chart-2",
    bgColor: "bg-accent/20",
    borderColor: "border-accent",
  },
  processing: {
    title: "Betaling behandles",
    description: "Betalingen din behandles. Du vil motta en bekreftelse snart.",
    icon: Clock,
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  requires_payment_method: {
    title: "Betaling feilet",
    description: "Betalingen var ikke vellykket. Vennligst prøv igjen.",
    icon: XCircle,
    iconColor: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
  },
  default: {
    title: "Noe gikk galt",
    description:
      "En uventet feil oppstod. Vennligst kontakt oss hvis problemet vedvarer.",
    icon: AlertCircle,
    iconColor: "text-chart-3",
    bgColor: "bg-chart-3/10",
    borderColor: "border-chart-3/30",
  },
} as const;

// Types for booking data with relations
type BookingWithRelations = DatabaseTables["bookings"]["Row"] & {
  stylist: Pick<DatabaseTables["profiles"]["Row"], "id" | "full_name"> | null;
  booking_services: Array<{
    service: Pick<
      DatabaseTables["services"]["Row"],
      | "id"
      | "title"
      | "description"
      | "price"
      | "duration_minutes"
      | "has_trial_session"
      | "trial_session_price"
      | "trial_session_duration_minutes"
      | "trial_session_description"
    > | null;
  }> | null;
  trial_booking: Pick<
    DatabaseTables["bookings"]["Row"],
    | "id"
    | "start_time"
    | "end_time"
    | "total_price"
    | "total_duration_minutes"
    | "status"
    | "is_trial_session"
  > | null;
};

interface PaymentSuccessCardProps {
  paymentIntentId: string;
  bookingId: string;
  paymentStatus: keyof typeof STATUS_CONTENT_MAP;
}

export function PaymentSuccessCard({
  paymentIntentId,
  bookingId,
  paymentStatus,
}: PaymentSuccessCardProps) {
  // Fetch booking details
  const {
    data: bookingResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBookingDetails(bookingId),
  });

  console.log({ error });

  // Create support email content
  const createSupportEmailUrl = (
    booking: BookingWithRelations | null | undefined
  ) => {
    const subject = encodeURIComponent(
      "Manglende kvittering - Booking " + bookingId
    );

    const services =
      booking?.booking_services
        ?.map((bs) => bs.service?.title)
        .filter(Boolean)
        .join(", ") || "Ikke spesifisert";
    const bookingDate = booking?.start_time
      ? new Date(booking.start_time).toLocaleDateString("no-NO")
      : "Ikke spesifisert";
    const trialDate = booking?.trial_booking?.start_time
      ? new Date(booking.trial_booking.start_time).toLocaleDateString("no-NO")
      : null;
    const totalAmount =
      booking?.total_price && booking?.trial_booking?.total_price
        ? `${booking.total_price + booking.trial_booking.total_price} NOK`
        : booking?.total_price
          ? `${booking.total_price} NOK`
          : "Ikke spesifisert";

    const body = encodeURIComponent(`Hei Nabostylisten-teamet,

Jeg har fullført en betaling, men har ikke mottatt kvittering på e-post.

Bookingdetaljer:
- Booking ID: ${bookingId}
- Betalings-ID: ${paymentIntentId}
- Tjenester: ${services}
- Dato: ${bookingDate}${
      trialDate
        ? `
- Prøvetime dato: ${trialDate}`
        : ""
    }
- Totalt beløp: ${totalAmount}

Vennligst send meg kvitteringen på e-post eller bekreft at betalingen ble mottatt.

Med vennlig hilsen`);

    return `mailto:support@nabostylisten.no?subject=${subject}&body=${body}`;
  };

  const booking = bookingResult?.data;
  const content =
    STATUS_CONTENT_MAP[paymentStatus] || STATUS_CONTENT_MAP.default;
  const Icon = content.icon;

  console.log({ booking });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 px-6 lg:px-12">
        <div className="max-w-2xl mx-auto">
          <BlurFade duration={0.5} inView>
            <Card className="bg-accent/20 border-accent border-2">
              <CardHeader className="text-center pb-6">
                {/* Icon skeleton */}
                <div className="mx-auto mb-4 p-3 rounded-full bg-background/80 border">
                  <Skeleton className="w-12 h-12 rounded-full" />
                </div>
                {/* Title skeleton */}
                <Skeleton className="h-8 w-64 mx-auto" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description skeleton */}
                <div className="text-center space-y-2">
                  <Skeleton className="h-5 w-96 mx-auto" />
                  <Skeleton className="h-5 w-80 mx-auto" />
                </div>

                {/* Booking summary skeleton */}
                <BlurFade delay={0.1} duration={0.5} inView>
                  <div className="bg-card/80 border rounded-lg p-4 space-y-4">
                    {/* Summary title skeleton */}
                    <Skeleton className="h-4 w-40" />

                    {/* Stylist info skeleton */}
                    <div className="pb-2 border-b space-y-2">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-5 w-32" />
                    </div>

                    {/* Services skeleton */}
                    <div className="space-y-3">
                      {[1, 2].map((index) => (
                        <div
                          key={index}
                          className="flex justify-between items-start"
                        >
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>

                    {/* Totals skeleton */}
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-24" />
                      </div>

                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-20" />
                      </div>

                      <div className="flex justify-between pt-2 border-t">
                        <Skeleton className="h-5 w-12" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                    </div>
                  </div>
                </BlurFade>

                {/* Action buttons skeleton */}
                <BlurFade delay={0.15} duration={0.5} inView>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 flex-1" />
                  </div>
                </BlurFade>
              </CardContent>
            </Card>
          </BlurFade>

          {/* Additional info skeleton */}
          <BlurFade delay={0.25} duration={0.5} inView>
            <div className="mt-8 text-center">
              <Skeleton className="h-4 w-80 mx-auto" />
            </div>
          </BlurFade>
        </div>
      </div>
    );
  }

  if (error || bookingResult?.error) {
    return (
      <div className="min-h-screen pt-20 px-6 lg:px-12">
        <div className="max-w-2xl mx-auto">
          <BlurFade duration={0.5} inView>
            <Card
              className={`${STATUS_CONTENT_MAP.default.bgColor} ${STATUS_CONTENT_MAP.default.borderColor} border-2`}
            >
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 p-3 rounded-full bg-background/80 border">
                  <AlertCircle
                    className={`w-12 h-12 ${STATUS_CONTENT_MAP.default.iconColor}`}
                  />
                </div>
                <CardTitle className="text-2xl font-bold">
                  Kunne ikke laste bestillingsdetaljer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground text-lg">
                  Vi kunne ikke hente detaljene for din bestilling. Vennligst
                  kontakt oss hvis problemet vedvarer.
                </p>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-12">
      <div className="max-w-2xl mx-auto">
        <BlurFade duration={0.5} inView>
          <Card
            className={`${content.bgColor} ${content.borderColor} border-2`}
          >
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-3 rounded-full bg-background/80 border">
                <Icon className={`w-12 h-12 ${content.iconColor}`} />
              </div>
              <CardTitle className="text-2xl font-bold">
                {content.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground text-lg">
                {content.description}
              </p>

              {/* Booking summary */}
              {booking && (
                <BlurFade delay={0.1} duration={0.5} inView>
                  <div className="bg-card/80 border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      Bestillingssammendrag
                    </h3>

                    {/* Stylist info */}
                    <div className="pb-2 border-b">
                      <p className="text-sm text-muted-foreground">Stylist</p>
                      <p className="font-medium">
                        {booking.stylist?.full_name}
                      </p>
                    </div>

                    {/* Services */}
                    <div className="space-y-3">
                      {booking.booking_services?.map(
                        (bookingService, index) => {
                          const service = bookingService.service;

                          return (
                            <div
                              key={index}
                              className="flex justify-between items-start"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{service?.title}</p>
                                {service?.duration_minutes && (
                                  <p className="text-sm text-muted-foreground">
                                    {service.duration_minutes} minutter
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  {(service?.price || 0).toLocaleString(
                                    "no-NO",
                                    {
                                      style: "currency",
                                      currency: "NOK",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        }
                      )}

                      {/* Trial session if exists */}
                      {booking.trial_booking && (
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-primary">
                                Prøvetime
                              </p>
                              {booking.trial_booking.start_time && (
                                <p className="text-sm text-muted-foreground">
                                  {new Date(
                                    booking.trial_booking.start_time
                                  ).toLocaleDateString("no-NO", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                              {booking.trial_booking.total_duration_minutes && (
                                <p className="text-sm text-muted-foreground">
                                  {booking.trial_booking.total_duration_minutes}{" "}
                                  minutter
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-primary">
                                {(
                                  booking.trial_booking.total_price || 0
                                ).toLocaleString("no-NO", {
                                  style: "currency",
                                  currency: "NOK",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Totals */}
                    <div className="pt-3 border-t space-y-2">
                      {/* Calculate subtotal from individual service prices + trial session */}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>
                          {(
                            (booking.booking_services?.reduce(
                              (total, bs) => total + (bs.service?.price || 0),
                              0
                            ) || 0) + (booking.trial_booking?.total_price || 0)
                          ).toLocaleString("no-NO", {
                            style: "currency",
                            currency: "NOK",
                          })}
                        </span>
                      </div>

                      {/* Show discount if applied */}
                      {booking.discount_applied > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Rabatt</span>
                          <span className="text-chart-2">
                            -
                            {booking.discount_applied.toLocaleString("no-NO", {
                              style: "currency",
                              currency: "NOK",
                            })}
                          </span>
                        </div>
                      )}

                      {/* Show the final amount that was actually paid (calculated correctly) */}
                      <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                        <span>Totalt</span>
                        <span>
                          {/* Calculate the correct total: subtotal - discount */}
                          {(() => {
                            const serviceSubtotal = booking.booking_services?.reduce(
                              (total, bs) => total + (bs.service?.price || 0),
                              0
                            ) || 0;
                            const trialSessionAmount = booking.trial_booking?.total_price || 0;
                            const subtotal = serviceSubtotal + trialSessionAmount;
                            const discount = booking.discount_applied || 0;
                            const finalTotal = subtotal - discount;
                            
                            return finalTotal.toLocaleString("no-NO", {
                              style: "currency",
                              currency: "NOK",
                            });
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </BlurFade>
              )}

              {/* Action buttons */}
              <BlurFade delay={0.15} duration={0.5} inView>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {(paymentStatus === "succeeded" ||
                    paymentStatus === "requires_capture") && (
                    <>
                      <Link href={`/bookinger/${bookingId}`} className="flex-1">
                        <Button className="w-full" size="lg">
                          Se booking
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      {booking?.customer_id ? (
                        <Link
                          href={`/profiler/${booking?.customer_id}/mine-bookinger`}
                          className="flex-1"
                        >
                          <Button
                            variant="outline"
                            className="w-full"
                            size="lg"
                          >
                            Mine bookinger
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/profiler" className="flex-1">
                          <Button
                            variant="outline"
                            className="w-full"
                            size="lg"
                          >
                            Mine bookinger
                          </Button>
                        </Link>
                      )}
                    </>
                  )}

                  {paymentStatus === "requires_payment_method" && (
                    <>
                      <Link
                        href={`/checkout?booking_id=${bookingId}`}
                        className="flex-1"
                      >
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

                  {(paymentStatus === "processing" ||
                    paymentStatus === "default") && (
                    <Link href="/profiler" className="flex-1">
                      <Button variant="outline" className="w-full" size="lg">
                        Mine bookinger
                      </Button>
                    </Link>
                  )}
                </div>
              </BlurFade>

              {/* Stripe dashboard link for development */}
              {process.env.NODE_ENV === "development" && (
                <BlurFade delay={0.2} duration={0.5} inView>
                  <div className="pt-4 border-t">
                    <a
                      href={`https://dashboard.stripe.com/payments/${paymentIntentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary underline flex items-center gap-1"
                    >
                      Se i Stripe-dashboard
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </BlurFade>
              )}
            </CardContent>
          </Card>
        </BlurFade>

        {/* Support contact card for successful payments */}
        {(paymentStatus === "succeeded" ||
          paymentStatus === "requires_capture") && (
          <BlurFade delay={0.3} duration={0.5} inView>
            <Card className="mt-6 border-muted bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <h4 className="font-medium text-sm">
                      Ikke mottatt kvittering på e-post?
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Hvis du ikke har mottatt kvittering innen 5 minutter,
                      kontakt oss så sender vi den på nytt. Vi har alle
                      betalingsdetaljene klare.
                    </p>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8 text-xs"
                      >
                        <a
                          href={createSupportEmailUrl(booking ?? null)}
                          className="inline-flex items-center gap-1.5"
                        >
                          <Mail className="w-3 h-3" />
                          Send support-henvendelse
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        )}

        {/* Additional info */}
        <BlurFade delay={0.35} duration={0.5} inView>
          <div className="mt-8 text-center text-sm text-muted-foreground space-y-2">
            <p>
              {paymentStatus === "succeeded" ||
              paymentStatus === "requires_capture"
                ? "Du vil motta en e-post med bekreftelse og detaljer om din booking."
                : "Trenger du hjelp? Kontakt oss på support@nabostylisten.no"}
            </p>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}
