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

interface SystemUpdateEmailProps {
  userName: string;
  updateType:
    | "maintenance"
    | "new_features"
    | "bug_fixes"
    | "security_update"
    | "performance"
    | "downtime"
    | "api_changes"
    | "mobile_update";
  updateTitle: string;
  updateDescription: string;
  scheduledDate?: string;
  duration?: string;
  affectedServices?: string[];
  newFeatures?: Array<{
    title: string;
    description: string;
    userType?: "customer" | "stylist" | "all";
  }>;
  bugFixes?: string[];
  actionRequired?: boolean;
  actionDeadline?: string;
  actionDescription?: string;
  version?: string;
}

export const SystemUpdateEmail = ({
  userName = "Ola Nordmann",
  updateType = "new_features",
  updateTitle = "Nye funksjoner og forbedringer",
  updateDescription = "Vi har lansert spennende nye funksjoner som gjør det enda lettere å finne og bestille skjønnhetsbehandlinger.",
  scheduledDate,
  duration,
  affectedServices = [],
  newFeatures = [
    {
      title: "Forbedret søkefunksjon",
      description: "Finn stylister raskere med vår nye AI-drevne søkemotor",
      userType: "all",
    },
    {
      title: "Realtidsnotifikasjoner",
      description: "Få umiddelbare oppdateringer om bookingendringer",
      userType: "all",
    },
  ],
  bugFixes = [],
  actionRequired = false,
  actionDeadline,
  actionDescription,
  version = "2.1.0",
}: SystemUpdateEmailProps) => {
  const getUpdateConfig = () => {
    switch (updateType) {
      case "maintenance":
        return {
          emoji: "🔧",
          color: { bg: "#fee7dc", text: "#c2724a" }, // --secondary colors
          priority: "medium" as const,
        };
      case "new_features":
        return {
          emoji: "🚀",
          color: { bg: "#4a7c4a", text: "#ffffff" }, // success green
          priority: "low" as const,
        };
      case "bug_fixes":
        return {
          emoji: "🐛",
          color: { bg: "#9b8cc8", text: "#ffffff" }, // --primary
          priority: "medium" as const,
        };
      case "security_update":
        return {
          emoji: "🔒",
          color: { bg: "#ff3333", text: "#ffffff" }, // --destructive
          priority: "high" as const,
        };
      case "performance":
        return {
          emoji: "⚡",
          color: { bg: "#e8f5e8", text: "#4a7c4a" }, // --accent colors
          priority: "low" as const,
        };
      case "downtime":
        return {
          emoji: "⏰",
          color: { bg: "#fff3cd", text: "#856404" }, // warning yellow
          priority: "high" as const,
        };
      case "api_changes":
        return {
          emoji: "🔌",
          color: { bg: "#fee7dc", text: "#c2724a" }, // --secondary
          priority: "medium" as const,
        };
      case "mobile_update":
        return {
          emoji: "📱",
          color: { bg: "#9b8cc8", text: "#ffffff" }, // --primary
          priority: "low" as const,
        };
      default:
        return {
          emoji: "📢",
          color: { bg: "#9b8cc8", text: "#ffffff" }, // --primary
          priority: "medium" as const,
        };
    }
  };

  const config = getUpdateConfig();
  const previewText = `Systemoppdatering: ${updateTitle}`;

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

          <Section
            style={{
              ...updateBanner,
              backgroundColor: config.color.bg,
              ...(config.priority === "high" && priorityBorderStyle),
            }}
          >
            <Text
              style={{
                ...updateText,
                color: config.color.text,
              }}
            >
              {config.emoji} Systemoppdatering
            </Text>
          </Section>

          <Heading style={heading}>{updateTitle}</Heading>

          <Text style={paragraph}>
            Hei {userName}! {updateDescription}
          </Text>

          {/* Action Required Section */}
          {actionRequired && (
            <Section style={actionRequiredSection}>
              <Text style={actionRequiredHeader}>⚠️ Handling kreves</Text>
              <Text style={actionRequiredText}>{actionDescription}</Text>
              {actionDeadline && (
                <Text style={actionDeadline}>
                  <strong>Frist:</strong> {actionDeadline}
                </Text>
              )}
            </Section>
          )}

          {/* Scheduled Maintenance */}
          {(updateType === "maintenance" || updateType === "downtime") &&
            scheduledDate && (
              <Section style={scheduleSection}>
                <Text style={scheduleHeader}>📅 Planlagt vedlikehold:</Text>
                <div style={scheduleDetails}>
                  <div style={scheduleRow}>
                    <Text style={scheduleLabel}>Dato og tid:</Text>
                    <Text style={scheduleValue}>{scheduledDate}</Text>
                  </div>
                  {duration && (
                    <div style={scheduleRow}>
                      <Text style={scheduleLabel}>Varighet:</Text>
                      <Text style={scheduleValue}>{duration}</Text>
                    </div>
                  )}
                  {affectedServices.length > 0 && (
                    <div style={scheduleRow}>
                      <Text style={scheduleLabel}>Berørte tjenester:</Text>
                      <Text style={scheduleValue}>
                        {affectedServices.join(", ")}
                      </Text>
                    </div>
                  )}
                </div>
              </Section>
            )}

          {/* New Features */}
          {newFeatures.length > 0 && (
            <Section style={featuresSection}>
              <Text style={featuresHeader}>✨ Nye funksjoner:</Text>
              {newFeatures.map((feature, index) => (
                <div key={index} style={featureItem}>
                  <Text style={featureTitle}>
                    {feature.title}
                    {feature.userType && feature.userType !== "all" && (
                      <span style={userTypeTag}>
                        {feature.userType === "customer"
                          ? " (Kunder)"
                          : " (Stylister)"}
                      </span>
                    )}
                  </Text>
                  <Text style={featureDescription}>{feature.description}</Text>
                </div>
              ))}
            </Section>
          )}

          {/* Bug Fixes */}
          {bugFixes.length > 0 && (
            <Section style={bugFixesSection}>
              <Text style={bugFixesHeader}>🔧 Feilrettinger:</Text>
              <div style={bugFixesList}>
                {bugFixes.map((fix, index) => (
                  <Text key={index} style={bugFixItem}>
                    • {fix}
                  </Text>
                ))}
              </div>
            </Section>
          )}

          {/* Performance Improvements */}
          {updateType === "performance" && (
            <Section style={performanceSection}>
              <Text style={performanceHeader}>⚡ Ytelsesforbredringer:</Text>
              <Text style={performanceText}>
                Vi har gjort betydelige forbedringer for å gjøre Nabostylisten
                raskere og mer pålitelig:
              </Text>
              <Text style={performanceDetails}>
                • Raskere innlasting av stylisterOversikt
                <br />
                • Forbedret søkehastighet med opptil 70%
                <br />
                • Optimalisert bildelasting i galleries
                <br />
                • Redusert app-størrelse med 25%
                <br />• Forbedret stabilitet ved høy trafikk
              </Text>
            </Section>
          )}

          {/* Security Updates */}
          {updateType === "security_update" && (
            <Section style={securitySection}>
              <Text style={securityHeader}>🔒 Sikkerhetsoppdateringer:</Text>
              <Text style={securityText}>
                Vi har implementert viktige sikkerhetsforbredringer for å
                beskytte dine data og forbedre plattformens sikkerhet.
              </Text>
              <Text style={securityNote}>
                Disse oppdateringene krever ingen handling fra din side, men vi
                anbefaler å logge ut og inn igjen for beste opplevelse.
              </Text>
            </Section>
          )}

          {/* Mobile App Update */}
          {updateType === "mobile_update" && (
            <Section style={mobileSection}>
              <Text style={mobileHeader}>📱 Mobilapp-oppdatering:</Text>
              <Text style={mobileText}>
                Versjon {version} av Nabostylisten-appen er nå tilgjengelig i
                App Store og Google Play.
              </Text>
              <div style={mobileActions}>
                <Button
                  style={appStoreButton}
                  href="https://apps.apple.com/no/app/nabostylisten"
                >
                  Last ned fra App Store
                </Button>
                <Button
                  style={playStoreButton}
                  href="https://play.google.com/store/apps/details?id=no.nabostylisten"
                >
                  Last ned fra Google Play
                </Button>
              </div>
            </Section>
          )}

          {/* What's Next */}
          <Section style={roadmapSection}>
            <Text style={roadmapHeader}>🗺️ Hva skjer videre?</Text>
            <Text style={roadmapText}>
              Vi jobber kontinuerlig med å forbedre Nabostylisten. Her er noe av
              det du kan se frem til i kommende oppdateringer:
            </Text>
            <Text style={roadmapItems}>
              • AI-drevne anbefalinger basert på preferansene dine
              <br />
              • Integrert kalender for bedre bookingplanlegging
              <br />
              • Utvidet støtte for gruppebehandlinger
              <br />
              • Forbedret chatfunksjonalitet med filedialing
              <br />• Mer detaljerte anmeldelser og rating
            </Text>
          </Section>

          {/* Call to Action */}
          <Section style={ctaSection}>
            <Text style={ctaText}>
              {updateType === "new_features"
                ? "Utforsk de nye funksjonene i dag!"
                : updateType === "mobile_update"
                  ? "Oppdater appen din nå for den beste opplevelsen."
                  : "Takk for at du bruker Nabostylisten!"}
            </Text>
            {(updateType === "new_features" ||
              updateType === "performance") && (
              <Button style={button} href={`${baseUrl}/`}>
                Utforsk oppdateringene
              </Button>
            )}
          </Section>

          {/* Support Section */}
          <Section style={supportSection}>
            <Text style={supportHeader}>🆘 Trenger du hjelp?</Text>
            <Text style={supportText}>
              Hvis du opplever problemer etter oppdateringen eller har spørsmål
              om de nye funksjonene, er vi her for å hjelpe.
            </Text>
            <div style={supportMethods}>
              <Link href={`${baseUrl}/hjelp`} style={supportLink}>
                📚 Hjelpsenter
              </Link>
              <Link href="mailto:support@nabostylisten.no" style={supportLink}>
                📧 Kontakt support
              </Link>
            </div>
          </Section>

          {/* Feedback Section */}
          <Section style={feedbackSection}>
            <Text style={feedbackHeader}>💭 Din mening betyr mye!</Text>
            <Text style={feedbackText}>
              Hva synes du om oppdateringen? Din tilbakemelding hjelper oss å
              lage en bedre opplevelse for alle.
            </Text>
            <Button
              style={feedbackButton}
              href={`${baseUrl}/feedback?update=${version}`}
            >
              Gi tilbakemelding
            </Button>
          </Section>

          {/* Notification Settings */}
          <Section style={settingsSection}>
            <Text style={settingsText}>
              🔔 Du mottar denne e-posten fordi du har aktivert varsler for
              systemoppdateringer.
            </Text>
            <Link
              href={`${baseUrl}/profiler/${userName}/preferanser`}
              style={settingsLink}
            >
              Endre varselinnstillinger
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Takk for at du er en del av Nabostylisten-fellesskapet!
          </Text>

          <Text style={footer}>
            Har du spørsmål? Kontakt oss på{" "}
            <Link href="mailto:support@nabostylisten.no" style={link}>
              support@nabostylisten.no
            </Link>
          </Text>

          <Text style={footer}>
            Versjon: {version} • Oppdateringsdato:{" "}
            {new Date().toLocaleDateString("nb-NO")}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

SystemUpdateEmail.PreviewProps = {
  userName: "Ola Nordmann",
  updateType: "new_features" as const,
  updateTitle: "Nye funksjoner: Favoritt-stylister og forbedret søk!",
  updateDescription:
    "Vi har lagt til mulighet til å markere stylister som favoritter og kraftig forbedret søkefunksjonaliteten.",
  effectiveDate: "20. januar 2024",
  downtime: {
    required: false,
    duration: "Ingen nedetid",
    startTime: "",
  },
  actionRequired: false,
} as SystemUpdateEmailProps;

export default SystemUpdateEmail;

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
  marginBottom: "32px",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
};

