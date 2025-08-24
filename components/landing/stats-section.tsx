import { Suspense } from "react";
import { getPlatformStats } from "@/server/stats.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BlurFade } from "@/components/magicui/blur-fade";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Users, Package, Hash } from "lucide-react";

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[120px] rounded-lg" />
      ))}
    </div>
  );
}

async function StatsContent() {
  const { data: stats } = await getPlatformStats();

  if (!stats) {
    return null;
  }

  const statItems = [
    {
      label: "Stylister",
      value: stats.stylists,
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Tjenester",
      value: stats.services,
      icon: <Package className="w-5 h-5" />,
    },
    {
      label: "Kategorier",
      value: stats.categories,
      icon: <Hash className="w-5 h-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
      {statItems.map((stat, index) => (
        <BlurFade key={stat.label} delay={index * 0.1} inView>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <div className="text-primary">{stat.icon}</div>
              </div>
              <div className="text-3xl font-bold">
                <NumberTicker value={stat.value} />
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      ))}
    </div>
  );
}

export function StatsSection() {
  return (
    <BlurFade delay={0.7} duration={0.8} inView>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-fraunces mb-4">
            Se vårt voksende fellesskap
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Se hvordan Nabostylisten vokser og hjelper tusenvis av nordmenn
          </p>
        </div>
        <Suspense fallback={<StatsSkeleton />}>
          <StatsContent />
        </Suspense>
      </div>
    </BlurFade>
  );
}