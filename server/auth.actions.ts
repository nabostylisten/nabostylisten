"use server";

import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { WelcomeEmail } from "@/transactional/emails/welcome";

export async function checkUserExists(email: string) {
  try {
    const supabase = await createClient();

    // Query the profiles table directly by email
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error checking user exists:", error);
      return { error: "Kunne ikke sjekke bruker", exists: false };
    }

    return { exists: !!data, error: null };
  } catch (error) {
    console.error("Error checking user exists:", error);
    return { error: "En feil oppstod ved sjekk av bruker", exists: false };
  }
}

export async function sendWelcomeEmail({
  email,
  userName,
  userId,
}: {
  email: string;
  userName?: string;
  userId: string;
}) {
  console.log("[WELCOME_EMAIL] Starting welcome email send", {
    email,
    userName,
    userId,
  });

  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("[WELCOME_EMAIL] RESEND_API_KEY is not configured");
      return { error: "Email service not configured", success: false };
    }

    console.log("[WELCOME_EMAIL] Initializing Resend client");
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log("[WELCOME_EMAIL] Sending email via Resend", {
      from: "Nabostylisten <noreply@magnusrodseth.no>",
      to: email,
      subject: "Velkommen til Nabostylisten",
      userName: userName || "Kjære kunde",
    });

    const { data, error } = await resend.emails.send({
      // TODO: Change to production email after we have setup
      // from: "Nabostylisten <noreply@nabostylisten.no>",
      from: "Nabostylisten <no-reply@magnusrodseth.com>",
      // to: [email],
      to: ["magnus.rodseth@gmail.com"],
      subject: "Velkommen til Nabostylisten",
      react: WelcomeEmail({
        userName: userName || "Kjære kunde",
        userId: userId,
      }),
    });

    if (error) {
      console.error("[WELCOME_EMAIL] Failed to send welcome email:", error);
      return { error: "Failed to send welcome email", success: false };
    }

    console.log("[WELCOME_EMAIL] Welcome email sent successfully:", {
      emailId: data?.id,
      recipient: email,
    });
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("[WELCOME_EMAIL] Error sending welcome email:", error);
    return {
      error: "An error occurred while sending welcome email",
      success: false,
    };
  }
}
