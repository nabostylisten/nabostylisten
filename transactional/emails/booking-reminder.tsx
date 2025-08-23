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
import { baseStyles, sectionStyles, textStyles, buttonStyles, layoutStyles, colors } from "../utils/styles";

interface BookingReminderEmailProps {
  customerName: string;
  stylistName: string;
  bookingId: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  location: string;
  address?: string;
  entryInstructions?: string;
  stylistPhone?: string;
  totalPrice: number;
  currency: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const BookingReminderEmail = ({
  customerName = "Ola Nordmann",
  stylistName = "Anna Stylist",
  bookingId = "12345",
  serviceName = "Hårklipp og styling",
  bookingDate = "15. januar 2024",
  bookingTime = "14:00 - 15:30",
  location = "Hjemme hos deg",
  address = "Storgata 1, 0001 Oslo",
  entryInstructions,
  stylistPhone = "+47 123 45 678",
  totalPrice = 650,
  currency = "NOK",
}: BookingReminderEmailProps) => {
  const previewText = `Påminnelse: ${serviceName} i morgen kl ${bookingTime.split(' - ')[0]}`;

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

          <Section style={reminderBanner}>
            <Text style={reminderText}>⏰ Påminnelse</Text>
          </Section>

          <Heading style={heading}>
            Din time er i morgen!
          </Heading>

          <Text style={paragraph}>
            Hei {customerName}! Dette er en vennlig påminnelse om din kommende time hos {stylistName}.
          </Text>

          {/* Booking Details */}
          <Section style={bookingDetailsSection}>
            <Text style={sectionHeader}>Detaljer for din booking:</Text>
            
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
              <Text style={detailLabel}>Stylist:</Text>
              <Text style={detailValue}>{stylistName}</Text>
            </div>
            
            <div style={detailRow}>
              <Text style={detailLabel}>Sted:</Text>
              <Text style={detailValue}>{location}</Text>
            </div>

            {address && (
              <div style={detailRow}>
                <Text style={detailLabel}>Adresse:</Text>
                <Text style={detailValue}>{address}</Text>
              </div>
            )}

            <div style={detailRow}>
              <Text style={detailLabel}>Pris:</Text>
              <Text style={detailValue}>{totalPrice} {currency}</Text>
            </div>
          </Section>

          {/* Entry Instructions */}
          {entryInstructions && (
            <Section style={instructionsSection}>
              <Text style={instructionsLabel}>
                📝 Adgangsinstruksjoner:
              </Text>
              <Text style={instructionsText}>{entryInstructions}</Text>
            </Section>
          )}

          {/* Contact Information */}
          <Section style={contactSection}>
            <Text style={contactHeader}>Kontaktinformasjon:</Text>
            <Text style={contactText}>
              <strong>Stylist:</strong> {stylistName}<br/>
              <strong>Telefon:</strong> {stylistPhone}
            </Text>
            <Text style={contactNote}>
              Ta kontakt hvis du har spørsmål eller trenger å endre tiden.
            </Text>
          </Section>

          {/* Preparation Tips */}
          <Section style={tipsSection}>
            <Text style={tipsHeader}>💡 Forberedelser:</Text>
            <Text style={tipsText}>
              • Vask håret kvelden før hvis ikke annet er avtalt<br/>
              • Ha klare, rene håndklær tilgjengelig<br/>
              • Sørg for god belysning i rommet<br/>
              • Ha strøm tilgjengelig for utstyr
            </Text>
          </Section>

          {/* Call to Action */}
          <Section style={ctaSection}>
            <Text style={paragraph}>
              Se alle detaljer og chat med stylisten direkte i appen.
            </Text>
            <Button 
              style={button} 
              href={`${baseUrl}/profiler/${customerName}/mine-bookinger/${bookingId}`}
            >
              Se booking
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Hvis du trenger å avlyse, gjør det minst 24 timer i forveien for full refusjon.
          </Text>

          <Text style={footer}>
            Har du spørsmål? Kontakt oss på{" "}
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

BookingReminderEmail.PreviewProps = {
  customerName: "Ola Nordmann",
  stylistName: "Anna Stylist", 
  bookingId: "booking_12345",
  serviceName: "Hårklipp og styling",
  bookingDate: "15. januar 2024",
  bookingTime: "14:00 - 15:30",
  location: "Hjemme hos deg",
  address: "Storgata 1, 0001 Oslo", 
  entryInstructions: "Ring på dørklokken. Hunden biter ikke!",
  stylistPhone: "+47 123 45 678",
  totalPrice: 650,
  currency: "NOK",
} as BookingReminderEmailProps;

export default BookingReminderEmail;

// Using shared Nabostylisten branded styles
const main = baseStyles.main;
const container = baseStyles.container;
const logoContainer = baseStyles.logoContainer;
const logo = baseStyles.logo;
const heading = baseStyles.heading;
const paragraph = baseStyles.paragraph;
const hr = baseStyles.hr;
const footer = baseStyles.footer;
const link = baseStyles.link;

// Specific styles for booking reminder
const reminderBanner = {
  backgroundColor: colors.primary,
  borderRadius: "8px",
  padding: "12px 20px",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const reminderText = {
  color: colors.white,
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const bookingDetailsSection = {
  ...sectionStyles.infoSection,
  padding: "24px",
  borderColor: "rgba(107, 102, 130, 0.2)",
};

const sectionHeader = textStyles.sectionHeader;
const detailRow = layoutStyles.detailRow;
const detailLabel = textStyles.detailLabel;

const detailValue = {
  ...textStyles.detailValue,
  fontWeight: "400",
};

const instructionsSection = sectionStyles.messageSection;
const instructionsLabel = textStyles.messageHeader;
const instructionsText = {
  ...textStyles.messageContent,
  fontSize: "14px",
  fontStyle: "normal",
};

const contactSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: colors.accent,
  border: `1px solid ${colors.accentForeground}`,
  borderRadius: "10px",
};

const contactHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: colors.accentForeground,
  margin: "0 0 12px",
};

const contactText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: colors.accentForeground,
  margin: "0 0 12px",
};

const contactNote = {
  fontSize: "12px",
  color: colors.accentForeground,
  margin: "0",
  opacity: 0.8,
};

const tipsSection = sectionStyles.tipsSection;
const tipsHeader = textStyles.tipsHeader;
const tipsText = textStyles.tipsText;
const ctaSection = sectionStyles.actionSection;
const button = buttonStyles.primary;