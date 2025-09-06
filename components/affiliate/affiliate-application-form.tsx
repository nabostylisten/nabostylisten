"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { defineStepper } from "@/components/stepper";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Heart,
  Megaphone,
  TrendingUp,
  FileText,
  Users,
  Target,
  Check,
} from "lucide-react";

import { createAffiliateApplication } from "@/server/affiliate/affiliate-applications.actions";
import type { Database } from "@/types/database.types";

const affiliateApplicationSchema = z.object({
  reason: z
    .string()
    .min(50, "Vennligst beskriv hvorfor du vil bli partner (minimum 50 tegn)")
    .max(1000, "Maksimum 1000 tegn"),
  marketing_strategy: z
    .string()
    .min(50, "Vennligst beskriv din markedsføringsstrategi (minimum 50 tegn)")
    .max(1000, "Maksimum 1000 tegn"),
  expected_referrals: z
    .number()
    .min(1, "Minimum 1 henvisning per måned")
    .max(1000, "Maksimum 1000 henvisningar per måned"),
  social_media_reach: z
    .number()
    .min(100, "Minimum 100 følgere totalt")
    .max(10000000, "Maksimum 10 millioner følgere"),
  terms_accepted: z
    .boolean()
    .refine((val) => val === true, "Du må akseptere vilkårene"),
});

type AffiliateApplicationForm = z.infer<typeof affiliateApplicationSchema>;

interface AffiliateApplicationFormProps {
  stylistId: string;
  onSuccess?: () => void;
}

// Define stepper steps with icons
const stepperSteps = [
  {
    id: "motivation",
    title: "1. Motivasjon",
    description: "Hvorfor vil du bli partner?",
    icon: <Heart className="w-4 h-4" />,
  },
  {
    id: "strategy",
    title: "2. Strategi",
    description: "Hvordan vil du markedsføre?",
    icon: <Megaphone className="w-4 h-4" />,
  },
  {
    id: "expectations",
    title: "3. Forventninger",
    description: "Hvor mange kunder kan du henvise?",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    id: "terms",
    title: "4. Vilkår",
    description: "Aksepter partnerbetingelser",
    icon: <FileText className="w-4 h-4" />,
  },
];

const { Stepper } = defineStepper(...stepperSteps);

