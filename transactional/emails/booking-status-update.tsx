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
  statusColors,
} from "./utils/styles";
import { baseUrl } from "./utils";

interface BookingStatusUpdateEmailProps {
  logoUrl: string;
  customerName: string;
  stylistName: string;
  bookingId: string;
  stylistId: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  status: "confirmed" | "cancelled";
  message?: string;
  location: string;
  recipientType: "customer" | "stylist";
  cancelledBy?: "customer" | "stylist";
  refundInfo?: {
    refundAmount: number;
    stylistCompensation?: number;
    refundPercentage: number;
  };
  isTrialSession?: boolean;
}

export const BookingStatusUpdateEmail = ({
  logoUrl,
  customerName = "Ola Nordmann",
  stylistName = "Anna Stylist",
  bookingId = "12345",
  stylistId = "67890",
  serviceName = "Hårklipp og styling",
  bookingDate = "15. januar 2024",
  bookingTime = "14:00 - 15:30",
  status = "confirmed",
  message,
  location = "Hjemme hos deg",
  recipientType = "customer",
  cancelledBy,
  refundInfo,
  isTrialSession = false,
}: BookingStatusUpdateEmailProps) => {
  const statusLabels = {
    confirmed: "Bekreftet",
    cancelled: "Avlyst",
  };

  const bookingType = isTrialSession ? "prøvetime" : "booking";
  
  const statusDescriptions = {
    confirmed:
      recipientType === "customer"
        ? `Din ${bookingType} er bekreftet av ${stylistName}. Se frem til en fantastisk opplevelse!`
        : `Du har bekreftet ${isTrialSession ? "prøvetimen" : "bookingen"} med ${customerName}. Forbered deg på å levere en fantastisk opplevelse!`,
    cancelled: (() => {
      if (recipientType === "customer") {
        return cancelledBy === "customer"
          ? `Du har avlyst din ${bookingType} med ${stylistName}. Vi beklager at det ikke passet for deg denne gangen.`
          : `Din ${bookingType} har blitt avlyst av ${stylistName}. Vi beklager ulempen dette måtte medføre.`;
      } else {
        return cancelledBy === "stylist"
          ? `Du har avlyst ${isTrialSession ? "prøvetimen" : "bookingen"} med ${customerName}. Kunden er informert om avlysningen.`
          : `${customerName} har avlyst ${isTrialSession ? "prøvetimen" : "bookingen"}. Du vil motta kompensasjon hvis det gjelder.`;
      }
    })(),
  };


  const previewText = `${isTrialSession ? "Prøvetime" : "Booking"} ${statusLabels[status].toLowerCase()}: ${serviceName}`;

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

          <Heading style={heading}>
            {isTrialSession ? "Prøvetime" : "Booking"} {statusLabels[status].toLowerCase()}
          </Heading>

          <Text style={paragraph}>
            {recipientType === "customer"
              ? `Hei ${customerName}! Din ${bookingType} hos ${stylistName} har fått en statusoppdatering.`
              : `Hei ${stylistName}! ${isTrialSession ? "Prøvetimen" : "Bookingen"} med ${customerName} har fått en statusoppdatering.`}
          </Text>

          <Section
            style={{ ...statusSection, borderColor: statusColors[status] }}
          >
            <Text style={statusLabel}>Status:</Text>
            <Text style={{ ...statusValue, color: statusColors[status] }}>
              {statusLabels[status]}
            </Text>
          </Section>

          <Text style={paragraph}>{statusDescriptions[status]}</Text>

          {/* Booking Details */}
          <Section style={bookingDetailsSection}>
            <Text style={sectionHeader}>{isTrialSession ? "Prøvetimedetaljer:" : "Bookingdetaljer:"}</Text>

            <div style={detailRow}>
              <Text style={detailLabel}>Tjeneste:</Text>
              <Text style={detailValue}>{serviceName}</Text>
            </div>

            <div style={detailRow}>
              <Text style={detailLabel}>Dato:</Text>
              <Text style={detailValue}>{bookingDate}</Text>
            </div>

            <div style={detailRow}>
              <Text style={detailLabel}>Tid:</Text>
              <Text style={detailValue}>{bookingTime}</Text>
            </div>

            {location && (
              <div style={detailRow}>
                <Text style={detailLabel}>Sted:</Text>
                <Text style={detailValue}>{location}</Text>
              </div>
            )}

            <div style={detailRow}>
              <Text style={detailLabel}>
                {recipientType === "customer" ? "Stylist:" : "Kunde:"}
              </Text>
              <Text style={detailValue}>
                {recipientType === "customer" ? stylistName : customerName}
              </Text>
            </div>
          </Section>

          {/* Refund Information */}
          {status === "cancelled" && refundInfo && (
            <Section style={refundSection}>
              <Text style={sectionHeader}>Refusjon og kompensasjon:</Text>

              {recipientType === "customer" && refundInfo.refundAmount > 0 && (
                <div style={detailRow}>
                  <Text style={detailLabel}>Du får refundert:</Text>
                  <Text style={detailValue}>
                    {refundInfo.refundAmount.toLocaleString("nb-NO")} kr (
                    {Math.round(refundInfo.refundPercentage * 100)}%)
                  </Text>
                </div>
              )}

              {recipientType === "customer" && refundInfo.refundAmount === 0 && (
                <div style={detailRow}>
                  <Text style={detailLabel}>Refusjon:</Text>
                  <Text style={detailValue}>
                    Ingen refusjon (avlyst mindre enn 24 timer før avtalt tid)
                  </Text>
                </div>
              )}

              {recipientType === "stylist" && refundInfo.stylistCompensation && refundInfo.stylistCompensation > 0 && (
                <div style={detailRow}>
                  <Text style={detailLabel}>Din kompensasjon:</Text>
                  <Text style={detailValue}>
                    {refundInfo.stylistCompensation.toLocaleString("nb-NO")} kr
                  </Text>
                </div>
              )}

              {recipientType === "stylist" && cancelledBy === "stylist" && (
                <div style={detailRow}>
                  <Text style={detailLabel}>Kundens refusjon:</Text>
                  <Text style={detailValue}>
                    {refundInfo.refundAmount.toLocaleString("nb-NO")} kr (100%)
                  </Text>
                </div>
              )}

              {refundInfo.refundAmount > 0 && (
                <Text style={refundNote}>
                  {recipientType === "customer" 
                    ? "Refusjonen vil bli behandlet innen 3-5 virkedager og vises på din konto."
                    : "Eventuelle utbetalinger vil bli behandlet i henhold til våre betalingsvilkår."
                  }
                </Text>
              )}
            </Section>
          )}

          {/* Message */}
          {message && (
            <Section style={messageSection}>
              <Text style={messageLabel}>
                {recipientType === "customer"
                  ? `Melding fra ${stylistName}:`
                  : "Din melding til kunden:"}
              </Text>
              <Text style={messageText}>{message}</Text>
            </Section>
          )}

          {/* Call to Action */}
          {status === "confirmed" && (
            <Section style={ctaSection}>
              <Text style={paragraph}>
                {recipientType === "customer"
                  ? `Se alle detaljer for ${isTrialSession ? "prøvetimen" : "bookingen"} din og kommuniser direkte med stylisten.`
                  : `Se alle detaljer for ${isTrialSession ? "prøvetimen" : "bookingen"} og kommuniser med kunden om nødvendig.`}
              </Text>
              <Button
                style={{ ...button, backgroundColor: statusColors[status] }}
                href={`${baseUrl}/bookinger/${bookingId}`}
              >
                Se {isTrialSession ? "prøvetime" : "booking"}
              </Button>
            </Section>
          )}

          {status === "cancelled" && recipientType === "customer" && (
            <Section style={ctaSection}>
              <Text style={paragraph}>
                Du kan søke etter andre tilgjengelige stylister eller book en ny
                time hos {stylistName} når det passer bedre.
              </Text>
              <Button
                style={{ ...button, backgroundColor: statusColors[status] }}
                href={`${baseUrl}/services`}
              >
                Finn ny stylist
              </Button>
            </Section>
          )}

          {status === "cancelled" && recipientType === "stylist" && (
            <Section style={ctaSection}>
              <Text style={paragraph}>
                {isTrialSession ? "Prøvetimen" : "Bookingen"} er nå avlyst og kunden er informert. Du kan se andre
                ventende forespørsler i din bookingsoversikt.
              </Text>
              <Button
                style={{ ...button, backgroundColor: statusColors[status] }}
                href={`${baseUrl}/profiler/${stylistId}/mine-bookinger`}
              >
                Se mine bookinger
              </Button>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Hvis du har spørsmål, kan du kontakte oss på{" "}
            <Link href="mailto:support@nabostylisten.no" style={link}>
              support@nabostylisten.no
            </Link>
          </Text>

          <Text style={footer}>{isTrialSession ? "Prøvetime" : "Booking"} ID: {bookingId}</Text>
        </Container>
      </Body>
    </Html>
  );
};

BookingStatusUpdateEmail.PreviewProps = {
  logoUrl: "https://example.com/logo.png",
  customerName: "Ola Nordmann",
  stylistName: "Anna Stylist",
  bookingId: "booking_12345",
  stylistId: "stylist_67890",
  serviceName: "Prøvetime: Hårklipp og styling",
  bookingDate: "15. januar 2024",
  bookingTime: "14:00 - 15:30",
  status: "cancelled" as const,
  message: "Beklager, men jeg må avlyse på grunn av sykdom.",
  location: "Hjemme hos deg",
  recipientType: "customer" as const,
  cancelledBy: "stylist" as const,
  refundInfo: {
    refundAmount: 800,
    refundPercentage: 1.0,
  },
  isTrialSession: true,
} as BookingStatusUpdateEmailProps;

export default BookingStatusUpdateEmail;

// Using shared Nabostylisten branded styles
const main = baseStyles.main;
const container = baseStyles.container;
const logoContainer = baseStyles.logoContainer;
const logo = baseStyles.logo;
const heading = baseStyles.heading;
const paragraph = baseStyles.paragraph;
const bookingDetailsSection = sectionStyles.infoSection;
const sectionHeader = textStyles.sectionHeader;
const detailRow = layoutStyles.detailRow;
const detailLabel = textStyles.detailLabel;
const detailValue = textStyles.detailValue;
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
  border: "2px solid",
  borderColor: colors.accentForeground, // Will be overridden by status color
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
  color: colors.accentForeground, // Will be overridden by status color
  margin: "0",
};

const refundSection = {
  ...sectionStyles.infoSection,
  backgroundColor: colors.accent,
  border: `1px solid ${colors.accentForeground}`,
  borderRadius: "8px",
};

const refundNote = {
  ...textStyles.detailValue,
  fontSize: "12px",
  fontStyle: "italic",
  color: colors.mutedForeground,
  marginTop: "12px",
  textAlign: "center" as const,
};
