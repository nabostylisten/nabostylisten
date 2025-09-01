"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PlayCircle,
  RefreshCw,
  CreditCard,
  Send,
  AlertCircle,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { BlurFade } from "@/components/magicui/blur-fade";

interface PaymentStatus {
  pending_payments: number;
  completed_bookings_needing_payout: number;
  recent_payments: Array<{
    id: string;
    booking_id: string;
    status: string;
    final_amount: number;
    created_at: string;
  }>;
}

interface ProcessingResult {
  success: boolean;
  bookingsProcessed: number;
  paymentsProcessed?: number;
  payoutsProcessed?: number;
  emailsSent: number;
  errors: number;
  message: string;
}

export const DevToolsDashboard = () => {
  const [isProcessingPayments, setIsProcessingPayments] = useState(false);
  const [isProcessingPayouts, setIsProcessingPayouts] = useState(false);
  const queryClient = useQueryClient();

  // Fetch payment status
  const { data: paymentStatus, isLoading } = useQuery({
    queryKey: ["dev-tools", "payment-status"],
    queryFn: async (): Promise<PaymentStatus> => {
      const supabase = createClient();

      // Get bookings that need payment capture
      const { data: pendingPayments } = await supabase
        .from("bookings")
        .select("id")
        .eq("status", "confirmed")
        .is("payment_captured_at", null);

      // Get completed bookings that need payout
      const { data: completedBookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("status", "completed")
        .not("payment_captured_at", "is", null)
        .is("payout_processed_at", null);

      // Get recent payments for context
      const { data: recentPayments } = await supabase
        .from("payments")
        .select("id, booking_id, status, final_amount, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      return {
        pending_payments: pendingPayments?.length || 0,
        completed_bookings_needing_payout: completedBookings?.length || 0,
        recent_payments: recentPayments || [],
      };
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Payment processing mutation
  const processPaymentsMutation = useMutation({
    mutationFn: async (): Promise<ProcessingResult> => {
      const response = await fetch("/api/dev/trigger-payment-processing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onMutate: () => {
      setIsProcessingPayments(true);
    },
    onSuccess: (data) => {
      toast.success(
        `Betalinger behandlet: ${data.paymentsProcessed} betalinger, ${data.emailsSent} e-poster sendt`
      );
      queryClient.invalidateQueries({
        queryKey: ["dev-tools", "payment-status"],
      });
    },
    onError: (error) => {
      toast.error(`Feil ved behandling av betalinger: ${error.message}`);
      console.error("Payment processing error:", error);
    },
    onSettled: () => {
      setIsProcessingPayments(false);
    },
  });

  // Payout processing mutation
  const processPayoutsMutation = useMutation({
    mutationFn: async (): Promise<ProcessingResult> => {
      const response = await fetch("/api/dev/trigger-payout-processing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onMutate: () => {
      setIsProcessingPayouts(true);
    },
    onSuccess: (data) => {
      toast.success(
        `Utbetalinger behandlet: ${data.payoutsProcessed} utbetalinger, ${data.emailsSent} e-poster sendt`
      );
      queryClient.invalidateQueries({
        queryKey: ["dev-tools", "payment-status"],
      });
    },
    onError: (error) => {
      toast.error(`Feil ved behandling av utbetalinger: ${error.message}`);
      console.error("Payout processing error:", error);
    },
    onSettled: () => {
      setIsProcessingPayouts(false);
    },
  });

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <BlurFade duration={0.5} inView>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Betalingsstatus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Henter status...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {paymentStatus?.pending_payments || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Betalinger som må behandles
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {paymentStatus?.completed_bookings_needing_payout || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Utbetalinger som må behandles
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </BlurFade>

      {/* Action Buttons */}
      <BlurFade delay={0.1} duration={0.5} inView>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Manuell behandling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => processPaymentsMutation.mutate()}
                disabled={
                  isProcessingPayments || !paymentStatus?.pending_payments
                }
                className="w-full"
                variant={
                  paymentStatus?.pending_payments ? "default" : "secondary"
                }
              >
                {isProcessingPayments ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Behandler betalinger...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Behandle betalinger ({paymentStatus?.pending_payments || 0})
                  </>
                )}
              </Button>

              <Button
                onClick={() => processPayoutsMutation.mutate()}
                disabled={
                  isProcessingPayouts ||
                  !paymentStatus?.completed_bookings_needing_payout
                }
                className="w-full"
                variant={
                  paymentStatus?.completed_bookings_needing_payout
                    ? "default"
                    : "secondary"
                }
              >
                {isProcessingPayouts ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Behandler utbetalinger...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Behandle utbetalinger (
                    {paymentStatus?.completed_bookings_needing_payout || 0})
                  </>
                )}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground bg-accent/50 p-3 rounded-lg border border-accent">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" />
                <strong>Hvordan dette fungerer:</strong>
              </div>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>
                  Betalingsbehandling: Tar alle bookinger med status "confirmed"
                  som mangler payment_captured_at
                </li>
                <li>
                  Utbetalingsbehandling: Tar alle bookinger med status
                  "completed" som mangler payout_processed_at
                </li>
                <li>
                  Samme forretningslogikk som produksjon, men uten
                  tidsbegrensninger
                </li>
                <li>E-poster sendes med [DEV] prefix</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </BlurFade>

      {/* Recent Payments */}
      {paymentStatus?.recent_payments &&
        paymentStatus.recent_payments.length > 0 && (
          <BlurFade delay={0.2} duration={0.5} inView>
            <Card>
              <CardHeader>
                <CardTitle>Siste betalinger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentStatus.recent_payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Booking:{" "}
                            <span className="font-mono">
                              {payment.booking_id}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 ml-2"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  payment.booking_id
                                );
                                toast.success("Booking-ID kopiert");
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </span>
                          <Badge
                            variant={
                              payment.status === "succeeded"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleString("no-NO")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {payment.final_amount.toLocaleString("no-NO")} NOK
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        )}

      {/* Security Notice */}
      <BlurFade delay={0.3} duration={0.5} inView>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <strong>Sikkerhet:</strong>
            </div>
            <p className="text-destructive/80 text-sm mt-2">
              Disse verktøyene er kun tilgjengelige i development eller for
              dev@nabostylisten.no. De er fullstendig blokkert i produksjon
              gjennom flere sikkerhetslag.
            </p>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
};
