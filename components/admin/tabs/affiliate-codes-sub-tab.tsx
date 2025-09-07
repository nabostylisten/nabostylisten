"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCheck, Download, Edit } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getAllAffiliateCodes,
  deactivateAffiliateCode,
  reactivateAffiliateCode,
} from "@/server/affiliate/affiliate-codes.actions";

import { AffiliateLinkDialog } from "@/components/affiliate/affiliate-link-dialog";
import type { Database } from "@/types/database.types";

type AffiliateLink = Database["public"]["Tables"]["affiliate_links"]["Row"];

interface AffiliateCode {
  id: string;
  profile_id: string;
  stylist_name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  clicks: number;
  conversions: number;
  commission_earned: number;
  expires_at?: string | null;
}

export function AffiliateCodesSubTab() {
  const [selectedAffiliate, setSelectedAffiliate] =
    useState<AffiliateLink | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: codes, isLoading } = useQuery({
    queryKey: ["affiliate-codes"],
    queryFn: () => getAllAffiliateCodes(),
  });

  const handleDeactivateCode = async (codeId: string) => {
    const result = await deactivateAffiliateCode(codeId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Partnerkode deaktivert");
      // Invalidate queries instead of refetch
      queryClient.invalidateQueries({ queryKey: ["affiliate-codes"] });
    }
  };

  const handleActivateCode = async (codeId: string) => {
    const result = await reactivateAffiliateCode(codeId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Partnerkode aktivert");
      // Invalidate queries instead of refetch
      queryClient.invalidateQueries({ queryKey: ["affiliate-codes"] });
    }
  };

  const handleEditCode = (code: AffiliateCode) => {
    // Transform AffiliateCode to AffiliateLink format
    const affiliateLink: AffiliateLink = {
      id: code.id,
      stylist_id: code.profile_id,
      application_id: "", // Will be populated from server if needed
      link_code: code.code,
      commission_percentage: 0.2, // Default, will be populated from server
      is_active: code.is_active,
      expires_at: code.expires_at || null,
      click_count: code.clicks,
      conversion_count: code.conversions,
      total_commission_earned: code.commission_earned,
      notes: null,
      created_at: code.created_at,
      updated_at: code.created_at,
    };

    setSelectedAffiliate(affiliateLink);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsEditDialogOpen(false);
    setSelectedAffiliate(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Partnerkoder</h3>
          <p className="text-sm text-muted-foreground">
            Oversikt over alle aktive partnerkoder
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Eksporter
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-10" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-6" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-20" />
                    </div>

                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-18" />
                    </div>

                    <div className="flex gap-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : codes?.data?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <UserCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen partnerkoder</h3>
              <p className="text-muted-foreground">
                Ingen partnerkoder er opprettet ennå.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {codes?.data?.map((code: AffiliateCode) => (
              <Card key={code.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{code.stylist_name}</h4>
                        <p className="text-lg font-mono font-bold text-primary">
                          {code.code}
                        </p>
                      </div>
                      <Badge variant={code.is_active ? "default" : "secondary"}>
                        {code.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Klikk</p>
                        <p className="font-semibold">{code.clicks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Konverteringer</p>
                        <p className="font-semibold">{code.conversions}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-sm">
                        Opptjent provisjon
                      </p>
                      <p className="font-semibold text-lg">
                        {code.commission_earned.toFixed(2)} NOK
                      </p>
                    </div>

                    {/* Expiration info */}
                    {code.expires_at && (
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Utløper
                        </p>
                        <p className="text-sm font-medium">
                          {new Date(code.expires_at).toLocaleDateString("no-NO")}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditCode(code)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Rediger
                      </Button>
                      {code.is_active ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDeactivateCode(code.id)}
                        >
                          Deaktiver
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleActivateCode(code.id)}
                        >
                          Aktiver
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AffiliateLinkDialog
        open={isEditDialogOpen}
        onOpenChange={handleDialogClose}
        affiliateLink={selectedAffiliate}
      />
    </div>
  );
}
