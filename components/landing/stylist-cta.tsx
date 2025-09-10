import { BlurFade } from "@/components/magicui/blur-fade";
import { Highlighter } from "@/components/magicui/highlighter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { brandColors } from "@/lib/brand";

export function StylistCTA() {
  return (
    <BlurFade delay={0.25} duration={0.5} inView>
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6 sm:p-8 md:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-fraunces mb-3 sm:mb-4">
            Er du vår neste stylist?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            Bli en del av Norges raskest voksende plattform for
            skjønnhetstjenester. Start din egen virksomhet med{" "}
            <Highlighter
              action="underline"
              color={brandColors.dark.secondary}
              animationDuration={1500}
            >
              full fleksibilitet
            </Highlighter>{" "}
            og støtte fra oss.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/bli-stylist">
                Bli stylist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </BlurFade>
  );
}
