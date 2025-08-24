import { BlurFade } from "@/components/magicui/blur-fade";
import { Highlighter } from "@/components/magicui/highlighter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { brandColors } from "@/lib/brand";

export function StylistCTA() {
  return (
    <BlurFade delay={1.0} duration={0.8} inView>
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-fraunces mb-4">
            Er du vår neste stylist?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/bli-stylist">
                Søk som stylist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/faq#stylist">Les mer om å bli stylist</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </BlurFade>
  );
}
