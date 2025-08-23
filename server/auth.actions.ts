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
}: {
  email: string;
  userName?: string;
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return { error: "Email service not configured", success: false };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      // TODO: Change to production email after we have setup
      // from: "Nabostylisten <noreply@nabostylisten.no>",
      from: "Nabostylisten <noreply@magnusrodseth.no>",
      to: [email],
      subject: "Velkommen til Nabostylisten",
      react: WelcomeEmail({
        userName: userName || "Kjære kunde",
      }),
    });

    if (error) {
      console.error("Failed to send welcome email:", error);
      return { error: "Failed to send welcome email", success: false };
    }

    console.log("Welcome email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return {
      error: "An error occurred while sending welcome email",
      success: false,
    };
  }
}
