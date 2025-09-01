"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Loader2, AlertTriangle, Info, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PaymentWithDetails } from "@/server/admin/payments.actions";
import { processAdminRefund } from "@/server/admin/admin-refund.actions";

// Refund reason options
const REFUND_REASONS = [
  { value: "customer_request", label: "Kundeforespørsel" },
  { value: "service_cancelled", label: "Tjeneste kansellert" },
  { value: "service_not_delivered", label: "Tjeneste ikke levert" },
  { value: "billing_error", label: "Faktureringsfeil" },
  { value: "duplicate_charge", label: "Dobbel belastning" },
  { value: "fraud", label: "Svindel" },
  { value: "admin_decision", label: "Admin beslutning" },
  { value: "other", label: "Annet" },
] as const;

// Form schema
const refundFormSchema = z.object({
  refundAmountNOK: z
    .number()
    .min(0.01, { message: "Refunderingsbeløp må være minst 0,01 NOK" })
    .max(999999, {
      message: "Refunderingsbeløp kan ikke overstige 999 999 NOK",
    }),
  refundReason: z.enum(
    REFUND_REASONS.map((r) => r.value) as [string, ...string[]]
  ),
  customReason: z.string().optional(),
});

type RefundFormData = z.infer<typeof refundFormSchema>;

interface AdminRefundDialogProps {
  payment: PaymentWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefundProcessed?: () => void;
}

