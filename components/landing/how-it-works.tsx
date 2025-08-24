import { 
  Search, 
  ShoppingCart, 
  Calendar, 
  MessageCircle, 
  ArrowRight 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlurFade } from "@/components/magicui/blur-fade";

const steps = [
  {
    number: "1",
    icon: <Search className="w-8 h-8" />,
    title: "Søk og oppdag",
    description: "Bla gjennom hundrevis av tjenester fra profesjonelle stylister i ditt område. Filtrer på kategori, pris, lokasjon og mer.",
    features: [
      "Geografisk søk med radius",
      "Kategoribasert filtrering", 
      "Pris- og tilgjengelighetsfiltre",
      "Rangering etter anmeldelser"
    ]
  },
  {
    number: "2", 
    icon: <ShoppingCart className="w-8 h-8" />,
    title: "Legg til i handlekurv",
    description: "Velg tjenester fra samme stylist og legg dem i handlekurven. Du kan bestille flere tjenester i samme avtale.",
    features: [
      "En stylist per bestilling",
      "Juster antall tjenester", 
      "Se totalpris med en gang",
      "Handlekurv lagres automatisk"
    ]
  },
  {
    number: "3",
    icon: <Calendar className="w-8 h-8" />, 
    title: "Book og betal",
    description: "Velg ønsket tid og sted for behandlingen. Betal trygt gjennom vår plattform - beløpet trekkes 24 timer før avtalen.",
    features: [
      "Interaktiv kalender med ledig tid",
      "Velg hjemme hos deg eller hos stylist",
      "Sikker betaling gjennom Stripe", 
      "Bekreftelse via e-post og SMS"
    ]
  },
  {
    number: "4",
    icon: <MessageCircle className="w-8 h-8" />,
    title: "Chat og nyt",
    description: "Kommuniser direkt med stylisten din gjennom vår innebygde chat. Del spesielle ønsker, bilder og oppfølgingsspørsmål.",
    features: [
      "Sanntidschat med bildeoverføring",
      "Avtaledetaljer og endringer",
      "Automatiske påminnelser",
      "Anmeldelser og oppfølging"
    ]
  }
];

export function HowItWorks() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold font-fraunces mb-4">
          Slik fungerer det
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Fra søk til ferdig behandling på bare fire enkle steg
        </p>
      </div>

      <div className="grid gap-8 md:gap-12">
        {steps.map((step, index) => (
          <BlurFade key={step.number} delay={index * 0.1} inView>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Step Number and Icon */}
              <div className="flex-shrink-0 relative">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center relative">
                  <div className="text-primary">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {step.number}
                  </div>
                </div>
                {/* Connecting line (except for last step) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-20 left-1/2 w-0.5 h-12 bg-border transform -translate-x-px" />
                )}
                {/* Arrow for mobile (except for last step) */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-4">
                    <ArrowRight className="w-5 h-5 text-muted-foreground transform rotate-90" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl md:text-2xl">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {step.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </BlurFade>
        ))}
      </div>

      {/* CTA */}
      <BlurFade delay={0.4} inView>
        <div className="text-center pt-8">
          <p className="text-lg text-muted-foreground mb-6">
            Klar til å prøve? Kom i gang på under 2 minutter!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Card className="p-1 bg-gradient-to-r from-primary/10 to-primary/5">
              <button className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                Se alle tjenester
                <ArrowRight className="inline-block ml-2 w-4 h-4" />
              </button>
            </Card>
          </div>
        </div>
      </BlurFade>
    </div>
  );
}