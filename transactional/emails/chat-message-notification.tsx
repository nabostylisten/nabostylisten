import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import {
  baseStyles,
  sectionStyles,
  textStyles,
  buttonStyles,
  colors,
} from "./utils/styles";
import { baseUrl } from "./utils";
import { NotificationSettings } from "../components/notification-settings";

interface ChatMessageNotificationEmailProps {
  recipientProfileId: string;
  recipientName: string;
  senderName: string;
  senderRole: "customer" | "stylist";
  message: string;
  bookingId: string;
  serviceName: string;
  bookingDate: string;
  chatUrl: string;
}

export const ChatMessageNotificationEmail = ({
  recipientProfileId = "12345",
  recipientName = "Ola Nordmann",
  senderName = "Anna Stylist",
  senderRole = "stylist",
  message = "Hei! Jeg gleder meg til å møte deg i morgen. Er det noe spesielt du ønsker at jeg skal fokusere på?",
  bookingId = "12345",
  serviceName = "Hårklipp og styling",
  bookingDate = "15. januar 2024",
  chatUrl = "/chat/12345",
}: ChatMessageNotificationEmailProps) => {
  const roleText = senderRole === "stylist" ? "stylisten din" : "kunden din";
  const previewText = `Ny melding fra ${senderName}: ${message.substring(0, 50)}${message.length > 50 ? "..." : ""}`;

  // Truncate message if too long for email
  const truncatedMessage =
    message.length > 200 ? `${message.substring(0, 200)}...` : message;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={`${baseUrl}/static/nabostylisten-logo.png`}
              width="120"
              height="36"
              alt="Nabostylisten"
              style={logo}
            />
          </Section>

          <Section style={messageTypeBanner}>
            <Text style={messageTypeText}>Ny melding</Text>
          </Section>

          <Heading style={heading}>Du har fått en ny melding!</Heading>

          <Text style={paragraph}>
            Hei {recipientName}! Du har mottatt en ny melding fra {senderName},{" "}
            {roleText}.
          </Text>

          {/* Booking Context */}
          <Section style={bookingContextSection}>
            <Text style={contextHeader}>Angående booking:</Text>
            <Text style={contextText}>
              <strong>{serviceName}</strong>
              <br />
              {bookingDate}
            </Text>
          </Section>

          {/* Message Content */}
          <Section style={messageSection}>
            <Text style={messageHeader}>Melding fra {senderName}:</Text>
            <Text style={messageContent}>"{truncatedMessage}"</Text>
            {message.length > 200 && (
              <Text style={messageTruncated}>
                Se hele meldingen i chatten →
              </Text>
            )}
          </Section>

          {/* Message Metadata */}
          <Section style={metadataSection}>
            <div style={metadataRow}>
              <Text style={metadataLabel}>Fra:</Text>
              <Text style={metadataValue}>{senderName}</Text>
            </div>
            <div style={metadataRow}>
              <Text style={metadataLabel}>Rolle:</Text>
              <Text style={metadataValue}>
                {senderRole === "stylist" ? "Stylist" : "Kunde"}
              </Text>
            </div>
            <div style={metadataRow}>
              <Text style={metadataLabel}>Booking:</Text>
              <Text style={metadataValue}>#{bookingId}</Text>
            </div>
          </Section>

          {/* Call to Action */}
          <Section style={ctaSection}>
            <Text style={paragraph}>
              Svar direkte i chatten for rask kommunikasjon.
            </Text>
            <Button style={button} href={`${baseUrl}${chatUrl}`}>
              Åpne chat
            </Button>
          </Section>

          {/* Tips Section */}
          <Section style={tipsSection}>
            <Text style={tipsHeader}>Tips for god kommunikasjon:</Text>
            <Text style={tipsText}>
              • Svar raskt for best opplevelse
              <br />
              • Vær tydelig på spørsmål og behov
              <br />
              • Del gjerne inspirasjon og referansebilder
              <br />• Still spørsmål hvis noe er uklart
            </Text>
          </Section>

          <NotificationSettings
            profileId={recipientProfileId}
            notificationType="chat_messages"
          />

          <Hr style={hr} />

          <Text style={footer}>
            Hvis du har tekniske problemer med chatten, kontakt oss på{" "}
            <Link href="mailto:support@nabostylisten.no" style={link}>
              support@nabostylisten.no
            </Link>
          </Text>

          <Text style={footer}>Booking ID: {bookingId}</Text>
        </Container>
      </Body>
    </Html>
  );
};

