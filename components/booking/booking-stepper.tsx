"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  MessageSquare,
  Percent,
} from "lucide-react";
import { defineStepper } from "@/components/stepper";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookingScheduler } from "@/components/booking/booking-scheduler";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const { Stepper } = defineStepper(
  {
    id: "time-selection",
    title: "1. Velg tidspunkt",
    description: "Finn ledig tid hos stylisten",
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    id: "location-details",
    title: "2. Lokasjon",
    description: "Hvor skal tjenesten utføres",
    icon: <MapPin className="w-4 h-4" />,
  },
  {
    id: "message-discount",
    title: "3. Melding og rabatt",
    description: "Tilleggsinfo og rabattkoder",
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    id: "payment",
    title: "4. Betaling",
    description: "Fullfør bookingen",
    icon: <CreditCard className="w-4 h-4" />,
  }
);

interface BookingData {
  startTime?: Date;
  endTime?: Date;
  location: "stylist" | "customer";
  customerAddress?: string;
  messageToStylist?: string;
  discountCode?: string;
}

interface BookingStepperProps {
  stylistId: string;
  serviceDurationMinutes: number;
  stylistCanTravel: boolean;
  stylistHasOwnPlace: boolean;
  onComplete: (bookingData: BookingData) => void;
}

export function BookingStepper({
  stylistId,
  serviceDurationMinutes,
  stylistCanTravel,
  stylistHasOwnPlace,
  onComplete,
}: BookingStepperProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [bookingData, setBookingData] = useState<BookingData>({
    location: stylistHasOwnPlace ? "stylist" : "customer",
  });

  const handleTimeSlotSelect = (startTime: Date, endTime: Date) => {
    setBookingData((prev) => ({ ...prev, startTime, endTime }));
  };

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...updates }));
  };

  const canProceedFromStep = (stepId: string) => {
    switch (stepId) {
      case "time-selection":
        return bookingData.startTime && bookingData.endTime;
      case "location-details":
        return (
          bookingData.location &&
          (bookingData.location === "stylist" ||
            (bookingData.location === "customer" &&
              bookingData.customerAddress))
        );
      case "message-discount":
        return true; // Optional fields
      default:
        return true;
    }
  };

  const isStepAccessible = (stepId: string) => {
    switch (stepId) {
      case "time-selection":
        return true; // First step is always accessible
      case "location-details":
        return canProceedFromStep("time-selection");
      case "message-discount":
        return (
          canProceedFromStep("time-selection") &&
          canProceedFromStep("location-details")
        );
      case "payment":
        return (
          canProceedFromStep("time-selection") &&
          canProceedFromStep("location-details") &&
          canProceedFromStep("message-discount")
        );
      default:
        return false;
    }
  };

  return (
    <div className="w-full">
      {/* Selected time display - moved above stepper */}
      {bookingData.startTime && bookingData.endTime && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Clock className="w-4 h-4" />
                <span className="font-medium">
                  Valgt tid:{" "}
                  {format(bookingData.startTime, "EEEE d. MMMM, HH:mm", {
                    locale: nb,
                  })}{" "}
                  - {format(bookingData.endTime, "HH:mm")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Stepper.Provider
        className="space-y-6"
        variant={isMobile ? "vertical" : "horizontal"}
      >
        {({ methods }) => (
          <>
            <Stepper.Navigation>
              {methods.all.map((step) => (
                <Stepper.Step
                  key={step.id}
                  of={step.id}
                  onClick={() => {
                    if (isStepAccessible(step.id)) {
                      methods.goTo(step.id);
                    }
                  }}
                  icon={step.icon}
                  disabled={!isStepAccessible(step.id)}
                >
                  <Stepper.Title className="text-xs">
                    {step.title}
                  </Stepper.Title>
                  <Stepper.Description className="text-xs">
                    {step.description}
                  </Stepper.Description>
                  {isMobile &&
                    methods.when(step.id, () => (
                      <div className="mt-4">{renderStepContent(step.id)}</div>
                    ))}
                </Stepper.Step>
              ))}
            </Stepper.Navigation>

            {!isMobile &&
              methods.switch({
                "time-selection": () => renderStepContent("time-selection"),
                "location-details": () => renderStepContent("location-details"),
                "message-discount": () => renderStepContent("message-discount"),
                payment: () => renderStepContent("payment"),
              })}

            <Stepper.Controls>
              <Button
                variant="outline"
                onClick={methods.prev}
                disabled={methods.isFirst}
              >
                Tilbake
              </Button>
              <Button
                onClick={() => {
                  if (methods.isLast) {
                    onComplete(bookingData);
                  } else {
                    methods.next();
                  }
                }}
                disabled={!canProceedFromStep(methods.current.id)}
              >
                {methods.isLast ? "Fullfør booking" : "Neste"}
              </Button>
            </Stepper.Controls>
          </>
        )}
      </Stepper.Provider>
    </div>
  );

  function renderStepContent(stepId: string) {
    switch (stepId) {
      case "time-selection":
        return (
          <Stepper.Panel>
            <BookingScheduler
              stylistId={stylistId}
              serviceDurationMinutes={serviceDurationMinutes}
              onTimeSlotSelect={handleTimeSlotSelect}
              selectedStartTime={bookingData.startTime}
            />
          </Stepper.Panel>
        );

      case "location-details":
        return (
          <Stepper.Panel>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Hvor skal tjenesten utføres?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={bookingData.location}
                  onValueChange={(value) =>
                    updateBookingData({
                      location: value as "stylist" | "customer",
                    })
                  }
                >
                  {stylistHasOwnPlace && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="stylist" id="stylist" />
                      <Label htmlFor="stylist">Hos stylisten</Label>
                    </div>
                  )}
                  {stylistCanTravel && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer">Hjemme hos meg</Label>
                    </div>
                  )}
                </RadioGroup>

                {bookingData.location === "customer" && (
                  <div className="space-y-2">
                    <Label htmlFor="address">Din adresse</Label>
                    <Textarea
                      id="address"
                      placeholder="Skriv inn din adresse..."
                      value={bookingData.customerAddress || ""}
                      onChange={(e) =>
                        updateBookingData({ customerAddress: e.target.value })
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </Stepper.Panel>
        );

      case "message-discount":
        return (
          <Stepper.Panel>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Melding til stylisten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Har du noen spesielle ønsker? (valgfritt)
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="F.eks. allergier, preferanser, eller andre viktige detaljer..."
                      value={bookingData.messageToStylist || ""}
                      onChange={(e) =>
                        updateBookingData({ messageToStylist: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="w-5 h-5" />
                    Rabattkode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="discount">
                      Har du en rabattkode? (valgfritt)
                    </Label>
                    <Input
                      id="discount"
                      placeholder="Skriv inn rabattkode..."
                      value={bookingData.discountCode || ""}
                      onChange={(e) =>
                        updateBookingData({ discountCode: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </Stepper.Panel>
        );

      case "payment":
        return (
          <Stepper.Panel>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Bekreft og betal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium">Sammendrag</h4>
                    {bookingData.startTime && (
                      <p className="text-sm">
                        <strong>Tid:</strong>{" "}
                        {format(bookingData.startTime, "EEEE d. MMMM, HH:mm", {
                          locale: nb,
                        })}{" "}
                        - {format(bookingData.endTime!, "HH:mm")}
                      </p>
                    )}
                    <p className="text-sm">
                      <strong>Lokasjon:</strong>{" "}
                      {bookingData.location === "stylist"
                        ? "Hos stylisten"
                        : "Hjemme hos deg"}
                    </p>
                    {bookingData.messageToStylist && (
                      <p className="text-sm">
                        <strong>Melding:</strong> {bookingData.messageToStylist}
                      </p>
                    )}
                    {bookingData.discountCode && (
                      <p className="text-sm">
                        <strong>Rabattkode:</strong> {bookingData.discountCode}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ved å fullføre bookingen godtar du våre vilkår og
                    betingelser.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Stepper.Panel>
        );

      default:
        return null;
    }
  }
}
