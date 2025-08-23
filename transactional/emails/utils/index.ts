// Shared constants for Nabostylisten email templates

export const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

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
