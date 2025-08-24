"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, ChevronDown, MessageCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { faqs, faqCategories, filterFAQs } from "@/lib/faq";
import { BlurFade } from "@/components/magicui/blur-fade";

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredFaqs = filterFAQs({
    faqs,
    category: selectedCategory,
    searchTerm,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center py-16">
            <BlurFade delay={0.1} duration={0.5} inView>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                Ofte stilte spørsmål
              </h1>
            </BlurFade>
            <BlurFade delay={0.2} duration={0.5} inView>
              <p className="text-lg text-muted-foreground mb-8">
                Finn svar på de mest vanlige spørsmålene om Nabostylisten
              </p>
            </BlurFade>

            {/* Search */}
            <BlurFade delay={0.25} duration={0.5} inView>
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk i spørsmål og svar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </BlurFade>
          </div>

          {/* Categories */}
          <BlurFade delay={0.1} duration={0.5} inView>
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {faqCategories.map((category, index) => (
                <BlurFade
                  key={category.id}
                  delay={0.1 + index * 0.05}
                  duration={0.5}
                  inView
                >
                  <Button
                    variant={
                      selectedCategory === category.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center gap-2"
                  >
                    {category.icon}
                    {category.name}
                  </Button>
                </BlurFade>
              ))}
            </div>
          </BlurFade>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFaqs.length === 0 ? (
              <BlurFade delay={0.1} duration={0.5}>
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Ingen spørsmål funnet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Vi fant ikke noen spørsmål som matcher ditt søk.
                    </p>
                    <Button variant="outline" onClick={() => setSearchTerm("")}>
                      Vis alle spørsmål
                    </Button>
                  </CardContent>
                </Card>
              </BlurFade>
            ) : (
              filteredFaqs.map((faq, index) => (
                <BlurFade key={faq.id} delay={index * 0.1} duration={0.5}>
                  <Card>
                    <Collapsible
                      open={openItems.includes(faq.id)}
                      onOpenChange={() => toggleItem(faq.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-left text-lg">
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
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                openItems.includes(faq.id)
                                  ? "transform rotate-180"
                                  : ""
                              }`}
                            />
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
                </BlurFade>
              ))
            )}
          </div>

          {/* Contact Section */}
          <BlurFade delay={0.2} duration={0.5} inView>
            <Card className="mt-16">
              <CardHeader className="text-center">
                <CardTitle>Fant du ikke det du lette etter?</CardTitle>
                <CardDescription>
                  Vårt kundeservice-team er klare til å hjelpe deg
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild>
                    <Link href="/kontakt">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Kontakt oss
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="mailto:support@nabostylisten.no">
                      Send e-post
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Vi svarer som regel innen 24 timer
                </p>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </div>
    </div>
  );
}
