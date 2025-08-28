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
  layoutStyles,
  colors,
} from "./utils/styles";
import { baseUrl } from "./utils";

interface BookingRescheduledEmailProps {
  logoUrl: string;
  customerName: string;
  stylistName: string;
  bookingId: string;
  stylistId: string;
  serviceName: string;
  originalBookingDate: string;
  originalBookingTime: string;
  newBookingDate: string;
  newBookingTime: string;
  rescheduleReason: string;
  location: string;
  recipientType: "customer" | "stylist";
}

export const BookingRescheduledEmail = ({
  logoUrl,
  customerName = "Ola Nordmann",
  stylistName = "Anna Stylist",
  bookingId = "12345",
  stylistId = "67890",
  serviceName = "Hårklipp og styling",
  originalBookingDate = "15. januar 2024",
  originalBookingTime = "14:00 - 15:30",
  newBookingDate = "16. januar 2024", 
  newBookingTime = "10:00 - 11:30",
  rescheduleReason = "Uforutsette omstendigheter",
  location = "Hjemme hos deg",
  recipientType = "customer",
}: BookingRescheduledEmailProps) => {
  const previewText = `Booking flyttet: ${serviceName} - ny tid ${newBookingTime}`;

  const greetingMessage = recipientType === "customer"
    ? `Hei ${customerName}! Din booking hos ${stylistName} er blitt flyttet til et nytt tidspunkt.`
    : `Hei ${stylistName}! Du har flyttet bookingen med ${customerName} til et nytt tidspunkt.`;

  const explanationMessage = recipientType === "customer"
    ? `${stylistName} har flyttet din booking med følgende begrunnelse: "${rescheduleReason}". Vi beklager eventuelle ulemper dette måtte medføre.`
    : `Du har flyttet bookingen med ${customerName}. Kunden har mottatt informasjon om den nye tiden.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={logoUrl}
              width="120"
              height="36"
              alt="Nabostylisten"
              style={logo}
            />
          </Section>

          <Heading style={heading}>
            Booking flyttet
          </Heading>

          <Text style={paragraph}>
            {greetingMessage}
          </Text>

          {/* Status section with calendar icon */}
          <Section style={statusSection}>
            <Text style={statusLabel}>Status:</Text>
            <Text style={{ ...statusValue, color: colors.warning }}>
              Flyttet
            </Text>
          </Section>

          <Text style={paragraph}>
            {explanationMessage}
          </Text>

          {/* Original booking details */}
          <Section style={originalBookingSection}>
            <Text style={originalSectionHeader}>Opprinnelig tidspunkt:</Text>

            <div style={detailRow}>
              <Text style={detailLabel}>Dato:</Text>
              <Text style={originalDetailValue}>{originalBookingDate}</Text>
            </div>

            <div style={detailRow}>
              <Text style={detailLabel}>Tid:</Text>
              <Text style={originalDetailValue}>{originalBookingTime}</Text>
            </div>
          </Section>

          {/* New booking details */}
          <Section style={newBookingSection}>
            <Text style={newSectionHeader}>Nytt tidspunkt:</Text>

            <div style={detailRow}>
              <Text style={detailLabel}>Tjeneste:</Text>
              <Text style={newDetailValue}>{serviceName}</Text>
            </div>

            <div style={detailRow}>
              <Text style={detailLabel}>Dato:</Text>
              <Text style={newDetailValue}>{newBookingDate}</Text>
            </div>

            <div style={detailRow}>
              <Text style={detailLabel}>Tid:</Text>
              <Text style={newDetailValue}>{newBookingTime}</Text>
            </div>

            <div style={detailRow}>
              <Text style={detailLabel}>Sted:</Text>
              <Text style={newDetailValue}>{location}</Text>
            </div>

            <div style={detailRow}>
              <Text style={detailLabel}>
                {recipientType === "customer" ? "Stylist:" : "Kunde:"}
              </Text>
              <Text style={newDetailValue}>
                {recipientType === "customer" ? stylistName : customerName}
              </Text>
            </div>
          </Section>

          {/* Reschedule reason */}
          <Section style={reasonSection}>
            <Text style={reasonLabel}>
              {recipientType === "customer" 
                ? `Begrunnelse fra ${stylistName}:` 
                : "Din begrunnelse for flytting:"}
            </Text>
            <Text style={reasonText}>{rescheduleReason}</Text>
          </Section>

          {/* Call to Action */}
          <Section style={ctaSection}>
            <Text style={paragraph}>
              {recipientType === "customer"
                ? "Se alle detaljer for din flyttede booking og kommuniser direkte med stylisten hvis nødvendig."
                : "Se alle detaljer for den flyttede bookingen og følg opp med kunden om nødvendig."}
            </Text>
            <Button
              style={{ ...button, backgroundColor: colors.primary }}
              href={`${baseUrl}/bookinger/${bookingId}`}
            >
              Se booking
            </Button>
          </Section>

          {recipientType === "customer" && (
            <Section style={reminderSection}>
              <Text style={reminderText}>
                <strong>Husk:</strong> Den nye tiden er {newBookingTime} den {newBookingDate}. 
                Vi anbefaler å legge dette inn i kalenderen din med en påminnelse.
              </Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Hvis du har spørsmål om denne endringen, kan du kontakte oss på{" "}
            <Link href="mailto:support@nabostylisten.no" style={link}>
              support@nabostylisten.no
            </Link>{" "}
            eller kommunisere direkte via booking-chatten.
          </Text>

          <Text style={footer}>Booking ID: {bookingId}</Text>
        </Container>
      </Body>
    </Html>
  );
};

BookingRescheduledEmail.PreviewProps = {
  logoUrl: "https://example.com/logo.png",
  customerName: "Ola Nordmann",
  stylistName: "Anna Stylist",
  bookingId: "booking_12345",
  stylistId: "stylist_67890",
  serviceName: "Hårklipp og styling",
  originalBookingDate: "15. januar 2024",
  originalBookingTime: "14:00 - 15:30",
  newBookingDate: "16. januar 2024",
  newBookingTime: "10:00 - 11:30",
  rescheduleReason: "Måtte flytte på grunn av sykdom, beklager det korte varselet",
  location: "Hjemme hos deg",
  recipientType: "customer" as const,
} as BookingRescheduledEmailProps;

export default BookingRescheduledEmail;

// Using shared Nabostylisten branded styles
const main = baseStyles.main;
const container = baseStyles.container;
const logoContainer = baseStyles.logoContainer;
const logo = baseStyles.logo;
const heading = baseStyles.heading;
const paragraph = baseStyles.paragraph;
const ctaSection = sectionStyles.actionSection;
const button = buttonStyles.primary;
const hr = baseStyles.hr;
const footer = baseStyles.footer;
const link = baseStyles.link;

const statusSection = {
  ...sectionStyles.infoSection,
  border: "2px solid",
  borderColor: colors.warning,
  textAlign: "center" as const,
  backgroundColor: "#fef3c7", // Light yellow background
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
  color: colors.warning,
  margin: "0",
};

const originalBookingSection = {
  ...sectionStyles.infoSection,
  border: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb",
};

const originalSectionHeader = {
  ...textStyles.sectionHeader,
  color: colors.mutedForeground,
  textDecoration: "line-through",
};

const originalDetailValue = {
  ...textStyles.detailValue,
  color: colors.mutedForeground,
  textDecoration: "line-through",
};

const newBookingSection = {
  ...sectionStyles.infoSection,
  border: "2px solid #10b981",
  backgroundColor: "#ecfdf5",
};

const newSectionHeader = {
  ...textStyles.sectionHeader,
  color: "#059669",
  fontWeight: "600",
};

const newDetailValue = {
  ...textStyles.detailValue,
  color: "#059669",
  fontWeight: "600",
};

const detailRow = layoutStyles.detailRow;
const detailLabel = textStyles.detailLabel;

const reasonSection = {
  ...sectionStyles.messageSection,
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
};

const reasonLabel = {
  ...textStyles.messageHeader,
  color: "#92400e",
};

const reasonText = {
  ...textStyles.messageContent,
  color: "#92400e",
  fontStyle: "italic",
};

const reminderSection = {
  ...sectionStyles.infoSection,
  backgroundColor: "#dbeafe",
  border: "1px solid #3b82f6",
};

const reminderText = {
  ...textStyles.detailValue,
  color: "#1e40af",
  textAlign: "center" as const,
};