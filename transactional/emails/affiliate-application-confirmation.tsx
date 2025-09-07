import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import {
  baseStyles,
  sectionStyles,
  colors,
} from "./utils/styles";

interface AffiliateApplicationConfirmationProps {
  logoUrl: string;
  stylistName: string;
  applicationId: string;
  submittedAt: Date;
}

export const AffiliateApplicationConfirmation = ({
  logoUrl,
  stylistName = "Anna",
  applicationId = "aff_12345",
  submittedAt = new Date(),
}: AffiliateApplicationConfirmationProps) => {
  const previewText = `Partnersøknaden din er mottatt og blir behandlet`;

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

          <Heading style={heading}>Takk for din partnersøknad! ✨</Heading>

          <Text style={paragraph}>Kjære {stylistName},</Text>

          <Text style={paragraph}>
            Takk for at du søkte om å bli partner hos Nabostylisten! Vi har
            mottatt søknaden din og setter stor pris på din interesse for å
            være en del av vårt partnerprogram.
          </Text>

          <Section style={confirmationSection}>
            <Text style={confirmationLabel}>Søknad mottatt:</Text>
            <Text style={confirmationValue}>
              {submittedAt.toLocaleDateString("no-NO", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            
            <Text style={confirmationLabel}>Referanse:</Text>
            <Text style={confirmationValue}>{applicationId}</Text>
          </Section>

          <Section style={nextStepsSection}>
            <Heading style={subHeading}>Hva skjer nå?</Heading>
            
            <Text style={stepItem}>
              <strong>1. Vurdering</strong>
              <br />
              Vårt team vil nøye gå gjennom søknaden din og vurdere din
              bakgrunn, rekkevidde og markedsføringsplaner.
            </Text>
            
            <Text style={stepItem}>
              <strong>2. Behandlingstid</strong>
              <br />
              Vi behandler vanligvis søknader innen 3-5 virkedager. Du vil
              motta en e-post med vår beslutning.
            </Text>
            
            <Text style={stepItem}>
              <strong>3. Godkjenning</strong>
              <br />
              Hvis søknaden din blir godkjent, vil du få din unike
              partnerkode og tilgang til partnerdashboard.
            </Text>
          </Section>

          <Section style={infoSection}>
            <Heading style={subHeading}>I mellomtiden</Heading>
            
            <Text style={paragraph}>
              Mens vi behandler søknaden din, oppfordrer vi deg til å:
            </Text>
            
            <Text style={infoItem}>
              • Fortsette å bygge din tilstedeværelse på sosiale medier
            </Text>
            <Text style={infoItem}>
              • Gi fantastisk service til dine eksisterende kunder
            </Text>
            <Text style={infoItem}>
              • Bli kjent med Nabostylisten-plattformen hvis du ikke allerede har det
            </Text>
            <Text style={infoItem}>
              • Følg oss på sosiale medier for å holde deg oppdatert
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={paragraph}>
            Hvis du har spørsmål om søknaden din eller partnerprogrammet,
            ikke nøl med å kontakte oss på{" "}
            <Link href="mailto:partner@nabostylisten.no" style={link}>
              partner@nabostylisten.no
            </Link>
          </Text>

          <Text style={paragraph}>
            Vi ser frem til å vurdere søknaden din og håper på et fremtidig
            samarbeid!
          </Text>

          <Text style={footer}>
            Med vennlig hilsen,
            <br />
            Nabostylisten Partner Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

AffiliateApplicationConfirmation.PreviewProps = {
  logoUrl: "https://example.com/logo.png",
  stylistName: "Anna Nordmann",
  applicationId: "aff_12345",
  submittedAt: new Date(),
} as AffiliateApplicationConfirmationProps;

export default AffiliateApplicationConfirmation;

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

// Specific styles for confirmation email
const confirmationSection = {
  ...sectionStyles.infoSection,
  backgroundColor: colors.accent,
  border: `2px solid ${colors.accentForeground}`,
  textAlign: "center" as const,
};

const confirmationLabel = {
  color: colors.accentForeground,
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const confirmationValue = {
  color: colors.accentForeground,
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px 0",
};

const nextStepsSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: colors.muted,
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
};

const stepItem = {
  color: colors.foreground,
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "16px 0",
};

const infoSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: colors.secondary,
  borderRadius: "12px",
  border: `1px solid ${colors.secondaryForeground}`,
};

const infoItem = {
  color: colors.secondaryForeground,
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "8px 0",
};