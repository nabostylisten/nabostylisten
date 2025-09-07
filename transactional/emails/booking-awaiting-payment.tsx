import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { NotificationSettings } from "../components/notification-settings";
import { brandColors } from "../../lib/brand";
import { baseUrl } from "./utils";

interface BookingAwaitingPaymentProps {
  logoUrl: string;
  customerName: string;
  customerProfileId: string;
  stylistName: string;
  bookingId: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  location: string;
}

export const BookingAwaitingPayment = ({
  logoUrl,
  customerName,
  customerProfileId,
  stylistName,
  bookingId,
  serviceName,
  bookingDate,
  bookingTime,
  location,
}: BookingAwaitingPaymentProps) => {
  const previewText = `Din booking med ${stylistName} er opprettet og venter på betaling`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoContainer}>
            <Img
              src={logoUrl}
              width="120"
              height="36"
              alt="Nabostylisten"
              style={logo}
            />
          </Section>

          {/* Content */}
          <Section>
            <Heading style={heading}>Hei {customerName}!</Heading>
            <Text style={paragraph}>
              Din booking med <strong>{stylistName}</strong> er opprettet!
            </Text>

            <Section style={detailsSection}>
              <Text style={detailsTitle}>Bookingdetaljer:</Text>
              <Text style={detailsText}>
                <strong>Tjeneste:</strong> {serviceName}
                <br />
                <strong>Dato:</strong> {bookingDate}
                <br />
                <strong>Tid:</strong> {bookingTime}
                <br />
                <strong>Sted:</strong> {location}
                <br />
                <strong>Booking ID:</strong> {bookingId}
              </Text>
            </Section>

            <Section style={infoSection}>
              <Text style={infoText}>
                <strong>Betalingsstatus:</strong> Din booking venter på at
                stylisten fullfører sitt betalingsoppsett. Stylisten har blitt
                varslet og vil fullføre dette så snart som mulig.
              </Text>
              <Text style={infoText}>
                Du vil motta en bekreftelse så snart betalingen er behandlet.
                Hvis du har spørsmål, kan du kontakte stylisten direkte via
                plattformen eller kontakte vår kundeservice.
              </Text>
            </Section>

            <Section style={buttonSection}>
              <Button
                style={button}
                href={`${baseUrl}/protected/bookings?booking_id=${bookingId}`}
              >
                Se bookingdetaljer
              </Button>
            </Section>

            <NotificationSettings
              profileId={customerProfileId}
              notificationType="booking_confirmations"
            />
          </Section>

          {/* Help section */}
          <Section style={helpSection}>
            <Text style={helpText}>
              Trenger du hjelp? Ta kontakt med oss på{" "}
              <Link href="mailto:support@nabostylisten.no" style={link}>
                support@nabostylisten.no
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

BookingAwaitingPayment.PreviewProps = {
  logoUrl: "https://example.com/logo.png",
  customerName: "Ola Nordmann",
  customerProfileId: "123e4567-e89b-12d3-a456-426614174000",
  stylistName: "Anna Stylist",
  bookingId: "123e4567-e89b-12d3-a456-426614174000",
  serviceName: "Hårklipp",
  bookingDate: "Mandag 15. januar 2025",
  bookingTime: "14:00 - 15:00",
  location: "Osloveien 1, 0101 Oslo",
} as BookingAwaitingPaymentProps;

export default BookingAwaitingPayment;

// Styled with Nabostylisten branded colors
const main = {
  backgroundColor: brandColors.light.background,
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: `0 4px 6px ${brandColors.light.foreground}1a`, // 10% opacity
};

const logoContainer = {
  marginBottom: "32px",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
};

const heading = {
  fontSize: "28px",
  letterSpacing: "-0.5px",
  lineHeight: "1.2",
  fontWeight: "600",
  color: brandColors.light.foreground,
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: brandColors.light.foreground,
  margin: "0 0 20px",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: brandColors.light.primary,
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
  margin: "16px 0",
  boxShadow: `0 2px 4px ${brandColors.light.primary}4d`, // 30% opacity
};

const infoSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#fef3c7", // Amber-100 for warning/info
  borderRadius: "10px",
  border: `2px solid #f59e0b`, // Amber-500
};

const infoText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: brandColors.light.foreground,
  margin: "0 0 12px",
};

const detailsSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: brandColors.light.muted,
  borderRadius: "10px",
  border: `1px solid ${brandColors.light.primary}4d`, // 30% opacity
};

const detailsTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: brandColors.light.foreground,
  margin: "0 0 12px",
};

const detailsText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: brandColors.light.foreground,
  margin: "0",
};

const helpSection = {
  margin: "32px 0 16px",
  textAlign: "center" as const,
};

const helpText = {
  fontSize: "13px",
  color: brandColors.light.foreground,
  opacity: 0.7,
  margin: "0",
};

const link = {
  color: brandColors.light.primary,
  textDecoration: "none",
  fontWeight: "500",
};
