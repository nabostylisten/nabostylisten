import { BlurFade } from "@/components/magicui/blur-fade";
import Image from "next/image";

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
        <div className="flex justify-center items-center gap-8 lg:gap-16 flex-wrap">
          <Image
            src="/publicity/e24.png"
            alt="E24"
            width={120}
            height={60}
            className="opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
          />
          <Image
            src="/publicity/elle.png"
            alt="Elle"
            width={100}
            height={60}
            className="opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
          />
          <Image
            src="/publicity/melk-og-honning.png"
            alt="Melk og Honning"
            width={140}
            height={60}
            className="opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
          />
        </div>
      </div>
    </BlurFade>
  );
}