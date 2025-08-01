import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { ProfileLayout } from "@/components/profile-layout";

export default async function InntjeningPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const supabase = await createClient();

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Non-owners shouldn't be able to access this subpage
  if (!user || user.id !== profileId) {
    redirect(`/profiler/${profileId}`);
  }

  return (
    <ProfileLayout profileId={profileId}>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Inntjening</h1>
              <p className="text-muted-foreground mt-1">
                Oversikt over din inntjening og utbetalinger
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inntjening og utbetalinger</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Denne siden er under utvikling. Her vil du kunne se din
                inntjening, utbetalingshistorikk og skatteopplysninger.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProfileLayout>
  );
}
