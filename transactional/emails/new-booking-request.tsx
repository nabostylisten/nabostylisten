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

interface NewBookingRequestEmailProps {
  stylistName: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  requestedDate: string;
  requestedTime: string;
  location: "stylist" | "customer";
  customerAddress?: string;
  messageFromCustomer?: string;
  totalPrice: number;
  currency: string;
  estimatedDuration: number;
  urgency?: "high" | "medium" | "low";
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const NewBookingRequestEmail = ({
  stylistName = "Anna Stylist",
  customerName = "Ola Nordmann",
  bookingId = "12345",
  serviceName = "Hårklipp og styling",
  requestedDate = "15. januar 2024",
  requestedTime = "14:00 - 15:30",
  location = "stylist",
  customerAddress = "Storgata 1, 0001 Oslo",
  messageFromCustomer,
  totalPrice = 650,
  currency = "NOK",
  estimatedDuration = 90,
  urgency = "medium",
}: NewBookingRequestEmailProps) => {
  const locationText = location === "stylist" ? "Hos deg" : "Hjemme hos kunden";
  const previewText = `Ny bookingforespørsel fra ${customerName} for ${serviceName}`;
  
  const urgencyColors = {
    high: { bg: "#ff3333", text: "#ffffff" }, // --destructive
    medium: { bg: "#fee7dc", text: "#c2724a" }, // --secondary colors
    low: { bg: "#e8f5e8", text: "#4a7c4a" }, // --accent colors
  };

  const urgencyLabels = {
    high: "Høy prioritet",
    medium: "Middels prioritet", 
    low: "Lav prioritet",
  };

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

          <Section style={{
            ...urgencyBanner,
            backgroundColor: urgencyColors[urgency].bg,
          }}>
            <Text style={{
              ...urgencyText,
              color: urgencyColors[urgency].text,
            }}>
              🚀 {urgencyLabels[urgency]} - Ny bookingforespørsel
            </Text>
          </Section>

          <Heading style={heading}>
            Du har en ny bookingforespørsel!
          </Heading>

          <Text style={paragraph}>
            Hei {stylistName}! Du har mottatt en ny bookingforespørsel fra {customerName}.
          </Text>

          {/* Customer Information */}
          <Section style={customerSection}>
            <Text style={sectionHeader}>👤 Kunde:</Text>
            <Text style={customerName}>
              {customerName}
            </Text>
            <Text style={customerNote}>
              Ny kunde på plattformen
            </Text>
          </Section>

          {/* Booking Details */}
          <Section style={bookingDetailsSection}>
            <Text style={sectionHeader}>📋 Forespurte detaljer:</Text>
            
            <div style={detailRow}>
              <Text style={detailLabel}>Tjeneste:</Text>
              <Text style={detailValue}>{serviceName}</Text>
            </div>
            
            <div style={detailRow}>
              <Text style={detailLabel}>Dato:</Text>
              <Text style={detailValue}>{requestedDate}</Text>
            </div>
            
            <div style={detailRow}>
              <Text style={detailLabel}>Tid:</Text>
              <Text style={detailValue}>{requestedTime}</Text>
            </div>
            
            <div style={detailRow}>
              <Text style={detailLabel}>Varighet:</Text>
              <Text style={detailValue}>~{estimatedDuration} minutter</Text>
            </div>
            
            <div style={detailRow}>
              <Text style={detailLabel}>Sted:</Text>
              <Text style={detailValue}>{locationText}</Text>
            </div>

            {location === "customer" && customerAddress && (
              <div style={detailRow}>
                <Text style={detailLabel}>Adresse:</Text>
                <Text style={detailValue}>{customerAddress}</Text>
              </div>
            )}

            <div style={detailRow}>
              <Text style={detailLabel}>Pris:</Text>
              <Text style={detailValue}>{totalPrice} {currency}</Text>
            </div>
          </Section>

          {/* Customer Message */}
          {messageFromCustomer && (
            <Section style={messageSection}>
              <Text style={messageHeader}>
                💬 Melding fra {customerName}:
              </Text>
              <Text style={messageContent}>
                "{messageFromCustomer}"
              </Text>
            </Section>
          )}

          {/* Action Buttons */}
          <Section style={actionsSection}>
            <Text style={actionsHeader}>
              ⚡ Velg din handling:
            </Text>
            <div style={buttonGroup}>
              <Button 
                style={acceptButton} 
                href={`${baseUrl}/bookinger/${bookingId}/accept`}
              >
                ✅ Godta forespørsel
              </Button>
              <Button 
                style={declineButton} 
                href={`${baseUrl}/bookinger/${bookingId}/decline`}
              >
                ❌ Avslå forespørsel
              </Button>
            </div>
            <Button 
              style={viewButton} 
              href={`${baseUrl}/bookinger/${bookingId}`}
            >
              👁️ Se fullstendige detaljer
            </Button>
          </Section>

          {/* Tips for Stylists */}
          <Section style={tipsSection}>
            <Text style={tipsHeader}>💡 Tips for å håndtere forespørsler:</Text>
            <Text style={tipsText}>
              • <strong>Svar raskt</strong> - Kunder setter pris på rask respons<br/>
              • <strong>Vær profesjonell</strong> - Første inntrykk betyr mye<br/>
              • <strong>Still spørsmål</strong> - Avklar forventninger tidlig<br/>
              • <strong>Bekreft detaljer</strong> - Tid, sted og spesielle ønsker
            </Text>
          </Section>

          {/* Reminder Section */}
          <Section style={reminderSection}>
            <Text style={reminderHeader}>⏰ Husk:</Text>
            <Text style={reminderText}>
              Du har <strong>24 timer</strong> til å svare på denne forespørselen. 
              Etter det vil kunden bli informert om at du ikke var tilgjengelig.
            </Text>
          </Section>

          {/* Notification Settings */}
          <Section style={settingsSection}>
            <Text style={settingsText}>
              📧 Du mottar denne e-posten fordi du har aktivert varsler for nye bookingforespørsler.
            </Text>
            <Link href={`${baseUrl}/profiler/${stylistName}/preferanser`} style={settingsLink}>
              Endre varselinnstillinger
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Har du spørsmål om forespørselen? Kontakt oss på{" "}
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

const urgencyBanner = {
  borderRadius: "8px",
  padding: "12px 20px",
  textAlign: "center" as const,
  marginBottom: "24px",
  border: "2px solid",
};

const urgencyText = {
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

const customerSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#e8f5e8", // --accent
  borderRadius: "12px",
  border: "2px solid #4a7c4a", // --accent-foreground
  textAlign: "center" as const,
};

const customerName = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#4a7c4a", // --accent-foreground
  margin: "8px 0 4px",
};

const customerNote = {
  fontSize: "12px",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
  opacity: 0.8,
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

const messageHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 12px",
};

const messageContent = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#c2724a", // --secondary-foreground
  margin: "0",
  fontStyle: "italic",
};

