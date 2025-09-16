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
import { CurvedArrow } from "./arrows/curved-arrow";
import { WindingArrow } from "./arrows/winding-arrow";
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
    title: "Planlegg med din stylist",
    description: "Kommuniser direkte med stylisten din via chat.",
  },
];

export function HowItWorks() {
  return (
    <div className="space-y-8">
      <BlurFade delay={0.1} duration={0.5} inView>
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-fraunces mb-4">
            Slik fungerer det
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fra søk til ferdig behandling på bare fire enkle steg
          </p>
        </div>
      </BlurFade>

      <div className="space-y-6 md:space-y-2">
        {steps.map((step, index) => {
          const isEven = index % 2 === 0;
          const isLast = index === steps.length - 1;
          const everyThird = index % 3 === 0;

          return (
            <div key={step.number}>
              <BlurFade delay={0.12 + index * 0.1} duration={0.5} inView>
                <div
                  className={`flex flex-col md:flex-row items-center gap-6 md:gap-8 ${
                    !isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Step Number and Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center relative">
                      <div className="text-primary w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
                        {step.icon}
                      </div>
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                        {step.number}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <Card>
                      <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-lg sm:text-xl md:text-2xl text-center md:text-left">
                          {step.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-center md:text-left">
                          {step.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </BlurFade>

              {/* Arrow between steps (except after last step) */}
              {!isLast && (
                <BlurFade delay={0.12 + (index + 1) * 0.1} duration={0.5} inView>
                  <div
                    className={`flex justify-center my-4 md:my-2 ${
                      index % 2 === 0 ? "md:ml-12" : "md:mr-12"
                    }`}
                  >
                    {index % 2 === 0 ? (
                      <CurvedArrow
                        className="text-primary/60 h-24 md:h-full"
                        mirrored={everyThird}
                      />
                    ) : (
                      <WindingArrow
                        className="text-primary/60 h-24 md:h-full"
                        mirrored={!isEven}
                      />
                    )}
                  </div>
                </BlurFade>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <BlurFade delay={0.55} duration={0.5} inView>
        <div className="text-center pt-6 md:pt-8">
          <h3 className="text-base sm:text-lg mb-4 md:mb-6 font-fraunces px-4">
            Klar til å prøve? Kom i gang på under 2 minutter!
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
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
