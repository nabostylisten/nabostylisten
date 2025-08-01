import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Tjenester: [
      { name: "Hår", href: "/tjenester?category=hair" },
      { name: "Negler", href: "/tjenester?category=nails" },
      { name: "Sminke", href: "/tjenester?category=makeup" },
      { name: "Vipper & Bryn", href: "/tjenester?category=lashes-brows" },
    ],
    Selskap: [
      { name: "Om oss", href: "/about" },
      { name: "Kontakt", href: "/contact" },
      { name: "Bli stylist", href: "/bli-stylist" },
    ],
    Juridisk: [
      { name: "Personvern", href: "/privacy-policy" },
      { name: "Vilkår", href: "/terms-of-service" },
      { name: "Ofte stilte spørsmål (FAQ)", href: "/faq" },
    ],
  };

  return (
    <footer className="bg-background border-t">
      <div className="w-full max-w-none mx-auto px-6 lg:px-12 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <span className="font-bold text-xl text-primary">
                Nabostylisten
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Norges ledende platform for å booke skjønnhetstjenester hjemme
              eller på salong.
            </p>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Nabostylisten. Alle rettigheter reservert.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Personvern
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Vilkår
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
