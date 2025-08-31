"use client";

import React, { useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { defineStepper } from "@/components/stepper";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookingScheduler } from "@/components/booking/booking-scheduler";
import { BookingAddressSelector } from "@/components/addresses";
import { ApplyDiscountForm } from "@/components/booking/apply-discount-form";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useBookingStore } from "@/stores/booking.store";

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


interface BookingStepperProps {
  stylistId: string;
  serviceDurationMinutes: number;
  serviceAmountNOK: number;
  stylistCanTravel: boolean;
  stylistHasOwnPlace: boolean;
  onComplete: () => void;
}

export function BookingStepper({
  stylistId,
  serviceDurationMinutes,
  serviceAmountNOK,
  stylistCanTravel,
  stylistHasOwnPlace,
  onComplete,
}: BookingStepperProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const {
    currentStep,
    bookingData,
    isProcessingBooking,
    setCurrentStep,
    updateBookingData,
    canProceedFromStep,
    isStepAccessible,
    setBookingContext
  } = useBookingStore();

  // Update booking context when props change
  useEffect(() => {
    setBookingContext({
      stylistId,
      serviceDurationMinutes,
      serviceAmountNOK,
      stylistCanTravel,
      stylistHasOwnPlace,
    });
  }, [stylistId, serviceDurationMinutes, serviceAmountNOK, stylistCanTravel, stylistHasOwnPlace, setBookingContext]);

  const handleTimeSlotSelect = (startTime: Date, endTime: Date) => {
    updateBookingData({ startTime, endTime });
  };

  const handleUpdateBookingData = (updates: Partial<typeof bookingData>) => {
    updateBookingData(updates);
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
                onClick={() => {
                  methods.prev();
                  // Update our store state to match
                  const steps = ["time-selection", "location-details", "message-discount", "payment"] as const;
                  const currentIndex = steps.indexOf(currentStep);
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1]);
                  }
                }}
                disabled={methods.isFirst || isProcessingBooking}
              >
                Tilbake
              </Button>
              <Button
                onClick={() => {
                  if (methods.isLast) {
                    onComplete();
                  } else {
                    methods.next();
                    // Update our store state to match
                    const steps = ["time-selection", "location-details", "message-discount", "payment"] as const;
                    const currentIndex = steps.indexOf(currentStep);
                    if (currentIndex < steps.length - 1) {
                      setCurrentStep(steps[currentIndex + 1]);
                    }
                  }
                }}
                disabled={
                  !canProceedFromStep(methods.current.id) || isProcessingBooking
                }
              >
                {isProcessingBooking
                  ? "Behandler..."
                  : methods.isLast
                    ? "Fullfør booking"
                    : "Neste"}
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
            <BookingAddressSelector
              stylistCanTravel={stylistCanTravel}
              stylistHasOwnPlace={stylistHasOwnPlace}
              location={bookingData.location}
              onLocationChange={(location) => handleUpdateBookingData({ location })}
              selectedAddressId={bookingData.customerAddressId}
              onAddressSelect={(addressId, address) =>
                handleUpdateBookingData({
                  customerAddressId: addressId,
                  customerAddressDetails: address,
                  customerAddress: address
                    ? `${address.street_address}, ${address.postal_code} ${address.city}`
                    : undefined,
                })
              }
              customerInstructions={bookingData.messageToStylist}
              onInstructionsChange={(instructions) =>
                handleUpdateBookingData({ messageToStylist: instructions })
              }
            />
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
                        handleUpdateBookingData({ messageToStylist: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <ApplyDiscountForm
                orderAmountNOK={serviceAmountNOK}
                onDiscountApplied={(discount) => {
                  handleUpdateBookingData({ appliedDiscount: discount || undefined });
                }}
                initialDiscountCode={bookingData.appliedDiscount?.code}
              />
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
                    {bookingData.appliedDiscount && (
                      <p className="text-sm">
                        <strong>Rabattkode:</strong> {bookingData.appliedDiscount.code}
                        <span className="ml-2 text-green-600">
                          (-{bookingData.appliedDiscount.discountAmount.toLocaleString('no-NO')} kr)
                        </span>
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
