import { BlurFade } from "@/components/magicui/blur-fade";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { faqCategories, getPopularFAQs } from "@/lib/faq";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";

export function FAQPreview() {
  return (
    <BlurFade delay={0.2} duration={0.5} inView>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-fraunces mb-4">
            Ofte stilte spørsmål
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Få svar på de vanligste spørsmålene om Nabostylisten
          </p>
        </div>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="booking" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="booking" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Kunde</TabsTrigger>
                <TabsTrigger value="stylist" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Stylist</TabsTrigger>
                <TabsTrigger value="general" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Generelt</TabsTrigger>
              </TabsList>
              {["booking", "stylist", "general"].map((category) => (
                <TabsContent
                  key={category}
                  value={category}
                  className="space-y-4 mt-6"
                >
                  {getPopularFAQs(category, 3).map((faq) => (
                    <Card key={faq.id}>
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <CardTitle className="text-left text-sm sm:text-base leading-tight">
                                  {faq.question}
                                </CardTitle>
                                <Badge variant="outline" className="text-xs self-start sm:self-center flex-shrink-0">
                                  {
                                    faqCategories.find(
                                      (cat) => cat.id === faq.category
                                    )?.name
                                  }
                                </Badge>
                              </div>
                              <ChevronDown className="h-4 w-4 transition-transform flex-shrink-0 mt-1 sm:mt-0" />
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0 px-3 sm:px-4 pb-3 sm:pb-4">
                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </p>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
            <div className="mt-6 text-center">
              <Button variant="outline" asChild>
                <Link href="/faq">
                  Se alle spørsmål
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </BlurFade>
  );
}