import {
  Search,
  ShoppingCart,
  Calendar,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Button } from "../ui/button";
import Link from "next/link";

const steps = [
  {
    number: "1",
    icon: <Search className="w-8 h-8" />,
    title: "Søk og oppdag",
    description: "Finn tjenester fra profesjonelle stylister i ditt område.",
  },
  {
    number: "2",
    icon: <ShoppingCart className="w-8 h-8" />,
    title: "Legg i handlekurv",
    description: "Velg tjenester fra samme stylist for én avtale.",
  },
  {
    number: "3",
    icon: <Calendar className="w-8 h-8" />,
    title: "Book og betal",
    description: "Velg tid og sted. Betal trygt gjennom plattformen.",
  },
  {
    number: "4",
    icon: <MessageCircle className="w-8 h-8" />,
    title: "Chat og nyt",
    description: "Kommuniser direkte med stylisten din via chat.",
  },
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

      <div className="space-y-12">
        {steps.map((step, index) => {
          const isEven = index % 2 === 0;

          return (
            <BlurFade key={step.number} delay={index * 0.1} inView>
              <div
                className={`flex flex-col lg:flex-row items-center gap-8 ${
                  !isEven ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Step Number and Icon */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center relative">
                    <div className="text-primary">{step.icon}</div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {step.number}
                    </div>
                  </div>
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
                    </CardContent>
                  </Card>
                </div>
              </div>
            </BlurFade>
          );
        })}
      </div>

      {/* CTA */}
      <BlurFade delay={0.4} inView>
        <div className="text-center pt-8">
          <h3 className="text-lg mb-6 font-fraunces">
            Klar til å prøve? Kom i gang på under 2 minutter!
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/tjenester">
                Se alle tjenester
                <ArrowRight className="inline-block ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </BlurFade>
    </div>
  );
}
