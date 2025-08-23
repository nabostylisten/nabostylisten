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

interface SecurityAlertEmailProps {
  userName: string;
  alertType:
    | "successful_login"
    | "failed_login"
    | "password_changed"
    | "suspicious_activity"
    | "new_device"
    | "account_recovery"
    | "data_export";
  timestamp: string;
  ipAddress?: string;
  location?: string;
  device?: string;
  browser?: string;
  attemptCount?: number;
  recoveryMethod?: string;
  dataType?: string;
}

export const SecurityAlertEmail = ({
  userName = "Ola Nordmann",
  alertType = "successful_login",
  timestamp = "15. januar 2024, 14:30",
  ipAddress = "192.168.1.1",
  location = "Oslo, Norge",
  device = "iPhone 15",
  browser = "Safari",
  attemptCount = 3,
  recoveryMethod = "E-post",
  dataType = "Profildata",
}: SecurityAlertEmailProps) => {
  const getAlertConfig = () => {
    switch (alertType) {
      case "successful_login":
        return {
          title: "Vellykket pålogging",
          emoji: "✅",
          description: "Du har logget inn på kontoen din",
          color: { bg: "#4a7c4a", text: "#ffffff" }, // success green
          severity: "info" as const,
        };
      case "failed_login":
        return {
          title: "Mislykkede påloggingsforsøk",
          emoji: "⚠️",
          description: `${attemptCount} mislykkede påloggingsforsøk på kontoen din`,
          color: { bg: "#fee7dc", text: "#c2724a" }, // warning orange
          severity: "warning" as const,
        };
      case "password_changed":
        return {
          title: "Passord endret",
          emoji: "🔑",
          description: "Passordet ditt har blitt endret",
          color: { bg: "#9b8cc8", text: "#ffffff" }, // primary purple
          severity: "info" as const,
        };
      case "suspicious_activity":
        return {
          title: "Mistenkelig aktivitet",
          emoji: "🚨",
          description: "Vi har oppdaget uvanlig aktivitet på kontoen din",
          color: { bg: "#ff3333", text: "#ffffff" }, // error red
          severity: "critical" as const,
        };
      case "new_device":
        return {
          title: "Pålogging fra ny enhet",
          emoji: "📱",
          description: "Kontoen din ble åpnet fra en ny enhet",
          color: { bg: "#9b8cc8", text: "#ffffff" }, // primary purple
          severity: "info" as const,
        };
      case "account_recovery":
        return {
          title: "Kontogjennoppretting forsøkt",
          emoji: "🔒",
          description: "Noen forsøkte å gjenopprette kontoen din",
          color: { bg: "#fee7dc", text: "#c2724a" }, // warning orange
          severity: "warning" as const,
        };
      case "data_export":
        return {
          title: "Dataeksport forespurt",
          emoji: "📦",
          description: "En forespørsel om å eksportere kontodataene dine",
          color: { bg: "#9b8cc8", text: "#ffffff" }, // primary purple
          severity: "info" as const,
        };
      default:
        return {
          title: "Sikkerhetsvarsel",
          emoji: "🔐",
          description: "Sikkerhetsrelatert aktivitet på kontoen din",
          color: { bg: "#9b8cc8", text: "#ffffff" }, // primary purple
          severity: "info" as const,
        };
    }
  };

  const config = getAlertConfig();
  const previewText = `Sikkerhetsvarsel: ${config.title}`;

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
              ...alertBanner,
              backgroundColor: config.color.bg,
              ...(config.severity === "critical" && criticalBorderStyle),
            }}
          >
            <Text
              style={{
                ...alertText,
                color: config.color.text,
              }}
            >
              {config.emoji} {config.title}
            </Text>
          </Section>

          <Heading style={heading}>{config.description}</Heading>

          <Text style={paragraph}>
            Hei {userName}! Vi sender deg dette sikkerhetsvarsselet for å holde
            deg informert om aktivitet på kontoen din.
          </Text>

          {/* Activity Details */}
          <Section style={activitySection}>
            <Text style={sectionHeader}>🔍 Aktivitetsdetaljer:</Text>

            <div style={detailRow}>
              <Text style={detailLabel}>Tidspunkt:</Text>
              <Text style={detailValue}>{timestamp}</Text>
            </div>

            {ipAddress && (
              <div style={detailRow}>
                <Text style={detailLabel}>IP-adresse:</Text>
                <Text style={detailValue}>{ipAddress}</Text>
              </div>
            )}

            {location && (
              <div style={detailRow}>
                <Text style={detailLabel}>Lokasjon:</Text>
                <Text style={detailValue}>{location}</Text>
              </div>
            )}

            {device && (
              <div style={detailRow}>
                <Text style={detailLabel}>Enhet:</Text>
                <Text style={detailValue}>{device}</Text>
              </div>
            )}

            {browser && (
              <div style={detailRow}>
                <Text style={detailLabel}>Nettleser:</Text>
                <Text style={detailValue}>{browser}</Text>
              </div>
            )}

            {alertType === "account_recovery" && recoveryMethod && (
              <div style={detailRow}>
                <Text style={detailLabel}>Metode:</Text>
                <Text style={detailValue}>{recoveryMethod}</Text>
              </div>
            )}

            {alertType === "data_export" && dataType && (
              <div style={detailRow}>
                <Text style={detailLabel}>Datatype:</Text>
                <Text style={detailValue}>{dataType}</Text>
              </div>
            )}
          </Section>

          {/* Action Required for Critical Alerts */}
          {config.severity === "critical" && (
            <Section style={criticalSection}>
              <Text style={criticalHeader}>🚨 Handling kreves umiddelbart</Text>
              <Text style={criticalText}>
                Hvis dette ikke var deg, vennligst sikre kontoen din
                umiddelbart:
              </Text>
              <Text style={criticalSteps}>
                1. Endre passordet ditt øyeblikkelig
                <br />
                2. Aktiver to-faktor autentisering
                <br />
                3. Sjekk kontoen din for uautoriserte endringer
                <br />
                4. Kontakt support hvis du trenger hjelp
              </Text>
            </Section>
          )}

          {/* Warning for Failed Logins */}
          {alertType === "failed_login" && (
            <Section style={warningSection}>
              <Text style={warningHeader}>⚠️ Mislykkede påloggingsforsøk</Text>
              <Text style={warningText}>
                Det har vært {attemptCount} mislykkede forsøk på å logge inn på
                kontoen din. Hvis dette ikke var deg, bør du vurdere å endre
                passordet ditt.
              </Text>
            </Section>
          )}

          {/* Success Confirmation */}
          {config.severity === "info" && alertType !== "new_device" && (
            <Section style={infoSection}>
              <Text style={infoHeader}>ℹ️ Dette var deg?</Text>
              <Text style={infoText}>
                Hvis du gjenkjenner denne aktiviteten, trenger du ikke å gjøre
                noe. Vi sender disse varslene for å holde kontoen din sikker.
              </Text>
            </Section>
          )}

          {/* New Device Instructions */}
          {alertType === "new_device" && (
            <Section style={newDeviceSection}>
              <Text style={newDeviceHeader}>📱 Ny enhet oppdaget</Text>
              <Text style={newDeviceText}>
                Vi har registrert en pålogging fra en enhet vi ikke gjenkjenner.
                Hvis dette var deg, kan du ignorere denne meldingen. Hvis ikke,
                endre passordet ditt umiddelbart.
              </Text>
            </Section>
          )}

          {/* Security Actions */}
          <Section style={actionsSection}>
            <Text style={actionsHeader}>🔐 Sikkerhetstiltak:</Text>

            {config.severity === "critical" || alertType === "failed_login" ? (
              <div style={urgentActions}>
                <Button style={urgentButton} href={`${baseUrl}/reset-password`}>
                  Endre passord nå
                </Button>
                <Button
                  style={secondaryButton}
                  href={`${baseUrl}/security-settings`}
                >
                  Sikkerhetsinnstillinger
                </Button>
              </div>
            ) : (
              <Button
                style={button}
                href={`${baseUrl}/profiler/${userName}/sikkerhet`}
              >
                Se sikkerhetsaktivitet
              </Button>
            )}
          </Section>

          {/* Security Tips */}
          <Section style={tipsSection}>
            <Text style={tipsHeader}>💡 Sikkerhetstips:</Text>
            <Text style={tipsText}>
              • Bruk et sterkt, unikt passord for kontoen din
              <br />
              • Aktiver to-faktor autentisering for ekstra sikkerhet
              <br />
              • Ikke del påloggingsopplysningene dine med andre
              <br />
              • Logg ut av offentlige datamaskiner etter bruk
              <br />
              • Hold nettleseren og appen oppdatert
              <br />• Vær forsiktig med phishing-e-poster og mistenkelige lenker
            </Text>
          </Section>

          {/* Contact Information */}
          <Section style={contactSection}>
            <Text style={contactHeader}>🆘 Trenger du hjelp?</Text>
            <Text style={contactText}>
              Hvis du har spørsmål om denne sikkerhetsaktiviteten eller trenger
              hjelp med å sikre kontoen din, ikke nøl med å kontakte oss.
            </Text>
            <div style={contactMethods}>
              <Link href="mailto:security@nabostylisten.no" style={contactLink}>
                📧 security@nabostylisten.no
              </Link>
              <Link href="mailto:support@nabostylisten.no" style={contactLink}>
                💬 support@nabostylisten.no
              </Link>
            </div>
          </Section>

          {/* Notification Settings */}
          <Section style={settingsSection}>
            <Text style={settingsText}>
              🔔 Du mottar denne e-posten fordi sikkerhetsvarsler er aktivert på
              kontoen din.
            </Text>
            <Text style={settingsNote}>
              Sikkerhetsvarsler kan ikke deaktiveres av sikkerhetsmessige
              årsaker.
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Dette er en automatisk sikkerhetsmelding fra Nabostylisten.
          </Text>

          <Text style={footer}>
            For sikkerhetsspørsmål, kontakt:{" "}
            <Link href="mailto:security@nabostylisten.no" style={link}>
              security@nabostylisten.no
            </Link>
          </Text>

          <Text style={footer}>
            Aktivitet registrert: {timestamp}
            {ipAddress && ` • IP: ${ipAddress}`}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

