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
} from "@react-email/components";
import * as React from "react";

interface AffiliateApplicationApprovedProps {
  stylistName: string;
  affiliateCode: string;
  commissionPercentage: number;
  dashboardUrl: string;
}

export const AffiliateApplicationApproved = ({
  stylistName = "Anna",
  affiliateCode = "ANNA-2024-ABC123",
  commissionPercentage = 20,
  dashboardUrl = "https://nabostylisten.no/profiler/123/partner",
}: AffiliateApplicationApprovedProps) => (
  <Html>
    <Head />
    <Preview>Din partnersøknad har blitt godkjent! 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
          <Section style={section}>
            <Heading style={h1}>Gratulerer! Du er nå partner hos Nabostylisten 🎉</Heading>
            
            <Text style={text}>
              Kjære {stylistName},
            </Text>
            
            <Text style={text}>
              Vi er glade for å informere deg om at din søknad om å bli partner har blitt 
              godkjent! Velkommen til Nabostylisten Partner Program.
            </Text>

            <Section style={codeSection}>
              <Text style={codeLabel}>Din unike partnerkode:</Text>
              <Text style={codeText}>{affiliateCode}</Text>
              <Text style={codeDescription}>
                Del denne koden med dine kunder for å tjene {commissionPercentage}% provisjon på alle bookinger!
              </Text>
            </Section>

            <Section style={benefitsSection}>
              <Heading style={h2}>Dine partnerfordeler:</Heading>
              <Text style={benefitItem}>✅ {commissionPercentage}% provisjon på alle bookinger fra dine henvisninger</Text>
              <Text style={benefitItem}>✅ Egen partnerdashboard med detaljert statistikk</Text>
              <Text style={benefitItem}>✅ Månedlige utbetalinger direkte til din bankkonto</Text>
              <Text style={benefitItem}>✅ Markedsføringsmateriell og ressurser</Text>
              <Text style={benefitItem}>✅ Prioritert kundesupport</Text>
            </Section>

            <Section style={ctaSection}>
              <Button style={button} href={dashboardUrl}>
                Se ditt partnerdashboard
              </Button>
            </Section>

            <Section style={instructionsSection}>
              <Heading style={h2}>Slik kommer du i gang:</Heading>
              
              <Text style={instructionStep}>
                <strong>1. Del din partnerkode</strong><br />
                Gi kunden koden {affiliateCode} eller send dem lenken: 
                nabostylisten.no?code={affiliateCode}
              </Text>
              
              <Text style={instructionStep}>
                <strong>2. Følg med på statistikken</strong><br />
                Logg inn på ditt partnerdashboard for å se klikk, konverteringer og inntjening
              </Text>
              
              <Text style={instructionStep}>
                <strong>3. Få utbetalt</strong><br />
                Vi utbetaler provisjon månedlig til den bankkontoen som er registrert i din Stripe-konto
              </Text>
            </Section>

            <Text style={text}>
              Hvis du har spørsmål om partnerprogrammet, ikke nøl med å ta kontakt med oss 
              på <Link href="mailto:partner@nabostylisten.no" style={link}>partner@nabostylisten.no</Link>
            </Text>
            
            <Text style={text}>
              Vi ser frem til et fruktbart samarbeid!
            </Text>
            
            <Text style={signature}>
              Med vennlig hilsen,<br />
              Nabostylisten Team
            </Text>
          </Section>
        </Container>
    </Body>
  </Html>
);

export default AffiliateApplicationApproved;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const section = {
  padding: "24px",
  border: "solid 1px #dedede",
  borderRadius: "5px",
  textAlign: "left" as const,
};

const h1 = {
  color: "#333",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0",
  padding: "0",
};

const h2 = {
  color: "#333",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  fontSize: "20px",
  fontWeight: "bold",
  margin: "20px 0 10px 0",
  padding: "0",
};

const text = {
  color: "#333",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  fontSize: "14px",
  lineHeight: "24px",
  margin: "16px 0",
};

const codeSection = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "8px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const codeLabel = {
  color: "#666",
  fontSize: "12px",
  fontWeight: "500",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px 0",
};

const codeText = {
  color: "#007bff",
  fontSize: "32px",
  fontWeight: "bold",
  fontFamily: "Monaco, 'Lucida Console', monospace",
  margin: "0 0 12px 0",
  letterSpacing: "2px",
};

const codeDescription = {
  color: "#666",
  fontSize: "14px",
  margin: "0",
};

const benefitsSection = {
  margin: "32px 0",
};

const benefitItem = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "8px 0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#007bff",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "200px",
  padding: "14px 7px",
  margin: "0 auto",
};

const instructionsSection = {
  margin: "32px 0",
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "8px",
};

const instructionStep = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "16px 0",
};

const link = {
  color: "#007bff",
  textDecoration: "underline",
};

const signature = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "32px 0 0 0",
};