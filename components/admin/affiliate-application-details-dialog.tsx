"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  Megaphone,
  TrendingUp,
  Users,
  Target,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { getAffiliateApplicationById } from "@/server/affiliate/affiliate-applications.actions";

interface AffiliateApplicationDetailsDialogProps {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AffiliateApplicationDetailsDialog({
  applicationId,
  open,
  onOpenChange,
}: AffiliateApplicationDetailsDialogProps) {
  const { data: applicationData, isLoading } = useQuery({
    queryKey: ["affiliate-application-details", applicationId],
    queryFn: () => getAffiliateApplicationById(applicationId!),
    enabled: !!applicationId && open,
  });

  const application = applicationData?.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-200"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Venter
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Godkjent
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Avvist
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detaljer om partnersøknad</DialogTitle>
          <DialogDescription>
            Detaljert oversikt over partnersøknaden
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Laster søknad...</p>
            </div>
          </div>
        ) : !application ? (
          <div className="text-center py-8">
            <p>Kunne ikke laste søknad</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Application Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    Søknadsinfo
                  </div>
                  {getStatusBadge(application.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                      Stylist
                    </h4>
                    <p className="font-medium">
                      {application.stylist?.full_name}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                      E-post
                    </h4>
                    <p className="font-medium">{application.stylist?.email}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                      Søknadsdato
                    </h4>
                    <p className="font-medium">
                      {new Date(application.created_at).toLocaleDateString(
                        "no-NO",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                      Status
                    </h4>
                    <p className="font-mono">{application.status}</p>
                  </div>
                </div>

                {application.stylist?.stylist_details && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                        Informasjon om stylisten
                      </h4>
                      <div className="space-y-2">
                        {application.stylist.stylist_details.bio && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {application.stylist.stylist_details.bio}
                            </p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {application.stylist.stylist_details
                            .instagram_profile && (
                            <Badge variant="secondary">
                              Instagram:{" "}
                              {
                                application.stylist.stylist_details
                                  .instagram_profile
                              }
                            </Badge>
                          )}
                          {application.stylist.stylist_details
                            .facebook_profile && (
                            <Badge variant="secondary">
                              Facebook:{" "}
                              {
                                application.stylist.stylist_details
                                  .facebook_profile
                              }
                            </Badge>
                          )}
                          {application.stylist.stylist_details
                            .tiktok_profile && (
                            <Badge variant="secondary">
                              TikTok:{" "}
                              {
                                application.stylist.stylist_details
                                  .tiktok_profile
                              }
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Motivation Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Motivasjon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{application.reason}</p>
                </div>
              </CardContent>
            </Card>

            {/* Marketing Strategy Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5" />
                  Markedsføringsstrategi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">
                    {application.marketing_strategy}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Expectations Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Forventninger og rekkevidde
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">
                      {application.expected_referrals}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Forventede henvisninger per måned
                    </p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">
                      {application.social_media_reach?.toLocaleString("no-NO")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total antall følgere
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms Acceptance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Vilkår akseptert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Partnerbetingelser akseptert</p>
                    <p className="text-sm text-muted-foreground">
                      Akseptert:{" "}
                      {application.terms_accepted_at
                        ? new Date(
                            application.terms_accepted_at
                          ).toLocaleDateString("no-NO", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : new Date(application.created_at).toLocaleDateString(
                            "no-NO",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Information */}
            {(application.reviewed_by || application.review_notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Behandling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {application.reviewed_at && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                          Behandlet dato
                        </h4>
                        <p>
                          {new Date(application.reviewed_at).toLocaleDateString(
                            "no-NO",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    )}
                    {application.reviewed_by?.full_name && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                          Behandlet av
                        </h4>
                        <p>
                          {application.reviewed_by.full_name} (
                          {application.reviewed_by.email})
                        </p>
                      </div>
                    )}
                    {application.review_notes && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                          Merknad fra behandler
                        </h4>
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="whitespace-pre-wrap">
                            {application.review_notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
