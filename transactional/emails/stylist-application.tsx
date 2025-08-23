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
  Row,
  Section,
  Text,
} from "@react-email/components";

interface StylistApplicationEmailProps {
  applicantName: string;
  applicantEmail: string;
  applicationId: string;
  submittedAt: Date;
  portfolioImageCount: number;
  serviceCategories: string[];
  priceRange: {
    from: number;
    to: number;
    currency: string;
  };
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const StylistApplicationEmail = ({
  applicantName = "Ola Nordmann",
  applicantEmail = "ola@example.com",
  applicationId = "12345",
  submittedAt = new Date(),
  portfolioImageCount = 5,
  serviceCategories = ["hair", "makeup"],
  priceRange = { from: 300, to: 1500, currency: "NOK" },
}: StylistApplicationEmailProps) => {
  const previewText = `Ny stylist-søknad fra ${applicantName}`;

  const categoryNames: Record<string, string> = {
    hair: "Hår",
    nails: "Negler",
    makeup: "Makeup",
    "lashes-brows": "Vipper & Bryn",
    wedding: "Bryllup",
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

          <Heading style={heading}>Ny stylist-søknad mottatt!</Heading>

          <Text style={paragraph}>
            Hei! En ny person har søkt om å bli stylist på Nabostylisten. Her er
            detaljene:
          </Text>

          <Section style={infoSection}>
            <Row>
              <Text style={infoLabel}>Søker:</Text>
              <Text style={infoValue}>{applicantName}</Text>
            </Row>
            <Row>
              <Text style={infoLabel}>E-post:</Text>
              <Text style={infoValue}>
                <Link href={`mailto:${applicantEmail}`} style={link}>
                  {applicantEmail}
                </Link>
              </Text>
            </Row>
            <Row>
              <Text style={infoLabel}>Søknad ID:</Text>
              <Text style={infoValue}>{applicationId}</Text>
            </Row>
            <Row>
              <Text style={infoLabel}>Innsendt:</Text>
              <Text style={infoValue}>
                {submittedAt.toLocaleDateString("no-NO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Row>
          </Section>

          <Hr style={hr} />

          <Section style={detailsSection}>
            <Heading as="h2" style={subHeading}>
              Søknadsdetaljer
            </Heading>

            <Text style={detailLabel}>Tjenestekategorier:</Text>
            <Text style={detailValue}>
              {serviceCategories
                .map((cat) => categoryNames[cat] || cat)
                .join(", ")}
            </Text>

            <Text style={detailLabel}>Prisklasse:</Text>
            <Text style={detailValue}>
              {priceRange.from.toLocaleString("no-NO")} -{" "}
              {priceRange.to.toLocaleString("no-NO")} {priceRange.currency}
            </Text>

            <Text style={detailLabel}>Porteføljebilder:</Text>
            <Text style={detailValue}>Se søknad i admin-panel</Text>
          </Section>

          <Hr style={hr} />

          <Section style={actionSection}>
            <Text style={paragraph}>
              For å vurdere søknaden, kan du gå til admin-panelet:
            </Text>

            <Button
              href={`${baseUrl}/admin/applications/${applicationId}`}
              style={button}
            >
              Se søknad i admin-panel
            </Button>
          </Section>

          <Hr style={hr} />

          <Section style={footerSection}>
            <Text style={footerText}>
              Denne e-posten ble sendt automatisk fra Nabostylisten.
              <br />
              Hvis du har spørsmål, kontakt{" "}
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

StylistApplicationEmail.PreviewProps = {
  applicantName: "Ola Nordmann",
  applicantEmail: "ola@example.com",
  applicationId: "app_12345",
  submittedAt: new Date(),
  portfolioImageCount: 5,
  serviceCategories: ["hair", "makeup", "wedding"],
  priceRange: { from: 300, to: 1500, currency: "NOK" },
} as StylistApplicationEmailProps;

export default StylistApplicationEmail;

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
  textAlign: "center" as const,
  marginBottom: "32px",
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
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const subHeading = {
  fontSize: "20px",
  lineHeight: "1.4",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#453a6b", // --foreground
  margin: "0 0 20px",
};

const infoSection = {
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "10px",
  padding: "24px",
  margin: "32px 0",
  border: "1px solid rgba(155, 140, 200, 0.3)", // --primary with transparency
};

const infoLabel = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#6b6682", // --muted-foreground
  margin: "0 0 4px",
  display: "inline-block",
  width: "100px",
};

const infoValue = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#453a6b", // --foreground
  margin: "0 0 12px",
  display: "inline-block",
};

const detailsSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#fee7dc", // --secondary
  borderRadius: "10px",
  border: "1px solid #c2724a", // --secondary-foreground
};

const detailLabel = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#c2724a", // --secondary-foreground
  margin: "16px 0 4px",
};

const detailValue = {
  fontSize: "16px",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 12px",
  fontWeight: "500",
};

const actionSection = {
  textAlign: "center" as const,
  margin: "32px 0",
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
  margin: "16px 0",
  boxShadow: "0 2px 4px rgba(155, 140, 200, 0.3)",
};

const link = {
  color: "#9b8cc8", // --primary
  textDecoration: "none",
  fontWeight: "500",
};

const hr = {
  borderColor: "#edeaf7", // --muted
  margin: "32px 0",
  borderWidth: "1px",
  borderStyle: "solid",
};

const footerSection = {
  textAlign: "center" as const,
  margin: "32px 0 0",
};

const footerText = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#6b6682", // --muted-foreground
  margin: "0",
};
