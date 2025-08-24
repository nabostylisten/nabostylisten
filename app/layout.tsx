import type { Metadata } from "next";
import { Inter, PT_Serif, JetBrains_Mono, Fraunces } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import TanstackQueryProvider from "@/providers/tanstack-query-provider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Nabostylisten - Book din stylist hjemme",
  description:
    "Norges ledende platform for å booke skjønnhetstjenester hjemme eller på salong. Finn din perfekte stylist i dag.",
  applicationName: "Nabostylisten",
  appleWebApp: {
    title: "Nabostylisten",
    statusBarStyle: "black-translucent",
  },
};

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const ptSerif = PT_Serif({
  variable: "--font-serif",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  display: "swap",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" suppressHydrationWarning className="scroll-smooth">
      <body
        className={cn(
          ptSerif.variable,
          jetBrainsMono.variable,
          inter.variable,
          fraunces.variable,
          "antialiased"
        )}
      >
        <TanstackQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 py-16">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </TanstackQueryProvider>
      </body>
    </html>
  );
}
