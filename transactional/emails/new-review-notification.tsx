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

interface NewReviewNotificationEmailProps {
  logoUrl: string;
  stylistProfileId: string;
  stylistName: string;
  customerName: string;
  reviewId: string;
  bookingId: string;
  serviceName: string;
  bookingDate: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  totalReviews: number;
  averageRating: number;
}

export const NewReviewNotificationEmail = ({
  logoUrl,
  stylistProfileId = "12345",
  stylistName = "Anna Stylist",
  customerName = "Ola Nordmann",
  reviewId = "rev123",
  bookingId = "12345",
  serviceName = "Hårklipp og styling",
  bookingDate = "15. januar 2024",
  rating = 5,
  comment = "Fantastisk opplevelse! Anna var profesjonell og resultatet ble nøyaktig som jeg ønsket. Anbefaler på det varmeste!",
  totalReviews = 47,
  averageRating = 4.8,
}: NewReviewNotificationEmailProps) => {
  const previewText = `Ny ${rating}-stjerner anmeldelse fra ${customerName}`;

  const ratingColors = {
    5: { bg: "#4a7c4a", text: "#ffffff" }, // --accent-foreground (excellent)
    4: { bg: "#e8f5e8", text: "#4a7c4a" }, // --accent (good)
    3: { bg: "#fee7dc", text: "#c2724a" }, // --secondary (okay)
    2: { bg: "#fff3cd", text: "#856404" }, // warning yellow
    1: { bg: "#ff3333", text: "#ffffff" }, // --destructive (poor)
  };

  const ratingLabels = {
    5: "Utmerket",
    4: "Bra",
    3: "Greit",
    2: "Ikke så bra",
    1: "Dårlig",
  };

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

          <Heading style={heading}>Du har fått en ny anmeldelse!</Heading>

          <Text style={paragraph}>
            Hei {stylistName}! {customerName} har lagt igjen en anmeldelse for
            tjenesten du utførte.
          </Text>

          {/* Rating Display */}
          <Section style={ratingSection}>
            <div style={starsContainer}>
              <Text style={ratingNumber}>{rating}/5</Text>
            </div>
            <Text style={ratingLabel}>{ratingLabels[rating]} vurdering</Text>
          </Section>

          {/* Service Context */}
          <Section style={serviceContextSection}>
            <Text style={contextHeader}>Angående booking:</Text>
            <div style={contextRow}>
              <Text style={contextLabel}>Tjeneste:</Text>
              <Text style={contextValue}>{serviceName}</Text>
            </div>
            <div style={contextRow}>
              <Text style={contextLabel}>Dato:</Text>
              <Text style={contextValue}>{bookingDate}</Text>
            </div>
            <div style={contextRow}>
              <Text style={contextLabel}>Kunde:</Text>
              <Text style={contextValue}>{customerName}</Text>
            </div>
          </Section>

          {/* Review Comment */}
          {comment && (
            <Section style={commentSection}>
              <Text style={commentHeader}>Kundens kommentar:</Text>
              <Text style={commentContent}>"{comment}"</Text>
              <Text style={commentSignature}>— {customerName}</Text>
            </Section>
          )}

          {/* Your Statistics */}
          <Section style={statsSection}>
            <Text style={statsHeader}>Dine anmeldelsesstatistikker:</Text>
            <div style={statsGrid}>
              <div style={statItem}>
                <Text style={statNumber}>{totalReviews}</Text>
                <Text style={statLabel}>Totale anmeldelser</Text>
              </div>
              <div style={statItem}>
                <Text style={statNumber}>{averageRating.toFixed(1)}</Text>
                <Text style={statLabel}>Gjennomsnittlig rating</Text>
              </div>
            </div>
          </Section>

          {/* Call to Action */}
          <Section style={ctaSection}>
            <Text style={paragraph}>
              {rating >= 4
                ? "Gratulerer med en flott anmeldelse! Dette hjelper deg å tiltrekke flere kunder."
                : "Takk for din service. Bruk tilbakemeldingen til å forbedre opplevelsen for fremtidige kunder."}
            </Text>
            <Button
              style={button}
              href={`${baseUrl}/profiler/${stylistProfileId}/anmeldelser`}
            >
              Se alle anmeldelser
            </Button>
          </Section>

          {/* Tips Section */}
          <Section style={tipsSection}>
            <Text style={tipsHeader}>💡 Tips for å håndtere anmeldelser:</Text>
            <Text style={tipsText}>
              • <strong>Takk kunden</strong> - Vis takknemlighet for
              tilbakemelding
              <br />• <strong>Vær profesjonell</strong> - Også ved kritiske
              anmeldelser
              <br />• <strong>Lær av feedback</strong> - Bruk det til å forbedre
              tjenestene
              <br />• <strong>Responder raskt</strong> - Vis at du bryr deg om
              kundens opplevelse
              <br />• <strong>Fremhev det positive</strong> - Boost din profil
              med gode anmeldelser
            </Text>
          </Section>

          {/* Encouragement based on rating */}
          {rating >= 4 ? (
            <Section style={encouragementSection}>
              <Text style={encouragementHeader}>Fantastisk jobb!</Text>
              <Text style={encouragementText}>
                Du leverer konsekvent høy kvalitet. Slike anmeldelser hjelper
                deg å skille deg ut på plattformen og tiltrekke flere kunder.
              </Text>
            </Section>
          ) : (
            <Section style={improvementSection}>
              <Text style={improvementHeader}>Forbedring er en mulighet</Text>
              <Text style={improvementText}>
                Vi er her for å hjelpe deg lykkes. Hvis du trenger veiledning
                eller støtte for å forbedre tjenestene dine, ta kontakt med oss.
              </Text>
            </Section>
          )}

          <NotificationSettings
            profileId={stylistProfileId}
            notificationType="review_notifications"
          />

          <Hr style={hr} />

          <Text style={footer}>
            Har du spørsmål om anmeldelser? Kontakt oss på{" "}
            <Link href="mailto:support@nabostylisten.no" style={link}>
              support@nabostylisten.no
            </Link>
          </Text>

          <Text style={footer}>
            Anmeldelse ID: {reviewId} | Booking ID: {bookingId}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

NewReviewNotificationEmail.PreviewProps = {
  logoUrl: "https://example.com/logo.png",
  stylistProfileId: "12345",
  totalReviews: 47,
  averageRating: 4.8,
  stylistName: "Anna Stylist",
  customerName: "Ola Nordmann",
  reviewId: "review_12345",
  bookingId: "booking_67890",
  rating: 5,
  comment:
    "Fantastisk opplevelse! Anna var så profesjonell og jeg elsker den nye frisyren min. Kommer definitivt tilbake!",
  serviceName: "Hårklipp og styling",
  bookingDate: "10. januar 2024",
} as NewReviewNotificationEmailProps;

export default NewReviewNotificationEmail;

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

const ratingBanner = {
  borderRadius: "8px",
  padding: "12px 20px",
  textAlign: "center" as const,
  marginBottom: "24px",
  border: "2px solid",
};

const ratingText = {
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

const ratingSection = {
  margin: "32px 0",
  padding: "30px",
  backgroundColor: "#e8f5e8", // --accent
  borderRadius: "16px",
  border: "3px solid #4a7c4a", // --accent-foreground
  textAlign: "center" as const,
};

const starsContainer = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  marginBottom: "12px",
};

const starsDisplay = {
  fontSize: "32px",
  margin: "0",
  letterSpacing: "4px",
};

const ratingNumber = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
};

