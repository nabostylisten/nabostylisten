"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookingDetails } from "@/server/booking.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  MessageSquare,
  CreditCard,
  Home,
  Building2,
  Star,
  Receipt,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BookingDetailsContentProps {
  bookingId: string;
  userId: string;
}

export function BookingDetailsContent({
  bookingId,
  userId,
}: BookingDetailsContentProps) {
  const router = useRouter();

  const {
    data: bookingResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["booking-details", bookingId],
    queryFn: () => getBookingDetails(bookingId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">
                Laster booking detaljer...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bookingResponse?.data) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="max-w-4xl mx-auto w-full">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Feil ved lasting</h3>
              <p className="text-muted-foreground mb-4">
                {bookingResponse?.error || "Kunne ikke laste booking detaljer"}
              </p>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Gå tilbake
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const booking = bookingResponse.data;
  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  const services =
    booking.booking_services?.map((bs) => bs.service).filter(Boolean) || [];
  const isUpcoming = startTime > new Date();

  // Status styling
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          badge: (
            <Badge
              variant="outline"
              className="text-yellow-600 border-yellow-200"
            >
              Venter på bekreftelse
            </Badge>
          ),
          icon: <Clock className="w-5 h-5 text-yellow-600" />,
          description: "Bookingen venter på bekreftelse fra stylisten.",
        };
      case "confirmed":
        return {
          badge: (
            <Badge
              variant="outline"
              className="text-green-600 border-green-200"
            >
              Bekreftet
            </Badge>
          ),
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          description: "Bookingen er bekreftet og klar.",
        };
      case "cancelled":
        return {
          badge: (
            <Badge variant="outline" className="text-red-600 border-red-200">
              Avlyst
            </Badge>
          ),
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          description: booking?.cancellation_reason || "Bookingen er avlyst.",
        };
      case "completed":
        return {
          badge: (
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              Fullført
            </Badge>
          ),
          icon: <CheckCircle className="w-5 h-5 text-blue-600" />,
          description: "Bookingen er fullført.",
        };
      default:
        return {
          badge: <Badge variant="outline">{status}</Badge>,
          icon: <AlertCircle className="w-5 h-5" />,
          description: "",
        };
    }
  };

  const statusInfo = getStatusInfo(booking.status);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake til bookinger
          </Button>
        </div>

        {/* Main Info Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">
                  {services.length > 0 ? services[0].title : "Booking"}
                  {services.length > 1 &&
                    ` +${services.length - 1} tjenester til`}
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  Booking ID: {booking.id}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {statusInfo.icon}
                {statusInfo.badge}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Description */}
            {statusInfo.description && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm">{statusInfo.description}</p>
                {booking.cancelled_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Avlyst{" "}
                    {format(
                      new Date(booking.cancelled_at),
                      "d. MMMM yyyy 'kl.' HH:mm",
                      { locale: nb }
                    )}
                  </p>
                )}
              </div>
            )}

            {/* DateTime and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {format(startTime, "EEEE d. MMMM yyyy", { locale: nb })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isUpcoming ? "Kommende" : "Tidligere"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.total_duration_minutes} minutter totalt
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    {booking.address_id ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          <span className="font-medium">Hjemme hos deg</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Adresse angitt for booking
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">Hos stylisten</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stylist Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Stylist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-lg">
                    {booking.stylist?.full_name || "Ukjent stylist"}
                  </h3>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{booking.stylist?.email}</span>
                    </div>
                    {booking.stylist?.phone_number && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{booking.stylist.phone_number}</span>
                      </div>
                    )}
                  </div>
                  {booking.stylist?.stylist_details?.bio && (
                    <div className="mt-3 text-sm">
                      <p>{booking.stylist.stylist_details.bio}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media Links */}
              {booking.stylist?.stylist_details && (
                <div className="flex gap-2 pt-2">
                  {booking.stylist.stylist_details.instagram_profile && (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={booking.stylist.stylist_details.instagram_profile}
                        target="_blank"
                      >
                        Instagram
                      </Link>
                    </Button>
                  )}
                  {booking.stylist.stylist_details.facebook_profile && (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={booking.stylist.stylist_details.facebook_profile}
                        target="_blank"
                      >
                        Facebook
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle>Tjenester</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={service.id} className="space-y-3">
                  {index > 0 && <Separator />}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{service.title}</h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{service.duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {service.price.toFixed(2)} {service.currency}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message to Stylist */}
        {booking.message_to_stylist && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Melding til stylist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p>{booking.message_to_stylist}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Prissammendrag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.id} className="flex justify-between">
                  <span>{service.title}</span>
                  <span>
                    {service.price.toFixed(2)} {service.currency}
                  </span>
                </div>
              ))}

              {booking.discount_id && booking.discount_applied > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-green-600">
                    <span>Rabatt anvendt</span>
                    <span>-{booking.discount_applied.toFixed(2)} NOK</span>
                  </div>
                </>
              )}

              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Totalt</span>
                <span>{booking.total_price.toFixed(2)} NOK</span>
              </div>

              {/* Payment Status */}
              {booking.payments && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="w-4 h-4" />
                    <span>
                      Betaling:{" "}
                      {booking.payments.status === "succeeded"
                        ? "Fullført"
                        : "Venter"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Link */}
        {booking.chats && Array.isArray(booking.chats) && booking.chats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Du kan chatte med stylisten om denne bookingen.
                </p>
                <Button variant="outline" asChild>
                  <Link href={`/chat/${booking.chats[0].id}`}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Åpne chat
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {isUpcoming && booking.status !== "cancelled" && (
          <Card>
            <CardHeader>
              <CardTitle>Handlinger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {/* TODO: Add cancel booking functionality */}
                <Button variant="outline" disabled>
                  Avlys booking
                </Button>
                {/* TODO: Add reschedule functionality */}
                <Button variant="outline" disabled>
                  Endre tidspunkt
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Disse funksjonene kommer snart
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
