import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfServicePage() {
  const lastUpdated = "15. januar 2024";

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center py-16">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Vilkår og betingelser
            </h1>
            <p className="text-lg text-muted-foreground">
              Sist oppdatert: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Generelle vilkår</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Velkommen til Nabostylisten. Ved å bruke vår plattform godtar
                  du disse vilkårene og betingelsene. Nabostylisten er en
                  digital markedsplass som kobler sammen kunder og stylister for
                  booking av skjønnhetstjenester.
                </p>
                <p>
                  Disse vilkårene gjelder for alle brukere av plattformen,
                  inkludert kunder, stylister og besøkende. Vi forbeholder oss
                  retten til å endre disse vilkårene når som helst.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Booking og betaling</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4>Booking</h4>
                <ul>
                  <li>
                    Alle bookinger må bekreftes av stylisten før de blir gyldige
                  </li>
                  <li>Kunder mottar bekreftelse via e-post og SMS</li>
                  <li>Endringer i booking må godkjennes av begge parter</li>
                </ul>

                <h4>Betaling</h4>
                <ul>
                  <li>Betaling behandles sikkert gjennom Stripe</li>
                  <li>Betaling trekkes 24 timer før avtalt tid</li>
                  <li>
                    Ved avbestilling senere enn 24 timer før, belastes 50% av
                    prisen
                  </li>
                  <li>Ved ikke-oppmøte belastes full pris</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Avbestillingsregler</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4>For kunder</h4>
                <ul>
                  <li>Gratis avbestilling frem til 24 timer før avtalt tid</li>
                  <li>
                    Ved avbestilling 12-24 timer før: 50% av prisen belastes
                  </li>
                  <li>
                    Ved avbestilling mindre enn 12 timer før: Full pris belastes
                  </li>
                </ul>

                <h4>For stylister</h4>
                <ul>
                  <li>Må gi minst 24 timers varsel ved avbestilling</li>
                  <li>
                    Ved kortere varsel kan stylist bli suspendert fra
                    plattformen
                  </li>
                  <li>Kunden får full refusjon ved stylistens avbestilling</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Ansvar og forsikring</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Nabostylisten fungerer som en markedsplass og er ikke
                  ansvarlig for kvaliteten på tjenestene som leveres av
                  stylistene. Alle stylister må ha gyldig ansvarsforsikring.
                </p>
                <ul>
                  <li>
                    Stylister er ansvarlige for sine egne tjenester og
                    eventuelle skader
                  </li>
                  <li>
                    Kunder er ansvarlige for å oppgi korrekt informasjon om
                    allergier og ønsker
                  </li>
                  <li>
                    Begge parter må følge helsemyndighetenes retningslinjer
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Brukeroppførsel</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4>Forbudt oppførsel</h4>
                <ul>
                  <li>
                    Trakassering, diskriminering eller upassende oppførsel
                  </li>
                  <li>Falsk informasjon i profiler eller anmeldelser</li>
                  <li>Omgåelse av plattformens betalingssystem</li>
                  <li>
                    Spam eller kommersiell kommunikasjon utenom plattformen
                  </li>
                </ul>

                <p>
                  Brudd på disse reglene kan føre til suspensjon eller permanent
                  utestengelse fra plattformen.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Personvern</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Vi tar personvernet ditt på alvor. Se vår personvernerklæring
                  for detaljert informasjon om hvordan vi samler inn, bruker og
                  beskytter dine personopplysninger.
                </p>
                <ul>
                  <li>
                    Vi deler ikke personopplysninger med tredjeparter uten ditt
                    samtykke
                  </li>
                  <li>
                    Du har rett til å se, rette og slette dine opplysninger
                  </li>
                  <li>All kommunikasjon krypteres og lagres sikkert</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Tvister og klager</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Ved tvister mellom kunde og stylist, tilbyr Nabostylisten
                  megling som første instans. Klager kan sendes til vårt
                  kundeservice-team.
                </p>
                <ul>
                  <li>Klager må sendes innen 48 timer etter utført tjeneste</li>
                  <li>
                    Vi streber etter å løse alle tvister innen 7 virkedager
                  </li>
                  <li>Ved uløste tvister gjelder norsk lov og Oslo tingrett</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Kontaktinformasjon</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>For spørsmål om disse vilkårene, kontakt oss på:</p>
                <ul>
                  <li>E-post: support@nabostylisten.no</li>
                  <li>Telefon: +47 123 45 678</li>
                  <li>Adresse: Nabostylisten AS, Postboks 123, 0159 Oslo</li>
                </ul>

                <p className="text-sm text-muted-foreground mt-8">
                  Disse vilkårene er sist oppdatert {lastUpdated}. Vi anbefaler
                  at du leser gjennom vilkårene jevnlig da de kan endres uten
                  varsel.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