const ratingLabel = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
};

const serviceContextSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "10px",
  border: "1px solid rgba(155, 140, 200, 0.3)",
};

const contextHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 16px",
};

const contextRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "8px",
};

const contextLabel = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#6b6682", // --muted-foreground
  margin: "0",
  flex: "0 0 80px",
};

const contextValue = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0",
  textAlign: "right" as const,
  flex: "1",
};

const commentSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#fee7dc", // --secondary
  border: "2px solid #c2724a", // --secondary-foreground
  borderRadius: "12px",
};

const commentHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 16px",
};

const commentContent = {
  fontSize: "16px",
  lineHeight: "1.7",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 12px",
  fontStyle: "italic",
  padding: "16px",
  backgroundColor: "rgba(255, 255, 255, 0.5)",
  borderRadius: "8px",
};

const commentSignature = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#c2724a", // --secondary-foreground
  margin: "0",
  textAlign: "right" as const,
};

const statsSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "12px",
  border: "2px solid #9b8cc8", // --primary
};

const statsHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const statsGrid = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
};

const statItem = {
  flex: "1",
  textAlign: "center" as const,
};

const statNumber = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#9b8cc8", // --primary
  margin: "0 0 4px",
  display: "block",
};

const statLabel = {
  fontSize: "12px",
  color: "#6b6682", // --muted-foreground
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
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
  margin: "8px 4px",
  boxShadow: "0 2px 4px rgba(155, 140, 200, 0.3)",
};

const responseButton = {
  backgroundColor: "#4a7c4a", // --accent-foreground
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 20px",
  margin: "8px 4px",
  boxShadow: "0 2px 4px rgba(74, 124, 74, 0.3)",
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

const encouragementSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#e8f5e8", // --accent
  border: "2px solid #4a7c4a", // --accent-foreground
  borderRadius: "12px",
  textAlign: "center" as const,
};

const encouragementHeader = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#4a7c4a", // --accent-foreground
  margin: "0 0 12px",
};

const encouragementText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
};

const improvementSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#fee7dc", // --secondary
  border: "2px solid #c2724a", // --secondary-foreground
  borderRadius: "12px",
  textAlign: "center" as const,
};

const improvementHeader = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 12px",
};

const improvementText = {
  fontSize: "14px",
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
