// Ensure this file is server-only
import 'server-only'

import { resend } from "@/lib/resend";
import type { ReactElement } from "react";

interface SendEmailOptions {
  to: string[];
  subject: string;
  react: ReactElement;
}

/**
 * Send email with environment-aware configuration
 * 
 * In development:
 * - Uses DEV_EMAIL_FROM for from address
 * - Uses DEV_EMAIL_TO for to address
 * 
 * In production:
 * - Uses PROD_EMAIL_FROM for from address
 * - Uses actual recipient emails from the to parameter
 * 
 * @param options - Email options with to, subject, and react content
 * @returns Promise<{error: string | null}>
 */
export async function sendEmail({ to, subject, react }: SendEmailOptions): Promise<{error: string | null}> {
  const isDevelopment = process.env.NODE_ENV === "development";

  const fromAddress = isDevelopment 
    ? process.env.DEV_EMAIL_FROM 
    : process.env.PROD_EMAIL_FROM;

  const toAddresses = isDevelopment
    ? [process.env.DEV_EMAIL_TO as string]
    : to;

  if (!fromAddress) {
    throw new Error("From address is not set");
  }

  if (!toAddresses || toAddresses.length === 0) {
    throw new Error("To addresses are not set");
  }


  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: toAddresses,
      subject,
      react,
    });

    if (error) {
      console.error("[RESEND_UTILS] Email send error:", error);
      return { error: error.message || "Failed to send email" };
    }

    console.log(`[RESEND_UTILS] Email sent successfully to:\n${toAddresses.map(address => `- ${address}`).join("\n")}\n(from: ${fromAddress})`);
    return { error: null };

  } catch (error) {
    console.error("[RESEND_UTILS] Unexpected error sending email:", error);
    return { 
      error: error instanceof Error ? error.message : "Unexpected error sending email" 
    };
  }
}