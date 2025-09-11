"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReviewsList } from "./reviews-list";
import { Star, MessageSquare } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";

interface ReviewsPageContentProps {
  userId: string;
  userRole?: "customer" | "stylist";
}

export function ReviewsPageContent({
  userId,
  userRole = "customer",
}: ReviewsPageContentProps) {
  const [activeTab, setActiveTab] = useState<string>(
    userRole === "customer" ? "written" : "received"
  );

  if (userRole === "customer") {
    // Customer view: only show reviews they've written
    return (
      <div className="space-y-6">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold break-words">Mine anmeldelser</h1>
            <p className="text-sm sm:text-base text-muted-foreground break-words">
              Anmeldelser jeg har skrevet for stylister jeg har brukt
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} duration={0.5} inView>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Mine anmeldelser
              </CardTitle>
              <CardDescription>
                Alle anmeldelser du har skrevet for stylister
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewsList 
                userId={userId} 
                viewType="customer" 
                showFilters={true}
              />
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    );
  }

  // Stylist view: tabs for reviews written vs received
  return (
    <div className="space-y-6">
      <BlurFade delay={0.1} duration={0.5} inView>
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold break-words">Anmeldelser</h1>
          <p className="text-sm sm:text-base text-muted-foreground break-words hyphens-auto">
            Administrer anmeldelser du har mottatt og skrevet
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.15} duration={0.5} inView>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Mottatt
            </TabsTrigger>
            <TabsTrigger value="written" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Skrevet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-6">
            <BlurFade delay={0.1} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Anmeldelser du har mottatt
                  </CardTitle>
                  <CardDescription>
                    Anmeldelser fra kunder som har brukt tjenestene dine
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReviewsList 
                    userId={userId} 
                    viewType="stylist" 
                    showFilters={true}
                  />
                </CardContent>
              </Card>
            </BlurFade>
          </TabsContent>

          <TabsContent value="written" className="space-y-6">
            <BlurFade delay={0.1} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Anmeldelser du har skrevet
                  </CardTitle>
                  <CardDescription>
                    Anmeldelser du har skrevet som kunde av andre stylister
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReviewsList 
                    userId={userId} 
                    viewType="customer" 
                    showFilters={true}
                  />
                </CardContent>
              </Card>
            </BlurFade>
          </TabsContent>
        </Tabs>
      </BlurFade>
    </div>
  );
}