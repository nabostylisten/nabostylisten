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
import { baseStyles, colors, fontFamily } from "../utils/styles";

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
          <Heading style={h1}>Nabostylisten</Heading>
          <Text style={subtitle}>Din plattform for stylisttjenester</Text>
        </div>

        <div style={contentSection}>
          <Heading style={h2}>Din innloggingskode</Heading>
          <Text style={text}>Hei{email ? ` ${email}` : ""}!</Text>
          <Text style={text}>Her er din 6-sifrede innloggingskode:</Text>

          <div style={codeContainer}>
            <code style={code}>{token}</code>
          </div>

          <Text style={instructionText}>
            Skriv inn denne koden på innloggingssiden for å fullføre
            påloggingen.
          </Text>

          <Text style={securityText}>
            Av sikkerhetsmessige årsaker utløper denne koden om{" "}
            <strong>1 time</strong>.
          </Text>

          <Text style={warningText}>
            Hvis du ikke forsøkte å logge inn på Nabostylisten, kan du trygt
            ignorere denne e-posten.
          </Text>
        </div>

        <div style={footerSection}>
          <Text style={footer}>
            <Link href={siteUrl} target="_blank" style={footerLink}>
              nabostylisten.no
            </Link>
            <br />
            <span style={footerTagline}>
              Book din neste stylistopplevelse i dag
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

const main = {
  ...baseStyles.main,
  padding: "20px 0",
};

const container = {
  ...baseStyles.container,
  paddingLeft: "20px",
  paddingRight: "20px",
  maxWidth: "580px",
  borderRadius: "16px",
  border: `1px solid ${colors.border}`,
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
  ...baseStyles.paragraph,
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
  ...baseStyles.footer,
  fontSize: "14px",
  lineHeight: "20px",
};

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