const actionsSection = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const actionsHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 20px",
};

const buttonGroup = {
  display: "flex",
  gap: "12px",
  justifyContent: "center",
  marginBottom: "12px",
};

const acceptButton = {
  backgroundColor: "#4a7c4a", // --accent-foreground (green)
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 20px",
  boxShadow: "0 2px 4px rgba(74, 124, 74, 0.3)",
  flex: "1",
};

const declineButton = {
  backgroundColor: "#ff3333", // --destructive
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 20px",
  boxShadow: "0 2px 4px rgba(255, 51, 51, 0.3)",
  flex: "1",
};

const viewButton = {
  backgroundColor: "#9b8cc8", // --primary
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
  margin: "8px 0",
  boxShadow: "0 2px 4px rgba(155, 140, 200, 0.3)",
};

const tipsSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "8px",
  borderLeft: "4px solid #9b8cc8", // --primary
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

const reminderSection = {
  margin: "32px 0",
  padding: "16px 20px",
  backgroundColor: "#fff3cd",
  border: "2px solid #ffc107",
  borderRadius: "8px",
  textAlign: "center" as const,
};

const reminderHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#856404",
  margin: "0 0 8px",
};

const reminderText = {
  fontSize: "14px",
  color: "#856404",
  margin: "0",
  lineHeight: "1.5",
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