SecurityAlertEmail.PreviewProps = {
  userName: "Ola Nordmann",
  alertType: "suspicious_activity" as const,
  timestamp: "15. januar 2024 kl 14:30",
  ipAddress: "192.168.1.100",
  location: "Oslo, Norge",
  deviceInfo: "Chrome på MacOS",
  actionRequired: true,
} as SecurityAlertEmailProps;

export default SecurityAlertEmail;

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

const alertBanner = {
  borderRadius: "8px",
  padding: "12px 20px",
  textAlign: "center" as const,
  marginBottom: "24px",
  border: "2px solid",
};

const criticalBorderStyle = {
  border: "3px solid #ff3333",
  boxShadow: "0 0 0 1px #ff3333",
  animation: "pulse 2s infinite",
};

const alertText = {
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

const activitySection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "10px",
  border: "1px solid rgba(155, 140, 200, 0.3)",
};

const sectionHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 16px",
};

const detailRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
  paddingBottom: "8px",
  borderBottom: "1px solid rgba(107, 102, 130, 0.1)",
};

const detailLabel = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#6b6682", // --muted-foreground
  margin: "0",
  flex: "0 0 120px",
};

const detailValue = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0",
  textAlign: "right" as const,
  flex: "1",
  fontFamily: "monospace",
};

const criticalSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#ffe6e6",
  border: "3px solid #ff3333", // --destructive
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(255, 51, 51, 0.2)",
};

const criticalHeader = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#cc0000",
  margin: "0 0 12px",
  textAlign: "center" as const,
};

const criticalText = {
  fontSize: "16px",
  color: "#cc0000",
  margin: "0 0 16px",
  textAlign: "center" as const,
  fontWeight: "600",
};

const criticalSteps = {
  fontSize: "14px",
  lineHeight: "1.8",
  color: "#cc0000",
  margin: "0",
  backgroundColor: "rgba(255, 255, 255, 0.5)",
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid rgba(204, 0, 0, 0.3)",
};

const warningSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#fff3cd",
  border: "2px solid #ffc107",
  borderRadius: "12px",
};

const warningHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#856404",
  margin: "0 0 12px",
};

const warningText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#856404",
  margin: "0",
};

const infoSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#e8f5e8", // --accent
  border: "2px solid #4a7c4a", // --accent-foreground
  borderRadius: "12px",
};

const infoHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#4a7c4a", // --accent-foreground
  margin: "0 0 12px",
};

const infoText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
};

const newDeviceSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#fee7dc", // --secondary
  border: "2px solid #c2724a", // --secondary-foreground
  borderRadius: "12px",
};

const newDeviceHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 12px",
};

const newDeviceText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#c2724a", // --secondary-foreground
  margin: "0",
};

const actionsSection = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const actionsHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 20px",
};

const urgentActions = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
  alignItems: "center",
};

const urgentButton = {
  backgroundColor: "#ff3333", // --destructive
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 32px",
  margin: "4px 0",
  boxShadow: "0 4px 8px rgba(255, 51, 51, 0.3)",
  width: "250px",
};

const secondaryButton = {
  backgroundColor: "#9b8cc8", // --primary
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  margin: "4px 0",
  boxShadow: "0 2px 4px rgba(155, 140, 200, 0.3)",
  width: "250px",
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

const tipsSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "8px",
  borderLeft: "4px solid #9b8cc8", // --primary
};

const tipsHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 12px",
};

const tipsText = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#6b6682", // --muted-foreground
  margin: "0",
};

const contactSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#fee7dc", // --secondary
  borderRadius: "12px",
  border: "2px solid #c2724a", // --secondary-foreground
  textAlign: "center" as const,
};

const contactHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 12px",
};

const contactText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 16px",
};

const contactMethods = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  alignItems: "center",
};

const contactLink = {
  fontSize: "14px",
  color: "#c2724a", // --secondary-foreground
  textDecoration: "none",
  fontWeight: "600",
  padding: "8px 16px",
  backgroundColor: "rgba(255, 255, 255, 0.5)",
  borderRadius: "6px",
  border: "1px solid rgba(194, 114, 74, 0.3)",
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

const settingsNote = {
  fontSize: "11px",
  color: "#6b6682", // --muted-foreground
  margin: "0",
  fontStyle: "italic",
};

const hr = {
  borderColor: "#edeaf7", // --muted
  margin: "40px 0 24px",
  borderWidth: "1px",
  borderStyle: "solid",
};

const footer = {
  color: "#6b6682", // --muted-foreground
  fontSize: "11px",
  lineHeight: "1.5",
  margin: "0 0 6px",
  textAlign: "center" as const,
};

const link = {
  color: "#9b8cc8", // --primary
  textDecoration: "none",
  fontWeight: "500",
};
