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
import { baseStyles, sectionStyles, textStyles, buttonStyles, colors } from "../utils/styles";

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

// Using shared Nabostylisten branded styles
const main = baseStyles.main;
const container = baseStyles.container;
const logoContainer = baseStyles.logoContainer;
const logo = baseStyles.logo;
const heading = baseStyles.heading;
const subHeading = baseStyles.subHeading;
const paragraph = baseStyles.paragraph;
const infoSection = sectionStyles.infoSection;
const detailsSection = sectionStyles.detailsSection;
const actionSection = sectionStyles.actionSection;
const button = buttonStyles.primary;
const link = baseStyles.link;
const hr = baseStyles.hr;

const infoLabel = {
  ...textStyles.detailLabel,
  display: "inline-block",
  width: "100px",
  margin: "0 0 4px",
};

const infoValue = {
  fontSize: "16px",
  fontWeight: "500",
  color: colors.foreground,
  margin: "0 0 12px",
  display: "inline-block",
};

const detailLabel = textStyles.secondaryDetailLabel;
const detailValue = textStyles.secondaryDetailValue;

const footerSection = {
  textAlign: "center" as const,
  margin: "32px 0 0",
};

const footerText = baseStyles.footer;
