"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  ChevronDown,
  MessageCircle,
  Users,
  CreditCard,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const categories = [
    { id: "all", name: "Alle", icon: null },
    { id: "booking", name: "Booking", icon: <Calendar className="w-4 h-4" /> },
    {
      id: "payment",
      name: "Betaling",
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: "stylist",
      name: "For stylister",
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "general",
      name: "Generelt",
      icon: <MessageCircle className="w-4 h-4" />,
    },
  ];

  const [selectedCategory, setSelectedCategory] = useState("all");

  const faqs = [
    {
      id: "1",
      category: "booking",
      question: "Hvordan booker jeg en stylist?",
      answer:
        "Du kan enkelt booke en stylist ved å søke etter ønsket tjeneste, velge en stylist som passer deg, og følge booking-prosessen. Du trenger bare å oppgi ønsket tid, sted og eventuelle spesielle ønsker.",
    },
    {
      id: "2",
      category: "booking",
      question: "Kan jeg endre eller avbestille min booking?",
      answer:
        "Ja, du kan endre eller avbestille din booking helt gratis frem til 24 timer før avtalt tid. Ved senere avbestilling kan det påløpe gebyr. Du kan administrere dine bookinger i 'Min side'.",
    },
    {
      id: "3",
      category: "payment",
      question: "Når blir jeg belastet for tjenesten?",
      answer:
        "Betalingen trekkes automatisk 24 timer før avtalt tid. Dette sikrer at begge parter er forpliktet til avtalen og reduserer antall no-shows.",
    },
    {
      id: "4",
      category: "payment",
      question: "Hvilke betalingsmetoder godtar dere?",
      answer:
        "Vi godtar alle vanlige betalingskort (Visa, Mastercard, American Express) samt Vipps. All betaling håndteres sikkert gjennom Stripe.",
    },
    {
      id: "5",
      category: "general",
      question: "Er stylistene forsikret?",
      answer:
        "Ja, alle våre stylister må ha gyldig ansvarsforsikring før de kan tilby tjenester på plattformen. Vi verifiserer også deres utdanning og erfaring.",
    },
    {
      id: "6",
      category: "general",
      question: "Hva skjer hvis jeg ikke er fornøyd med tjenesten?",
      answer:
        "Vi tar alle klager på alvor. Kontakt vår kundeservice innen 48 timer, så hjelper vi deg med å finne en løsning. Dette kan inkludere refusjon eller ny behandling.",
    },
    {
      id: "7",
      category: "stylist",
      question: "Hvordan blir jeg stylist på plattformen?",
      answer:
        "Du kan søke om å bli stylist ved å klikke på 'Bli stylist' og fylle ut søknadsskjemaet. Vi krever relevant utdanning, erfaring og gyldig forsikring.",
    },
    {
      id: "8",
      category: "stylist",
      question: "Hvor mye tjener stylister på plattformen?",
      answer:
        "Stylister setter sine egne priser og beholder 85% av inntektene. Vi trekker 15% i plattformgebyr som dekker betalingsbehandling, markedsføring og support.",
    },
    {
      id: "9",
      category: "booking",
      question: "Kan stylisten komme hjem til meg?",
      answer:
        "Ja, mange av våre stylister tilbyr hjemmebesøk. Du kan filtrere søkeresultatene for å se hvilke stylister som kommer hjem til deg i ditt område.",
    },
    {
      id: "10",
      category: "general",
      question: "Hvordan fungerer ratingsystemet?",
      answer:
        "Etter hver fullførte tjeneste kan både kunde og stylist gi hverandre rating og anmeldelse. Dette hjelper andre brukere med å ta informerte valg og opprettholder høy kvalitet på plattformen.",
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      searchTerm === "" ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center py-16">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Ofte stilte spørsmål
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Finn svar på de mest vanlige spørsmålene om Nabostylisten
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk i spørsmål og svar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2"
              >
                {category.icon}
                {category.name}
              </Button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFaqs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-left text-lg">
                              {faq.question}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {
                                categories.find(
                                  (cat) => cat.id === faq.category
                                )?.name
                              }
                            </Badge>
                          </div>
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

          {/* Contact Section */}
          <Card className="mt-16">
            <CardHeader className="text-center">
              <CardTitle>Fant du ikke det du lette etter?</CardTitle>
              <CardDescription>
                Vårt kundeservice-team er klare til å hjelpe deg
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/contact">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Kontakt oss
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="mailto:support@nabostylisten.no">
                    Send e-post
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Vi svarer som regel innen 24 timer
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
