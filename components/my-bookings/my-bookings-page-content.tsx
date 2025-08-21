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
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
  CheckCircle,
  User,
  Briefcase,
} from "lucide-react";
import { MyBookingsList } from "./my-bookings-list";
import { MyBookingsFilter } from "./my-bookings-filter";
import { useState, useEffect } from "react";

type CustomerTabs = "upcoming" | "completed";
type StylistTabs = "to_be_confirmed" | "planned" | "completed";
type AllTabs = CustomerTabs | StylistTabs;

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
  const [activeTab, setActiveTab] = useState<AllTabs>(
    userRole === "stylist" ? "to_be_confirmed" : "upcoming"
  );

  // Reset tab when switching stylist mode
  useEffect(() => {
    if (stylistMode === "personal") {
      setActiveTab("upcoming" as CustomerTabs);
    } else {
      setActiveTab("to_be_confirmed" as StylistTabs);
    }
  }, [stylistMode]);
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
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

        {/* Mode toggle for stylists */}
        {userRole === "stylist" && (
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
        )}

        {/* Filter */}
        <div className="mb-6">
          <MyBookingsFilter />
        </div>

        {/* Tabs - different logic based on user role and stylist mode */}
        {userRole === "customer" ||
        (userRole === "stylist" && stylistMode === "personal") ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AllTabs)}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Kommende
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Tidligere
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Kommende bookinger</CardTitle>
                  <CardDescription>
                    Bookinger som skal skje i fremtiden
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MyBookingsList
                    userId={userId}
                    dateRange={activeTab}
                    userRole={
                      stylistMode === "personal" ? "customer" : userRole
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tidligere bookinger</CardTitle>
                  <CardDescription>
                    Bookinger som er fullført eller avlyst
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MyBookingsList
                    userId={userId}
                    dateRange={activeTab}
                    userRole={
                      stylistMode === "personal" ? "customer" : userRole
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AllTabs)}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3 max-w-lg">
              <TabsTrigger
                value="to_be_confirmed"
                className="flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Til godkjenning
              </TabsTrigger>
              <TabsTrigger value="planned" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Planlagt
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Fullført
              </TabsTrigger>
            </TabsList>

            <TabsContent value="to_be_confirmed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Forespørsler til godkjenning</CardTitle>
                  <CardDescription>
                    Bookinger som venter på din godkjenning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MyBookingsList
                    userId={userId}
                    dateRange={activeTab}
                    userRole="stylist"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="planned" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Planlagte bookinger</CardTitle>
                  <CardDescription>
                    Godkjente bookinger som skal gjennomføres
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MyBookingsList
                    userId={userId}
                    dateRange={activeTab}
                    userRole="stylist"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fullførte bookinger</CardTitle>
                  <CardDescription>
                    Bookinger som er fullført eller avlyst
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MyBookingsList
                    userId={userId}
                    dateRange={activeTab}
                    userRole="stylist"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
