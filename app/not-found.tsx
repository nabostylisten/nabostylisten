import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 text-6xl font-bold text-muted-foreground">
            404
          </div>
          <CardTitle className="text-2xl">Side ikke funnet</CardTitle>
          <CardDescription>
            Beklager! Siden du leter etter eksisterer ikke eller har blitt
            flyttet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/">Gå til hovedsiden</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/tjenester">Se tjenester</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
