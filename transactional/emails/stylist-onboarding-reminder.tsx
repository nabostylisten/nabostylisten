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
  layoutStyles,
  colors,
} from "./utils/styles";
import { baseUrl } from "./utils";

interface StylistOnboardingReminderEmailProps {
  logoUrl: string;
  stylistName: string;
  daysSinceApproval: number;
  nextStep: "stripe_setup" | "identity_verification";
  reminderType: "gentle" | "urgent" | "final";
}

export const StylistOnboardingReminderEmail = ({
  logoUrl,
  stylistName = "Ola Nordmann",
  daysSinceApproval = 3,
  nextStep = "stripe_setup",
  reminderType = "gentle",
}: StylistOnboardingReminderEmailProps) => {
  const isStripeSetup = nextStep === "stripe_setup";
  const isUrgent = reminderType === "urgent";
  const isFinal = reminderType === "final";

  const getSubjectText = () => {
    if (isFinal) return "Siste påminnelse: Fullfør din stylist-onboarding";
    if (isUrgent) return "Viktig: Fullfør din stylist-onboarding";
    return "Fullfør din stylist-onboarding hos Nabostylisten";
  };

  const getTimeEstimate = () => {
    return isStripeSetup ? "3 minutter" : "2 minutter";
  };

  const getProgressPercentage = () => {
    return isStripeSetup ? "25%" : "75%";
  };

  const previewText = getSubjectText();

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

          {/* Priority Banner */}
          <Section
            style={
              reminderType === "final"
                ? finalBanner
                : reminderType === "urgent"
                  ? urgentBanner
                  : reminderBanner
            }
          >
            <Text style={bannerText}>
              {isFinal
                ? "Siste påminnelse"
                : isUrgent
                  ? "Viktig påminnelse"
                  : "Påminnelse"}
            </Text>
          </Section>

          <Heading style={heading}>
            {isFinal
              ? "Din onboarding utløper snart!"
              : isUrgent
                ? "Fullfør din onboarding nå"
                : "Fortsett din stylist-onboarding"}
          </Heading>

          <Text style={paragraph}>
            Hei {stylistName}! Det har gått {daysSinceApproval} dager siden
            søknaden din ble godkjent.
            {isFinal
              ? " Din onboarding-tilgang utløper om kort tid."
              : isUrgent
                ? " Du er så nære å kunne begynne å selge tjenester!"
                : " Du er så nær målet - la oss fullføre onboardingen din!"}
          </Text>

          {/* Progress Section */}
          <Section style={progressSection}>
            <Text style={progressHeader}>
              Fremdrift: {getProgressPercentage()} fullført
            </Text>

            <div style={progressBarContainer}>
              <div style={progressBar}>
                <div
                  style={{
                    ...progressFill,
                    width: getProgressPercentage(),
                  }}
                />
              </div>
            </div>

            <div style={stepsList}>
              <div style={stepItem}>
                <Text style={completedStep}>✓ Søknad godkjent</Text>
              </div>
              <div style={stepItem}>
                <Text style={isStripeSetup ? currentStep : completedStep}>
                  {isStripeSetup ? "→" : "✓"} Stripe-oppsett
                </Text>
              </div>
              <div style={stepItem}>
                <Text
                  style={
                    nextStep === "identity_verification"
                      ? currentStep
                      : pendingStep
                  }
                >
                  {nextStep === "identity_verification" ? "→" : "•"}{" "}
                  Identitetsverifisering
                </Text>
              </div>
              <div style={stepItem}>
                <Text style={pendingStep}>• Klar for salg</Text>
              </div>
            </div>
          </Section>

          {/* Next Step Details */}
          <Section style={nextStepSection}>
            <Text style={nextStepHeader}>
              Neste steg:{" "}
              {isStripeSetup ? "Stripe-oppsett" : "Identitetsverifisering"}
            </Text>

            <Text style={nextStepDescription}>
              {isStripeSetup
                ? "Vi trenger grunnleggende informasjon for å sette opp dine betalinger. Dette inkluderer personlig informasjon, bankdetaljer og identitetsbekreftelse."
                : "For å motta betalinger må du verifisere identiteten din med et gyldig ID-dokument (førerkort, pass, eller nasjonal ID)."}
            </Text>

            <div style={timeEstimateBox}>
              <Text style={timeEstimateText}>
                Estimert tid: {getTimeEstimate()}
              </Text>
            </div>
          </Section>

          {/* Benefits Reminder */}
          <Section style={benefitsSection}>
            <Text style={benefitsHeader}>
              Etter fullført onboarding kan du:
            </Text>
            <div style={benefitsList}>
              <Text style={benefitItem}>Opprette og publisere tjenester</Text>
              <Text style={benefitItem}>Motta betaling for oppdrag</Text>
              <Text style={benefitItem}>Chatte med kunder</Text>
              <Text style={benefitItem}>Se detaljerte inntektsrapporter</Text>
            </div>
          </Section>

          {/* Call to Action */}
          <Section style={ctaSection}>
            <Text style={paragraph}>
              Det tar bare {getTimeEstimate()} å fullføre. Start nå og begynn å
              tjene penger på dine ferdigheter!
            </Text>
            <Button
              style={isFinal ? buttonFinal : isUrgent ? buttonUrgent : button}
              href={`${baseUrl}/stylist/stripe`}
            >
              {isFinal
                ? "Fullfør nå før det er for sent"
                : isUrgent
                  ? "Fullfør onboarding nå"
                  : "Fortsett onboarding"}
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Support */}
          <Text style={supportText}>
            Trenger du hjelp? Kontakt oss på{" "}
            <Link href="mailto:support@nabostylisten.no" style={link}>
              support@nabostylisten.no
            </Link>
          </Text>

          {/* Footer Warning for Final Reminder */}
          {isFinal && (
            <Section style={warningSection}>
              <Text style={warningText}>
                Onboarding-tilgangen din utløper snart. Hvis du ikke fullfører
                innen 7 dager, må du søke på nytt.
              </Text>
            </Section>
          )}

          <Text style={footer}>
            Du mottar denne e-posten fordi du er en godkjent stylist hos
            Nabostylisten.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

