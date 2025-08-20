"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronDown } from "lucide-react";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const helpFaqs = [
  {
    id: "1",
    question: "Hva viser kalenderoversikten?",
    answer: "Kalenderoversikten viser en ukevis kalender med alle dager og timer. Du kan navigere mellom uker ved å bruke pil-knappene eller velge en spesifikk dato. Hver time vises som en rute som er fargekodet basert på din tilgjengelighet.",
  },
  {
    id: "2", 
    question: "Hva betyr de forskjellige fargene på cellene?",
    answer: "Grønne celler = Tilgjengelig for booking (arbeidsdag + arbeidstid + ikke utilgjengelig). Røde celler = Utilgjengelig (markert som opptatt eller gjentakende mønster). Grå celler = Ikke arbeidsdag eller utenfor arbeidstid.",
  },
  {
    id: "3",
    question: "Hvordan navigerer jeg mellom uker?",
    answer: "Du kan bruke pilknappene til høyre og venstre for å gå til neste eller forrige uke. Klikk på 'I dag' for å hoppe tilbake til inneværende uke. Du kan også bruke datovelgeren for å hoppe til en spesifikk dato eller uke.",
  },
  {
    id: "4",
    question: "Hvordan setter jeg opp mine arbeidsdager og arbeidstider?",
    answer: "Klikk på 'Innstillinger'-knappen for å åpne arbeidsinnstillinger. Her kan du velge hvilke dager du arbeider (mandag til søndag) og sette start- og sluttider for arbeidsdagen. Disse innstillingene gjelder for alle valgte arbeidsdager.",
  },
  {
    id: "5",
    question: "Hva er gjentakende utilgjengelighet?",
    answer: "Gjentakende utilgjengelighet lar deg opprette regelmessige mønstre for når du ikke er tilgjengelig, som for eksempel lunsjpauser, møter eller andre faste forpliktelser. Du kan sette tittel, tidspunkt og hvor ofte det gjentas (daglig, ukentlig, månedlig osv.).",
  },
  {
    id: "6",
    question: "Hvordan oppretter jeg gjentakende utilgjengelighet?",
    answer: "Klikk på 'Gjentakende'-knappen i toppen av kalenderen. Fyll ut skjemaet med tittel (f.eks. 'Lunsj'), velg tidspunkt, gjentakelsesmønster og startdato. Du kan også sette en sluttdato hvis ønskelig. Mønsteret vil automatisk vises i kalenderen.",
  },
  {
    id: "7",
    question: "Hva skjer når jeg klikker på en grønn celle?",
    answer: "Når du klikker på en grønn (tilgjengelig) celle, åpnes en dialog hvor du kan markere den tiden som utilgjengelig. Du kan sette start- og sluttid samt legge til en valgfri årsak som 'Ferie' eller 'Legetime'.",
  },
  {
    id: "8", 
    question: "Hva skjer når jeg klikker på en rød celle?",
    answer: "Når du klikker på en rød (utilgjengelig) celle, får du forskjellige alternativer avhengig av hva som gjør cellen rød. For engangs-utilgjengelighet kan du fjerne den eller endre arbeidsdag. For gjentakende mønstre får du avanserte alternativer for å administrere serien.",
  },
  {
    id: "9",
    question: "Hvilke alternativer har jeg for gjentakende mønstre?",
    answer: "For gjentakende mønstre har du tre hovedalternativer: 1) Avlys kun denne forekomsten (gjør denne tiden tilgjengelig uten å påvirke resten av serien), 2) Flytt kun denne forekomsten (flytt til annen tid), 3) Rediger hele serien (endre eller slett det hele gjentakende mønsteret).",
  },
  {
    id: "10",
    question: "Hvordan kan jeg avlyse eller flytte en enkelt forekomst?",
    answer: "Klikk på den røde cellen som tilhører et gjentakende mønster, velg 'Avlys kun denne forekomsten' for å gjøre tiden tilgjengelig, eller 'Flytt kun denne forekomsten' for å velge ny tid med dato- og tidsvelgere. Den opprinnelige serien fortsetter normalt.",
  },
  {
    id: "11",
    question: "Hvordan redigerer eller sletter jeg en hel gjentakende serie?",
    answer: "Klikk på en rød celle fra serien og velg 'Rediger hele serien'. Du får en dialog med alle innstillingene forhåndsutfylt hvor du kan endre tittel, tider, mønster eller datoer. Du kan også slette hele serien med alle unntak ved å klikke 'Slett serie'.",
  },
  {
    id: "12",
    question: "Hva skjer når jeg klikker på en grå celle?",
    answer: "Grå celler representerer dager eller timer som ikke er en del av din arbeidsplan. Hvis du klikker på en grå celle på en dag du ikke arbeider, får du muligheten til å legge til den dagen som arbeidsdag.",
  },
  {
    id: "13",
    question: "Kan jeg se informasjon om hvorfor en celle er rød?",
    answer: "Ja! Hold musen over en rød celle for å se tooltip-informasjon som forklarer hvorfor den er utilgjengelig. Dette kan være årsaken til engangs-utilgjengelighet, tittelen på gjentakende mønstre, eller informasjon om flyttede forekomster.",
  },
  {
    id: "14",
    question: "Hvordan påvirker mine tilgjengelighetsinnstillinger kundenes booking?",
    answer: "Kunder kan kun booke tider som vises som grønne i din kalender. Systemet beregner tilgjengelige tidslukker basert på arbeidsdager, arbeidstider, engangs-utilgjengelighet og gjentakende mønstre (inkludert unntak). Endringer vises øyeblikkelig for kunder.",
  },
];

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const filteredFaqs = helpFaqs.filter((faq) => {
    const matchesSearch =
      searchTerm === "" ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Hvordan bruke tilgjengelighetsplanleggeren</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk i spørsmål og svar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* FAQ Items */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Ingen spørsmål funnet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Vi fant ikke noen spørsmål som matcher ditt søk.
                  </p>
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Vis alle spørsmål
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredFaqs.map((faq) => (
                <Card key={faq.id}>
                  <Collapsible
                    open={openItems.includes(faq.id)}
                    onOpenChange={() => toggleItem(faq.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-left text-base">
                            {faq.question}
                          </CardTitle>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              openItems.includes(faq.id)
                                ? "transform rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}