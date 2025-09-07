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
} from "./utils/styles";
import { baseUrl } from "./utils";
import { NotificationSettings } from "../components/notification-settings";

interface BookingReceiptEmailProps {
  logoUrl: string;
  customerName: string;
  customerProfileId: string;
  stylistName: string;
  bookingId: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  location: string;
  messageFromCustomer?: string;
  totalPrice: number;
  currency: string;
  estimatedDuration: number;
}

export const BookingReceiptEmail = ({
  logoUrl,
  customerName = "Ola Nordmann",
  customerProfileId = "12345",
  stylistName = "Anna Stylist",
  bookingId = "12345",
  serviceName = "Hårklipp og styling",
  bookingDate = "15. januar 2024",
  bookingTime = "14:00 - 15:30",
  location = "Stylistgata 5, 0123 Oslo",
  messageFromCustomer,
  totalPrice = 650,
  currency = "NOK",
  estimatedDuration = 90,
}: BookingReceiptEmailProps) => {
  const previewText = `Betalingsbekreftelse: ${serviceName} hos ${stylistName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={baseStyles.main}>
        <Container style={baseStyles.container}>
          <Section style={baseStyles.logoContainer}>
            <Img
              src={logoUrl}
              width="120"
              height="36"
              alt="Nabostylisten"
              style={baseStyles.logo}
            />
          </Section>

          <Heading style={baseStyles.heading}>Takk for din bestilling!</Heading>

          <Text style={baseStyles.paragraph}>
            Hei {customerName}! Vi har mottatt din betaling og
            bookingforespørsel hos {stylistName}. Din stylist vil nå vurdere
            forespørselen og svare deg snart.
          </Text>

          {/* Payment Confirmation */}
          <Section style={sectionStyles.customerSection}>
            <Text style={textStyles.sectionHeader}>✓ Betaling bekreftet</Text>
            <Text style={textStyles.customerName}>
              {totalPrice.toLocaleString("no-NO", {
                style: "currency",
                currency: currency,
              })}
            </Text>
            {/* TODO: Dynamically set this based on platform config */}
            <Text style={baseStyles.paragraph}>
              Din betaling er sikret. Kortet ditt blir belastet 24 timer før
              avtalt tid.
            </Text>
          </Section>

          {/* Booking Details */}
          <Section style={sectionStyles.infoSection}>
            <Text style={textStyles.sectionHeader}>Bestillingsdetaljer:</Text>

            <div style={layoutStyles.detailRow}>
              <Text style={textStyles.detailLabel}>Tjeneste:</Text>
              <Text style={textStyles.detailValue}>{serviceName}</Text>
            </div>

            <div style={layoutStyles.detailRow}>
              <Text style={textStyles.detailLabel}>Stylist:</Text>
              <Text style={textStyles.detailValue}>{stylistName}</Text>
            </div>

            <div style={layoutStyles.detailRow}>
              <Text style={textStyles.detailLabel}>Dato:</Text>
              <Text style={textStyles.detailValue}>{bookingDate}</Text>
            </div>

            <div style={layoutStyles.detailRow}>
              <Text style={textStyles.detailLabel}>Tid:</Text>
              <Text style={textStyles.detailValue}>{bookingTime}</Text>
            </div>

            <div style={layoutStyles.detailRow}>
              <Text style={textStyles.detailLabel}>Varighet:</Text>
              <Text style={textStyles.detailValue}>
                ~{estimatedDuration} minutter
              </Text>
            </div>

            {location && (
              <div style={layoutStyles.detailRow}>
                <Text style={textStyles.detailLabel}>Sted:</Text>
                <Text style={textStyles.detailValue}>{location}</Text>
              </div>
            )}

            <div style={layoutStyles.detailRow}>
              <Text style={textStyles.detailLabel}>Pris:</Text>
              <Text style={textStyles.detailValue}>
                {totalPrice.toLocaleString("no-NO", {
                  style: "currency",
                  currency: currency,
                })}
              </Text>
            </div>
          </Section>

          {/* Customer Message */}
          {messageFromCustomer && (
            <Section style={sectionStyles.messageSection}>
              <Text style={textStyles.messageHeader}>
                Din melding til stylisten:
              </Text>
              <Text style={textStyles.messageContent}>
                "{messageFromCustomer}"
              </Text>
            </Section>
          )}

          {/* Next Steps Information */}
          <Section style={sectionStyles.infoSection}>
            <Text style={textStyles.sectionHeader}>Hva skjer nå?</Text>
            <Text style={baseStyles.paragraph}>
              {stylistName} vil vurdere din forespørsel så fort som mulig. Du
              vil få beskjed på e-post når stylisten bekrefter eller avslår
              bookingen.
            </Text>
          </Section>

          {/* Action Button */}
          <Section style={sectionStyles.actionSection}>
            <Button
              style={buttonStyles.primary}
              href={`${baseUrl}/bookinger/${bookingId}`}
            >
              Se booking-detaljer
            </Button>
          </Section>

          {/* Customer Tips */}
          <Section style={sectionStyles.tipsSection}>
            <Text style={textStyles.tipsHeader}>
              Tips for en vellykket booking:
            </Text>
            <Text style={textStyles.tipsText}>
              • <strong>Vær tilgjengelig</strong> - Stylisten kan kontakte deg
              for avklaringer
              <br />• <strong>Forbered spørsmål</strong> - Tenk på hva du ønsker
              å oppnå
              <br />• <strong>Kom i tide</strong> - Vær klar 5 minutter før
              avtalt tid
              <br />• <strong>Ha realistiske forventninger</strong> - Diskuter
              ønsker på forhånd
            </Text>
          </Section>

          <NotificationSettings
            profileId={customerProfileId}
            notificationType="booking_confirmations"
          />

          <Hr style={baseStyles.hr} />

          <Text style={baseStyles.footer}>
            Har du spørsmål om bookingen? Kontakt oss på{" "}
            <Link
              href="mailto:support@nabostylisten.no"
              style={baseStyles.link}
            >
              support@nabostylisten.no
            </Link>
          </Text>

          <Text style={baseStyles.footer}>Booking ID: {bookingId}</Text>
        </Container>
      </Body>
    </Html>
  );
};

BookingReceiptEmail.PreviewProps = {
  logoUrl: "https://example.com/logo.png",
  customerName: "Ola Nordmann",
  customerProfileId: "12345",
  stylistName: "Anna Stylist",
  bookingId: "booking_12345",
  serviceName: "Hårklipp og styling",
  bookingDate: "15. januar 2024",
  bookingTime: "14:00 - 15:30",
  location: "Storgata 1, 0001 Oslo",
  messageFromCustomer:
    "Jeg ønsker en moderne frisyre som er lett å style. Har langt hår nå.",
  totalPrice: 650,
  currency: "NOK",
  estimatedDuration: 90,
} as BookingReceiptEmailProps;

export default BookingReceiptEmail;
