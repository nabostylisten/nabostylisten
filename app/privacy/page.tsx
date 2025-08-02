import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PrivacyPage() {
  const lastUpdated = new Date("2025-08-02").toLocaleDateString("no-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const contactEmail = "kontakt@nabostylisten.no";

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center py-16">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Personvernerklæring
            </h1>
            <p className="text-lg text-muted-foreground">
              Sist oppdatert: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Introduksjon</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="mb-4">
                  Nabostylisten AS (&ldquo;vi&rdquo;, &ldquo;oss&rdquo;,
                  &ldquo;vår&rdquo;) er behandlingsansvarlig for
                  personopplysninger som samles inn gjennom vår plattform. Denne
                  personvernerklæringen forklarer hvordan vi samler inn, bruker
                  og beskytter dine personopplysninger.
                </p>
                <p>
                  Ved å bruke Nabostylisten godtar du at vi behandler dine
                  personopplysninger i henhold til denne personvernerklæringen
                  og gjeldende personvernlovgivning.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Hvilke opplysninger vi samler inn</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="text-lg font-semibold mb-3">
                  Opplysninger du gir oss
                </h4>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Navn, e-postadresse og telefonnummer</li>
                  <li>Adresse og geografisk plassering</li>
                  <li>Profilinformasjon og bilder</li>
                  <li>Betalingsinformasjon (håndteres av Stripe)</li>
                  <li>Kommunikasjon med andre brukere</li>
                  <li>Anmeldelser og vurderinger</li>
                </ul>

                <h4 className="text-lg font-semibold mb-3">
                  Opplysninger som samles inn automatisk
                </h4>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>IP-adresse og enhetsinformasjon</li>
                  <li>Bruksmønster og navigasjonsdata</li>
                  <li>Cookies og lignende teknologier</li>
                  <li>Geografisk plassering (med ditt samtykke)</li>
                </ul>

                <h4 className="text-lg font-semibold mb-3">
                  Opplysninger fra tredjeparter
                </h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Google OAuth (hvis du logger inn med Google)</li>
                  <li>Stripe (betalingsinformasjon)</li>
                  <li>Mapbox (adresseautofullføring)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Hvordan vi bruker opplysningene</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="text-lg font-semibold mb-3">Hovedformål</h4>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Å tilby og forbedre våre tjenester</li>
                  <li>Å koble sammen kunder og stylister</li>
                  <li>Å håndtere bookinger og betalinger</li>
                  <li>Å sikre sikker og pålitelig bruk av plattformen</li>
                </ul>

                <h4 className="text-lg font-semibold mb-3">Kommunikasjon</h4>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Bekreftelser og oppdateringer om bookinger</li>
                  <li>Kundeservice og support</li>
                  <li>Viktige meldinger om tjenesten</li>
                  <li>Nyhetsbrev og markedsføring (med samtykke)</li>
                </ul>

                <h4 className="text-lg font-semibold mb-3">
                  Analyser og forbedringer
                </h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Å analysere bruksmønster for å forbedre tjenesten</li>
                  <li>Å utvikle nye funksjoner</li>
                  <li>Å forhindre svindel og misbruk</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Deling av opplysninger</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="text-lg font-semibold mb-3">
                  Når vi deler opplysninger
                </h4>
                <ul className="list-disc pl-6 mb-6 space-y-3">
                  <li>
                    <strong>Mellom brukere:</strong> Navn, profilbilde og
                    grunnleggende profilinformasjon deles mellom kunder og
                    stylister for å muliggjøre booking
                  </li>
                  <li>
                    <strong>Tjenesteleverandører:</strong> Vi deler opplysninger
                    med pålitelige tredjeparter som hjelper oss å levere
                    tjenesten (Stripe, Resend, Mapbox)
                  </li>
                  <li>
                    <strong>Juridiske krav:</strong> Vi kan dele opplysninger
                    når det kreves av lov eller for å beskytte våre rettigheter
                  </li>
                </ul>

                <h4 className="text-lg font-semibold mb-3">
                  Vi selger ikke personopplysninger
                </h4>
                <p>
                  Vi selger, leier ut eller deler ikke dine personopplysninger
                  med tredjeparter for kommersielle formål uten ditt eksplisitte
                  samtykke.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Datasikkerhet</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="text-lg font-semibold mb-3">Sikkerhetstiltak</h4>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Kryptering av alle data i hvile og under overføring</li>
                  <li>Regelmessige sikkerhetsvurderinger</li>
                  <li>Tilgangskontroll og autentisering</li>
                  <li>Backup og gjenoppretting av data</li>
                </ul>

                <h4 className="text-lg font-semibold mb-3">
                  Betalingssikkerhet
                </h4>
                <p className="mb-4">
                  Alle betalinger håndteres av Stripe, som er PCI
                  DSS-sertifisert og følger de strengeste sikkerhetsstandardene
                  innen betalingsindustrien.
                </p>

                <h4 className="text-lg font-semibold mb-3">Dine ansvar</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Hold passordet ditt sikkert og ikke del det</li>
                  <li>Logg ut når du bruker delte enheter</li>
                  <li>Varsle oss umiddelbart ved mistenkelig aktivitet</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Dine rettigheter</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="text-lg font-semibold mb-3">
                  Du har rett til å:
                </h4>
                <ul className="list-disc pl-6 mb-6 space-y-3">
                  <li>
                    <strong>Innsyn:</strong> Be om kopi av dine
                    personopplysninger
                  </li>
                  <li>
                    <strong>Rettelse:</strong> Be om at feilaktige
                    personopplysninger rettes
                  </li>
                  <li>
                    <strong>Sletting:</strong> Be om at dine personopplysninger
                    slettes (med visse unntak)
                  </li>
                  <li>
                    <strong>Begrensning:</strong> Be om begrensning av
                    behandling av dine opplysninger
                  </li>
                  <li>
                    <strong>Dataportabilitet:</strong> Be om utlevering av dine
                    opplysninger i et strukturt format
                  </li>
                  <li>
                    <strong>Innsigelse:</strong> Gjøre innsigelse mot behandling
                    av dine opplysninger
                  </li>
                </ul>

                <p>
                  For å utøve disse rettighetene, kontakt oss på{" "}
                  <Link
                    href={`mailto:${contactEmail}`}
                    className="text-primary hover:underline"
                  >
                    {contactEmail}
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Cookies og lignende teknologier</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="text-lg font-semibold mb-3">Hva er cookies?</h4>
                <p className="mb-4">
                  Cookies er små tekstfiler som lagres på enheten din når du
                  besøker vår nettside. De hjelper oss å gi deg en bedre
                  brukeropplevelse.
                </p>

                <h4 className="text-lg font-semibold mb-3">
                  Hvordan vi bruker cookies
                </h4>
                <ul className="list-disc pl-6 mb-6 space-y-3">
                  <li>
                    <strong>Nødvendige cookies:</strong> Kreves for at nettsiden
                    skal fungere (innlogging, sikkerhet)
                  </li>
                  <li>
                    <strong>Funksjonelle cookies:</strong> Forbedrer
                    brukeropplevelsen (språk, preferanser)
                  </li>
                  <li>
                    <strong>Analytiske cookies:</strong> Hjelper oss å forstå
                    hvordan nettsiden brukes
                  </li>
                  <li>
                    <strong>Markedsføringscookies:</strong> Brukes for relevante
                    annonser (kun med samtykke)
                  </li>
                </ul>

                <h4 className="text-lg font-semibold mb-3">
                  Hvordan administrere cookies
                </h4>
                <p>
                  Du kan endre dine cookie-innstillinger i nettleseren din eller
                  kontakte oss for hjelp med å administrere dine preferanser.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Lagring av opplysninger</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="text-lg font-semibold mb-3">
                  Hvor lenge vi lagrer opplysninger
                </h4>
                <ul className="list-disc pl-6 mb-6 space-y-3">
                  <li>
                    <strong>Aktive kontoer:</strong> Så lenge kontoen er aktiv
                  </li>
                  <li>
                    <strong>Inaktive kontoer:</strong> Opptil 3 år etter siste
                    aktivitet
                  </li>
                  <li>
                    <strong>Bookingdata:</strong> 7 år (for regnskapsformål)
                  </li>
                  <li>
                    <strong>Kommunikasjon:</strong> 2 år etter siste melding
                  </li>
                  <li>
                    <strong>Analytiske data:</strong> Opptil 2 år
                  </li>
                </ul>

                <h4 className="text-lg font-semibold mb-3">
                  Automatisk sletting
                </h4>
                <p>
                  Vi har automatiserte prosesser som sletter personopplysninger
                  når de ikke lenger er nødvendige eller når du ber om sletting.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Internasjonal overføring</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="mb-4">
                  Nabostylisten opererer primært i Norge, men noen av våre
                  tjenesteleverandører kan være lokalisert i andre land. Når vi
                  overfører data til land utenfor EØS, sikrer vi at:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Landet har tilstrekkelig beskyttelse av personopplysninger
                  </li>
                  <li>Vi har passende avtaler om databeskyttelse</li>
                  <li>Vi følger norske og europeiske personvernregler</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Endringer i personvernerklæringen</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="mb-4">
                  Vi kan oppdatere denne personvernerklæringen fra tid til
                  annen. Når vi gjør betydelige endringer, vil vi:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Varsle deg via e-post eller i appen</li>
                  <li>Oppdatere &ldquo;sist oppdatert&rdquo;-datoen</li>
                  <li>Gi deg mulighet til å godta endringene</li>
                </ul>
                <p>
                  Vi anbefaler at du leser gjennom personvernerklæringen
                  regelmessig for å holde deg oppdatert.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Kontaktinformasjon</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="mb-4">
                  Hvis du har spørsmål om denne personvernerklæringen eller
                  hvordan vi behandler dine personopplysninger, kontakt oss:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>
                    E-post:{" "}
                    <Link
                      href={`mailto:${contactEmail}`}
                      className="text-primary hover:underline"
                    >
                      {contactEmail}
                    </Link>
                  </li>
                  <li>Telefon: +47 123 45 678</li>
                  <li>Adresse: Nabostylisten AS, Postboks 123, 0159 Oslo</li>
                </ul>

                <h4 className="text-lg font-semibold mb-3">Datatilsynet</h4>
                <p>
                  Du har rett til å klage til Datatilsynet hvis du mener at vår
                  behandling av personopplysninger er i strid med
                  personvernlovgivningen.
                </p>

                <p className="text-sm text-muted-foreground mt-8">
                  Denne personvernerklæringen er sist oppdatert {lastUpdated}.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
