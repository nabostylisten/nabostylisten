import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlurFade } from "@/components/magicui/blur-fade";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Sorry, something went wrong.
                </CardTitle>
              </CardHeader>
              <CardContent>
                {params?.error ? (
                  <p className="text-sm text-muted-foreground">
                    Code error: {params.error}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    An unspecified error occurred.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}
