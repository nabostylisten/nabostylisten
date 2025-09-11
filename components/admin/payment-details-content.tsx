"use client";

import { useQuery } from "@tanstack/react-query";
import { getPaymentDetails } from "@/server/admin/payment-details.actions";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  Clock,
  MessageSquare,
  Star,
  FileText,
  ExternalLink,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

interface PaymentDetailsContentProps {
  paymentId: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case "succeeded":
      return "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800";
    case "processing":
    case "requires_capture":
    case "requires_confirmation":
    case "requires_action":
    case "requires_payment_method":
      return "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800";
    case "cancelled":
      return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
    case "pending":
      return "bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
  }
}

function formatCurrency(amount: number, currency: string = "NOK") {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDateTime(dateString: string) {
  return format(new Date(dateString), "dd.MM.yyyy 'kl.' HH:mm", { locale: nb });
}

// Loading skeleton components
function PaymentOverviewSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Betalingsoversikt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BookingDetailsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Booking detaljer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>

        <Separator />
        <div>
          <Skeleton className="h-5 w-20 mb-2" />
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserInfoSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

function StripeDetailsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stripe detaljer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-8" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function ImportantDatesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Viktige datoer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <BlurFade duration={0.5} inView>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="sm" asChild className="w-fit">
            <Link href="/admin/betalinger">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Betalingsdetaljer
            </h1>
            <div className="mt-1">
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
      </BlurFade>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <BlurFade delay={0.1} duration={0.5} inView>
            <PaymentOverviewSkeleton />
          </BlurFade>

          <BlurFade delay={0.15} duration={0.5} inView>
            <BookingDetailsSkeleton />
          </BlurFade>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <BlurFade delay={0.1} duration={0.5} inView>
            <UserInfoSkeleton title="Kunde" />
          </BlurFade>

          <BlurFade delay={0.15} duration={0.5} inView>
            <UserInfoSkeleton title="Stylist" />
          </BlurFade>

          <BlurFade delay={0.2} duration={0.5} inView>
            <StripeDetailsSkeleton />
          </BlurFade>

          <BlurFade delay={0.25} duration={0.5} inView>
            <ImportantDatesSkeleton />
          </BlurFade>
        </div>
      </div>
    </div>
  );
}

