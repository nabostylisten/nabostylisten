import { BlurFade } from "@/components/magicui/blur-fade";
import { Card } from "@/components/ui/card";
import Image from "next/image";

const mediaLogos = [
  {
    src: "/publicity/e24.png",
    alt: "E24",
    width: 120,
    height: 60,
  },
  {
    src: "/publicity/elle.png",
    alt: "Elle",
    width: 100,
    height: 60,
  },
  {
    src: "/publicity/melk-og-honning.png",
    alt: "Melk og Honning",
    width: 140,
    height: 60,
  },
];

export function MediaMentions() {
  return (
    <BlurFade delay={0.6} duration={0.8} inView>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-fraunces mb-4">
            Som omtalt i
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nabostylisten har blitt omtalt i flere av Norges ledende medier
          </p>
        </div>
        <div className="flex justify-center items-center gap-6 lg:gap-8 flex-wrap">
          {mediaLogos.map((logo, index) => (
            <Card key={logo.alt} className="p-6 bg-primary/10 w-32 h-20 flex items-center justify-center">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className="opacity-80 hover:opacity-100 transition-opacity dark:invert max-w-full max-h-full object-contain"
              />
            </Card>
          ))}
        </div>
      </div>
    </BlurFade>
  );
}
