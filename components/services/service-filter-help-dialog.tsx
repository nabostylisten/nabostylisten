"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Search, ChevronDown, Filter } from "lucide-react";

interface ServiceFilterHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const helpFaqs = [
  {
    id: "1",
    question: "Hvordan søker jeg etter tjenester?",
    answer:
      "Bruk søkefeltet øverst til venstre for å søke etter tjenestenavn eller beskrivelser. Du kan for eksempel søke på 'klipp', 'farge' eller 'makeup'. Trykk Enter eller klikk 'Søk' for å starte søket.",
  },
  {
    id: "2",
    question: "Hvordan finner jeg tjenester i mitt område?",
    answer:
      "Bruk 'Søk lokasjon' feltet til høyre i søkeraden. Systemet bruker Mapbox for å finne adresser. Skriv inn by, postnummer eller full adresse. Når du velger en lokasjon, vises en radius-innstilling hvor du kan justere søkeområdet fra 1-50 km.",
  },
  {
    id: "3",
    question: "Hva gjør radius-innstillingen?",
    answer:
      "Når du har valgt en lokasjon, kan du justere hvor langt unna du vil søke etter tjenester. Standard er 10 km, men du kan endre dette fra 1-50 km. Jo større radius, jo flere tjenester vil du finne, men de kan være lengre unna.",
  },
  {
    id: "4",
    question: "Hvordan filtrerer jeg etter kategorier?",
    answer:
      "Klikk på 'Velg kategorier' for å åpne kategorivelgeren. Her kan du velge en eller flere kategorier som hår, negler, makeup osv. Systemet støtter både hovedkategorier og underkategorier. Du kan også søke i kategoriene for å finne det du leter etter raskere.",
  },
  {
    id: "5",
    question: "Hva betyr 'Hvor skal tjenesten utføres?'",
    answer:
      "Dette filteret lar deg velge om du vil at tjenesten skal utføres hjemme hos deg, hos stylisten, eller begge deler. 'Hjemme hos meg' viser kun mobile tjenester, 'Hos stylist' viser tjenester i stylistens lokaler, og 'Begge' viser alle alternativer.",
  },
  {
    id: "6",
    question: "Hvordan velger jeg spesifikke stylister?",
    answer:
      "Klikk på 'Velg stylister' for å åpne en liste over tilgjengelige stylister. Du kan velge en eller flere stylister ved å krysse av for dem. Dette er nyttig hvis du har favoritt-stylister eller vil sammenligne tjenester fra bestemte leverandører.",
  },
  {
    id: "7",
    question: "Hvordan fungerer prisfiltrering?",
    answer:
      "Klikk på 'Prisområde' for å sette minimum og maksimum pris i norske kroner. Du kan sette bare minimum (for tjenester over en viss pris), bare maksimum (for tjenester under en viss pris), eller begge for å få et spesifikt prisområde.",
  },
  {
    id: "8",
    question: "Hvilke sorteringsalternativer har jeg?",
    answer:
      "Du kan sortere tjenester på flere måter: 'Nyeste først' (standard), 'Lavest pris først', 'Høyest pris først', 'Høyest vurdering først', 'Lavest vurdering først'. Hvis du har valgt en lokasjon, får du også 'Nærmest først' som sorterer etter avstand.",
  },
  {
    id: "9",
    question: "Hva viser de fargede pillene under filtrene?",
    answer:
      "De fargede pillene viser alle aktive filtre du har valgt. Her ser du valgte kategorier, lokasjon med radius, hvor tjenesten utføres, valgte stylister og prisområde. Du kan fjerne individuelle filtre ved å klikke på X-ikonet på hver pill.",
  },
  {
    id: "10",
    question: "Hvordan fjerner jeg alle filtre?",
    answer:
      "Klikk på 'Nullstill filtre' knappen nederst til høyre (vises kun når du har aktive filtre). Dette fjerner alle filtre og tilbakestiller søket til standardinnstillinger.",
  },
  {
    id: "11",
    question: "Lagres mine filterinnstillinger?",
    answer:
      "Ja! Alle filterinnstillinger lagres i nettadressen (URL), så du kan bokmerke søk eller dele dem med andre. Når du går tilbake til siden, vil alle filtrene dine være bevart som du satte dem.",
  },
  {
    id: "12",
    question: "Hvorfor ser jeg ikke 'Nærmest først' i sortering?",
    answer:
      "'Nærmest først' sorterings-alternativet vises kun når du har valgt en spesifikk lokasjon med koordinater. Hvis du bare har skrevet inn en by-navn uten å velge fra forslagene, vil ikke avstandssortering være tilgjengelig.",
  },
  {
    id: "13",
    question: "Kan jeg kombinere flere filtre samtidig?",
    answer:
      "Ja! Du kan bruke alle filtrene samtidig for å finne nøyaktig det du leter etter. For eksempel kan du søke etter 'klipp' i Oslo innen 15 km, kun hos stylister som tilbyr tjenester hjemme hos deg, i prisklassen 500-1000 kr, sortert etter nærmeste først.",
  },
  {
    id: "14",
    question: "Hva skjer hvis ingen tjenester matcher mine filtre?",
    answer:
      "Hvis ingen tjenester matcher dine filtre, vil du se en tom liste. Prøv å justere filtrene dine - øk radius-området, fjern noen kategorier, eller utvid prisområdet. Du kan også klikke 'Nullstill filtre' for å starte på nytt.",
  },
];

export function ServiceFilterHelpDialog({
  open,
  onOpenChange,
}: ServiceFilterHelpDialogProps) {
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
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Hvordan bruke tjenestefiltrene
          </DialogTitle>
          <DialogDescription>
            Lær hvordan du bruker alle filtreringsmulighetene for å finne
            nøyaktig de tjenestene du leter etter.
          </DialogDescription>
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
