"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  User,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { MyBookingsList } from "./my-bookings-list";
import { MyBookingsFilter } from "./my-bookings-filter";
import { useState, useEffect } from "react";
import { BookingsWithoutReviewsAlerts } from "../reviews/bookings-without-reviews-alerts";
import { BlurFade } from "@/components/magicui/blur-fade";
import { useQuery } from "@tanstack/react-query";
import { getBookingCounts } from "@/server/booking/crud.actions";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

interface MyBookingsPageContentProps {
  userId: string;
  userRole?: "customer" | "stylist";
}

export function MyBookingsPageContent({
  userId,
  userRole = "customer",
}: MyBookingsPageContentProps) {
  // State to toggle between personal bookings (as customer) and stylist services
  // Default to 'services' for stylists, 'personal' for customers
  const [stylistMode, setStylistMode] = useState<"personal" | "services">(
    userRole === "stylist" ? "services" : "personal"
  );

  // State for active tab - needs to reset when switching modes
  const [activeTab, setActiveTab] = useState<BookingStatus>("pending");

  // Determine effective role based on stylist mode
  const effectiveRole = stylistMode === "personal" ? "customer" : userRole;

  // Fetch booking counts
  const { data: bookingCounts, isLoading: isLoadingCounts } = useQuery({
    queryKey: ["booking-counts", userId, effectiveRole],
    queryFn: async () => {
      const result = await getBookingCounts(userId, effectiveRole);
      if (result.error) {
        console.error("Error fetching booking counts:", result.error);
        return null;
      }
      return result.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Reset tab when switching stylist mode
  useEffect(() => {
    setActiveTab("pending");
  }, [stylistMode]);
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">
                {userRole === "stylist"
                  ? stylistMode === "personal"
                    ? "Mine bookinger"
                    : "Mine kunder"
                  : "Mine bookinger"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {userRole === "stylist"
                  ? stylistMode === "personal"
                    ? "Dine egne bookinger som kunde"
                    : "Administrer dine kunders bookinger og forespørsler"
                  : "Oversikt over dine kommende og tidligere bookinger"}
              </p>
            </div>
          </div>
        </BlurFade>

        {/* Show review alerts for customers only */}
        {userRole === "customer" && (
          <BlurFade delay={0.15} duration={0.5} inView>
            <BookingsWithoutReviewsAlerts
              customerId={userId}
              className="my-4"
            />
          </BlurFade>
        )}

        {/* Mode toggle for stylists */}
        {userRole === "stylist" && (
          <BlurFade delay={0.2} duration={0.5} inView>
            <div className="mb-6">
              <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
                <Button
                  variant={stylistMode === "personal" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStylistMode("personal")}
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Mine bookinger
                </Button>
                <Button
                  variant={stylistMode === "services" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStylistMode("services")}
                  className="flex items-center gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  Mine kunder
                </Button>
              </div>
            </div>
          </BlurFade>
        )}

        {/* Filter */}
        <BlurFade delay={0.25} duration={0.5} inView>
          <div className="mb-6">
            <MyBookingsFilter />
          </div>
        </BlurFade>

        {/* Status Tabs */}
        <BlurFade delay={0.1} duration={0.5} inView>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as BookingStatus)}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Venter</span>
                {isLoadingCounts ? (
                  <Skeleton className="ml-1 h-5 w-5 rounded-full" />
                ) : bookingCounts ? (
                  <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                    {effectiveRole === "stylist"
                      ? "to_be_confirmed" in bookingCounts
                        ? bookingCounts.to_be_confirmed
                        : 0
                      : "pending" in bookingCounts
                        ? bookingCounts.pending
                        : 0}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="confirmed"
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Bekreftet</span>
                {isLoadingCounts ? (
                  <Skeleton className="ml-1 h-5 w-5 rounded-full" />
                ) : bookingCounts ? (
                  <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                    {effectiveRole === "stylist"
                      ? "planned" in bookingCounts
                        ? bookingCounts.planned
                        : 0
                      : "confirmed" in bookingCounts
                        ? bookingCounts.confirmed
                        : 0}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="cancelled"
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Avlyst</span>
                {isLoadingCounts ? (
                  <Skeleton className="ml-1 h-5 w-5 rounded-full" />
                ) : bookingCounts && "cancelled" in bookingCounts ? (
                  <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                    {bookingCounts.cancelled}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>Fullført</span>
                {isLoadingCounts ? (
                  <Skeleton className="ml-1 h-5 w-5 rounded-full" />
                ) : bookingCounts && "completed" in bookingCounts ? (
                  <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                    {bookingCounts.completed}
                  </Badge>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              <BlurFade delay={0.1} duration={0.5} inView>
                <Card>
                  <CardHeader>
                    <CardTitle>Ventende bookinger</CardTitle>
                    <CardDescription>
                      Bookinger som venter på godkjenning
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MyBookingsList
                      userId={userId}
                      status={activeTab}
                      userRole={
                        stylistMode === "personal" ? "customer" : userRole
                      }
                    />
                  </CardContent>
                </Card>
              </BlurFade>
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-4">
              <BlurFade delay={0.1} duration={0.5} inView>
                <Card>
                  <CardHeader>
                    <CardTitle>Bekreftede bookinger</CardTitle>
                    <CardDescription>
                      Bookinger som er bekreftet og planlagt
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MyBookingsList
                      userId={userId}
                      status={activeTab}
                      userRole={
                        stylistMode === "personal" ? "customer" : userRole
                      }
                    />
                  </CardContent>
                </Card>
              </BlurFade>
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              <BlurFade delay={0.1} duration={0.5} inView>
                <Card>
                  <CardHeader>
                    <CardTitle>Avlyste bookinger</CardTitle>
                    <CardDescription>
                      Bookinger som har blitt avlyst
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MyBookingsList
                      userId={userId}
                      status={activeTab}
                      userRole={
                        stylistMode === "personal" ? "customer" : userRole
                      }
                    />
                  </CardContent>
                </Card>
              </BlurFade>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <BlurFade delay={0.1} duration={0.5} inView>
                <Card>
                  <CardHeader>
                    <CardTitle>Fullførte bookinger</CardTitle>
                    <CardDescription>Bookinger som er fullført</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MyBookingsList
                      userId={userId}
                      status={activeTab}
                      userRole={
                        stylistMode === "personal" ? "customer" : userRole
                      }
                    />
                  </CardContent>
                </Card>
              </BlurFade>
            </TabsContent>
          </Tabs>
        </BlurFade>
      </div>
    </div>
  );
}
