"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookingDetails } from "@/server/booking/crud.actions";
import { getAddress } from "@/server/addresses.actions";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  Star,
  Receipt,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  FileText,
  Plus,
  TestTube,
  ArrowRight,
  Link as LinkIcon,
  Facebook,
  Youtube,
  Edit,
  Copy,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { BookingStatusDialog } from "./booking-status-dialog";
import { BookingActionsDropdown } from "./booking-actions-dropdown";
import { BookingDetailsSkeleton } from "./booking-details-skeleton";
import { BookingNoteDialog } from "../booking/booking-note-dialog";
import { BookingNoteCard } from "../booking/booking-note-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getBookingNotes } from "@/server/booking-note.actions";
import { ReviewDialog } from "@/components/reviews/review-dialog";
import { getReviewByBookingId } from "@/server/review.actions";
import { Database } from "@/types/database.types";
import { BlurFade } from "@/components/magicui/blur-fade";
import {
  getPlatformFromUrl,
  getSocialMediaDisplayName,
} from "@/lib/social-media";
import {
  BookingPricingDisplay,
  getPricingBreakdown,
} from "@/lib/booking-pricing-display";
import { formatCurrency } from "@/lib/booking-calculations";
import {
  FaFacebook,
  FaInstagram,
  FaSnapchatGhost,
  FaTiktok,
} from "react-icons/fa";

interface BookingDetailsContentProps {
  bookingId: string;
  userId: string;
  userRole?: "customer" | "stylist" | "admin";
}

type BookingNote = Database["public"]["Tables"]["booking_notes"]["Row"] & {
  stylist: {
    id: string;
    full_name: string | null;
  } | null;
};

