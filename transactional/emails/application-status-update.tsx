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

interface ApplicationStatusUpdateEmailProps {
  applicantName: string;
  applicationId: string;
  status: "applied" | "pending_info" | "rejected" | "approved";
  message?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const ApplicationStatusUpdateEmail = ({
  applicantName = "Ola Nordmann",
  applicationId = "12345",
  status = "approved",
  message,
}: ApplicationStatusUpdateEmailProps) => {
  const statusLabels = {
    applied: "Ny søknad",
    pending_info: "Venter på mer informasjon",
    approved: "Godkjent",
    rejected: "Avvist",
  };

  const statusDescriptions = {
    applied: "Din søknad er mottatt og vil bli gjennomgått snart.",
    pending_info:
      "Vi trenger mer informasjon fra deg for å fullføre behandlingen av søknaden.",
    approved:
      "Gratulerer! Din søknad er godkjent. Du kan nå opprette tjenester på platformen.",
    rejected: "Vi beklager, men din søknad ble ikke godkjent denne gangen.",
  };

  const previewText = `Søknadsstatus oppdatert: ${statusLabels[status]}`;

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

          <Heading style={heading}>Søknadsstatus oppdatert</Heading>

          <Text style={paragraph}>
            Hei {applicantName}! Din søknad om å bli stylist på Nabostylisten
            har fått en statusoppdatering.
          </Text>

          <Section style={statusSection}>
            <Text style={statusLabel}>Status:</Text>
            <Text style={statusValue}>{statusLabels[status]}</Text>
          </Section>

          <Text style={paragraph}>{statusDescriptions[status]}</Text>

          {message && (
            <Section style={messageSection}>
              <Text style={messageLabel}>Melding fra oss:</Text>
              <Text style={messageText}>{message}</Text>
            </Section>
          )}

          {status === "approved" && (
            <Section style={ctaSection}>
              <Text style={paragraph}>
                Du kan nå logge inn på din konto og begynne å opprette tjenester
                som stylist på platformen.
              </Text>
              <Button style={button} href={baseUrl}>
                Gå til min profil
              </Button>
            </Section>
          )}

          {status === "pending_info" && (
            <Section style={ctaSection}>
              <Text style={paragraph}>
                Vennligst logg inn på din konto for å se hvilken informasjon vi
                trenger fra deg.
              </Text>
              <Button style={button} href={`${baseUrl}/protected`}>
                Se søknadsdetaljer
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

          <Text style={footer}>Søknad ID: {applicationId}</Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#fafafa",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
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
  color: "#1a1a1a",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const paragraph = {
  margin: "0 0 20px",
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#374151",
};

const statusSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#f9fafb",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
};

const statusLabel = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#6b7280",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const statusValue = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0",
};

const messageSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "10px",
};

const messageLabel = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#92400e",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const messageText = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#92400e",
  margin: "0",
};

const ctaSection = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
  margin: "20px 0",
  boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "40px 0 24px",
  borderWidth: "1px",
  borderStyle: "solid",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 8px",
  textAlign: "center" as const,
};

const link = {
  color: "#10b981",
  textDecoration: "none",
  fontWeight: "500",
};
