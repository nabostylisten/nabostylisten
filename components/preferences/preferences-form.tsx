"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  CreditCard,
  Shield,
  Settings,
  Smartphone,
  Volume2,
  Users,
  Star,
  FileCheck,
  Megaphone,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import {
  getUserPreferences,
  updateUserPreferences,
} from "@/server/preferences.actions";
import type { Database } from "@/types/database.types";
import { userPreferencesUpdateSchema } from "@/schemas/database.schema";

type UserRole = Database["public"]["Enums"]["user_role"];
type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];

const preferencesFormSchema = userPreferencesUpdateSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;

interface PreferencesFormProps {
  userId: string;
  userRole: UserRole;
}

interface PreferenceSection {
  title: string;
  icon: React.ReactNode;
  description: string;
  fields: Array<{
    key: keyof PreferencesFormValues;
    label: string;
    description: string;
    roles?: UserRole[]; // If specified, only show for these roles
  }>;
}

export function PreferencesForm({ userId, userRole }: PreferencesFormProps) {
  const queryClient = useQueryClient();

  // Fetch current preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["preferences", userId],
    queryFn: async () => {
      const result = await getUserPreferences(userId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data!;
    },
  });

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: preferences
      ? {
          newsletter_subscribed: preferences.newsletter_subscribed,
          marketing_emails: preferences.marketing_emails,
          promotional_sms: preferences.promotional_sms,
          booking_confirmations: preferences.booking_confirmations,
          booking_reminders: preferences.booking_reminders,
          booking_cancellations: preferences.booking_cancellations,
          booking_status_updates: preferences.booking_status_updates,
          chat_messages: preferences.chat_messages,
          chat_message_sounds: preferences.chat_message_sounds,
          new_booking_requests: preferences.new_booking_requests,
          review_notifications: preferences.review_notifications,
          payment_notifications: preferences.payment_notifications,
          application_status_updates: preferences.application_status_updates,
          security_alerts: preferences.security_alerts,
          system_updates: preferences.system_updates,
          email_delivery: preferences.email_delivery,
          sms_delivery: preferences.sms_delivery,
          push_notifications: preferences.push_notifications,
        }
      : undefined,
  });

  // Reset form when preferences change
  React.useEffect(() => {
    if (preferences) {
      form.reset({
        newsletter_subscribed: preferences.newsletter_subscribed,
        marketing_emails: preferences.marketing_emails,
        promotional_sms: preferences.promotional_sms,
        booking_confirmations: preferences.booking_confirmations,
        booking_reminders: preferences.booking_reminders,
        booking_cancellations: preferences.booking_cancellations,
        booking_status_updates: preferences.booking_status_updates,
        chat_messages: preferences.chat_messages,
        chat_message_sounds: preferences.chat_message_sounds,
        new_booking_requests: preferences.new_booking_requests,
        review_notifications: preferences.review_notifications,
        payment_notifications: preferences.payment_notifications,
        application_status_updates: preferences.application_status_updates,
        security_alerts: preferences.security_alerts,
        system_updates: preferences.system_updates,
        email_delivery: preferences.email_delivery,
        sms_delivery: preferences.sms_delivery,
        push_notifications: preferences.push_notifications,
      });
    }
  }, [preferences, form]);

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: PreferencesFormValues) =>
      updateUserPreferences(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences", userId] });
      toast.success("Preferanser oppdatert!");
    },
    onError: (error: any) => {
      toast.error("Feil ved oppdatering: " + (error?.message || "Ukjent feil"));
    },
  });

  const onSubmit = (values: PreferencesFormValues) => {
    updatePreferencesMutation.mutate(values);
  };

  // Auto-submit when any field changes
  const handleFieldChange = (field: keyof PreferencesFormValues, value: boolean) => {
    form.setValue(field, value);
    // Trigger form submission after a short delay to batch rapid changes
    setTimeout(() => {
      form.handleSubmit(onSubmit)();
    }, 100);
  };

  const preferenceSections: PreferenceSection[] = [
    {
      title: "Nyhetsbrev og markedsføring",
      icon: <Megaphone className="w-5 h-5" />,
      description:
        "Administrer hvordan vi kommuniserer med deg om tilbud og nyheter",
      fields: [
        {
          key: "newsletter_subscribed",
          label: "Nyhetsbrev",
          description: "Motta vårt månedlige nyhetsbrev med tips og tilbud",
        },
        {
          key: "marketing_emails",
          label: "Markedsførings-e-poster",
          description: "Motta e-poster om spesialtilbud og kampanjer",
        },
        {
          key: "promotional_sms",
          label: "Kampanje-SMS",
          description: "Motta SMS med eksklusive tilbud og påminnelser",
        },
      ],
    },
    {
      title: "Booking-varsler",
      icon: <Calendar className="w-5 h-5" />,
      description: "Få beskjed om viktige oppdateringer for dine bookinger",
      fields: [
        {
          key: "booking_confirmations",
          label: "Bookingbekreftelser",
          description: "Få beskjed når en booking blir bekreftet",
        },
        {
          key: "booking_reminders",
          label: "Booking-påminnelser",
          description: "Få påminnelse 24 timer før din time",
        },
        {
          key: "booking_cancellations",
          label: "Avlysninger",
          description: "Få beskjed hvis en booking blir avlyst",
        },
        {
          key: "booking_status_updates",
          label: "Statusoppdateringer",
          description: "Få beskjed om andre endringer i bookingstatus",
        },
      ],
    },
    {
      title: "Chat og kommunikasjon",
      icon: <MessageSquare className="w-5 h-5" />,
      description: "Administrer hvordan du vil motta beskjeder fra chat",
      fields: [
        {
          key: "chat_messages",
          label: "Chat-meldinger",
          description: "Få e-postvarsler for nye chat-meldinger",
        },
        {
          key: "chat_message_sounds",
          label: "Chat-lyder",
          description: "Hør lyder når du mottar nye meldinger (i appen)",
        },
      ],
    },
    {
      title: "Stylist-varsler",
      icon: <Users className="w-5 h-5" />,
      description: "Spesialiserte varsler for stylister",
      fields: [
        {
          key: "new_booking_requests",
          label: "Nye bookingforespørsler",
          description: "Få beskjed når kunder sender bookingforespørsler",
          roles: ["stylist"],
        },
        {
          key: "review_notifications",
          label: "Nye anmeldelser",
          description: "Få beskjed når kunder legger igjen anmeldelser",
          roles: ["stylist"],
        },
        {
          key: "payment_notifications",
          label: "Betalingsvarsler",
          description: "Få beskjed om betalinger og utbetalinger",
          roles: ["stylist"],
        },
      ],
    },
    {
      title: "Søknadsstatus",
      icon: <FileCheck className="w-5 h-5" />,
      description: "Oppdateringer om søknadsstatusen din",
      fields: [
        {
          key: "application_status_updates",
          label: "Søknadsoppdateringer",
          description: "Få beskjed om endringer i søknadsstatusen din",
          roles: ["customer"], // For pending applicants
        },
      ],
    },
    {
      title: "System og sikkerhet",
      icon: <Shield className="w-5 h-5" />,
      description: "Viktige varsler om kontosikkerhet og systemoppdateringer",
      fields: [
        {
          key: "security_alerts",
          label: "Sikkerhetsvarsler",
          description:
            "Få beskjed om pålogging og sikkerhetsrelaterte aktiviteter",
        },
        {
          key: "system_updates",
          label: "Systemoppdateringer",
          description: "Få beskjed om vedlikehold og nye funksjoner",
        },
      ],
    },
    {
      title: "Leveringsinnstillinger",
      icon: <Settings className="w-5 h-5" />,
      description: "Velg hvordan du vil motta varsler",
      fields: [
        {
          key: "email_delivery",
          label: "E-postvarsler",
          description: "Motta varsler via e-post",
        },
        {
          key: "sms_delivery",
          label: "SMS-varsler",
          description: "Motta viktige varsler via SMS",
        },
        {
          key: "push_notifications",
          label: "Push-varsler",
          description: "Motta varsler i mobilappen (kommer snart)",
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-64 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with submit button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Changes are saved automatically
          </p>
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={updatePreferencesMutation.isPending}
          variant="outline"
        >
          {updatePreferencesMutation.isPending ? "Lagrer..." : "Lagre preferanser"}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {preferenceSections.map((section) => {
          // Filter fields based on user role
          const visibleFields = section.fields.filter(
            (field) => !field.roles || field.roles.includes(userRole)
          );

          // Skip section if no fields are visible
          if (visibleFields.length === 0) {
            return null;
          }

          return (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {section.icon}
                  {section.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {visibleFields.map((field, index) => (
                  <div key={field.key}>
                    <FormField
                      control={form.control}
                      name={field.key}
                      render={({ field: formField }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <div className="space-y-1">
                            <FormLabel className="text-sm font-medium">
                              {field.label}
                            </FormLabel>
                            <FormDescription className="text-sm text-muted-foreground">
                              {field.description}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={formField.value}
                              onCheckedChange={(value) => {
                                formField.onChange(value);
                                handleFieldChange(field.key, value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {index < visibleFields.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
        </form>
      </Form>
    </div>
  );
}
