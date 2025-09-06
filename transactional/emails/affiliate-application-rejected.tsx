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
  Hr,
} from "@react-email/components";
import {
  baseStyles,
  sectionStyles,
  textStyles,
  colors,
} from "./utils/styles";

interface AffiliateApplicationRejectedProps {
  logoUrl: string;
  stylistName: string;
  rejectionReason?: string;
  reapplyUrl: string;
}

export const AffiliateApplicationRejected = ({
  logoUrl,
  stylistName = "Anna",
  rejectionReason = "Vi har for øyeblikket mange partnere i ditt område.",
  reapplyUrl = "https://nabostylisten.no/profiler/123/partner/soknad",
}: AffiliateApplicationRejectedProps) => {
  const previewText = `Svar på din partnersøknad`;

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

          <Heading style={heading}>Takk for din interesse i partnerprogrammet</Heading>
            
          <Text style={paragraph}>
            Kjære {stylistName},
          </Text>
          
          <Text style={paragraph}>
            Takk for at du sendte inn søknad om å bli partner hos Nabostylisten. 
            Vi setter stor pris på din interesse for å være en del av vårt partnerprogram.
          </Text>

          <Text style={paragraph}>
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
            <Heading style={subHeading}>Dette betyr ikke slutten!</Heading>
            
            <Text style={paragraph}>
              Vi oppfordrer deg til å søke på nytt i fremtiden. Våre krav og behov 
              endrer seg over tid, og vi vil gjerne se en ny søknad fra deg.
            </Text>
            
            <Text style={paragraph}>
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

          <Text style={paragraph}>
            Vi vil gjerne at du fortsetter å være en del av Nabostylisten-fellesskapet. 
            Du kan fortsette å tilby tjenester gjennom plattformen vår som vanlig.
          </Text>

          <Hr style={hr} />

          <Text style={paragraph}>
            Hvis du har spørsmål om avgjørelsen eller ønsker råd om hvordan du kan 
            forbedre din søknad, kan du kontakte oss på{" "}
            <Link href="mailto:partner@nabostylisten.no" style={link}>
              partner@nabostylisten.no
            </Link>
          </Text>
          
          <Text style={paragraph}>
            Vi takker deg igjen for din interesse og ser frem til å høre fra deg igjen.
          </Text>
          
          <Text style={footer}>
            Med vennlig hilsen,<br />
            Nabostylisten Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

AffiliateApplicationRejected.PreviewProps = {
  logoUrl: "https://example.com/logo.png",
  stylistName: "Anna Nordmann",
  rejectionReason: "Vi har for øyeblikket mange partnere i ditt område.",
  reapplyUrl: "https://nabostylisten.no/profiler/123/partner/soknad",
} as AffiliateApplicationRejectedProps;

export default AffiliateApplicationRejected;

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

// Specific styles for rejection email
const reasonSection = {
  backgroundColor: colors.warning,
  padding: "16px 20px",
  borderRadius: "8px",
  borderLeft: `4px solid ${colors.warningBorder}`,
  margin: "24px 0",
};

const reasonText = {
  color: colors.warningText,
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};

const encouragementSection = {
  ...sectionStyles.infoSection,
  backgroundColor: colors.accent,
  border: `2px solid ${colors.accentForeground}`,
};

const improvementItem = {
  color: colors.foreground,
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "8px 0",
};