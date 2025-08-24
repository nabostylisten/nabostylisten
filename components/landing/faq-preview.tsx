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
          <CardContent className="p-6">
            <Tabs defaultValue="booking" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="booking">Kunde</TabsTrigger>
                <TabsTrigger value="stylist">Stylist</TabsTrigger>
                <TabsTrigger value="general">Generelt</TabsTrigger>
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
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CardTitle className="text-left text-base">
                                  {faq.question}
                                </CardTitle>
                                <Badge variant="outline" className="text-xs">
                                  {
                                    faqCategories.find(
                                      (cat) => cat.id === faq.category
                                    )?.name
                                  }
                                </Badge>
                              </div>
                              <ChevronDown className="h-4 w-4 transition-transform" />
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <p className="text-muted-foreground leading-relaxed">
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