"use client";

import { useState } from "react";
import { X, Gift, Info, User, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AffiliateDiscountBannerProps {
  stylistName: string;
  affiliateCode: string;
  discountAmount: number;
  applicableServices: string[];
  isAutoApplied: boolean;
  nonApplicableReason?: string;
  onDismiss?: () => void;
}

export function AffiliateDiscountBanner({
  stylistName,
  affiliateCode,
  discountAmount,
  applicableServices,
  isAutoApplied,
  nonApplicableReason,
  onDismiss,
}: AffiliateDiscountBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Show informational banner when code exists but cannot be applied
  if (nonApplicableReason) {
    return (
      <Card className="border-muted bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Partnerkoden til {stylistName} har allerede blitt brukt.
              </p>
            </div>

            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full shrink-0">
            <Gift className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    {isAutoApplied
                      ? "Rabatt automatisk påført!"
                      : "Partnerkode funnet!"}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800"
                  >
                    {discountAmount.toLocaleString("no-NO")} kr rabatt
                  </Badge>
                </div>

                <p className="text-sm text-green-700 dark:text-green-300">
                  Du får rabatt på tjenester fra{" "}
                  <span className="font-semibold inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {stylistName}
                  </span>{" "}
                  med koden{" "}
                  <code className="bg-green-100 dark:bg-green-900/50 px-1.5 py-0.5 rounded text-xs font-mono">
                    {affiliateCode}
                  </code>
                </p>
              </div>

              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/50"
                >
                  <X className="w-4 h-4 text-green-600 dark:text-green-400" />
                </Button>
              )}
            </div>

            {applicableServices.length > 0 && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-normal text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 hover:bg-transparent"
                  >
                    <Info className="w-4 h-4 mr-1" />
                    {isExpanded
                      ? "Skjul detaljer"
                      : `Se hvilke tjenester (${applicableServices.length})`}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-2">
                  <div className="bg-white/60 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                    <h4 className="text-xs font-semibold text-green-800 dark:text-green-200 mb-2 uppercase tracking-wide">
                      Tjenester med rabatt:
                    </h4>
                    <div className="space-y-1">
                      {applicableServices.slice(0, 5).map((service, index) => (
                        <div
                          key={index}
                          className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1"
                        >
                          <div className="w-1 h-1 bg-green-500 dark:bg-green-400 rounded-full"></div>
                          {service}
                        </div>
                      ))}
                      {applicableServices.length > 5 && (
                        <div className="text-xs text-green-600 dark:text-green-400 italic">
                          + {applicableServices.length - 5} flere tjenester
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {isAutoApplied && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800 mt-2">
                <AlertDescription className="text-green-700 dark:text-green-300 text-sm">
                  Rabatten er allerede trukket fra totalsummen din. Ingen ekstra
                  handling nødvendig!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AffiliateAttributionInfoProps {
  stylistName: string;
  affiliateCode: string;
  daysRemaining: number;
}

export function AffiliateAttributionInfo({
  stylistName,
  affiliateCode,
  daysRemaining,
}: AffiliateAttributionInfoProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">Du har en partnerkode aktiv</p>
          <p>
            Koden{" "}
            <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">
              {affiliateCode}
            </code>{" "}
            fra <span className="font-semibold">{stylistName}</span> er aktiv i{" "}
            {daysRemaining} dager til. Book tjenester fra {stylistName} for å få
            rabatt automatisk!
          </p>
        </div>
      </div>
    </div>
  );
}

interface ManualCodeEntryProps {
  onCodeSubmit: (code: string) => void;
  isValidating?: boolean;
  error?: string;
}

export function ManualAffiliateCodeEntry({
  onCodeSubmit,
  isValidating,
  error,
}: ManualCodeEntryProps) {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onCodeSubmit(code.trim().toUpperCase());
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Partnerkode (f.eks. ANNA-2024-ABC123)"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={isValidating}
        />
        <Button type="submit" size="sm" disabled={!code.trim() || isValidating}>
          {isValidating ? "Sjekker..." : "Bruk kode"}
        </Button>
      </form>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-2">
          {error}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Har du fått en partnerkode fra en stylist? Skriv den inn her for rabatt.
      </div>
    </div>
  );
}
