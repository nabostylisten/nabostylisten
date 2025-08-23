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

interface PaymentNotificationEmailProps {
  recipientProfileId: string;
  recipientName: string;
  recipientRole: "customer" | "stylist";
  notificationType:
    | "payment_received"
    | "payout_processed"
    | "payment_failed"
    | "payout_pending";
  bookingId: string;
  serviceName: string;
  serviceDate: string;
  // Payment details
  totalAmount: number;
  currency: string;
  platformFee?: number;
  stylistPayout?: number;
  paymentMethod?: string;
  transactionId: string;
  // Payout details
  payoutDate?: string;
  payoutMethod?: string;
  nextPayoutDate?: string;
  // Error details
  failureReason?: string;
}

export const PaymentNotificationEmail = ({
  recipientProfileId = "12345",
  recipientName = "Anna Stylist",
  recipientRole = "stylist",
  notificationType = "payout_processed",
  bookingId = "12345",
  serviceName = "Hårklipp og styling",
  serviceDate = "15. januar 2024",
  totalAmount = 650,
  currency = "NOK",
  platformFee = 97.5,
  stylistPayout = 552.5,
  paymentMethod = "Bankkort",
  transactionId = "pi_1234567890",
  payoutDate = "17. januar 2024",
  payoutMethod = "Bankkonto",
  nextPayoutDate = "22. januar 2024",
  failureReason,
}: PaymentNotificationEmailProps) => {
  const getNotificationConfig = () => {
    switch (notificationType) {
      case "payment_received":
        return {
          title: "Betaling mottatt",
          description:
            recipientRole === "customer"
              ? "Din betaling er bekreftet"
              : "Du har mottatt en betaling",
          color: { bg: "#4a7c4a", text: "#ffffff" }, // success green
        };
      case "payout_processed":
        return {
          title: "Utbetaling behandlet",
          description: "Din utbetaling er sendt til bankkontoen din",
          color: { bg: "#4a7c4a", text: "#ffffff" }, // success green
        };
      case "payout_pending":
        return {
          title: "Utbetaling venter",
          description: "Din utbetaling er under behandling",
          color: { bg: "#fee7dc", text: "#c2724a" }, // warning orange
        };
      case "payment_failed":
        return {
          title: "Betaling feilet",
          description:
            recipientRole === "customer"
              ? "Din betaling kunne ikke gjennomføres"
              : "En betaling til deg feilet",
          color: { bg: "#ff3333", text: "#ffffff" }, // error red
        };
      default:
        return {
          title: "Betalingsvarsel",
          description: "Oppdatering om betaling",
          color: { bg: "#9b8cc8", text: "#ffffff" }, // primary purple
        };
    }
  };

  const config = getNotificationConfig();
  const previewText = `${config.title}: ${serviceName} - ${totalAmount} ${currency}`;

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

          <Heading style={heading}>{config.description}</Heading>

          <Text style={paragraph}>
            Hei {recipientName}! {config.description} for tjenesten "
            {serviceName}".
          </Text>

          {/* Service Context */}
          <Section style={serviceContextSection}>
            <Text style={contextHeader}>Tjenesteinformasjon:</Text>
            <div style={contextRow}>
              <Text style={contextLabel}>Tjeneste:</Text>
              <Text style={contextValue}>{serviceName}</Text>
            </div>
            <div style={contextRow}>
              <Text style={contextLabel}>Dato:</Text>
              <Text style={contextValue}>{serviceDate}</Text>
            </div>
            <div style={contextRow}>
              <Text style={contextLabel}>Booking ID:</Text>
              <Text style={contextValue}>{bookingId}</Text>
            </div>
          </Section>

          {/* Payment Breakdown for Customers */}
          {recipientRole === "customer" && (
            <Section style={paymentSection}>
              <Text style={sectionHeader}>Betalingsdetaljer:</Text>

              <div style={amountRow}>
                <Text style={amountLabel}>Tjeneste:</Text>
                <Text style={amountValue}>
                  {totalAmount} {currency}
                </Text>
              </div>

              <div style={totalRow}>
                <Text style={totalLabel}>Total betalt:</Text>
                <Text style={totalValue}>
                  {totalAmount} {currency}
                </Text>
              </div>

              <div style={paymentMethodRow}>
                <Text style={paymentMethodLabel}>Betalingsmetode:</Text>
                <Text style={paymentMethodValue}>{paymentMethod}</Text>
              </div>
            </Section>
          )}

          {/* Payout Breakdown for Stylists */}
          {recipientRole === "stylist" &&
            (notificationType === "payout_processed" ||
              notificationType === "payout_pending") && (
              <Section style={payoutSection}>
                <Text style={sectionHeader}>Utbetalingsdetaljer:</Text>

                <div style={breakdownRow}>
                  <Text style={breakdownLabel}>Tjenestepris:</Text>
                  <Text style={breakdownValue}>
                    {totalAmount} {currency}
                  </Text>
                </div>

                <div style={breakdownRow}>
                  <Text style={breakdownLabel}>Plattformavgift (20%):</Text>
                  <Text style={breakdownValue}>
                    -{platformFee} {currency}
                  </Text>
                </div>

                <div style={payoutTotalRow}>
                  <Text style={payoutTotalLabel}>Din utbetaling:</Text>
                  <Text style={payoutTotalValue}>
                    {stylistPayout} {currency}
                  </Text>
                </div>

                {payoutDate && (
                  <div style={payoutDateRow}>
                    <Text style={payoutDateLabel}>Utbetalt til:</Text>
                    <Text style={payoutDateValue}>
                      {payoutMethod} • {payoutDate}
                    </Text>
                  </div>
                )}
              </Section>
            )}

          {/* Failure Details */}
          {notificationType === "payment_failed" && failureReason && (
            <Section style={failureSection}>
              <Text style={failureHeader}>Årsak til feil:</Text>
              <Text>{failureReason}</Text>
              <Text style={failureAction}>
                {recipientRole === "customer"
                  ? "Vennligst oppdater betalingsinformasjonen din og prøv igjen."
                  : "Vi jobber med å løse problemet. Du vil motta ny utbetaling snart."}
              </Text>
            </Section>
          )}

          {/* Next Steps */}
          <Section style={nextStepsSection}>
            <Text style={nextStepsHeader}>Neste steg:</Text>
            {recipientRole === "customer" &&
              notificationType === "payment_received" && (
                <Text style={nextStepsText}>
                  • Din booking er nå bekreftet
                  <br />
                  • Du vil motta påminnelse 24 timer før timen
                  <br />
                  • Du kan chatte med stylisten om spesielle ønsker
                  <br />• Avlysning må skje minst 24 timer i forveien
                </Text>
              )}
            {recipientRole === "stylist" &&
              notificationType === "payout_processed" && (
                <Text style={nextStepsText}>
                  • Pengene vil være tilgjengelig i bankkontoen din innen 1-3
                  virkedager
                  <br />
                  • Se fullstendig utbetalingshistorikk i dashboardet
                  <br />• Kontakt support hvis pengene ikke kommer frem
                </Text>
              )}
            {notificationType === "payment_failed" && (
              <Text style={nextStepsText}>
                •{" "}
                {recipientRole === "customer"
                  ? "Oppdater betalingsinformasjon"
                  : "Vi forsøker automatisk på nytt"}
                <br />
                • Kontakt support hvis problemet vedvarer
                <br />• Se betalingshistorikk for flere detaljer
              </Text>
            )}
          </Section>

          {/* Call to Action */}
          <Section style={ctaSection}>
            {recipientRole === "customer" && (
              <Button
                style={button}
                href={`${baseUrl}/profiler/${recipientProfileId}/mine-bookinger/${bookingId}`}
              >
                Se booking
              </Button>
            )}
            {recipientRole === "stylist" && (
              <Button
                style={button}
                href={`${baseUrl}/profiler/${recipientProfileId}/inntekter`}
              >
                Se utbetalingshistorikk
              </Button>
            )}
          </Section>

          {/* Tax Information for Stylists */}
          {recipientRole === "stylist" &&
            notificationType === "payout_processed" && (
              <Section style={taxSection}>
                <Text style={taxHeader}>📊 Skatteinformasjon:</Text>
                <Text style={taxText}>
                  Husk at utbetalinger fra Nabostylisten må rapporteres som
                  inntekt. Du vil motta skattedokumenter i slutten av året. Hold
                  oversikt over alle utbetalinger for din egen regnskapsføring.
                </Text>
              </Section>
            )}

          {/* Transaction Details */}
          <Section style={transactionSection}>
            <Text style={transactionHeader}>🔍 Transaksjonsdetaljer:</Text>
            <div style={transactionRow}>
              <Text style={transactionLabel}>Transaksjons-ID:</Text>
              <Text style={transactionValue}>{transactionId}</Text>
            </div>
            <div style={transactionRow}>
              <Text style={transactionLabel}>Dato:</Text>
              <Text style={transactionValue}>
                {new Date().toLocaleDateString("nb-NO")}
              </Text>
            </div>
            <div style={transactionRow}>
              <Text style={transactionLabel}>Status:</Text>
              <Text style={transactionValue}>
                {notificationType === "payment_received" && "Bekreftet"}
                {notificationType === "payout_processed" && "Behandlet"}
                {notificationType === "payout_pending" && "Venter"}
                {notificationType === "payment_failed" && "Feilet"}
              </Text>
            </div>
          </Section>

          {/* Notification Settings */}
          <Section style={settingsSection}>
            <Text style={settingsText}>
              📧 Du mottar denne e-posten fordi du har aktivert varsler for
              betalinger.
            </Text>
            <Link
              href={`${baseUrl}/profiler/${recipientName}/preferanser`}
              style={settingsLink}
            >
              Endre varselinnstillinger
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Har du spørsmål om betalinger? Kontakt oss på{" "}
            <Link href="mailto:support@nabostylisten.no" style={link}>
              support@nabostylisten.no
            </Link>
          </Text>

          <Text style={footer}>Transaksjons-ID: {transactionId}</Text>
        </Container>
      </Body>
    </Html>
  );
};

