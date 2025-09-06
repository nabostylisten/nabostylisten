import {
  Body,
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
  Button,
} from "@react-email/components";
import {
  baseStyles,
  sectionStyles,
  buttonStyles,
  colors,
} from "./utils/styles";

interface AffiliateApplicationApprovedProps {
  logoUrl: string;
  stylistName: string;
  affiliateCode: string;
  commissionPercentage: number;
  dashboardUrl: string;
}

export const AffiliateApplicationApproved = ({
  logoUrl,
  stylistName = "Anna",
  affiliateCode = "ANNA-2024-ABC123",
  commissionPercentage = 20,
  dashboardUrl = "https://nabostylisten.no/profiler/123/partner",
}: AffiliateApplicationApprovedProps) => {
  const previewText = `Din partnersøknad har blitt godkjent! 🎉`;

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

          <Heading style={heading}>
            Gratulerer! Du er nå partner hos Nabostylisten 🎉
          </Heading>

          <Text style={paragraph}>Kjære {stylistName},</Text>

          <Text style={paragraph}>
            Vi er glade for å informere deg om at din søknad om å bli partner
            har blitt godkjent! Velkommen til Nabostylisten Partner Program.
          </Text>

          <Section style={codeSection}>
            <Text style={codeLabel}>Din unike partnerkode:</Text>
            <Text style={codeText}>{affiliateCode}</Text>
            <Text style={codeDescription}>
              Del denne koden med dine kunder for å tjene {commissionPercentage}
              % provisjon på alle bookinger!
            </Text>
          </Section>

          <Section style={benefitsSection}>
            <Heading style={subHeading}>Dine partnerfordeler:</Heading>
            <Text style={benefitItem}>
              • {commissionPercentage}% provisjon på alle bookinger fra dine
              henvisninger
            </Text>
            <Text style={benefitItem}>
              • Egen partnerdashboard med detaljert statistikk
            </Text>
            <Text style={benefitItem}>
              • Månedlige utbetalinger direkte til din bankkonto
            </Text>
            <Text style={benefitItem}>
              • Markedsføringsmateriell og ressurser
            </Text>
            <Text style={benefitItem}>• Prioritert kundesupport</Text>
          </Section>

          <Section style={ctaSection}>
            <Button style={button} href={dashboardUrl}>
              Se ditt partnerdashboard
            </Button>
          </Section>

          <Section style={instructionsSection}>
            <Heading style={instructionsHeader}>Slik kommer du i gang:</Heading>

            <Text style={instructionStep}>
              <strong>1. Del din partnerkode</strong>
              <br />
              Gi kunden koden {affiliateCode} eller send dem lenken:
              nabostylisten.no?code={affiliateCode}
            </Text>

            <Text style={instructionStep}>
              <strong>2. Følg med på statistikken</strong>
              <br />
              Logg inn på ditt partnerdashboard for å se klikk, konverteringer
              og inntjening
            </Text>

            <Text style={instructionStep}>
              <strong>3. Få utbetalt</strong>
              <br />
              Vi utbetaler provisjon månedlig til den bankkontoen som er
              registrert i din Stripe-konto
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={paragraph}>
            Hvis du har spørsmål om partnerprogrammet, ikke nøl med å ta kontakt
            med oss på{" "}
            <Link href="mailto:partner@nabostylisten.no" style={link}>
              partner@nabostylisten.no
            </Link>
          </Text>

          <Text style={paragraph}>Vi ser frem til et fruktbart samarbeid!</Text>

          <Text style={footer}>
            Med vennlig hilsen,
            <br />
            Nabostylisten Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

AffiliateApplicationApproved.PreviewProps = {
  logoUrl: "https://example.com/logo.png",
  stylistName: "Anna Nordmann",
  affiliateCode: "ANNA-HAIR-2024",
  commissionPercentage: 20,
  dashboardUrl: "https://nabostylisten.no/profiler/123/partner",
} as AffiliateApplicationApprovedProps;

export default AffiliateApplicationApproved;

// Using shared Nabostylisten branded styles
const main = baseStyles.main;
const container = baseStyles.container;
const logoContainer = baseStyles.logoContainer;
const logo = baseStyles.logo;
const heading = baseStyles.heading;
const subHeading = baseStyles.subHeading;
const paragraph = baseStyles.paragraph;
const hr = baseStyles.hr;
const footer = baseStyles.footer;
const link = baseStyles.link;

// Specific styles for affiliate approval email
const codeSection = {
  backgroundColor: colors.accent,
  padding: "24px",
  borderRadius: "12px",
  margin: "32px 0",
  textAlign: "center" as const,
  border: `1px solid ${colors.accentForeground}`,
};

const codeLabel = {
  color: colors.accentForeground,
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px 0",
};

const codeText = {
  color: colors.primary,
  fontSize: "28px",
  fontWeight: "bold",
  fontFamily: "Monaco, 'Lucida Console', monospace",
  margin: "0 0 12px 0",
  letterSpacing: "1px",
};

const codeDescription = {
  color: colors.accentForeground,
  fontSize: "14px",
  margin: "0",
};

const benefitsSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: colors.muted,
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
};

const benefitItem = {
  color: colors.foreground,
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "12px 0",
};

const ctaSection = sectionStyles.actionSection;
const button = buttonStyles.primary;

const instructionsSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: colors.secondary,
  borderRadius: "12px",
  border: `1px solid ${colors.secondaryForeground}`,
};

const instructionsHeader = {
  ...baseStyles.subHeading,
  color: colors.secondaryForeground,
  marginBottom: "16px",
};

const instructionStep = {
  color: colors.secondaryForeground,
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "16px 0",
};
