import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Highlighter } from "@/components/magicui/highlighter";
import { ArrowRight, Quote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Default founder configuration
const DEFAULT_FOUNDER_CONFIG = {
  founderName: "Tomas Erdis",
  imageUrl: "/landing/founder.webp",
  description:
    "Som grunnlegger av Nabostylisten ønsker jeg å gjøre skjønnhetstjenester mer tilgjengelige for alle nordmenn. Min visjon er å skape en plattform som kobler profesjonelle stylister med kunder på en enkel og trygg måte.",
  ctaLink: "/om-oss",
};

interface AboutFounderProps {
  title?: string;
  description?: string;
  personName?: string;
  personTitle?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  showQuoteIcon?: boolean;
}

export function AboutFounder({
  title = "Om grunnleggeren",
  description = DEFAULT_FOUNDER_CONFIG.description,
  personName = DEFAULT_FOUNDER_CONFIG.founderName,
  personTitle = "Grunnlegger & CEO, Nabostylisten",
  imageUrl = DEFAULT_FOUNDER_CONFIG.imageUrl,
  ctaText = "Les mer om oss",
  ctaLink = DEFAULT_FOUNDER_CONFIG.ctaLink,
  showQuoteIcon = true,
}: AboutFounderProps = {}) {
  return (
    <BlurFade delay={0.1} duration={0.5} inView>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Image Section */}
            <div className="lg:w-1/3 relative">
              <div className="aspect-[4/3] sm:aspect-[4/4] lg:aspect-auto lg:h-full relative">
                <Image
                  src={imageUrl}
                  alt={personName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority={false}
                />
              </div>
            </div>

            {/* Content Section */}
            <div className="lg:w-2/3 p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
              <div className="mb-4 sm:mb-6">
                {showQuoteIcon && (
                  <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-primary dark:text-secondary mb-3 sm:mb-4" />
                )}
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-fraunces mb-3 sm:mb-4">
                  {title}
                </h2>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <blockquote className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                  {showQuoteIcon ? `"${description}"` : description}
                </blockquote>

                <div className="flex flex-col space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-3 sm:w-4 h-0.5 bg-primary flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-base sm:text-lg">{personName}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {personTitle}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-4">
                    <Button asChild size="sm" className="sm:size-default">
                      <Link href={ctaLink}>
                        {ctaText}
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