ChatMessageNotificationEmail.PreviewProps = {
  recipientName: "Ola Nordmann",
  senderName: "Anna Stylist",
  senderRole: "stylist" as const,
  message:
    "Hei! Jeg gleder meg til å se deg i morgen. Har du noen spesielle ønsker for frisyren?",
  bookingId: "booking_12345",
  serviceName: "Hårklipp og styling",
  bookingDate: "15. januar 2024",
  chatUrl: "https://nabostylisten.no/chat/123",
} as ChatMessageNotificationEmailProps;

export default ChatMessageNotificationEmail;

// Styled with Nabostylisten branded colors
const main = {
  backgroundColor: "#f8f6ff", // --background
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(69, 58, 107, 0.1)",
};

const logoContainer = {
  marginBottom: "32px",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
};

const messageTypeBanner = {
  backgroundColor: "#e8f5e8", // --accent
  borderRadius: "8px",
  padding: "12px 20px",
  textAlign: "center" as const,
  marginBottom: "24px",
  border: "2px solid #4a7c4a", // --accent-foreground
};

const messageTypeText = {
  color: "#4a7c4a", // --accent-foreground
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const heading = {
  fontSize: "28px",
  letterSpacing: "-0.5px",
  lineHeight: "1.2",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const paragraph = {
  margin: "0 0 20px",
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#453a6b", // --foreground
};

const bookingContextSection = {
  margin: "32px 0",
  padding: "16px 20px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "8px",
  borderLeft: "4px solid #9b8cc8", // --primary
};

const contextHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 8px",
};

const contextText = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#6b6682", // --muted-foreground
  margin: "0",
};

const messageSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#ffffff",
  border: "2px solid #9b8cc8", // --primary
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(155, 140, 200, 0.1)",
};

const messageHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 16px",
};

const messageContent = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#453a6b", // --foreground
  margin: "0 0 12px",
  padding: "16px",
  backgroundColor: "#f8f6ff", // --background
  borderRadius: "8px",
  border: "1px solid rgba(155, 140, 200, 0.2)",
  fontStyle: "italic",
};

const messageTruncated = {
  fontSize: "12px",
  color: "#6b6682", // --muted-foreground
  margin: "0",
  textAlign: "right" as const,
};

const metadataSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "8px",
};

const metadataRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "8px",
};

const metadataLabel = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#6b6682", // --muted-foreground
  margin: "0",
  flex: "0 0 80px",
};

const metadataValue = {
  fontSize: "13px",
  fontWeight: "400",
  color: "#453a6b", // --foreground
  margin: "0",
  textAlign: "right" as const,
  flex: "1",
};

const ctaSection = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#9b8cc8", // --primary
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
  margin: "20px 0",
  boxShadow: "0 2px 4px rgba(155, 140, 200, 0.3)",
};

const tipsSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#fee7dc", // --secondary
  borderRadius: "8px",
  border: "1px solid rgba(194, 114, 74, 0.3)", // --secondary-foreground with transparency
};

const tipsHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 12px",
};

const tipsText = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#c2724a", // --secondary-foreground
  margin: "0",
};

const settingsSection = {
  margin: "32px 0",
  padding: "16px",
  backgroundColor: "rgba(155, 140, 200, 0.05)",
  borderRadius: "8px",
  textAlign: "center" as const,
};

const settingsText = {
  fontSize: "12px",
  color: "#6b6682", // --muted-foreground
  margin: "0 0 8px",
};

const settingsLink = {
  fontSize: "12px",
  color: "#9b8cc8", // --primary
  textDecoration: "none",
  fontWeight: "500",
};

const hr = {
  borderColor: "#edeaf7", // --muted
  margin: "40px 0 24px",
  borderWidth: "1px",
  borderStyle: "solid",
};

const footer = {
  color: "#6b6682", // --muted-foreground
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0 0 8px",
  textAlign: "center" as const,
};

const link = {
  color: "#9b8cc8", // --primary
  textDecoration: "none",
  fontWeight: "500",
};
