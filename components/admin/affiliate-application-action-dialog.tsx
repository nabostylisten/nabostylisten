"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CheckCircle, XCircle } from "lucide-react";

const actionNotesSchema = z.object({
  notes: z.string().optional(),
});

type ActionNotesForm = z.infer<typeof actionNotesSchema>;

interface AffiliateApplicationActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "approve" | "reject" | null;
  applicationId: string | null;
  stylistName?: string;
  onConfirm: (applicationId: string, notes?: string) => Promise<void>;
  loading?: boolean;
}

export function AffiliateApplicationActionDialog({
  open,
  onOpenChange,
  action,
  applicationId,
  stylistName,
  onConfirm,
  loading = false,
}: AffiliateApplicationActionDialogProps) {
  const form = useForm<ActionNotesForm>({
    resolver: zodResolver(actionNotesSchema),
    defaultValues: {
      notes: "",
    },
  });

  const getActionDetails = () => {
    if (action === "approve") {
      return {
        title: "Godkjenn partnersøknad",
        description: `Er du sikker på at du vil godkjenne partnersøknaden til ${stylistName}? Dette vil gi dem tilgang til partnerprogrammet og opprette en partnerkode.`,
        icon: <CheckCircle className="w-6 h-6 text-green-600" />,
        confirmText: "Godkjenn søknad",
        confirmVariant: "default" as const,
      };
    } else if (action === "reject") {
      return {
        title: "Avvis partnersøknad",
        description: `Er du sikker på at du vil avvise partnersøknaden til ${stylistName}? Stylisten vil motta en e-post om at søknaden er avvist.`,
        icon: <XCircle className="w-6 h-6 text-red-600" />,
        confirmText: "Avvis søknad",
        confirmVariant: "destructive" as const,
      };
    }
    return null;
  };

  const actionDetails = getActionDetails();

  const getPredefinedMessages = () => {
    if (action === "approve") {
      return [
        "Gratulerer! Vi er glade for å velkommen deg til vårt partnerprogram. Vi ser frem til et godt samarbeid og forventer at du representerer våre verdier på en profesjonell måte. Du vil snart motta din partnerkode og videre instruksjoner.",
        "Velkommen som partner! Din søknad var imponerende og vi tror du vil være en flott tillegg til vårt team. Husk å følge våre retningslinjer og gi kundene den beste opplevelsen.",
      ];
    } else {
      return [
        "Tusen takk for din interesse i vårt partnerprogram. Dessverre kan vi ikke godkjenne din søknad for øyeblikket, men vi oppfordrer deg til å søke igjen når du har mer erfaring eller en sterkere portefølje.",
        "Vi setter pris på at du tok deg tid til å søke, men din søknad oppfyller ikke våre nåværende krav. Dette betyr ikke at du ikke kan søke igjen i fremtiden når forholdene har endret seg.",
        "Takk for din søknad. Vi har valgt å ikke godkjenne den denne gangen, men vi oppmuntrer deg til å fortsette å utvikle dine ferdigheter og søke igjen når du føler deg klar.",
      ];
    }
  };

  const handlePredefinedMessage = (message: string) => {
    form.setValue("notes", message);
  };

  const handleSubmit = async (data: ActionNotesForm) => {
    if (!applicationId) return;
    
    try {
      await onConfirm(applicationId, data.notes || undefined);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!actionDetails) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {actionDetails.icon}
            {actionDetails.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {actionDetails.description}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Merknad til {action === "approve" ? "godkjenning" : "avvisning"} (valgfritt)
                  </FormLabel>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Forhåndsdefinerte meldinger:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getPredefinedMessages().map((message, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => handlePredefinedMessage(message)}
                          disabled={loading}
                        >
                          Mal {index + 1}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={
                        action === "approve"
                          ? "Skriv en valgfri merknad som vil bli inkludert i godkjennings-e-posten..."
                          : "Skriv en valgfri merknad som forklarer hvorfor søknaden ble avvist..."
                      }
                      rows={4}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                variant={actionDetails.confirmVariant}
                disabled={loading}
              >
                {loading ? "Behandler..." : actionDetails.confirmText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}