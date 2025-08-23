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

interface WelcomeEmailProps {
  logoUrl?: string;
  userName?: string;
  userId?: string;
}

export const WelcomeEmail = ({
  logoUrl = `${baseUrl}/logo-email.png`,
  userName = "Ola Nordmann",
  userId = "123",
}: WelcomeEmailProps) => {
  const previewText = `Velkommen til Nabostylisten! Oppdag Norges beste stylister.`;

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
          <Heading style={heading}>Velkommen til Nabostylisten!</Heading>

          <Text style={welcomeText}>
            Hei {userName}! Vi er så glade for å ha deg med oss på reisen. Du
            har nå tilgang til Norges beste plattform for stylisttjenester.
          </Text>

          {/* Getting Started Section */}
          <Section style={gettingStartedSection}>
            <Text style={sectionHeader}>Kom i gang på 3 enkle steg:</Text>

            <div style={stepContainer}>
              <div style={stepNumber}>1</div>
              <div style={stepContent}>
                <Text style={stepTitle}>Utforsk stylister i ditt område</Text>
                <Text style={stepDescription}>
                  Bla gjennom hundrevis av kvalifiserte stylister og finn den
                  perfekte for deg
                </Text>
              </div>
            </div>

            <div style={stepContainer}>
              <div style={stepNumber}>2</div>
              <div style={stepContent}>
                <Text style={stepTitle}>Book din første time</Text>
                <Text style={stepDescription}>
                  Velg tjeneste, tid og sted - hjemme hos deg eller hos
                  stylisten
                </Text>
              </div>
            </div>

            <div style={stepContainer}>
              <div style={stepNumber}>3</div>
              <div style={stepContent}>
                <Text style={stepTitle}>Nyt din stylistopplevelse</Text>
                <Text style={stepDescription}>
                  Betal trygt gjennom appen og del din opplevelse med andre
                </Text>
              </div>
            </div>
          </Section>

          {/* CTA Button */}
          <Section style={ctaSection}>
            <Text style={ctaText}>Klar til å finne din neste stylist?</Text>
            <Button style={button} href={`${baseUrl}/`}>
              Utforsk stylister nå
            </Button>
          </Section>

          {/* Become a Stylist Section */}
          <Section style={stylistSection}>
            <Text style={stylistHeader}>Interessert i å bli stylist?</Text>
            <Text style={stylistText}>
              Har du erfaring innen skjønnhetsbransjen? Bli en del av vårt
              nettverk av profesjonelle stylister og bygg din egen virksomhet.
            </Text>
            <div style={stylistBenefits}>
              <Text style={benefitItem}>Bygg din kundebase</Text>
              <Text style={benefitItem}>Fleksibel timeplan</Text>
              <Text style={benefitItem}>Sikker betaling</Text>
            </div>
            <Button style={stylistButton} href={`${baseUrl}/bli-stylist`}>
              Søk som stylist
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Tips Section */}
          <Section style={tipsSection}>
            <Text style={tipsHeader}>
              Tips for å få mest ut av Nabostylisten:
            </Text>
            <Text style={tipsText}>
              • Les anmeldelser og se bilder fra tidligere kunder
              <br />
              • Kommuniser dine ønsker tydelig i chatten
              <br />
              • Book i god tid, spesielt til helger og høytider
              <br />• Gi tilbakemelding etter hver behandling for å hjelpe andre
            </Text>
          </Section>

          {/* Support Section */}
          <Section style={supportSection}>
            <Text style={supportHeader}>Trenger du hjelp?</Text>
            <Text style={supportText}>
              Vårt kundeserviceteam er her for å hjelpe deg.
            </Text>
            <Text style={supportContact}>
              {" "}
              <Link href="mailto:support@nabostylisten.no" style={supportLink}>
                support@nabostylisten.no
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Notification Settings */}
          <Section style={settingsSection}>
            <Text style={settingsText}>
              Du mottar denne e-posten fordi du opprettet en konto hos
              Nabostylisten.
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
              Book din neste stylistopplevelse i dag
            </span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

WelcomeEmail.PreviewProps = {
  logoUrl: "https://nabostylisten.no/logo-email.png",
  userName: "Ola Nordmann",
  userId: "123",
} as WelcomeEmailProps;

export default WelcomeEmail;

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

// Getting Started Section
const gettingStartedSection = {
  ...sectionStyles.infoSection,
  padding: "32px 24px",
};

const sectionHeader = {
  ...textStyles.sectionHeader,
  textAlign: "center" as const,
  marginBottom: "24px",
};

const stepContainer = {
  display: "flex",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "24px",
};

const stepNumber = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "40px",
  height: "40px",
  backgroundColor: colors.primary,
  color: colors.white,
  borderRadius: "50%",
  fontSize: "18px",
  fontWeight: "bold",
  flexShrink: 0,
};

const stepContent = {
  flex: 1,
};

const stepTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: colors.foreground,
  margin: "0 0 4px 0",
};

const stepDescription = {
  fontSize: "14px",
  color: colors.mutedForeground,
  margin: "0",
  lineHeight: "1.5",
};

// CTA Section
const ctaSection = sectionStyles.actionSection;

const ctaText = {
  fontSize: "18px",
  color: colors.foreground,
  margin: "0 0 16px 0",
  fontWeight: "500",
};

const button = buttonStyles.primary;

// Stylist Section
const stylistSection = {
  ...sectionStyles.detailsSection,
  textAlign: "center" as const,
  margin: "32px 0",
};

const stylistHeader = {
  fontSize: "20px",
  fontWeight: "600",
  color: colors.secondaryForeground,
  margin: "0 0 12px 0",
};

const stylistText = {
  fontSize: "15px",
  color: colors.secondaryForeground,
  margin: "0 0 16px 0",
  lineHeight: "1.6",
};

const stylistBenefits = {
  margin: "20px 0",
};

const benefitItem = {
  fontSize: "14px",
  color: colors.secondaryForeground,
  margin: "4px 0",
  display: "block",
};

const stylistButton = {
  ...buttonStyles.primary,
  backgroundColor: colors.secondaryForeground,
  fontSize: "14px",
  padding: "12px 24px",
};

// Tips Section
const tipsSection = sectionStyles.tipsSection;
const tipsHeader = textStyles.tipsHeader;
const tipsText = textStyles.tipsText;

// Support Section
const supportSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: colors.accent,
  borderRadius: "10px",
  textAlign: "center" as const,
};

const supportHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: colors.accentForeground,
  margin: "0 0 12px 0",
};

const supportText = {
  fontSize: "14px",
  color: colors.accentForeground,
  margin: "0 0 12px 0",
  lineHeight: "1.5",
};

const supportContact = {
  fontSize: "14px",
  color: colors.accentForeground,
  margin: "0",
};

const supportLink = {
  color: colors.accentForeground,
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
