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

  const statusColors = {
    confirmed: "#4a7c4a", // --accent-foreground (green)
    cancelled: "#ff3333", // --destructive (red)
  };

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

const statusSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "10px",
  border: "2px solid",
  borderColor: "#4a7c4a", // Will be overridden by status color
  textAlign: "center" as const,
};

const statusLabel = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#6b6682", // --muted-foreground
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const statusValue = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#4a7c4a", // Will be overridden by status color
  margin: "0",
};

const bookingDetailsSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "10px",
  border: "1px solid rgba(155, 140, 200, 0.3)", // --primary with transparency
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
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0",
  textAlign: "right" as const,
  flex: "1",
};

const messageSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#fee7dc", // --secondary
  border: "2px solid #c2724a", // --secondary-foreground
  borderRadius: "10px",
};

const messageLabel = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const messageText = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#c2724a", // --secondary-foreground
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