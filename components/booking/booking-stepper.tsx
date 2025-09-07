"use client";

import React, { useEffect } from "react";
import {
  Calendar,
  Clock,
  Info,
  MapPin,
  CreditCard,
  MessageSquare,
  TestTube,
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
import { TrialSessionStep } from "@/components/booking/trial-session-step";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useBookingStore } from "@/stores/booking.store";
import { formatCurrency, getBookingBreakdown } from "@/lib/booking-calculations";
import { getStylistProfileWithServices } from "@/server/profile.actions";
import { useQuery } from "@tanstack/react-query";

// Create stepper steps dynamically based on trial session availability
function createStepperSteps(hasTrialSession: boolean) {
  const baseSteps = [
    {
      id: "time-selection",
      title: "1. Velg tidspunkt",
      description: "Finn ledig tid hos stylisten",
      icon: <Calendar className="w-4 h-4" />,
    },
  ];

  if (hasTrialSession) {
    baseSteps.push({
      id: "trial-session",
      title: "2. Prøvetime",
      description: "Velg dato for prøvetime",
      icon: <TestTube className="w-4 h-4" />,
    });
  }

  const nextNumber = hasTrialSession ? 3 : 2;
  baseSteps.push(
    {
      id: "location-details",
      title: `${nextNumber}. Lokasjon`,
      description: "Hvor skal tjenesten utføres",
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      id: "message-discount",
      title: `${nextNumber + 1}. Melding og rabatt`,
      description: "Tilleggsinfo og rabattkoder",
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: "payment",
      title: `${nextNumber + 2}. Betaling`,
      description: "Fullfør bookingen",
      icon: <CreditCard className="w-4 h-4" />,
    }
  );

  return baseSteps;
}

interface BookingStepperProps {
  stylistId: string;
  serviceDurationMinutes: number;
  serviceAmountNOK: number;
  stylistCanTravel: boolean;
  stylistHasOwnPlace: boolean;
  hasTrialSession?: boolean;
  trialSessionPrice?: number;
  trialSessionDurationMinutes?: number;
  trialSessionDescription?: string;
  cartItems: { serviceId: string; quantity: number }[];
  onComplete: () => void;
}

