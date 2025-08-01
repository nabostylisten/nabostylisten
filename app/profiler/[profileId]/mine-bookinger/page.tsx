import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default async function MineBookingerPage({
  params,
}: {
  params: { profileId: string };
}) {
  const supabase = await createClient();

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Non-owners shouldn't be able to access this subpage
  if (!user || user.id !== params.profileId) {
    redirect(`/profiler/${params.profileId}`);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Mine bookinger</h1>
            <p className="text-muted-foreground mt-1">
              Oversikt over alle dine bookinger
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bookinger</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Denne siden er under utvikling. Her vil du kunne se alle dine
              bookinger, både kommende og tidligere.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
