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
  Button,
  Hr,
} from "@react-email/components";
import {
  baseStyles,
  sectionStyles,
  buttonStyles,
  colors,
} from "./utils/styles";

interface AffiliateMonthlyPayoutProps {
  logoUrl: string;
  stylistName: string;
  payoutAmount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  totalBookings: number;
  totalCommissions: number;
  dashboardUrl: string;
  payoutDate: string;
}

export const AffiliateMonthlyPayout = ({
  logoUrl,
  stylistName = "Anna",
  payoutAmount = 2450.5,
  currency = "NOK",
  periodStart = "2024-03-01",
  periodEnd = "2024-03-31",
  totalBookings = 12,
  totalCommissions = 2450.5,
  dashboardUrl = "https://nabostylisten.no/profiler/123/partner/utbetalinger",
  payoutDate = "2024-04-05",
}: AffiliateMonthlyPayoutProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("no-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("no-NO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const previewText = `Din månedlige partnerutbetaling er på vei! 💰`;

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

          <Heading style={heading}>Din partnerutbetaling er på vei!</Heading>

          <Text style={paragraph}>Kjære {stylistName},</Text>

          <Text style={paragraph}>
            Vi er glade for å informere deg om din månedlige partnerutbetaling
            for perioden {formatDate(periodStart)} - {formatDate(periodEnd)}.
          </Text>

          <Section style={summarySection}>
            <Heading style={subHeading}>Utbetalingssammendrag</Heading>

            <div style={summaryGrid}>
              <div style={summaryItem}>
                <Text style={summaryLabel}>Periode</Text>
                <Text style={summaryValue}>
                  {formatDate(periodStart)} - {formatDate(periodEnd)}
                </Text>
              </div>

              <div style={summaryItem}>
                <Text style={summaryLabel}>Antall bookinger</Text>
                <Text style={summaryValue}>{totalBookings} stk</Text>
              </div>

              <div style={summaryItem}>
                <Text style={summaryLabel}>Total provisjon opptjent</Text>
                <Text style={summaryValue}>
                  {formatAmount(totalCommissions)} {currency}
                </Text>
              </div>

              <div style={summaryItem}>
                <Text style={summaryLabel}>Utbetalingsdato</Text>
                <Text style={summaryValue}>{formatDate(payoutDate)}</Text>
              </div>
            </div>

            <Hr style={hr} />

            <div style={totalSection}>
              <Text style={totalLabel}>Utbetalingsbeløp</Text>
              <Text style={totalAmount}>
                {formatAmount(payoutAmount)} {currency}
              </Text>
            </div>
          </Section>

          <Section style={infoSection}>
            <Heading style={subHeading}>Viktig informasjon</Heading>

            <Text style={infoItem}>
              <strong>Rapport:</strong> Detaljert provisjonsrapport finner du i
              ditt partner-dashboard
            </Text>

            <Text style={infoItem}>
              <strong>Kvittering:</strong> Du vil motta en separat e-post når
              utbetalingen er gjennomført
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button style={button} href={dashboardUrl}>
              Se detaljert rapport
            </Button>
          </Section>

          <Section style={performanceSection}>
            <Heading style={subHeading}>Din prestasjon denne måneden</Heading>

            <Text style={paragraph}>
              Flotte resultater denne måneden! Du har henvist {totalBookings}{" "}
              bookinger og tjent {formatAmount(totalCommissions)} {currency} i
              provisjon.
            </Text>

            <Text style={paragraph}>
              Fortsett det gode arbeidet med å dele din partnerkode og hjelpe
              kunder med å finne de beste stylisttjenestene. Jo mer du deler, jo
              mer tjener du!
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={paragraph}>
            Hvis du har spørsmål om utbetalingen eller partnerprogrammet,
            kontakt oss gjerne på{" "}
            <Link href="mailto:partner@nabostylisten.no" style={link}>
              partner@nabostylisten.no
            </Link>
          </Text>

          <Text style={footer}>
            Takk for ditt samarbeid!
            <br />
            Nabostylisten Partner Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

AffiliateMonthlyPayout.PreviewProps = {
  logoUrl: "https://example.com/logo.png",
  stylistName: "Anna Nordmann",
  payoutAmount: 2450.5,
  currency: "NOK",
  periodStart: "2024-03-01",
  periodEnd: "2024-03-31",
  totalBookings: 12,
  totalCommissions: 2450.5,
  dashboardUrl: "https://nabostylisten.no/profiler/123/partner/utbetalinger",
  payoutDate: "2024-04-05",
} as AffiliateMonthlyPayoutProps;

export default AffiliateMonthlyPayout;

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

// Specific styles for payout email
const summarySection = {
  ...sectionStyles.infoSection,
  backgroundColor: colors.muted,
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
  marginBottom: "20px",
};

const summaryItem = {
  padding: "12px 16px",
  backgroundColor: colors.white,
  borderRadius: "8px",
  border: `1px solid ${colors.border}`,
};

const summaryLabel = {
  color: colors.mutedForeground,
  fontSize: "12px",
  fontWeight: "500",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const summaryValue = {
  color: colors.foreground,
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const totalSection = {
  textAlign: "center" as const,
  padding: "24px",
  backgroundColor: colors.accent,
  borderRadius: "12px",
  border: `2px solid ${colors.accentForeground}`,
};

const totalLabel = {
  color: colors.accentForeground,
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const totalAmount = {
  color: colors.accentForeground,
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0",
};

const infoSection = {
  ...sectionStyles.detailsSection,
  backgroundColor: colors.warning,
  border: `2px solid ${colors.warningBorder}`,
};

const infoItem = {
  color: colors.warningText,
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "12px 0",
};

const ctaSection = sectionStyles.actionSection;
const button = buttonStyles.primary;

const performanceSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: colors.secondary,
  borderRadius: "12px",
  border: `2px solid ${colors.secondaryForeground}`,
};