StylistOnboardingReminderEmail.PreviewProps = {
  logoUrl: "https://example.com/logo.png",
  stylistName: "Anna Nordmann",
  daysSinceApproval: 3,
  nextStep: "stripe_setup",
  reminderType: "gentle",
} as StylistOnboardingReminderEmailProps;

export default StylistOnboardingReminderEmail;

// Using shared Nabostylisten branded styles
const main = baseStyles.main;
const container = baseStyles.container;
const logoContainer = baseStyles.logoContainer;
const logo = baseStyles.logo;
const heading = baseStyles.heading;
const paragraph = baseStyles.paragraph;
const hr = baseStyles.hr;
const footer = baseStyles.footer;
const link = baseStyles.link;

// Specific styles for onboarding reminder
const reminderBanner = {
  backgroundColor: colors.primary,
  borderRadius: "8px",
  padding: "12px 20px",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const urgentBanner = {
  ...reminderBanner,
  backgroundColor: "#f59e0b", // amber-500
};

const finalBanner = {
  ...reminderBanner,
  backgroundColor: "#ef4444", // red-500
};

const bannerText = {
  color: colors.white,
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const progressSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#f8fafc", // slate-50
  border: "1px solid #e2e8f0", // slate-200
  borderRadius: "12px",
};

const progressHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: colors.foreground,
  margin: "0 0 16px",
  textAlign: "center" as const,
};

const progressBarContainer = {
  margin: "16px 0",
};

const progressBar = {
  width: "100%",
  height: "8px",
  backgroundColor: "#e2e8f0", // slate-200
  borderRadius: "4px",
  overflow: "hidden",
};

const progressFill = {
  height: "100%",
  backgroundColor: colors.primary,
  borderRadius: "4px",
  transition: "width 0.3s ease",
};

const stepsList = {
  marginTop: "20px",
};

const stepItem = {
  marginBottom: "8px",
};

const completedStep = {
  fontSize: "14px",
  color: "#16a34a", // green-600
  margin: "0",
  fontWeight: "500",
};

const currentStep = {
  fontSize: "14px",
  color: colors.primary,
  margin: "0",
  fontWeight: "600",
};

const pendingStep = {
  fontSize: "14px",
  color: "#64748b", // slate-500
  margin: "0",
};

const nextStepSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: colors.accent,
  border: `1px solid ${colors.accentForeground}`,
  borderRadius: "12px",
};

const nextStepHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: colors.accentForeground,
  margin: "0 0 12px",
};

const nextStepDescription = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: colors.accentForeground,
  margin: "0 0 16px",
};

const timeEstimateBox = {
  padding: "12px 16px",
  backgroundColor: "rgba(59, 130, 246, 0.1)", // blue-500 with opacity
  border: "1px solid rgba(59, 130, 246, 0.2)",
  borderRadius: "8px",
};

const timeEstimateText = {
  fontSize: "14px",
  color: "#1d4ed8", // blue-700
  margin: "0",
  fontWeight: "500",
};

const benefitsSection = {
  margin: "32px 0",
};

const benefitsHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: colors.foreground,
  margin: "0 0 16px",
};

const benefitsList = {
  marginLeft: "0",
};

const benefitItem = {
  fontSize: "14px",
  lineHeight: "1.8",
  color: colors.foreground,
  margin: "0 0 8px",
};

const ctaSection = sectionStyles.actionSection;
const button = buttonStyles.primary;

const buttonUrgent = {
  ...buttonStyles.primary,
  backgroundColor: "#f59e0b", // amber-500
};

const buttonFinal = {
  ...buttonStyles.primary,
  backgroundColor: "#ef4444", // red-500
};

const supportText = {
  fontSize: "14px",
  color: colors.mutedForeground,
  textAlign: "center" as const,
  margin: "16px 0",
};

const warningSection = {
  margin: "24px 0",
  padding: "16px",
  backgroundColor: "#fef3c7", // amber-100
  border: "1px solid #f59e0b", // amber-500
  borderRadius: "8px",
};

const warningText = {
  fontSize: "14px",
  color: "#92400e", // amber-800
  margin: "0",
  textAlign: "center" as const,
  fontWeight: "500",
};
