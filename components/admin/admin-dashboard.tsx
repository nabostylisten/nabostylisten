"use client";

import { Suspense, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Users,
  Calendar,
  Package,
  DollarSign,
  Settings,
  Activity,
  UserCheck,
} from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";

// Import tab components
import OverviewTab from "./tabs/overview-tab";
import AffiliateTab from "./tabs/affiliate-tab";
import { ChartCardSkeleton } from "@/components/charts/chart-skeletons";

// Placeholder components for tabs not yet implemented
function UsersTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Brukere</h2>
        <p className="text-muted-foreground">Kunde- og styliststatistikk</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Brukeroversikt kommer snart
            </h3>
            <p className="text-muted-foreground">
              Her vil du kunne se detaljert statistikk om kunder og stylister.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BookingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bookinger</h2>
        <p className="text-muted-foreground">Bookingstatistikk og trender</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Bookingoversikt kommer snart
            </h3>
            <p className="text-muted-foreground">
              Her vil du kunne analysere bookingmønstre og trender.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ServicesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tjenester</h2>
        <p className="text-muted-foreground">Tjenestekatalog og ytelse</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Tjenesteoversikt kommer snart
            </h3>
            <p className="text-muted-foreground">
              Her vil du kunne se statistikk for alle tjenester på plattformen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RevenueTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Omsetning</h2>
        <p className="text-muted-foreground">Finansiell analyse og inntekter</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Omsetningsoversikt kommer snart
            </h3>
            <p className="text-muted-foreground">
              Her vil du kunne analysere plattformens finansielle ytelse.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OperationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Drift</h2>
        <p className="text-muted-foreground">Plattformaktivitet og drift</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Driftsoversikt kommer snart
            </h3>
            <p className="text-muted-foreground">
              Her vil du kunne overvåke plattformens driftsstatus.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
}

const tabs = [
  {
    value: "overview",
    label: "Oversikt",
    icon: BarChart3,
    component: OverviewTab,
  },
  {
    value: "affiliates",
    label: "Partnere",
    icon: UserCheck,
    component: AffiliateTab,
  },
  {
    value: "users",
    label: "Brukere",
    icon: Users,
    component: UsersTab,
  },
  {
    value: "bookings",
    label: "Bookinger",
    icon: Calendar,
    component: BookingsTab,
  },
  {
    value: "services",
    label: "Tjenester",
    icon: Package,
    component: ServicesTab,
  },
  {
    value: "revenue",
    label: "Omsetning",
    icon: DollarSign,
    component: RevenueTab,
  },
  {
    value: "operations",
    label: "Drift",
    icon: Activity,
    component: OperationsTab,
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto px-4 py-12">
      <BlurFade delay={0.1} duration={0.5} inView>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Velkommen til administrator-panelet for Nabostylisten
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.15} duration={0.5} inView>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-col sm:grid sm:grid-cols-4 lg:grid-cols-7 w-full gap-1 sm:gap-0 h-auto sm:h-auto p-1 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 w-full justify-center sm:flex-col sm:gap-1 py-2 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabs.map((tab) => {
            const Component = tab.component;
            return (
              <TabsContent key={tab.value} value={tab.value} className="mt-0">
                <Component />
              </TabsContent>
            );
          })}
        </Tabs>
      </BlurFade>
    </div>
  );
}
