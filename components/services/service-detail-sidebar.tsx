"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Heart, ShoppingCart, TestTube } from "lucide-react";
import type { PublicServiceData } from "@/server/service.actions";
import { StartChatButton } from "@/components/stylist-public-profile/start-chat-button";

interface ServiceDetailSidebarProps {
  service: NonNullable<PublicServiceData>;
}

export function ServiceDetailSidebar({ service }: ServiceDetailSidebarProps) {
  const stylist = service.profiles;

  if (!stylist) {
    return null; // Should not happen with the inner join, but handle gracefully
  }

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? "time" : "timer"}`;
    }
    return `${hours}t ${remainingMinutes}min`;
  };

  return (
    <div className="space-y-4">
      {/* Chat Button */}
      <StartChatButton
        stylistId={stylist.id}
        stylistName={stylist.full_name || "stylisten"}
      />

      {/* Pricing Card */}
      <Card className="sticky top-24">
        <CardHeader>
        <CardTitle className="text-2xl">
          Fra {service.price} {service.currency}
        </CardTitle>
        <CardDescription>Per behandling</CardDescription>
        {service.has_trial_session && (
          <div className="mt-3">
            <Badge variant="secondary" className="text-xs">
              <TestTube className="w-3 h-3 mr-1" />
              Prøvetime tilgjengelig
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          <p>Varighet: {formatDuration(service.duration_minutes)}</p>
          <p className="mt-1">
            Tilgjengelig:{" "}
            {service.at_customer_place && service.at_stylist_place
              ? "Hjemme eller hos stylist"
              : service.at_customer_place
                ? "Hjemme hos deg"
                : "Hos stylist"}
          </p>
          {service.has_trial_session && service.trial_session_price && service.trial_session_duration_minutes && (
            <p className="mt-1">
              Prøvetime: {service.trial_session_price} {service.currency} ({formatDuration(service.trial_session_duration_minutes)})
            </p>
          )}
        </div>

        <AddToCartButton
          service={service}
          stylist={stylist}
          size="lg"
          className="w-full"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Legg til i handlekurv
        </AddToCartButton>

        <Button variant="outline" size="lg" className="w-full">
          <Heart className="w-4 h-4 mr-2" />
          Lagre
        </Button>

        <Separator />

        <div className="text-center text-sm text-muted-foreground">
          <p>✓ Gratis avbestilling frem til 24 timer før</p>
          <p>✓ Sikker betaling</p>
          <p>✓ Kvalitetsgaranti</p>
        </div>
      </CardContent>
      </Card>
    </div>
  );
}
