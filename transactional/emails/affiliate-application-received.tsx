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
import {
  baseStyles,
  sectionStyles,
  textStyles,
  buttonStyles,
  colors,
} from "./utils/styles";
import { baseUrl } from "./utils";

interface AffiliateApplicationReceivedEmailProps {
  logoUrl: string;
  applicantName: string;
  applicantEmail: string;
  applicationId: string;
  submittedAt: Date;
  expectedReferrals: number;
  socialMediaReach: number;
  reason: string;
  marketingStrategy: string;
}

export const AffiliateApplicationReceivedEmail = ({
  logoUrl,
  applicantName = "Anna Nordmann",
  applicantEmail = "anna@example.com", 
  applicationId = "aff_12345",
  submittedAt = new Date(),
  expectedReferrals = 10,
  socialMediaReach = 5000,
  reason = "Jeg vil bli partner fordi...",
  marketingStrategy = "Jeg planlegger å markedsføre gjennom...",
}: AffiliateApplicationReceivedEmailProps) => {
  const previewText = `Ny partner-søknad fra ${applicantName}`;

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

          <Heading style={heading}>Ny partner-søknad mottatt!</Heading>

          <Text style={paragraph}>
            Hei! En ny stylist har søkt om å bli partner på Nabostylisten. Her er
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

            <Text style={detailLabel}>Forventede henvisninger per måned:</Text>
            <Text style={detailValue}>{expectedReferrals}</Text>

            <Text style={detailLabel}>Total antall følgere:</Text>
            <Text style={detailValue}>{socialMediaReach.toLocaleString("no-NO")}</Text>

            <Text style={detailLabel}>Motivasjon:</Text>
            <Text style={detailValue}>{reason.length > 100 ? `${reason.slice(0, 100)}...` : reason}</Text>

            <Text style={detailLabel}>Markedsføringsstrategi:</Text>
            <Text style={detailValue}>
              {marketingStrategy.length > 100 ? `${marketingStrategy.slice(0, 100)}...` : marketingStrategy}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={actionSection}>
            <Text style={paragraph}>
              For å vurdere søknaden, kan du gå til admin-panelet:
            </Text>

            <Button
              href={`${baseUrl}/admin/partner`}
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

AffiliateApplicationReceivedEmail.PreviewProps = {
  logoUrl: "https://example.com/logo.png",
  applicantName: "Anna Nordmann",
  applicantEmail: "anna@example.com",
  applicationId: "aff_12345",
  submittedAt: new Date(),
  expectedReferrals: 10,
  socialMediaReach: 5000,
  reason: "Jeg vil bli partner fordi jeg har en stor og engasjert følgerskare som stoler på mine anbefalinger. Jeg har jobbet som stylist i over 5 år og har bygget opp et sterkt nettverk av kunder som ofte spør meg om anbefalinger.",
  marketingStrategy: "Jeg planlegger å markedsføre gjennom mine Instagram stories og posts, hvor jeg vil dele mine erfaringer med Nabostylisten og vise frem resultater fra bookinger. Jeg vil også lage dedikerte reels og posts som viser verdien av plattformen.",
} as AffiliateApplicationReceivedEmailProps;

export default AffiliateApplicationReceivedEmail;

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