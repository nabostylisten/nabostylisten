import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from "@react-email/components";

interface NabostylistenMagicLinkEmailProps {
  confirmationUrl?: string;
  token?: string;
  siteUrl?: string;
  email?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "";

export const NabostylistenMagicLinkEmail = ({
  confirmationUrl = "{{ .ConfirmationURL }}",
  token = "{{ .Token }}",
  siteUrl = "{{ .SiteURL }}",
  email = "{{ .Email }}",
}: NabostylistenMagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>Logg inn på Nabostylisten med denne magiske lenken</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Logg inn på Nabostylisten</Heading>
        <Text style={text}>Hei {email ? `${email}` : "der"}!</Text>
        <Text style={text}>
          Klikk på lenken nedenfor for å logge inn på Nabostylisten:
        </Text>
        <Link
          href={confirmationUrl}
          target="_blank"
          style={{
            ...link,
            display: "block",
            marginBottom: "16px",
            padding: "12px 24px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "6px",
            textAlign: "center" as const,
          }}
        >
          Logg inn med magisk lenke
        </Link>
        <Text style={{ ...text, marginBottom: "14px" }}>
          Eller kopier og lim inn denne midlertidige innloggingskoden:
        </Text>
        <code style={code}>{token}</code>
        <Text
          style={{
            ...text,
            color: "#6b7280",
            marginTop: "14px",
            marginBottom: "16px",
          }}
        >
          Hvis du ikke forsøkte å logge inn, kan du trygt ignorere denne
          e-posten.
        </Text>
        <Text
          style={{
            ...text,
            color: "#6b7280",
            marginTop: "12px",
            marginBottom: "32px",
          }}
        >
          Denne lenken utløper om 1 time av sikkerhetsmessige årsaker.
        </Text>
        <Text style={footer}>
          <Link
            href={siteUrl}
            target="_blank"
            style={{ ...link, color: "#6b7280" }}
          >
            Nabostylisten
          </Link>
          <br />
          Din plattform for å finne og bestille stylisttjenester i Norge.
          <br />
        </Text>
      </Container>
    </Body>
  </Html>
);

NabostylistenMagicLinkEmail.PreviewProps = {
  confirmationUrl: "https://nabostylisten.no/auth/callback?token=example-token",
  token: "123456",
  siteUrl: "https://nabostylisten.no",
  email: "ola.nordmann@example.com",
} as NabostylistenMagicLinkEmailProps;

export default NabostylistenMagicLinkEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  paddingLeft: "12px",
  paddingRight: "12px",
  margin: "0 auto",
  maxWidth: "580px",
};

const h1 = {
  color: "#1f2937",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0 20px",
  padding: "0",
};

const link = {
  color: "#2563eb",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  textDecoration: "underline",
};

const text = {
  color: "#374151",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "16px 0",
};

const footer = {
  color: "#6b7280",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "12px",
  lineHeight: "22px",
  marginTop: "32px",
  marginBottom: "24px",
};

const code = {
  display: "inline-block",
  padding: "16px 4.5%",
  width: "90.5%",
  backgroundColor: "#f9fafb",
  borderRadius: "6px",
  border: "1px solid #e5e7eb",
  color: "#1f2937",
  fontFamily: "monospace",
  fontSize: "20px",
  fontWeight: "bold",
  letterSpacing: "4px",
  textAlign: "center" as const,
};
