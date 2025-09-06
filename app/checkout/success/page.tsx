import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

// Get Stripe instance for server-side payment intent retrieval
import { stripe } from "@/lib/stripe/config";
import { PaymentSuccessCard } from "@/components/booking/payment-success-card";
import { sendPostPaymentEmails } from "@/server/booking/notifications.actions";
import { trackAffiliateCommission } from "@/server/affiliate/affiliate-commission.actions";

interface SuccessPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function PaymentStatus({
  paymentIntentId,
  bookingId,
}: {
  paymentIntentId: string;
  bookingId: string;
}) {
  let paymentIntent;

  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error("Failed to retrieve payment intent:", error);
    return (
      <PaymentSuccessCard
        paymentStatus="default"
        paymentIntentId={paymentIntentId}
        bookingId={bookingId}
      />
    );
  }

  // Send post-payment emails if payment is successful
  const isPaymentSuccessful =
    paymentIntent.status === "succeeded" ||
    paymentIntent.status === "requires_capture";

  if (isPaymentSuccessful) {
    // Send emails in the background - don't wait for completion to avoid blocking the page
    await sendPostPaymentEmails(bookingId).catch((error) => {
      console.error("Failed to send post-payment emails:", error);
      // Don't fail the page render if emails fail
    });
    
    // Track affiliate commission if applicable - don't wait to avoid blocking
    trackAffiliateCommission(bookingId).catch((error) => {
      console.error("Failed to track affiliate commission:", error);
      // Don't fail the page render if affiliate tracking fails
    });
  }

  return (
    <PaymentSuccessCard
      paymentStatus={
        paymentIntent.status as
          | "succeeded"
          | "requires_capture"
          | "processing"
          | "requires_payment_method"
      }
      paymentIntentId={paymentIntentId}
      bookingId={bookingId}
    />
  );
}

async function SuccessContent({
  searchParams,
}: {
  searchParams: Awaited<SuccessPageProps["searchParams"]>;
}) {
  const paymentIntentId = searchParams.payment_intent as string;
  const bookingId = searchParams.booking_id as string;

  if (!paymentIntentId || !bookingId) {
    redirect("/");
  }

  return (
    <PaymentStatus paymentIntentId={paymentIntentId} bookingId={bookingId} />
  );
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Kontrollerer betalingsstatus...</p>
          </div>
        </div>
      }
    >
      <SuccessContent searchParams={await searchParams} />
    </Suspense>
  );
}
