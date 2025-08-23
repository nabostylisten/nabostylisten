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
import { baseStyles, sectionStyles, textStyles, buttonStyles, layoutStyles, colors, statusColors } from "../utils/styles";

interface BookingStatusUpdateEmailProps {
  customerName: string;
  stylistName: string;
  bookingId: string;
  stylistId: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  status: "confirmed" | "cancelled";
  message?: string;
  location: string;
  recipientType: "customer" | "stylist";
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const BookingStatusUpdateEmail = ({
  customerName = "Ola Nordmann",
  stylistName = "Anna Stylist",
  bookingId = "12345",
  stylistId = "67890",
  serviceName = "Hårklipp og styling",
  bookingDate = "15. januar 2024",
  bookingTime = "14:00 - 15:30",
  status = "confirmed",
  message,
  location = "Hjemme hos deg",
  recipientType = "customer",
}: BookingStatusUpdateEmailProps) => {
  const statusLabels = {
    confirmed: "Bekreftet",
    cancelled: "Avlyst",
  };

  const statusDescriptions = {
    confirmed: recipientType === "customer" 
      ? `Din booking er bekreftet av ${stylistName}. Se frem til en fantastisk opplevelse!`
      : `Du har bekreftet bookingen med ${customerName}. Forbered deg på å levere en fantastisk opplevelse!`,
    cancelled: recipientType === "customer"
      ? `Din booking har blitt avlyst av ${stylistName}. Vi beklager ulempen dette måtte medføre.`
      : `Du har avlyst bookingen med ${customerName}. Kunden vil bli informert om avlysningen.`,
  };

  const emailStatusColors = statusColors;

  const previewText = `Booking ${statusLabels[status].toLowerCase()}: ${serviceName}`;

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

          <Heading style={heading}>
            Booking {statusLabels[status].toLowerCase()}
          </Heading>

          <Text style={paragraph}>
            {recipientType === "customer" 
              ? `Hei ${customerName}! Din booking hos ${stylistName} har fått en statusoppdatering.`
              : `Hei ${stylistName}! Bookingen med ${customerName} har fått en statusoppdatering.`
            }
          </Text>

          <Section style={{...statusSection, borderColor: statusColors[status]}}>
            <Text style={statusLabel}>Status:</Text>
            <Text style={{...statusValue, color: statusColors[status]}}>
              {statusLabels[status]}
            </Text>
          </Section>

          <Text style={paragraph}>{statusDescriptions[status]}</Text>

          {/* Booking Details */}
          <Section style={bookingDetailsSection}>
            <Text style={sectionHeader}>Bookingdetaljer:</Text>
            
            <div style={detailRow}>
              <Text style={detailLabel}>Tjeneste:</Text>
              <Text style={detailValue}>{serviceName}</Text>
            </div>
            
            <div style={detailRow}>
              <Text style={detailLabel}>Dato:</Text>
              <Text style={detailValue}>{bookingDate}</Text>
            </div>
            
            <div style={detailRow}>
              <Text style={detailLabel}>Tid:</Text>
              <Text style={detailValue}>{bookingTime}</Text>
            </div>
            
            <div style={detailRow}>
              <Text style={detailLabel}>Sted:</Text>
              <Text style={detailValue}>{location}</Text>
            </div>
            
            <div style={detailRow}>
              <Text style={detailLabel}>
                {recipientType === "customer" ? "Stylist:" : "Kunde:"}
              </Text>
              <Text style={detailValue}>
                {recipientType === "customer" ? stylistName : customerName}
              </Text>
            </div>
          </Section>

          {/* Message */}
          {message && (
            <Section style={messageSection}>
              <Text style={messageLabel}>
                {recipientType === "customer" 
                  ? `Melding fra ${stylistName}:`
                  : "Din melding til kunden:"
                }
              </Text>
              <Text style={messageText}>{message}</Text>
            </Section>
          )}

          {/* Call to Action */}
          {status === "confirmed" && (
            <Section style={ctaSection}>
              <Text style={paragraph}>
                {recipientType === "customer"
                  ? "Se alle detaljer for bookingen din og kommuniser direkte med stylisten."
                  : "Se alle detaljer for bookingen og kommuniser med kunden om nødvendig."
                }
              </Text>
              <Button 
                style={{...button, backgroundColor: statusColors[status]}} 
                href={`${baseUrl}/bookinger/${bookingId}`}
              >
                Se booking
              </Button>
            </Section>
          )}

          {status === "cancelled" && recipientType === "customer" && (
            <Section style={ctaSection}>
              <Text style={paragraph}>
                Du kan søke etter andre tilgjengelige stylister eller book en
                ny time hos {stylistName} når det passer bedre.
              </Text>
              <Button style={{...button, backgroundColor: statusColors[status]}} href={`${baseUrl}/services`}>
                Finn ny stylist
              </Button>
            </Section>
          )}

          {status === "cancelled" && recipientType === "stylist" && (
            <Section style={ctaSection}>
              <Text style={paragraph}>
                Bookingen er nå avlyst og kunden er informert. Du kan se andre 
                ventende forespørsler i din bookingsoversikt.
              </Text>
              <Button style={{...button, backgroundColor: statusColors[status]}} href={`${baseUrl}/profiler/${stylistId}/mine-bookinger`}>
                Se mine bookinger
              </Button>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Hvis du har spørsmål, kan du kontakte oss på{" "}
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

BookingStatusUpdateEmail.PreviewProps = {
  customerName: "Ola Nordmann",
  stylistName: "Anna Stylist",
  bookingId: "booking_12345",
  stylistId: "stylist_67890",
  serviceName: "Hårklipp og styling",
  bookingDate: "15. januar 2024",
  bookingTime: "14:00 - 15:30",
  status: "confirmed" as const,
  message: "Ser frem til å møte deg! Ring hvis du har spørsmål.",
  location: "Hjemme hos deg",
  recipientType: "customer" as const,
} as BookingStatusUpdateEmailProps;

export default BookingStatusUpdateEmail;

// Using shared Nabostylisten branded styles
const main = baseStyles.main;
const container = baseStyles.container;
const logoContainer = baseStyles.logoContainer;
const logo = baseStyles.logo;
const heading = baseStyles.heading;
const paragraph = baseStyles.paragraph;
const bookingDetailsSection = sectionStyles.infoSection;
const sectionHeader = textStyles.sectionHeader;
const detailRow = layoutStyles.detailRow;
const detailLabel = textStyles.detailLabel;
const detailValue = textStyles.detailValue;
const messageSection = sectionStyles.messageSection;
const messageLabel = textStyles.messageHeader;
const messageText = textStyles.messageContent;
const ctaSection = sectionStyles.actionSection;
const button = buttonStyles.primary;
const hr = baseStyles.hr;
const footer = baseStyles.footer;
const link = baseStyles.link;

const statusSection = {
  ...sectionStyles.infoSection,
  border: "2px solid",
  borderColor: colors.accentForeground, // Will be overridden by status color
  textAlign: "center" as const,
};

const statusLabel = {
  fontSize: "14px",
  fontWeight: "500",
  color: colors.mutedForeground,
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const statusValue = {
  fontSize: "20px",
  fontWeight: "600",
  color: colors.accentForeground, // Will be overridden by status color
  margin: "0",
};