// Utility functions
const formatCurrency = (amount: number, currency: string = "NOK") => {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getPaymentStatusInfo = (payment: PaymentWithDetails) => {
  const isFullyRefunded = payment.refunded_amount >= payment.final_amount;
  const remainingRefundable = payment.final_amount - payment.refunded_amount;
  const isCaptured = payment.status === "succeeded";

  return {
    isFullyRefunded,
    remainingRefundable,
    isCaptured,
    canRefund: remainingRefundable > 0,
  };
};

export function AdminRefundDialog({
  payment,
  open,
  onOpenChange,
  onRefundProcessed,
}: AdminRefundDialogProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showConfirmation, setShowConfirmation] = React.useState(false);

  const form = useForm<RefundFormData>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: {
      refundAmountNOK: 0,
      refundReason: undefined,
      customReason: "",
    },
  });

  const watchedRefundAmount = form.watch("refundAmountNOK");
  const watchedRefundReason = form.watch("refundReason");
  const watchedCustomReason = form.watch("customReason");

  // Reset form when payment changes or dialog opens
  React.useEffect(() => {
    if (payment && open) {
      const statusInfo = getPaymentStatusInfo(payment);
      form.reset({
        refundAmountNOK: statusInfo.remainingRefundable,
        refundReason: undefined,
        customReason: "",
      });
      setShowConfirmation(false);
    }
  }, [payment, open, form]);

  const handleRefundSubmit = (data: RefundFormData) => {
    setShowConfirmation(true);
  };

  const handleConfirmRefund = async () => {
    if (!payment) return;

    setIsProcessing(true);

    try {
      const formData = form.getValues();

      const result = await processAdminRefund({
        paymentIntentId: payment.payment_intent_id,
        refundAmountNOK: formData.refundAmountNOK,
        refundReason:
          formData.refundReason === "other"
            ? formData.customReason || "Admin refund"
            : REFUND_REASONS.find((r) => r.value === formData.refundReason)
                ?.label || formData.refundReason,
      });

      if (result.error) {
        toast.error(`Refunderingsfeil: ${result.error}`);
        return;
      }

      toast.success(
        `Refundering på ${formatCurrency(formData.refundAmountNOK)} er behandlet`
      );
      onRefundProcessed?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Refund error:", error);
      toast.error("Kunne ikke behandle refundering. Prøv igjen.");
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
    }
  };

  if (!payment) return null;

  const statusInfo = getPaymentStatusInfo(payment);
  const needsCustomReason = watchedRefundReason === "other";

  const refundImpact = {
    willCancel: !statusInfo.isCaptured,
    willRefund: statusInfo.isCaptured && watchedRefundAmount > 0,
    willFullyRefund: watchedRefundAmount >= statusInfo.remainingRefundable,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Refunder betaling
            <Badge variant="outline">
              {payment.payment_intent_id.slice(-8)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Behandle refundering for denne betalingen. Vennligst gjennomgå
            detaljene før du fortsetter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Betalingsdetaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">
                    Kunde:
                  </span>
                  <div>{payment.customer_name}</div>
                  <div className="text-muted-foreground">
                    {payment.customer_email}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Stylist:
                  </span>
                  <div>{payment.stylist_name}</div>
                  <div className="text-muted-foreground">
                    {payment.stylist_email}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Behandlingsdato:
                  </span>
                  <div>
                    {format(
                      new Date(payment.booking_date),
                      "dd.MM.yyyy 'kl.' HH:mm",
                      { locale: nb }
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Betalingsstatus:
                  </span>
                  <div>
                    <Badge
                      variant={
                        payment.status === "succeeded" ? "default" : "secondary"
                      }
                    >
                      {payment.status === "succeeded"
                        ? "Fullført"
                        : payment.status === "requires_capture"
                          ? "Krever fangst"
                          : payment.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Financial Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Opprinnelig beløp:</span>
                  <span className="font-mono">
                    {formatCurrency(payment.original_amount, payment.currency)}
                  </span>
                </div>
                {payment.discount_amount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Rabatt:</span>
                    <span className="font-mono">
                      -
                      {formatCurrency(
                        payment.discount_amount,
                        payment.currency
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span>Totalt betalt:</span>
                  <span className="font-mono">
                    {formatCurrency(payment.final_amount, payment.currency)}
                  </span>
                </div>
                {payment.refunded_amount > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Allerede refundert:</span>
                    <span className="font-mono">
                      -
                      {formatCurrency(
                        payment.refunded_amount,
                        payment.currency
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-green-600">
                  <span>Tilgjengelig for refundering:</span>
                  <span className="font-mono">
                    {formatCurrency(
                      statusInfo.remainingRefundable,
                      payment.currency
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Refund Form */}
          {!statusInfo.canRefund ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Denne betalingen kan ikke refunderes ytterligere.
                {statusInfo.isFullyRefunded
                  ? " Den er allerede fullstendig refundert."
                  : " Det er ingen gjenstående beløp å refundere."}
              </AlertDescription>
            </Alert>
          ) : !showConfirmation ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleRefundSubmit)}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Refunderingsdetaljer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="refundAmountNOK"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refunderingsbeløp</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0.01"
                              max={statusInfo.remainingRefundable}
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              className="font-mono"
                            />
                          </FormControl>
                          <FormDescription>
                            Maksimalt refunderbart beløp:{" "}
                            {formatCurrency(
                              statusInfo.remainingRefundable,
                              payment.currency
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="refundReason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refunderingsgrunn</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Velg en grunn for refundering" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {REFUND_REASONS.map((reason) => (
                                <SelectItem
                                  key={reason.value}
                                  value={reason.value}
                                >
                                  {reason.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {needsCustomReason && (
                      <FormField
                        control={form.control}
                        name="customReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Spesifiser grunn</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Beskriv grunnen for refunderingen..."
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Gi en detaljert beskrivelse av grunnen for
                              refunderingen.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Impact Preview */}
                {watchedRefundAmount > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="h-5 w-5 text-orange-600" />
                        Konsekvenser av refunderingen
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Stripe-operasjon:</span>
                          <Badge
                            variant={
                              refundImpact.willCancel ? "secondary" : "default"
                            }
                          >
                            {refundImpact.willCancel
                              ? "Kanseller PaymentIntent"
                              : "Opprett refundering"}
                          </Badge>
                        </div>

                        <div>
                          <span className="font-medium">
                            Kundens refundering:
                          </span>
                          <span className="ml-2 font-mono text-green-600">
                            +
                            {formatCurrency(
                              watchedRefundAmount,
                              payment.currency
                            )}
                          </span>
                        </div>

                        {refundImpact.willRefund && (
                          <div className="text-muted-foreground">
                            Refunderingen vil bli behandlet av Stripe og kan ta
                            3-5 virkedager å vise på kundens konto.
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-sm">📧</span>
                          <span className="text-sm">
                            Kunden vil motta en e-post med bekreftelse på
                            refunderingen
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Avbryt
                  </Button>
                  <Button
                    type="submit"
                    disabled={watchedRefundAmount <= 0 || !watchedRefundReason}
                  >
                    Fortsett til bekreftelse
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            /* Confirmation Step */
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  Bekreft refundering
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div>Du er i ferd med å refundere:</div>
                  <div className="font-bold text-lg">
                    {formatCurrency(watchedRefundAmount, payment.currency)}
                  </div>
                  <div className="text-muted-foreground">
                    Grunn:{" "}
                    {watchedRefundReason === "other"
                      ? watchedCustomReason
                      : REFUND_REASONS.find(
                          (r) => r.value === watchedRefundReason
                        )?.label}
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Denne handlingen kan ikke angres. Refunderingen vil bli
                    behandlet umiddelbart i Stripe.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmation(false)}
                    disabled={isProcessing}
                  >
                    Gå tilbake
                  </Button>
                  <Button
                    onClick={handleConfirmRefund}
                    disabled={isProcessing}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Behandler...
                      </>
                    ) : (
                      "Bekreft refundering"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Actions */}
          <div className="flex gap-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const stripeUrl = `https://dashboard.stripe.com/payments/${payment.payment_intent_id}`;
                window.open(stripeUrl, "_blank");
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Åpne i Stripe Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