export function AffiliateApplicationForm({
  stylistId,
  onSuccess,
}: AffiliateApplicationFormProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const form = useForm<AffiliateApplicationForm>({
    resolver: zodResolver(affiliateApplicationSchema),
    defaultValues: {
      reason: "",
      marketing_strategy: "",
      expected_referrals: 5,
      social_media_reach: 1000,
      terms_accepted: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: AffiliateApplicationForm) =>
      createAffiliateApplication({
        stylist_id: stylistId,
        reason: data.reason,
        marketing_strategy: data.marketing_strategy,
        expected_referrals: data.expected_referrals,
        social_media_reach: data.social_media_reach,
        terms_accepted: data.terms_accepted,
        terms_accepted_at: new Date().toISOString(),
      }),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Partnersøknaden din er sendt inn!");
        onSuccess?.();
      }
    },
    onError: () => {
      toast.error("Noe gikk galt. Prøv igjen.");
    },
  });

  const canProceedFromStep = async (stepId: string): Promise<boolean> => {
    let fieldsToValidate: (keyof AffiliateApplicationForm)[] = [];

    switch (stepId) {
      case "motivation":
        fieldsToValidate = ["reason"];
        break;
      case "strategy":
        fieldsToValidate = ["marketing_strategy"];
        break;
      case "expectations":
        fieldsToValidate = ["expected_referrals", "social_media_reach"];
        break;
      case "terms":
        fieldsToValidate = ["terms_accepted"];
        break;
    }

    return await form.trigger(fieldsToValidate);
  };

  const onSubmit = (data: AffiliateApplicationForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                      onClick={async () => {
                        // Allow clicking on completed steps or current step
                        const currentIndex = methods.all.findIndex(
                          (s) => s.id === methods.current.id
                        );
                        const clickedIndex = methods.all.findIndex(
                          (s) => s.id === step.id
                        );

                        if (clickedIndex <= currentIndex) {
                          methods.goTo(step.id);
                        } else {
                          // Check if we can proceed from current step
                          const canProceed = await canProceedFromStep(
                            methods.current.id
                          );
                          if (canProceed) {
                            methods.goTo(step.id);
                          }
                        }
                      }}
                      icon={step.icon}
                    >
                      <Stepper.Title className="text-xs">
                        {step.title}
                      </Stepper.Title>
                      <Stepper.Description className="text-xs">
                        {step.description}
                      </Stepper.Description>
                      {isMobile &&
                        methods.when(step.id, () => (
                          <div className="mt-4">
                            {renderStepContent(step.id)}
                          </div>
                        ))}
                    </Stepper.Step>
                  ))}
                </Stepper.Navigation>

                {!isMobile &&
                  methods.switch({
                    motivation: () => renderStepContent("motivation"),
                    strategy: () => renderStepContent("strategy"),
                    expectations: () => renderStepContent("expectations"),
                    terms: () => renderStepContent("terms"),
                  })}

                <Stepper.Controls>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => methods.prev()}
                    disabled={methods.isFirst || mutation.isPending}
                  >
                    Forrige
                  </Button>
                  <Button
                    type={methods.isLast ? "submit" : "button"}
                    onClick={async () => {
                      if (methods.isLast) {
                        // Form submission is handled by form onSubmit
                        return;
                      }

                      const canProceed = await canProceedFromStep(
                        methods.current.id
                      );
                      if (canProceed) {
                        methods.next();
                      }
                    }}
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending
                      ? "Sender inn..."
                      : methods.isLast
                        ? "Send inn søknad"
                        : "Neste"}
                  </Button>
                </Stepper.Controls>
              </>
            )}
          </Stepper.Provider>
        </form>
      </Form>
    </div>
  );

  function renderStepContent(stepId: string) {
    switch (stepId) {
      case "motivation":
        return (
          <Stepper.Panel key="motivation-panel">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Motivasjon
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Hvorfor vil du bli partner?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Fortell oss hvorfor du vil bli partner hos Nabostylisten og
                    hva som motiverer deg.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivasjon *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          key="reason-textarea"
                          placeholder="Jeg vil bli partner fordi..."
                          rows={6}
                          className="resize-none"
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <FormMessage />
                        <span>{field.value?.length || 0}/1000</span>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </Stepper.Panel>
        );

      case "strategy":
        return (
          <Stepper.Panel key="strategy-panel">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5" />
                  Markedsføringsstrategi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Markedsføringsstrategi
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Beskriv hvordan du planlegger å markedsføre Nabostylisten
                    til potensielle kunder.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="marketing_strategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Hvordan vil du markedsføre plattformen? *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          key="marketing-strategy-textarea"
                          placeholder="Jeg planlegger å markedsføre gjennom..."
                          rows={6}
                          className="resize-none"
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <FormMessage />
                        <span>{field.value?.length || 0}/1000</span>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </Stepper.Panel>
        );

      case "expectations":
        return (
          <Stepper.Panel key="expectations-panel">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Forventninger og rekkevidde
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Forventninger og rekkevidde
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Gi oss en idé om din rekkevidde og hvor mange kunder du kan
                    henvise.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="expected_referrals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forventede henvisninger per måned *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          key="expected-referrals-input"
                          type="number"
                          min={1}
                          max={1000}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="social_media_reach"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Total antall følgere (alle plattformer) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          key="social-media-reach-input"
                          type="number"
                          min={100}
                          max={10000000}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </Stepper.Panel>
        );

      case "terms":
        return (
          <Stepper.Panel key="terms-panel">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Partnerbetingelser
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Les gjennom og aksepter våre partnerbetingelser for å
                    fullføre søknaden.
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-h-60 overflow-y-auto text-sm">
                  <div className="space-y-2 text-blue-700 dark:text-blue-300">
                    <p>
                      1. Som partner forplikter du deg til å representere
                      Nabostylisten på en profesjonell måte.
                    </p>
                    <p>
                      2. Partnerkoder er personlige og kan ikke deles med andre
                      stylister.
                    </p>
                    <p>
                      3. Provisjon utbetales månedlig for bekreftede bookinger.
                    </p>
                    <p>
                      4. Nabostylisten forbeholder seg retten til å avslutte
                      partnerskap ved brudd på vilkårene.
                    </p>
                    <p>
                      5. Partner er ansvarlig for riktig skatterapportering av
                      provisjonsinntekter.
                    </p>
                    <p>6. Partnerkoder kan ikke brukes på egne tjenester.</p>
                    <p>
                      7. Misbruk av partnerprogrammet kan føre til permanent
                      utestengelse.
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="terms_accepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          key="terms-accepted-checkbox"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">
                          Jeg aksepterer partnerbetingelsene *
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </Stepper.Panel>
        );

      default:
        return null;
    }
  }
}