export function PaymentDetailsContent({
  paymentId,
}: PaymentDetailsContentProps) {
  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["payment-details", paymentId],
    queryFn: () => getPaymentDetails(paymentId),
    retry: 1,
  });

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Kopiert til utklippstavle");
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !response?.data) {
    return (
      <div className="container max-w-7xl mx-auto py-12 px-4">
        <BlurFade duration={0.5} inView>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <Button variant="outline" size="sm" asChild className="w-fit">
              <Link href="/admin/betalinger">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Betalingsdetaljer
              </h1>
            </div>
          </div>
        </BlurFade>

        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {error
                ? "Kunne ikke laste betalingsdetaljer"
                : "Betaling ikke funnet"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const payment = response.data;

  return (
    <div className="container max-w-7xl mx-auto py-12 px-4">
      <BlurFade duration={0.5} inView>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="sm" asChild className="w-fit">
            <Link href="/admin/betalinger">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
              Betalingsdetaljer
            </h1>
            <p className="text-muted-foreground break-all">ID: {payment.id}</p>
          </div>
        </div>
      </BlurFade>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Overview */}
          <BlurFade delay={0.1} duration={0.5} inView>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Betalingsoversikt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Originalbeløp
                    </p>
                    <p className="font-medium">
                      {formatCurrency(
                        payment.original_amount,
                        payment.currency
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rabatt</p>
                    <p className="font-medium">
                      {formatCurrency(
                        payment.discount_amount,
                        payment.currency
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Totalbeløp</p>
                    <p className="font-semibold text-lg">
                      {formatCurrency(payment.final_amount, payment.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Plattformavgift
                    </p>
                    <p className="font-medium">
                      {formatCurrency(payment.platform_fee, payment.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Stylist utbetaling
                    </p>
                    <p className="font-medium">
                      {formatCurrency(payment.stylist_payout, payment.currency)}
                    </p>
                  </div>
                  {payment.affiliate_commission > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Affiliate kommisjon
                      </p>
                      <p className="font-medium">
                        {formatCurrency(
                          payment.affiliate_commission,
                          payment.currency
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {payment.refunded_amount > 0 && (
                  <>
                    <Separator />
                    <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Refundert beløp
                      </p>
                      <p className="text-red-700 dark:text-red-300">
                        {formatCurrency(
                          payment.refunded_amount,
                          payment.currency
                        )}
                      </p>
                      {payment.refund_reason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Grunn: {payment.refund_reason}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </BlurFade>

          {/* Booking Details */}
          <BlurFade delay={0.15} duration={0.5} inView>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Booking detaljer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Starttid</p>
                    <p className="font-medium">
                      {formatDateTime(payment.booking.start_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sluttid</p>
                    <p className="font-medium">
                      {formatDateTime(payment.booking.end_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Varighet</p>
                    <p className="font-medium">
                      {payment.booking.total_duration_minutes} minutter
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(payment.booking.status)}>
                      {payment.booking.status}
                    </Badge>
                  </div>
                </div>

                {/* Services */}
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Tjenester</p>
                  <div className="space-y-2">
                    {payment.booking.services.map((service) => (
                      <div key={service.id}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{service.title}</p>
                            {service.description && (
                              <p className="text-sm text-muted-foreground">
                                {service.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {service.duration_minutes} min
                            </p>
                          </div>
                          <p className="font-medium">
                            {formatCurrency(service.price, service.currency)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location */}
                {payment.booking.address && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Lokasjon
                      </p>
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <p className="font-medium break-words">
                          {payment.booking.address.nickname &&
                            `${payment.booking.address.nickname} - `}
                          {payment.booking.address.street_address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.booking.address.postal_code}{" "}
                          {payment.booking.address.city},{" "}
                          {payment.booking.address.country}
                        </p>
                        {payment.booking.address.entry_instructions && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Instruksjoner:{" "}
                            {payment.booking.address.entry_instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Message */}
                {payment.booking.message_to_stylist && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Melding til stylist
                      </p>
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          {payment.booking.message_to_stylist}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </BlurFade>

          {/* Review */}
          {payment.booking.review && (
            <BlurFade delay={0.2} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Anmeldelse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < payment.booking.review!.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">
                        {payment.booking.review.rating}/5
                      </span>
                      <span className="text-sm text-muted-foreground">
                        • {formatDateTime(payment.booking.review.created_at)}
                      </span>
                    </div>
                    {payment.booking.review.comment && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <p className="text-sm">
                          {payment.booking.review.comment}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </BlurFade>
          )}

          {/* Booking Notes */}
          {payment.booking.booking_notes.length > 0 && (
            <BlurFade delay={0.25} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Booking notater ({payment.booking.booking_notes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payment.booking.booking_notes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {note.category.replace("_", " ")}
                            </Badge>
                            {note.customer_visible && (
                              <Badge variant="secondary" className="text-xs">
                                Synlig for kunde
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(note.created_at)}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{note.content}</p>
                        {note.duration_minutes && (
                          <p className="text-xs text-muted-foreground">
                            Faktisk varighet: {note.duration_minutes} min
                          </p>
                        )}
                        {note.next_appointment_suggestion && (
                          <p className="text-xs text-muted-foreground">
                            Neste avtale forslag:{" "}
                            {note.next_appointment_suggestion}
                          </p>
                        )}
                        {note.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {note.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </BlurFade>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <BlurFade delay={0.1} duration={0.5} inView>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Kunde
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">
                    {payment.booking.customer.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.booking.customer.email}
                  </p>
                  {payment.booking.customer.phone_number && (
                    <p className="text-sm text-muted-foreground">
                      {payment.booking.customer.phone_number}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </BlurFade>

          {/* Stylist Info */}
          <BlurFade delay={0.15} duration={0.5} inView>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Stylist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">
                    {payment.booking.stylist.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.booking.stylist.email}
                  </p>
                  {payment.booking.stylist.phone_number && (
                    <p className="text-sm text-muted-foreground">
                      {payment.booking.stylist.phone_number}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </BlurFade>

          {/* Stripe Details */}
          {payment.stripe_data && (
            <BlurFade delay={0.2} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Stripe detaljer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge
                        className={getStatusColor(payment.stripe_data.status)}
                      >
                        {payment.stripe_data.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beløp</span>
                      <span>
                        {formatCurrency(
                          payment.stripe_data.amount / 100,
                          payment.stripe_data.currency.toUpperCase()
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Opprettet</span>
                      <span>
                        {format(
                          new Date(payment.stripe_data.created * 1000),
                          "dd.MM.yyyy HH:mm"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Betalingsmåter
                      </span>
                      <span className="text-xs">
                        {payment.stripe_data.payment_method_types.join(", ")}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Payment Intent ID
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() =>
                          handleCopyToClipboard(payment.payment_intent_id)
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                      {payment.payment_intent_id}
                    </p>
                  </div>

                  {payment.stripe_data.receipt_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <a
                        href={payment.stripe_data.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Vis kvittering
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </BlurFade>
          )}

          {/* Affiliate Info */}
          {payment.affiliate && (
            <BlurFade delay={0.25} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Affiliate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{payment.affiliate.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.affiliate.email}
                    </p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Kommisjon:{" "}
                      {formatCurrency(
                        payment.affiliate_commission,
                        payment.currency
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </BlurFade>
          )}

          {/* Important Dates */}
          <BlurFade delay={0.3} duration={0.5} inView>
            <Card>
              <CardHeader>
                <CardTitle>Viktige datoer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Opprettet</span>
                    <p className="font-medium">
                      {formatDateTime(payment.created_at)}
                    </p>
                  </div>
                  {payment.authorized_at && (
                    <div>
                      <span className="text-muted-foreground">Autorisert</span>
                      <p className="font-medium">
                        {formatDateTime(payment.authorized_at)}
                      </p>
                    </div>
                  )}
                  {payment.captured_at && (
                    <div>
                      <span className="text-muted-foreground">Belastet</span>
                      <p className="font-medium">
                        {formatDateTime(payment.captured_at)}
                      </p>
                    </div>
                  )}
                  {payment.succeeded_at && (
                    <div>
                      <span className="text-muted-foreground">Fullført</span>
                      <p className="font-medium">
                        {formatDateTime(payment.succeeded_at)}
                      </p>
                    </div>
                  )}
                  {payment.payout_initiated_at && (
                    <div>
                      <span className="text-muted-foreground">
                        Utbetaling startet
                      </span>
                      <p className="font-medium">
                        {formatDateTime(payment.payout_initiated_at)}
                      </p>
                    </div>
                  )}
                  {payment.payout_completed_at && (
                    <div>
                      <span className="text-muted-foreground">
                        Utbetaling fullført
                      </span>
                      <p className="font-medium">
                        {formatDateTime(payment.payout_completed_at)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </div>
    </div>
  );
}
