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

interface BookingCompletionEmailProps {
  logoUrl: string;
  customerName: string;
  stylistName: string;
  bookingId: string;
  stylistId: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  status: "completed";
  location: string;
  recipientType: "customer" | "stylist";
  isTrialSession?: boolean;
}

export const BookingCompletionEmail = ({
  logoUrl,
  customerName = "Ola Nordmann",
  stylistName = "Anna Stylist",
  bookingId = "12345",
  stylistId = "67890",
  serviceName = "Hårklipp og styling",
  bookingDate = "15. januar 2024",
  bookingTime = "14:00 - 15:30",
  status = "completed",
  location = "Hjemme hos deg",
  recipientType = "customer",
  isTrialSession = false,
}: BookingCompletionEmailProps) => {
  const bookingType = isTrialSession ? "prøvetime" : "booking";
  const previewText = `${isTrialSession ? "Prøvetime" : "Booking"} fullført: ${serviceName}`;

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

          {/* Success Header */}
          <Section style={successSection}>
            <Heading style={heading}>
              {isTrialSession ? "Prøvetime" : "Booking"} fullført!
            </Heading>
            <Text style={successText}>
              {recipientType === "customer"
                ? `Hei ${customerName}! Din ${bookingType} med ${stylistName} er nå fullført.`
                : `Hei ${stylistName}! ${isTrialSession ? "Prøvetimen" : "Bookingen"} med ${customerName} er nå fullført.`}
            </Text>
          </Section>

          {/* Message Section */}
          <Section style={messageSection}>
            <Text style={messageText}>
              {recipientType === "customer"
                ? `Din ${bookingType} med ${stylistName} er fullført! Vi håper du er fornøyd med resultatet. Del gjerne din opplevelse ved å gi en anmeldelse.`
                : `Du har fullført ${isTrialSession ? "prøvetimen" : "bookingen"} med ${customerName}. Takk for at du leverte en fantastisk opplevelse!`}
            </Text>
          </Section>

          {/* Booking Details */}
          <Section style={detailsSection}>
            <Text style={detailsHeader}>
              {isTrialSession ? "Prøvetimedetaljer" : "Bookingdetaljer"}
            </Text>

            <div style={detailItem}>
              <div style={detailContent}>
                <Text style={detailLabel}>Tjeneste</Text>
                <Text style={detailValue}>{serviceName}</Text>
              </div>
            </div>

            <div style={detailItem}>
              <div style={detailContent}>
                <Text style={detailLabel}>Dato</Text>
                <Text style={detailValue}>{bookingDate}</Text>
              </div>
            </div>

            <div style={detailItem}>
              <div style={detailContent}>
                <Text style={detailLabel}>Tid</Text>
                <Text style={detailValue}>{bookingTime}</Text>
              </div>
            </div>

            {location && (
              <div style={detailItem}>
                <div style={detailContent}>
                  <Text style={detailLabel}>Sted</Text>
                  <Text style={detailValue}>{location}</Text>
                </div>
              </div>
            )}
          </Section>

          {/* Customer Call-to-Action */}
          {recipientType === "customer" && (
            <>
              <Section style={customerCtaSection}>
                <Text style={ctaHeader}>Del din opplevelse!</Text>
                <Text style={ctaText}>
                  Hjelp andre kunder ved å dele din opplevelse med {stylistName}
                  . Din anmeldelse betyr mye!
                </Text>

                <Button
                  href={`${baseUrl}/bookinger/${bookingId}`}
                  style={reviewButton}
                >
                  Gi anmeldelse
                </Button>
              </Section>

              <Text style={alternativeText}>
                Du kan også se bookingdetaljer og gi anmeldelse senere ved å gå
                til{" "}
                <Link
                  href={`${baseUrl}/bookinger/${bookingId}`}
                  style={inlineLink}
                >
                  Mine bookinger
                </Link>
              </Text>
            </>
          )}

          {/* Stylist Thank You */}
          {recipientType === "stylist" && (
            <Section style={stylistThanksSection}>
              <Text style={thanksHeader}>Takk for fantastisk service!</Text>
              <Text style={thanksText}>
                Du har levert en vellykket tjeneste. Kunden vil få mulighet til
                å gi deg en anmeldelse.
              </Text>
              <Text style={dashboardLinkText}>
                Se alle dine bookinger og anmeldelser i{" "}
                <Link href={`${baseUrl}/stylist/dashboard`} style={inlineLink}>
                  stylist-dashboardet
                </Link>
              </Text>
            </Section>
          )}

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Mvh,
              <br />
              Nabostylisten-teamet
            </Text>

            <Text style={footerLinkContainer}>
              <Link href={baseUrl} style={footerLink}>
                nabostylisten.no
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Base styles using shared design system
const main = baseStyles.main;
const container = baseStyles.container;
const logoContainer = baseStyles.logoContainer;
const logo = baseStyles.logo;
const divider = baseStyles.hr;
const footer = baseStyles.footer;

// Success Header Section
const successSection = {
  textAlign: "center" as const,
  margin: "32px 0",
  padding: "24px",
  backgroundColor: colors.secondary,
  borderRadius: "12px",
  border: `2px solid ${colors.secondaryForeground}`,
};

const heading = {
  ...baseStyles.heading,
  color: colors.secondaryForeground,
  fontSize: "28px",
  fontWeight: "700",
  margin: "0 0 16px 0",
};

const successText = {
  ...baseStyles.paragraph,
  color: colors.secondaryForeground,
  fontSize: "16px",
  fontWeight: "500",
  margin: "0",
  lineHeight: "1.6",
};

// Status Badge Section
const statusBadgeSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const statusBadge = {
  display: "inline-flex",
  alignItems: "center",
  backgroundColor: statusColors.completed,
  color: colors.white,
  padding: "12px 20px",
  borderRadius: "25px",
  fontWeight: "600",
};

const statusText = {
  fontSize: "16px",
  fontWeight: "600",
  color: colors.white,
  margin: "0",
};

// Message Section
const messageSection = {
  ...sectionStyles.infoSection,
  backgroundColor: colors.accent,
  border: `1px solid ${colors.accentForeground}`,
  borderRadius: "10px",
  padding: "20px",
  margin: "24px 0",
};

const messageText = {
  ...textStyles.sectionContent,
  color: colors.accentForeground,
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "center" as const,
};

// Details Section
const detailsSection = {
  backgroundColor: colors.muted,
  borderRadius: "10px",
  padding: "24px",
  margin: "24px 0",
};

const detailsHeader = {
  ...textStyles.sectionHeader,
  color: colors.foreground,
  fontSize: "18px",
  fontWeight: "600",
  marginBottom: "20px",
  textAlign: "center" as const,
};

const detailItem = {
  marginBottom: "16px",
  padding: "12px",
  backgroundColor: colors.white,
  borderRadius: "8px",
  border: `1px solid ${colors.border}`,
};

const detailContent = {
  flex: 1,
};

const detailLabel = {
  fontSize: "12px",
  fontWeight: "600",
  color: colors.mutedForeground,
  margin: "0 0 4px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const detailValue = {
  fontSize: "14px",
  fontWeight: "600",
  color: colors.foreground,
  margin: "0",
  lineHeight: "1.4",
};

// Customer CTA Section
const customerCtaSection = {
  textAlign: "center" as const,
  margin: "32px 0",
  padding: "32px 24px",
  backgroundColor: colors.primary,
  borderRadius: "12px",
  border: `2px solid ${colors.primaryForeground}`,
};

const ctaHeader = {
  fontSize: "20px",
  fontWeight: "700",
  color: colors.primaryForeground,
  margin: "0 0 12px 0",
};

const ctaText = {
  fontSize: "14px",
  color: colors.primaryForeground,
  margin: "0 0 24px 0",
  lineHeight: "1.6",
  opacity: 0.9,
};

const reviewButton = {
  ...buttonStyles.primary,
  backgroundColor: colors.primaryForeground,
  color: colors.primary,
  borderColor: colors.primaryForeground,
  fontSize: "16px",
  fontWeight: "700",
  padding: "14px 28px",
  borderRadius: "8px",
};

// Stylist Thanks Section
const stylistThanksSection = {
  textAlign: "center" as const,
  margin: "32px 0",
  padding: "28px 24px",
  backgroundColor: colors.accent,
  borderRadius: "12px",
  border: `2px solid ${colors.accentForeground}`,
};

const thanksHeader = {
  fontSize: "20px",
  fontWeight: "700",
  color: colors.accentForeground,
  margin: "0 0 12px 0",
};

const thanksText = {
  fontSize: "14px",
  color: colors.accentForeground,
  margin: "0 0 16px 0",
  lineHeight: "1.6",
};

const dashboardLinkText = {
  fontSize: "14px",
  color: colors.accentForeground,
  margin: "0",
  lineHeight: "1.6",
};

// Common elements
const alternativeText = {
  ...baseStyles.paragraph,
  textAlign: "center" as const,
  fontSize: "14px",
  color: colors.mutedForeground,
  margin: "24px 0",
  lineHeight: "1.5",
};

const inlineLink = {
  color: colors.primary,
  textDecoration: "underline",
  fontWeight: "600",
};

const footerText = {
  ...baseStyles.paragraph,
  textAlign: "center" as const,
  color: colors.mutedForeground,
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 12px 0",
};

const footerLinkContainer = {
  textAlign: "center" as const,
  margin: "0",
};

const footerLink = {
  ...baseStyles.link,
  fontSize: "16px",
  fontWeight: "600",
  color: colors.primary,
  textDecoration: "none",
};

BookingCompletionEmail.PreviewProps = {
  logoUrl: `${baseUrl}/logo-email.png`,
  customerName: "Ola Nordmann",
  stylistName: "Anna Stylist",
  bookingId: "booking_12345",
  stylistId: "stylist_67890",
  serviceName: "Hårklipp og styling",
  bookingDate: "15. januar 2024",
  bookingTime: "14:00 - 15:30",
  status: "completed" as const,
  location: "Hjemme hos deg",
  recipientType: "customer" as const,
  isTrialSession: false,
} as BookingCompletionEmailProps;

export default BookingCompletionEmail;
