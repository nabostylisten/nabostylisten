import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Calendar, Users, Star, MapPin } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          {/* Hero Section */}
          <div className="text-center space-y-8 py-20">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold">Nabostylisten</h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Din lokale markedsplass for skjønnhetstjenester
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Koble deg sammen med profesjonelle stylister for hår, negler,
                sminke og mer - enten hjemme hos deg eller hos stylisten.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/tjenester">Se tjenester</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/bli-stylist">Bli stylist</Link>
              </Button>
            </div>
          </div>

          {/* Work in Progress Notice */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-center">🚧 Under utvikling</CardTitle>
              <CardDescription className="text-center">
                Vi jobber hardt med å lage den beste opplevelsen for deg
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </main>
  );
}