PaymentNotificationEmail.PreviewProps = {
  recipientProfileId: "12345",
  serviceDate: "15. januar 2024",
  totalAmount: 1000,
  platformFee: 200,
  stylistPayout: 800,
  recipientName: "Anna Stylist",
  recipientRole: "stylist" as const,
  notificationType: "payout_processed" as const,
  bookingId: "booking_12345",
  serviceName: "Hårklipp og styling",
  customerName: "Ola Nordmann",
  bookingDate: "15. januar 2024",
  amount: 520,
  currency: "NOK",
  transactionId: "trans_67890",
  paymentMethod: "Bank transfer",
} as PaymentNotificationEmailProps;

export default PaymentNotificationEmail;

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

const notificationBanner = {
  borderRadius: "8px",
  padding: "12px 20px",
  textAlign: "center" as const,
  marginBottom: "24px",
  border: "2px solid",
};

const notificationText = {
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

const serviceContextSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "10px",
  border: "1px solid rgba(155, 140, 200, 0.3)",
};

const contextHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 16px",
};

const contextRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "8px",
};

const contextLabel = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#6b6682", // --muted-foreground
  margin: "0",
};

const contextValue = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0",
};

const paymentSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#e8f5e8", // --accent
  borderRadius: "12px",
  border: "2px solid #4a7c4a", // --accent-foreground
};

