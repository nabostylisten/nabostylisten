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
  statusColors,
} from "./utils/styles";
import { baseUrl } from "./utils";

interface ApplicationStatusUpdateEmailProps {
  logoUrl: string;
  applicantName: string;
  applicationId: string;
  status: "applied" | "pending_info" | "rejected" | "approved";
  message?: string;
}

export const ApplicationStatusUpdateEmail = ({
  logoUrl,
  applicantName = "Ola Nordmann",
  applicationId = "12345",
  status = "approved",
  message,
}: ApplicationStatusUpdateEmailProps) => {
  const statusLabels = {
    applied: "Ny søknad",
    pending_info: "Venter på mer informasjon",
    approved: "Godkjent",
    rejected: "Avvist",
  };

  const statusDescriptions = {
    applied: "Din søknad er mottatt og vil bli gjennomgått snart.",
    pending_info:
      "Vi trenger mer informasjon fra deg for å fullføre behandlingen av søknaden.",
    approved:
      "Gratulerer! Din søknad er godkjent. Du kan nå opprette tjenester på platformen.",
    rejected: "Vi beklager, men din søknad ble ikke godkjent denne gangen.",
  };

  const previewText = `Søknadsstatus oppdatert: ${statusLabels[status]}`;

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

          <Heading style={heading}>Søknadsstatus oppdatert</Heading>

          <Text style={paragraph}>
            Hei {applicantName}! Din søknad om å bli stylist på Nabostylisten
            har fått en statusoppdatering.
          </Text>

          <Section style={statusSection}>
            <Text style={statusLabel}>Status:</Text>
            <Text style={statusValue}>{statusLabels[status]}</Text>
          </Section>

          <Text style={paragraph}>{statusDescriptions[status]}</Text>

          {message && (
            <Section style={messageSection}>
              <Text style={messageLabel}>Melding fra oss:</Text>
              <Text style={messageText}>{message}</Text>
            </Section>
          )}

          {status === "approved" && (
            <Section style={ctaSection}>
              <Text style={paragraph}>
                Du kan nå logge inn på din konto og begynne å opprette tjenester
                som stylist på platformen.
              </Text>
              <Button style={button} href={baseUrl}>
                Gå til min profil
              </Button>
            </Section>
          )}

          {/* TODO: This is not correct behavior if we have pending info. Pending info is just the admin sending a regular email to the stylist asking for more documentation. */}
          {/* {status === "pending_info" && (
            <Section style={ctaSection}>
              <Text style={paragraph}>
                Vennligst logg inn på din konto for å se hvilken informasjon vi
                trenger fra deg.
              </Text>
              <Button style={button} href={`${baseUrl}/protected`}>
                Se søknadsdetaljer
              </Button>
            </Section>
          )} */}

          <Hr style={hr} />

          <Text style={footer}>
            Hvis du har spørsmål, kan du kontakte oss på{" "}
            <Link href="mailto:support@nabostylisten.no" style={link}>
              support@nabostylisten.no
            </Link>
          </Text>

          <Text style={footer}>Søknad ID: {applicationId}</Text>
        </Container>
      </Body>
    </Html>
  );
};

ApplicationStatusUpdateEmail.PreviewProps = {
  logoUrl: "https://example.com/logo.png",
  applicantName: "Ola Nordmann",
  applicationId: "app_12345",
  status: "approved" as const,
  message: "Gratulerer! Vi ser frem til å ha deg på plattformen.",
} as ApplicationStatusUpdateEmailProps;

export default ApplicationStatusUpdateEmail;

// Using shared Nabostylisten branded styles
const main = baseStyles.main;
const container = baseStyles.container;
const logoContainer = baseStyles.logoContainer;
const logo = baseStyles.logo;
const heading = baseStyles.heading;
const paragraph = baseStyles.paragraph;
const messageSection = sectionStyles.messageSection;
const messageLabel = textStyles.messageHeader;
const messageText = textStyles.messageContent;
const ctaSection = sectionStyles.actionSection;
const button = buttonStyles.primary;
const hr = baseStyles.hr;
const footer = baseStyles.footer;
const link = baseStyles.link;

const statusSection = {
  ...sectionStyles.infoSection,
  textAlign: "center" as const,
};

const statusLabel = {
  fontSize: "14px",
  fontWeight: "500",
  color: colors.mutedForeground,
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const statusValue = {
  fontSize: "20px",
  fontWeight: "600",
  color: colors.primary,
  margin: "0",
};
