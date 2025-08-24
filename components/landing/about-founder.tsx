import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Highlighter } from "@/components/magicui/highlighter";
import { ArrowRight, Quote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Configurable founder information
const FOUNDER_CONFIG = {
  founderName: "Tomas Erdis",
  imageUrl: "/landing/founder.webp", // Place image in /public/landing/
  description:
    "Som grunnlegger av Nabostylisten ønsker jeg å gjøre skjønnhetstjenester mer tilgjengelige for alle nordmenn. Min visjon er å skape en plattform som kobler profesjonelle stylister med kunder på en enkel og trygg måte.",
  ctaLink: "/om-oss",
};

export function AboutFounder() {
  return (
    <BlurFade delay={0.1} duration={0.5} inView>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Image Section */}
            <div className="lg:w-1/3 relative">
              <div className="aspect-[4/5] lg:aspect-auto lg:h-full relative">
                <Image
                  src={FOUNDER_CONFIG.imageUrl}
                  alt={FOUNDER_CONFIG.founderName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={false}
                />
              </div>
            </div>

            {/* Content Section */}
            <div className="lg:w-2/3 p-8 lg:p-12 flex flex-col justify-center">
              <div className="mb-6">
                <Quote className="w-8 h-8 text-primary dark:text-secondary mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold font-fraunces mb-4">
                  Om grunnleggeren
                </h2>
              </div>

              <div className="space-y-6">
                <blockquote className="text-lg leading-relaxed text-muted-foreground italic">
                  "{FOUNDER_CONFIG.description}"
                </blockquote>

                <div className="flex flex-col space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-0.5 bg-primary"></div>
                    <div>
                      <p className="font-semibold text-lg">
                        {FOUNDER_CONFIG.founderName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Grunnlegger & CEO, Nabostylisten
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button asChild>
                      <Link href={FOUNDER_CONFIG.ctaLink}>
                        Les mer om oss
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </BlurFade>
  );
}
