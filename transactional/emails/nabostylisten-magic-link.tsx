import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

interface NabostylistenOtpEmailProps {
  token?: string;
  siteUrl?: string;
  email?: string;
}

export const NabostylistenOtpEmail = ({
  token = "{{ .Token }}",
  siteUrl = "{{ .SiteURL }}",
  email = "{{ .Email }}",
}: NabostylistenOtpEmailProps) => (
  <Html>
    <Head />
    <Preview>Din innloggingskode til Nabostylisten</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={headerSection}>
          <Heading style={h1}>🎨 Nabostylisten</Heading>
          <Text style={subtitle}>Din plattform for stylisttjenester</Text>
        </div>
        
        <div style={contentSection}>
          <Heading style={h2}>Din innloggingskode</Heading>
          <Text style={text}>
            Hei{email ? ` ${email}` : ""}!
          </Text>
          <Text style={text}>
            Her er din 6-sifrede innloggingskode:
          </Text>
          
          <div style={codeContainer}>
            <code style={code}>{token}</code>
          </div>
          
          <Text style={instructionText}>
            Skriv inn denne koden på innloggingssiden for å fullføre påloggingen.
          </Text>
          
          <Text style={securityText}>
            Av sikkerhetsmessige årsaker utløper denne koden om <strong>1 time</strong>.
          </Text>
          
          <Text style={warningText}>
            Hvis du ikke forsøkte å logge inn på Nabostylisten, kan du trygt ignorere denne e-posten.
          </Text>
        </div>
        
        <div style={footerSection}>
          <Text style={footer}>
            <Link
              href={siteUrl}
              target="_blank"
              style={footerLink}
            >
              Nabostylisten.no
            </Link>
            <br />
            <span style={footerTagline}>
              Book din neste stylistopplevelse i dag ✨
            </span>
          </Text>
        </div>
      </Container>
    </Body>
  </Html>
);

NabostylistenOtpEmail.PreviewProps = {
  token: "123456",
  siteUrl: "https://nabostylisten.no",
  email: "ola.nordmann@example.com",
} as NabostylistenOtpEmailProps;

export default NabostylistenOtpEmail;

// Branded colors based on globals.css light theme
const colors = {
  background: "#fcf9fc", // --background: 253.3333 100% 98.2353%
  foreground: "#4a3350", // --foreground: 254.0625 37.2093% 33.7255%
  primary: "#8b7eb8", // --primary: 260 28.9157% 67.451%
  primaryForeground: "#ffffff",
  secondary: "#fae7d8", // --secondary: 16.1538 86.6667% 94.1176%
  secondaryForeground: "#a3522f", // --secondary-foreground: 18.5185 65.8537% 48.2353%
  accent: "#e8f5e8", // --accent: 106.9565 74.1935% 93.9216%
  accentForeground: "#3d5a3e", // --accent-foreground: 106.8 28.7356% 34.1176%
  muted: "#f5f2f7", // --muted: 253.3333 24.3243% 92.7451%
  mutedForeground: "#6b5b73", // --muted-foreground: 255.3488 18.2979% 46.0784%
  border: "#f5f2f7", // --border: 253.3333 24.3243% 92.7451%
};

const fontFamily = "Inter, ui-sans-serif, sans-serif, system-ui";

const main = {
  backgroundColor: colors.background,
  fontFamily,
  padding: "20px 0",
};

const container = {
  paddingLeft: "20px",
  paddingRight: "20px",
  margin: "0 auto",
  maxWidth: "580px",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  border: `1px solid ${colors.border}`,
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

const headerSection = {
  textAlign: "center" as const,
  padding: "40px 20px 20px",
  borderBottom: `1px solid ${colors.border}`,
};

const contentSection = {
  padding: "32px 20px",
};

const footerSection = {
  padding: "20px",
  textAlign: "center" as const,
  borderTop: `1px solid ${colors.border}`,
  backgroundColor: colors.muted,
  borderRadius: "0 0 16px 16px",
};

const h1 = {
  color: colors.primary,
  fontFamily,
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
  textAlign: "center" as const,
};

const h2 = {
  color: colors.foreground,
  fontFamily,
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 20px 0",
  textAlign: "center" as const,
};

const subtitle = {
  color: colors.mutedForeground,
  fontFamily,
  fontSize: "16px",
  margin: "0",
  textAlign: "center" as const,
};

const text = {
  color: colors.foreground,
  fontFamily,
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const instructionText = {
  ...text,
  textAlign: "center" as const,
  fontSize: "14px",
  marginTop: "20px",
};

const securityText = {
  ...text,
  color: colors.mutedForeground,
  fontSize: "14px",
  textAlign: "center" as const,
  marginTop: "24px",
};

const warningText = {
  ...text,
  color: colors.mutedForeground,
  fontSize: "13px",
  textAlign: "center" as const,
  fontStyle: "italic",
  marginTop: "32px",
};

const codeContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const code = {
  display: "inline-block",
  padding: "20px 32px",
  backgroundColor: colors.accent,
  borderRadius: "16px",
  border: `2px solid ${colors.primary}`,
  color: colors.primary,
  fontFamily: "Roboto Mono, monospace",
  fontSize: "28px",
  fontWeight: "bold",
  letterSpacing: "8px",
  textAlign: "center" as const,
  minWidth: "180px",
};

const footer = {
  color: colors.mutedForeground,
  fontFamily,
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const footerLink = {
  color: colors.primary,
  fontFamily,
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
};

const footerTagline = {
  color: colors.mutedForeground,
  fontSize: "12px",
  fontStyle: "italic",
};
