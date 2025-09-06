"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Share2,
  MessageCircle,
  Instagram,
  Facebook,
  Video,
  Smartphone,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FaTiktok } from "react-icons/fa";

interface AffiliateInstructionsProps {
  partnerCode: string;
  commissionPercentage: number;
}

export function AffiliateInstructions({
  partnerCode,
  commissionPercentage,
}: AffiliateInstructionsProps) {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://nabostylisten.no";
  const partnerLink = `${baseUrl}?code=${partnerCode}`;

  const commissionPercent = Math.round(commissionPercentage * 100);

  const socialMediaTips: {
    platform: string;
    icon: React.ReactNode;
    tips: string[];
    example: string;
  }[] = [
    {
      platform: "Instagram",
      icon: <Instagram className="w-5 h-5" />,
      tips: [
        "Del i Stories med swipe-up eller lenke-sticker",
        "Lag før/etter-bilder av dine stylingresultater",
        "Bruk relevante hashtags som #styling #hår #skjønnhet",
        "Tag @nabostylisten for økt synlighet",
      ],
      example: `✨ Få ${commissionPercent}% rabatt på styling hos meg! ✨\n\nBook direkte med koden ${partnerCode} eller gå til linken i bio 💫\n\n#styling #hårfrisør #skjønnhet #rabatt`,
    },
    {
      platform: "TikTok",
      icon: <FaTiktok className="w-5 h-5" />,
      tips: [
        "Lag engasjerende videoer som viser dine ferdigheter",
        "Bruk trending lyder og hashtags",
        "Vis transformasjoner i korte, fengende klipp",
        "Legg til partnerkoden i videobeskrivelsen",
      ],
      example: `Glow up med meg! 💄✨ Bruk koden ${partnerCode} for ${commissionPercent}% rabatt! Book via linken i bio 🔗 #stylistlife #makeover`,
    },
    {
      platform: "Facebook",
      icon: <Facebook className="w-5 h-5" />,
      tips: [
        "Del i grupper relatert til skjønnhet og styling",
        "Opprett arrangementer for styling-tilbud",
        "Bruk Facebook Stories for øyeblikksinnhold",
        "Del kundehistorier og anmeldelser",
      ],
      example: `🌟 Spesialtilbud for mine venner! 🌟\n\nFå ${commissionPercent}% rabatt på profesjonell styling. Bruk koden ${partnerCode} når du booker.\n\nLenke: ${partnerLink}`,
    },
  ];

  const bestPractices: {
    icon: React.ReactNode;
    title: string;
    description: string;
    type: "do" | "dont";
  }[] = [
    {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      title: "Vær transparent",
      description:
        "Fortell alltid at du tjener provisjon når noen booker gjennom din kode.",
      type: "do",
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      title: "Del autentiske opplevelser",
      description: "Vis fram ditt eget arbeid og ekte kundehistorier.",
      type: "do",
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      title: "Vær konsistent",
      description: "Del partnerkoden regelmessig, men ikke spam-aktig.",
      type: "do",
    },
    {
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      title: "Ikke misled kunder",
      description:
        "Ikke lov kunden noe du ikke kan levere eller overdriv rabattens verdi.",
      type: "dont",
    },
    {
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      title: "Ikke bruk på egne tjenester",
      description:
        "Partnerkoden kan kun brukes av andre kunder, ikke deg selv.",
      type: "dont",
    },
    {
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      title: "Ikke del koden med andre stylister",
      description: "Din partnerkode er personlig og kan ikke brukes av andre.",
      type: "dont",
    },
  ];

  const howItWorksSteps: { content: React.ReactNode }[] = [
    {
      content: (
        <>
          Kunden klikker på lenken din eller bruker koden{" "}
          <code className="bg-muted px-1 rounded">{partnerCode}</code>
        </>
      ),
    },
    {
      content: <>Systemet husker at kunden kom fra deg i 30 dager</>,
    },
    {
      content: (
        <>
          Når kunden booker dine tjenester, får de automatisk{" "}
          {commissionPercent}% rabatt
        </>
      ),
    },
    {
      content: (
        <>
          Du mottar {commissionPercent}% provisjon av plattformavgiften når
          tjenesten er fullført
        </>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Slik bruker du partnerkoden din
          </CardTitle>
          <CardDescription>
            Følg disse rådene for å maksimere din provisjonsinntekt og hjelpe
            kunder med å finne gode stylingtjenester.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="font-semibold">Del med venner</div>
              <div className="text-sm text-muted-foreground">
                Start med familie og venner som stoler på deg
              </div>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="font-semibold">Bruk sosiale medier</div>
              <div className="text-sm text-muted-foreground">
                Del på Instagram, TikTok og Facebook
              </div>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="font-semibold">Følg opp resultater</div>
              <div className="text-sm text-muted-foreground">
                Sjekk statistikken og tilpass strategien din
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Hvordan fungerer det?</h4>
            <ol className="space-y-2 text-sm justify-start items-center">
              {howItWorksSteps.map((step, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="py-1">
                    {index + 1}
                  </Badge>
                  {step.content}
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sosiale medier-veiledning</CardTitle>
          <CardDescription>
            Eksempler og tips for å markedsføre på ulike plattformer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="instagram" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="tiktok">TikTok</TabsTrigger>
              <TabsTrigger value="facebook">Facebook</TabsTrigger>
            </TabsList>

            {socialMediaTips.map((platform) => (
              <TabsContent
                key={platform.platform.toLowerCase()}
                value={platform.platform.toLowerCase()}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn("p-2 rounded-md")}>{platform.icon}</div>
                  <h3 className="font-semibold">
                    Tips til {platform.platform}
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Best practices:</h4>
                    <ul className="space-y-2 text-sm">
                      {platform.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Eksempel på innlegg:</h4>
                    <div className="bg-muted p-3 rounded-lg text-sm whitespace-pre-line">
                      {platform.example}
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retningslinjer</CardTitle>
          <CardDescription>
            Viktige regler for å opprettholde et profesjonelt partnerskap
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                Dette må du gjøre
              </h4>
              <div className="space-y-3">
                {bestPractices
                  .filter((bp) => bp.type === "do")
                  .map((practice, index) => (
                    <div key={index} className="flex gap-3">
                      {practice.icon}
                      <div>
                        <div className="font-medium">{practice.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {practice.description}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                Dette skal du ikke gjøre
              </h4>
              <div className="space-y-3">
                {bestPractices
                  .filter((bp) => bp.type === "dont")
                  .map((practice, index) => (
                    <div key={index} className="flex gap-3">
                      {practice.icon}
                      <div>
                        <div className="font-medium">{practice.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {practice.description}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
