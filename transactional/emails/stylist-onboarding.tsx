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

interface StylistOnboardingEmailProps {
  logoUrl?: string;
  stylistName?: string;
  userId?: string;
}

export const StylistOnboardingEmail = ({
  logoUrl = `${baseUrl}/logo-email.png`,
  stylistName = "Ola Nordmann",
  userId = "123",
}: StylistOnboardingEmailProps) => {
  const previewText = `Fullfør din onboarding som stylist på Nabostylisten - siste steg før du kan begynne å selge tjenester.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
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

          {/* Welcome Header */}
          <Heading style={heading}>Velkommen som stylist!</Heading>

          <Text style={welcomeText}>
            Hei {stylistName}! Din søknad som stylist er godkjent. Det er bare
            ett siste steg før du kan begynne å tilby dine tjenester på
            plattformen.
          </Text>

          {/* Onboarding Section */}
          <Section style={onboardingSection}>
            <Text style={sectionHeader}>Fullfør din onboarding:</Text>

            <Text style={explanationText}>
              For at du skal kunne motta betaling for dine tjenester, må vi
              samle inn nødvendig informasjon om deg som selger. Dette er
              sikkerhetskrav fra våre betalingspartnere og kreves av alle som
              selger tjenester online.
            </Text>

            <div style={requirementsContainer}>
              <Text style={requirementsTitle}>
                Vi trenger følgende informasjon:
              </Text>

              <div style={requirementItem}>
                <div style={requirementIcon}>1</div>
                <Text style={requirementText}>
                  Grunnleggende selgerinformasjon
                </Text>
              </div>

              <div style={requirementItem}>
                <div style={requirementIcon}>2</div>
                <Text style={requirementText}>
                  Bankinformasjon for utbetalinger
                </Text>
              </div>

              <div style={requirementItem}>
                <div style={requirementIcon}>3</div>
                <Text style={requirementText}>Skattemessige opplysninger</Text>
              </div>
            </div>

            <Text style={timeEstimate}>
              Prosessen tar ca. 5 minutter å fullføre
            </Text>
          </Section>

          {/* CTA Section */}
          <Section style={ctaSection}>
            <Button style={button} href={`${baseUrl}/stylist/stripe`}>
              Fullfør onboarding nå
            </Button>
            <Text style={ctaSubtext}>
              Du må fullføre denne prosessen før du kan tilby tjenester
            </Text>
          </Section>

          {/* Benefits Section */}
          <Section style={benefitsSection}>
            <Text style={benefitsHeader}>Hva skjer etter onboarding?</Text>

            <div style={benefitsList}>
              <div style={benefitItem}>
                <div style={benefitIcon}>1</div>
                <Text style={benefitText}>
                  Du kan opprette og publisere dine tjenester
                </Text>
              </div>

              <div style={benefitItem}>
                <div style={benefitIcon}>2</div>
                <Text style={benefitText}>
                  Automatiske utbetalinger etter fullførte oppdrag
                </Text>
              </div>

              <div style={benefitItem}>
                <div style={benefitIcon}>3</div>
                <Text style={benefitText}>
                  Tilgang til detaljert salgstatistikk
                </Text>
              </div>

              <div style={benefitItem}>
                <div style={benefitIcon}>4</div>
                <Text style={benefitText}>
                  Chat direkte med potensielle kunder
                </Text>
              </div>
            </div>
          </Section>

          <Hr style={hr} />

          {/* Security Section */}
          <Section style={securitySection}>
            <Text style={securityHeader}>Sikkerhet og personvern</Text>
            <Text style={securityText}>
              All informasjon behandles i henhold til GDPR og norsk
              personvernlovgivning. Vi bruker bransjeledende kryptering for å
              beskytte dine data, og informasjonen deles kun med våre godkjente
              betalingspartnere for å behandle transaksjoner.
            </Text>
          </Section>

          {/* Support Section */}
          <Section style={supportSection}>
            <Text style={supportHeader}>Trenger du hjelp?</Text>
            <Text style={supportText}>
              Hvis du har spørsmål om onboarding-prosessen eller trenger teknisk
              støtte, er vi her for å hjelpe.
            </Text>
            <Text style={supportContact}>
              <Link href="mailto:support@nabostylisten.no" style={supportLink}>
                support@nabostylisten.no
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Notification Settings */}
          <Section style={settingsSection}>
            <Text style={settingsText}>
              Du mottar denne e-posten fordi din stylistsøknad ble godkjent.
            </Text>
            <Text style={settingsText}>
              <Link
                href={`${baseUrl}/profiler/${userId}/preferanser`}
                style={settingsLink}
              >
                Administrer varslingsinnstillinger
              </Link>
            </Text>
          </Section>

          <Text style={footer}>
            <Link href={baseUrl} target="_blank" style={footerLink}>
              nabostylisten.no
            </Link>
            <br />
            <span style={footerTagline}>
              Din vei til å bygge en lønnsom stylistvirksomhet
            </span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

StylistOnboardingEmail.PreviewProps = {
  logoUrl: "https://nabostylisten.no/logo-email.png",
  stylistName: "Kari Nordmann",
  userId: "123",
} as StylistOnboardingEmailProps;

export default StylistOnboardingEmail;

// Base styles
const main = baseStyles.main;
const container = baseStyles.container;
const logoContainer = baseStyles.logoContainer;
const logo = baseStyles.logo;
const heading = baseStyles.heading;
const hr = baseStyles.hr;
const footer = baseStyles.footer;

const welcomeText = {
  ...baseStyles.paragraph,
  fontSize: "18px",
  textAlign: "center" as const,
  color: colors.foreground,
  marginBottom: "32px",
};

// Onboarding Section
const onboardingSection = {
  ...sectionStyles.infoSection,
  padding: "32px 24px",
};

const sectionHeader = {
  ...textStyles.sectionHeader,
  textAlign: "center" as const,
  marginBottom: "20px",
};

const explanationText = {
  fontSize: "15px",
  color: colors.foreground,
  margin: "0 0 24px 0",
  lineHeight: "1.6",
  textAlign: "center" as const,
};

const requirementsContainer = {
  backgroundColor: colors.secondary,
  borderRadius: "10px",
  padding: "20px",
  margin: "24px 0",
};

const requirementsTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: colors.secondaryForeground,
  margin: "0 0 16px 0",
  textAlign: "center" as const,
};

const requirementItem = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "12px",
};

const requirementIcon = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  backgroundColor: colors.secondaryForeground,
  color: colors.white,
  borderRadius: "50%",
  fontSize: "16px",
  fontWeight: "bold",
  flexShrink: 0,
};

const requirementText = {
  fontSize: "14px",
  color: colors.secondaryForeground,
  margin: "0",
  flex: 1,
};

const timeEstimate = {
  fontSize: "14px",
  color: colors.mutedForeground,
  margin: "16px 0 0 0",
  textAlign: "center" as const,
  fontStyle: "italic",
};

// CTA Section
const ctaSection = {
  ...sectionStyles.actionSection,
  margin: "32px 0",
};

const button = {
  ...buttonStyles.primary,
  fontSize: "16px",
  padding: "14px 32px",
};

const ctaSubtext = {
  fontSize: "13px",
  color: colors.mutedForeground,
  margin: "12px 0 0 0",
  textAlign: "center" as const,
};

// Benefits Section
const benefitsSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: colors.accent,
  borderRadius: "10px",
};

const benefitsHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: colors.accentForeground,
  margin: "0 0 20px 0",
  textAlign: "center" as const,
};

const benefitsList = {
  margin: "0",
};

const benefitItem = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  gap: "12px",
  marginBottom: "16px",
};

const benefitIcon = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  backgroundColor: colors.accentForeground,
  color: colors.white,
  borderRadius: "50%",
  fontSize: "14px",
  fontWeight: "bold",
  flexShrink: 0,
};

const benefitText = {
  fontSize: "14px",
  color: colors.accentForeground,
  margin: "0",
  lineHeight: "1.5",
  flex: 1,
};

// Security Section
const securitySection = {
  margin: "24px 0",
  textAlign: "center" as const,
};

const securityHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: colors.foreground,
  margin: "0 0 12px 0",
};

const securityText = {
  fontSize: "13px",
  color: colors.mutedForeground,
  margin: "0",
  lineHeight: "1.6",
};

// Support Section
const supportSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: colors.secondary,
  borderRadius: "10px",
  textAlign: "center" as const,
};

const supportHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: colors.secondaryForeground,
  margin: "0 0 12px 0",
};

const supportText = {
  fontSize: "14px",
  color: colors.secondaryForeground,
  margin: "0 0 12px 0",
  lineHeight: "1.5",
};

const supportContact = {
  fontSize: "14px",
  color: colors.secondaryForeground,
  margin: "0",
};

const supportLink = {
  color: colors.secondaryForeground,
  textDecoration: "none",
  fontWeight: "500",
};

// Settings Section
const settingsSection = sectionStyles.settingsSection;
const settingsText = textStyles.settingsText;
const settingsLink = textStyles.settingsLink;

const footerLink = {
  ...baseStyles.link,
  fontSize: "16px",
  fontWeight: "600",
};

const footerTagline = {
  color: colors.mutedForeground,
  fontSize: "12px",
  fontStyle: "italic",
};