export function BookingStepper({
  stylistId,
  serviceDurationMinutes,
  serviceAmountNOK,
  stylistCanTravel,
  stylistHasOwnPlace,
  hasTrialSession,
  trialSessionPrice,
  trialSessionDurationMinutes,
  trialSessionDescription,
  cartItems,
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
    setBookingContext,
    getTotalAmount,
    getTrialSessionAmount,
  } = useBookingStore();

  // Fetch stylist profile with addresses for payment summary
  const { data: stylistData } = useQuery({
    queryKey: ["stylist", stylistId],
    queryFn: () => getStylistProfileWithServices(stylistId),
    enabled: !!stylistId,
  });

  const stylistProfile = stylistData?.data?.profile;
  const stylistPrimaryAddress = stylistProfile?.addresses?.find((addr: any) => addr.is_primary);

  // Create stepper dynamically based on trial session availability
  const { Stepper } = React.useMemo(() => {
    const stepperSteps = createStepperSteps(hasTrialSession || false);
    return defineStepper(...stepperSteps);
  }, [hasTrialSession]);

  // Update booking context when props change
  useEffect(() => {
    setBookingContext({
      stylistId,
      serviceDurationMinutes,
      serviceAmountNOK,
      stylistCanTravel,
      stylistHasOwnPlace,
      hasTrialSession,
      trialSessionPrice,
      trialSessionDurationMinutes,
      trialSessionDescription,
    });
  }, [
    stylistId,
    serviceDurationMinutes,
    serviceAmountNOK,
    stylistCanTravel,
    stylistHasOwnPlace,
    hasTrialSession,
    trialSessionPrice,
    trialSessionDurationMinutes,
    trialSessionDescription,
    setBookingContext,
  ]);

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
                ...(hasTrialSession
                  ? {
                      "trial-session": () => renderStepContent("trial-session"),
                    }
                  : {}),
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
                  const steps = hasTrialSession
                    ? ([
                        "time-selection",
                        "trial-session",
                        "location-details",
                        "message-discount",
                        "payment",
                      ] as const)
                    : ([
                        "time-selection",
                        "location-details",
                        "message-discount",
                        "payment",
                      ] as const);
                  const currentIndex = steps.indexOf(currentStep as any);
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1] as any);
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
                    const steps = hasTrialSession
                      ? ([
                          "time-selection",
                          "trial-session",
                          "location-details",
                          "message-discount",
                          "payment",
                        ] as const)
                      : ([
                          "time-selection",
                          "location-details",
                          "message-discount",
                          "payment",
                        ] as const);
                    const currentIndex = steps.indexOf(currentStep as any);
                    if (currentIndex < steps.length - 1) {
                      setCurrentStep(steps[currentIndex + 1] as any);
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

      case "trial-session":
        return (
          <Stepper.Panel>
            <TrialSessionStep
              trialSessionPrice={trialSessionPrice}
              trialSessionDurationMinutes={trialSessionDurationMinutes}
              trialSessionDescription={trialSessionDescription}
              mainBookingDate={bookingData.startTime}
            />
          </Stepper.Panel>
        );

      case "location-details":
        return (
          <Stepper.Panel>
            <BookingAddressSelector
              stylistId={stylistId}
              stylistCanTravel={stylistCanTravel}
              stylistHasOwnPlace={stylistHasOwnPlace}
              location={bookingData.location}
              onLocationChange={(location) =>
                handleUpdateBookingData({ location })
              }
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
                        handleUpdateBookingData({
                          messageToStylist: e.target.value,
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <ApplyDiscountForm
                orderAmountNOK={serviceAmountNOK + getTrialSessionAmount()}
                cartItems={cartItems}
                onDiscountApplied={(discount) => {
                  handleUpdateBookingData({
                    appliedDiscount: discount || undefined,
                  });
                }}
                initialDiscountCode={bookingData.appliedDiscount?.code}
              />
            </div>
          </Stepper.Panel>
        );

      case "payment":
        // Calculate breakdown using common utilities
        const bookingItems = [{ price: serviceAmountNOK, quantity: 1 }];
        const trialSessionData = (bookingData.wantsTrialSession && trialSessionPrice) ? { price: trialSessionPrice } : null;
        const appliedDiscountData = bookingData.appliedDiscount ? {
          discountAmount: bookingData.appliedDiscount.discountAmount,
          code: bookingData.appliedDiscount.code,
          wasLimitedByMaxOrderAmount: bookingData.appliedDiscount.wasLimitedByMaxOrderAmount,
          maxOrderAmountNOK: bookingData.appliedDiscount.maxOrderAmountNOK,
        } : null;
        
        const breakdown = getBookingBreakdown({
          items: bookingItems,
          trialSession: trialSessionData,
          appliedDiscount: appliedDiscountData,
        });

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
                        <strong>Hovedtime:</strong>{" "}
                        {format(bookingData.startTime, "EEEE d. MMMM, HH:mm", {
                          locale: nb,
                        })}{" "}
                        - {format(bookingData.endTime!, "HH:mm")}
                      </p>
                    )}
                    {bookingData.wantsTrialSession &&
                      bookingData.trialSessionStartTime && (
                        <p className="text-sm flex items-center gap-2">
                          <span>
                            <strong>Prøvetime:</strong>{" "}
                            {format(
                              bookingData.trialSessionStartTime,
                              "EEEE d. MMMM, HH:mm",
                              {
                                locale: nb,
                              }
                            )}{" "}
                            -{" "}
                            {format(bookingData.trialSessionEndTime!, "HH:mm")}
                            {trialSessionPrice && (
                              <span className="ml-2 text-muted-foreground">
                                ({formatCurrency(trialSessionPrice)})
                              </span>
                            )}
                          </span>
                        </p>
                      )}
                    <p className="text-sm">
                      <strong>Lokasjon:</strong>{" "}
                      {bookingData.location === "stylist" ? (
                        <span>
                          Hos stylisten
                          {stylistPrimaryAddress && (
                            <span className="block text-muted-foreground">
                              {stylistPrimaryAddress.street_address}, {stylistPrimaryAddress.postal_code} {stylistPrimaryAddress.city}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>
                          Hjemme hos deg
                          {bookingData.customerAddressDetails && (
                            <span className="block text-muted-foreground">
                              {bookingData.customerAddressDetails.street_address}, {bookingData.customerAddressDetails.postal_code} {bookingData.customerAddressDetails.city}
                            </span>
                          )}
                        </span>
                      )}
                    </p>
                    {bookingData.messageToStylist && (
                      <p className="text-sm">
                        <strong>Melding:</strong> {bookingData.messageToStylist}
                      </p>
                    )}
                    {bookingData.appliedDiscount && (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <strong>Rabattkode:</strong>{" "}
                          {bookingData.appliedDiscount.code}
                          <span className="ml-2 text-green-600">
                            (-{breakdown.formattedDiscountAmount})
                          </span>
                        </p>
                        {/* Maximum order amount feedback */}
                        {bookingData.appliedDiscount
                          .wasLimitedByMaxOrderAmount &&
                          bookingData.appliedDiscount.maxOrderAmountNOK && (
                            <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs border border-blue-200 dark:border-blue-800">
                              <Info className="w-3 h-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                              <p className="text-blue-800 dark:text-blue-200">
                                <span className="font-medium">
                                  Rabattgrense:
                                </span>{" "}
                                Denna rabatten gjelder kun for bestillinger opp
                                til{" "}
                                {formatCurrency(
                                  bookingData.appliedDiscount.maxOrderAmountNOK
                                )}
                                .
                              </p>
                            </div>
                          )}
                      </div>
                    )}
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm font-medium">
                        <strong>Totalt:</strong>{" "}
                        {breakdown.formattedFinalTotal}
                        {bookingData.appliedDiscount && (
                          <span className="text-muted-foreground">
                            {" "}
                            ({breakdown.formattedServiceSubtotal}
                            {breakdown.hasTrialSession && ` + ${breakdown.formattedTrialSessionAmount} prøvetime`}
                            {breakdown.hasDiscount && ` - ${breakdown.formattedDiscountAmount} rabatt`}
                            )
                          </span>
                        )}
                      </p>
                    </div>
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
