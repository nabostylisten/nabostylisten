import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface AffiliateMonthlyPayoutProps {
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
  stylistName = "Anna",
  payoutAmount = 2450.50,
  currency = "NOK",
  periodStart = "2024-03-01",
  periodEnd = "2024-03-31",
  totalBookings = 12,
  totalCommissions = 2450.50,
  dashboardUrl = "https://nabostylisten.no/profiler/123/partner/utbetalinger",
  payoutDate = "2024-04-05",
}: AffiliateMonthlyPayoutProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('no-NO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <Html>
      <Head />
      <Preview>Din månedlige partnerutbetaling er på vei! 💰</Preview>
      <Body style={main}>
        <Container style={container}>
            <Section style={section}>
              <Heading style={h1}>Din partnerutbetaling er på vei! 💰</Heading>
              
              <Text style={text}>
                Kjære {stylistName},
              </Text>
              
              <Text style={text}>
                Vi er glade for å informere deg om din månedlige partnerutbetaling for 
                perioden {formatDate(periodStart)} - {formatDate(periodEnd)}.
              </Text>

              <Section style={summarySection}>
                <Heading style={h2}>Utbetalingssammendrag</Heading>
                
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
                <Heading style={h2}>Viktig informasjon</Heading>
                
                <Text style={infoItem}>
                  💳 <strong>Utbetaling:</strong> Beløpet vil bli overført til din registrerte 
                  bankkonto innen 2-5 virkedager
                </Text>
                
                <Text style={infoItem}>
                  📊 <strong>Rapport:</strong> Detaljert provisjonsrapport finner du i ditt 
                  partnerdashboard
                </Text>
                
                <Text style={infoItem}>
                  📧 <strong>Kvittering:</strong> Du vil motta en separat e-post når 
                  utbetalingen er gjennomført
                </Text>
                
                <Text style={infoItem}>
                  🧾 <strong>Skatt:</strong> Husk å oppgi partnerinntekter i din selvangivelse
                </Text>
              </Section>

              <Section style={ctaSection}>
                <Button style={button} href={dashboardUrl}>
                  Se detaljert rapport
                </Button>
              </Section>

              <Section style={performanceSection}>
                <Heading style={h2}>Din månedsprestasjon 📈</Heading>
                
                <Text style={text}>
                  Flotte resultater denne måneden! Du har henvist {totalBookings} bookinger 
                  og tjent {formatAmount(totalCommissions)} {currency} i provisjon.
                </Text>
                
                <Text style={text}>
                  Fortsett det gode arbeidet med å dele din partnerkode og hjelpe kunder 
                  med å finne de beste stylisttjenestene. Jo mer du deler, jo mer tjener du!
                </Text>
              </Section>

              <Text style={text}>
                Hvis du har spørsmål om utbetalingen eller partnerprogrammet, kontakt oss gjerne 
                på <Link href="mailto:partner@nabostylisten.no" style={link}>partner@nabostylisten.no</Link>
              </Text>
              
              <Text style={signature}>
                Takk for ditt samarbeid!<br />
                Nabostylisten Partner Team
              </Text>
            </Section>
          </Container>
      </Body>
    </Html>
  );
};

export default AffiliateMonthlyPayout;

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

const summarySection = {
  backgroundColor: "#f8f9fa",
  padding: "24px",
  borderRadius: "8px",
  margin: "24px 0",
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
  marginBottom: "20px",
};

const summaryItem = {
  padding: "12px",
  backgroundColor: "white",
  borderRadius: "6px",
};

const summaryLabel = {
  color: "#666",
  fontSize: "12px",
  fontWeight: "500",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const summaryValue = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const hr = {
  borderColor: "#e1e5e9",
  margin: "20px 0",
};

const totalSection = {
  textAlign: "center" as const,
  padding: "20px",
  backgroundColor: "#e8f5e8",
  borderRadius: "8px",
  border: "2px solid #28a745",
};

const totalLabel = {
  color: "#155724",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const totalAmount = {
  color: "#155724",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0",
};

const infoSection = {
  margin: "32px 0",
  backgroundColor: "#fff3cd",
  padding: "20px",
  borderRadius: "8px",
  borderLeft: "4px solid #ffc107",
};

const infoItem = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "12px 0",
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

const performanceSection = {
  margin: "32px 0",
  backgroundColor: "#e8f4fd",
  padding: "20px",
  borderRadius: "8px",
  borderLeft: "4px solid #007bff",
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