const payoutSection = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#e8f5e8", // --accent
  borderRadius: "12px",
  border: "2px solid #4a7c4a", // --accent-foreground
};

const sectionHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#4a7c4a", // --accent-foreground
  margin: "0 0 20px",
};

const amountRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
  paddingBottom: "8px",
};

const amountLabel = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
};

const amountValue = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
};

const totalRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: "12px",
  borderTop: "2px solid #4a7c4a", // --accent-foreground
  marginTop: "12px",
};

const totalLabel = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
};

const totalValue = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
};

const paymentMethodRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "16px",
  paddingTop: "12px",
  borderTop: "1px solid rgba(74, 124, 74, 0.3)",
};

const paymentMethodLabel = {
  fontSize: "12px",
  fontWeight: "500",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
  opacity: 0.8,
};

const paymentMethodValue = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
  opacity: 0.8,
};

const breakdownRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "8px",
};

const breakdownLabel = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
};

const breakdownValue = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
};

const payoutTotalRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: "16px",
  borderTop: "2px solid #4a7c4a", // --accent-foreground
  marginTop: "16px",
};

const payoutTotalLabel = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
};

const payoutTotalValue = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
};

const payoutDateRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "12px",
  paddingTop: "8px",
  borderTop: "1px solid rgba(74, 124, 74, 0.3)",
};

const payoutDateLabel = {
  fontSize: "12px",
  fontWeight: "500",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
  opacity: 0.8,
};

const payoutDateValue = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#4a7c4a", // --accent-foreground
  margin: "0",
  opacity: 0.8,
};

const failureSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#ffe6e6",
  border: "2px solid #ff3333", // --destructive
  borderRadius: "12px",
};

const failureHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#cc0000",
  margin: "0 0 12px",
};

const failureReason = {
  fontSize: "14px",
  color: "#cc0000",
  margin: "0 0 12px",
  fontWeight: "500",
};

const failureAction = {
  fontSize: "13px",
  color: "#cc0000",
  margin: "0",
  lineHeight: "1.5",
};

const nextStepsSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: "#fee7dc", // --secondary
  borderRadius: "8px",
  borderLeft: "4px solid #c2724a", // --secondary-foreground
};

const nextStepsHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#c2724a", // --secondary-foreground
  margin: "0 0 12px",
};

const nextStepsText = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#c2724a", // --secondary-foreground
  margin: "0",
};

const ctaSection = {
  margin: "32px 0",
  textAlign: "center" as const,
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

const taxSection = {
  margin: "32px 0",
  padding: "16px 20px",
  backgroundColor: "rgba(155, 140, 200, 0.1)",
  borderRadius: "8px",
  border: "1px solid rgba(155, 140, 200, 0.3)",
};

const taxHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 8px",
};

const taxText = {
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#6b6682", // --muted-foreground
  margin: "0",
};

const transactionSection = {
  margin: "32px 0",
  padding: "16px",
  backgroundColor: "#edeaf7", // --muted
  borderRadius: "8px",
};

const transactionHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0 0 12px",
};

const transactionRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "6px",
};

const transactionLabel = {
  fontSize: "12px",
  fontWeight: "500",
  color: "#6b6682", // --muted-foreground
  margin: "0",
};

const transactionValue = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#453a6b", // --foreground
  margin: "0",
  fontFamily: "monospace",
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
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0 0 8px",
  textAlign: "center" as const,
};

const link = {
  color: "#9b8cc8", // --primary
  textDecoration: "none",
  fontWeight: "500",
};
