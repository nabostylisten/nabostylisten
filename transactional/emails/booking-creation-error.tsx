import React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { baseStyles, buttonStyles, textStyles } from "./utils/styles";

interface BookingCreationErrorEmailProps {
  userName: string;
  supportEmail?: string;
  logoUrl?: string;
}

export const BookingCreationErrorEmail = ({
  userName,
  supportEmail = "hei@nabostylisten.no",
  logoUrl,
}: BookingCreationErrorEmailProps) => {
  const previewText = "Booking opprettelse feilet - betalingsmetoden din ble ikke belastet";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          {logoUrl && (
            <Section style={baseStyles.logoSection}>
              <Img
                src={logoUrl}
                width="180"
                height="auto"
                alt="Nabostylisten"
                style={baseStyles.logo}
              />
            </Section>
          )}

          <Section style={baseStyles.section}>
            <Text style={textStyles.heading}>
              Noe gikk galt med bookingen din
            </Text>

            <Text style={textStyles.paragraph}>
              Hei {userName},
            </Text>

            <Text style={textStyles.paragraph}>
              Vi beklager, men det oppstod en teknisk feil da du prøvde å opprette din booking.
              <strong>Betalingsmetoden din ble IKKE belastet</strong> og det er ikke trukket penger fra kontoen din.
            </Text>

            <Text style={textStyles.paragraph}>
              Dette kan skje av forskjellige årsaker:
            </Text>

            <Text style={textStyles.bulletPoint}>
              • Midlertidig teknisk problem på vår side
              <br />
              • Nettverksfeil under prosessen
              <br />
              • Systemoppgradering pågår
            </Text>

            <Text style={textStyles.paragraph}>
              <strong>Hva gjør du nå?</strong>
            </Text>

            <Text style={textStyles.paragraph}>
              Vennligst prøv å opprette bookingen på nytt. Gå tilbake til våre tjenester
              og start booking-prosessen på nytt.
            </Text>

            <Section style={baseStyles.buttonSection}>
              <Link
                href="https://nabostylisten.no/tjenester"
                style={{...buttonStyles.primary, textDecoration: 'none'}}
              >
                Prøv igjen
              </Link>
            </Section>

            <Text style={textStyles.paragraph}>
              Hvis problemet fortsetter, ikke nøl med å kontakte oss på{" "}
              <Link
                href={`mailto:${supportEmail}`}
                style={textStyles.link}
              >
                {supportEmail}
              </Link>{" "}
              så hjelper vi deg raskt.
            </Text>

            <Text style={textStyles.paragraph}>
              Vi beklager bryderidet og takker for din forståelse.
            </Text>

            <Text style={textStyles.signature}>
              Vennlig hilsen,
              <br />
              Nabostylisten-teamet
            </Text>
          </Section>

          <Section style={baseStyles.footer}>
            <Text style={textStyles.footer}>
              Nabostylisten - Din lokale skjønnhetspartner
              <br />
              Hvis du har spørsmål, kontakt oss på{" "}
              <Link
                href={`mailto:${supportEmail}`}
                style={textStyles.footerLink}
              >
                {supportEmail}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingCreationErrorEmail;