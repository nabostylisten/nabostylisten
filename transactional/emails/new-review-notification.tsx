import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Section,
  Text,
} from "@react-email/components";
import { baseUrl } from "./utils";

interface SimplifiedReviewNotificationProps {
  logoUrl: string;
  stylistName: string;
  customerName: string;
  rating: string;
  comment?: string;
  stylistProfileId: string;
}

export const NewReviewNotificationEmail = ({
  logoUrl = `${baseUrl}/logo-email.png`,
  stylistName = "Anna Stylist",
  customerName = "Ola Nordmann",
  rating = "5",
  comment,
  stylistProfileId = "12345",
}: SimplifiedReviewNotificationProps) => {
  const ratingLabels: { [key: string]: string } = {
    "5": "Utmerket",
    "4": "Bra",
    "3": "Greit",
    "2": "Ikke så bra",
    "1": "Dårlig",
  };

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Logo Section */}
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

          <div style={ratingSection}>
            <Text style={ratingNumber}>{rating}/5</Text>
            <Text style={ratingLabel}>{ratingLabels[rating]} vurdering</Text>
          </div>

          {comment && (
            <div style={commentSection}>
              <Text style={commentHeader}>Kundens kommentar:</Text>
              <Text style={commentContent}>"{comment}"</Text>
              <Text style={commentSignature}>— {customerName}</Text>
            </div>
          )}

          <div style={ctaSection}>
            <Text style={paragraph}>
              {parseInt(rating) >= 4
                ? "Gratulerer med en flott anmeldelse! Dette hjelper deg å tiltrekke flere kunder."
                : "Takk for din service. Bruk tilbakemeldingen til å forbedre opplevelsen for fremtidige kunder."}
            </Text>
            <Button
              style={button}
              href={`${baseUrl}/profiler/${stylistProfileId}/anmeldelser`}
            >
              Se alle anmeldelser
            </Button>
          </div>

          <Text style={footer}>
            Har du spørsmål om anmeldelser? Kontakt oss på
            support@nabostylisten.no
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

NewReviewNotificationEmail.PreviewProps = {
  stylistName: "Anna Stylist",
  customerName: "Ola Nordmann",
  rating: "5",
  comment:
    "Fantastisk opplevelse! Anna var så profesjonell og jeg elsker den nye frisyren min.",
  stylistProfileId: "12345",
} as SimplifiedReviewNotificationProps;

export default NewReviewNotificationEmail;

const main = {
  backgroundColor: "#f8f6ff",
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
  color: "#453a6b",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const paragraph = {
  margin: "0 0 20px",
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#453a6b",
};

const ratingSection = {
  margin: "32px 0",
  padding: "30px",
  backgroundColor: "#e8f5e8",
  borderRadius: "16px",
  border: "3px solid #4a7c4a",
  textAlign: "center" as const,
};

const ratingNumber = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#4a7c4a",
  margin: "0 0 12px",
  display: "block",
};

const ratingLabel = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#4a7c4a",
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
};

const commentSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#fee7dc",
  border: "2px solid #c2724a",
  borderRadius: "12px",
};

const commentHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#c2724a",
  margin: "0 0 16px",
};

const commentContent = {
  fontSize: "16px",
  lineHeight: "1.7",
  color: "#c2724a",
  margin: "0 0 12px",
  fontStyle: "italic",
  padding: "16px",
  backgroundColor: "rgba(255, 255, 255, 0.5)",
  borderRadius: "8px",
};

const commentSignature = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#c2724a",
  margin: "0",
  textAlign: "right" as const,
};

const ctaSection = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#9b8cc8",
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

const footer = {
  color: "#6b6682",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "40px 0 0",
  textAlign: "center" as const,
};
