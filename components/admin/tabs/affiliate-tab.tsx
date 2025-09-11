"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  UserCheck,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { useQuery } from "@tanstack/react-query";

import { getAffiliateMetrics } from "@/server/affiliate/affiliate-applications.actions";

import { AffiliateApplicationsSubTab } from "@/components/admin/tabs/affiliate-applications-sub-tab";
import { AffiliateCodesSubTab } from "@/components/admin/tabs/affiliate-codes-sub-tab";
import { AffiliateCommissionsSubTab } from "@/components/admin/tabs/affiliate-commissions-sub-tab";


export default function AffiliateTab() {
  const { data: metrics } = useQuery({
    queryKey: ["affiliate-metrics"],
    queryFn: getAffiliateMetrics,
  });

  return (
    <div className="space-y-6">
      <BlurFade delay={0.1} duration={0.5} inView>
        {metrics?.data && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Aktive partnere
                    </p>
                    <p className="text-2xl font-bold">
                      {metrics.data.activeAffiliates}
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Ventende søknader
                    </p>
                    <p className="text-2xl font-bold">
                      {metrics.data.pendingApplications}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total omsetning
                    </p>
                    <p className="text-2xl font-bold">
                      {metrics.data.totalRevenue.toFixed(2)} NOK
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Provisjoner</p>
                    <p className="text-2xl font-bold">
                      {metrics.data.totalCommissions.toFixed(2)} NOK
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </BlurFade>

      <BlurFade delay={0.15} duration={0.5} inView>
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="flex flex-col sm:grid sm:grid-cols-3 w-full gap-1 sm:gap-0 h-auto sm:h-10 p-1">
            <TabsTrigger value="applications" className="w-full justify-center data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Søknader</TabsTrigger>
            <TabsTrigger value="codes" className="w-full justify-center data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Partnerkoder</TabsTrigger>
            <TabsTrigger value="commissions" className="w-full justify-center data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Provisjoner</TabsTrigger>
          </TabsList>
          <TabsContent value="applications" className="mt-6">
            <AffiliateApplicationsSubTab />
          </TabsContent>
          <TabsContent value="codes" className="mt-6">
            <AffiliateCodesSubTab />
          </TabsContent>
          <TabsContent value="commissions" className="mt-6">
            <AffiliateCommissionsSubTab />
          </TabsContent>
        </Tabs>
      </BlurFade>
    </div>
  );
}
