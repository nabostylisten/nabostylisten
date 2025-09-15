import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/config";
import { createServiceClient } from "@/lib/supabase/service";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_IDENTITY_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  const supabase = await createServiceClient();

  try {
    switch (event.type) {
      case "identity.verification_session.verified":
        const verifiedSession = event.data
          .object as Stripe.Identity.VerificationSession;
        const verifiedProfileId = verifiedSession.metadata?.profile_id;

        console.log(
          `🔍 Processing identity.verification_session.verified event:`,
          {
            sessionId: verifiedSession.id,
            profileId: verifiedProfileId,
            status: verifiedSession.status,
          }
        );

        if (verifiedProfileId) {
          console.log(
            `✅ Identity verification completed for profile: ${verifiedProfileId}`,
          );

          // First check if the record exists
          const { data: existingRecord, error: fetchError } = await supabase
            .from("stylist_details")
            .select("profile_id, stripe_verification_session_id")
            .eq("profile_id", verifiedProfileId)
            .eq("stripe_verification_session_id", verifiedSession.id);

          console.log(`🔍 Database lookup result:`, { 
            existingRecord, 
            fetchError,
            expectedSessionId: verifiedSession.id 
          });

          const { data: updateResult, error } = await supabase
            .from("stylist_details")
            .update({
              identity_verification_completed_at: new Date().toISOString(),
            })
            .eq("profile_id", verifiedProfileId)
            .eq("stripe_verification_session_id", verifiedSession.id)
            .select();

          if (error) {
            console.error(
              `❌ Failed to update identity verification completion:`,
              error,
            );
          } else {
            console.log(`✅ Successfully updated identity verification:`, updateResult);
          }
        } else {
          console.error(`❌ No profile_id in session metadata`);
        }
        break;

      case "identity.verification_session.requires_input":
        const failedSession = event.data
          .object as Stripe.Identity.VerificationSession;
        const failedProfileId = failedSession.metadata?.profile_id;

        if (failedProfileId) {
          console.log(
            `Identity verification requires input for profile: ${failedProfileId}`,
          );

          // Optionally clear the completion timestamp to allow retry
          const { error } = await supabase
            .from("stylist_details")
            .update({
              identity_verification_completed_at: null,
            })
            .eq("profile_id", failedProfileId)
            .eq("stripe_verification_session_id", failedSession.id);

          if (error) {
            console.error(
              "Failed to clear identity verification completion:",
              error,
            );
          }
        }
        break;

      case "identity.verification_session.processing":
        const processingSession = event.data
          .object as Stripe.Identity.VerificationSession;
        console.log(
          `Identity verification processing for session: ${processingSession.id}`,
        );
        // Could add processing status update here if needed
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }

  return new Response("Success", { status: 200 });
}
