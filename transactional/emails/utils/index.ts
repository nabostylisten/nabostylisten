// Shared constants for Nabostylisten email templates

export const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export function getSupabaseAssetUrl(filename: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
  }

  return `${supabaseUrl}/storage/v1/object/public/assets/${filename}`;
}

export function getNabostylistenLogoUrl(format: "svg" | "png" = "png"): string {
  const filename = format === "svg"
    ? "nabostylisten_logo.svg"
    : "nabostylisten_logo.png";
  return getSupabaseAssetUrl(filename);
}

// Notification preference labels for different types
export const notificationLabels = {
  newsletter_subscribed: "nyhetsbrev",
  marketing_emails: "e-poster for markedsføring",
  promotional_sms: "kampanje-SMS",
  booking_confirmations: "bookingbekreftelser",
  booking_reminders: "booking-påminnelser",
  booking_cancellations: "avlysningsvarsler",
  booking_status_updates: "booking-statusoppdateringer",
  chat_messages: "chat-meldinger",
  new_booking_requests: "nye bookingforesp�rsler",
  review_notifications: "anmeldelsesvarsler",
  payment_notifications: "betalingsvarsler",
  application_status_updates: "søknadsoppdateringer",
  security_alerts: "sikkerhetsvarsler",
  system_updates: "systemoppdateringer",
  email_delivery: "e-postvarsler",
  sms_delivery: "SMS-varsler",
  push_notifications: "push-varsler",
} as const;

export type NotificationType = keyof typeof notificationLabels;
