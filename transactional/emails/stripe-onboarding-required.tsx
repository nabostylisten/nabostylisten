import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { NotificationSettings } from "../components/notification-settings";
import { brandColors } from "../../lib/brand";
import { baseUrl } from "./utils";

interface StripeOnboardingRequiredProps {
  logoUrl: string;
  recipientType: "stylist" | "admin";
  stylistName: string;
  stylistEmail: string;
  customerName: string;
}

export const StripeOnboardingRequired = ({
  logoUrl,
  recipientType,
  stylistName,
  stylistEmail,
  customerName,
}: StripeOnboardingRequiredProps) => {
  const previewText =
    recipientType === "stylist"
      ? `${stylistName}, du må fullføre betalingsoppsett for å motta bookinger`
      : `Stylist ${stylistName} mangler betalingsoppsett`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoContainer}>
            <Img
              src={logoUrl}
              width="120"
              height="36"
              alt="Nabostylisten"
              style={logo}
            />
          </Section>

          {/* Content */}
          <Section>
            {recipientType === "stylist" ? (
              <>
                <Heading style={heading}>Hei {stylistName}!</Heading>
                <Text style={paragraph}>
                  Du har mottatt en bookingforespørsel fra{" "}
                  <strong>{customerName}</strong>, men vi kan ikke behandle
                  betalingen fordi du ikke har fullført betalingsoppsettet ditt
                  hos Stripe.
                </Text>
                <Text style={paragraph}>
                  For å kunne motta betaling for dine tjenester må du:
                </Text>
                <Text style={paragraph}>
                  • Fullføre Stripe-onboarding
                  <br />
                  • Legge til bankkontoinformasjon
                  <br />• Verifisere identiteten din
                </Text>
                <Text style={paragraph}>
                  Dette er en engangsprosess som tar bare noen få minutter. Når
                  den er fullført, vil du kunne motta alle fremtidige bookinger
                  uten problemer.
                </Text>

                <Section style={buttonSection}>
                  <Button style={button} href={`${baseUrl}/stylist/stripe`}>
                    Fullfør betalingsoppsett
                  </Button>
                </Section>

                <Section style={infoSection}>
                  <Text style={infoText}>
                    <strong>Viktig:</strong> Kunden {customerName} har blitt
                    informert om at du vil fullføre oppsettet, og de kan prøve å
                    booke igjen senere.
                  </Text>
                </Section>

                <NotificationSettings
                  profileId={stylistEmail}
                  notificationType="payment_notifications"
                />
              </>
            ) : (
              <>
                <Heading style={heading}>
                  Stylist mangler Stripe-onboarding
                </Heading>
                <Text style={paragraph}>
                  En kunde forsøkte å booke tjenester, men betalingen kunne ikke
                  behandles.
                </Text>
                <Section style={detailsSection}>
                  <Text style={detailsTitle}>Detaljer:</Text>
                  <Text style={detailsText}>
                    <strong>Stylist:</strong> {stylistName}
                    <br />
                    <strong>E-post:</strong> {stylistEmail}
                    <br />
                    <strong>Kunde:</strong> {customerName}
                    <br />
                    <strong>Problem:</strong> Stripe-kontoen mangler
                    bankkontoinformasjon
                  </Text>
                </Section>
                <Text style={paragraph}>
                  Stylisten har blitt sendt en e-post med instruksjoner om å
                  fullføre Stripe-onboarding. Du kan også følge opp direkte
                  eller hjelpe dem gjennom prosessen.
                </Text>

                <NotificationSettings
                  profileId="admin"
                  notificationType="booking_status_updates"
                />
              </>
            )}
          </Section>

          {/* Help section */}
          <Section style={helpSection}>
            <Text style={helpText}>
              Trenger du hjelp? Ta kontakt med oss på{" "}
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

StripeOnboardingRequired.PreviewProps = {
  logoUrl: "https://example.com/logo.png",
  recipientType: "stylist" as const,
  stylistName: "Anna Stylist",
  stylistEmail: "anna@example.com",
  customerName: "Ola Nordmann",
  onboardingUrl: "https://connect.stripe.com/setup/acct_123",
  dashboardUrl: "https://dashboard.nabostylisten.no/admin",
} as StripeOnboardingRequiredProps;

export default StripeOnboardingRequired;

// Styled with Nabostylisten branded colors
const main = {
  backgroundColor: brandColors.light.background,
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: `0 4px 6px ${brandColors.light.foreground}1a`, // 10% opacity
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
  color: brandColors.light.foreground,
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: brandColors.light.foreground,
  margin: "0 0 20px",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: brandColors.light.primary,
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
  margin: "16px 0",
  boxShadow: `0 2px 4px ${brandColors.light.primary}4d`, // 30% opacity
};

const infoSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: brandColors.light.secondary,
  borderRadius: "10px",
  border: `2px solid ${brandColors.light.primary}`,
};

const infoText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: brandColors.light.foreground,
  margin: "0",
};

const detailsSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: brandColors.light.muted,
  borderRadius: "10px",
  border: `1px solid ${brandColors.light.primary}4d`, // 30% opacity
};

const detailsTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: brandColors.light.foreground,
  margin: "0 0 12px",
};

const detailsText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: brandColors.light.foreground,
  margin: "0",
};

const helpSection = {
  margin: "32px 0 16px",
  textAlign: "center" as const,
};

const helpText = {
  fontSize: "13px",
  color: brandColors.light.foreground,
  opacity: 0.7,
  margin: "0",
};

const link = {
  color: brandColors.light.primary,
  textDecoration: "none",
  fontWeight: "500",
};
