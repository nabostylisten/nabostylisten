"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { BlurFade } from "@/components/magicui/blur-fade";

const CONTACT_INFO = {
  email: "kontakt@nabostylisten.no",
  phone: "+47 123 45 678",
  address: {
    company: "Nabostylisten AS",
    street: "Storgata 1",
    postalCode: "0001",
    city: "Oslo",
    country: "Norge",
  },
  hours: {
    weekdays: "09:00 - 17:00",
    saturday: "10:00 - 15:00",
    sunday: "Stengt",
    phoneHours: "Man-fre 09:00-17:00",
  },
  responseTime: "24 timer",
};

const KontaktPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Takk for din melding! Vi tar kontakt snart.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error(error);
      toast.error("Noe gikk galt. Vennligst prøv igjen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <BlurFade delay={0.1} duration={0.5} inView>
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                Kontakt oss
              </h1>
            </BlurFade>
            <BlurFade delay={0.2} duration={0.5} inView>
              <p className="text-lg text-muted-foreground mb-8">
                Har du spørsmål eller trenger hjelp? Vi er her for deg! Send oss
                en melding og vi svarer så fort som mulig.
              </p>
            </BlurFade>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <BlurFade delay={0.1} duration={0.5} inView>
            <Card>
            <CardHeader>
              <CardTitle>Send oss en melding</CardTitle>
              <CardDescription>
                Fyll ut skjemaet nedenfor og vi tar kontakt med deg så snart som
                mulig.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-[650px]">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col h-full gap-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Navn *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Ditt navn"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-post *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="din@email.no"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Emne *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) =>
                      handleInputChange("subject", e.target.value)
                    }
                    placeholder="Hva gjelder henvendelsen?"
                    required
                  />
                </div>

                <div className="space-y-2 flex-1 flex flex-col">
                  <Label htmlFor="message">Melding *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      handleInputChange("message", e.target.value)
                    }
                    placeholder="Skriv din melding her..."
                    className="flex-1 resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sender...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send melding
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
            </Card>
          </BlurFade>

          {/* Contact Information */}
          <BlurFade delay={0.2} duration={0.5} inView>
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-6">
                  Kontaktinformasjon
                </h2>
                <p className="text-muted-foreground mb-8">
                  Du kan også nå oss direkte via e-post eller telefon. Vi svarer
                  vanligvis innen {CONTACT_INFO.responseTime} på hverdager.
                </p>
              </div>

              <div className="space-y-6">
                <BlurFade delay={0.1} duration={0.5} inView>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">E-post</h3>
                          <Link
                            href={`mailto:${CONTACT_INFO.email}`}
                            className="text-muted-foreground hover:text-secondary"
                          >
                            {CONTACT_INFO.email}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">
                            Svarer vanligvis innen {CONTACT_INFO.responseTime}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </BlurFade>

                <BlurFade delay={0.2} duration={0.5} inView>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Phone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Telefon</h3>
                          <p className="text-muted-foreground">{CONTACT_INFO.phone}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {CONTACT_INFO.hours.phoneHours}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </BlurFade>

                <BlurFade delay={0.3} duration={0.5} inView>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Adresse</h3>
                          <p className="text-muted-foreground">
                            {CONTACT_INFO.address.company}
                            <br />
                            {CONTACT_INFO.address.street}<br />
                            {CONTACT_INFO.address.postalCode} {CONTACT_INFO.address.city}, {CONTACT_INFO.address.country}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </BlurFade>

                <BlurFade delay={0.4} duration={0.5} inView>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Åpningstider</h3>
                          <div className="text-muted-foreground space-y-1">
                            <p>Mandag - Fredag: {CONTACT_INFO.hours.weekdays}</p>
                            <p>Lørdag: {CONTACT_INFO.hours.saturday}</p>
                            <p>Søndag: {CONTACT_INFO.hours.sunday}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </BlurFade>
              </div>
            </div>
          </BlurFade>
        </div>

        <Separator className="my-12" />

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <BlurFade delay={0.1} duration={0.5} inView>
            <h2 className="text-2xl font-semibold text-center mb-8">
              Ofte stilte spørsmål
            </h2>
          </BlurFade>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BlurFade delay={0.1} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Hvordan fungerer booking?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Du kan enkelt booke tjenester ved å søke etter stylister i
                    ditt område, velge en tjeneste og tid som passer deg, og
                    betale direkte på plattformen.
                  </p>
                </CardContent>
              </Card>
            </BlurFade>

            <BlurFade delay={0.2} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Hva hvis jeg må avlyse?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Du kan avlyse bookinger opptil 24 timer før avtalen uten
                    kostnad. Avlysninger senere enn dette kan medføre gebyr.
                  </p>
                </CardContent>
              </Card>
            </BlurFade>

            <BlurFade delay={0.3} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Hvordan blir jeg stylist?
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-muted-foreground">
                    Søk om å bli stylist via vårt søknadsskjema. Vi går gjennom
                    alle søknader og tar kontakt for videre prosessering.
                  </p>
                  <Button asChild>
                    <Link href="/bli-stylist">Søk om å bli stylist</Link>
                  </Button>
                </CardContent>
              </Card>
            </BlurFade>

            <BlurFade delay={0.4} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Er betalingen sikker?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Ja, vi bruker Stripe for sikker betalingsbehandling. Alle
                    transaksjoner er krypterte og følger internasjonale
                    sikkerhetsstandarder.
                  </p>
                </CardContent>
              </Card>
            </BlurFade>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KontaktPage;
