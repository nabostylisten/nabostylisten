"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, BookOpen } from "lucide-react";
import { MyBookingsList } from "./my-bookings-list";
import { MyBookingsFilter } from "./my-bookings-filter";

interface MyBookingsPageContentProps {
  userId: string;
}

export function MyBookingsPageContent({ userId }: MyBookingsPageContentProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Mine bookinger</h1>
            <p className="text-muted-foreground mt-1">
              Oversikt over dine kommende og tidligere bookinger
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <MyBookingsFilter />
        </div>

        {/* Tabs for upcoming and completed bookings */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Kommende
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
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
                  dateRange="upcoming"
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
                  dateRange="completed"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}