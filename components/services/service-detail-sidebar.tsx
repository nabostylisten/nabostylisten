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
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Heart, ShoppingCart } from "lucide-react";
import type { PublicServiceData } from "@/server/service.actions";

interface ServiceDetailSidebarProps {
  service: NonNullable<PublicServiceData>;
}

export function ServiceDetailSidebar({ service }: ServiceDetailSidebarProps) {
  const stylist = service.profiles;
  
  if (!stylist) {
    return null; // Should not happen with the inner join, but handle gracefully
  }
  
  // Format price from øre to NOK
  const formatPrice = (priceInOre: number) => {
    return new Intl.NumberFormat("no-NO", {
      style: "currency",
      currency: "NOK",
      minimumFractionDigits: 0,
    }).format(priceInOre / 100);
  };

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
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="text-2xl">
          Fra {formatPrice(service.price)}
        </CardTitle>
        <CardDescription>Per behandling</CardDescription>
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
  );
}