export function BookingDetailsContent({
  bookingId,
  userId,
  userRole = "customer",
}: BookingDetailsContentProps) {
  const router = useRouter();
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isBookingNotesDialogOpen, setIsBookingNotesDialogOpen] =
    useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<BookingNote | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    data: bookingResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["booking-details", bookingId],
    queryFn: () => getBookingDetails(bookingId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch booking notes (for stylists and admins)
  const {
    data: bookingNotesResponse,
    isLoading: notesLoading,
    error: notesError,
  } = useQuery({
    queryKey: ["booking-notes", bookingId],
    queryFn: () => getBookingNotes(bookingId),
    enabled: userRole === "stylist" || userRole === "admin", // Load for stylists and admins
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch address details if booking has an address_id
  const { data: addressData, isLoading: addressLoading } = useQuery({
    queryKey: ["address", bookingResponse?.data?.address_id],
    queryFn: () =>
      bookingResponse?.data?.address_id
        ? getAddress(bookingResponse.data.address_id)
        : null,
    enabled: !!bookingResponse?.data?.address_id,
  });

  // Check if there's an existing review for this booking
  const { data: reviewResponse } = useQuery({
    queryKey: ["review", bookingId],
    queryFn: () => getReviewByBookingId(bookingId),
    enabled:
      bookingResponse?.data?.status === "completed" && userRole === "customer",
  });

  if (isLoading) {
    return <BookingDetailsSkeleton />;
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
  const address = addressData?.data;
  const existingReview = reviewResponse?.data;
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
              className="text-yellow-600 border-yellow-400 dark:text-yellow-400 dark:border-yellow-800 w-fit"
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
              className="text-green-600 border-green-200 dark:text-green-400 dark:border-green-800 w-fit"
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
            <Badge
              variant="outline"
              className="text-red-600 border-red-200 dark:text-red-400 dark:border-red-800 w-fit"
            >
              Avlyst
            </Badge>
          ),
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          description: booking?.cancellation_reason || "Bookingen er avlyst.",
        };
      case "completed":
        return {
          badge: (
            <Badge
              variant="outline"
              className="text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800"
            >
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

  const handleCopyBookingId = async () => {
    try {
      await navigator.clipboard.writeText(booking.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy booking ID:", error);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="max-w-4xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Header */}
        <BlurFade delay={0.1} duration={0.5}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
            <Button variant="ghost" asChild className="shrink-0">
              <Link
                href={`/profiler/${userId}/mine-bookinger`}
                className="flex items-center gap-1 sm:gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Tilbake til bookinger</span>
                <span className="sm:hidden">Tilbake</span>
              </Link>
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyBookingId}
                className="h-auto p-2 text-sm text-muted-foreground hover:text-foreground w-full sm:w-auto"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Kopier ID
                  </>
                )}
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link
                  href={`/bookinger/${booking.id}/chat`}
                  className="flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Åpne chat</span>
                </Link>
              </Button>
            </div>
          </div>
        </BlurFade>

        {/* Main Info Card */}
        <BlurFade delay={0.15} duration={0.5}>
          <Card>
            <CardHeader className="pb-3 px-3 sm:px-6">
              <div className="flex flex-col gap-4">
                {/* Badges and Actions Row */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {booking.is_trial_session && (
                      <Badge
                        variant="outline"
                        className="text-purple-600 bg-purple-50/30 border-purple-200 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-800"
                      >
                        <TestTube className="w-3 h-3 mr-1" />
                        Prøvetime
                      </Badge>
                    )}
                    {!booking.is_trial_session && booking.trial_booking && (
                      <Badge
                        variant="outline"
                        className="text-blue-600 bg-blue-50/30 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800"
                      >
                        <TestTube className="w-3 h-3 mr-1" />
                        Har prøvetime
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center flex-col sm:flex-row w-full gap-2 flex-wrap sm:shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      {statusInfo.icon}
                      {statusInfo.badge}
                    </div>
                    {/* Actions dropdown for both customers and stylists */}
                    <BookingActionsDropdown
                      booking={{
                        id: booking.id,
                        customer_id: booking.customer_id,
                        stylist_id: booking.stylist_id,
                        start_time: booking.start_time,
                        end_time: booking.end_time,
                        total_price: booking.total_price,
                        status: booking.status,
                      }}
                      currentUserId={userId}
                      userRole={userRole}
                      serviceName={services[0]?.title || "Booking"}
                      customerName={booking.customer?.full_name || "Kunde"}
                    />
                    {/* Stylist actions for pending bookings, or admin actions */}
                    {((userRole === "stylist" &&
                      booking.status === "pending") ||
                      userRole === "admin") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsStatusDialogOpen(true)}
                        className="text-xs sm:text-sm w-full sm:w-auto"
                      >
                        <Settings className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">
                          {userRole === "admin" ? "Admin" : "Administrer"}
                        </span>
                        <span className="sm:hidden">Administrer</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <CardTitle className="text-xl sm:text-2xl break-words leading-tight">
                    {booking.is_trial_session ? "Prøvetime: " : ""}
                    {services.length > 0 ? services[0].title : "Booking"}
                    {services.length > 1 &&
                      ` +${services.length - 1} tjenester til`}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
              {/* Status Description */}
              {statusInfo.description && (
                <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm break-words">
                    {statusInfo.description}
                  </p>
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
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium break-words">
                        {format(startTime, "EEEE d. MMMM yyyy", { locale: nb })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {isUpcoming ? "Kommende" : "Tidligere"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {format(startTime, "HH:mm")} -{" "}
                        {format(endTime, "HH:mm")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.total_duration_minutes} minutter totalt
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                {booking.address_id && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="space-y-1 min-w-0 flex-1">
                        {addressLoading ? (
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        ) : address ? (
                          <div>
                            <div className="font-medium">Adresse</div>
                            <div className="text-sm text-muted-foreground">
                              <p className="break-words">
                                {address.street_address}
                              </p>
                              <p>
                                {address.postal_code} {address.city}
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        {/* Trial Session Information - shown when viewing main booking */}
        {booking.trial_booking && (
          <BlurFade delay={0.18} duration={0.5}>
            <Card className="border-purple-200 bg-purple-50/30 dark:border-purple-800 dark:bg-purple-900/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                  <TestTube className="w-5 h-5" />
                  Tilknyttet prøvetime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {format(
                          new Date(booking.trial_booking.start_time),
                          "EEEE d. MMMM yyyy",
                          { locale: nb }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {format(
                          new Date(booking.trial_booking.start_time),
                          "HH:mm"
                        )}{" "}
                        -{" "}
                        {format(
                          new Date(booking.trial_booking.end_time),
                          "HH:mm"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <Badge
                        variant="outline"
                        className={
                          booking.trial_booking.status === "completed"
                            ? "text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800"
                            : booking.trial_booking.status === "confirmed"
                              ? "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800"
                              : booking.trial_booking.status === "pending"
                                ? "text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800"
                                : "text-red-600 border-red-200 dark:text-red-400 dark:border-red-800"
                        }
                      >
                        {booking.trial_booking.status === "pending" && "Venter"}
                        {booking.trial_booking.status === "confirmed" &&
                          "Bekreftet"}
                        {booking.trial_booking.status === "completed" &&
                          "Fullført"}
                        {booking.trial_booking.status === "cancelled" &&
                          "Avlyst"}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/bookinger/${booking.trial_booking.id}`}>
                        Se prøvetime
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        )}

        {/* Main Booking Information - shown when viewing trial session */}
        {booking.main_booking && (
          <BlurFade delay={0.18} duration={0.5}>
            <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-900/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <LinkIcon className="w-5 h-5" />
                  Tilknyttet hovedbooking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {format(
                          new Date(booking.main_booking.start_time),
                          "EEEE d. MMMM yyyy",
                          { locale: nb }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {format(
                          new Date(booking.main_booking.start_time),
                          "HH:mm"
                        )}{" "}
                        -{" "}
                        {format(
                          new Date(booking.main_booking.end_time),
                          "HH:mm"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Show main booking services */}
                  {booking.main_booking.booking_services &&
                    booking.main_booking.booking_services.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Tjenester:</h4>
                        <div className="space-y-1">
                          {booking.main_booking.booking_services.map(
                            (bs: any) => (
                              <div
                                key={bs.service.id}
                                className="flex justify-between text-sm"
                              >
                                <span>{bs.service.title}</span>
                                <span className="text-muted-foreground">
                                  {bs.service.price} {bs.service.currency}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <Badge
                        variant="outline"
                        className={
                          booking.main_booking.status === "completed"
                            ? "text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800"
                            : booking.main_booking.status === "confirmed"
                              ? "text-green-600 border-green-200 dark:text-green-400 dark:border-green-800"
                              : booking.main_booking.status === "pending"
                                ? "text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800"
                                : "text-red-600 border-red-200 dark:text-red-400 dark:border-red-800"
                        }
                      >
                        {booking.main_booking.status === "pending" && "Venter"}
                        {booking.main_booking.status === "confirmed" &&
                          "Bekreftet"}
                        {booking.main_booking.status === "completed" &&
                          "Fullført"}
                        {booking.main_booking.status === "cancelled" &&
                          "Avlyst"}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/bookinger/${booking.main_booking.id}`}>
                        Se hovedbooking
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        )}

        {/* Stylist Info */}
        <BlurFade delay={0.2} duration={0.5}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Stylist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* User Avatar - centered on mobile, inline on desktop */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto sm:mx-0 shrink-0">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 w-full space-y-4">
                    <div className="text-center sm:text-left">
                      <h3 className="font-medium text-lg">
                        {booking.stylist?.full_name || "Ukjent stylist"}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <Mail className="w-4 h-4" />
                          <span className="break-all">{booking.stylist?.email}</span>
                        </div>
                      </div>
                      {booking.stylist?.phone_number && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <Phone className="w-4 h-4" />
                            <span>{booking.stylist.phone_number}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {booking.stylist?.stylist_details?.bio && (
                      <div className="text-sm text-center sm:text-left">
                        <p className="break-words">{booking.stylist.stylist_details.bio}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Media Links */}
                {booking.stylist?.stylist_details && (
                  <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 pt-2">
                    {booking.stylist.stylist_details.instagram_profile && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full sm:w-auto"
                      >
                        <Link
                          href={
                            booking.stylist.stylist_details.instagram_profile
                          }
                          target="_blank"
                          className="flex gap-1 sm:gap-2 items-center justify-center sm:justify-start text-xs sm:text-sm"
                        >
                          <FaInstagram className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {getSocialMediaDisplayName(
                              "instagram",
                              booking.stylist.stylist_details.instagram_profile
                            )}
                          </span>
                          <span className="sm:hidden">Instagram</span>
                        </Link>
                      </Button>
                    )}
                    {booking.stylist.stylist_details.facebook_profile && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full sm:w-auto"
                      >
                        <Link
                          href={
                            booking.stylist.stylist_details.facebook_profile
                          }
                          target="_blank"
                          className="flex gap-1 sm:gap-2 items-center justify-center sm:justify-start text-xs sm:text-sm"
                        >
                          <Facebook className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {getSocialMediaDisplayName(
                              "facebook",
                              booking.stylist.stylist_details.facebook_profile
                            )}
                          </span>
                          <span className="sm:hidden">Facebook</span>
                        </Link>
                      </Button>
                    )}

                    {booking.stylist.stylist_details.youtube_profile && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full sm:w-auto"
                      >
                        <Link
                          href={booking.stylist.stylist_details.youtube_profile}
                          target="_blank"
                          className="flex gap-1 sm:gap-2 items-center justify-center sm:justify-start text-xs sm:text-sm"
                        >
                          <Youtube className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {getSocialMediaDisplayName(
                              "youtube",
                              booking.stylist.stylist_details.youtube_profile
                            )}
                          </span>
                          <span className="sm:hidden">YouTube</span>
                        </Link>
                      </Button>
                    )}

                    {booking.stylist.stylist_details.tiktok_profile && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full sm:w-auto"
                      >
                        <Link
                          href={booking.stylist.stylist_details.tiktok_profile}
                          target="_blank"
                          className="flex gap-1 sm:gap-2 items-center justify-center sm:justify-start text-xs sm:text-sm"
                        >
                          <FaTiktok className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {getSocialMediaDisplayName(
                              "tiktok",
                              booking.stylist.stylist_details.tiktok_profile
                            )}
                          </span>
                          <span className="sm:hidden">TikTok</span>
                        </Link>
                      </Button>
                    )}

                    {booking.stylist.stylist_details.snapchat_profile && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full sm:w-auto"
                      >
                        <Link
                          href={
                            booking.stylist.stylist_details.snapchat_profile
                          }
                          target="_blank"
                          className="flex gap-1 sm:gap-2 items-center justify-center sm:justify-start text-xs sm:text-sm"
                        >
                          <FaSnapchatGhost className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {getSocialMediaDisplayName(
                              "snapchat",
                              booking.stylist.stylist_details.snapchat_profile
                            )}
                          </span>
                          <span className="sm:hidden">Snapchat</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        {/* Services */}
        <BlurFade delay={0.25} duration={0.5}>
          <Card>
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">Tjenester</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={service.id} className="space-y-3">
                    {index > 0 && <Separator />}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium break-words">
                          {service.title}
                        </h3>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-1 break-words">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{service.duration_minutes} min</span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <div className="font-semibold text-lg sm:text-base">
                          {service.price.toFixed(2)} {service.currency}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        {/* Message to Stylist */}
        {booking.message_to_stylist && (
          <BlurFade delay={0.3} duration={0.5}>
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
          </BlurFade>
        )}

        {/* Pricing Summary */}
        <BlurFade delay={0.35} duration={0.5}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                {booking.is_trial_session
                  ? "Prøvetime prissammendrag"
                  : "Prissammendrag"}
              </CardTitle>
              {booking.is_trial_session && (
                <CardDescription>
                  Dette er prisen for prøvetimen. Hovedbookingen har egne
                  priser.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Service breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Tjenester
                  </h4>
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{service.title}</span>
                        <div className="text-sm text-muted-foreground">
                          {service.duration_minutes} min
                        </div>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(service.price)}
                      </span>
                    </div>
                  ))}
                </div>

                {(() => {
                  // Calculate pricing breakdown
                  const payment = Array.isArray(booking.payments)
                    ? booking.payments[0]
                    : booking.payments;
                  const breakdown = getPricingBreakdown(
                    {
                      total_price: booking.total_price,
                      discount_applied: booking.discount_applied || 0,
                      is_trial_session: booking.is_trial_session,
                    },
                    payment,
                    booking.discount
                  );

                  return (
                    <>
                      {/* Subtotal */}
                      <Separator />
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(breakdown.originalAmount)}</span>
                      </div>

                      {/* Discount */}
                      {breakdown.hasDiscount && (
                        <div className="flex justify-between text-green-600">
                          <span>
                            Rabatt anvendt
                            {breakdown.discountCode && (
                              <span className="text-muted-foreground ml-1">
                                ({breakdown.discountCode})
                              </span>
                            )}
                          </span>
                          <span>
                            -{formatCurrency(breakdown.discountAmount)}
                          </span>
                        </div>
                      )}

                      {/* Total */}
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">
                          {booking.is_trial_session ? "Prøvepris" : "Totalt"}
                        </span>
                        <div className="text-right">
                          <BookingPricingDisplay
                            booking={{
                              total_price: booking.total_price,
                              discount_applied: booking.discount_applied || 0,
                              is_trial_session: booking.is_trial_session,
                            }}
                            payment={payment}
                            discount={booking.discount}
                            options={{ showDiscountCode: false }}
                          />
                        </div>
                      </div>

                      {/* Trial session pricing explanation */}
                      {booking.is_trial_session && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="flex items-start gap-2">
                            <TestTube className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                                Prøvetime
                              </p>
                              <p className="text-purple-700 dark:text-purple-300">
                                Dette er en redusert pris for å prøve tjenesten.
                                {booking.main_booking && (
                                  <span className="ml-1">
                                    Hovedbookingen har full pris for alle
                                    tjenester.
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Main booking pricing note when viewing main booking with trial */}
                      {!booking.is_trial_session && booking.trial_booking && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <LinkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                                Hovedbooking
                              </p>
                              <p className="text-blue-700 dark:text-blue-300">
                                Dette er full pris for alle tjenester.
                                Prøvetimen har egen redusert pris.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Payment Status */}
                {(() => {
                  const payment = Array.isArray(booking.payments)
                    ? booking.payments[0]
                    : booking.payments;
                  if (!payment) return null;

                  return (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="w-4 h-4" />
                        <span>
                          Betaling:{" "}
                          <span
                            className={
                              payment.status === "succeeded"
                                ? "text-green-600"
                                : "text-yellow-600"
                            }
                          >
                            {payment.status === "succeeded"
                              ? "Fullført"
                              : "Venter"}
                          </span>
                        </span>
                        {payment.status === "succeeded" &&
                          payment.succeeded_at && (
                            <span className="text-muted-foreground ml-2">
                              •{" "}
                              {format(
                                new Date(payment.succeeded_at),
                                "d. MMM yyyy",
                                { locale: nb }
                              )}
                            </span>
                          )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        {/* Review Actions - For customers with completed bookings */}
        {userRole === "customer" && booking.status === "completed" && (
          <BlurFade delay={0.4} duration={0.5}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Anmeldelse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1">
                    <p className="text-muted-foreground">
                      {existingReview
                        ? "Du har gitt en anmeldelse for denne bookingen. Du kan endre den hvis du ønsker."
                        : "Del din opplevelse med andre kunder ved å gi en anmeldelse av denne tjenesten."}
                    </p>
                  </div>
                  <Button
                    variant={existingReview ? "outline" : "default"}
                    onClick={() => setIsReviewDialogOpen(true)}
                    className="shrink-0"
                  >
                    {existingReview ? (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Endre anmeldelse
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 mr-2" />
                        Gi anmeldelse
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        )}

        {/* Booking Notes - For stylists and admins */}
        {(userRole === "stylist" || userRole === "admin") && (
          <BlurFade delay={0.4} duration={0.5}>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Bookingnotater
                  </CardTitle>
                  {/* Only stylists can create booking notes, admins can only view */}
                  {userRole === "stylist" && (
                    <Button
                      variant="outline"
                      onClick={() => setIsBookingNotesDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Opprett notat
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {notesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Laster notater...</span>
                  </div>
                ) : notesError ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span>Feil ved lasting av notater</span>
                  </div>
                ) : bookingNotesResponse?.data &&
                  bookingNotesResponse.data.length > 0 ? (
                  <ScrollArea className="h-[42rem] w-full rounded-md border p-4">
                    <div className="space-y-4">
                      {bookingNotesResponse.data.map((note) => (
                        <BookingNoteCard
                          key={note.id}
                          note={note}
                          onEdit={
                            userRole === "stylist"
                              ? () => {
                                  setEditingNote(note);
                                  setIsBookingNotesDialogOpen(true);
                                }
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">
                      Ingen notater ennå
                    </h3>
                    <p className="text-sm text-center mb-4">
                      {userRole === "admin"
                        ? "Ingen notater er opprettet for denne bookingen ennå."
                        : "Opprett ditt første bookingnotat for å dokumentere tjenesten og dele informasjon med kunden."}
                    </p>
                    {userRole === "stylist" && (
                      <Button
                        variant="outline"
                        onClick={() => setIsBookingNotesDialogOpen(true)}
                      >
                        Opprett notat
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </BlurFade>
        )}
      </div>

      {/* Status Dialog for Stylists and Admins */}
      {(userRole === "stylist" || userRole === "admin") && (
        <BookingStatusDialog
          bookingId={booking.id}
          currentStatus={booking.status}
          customerName={booking.customer?.full_name || "Kunde"}
          serviceName={services.length > 0 ? services[0].title : "Booking"}
          isOpen={isStatusDialogOpen}
          onOpenChange={setIsStatusDialogOpen}
        />
      )}

      {/* Booking Notes Dialog */}
      {userRole === "stylist" && (
        <BookingNoteDialog
          open={isBookingNotesDialogOpen}
          onOpenChange={(open) => {
            setIsBookingNotesDialogOpen(open);
            if (!open) {
              setEditingNote(null);
            }
          }}
          bookingId={bookingId}
          stylistId={userId}
          isEditing={!!editingNote}
          editingNote={editingNote || undefined}
          onEditComplete={() => {
            setEditingNote(null);
          }}
        />
      )}

      {/* Review Dialog for Customers */}
      {userRole === "customer" && booking.status === "completed" && (
        <ReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          bookingId={bookingId}
          stylistName={booking.stylist?.full_name || "Stylisten"}
          serviceTitles={services.map((s) => s?.title || "Tjeneste")}
          existingReview={existingReview}
        />
      )}
    </div>
  );
}