const updateBanner = {
  borderRadius: "8px",
  padding: "12px 20px",
  textAlign: "center" as const,
  marginBottom: "24px",
  border: "2px solid",
};

const priorityBorderStyle = {
  border: "3px solid #ff3333",
  boxShadow: "0 0 0 1px #ff3333",
};

const updateText = {
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const heading = {
  fontSize: "28px",
  letterSpacing: "-0.5px",
  lineHeight: "1.2",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const paragraph = {
  margin: "0 0 20px",
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#453a6b", // --foreground
};

const actionRequiredSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#ffe6e6",
  border: "3px solid #ff3333", // --destructive
  borderRadius: "12px",
  textAlign: "center" as const,
};

const actionRequiredHeader = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#cc0000",
  margin: "0 0 12px",
};

const actionRequiredText = {
  fontSize: "16px",
  color: "#cc0000",
  margin: "0 0 12px",
  lineHeight: "1.6",
};

const actionDeadline = {
  fontSize: "14px",
  color: "#cc0000",
  margin: "0",
  fontWeight: "600",
};

const scheduleSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "12px",
  border: "2px solid #9b8cc8", // --primary
};

const scheduleHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 16px",
};

const scheduleDetails = {
  backgroundColor: "#ffffff",
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid rgba(155, 140, 200, 0.3)",
};

const scheduleRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};

const scheduleLabel = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#6b6682", // --muted-foreground
  margin: "0",
};

const scheduleValue = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0",
  textAlign: "right" as const,
};

const featuresSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#e8f5e8", // --accent
  borderRadius: "12px",
  border: "2px solid #4a7c4a", // --accent-foreground
};

const featuresHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#4a7c4a", // --accent-foreground
  margin: "0 0 20px",
};

const featureItem = {
  marginBottom: "20px",
  paddingBottom: "16px",
  borderBottom: "1px solid rgba(74, 124, 74, 0.2)",
};

const featureTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#4a7c4a", // --accent-foreground
  margin: "0 0 8px",
};

const userTypeTag = {
  fontSize: "12px",
  fontWeight: "500",
  color: "#4a7c4a", // --accent-foreground
  opacity: 0.7,
  fontStyle: "italic",
};

const featureDescription = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
  opacity: 0.9,
};

const bugFixesSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#fee7dc", // --secondary
  borderRadius: "8px",
  borderLeft: "4px solid #c2724a", // --secondary-foreground
};

const bugFixesHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 16px",
};

const bugFixesList = {
  backgroundColor: "rgba(255, 255, 255, 0.5)",
  padding: "16px",
  borderRadius: "6px",
};

const bugFixItem = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 8px",
};

const performanceSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#e8f5e8", // --accent
  borderRadius: "12px",
  border: "2px solid #4a7c4a", // --accent-foreground
};

const performanceHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#4a7c4a", // --accent-foreground
  margin: "0 0 16px",
};

const performanceText = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#4a7c4a", // --accent-foreground
  margin: "0 0 16px",
};

const performanceDetails = {
  fontSize: "14px",
  lineHeight: "1.8",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
  backgroundColor: "rgba(255, 255, 255, 0.5)",
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid rgba(74, 124, 74, 0.3)",
};

const securitySection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#ffe6e6",
  border: "2px solid #ff3333", // --destructive
  borderRadius: "12px",
};

const securityHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#cc0000",
  margin: "0 0 12px",
};

const securityText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#cc0000",
  margin: "0 0 12px",
};

const securityNote = {
  fontSize: "13px",
  lineHeight: "1.5",
  color: "#cc0000",
  margin: "0",
  fontStyle: "italic",
  opacity: 0.8,
};

const mobileSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "12px",
  border: "2px solid #9b8cc8", // --primary
  textAlign: "center" as const,
};

const mobileHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 16px",
};

const mobileText = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#453a6b", // --foreground
  margin: "0 0 24px",
};

const mobileActions = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
  alignItems: "center",
};

const appStoreButton = {
  backgroundColor: "#000000",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
  width: "250px",
};

const playStoreButton = {
  backgroundColor: "#01875f",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  boxShadow: "0 2px 4px rgba(1, 135, 95, 0.3)",
  width: "250px",
};

const roadmapSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#fee7dc", // --secondary
  borderRadius: "8px",
  borderLeft: "4px solid #c2724a", // --secondary-foreground
};

const roadmapHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 12px",
};

const roadmapText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 16px",
};

const roadmapItems = {
  fontSize: "13px",
  lineHeight: "1.8",
  color: "#c2724a", // --secondary-foreground
  margin: "0",
  backgroundColor: "rgba(255, 255, 255, 0.5)",
  padding: "16px",
  borderRadius: "6px",
  border: "1px solid rgba(194, 114, 74, 0.3)",
};

const ctaSection = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const ctaText = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#453a6b", // --foreground
  margin: "0 0 20px",
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
  margin: "8px 0",
  boxShadow: "0 2px 4px rgba(155, 140, 200, 0.3)",
};

const supportSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "12px",
  textAlign: "center" as const,
};

const supportHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 12px",
};

const supportText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#6b6682", // --muted-foreground
  margin: "0 0 16px",
};

const supportMethods = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  alignItems: "center",
};

const supportLink = {
  fontSize: "14px",
  color: "#9b8cc8", // --primary
  textDecoration: "none",
  fontWeight: "600",
  padding: "8px 16px",
  backgroundColor: "rgba(155, 140, 200, 0.1)",
  borderRadius: "6px",
  border: "1px solid rgba(155, 140, 200, 0.3)",
};

const feedbackSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#e8f5e8", // --accent
  borderRadius: "12px",
  border: "2px solid #4a7c4a", // --accent-foreground
  textAlign: "center" as const,
};

const feedbackHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#4a7c4a", // --accent-foreground
  margin: "0 0 12px",
};

const feedbackText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#4a7c4a", // --accent-foreground
  margin: "0 0 16px",
};

const feedbackButton = {
  backgroundColor: "#4a7c4a", // --accent-foreground
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  boxShadow: "0 2px 4px rgba(74, 124, 74, 0.3)",
};

const settingsSection = {
  margin: "32px 0",
  padding: "16px",
  backgroundColor: "rgba(155, 140, 200, 0.05)",
  borderRadius: "8px",
  textAlign: "center" as const,
};

const settingsText = {
  fontSize: "12px",
  color: "#6b6682", // --muted-foreground
  margin: "0 0 8px",
};

const settingsLink = {
  fontSize: "12px",
  color: "#9b8cc8", // --primary
  textDecoration: "none",
  fontWeight: "500",
};

const hr = {
  borderColor: "#edeaf7", // --muted
  margin: "40px 0 24px",
  borderWidth: "1px",
  borderStyle: "solid",
};

const footer = {
  color: "#6b6682", // --muted-foreground
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 0 6px",
  textAlign: "center" as const,
};

const link = {
  color: "#9b8cc8", // --primary
  textDecoration: "none",
  fontWeight: "500",
};
