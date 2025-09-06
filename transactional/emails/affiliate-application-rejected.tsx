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
} from "@react-email/components";
import * as React from "react";

interface AffiliateApplicationRejectedProps {
  stylistName: string;
  rejectionReason?: string;
  reapplyUrl: string;
}

export const AffiliateApplicationRejected = ({
  stylistName = "Anna",
  rejectionReason = "Vi har for øyeblikket mange partnere i ditt område.",
  reapplyUrl = "https://nabostylisten.no/profiler/123/partner/soknad",
}: AffiliateApplicationRejectedProps) => (
  <Html>
    <Head />
    <Preview>Svar på din partnersøknad</Preview>
    <Body style={main}>
      <Container style={container}>
          <Section style={section}>
            <Heading style={h1}>Takk for din interesse i partnerprogrammet</Heading>
            
            <Text style={text}>
              Kjære {stylistName},
            </Text>
            
            <Text style={text}>
              Takk for at du sendte inn søknad om å bli partner hos Nabostylisten. 
              Vi setter stor pris på din interesse for å være en del av vårt partnerprogram.
            </Text>

            <Text style={text}>
              Etter nøye vurdering har vi dessverre besluttet å ikke godkjenne din søknad 
              for øyeblikket.
            </Text>

            {rejectionReason && (
              <Section style={reasonSection}>
                <Text style={reasonText}>
                  <strong>Årsak:</strong> {rejectionReason}
                </Text>
              </Section>
            )}

            <Section style={encouragementSection}>
              <Heading style={h2}>Dette betyr ikke slutten!</Heading>
              
              <Text style={text}>
                Vi oppfordrer deg til å søke på nytt i fremtiden. Våre krav og behov 
                endrer seg over tid, og vi vil gjerne se en ny søknad fra deg.
              </Text>
              
              <Text style={text}>
                I mellomtiden kan du fokusere på:
              </Text>
              
              <Text style={improvementItem}>
                • Bygge opp din portefølje og erfaring som stylist
              </Text>
              <Text style={improvementItem}>
                • Øke din tilstedeværelse på sosiale medier
              </Text>
              <Text style={improvementItem}>
                • Samle positive anmeldelser fra kunder
              </Text>
              <Text style={improvementItem}>
                • Utvide tjenesteutvalget ditt
              </Text>
            </Section>

            <Text style={text}>
              Vi vil gjerne at du fortsetter å være en del av Nabostylisten-fellesskapet. 
              Du kan fortsette å tilby tjenester gjennom plattformen vår som vanlig.
            </Text>

            <Text style={text}>
              Hvis du har spørsmål om avgjørelsen eller ønsker råd om hvordan du kan 
              forbedre din søknad, kan du kontakte oss på{" "}
              <Link href="mailto:partner@nabostylisten.no" style={link}>
                partner@nabostylisten.no
              </Link>
            </Text>
            
            <Text style={text}>
              Vi takker deg igjen for din interesse og ser frem til å høre fra deg igjen.
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

export default AffiliateApplicationRejected;

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

const reasonSection = {
  backgroundColor: "#fff3cd",
  padding: "16px",
  borderRadius: "6px",
  borderLeft: "4px solid #ffc107",
  margin: "24px 0",
};

const reasonText = {
  color: "#856404",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const encouragementSection = {
  margin: "32px 0",
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "8px",
};

const improvementItem = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "8px 0",
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