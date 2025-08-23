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

const reminderBanner = {
  backgroundColor: "#9b8cc8", // --primary
  borderRadius: "8px",
  padding: "12px 20px",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const reminderText = {
  color: "#ffffff",
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

const bookingDetailsSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "10px",
  border: "1px solid #6b6682", // --muted-foreground with transparency
  borderColor: "rgba(107, 102, 130, 0.2)",
};

const sectionHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 16px",
};

const detailRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};

const detailLabel = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#6b6682", // --muted-foreground
  margin: "0",
  flex: "0 0 100px",
};

const detailValue = {
  fontSize: "14px",
  fontWeight: "400",
  color: "#453a6b", // --foreground
  margin: "0",
  textAlign: "right" as const,
  flex: "1",
};

const instructionsSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#fee7dc", // --secondary
  border: "1px solid #c2724a", // --secondary-foreground
  borderRadius: "10px",
};

const instructionsLabel = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 12px",
};

const instructionsText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#c2724a", // --secondary-foreground
  margin: "0",
};

const contactSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#e8f5e8", // --accent
  border: "1px solid #4a7c4a", // --accent-foreground
  borderRadius: "10px",
};

const contactHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#4a7c4a", // --accent-foreground
  margin: "0 0 12px",
};

const contactText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#4a7c4a", // --accent-foreground
  margin: "0 0 12px",
};

const contactNote = {
  fontSize: "12px",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
  opacity: 0.8,
};

const tipsSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "10px",
  border: "1px solid rgba(155, 140, 200, 0.3)", // --primary with transparency
};

const tipsHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 12px",
};

const tipsText = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#6b6682", // --muted-foreground
  margin: "0",
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