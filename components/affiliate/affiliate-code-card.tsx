"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  Share2,
  Eye,
  TrendingUp,
  QrCode,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useQRCode } from "@/hooks/use-qrcode";
import { QRCodeInfo } from "@/components/affiliate/qr-code-info";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Database } from "@/types/database.types";
import { DEFAULT_PLATFORM_CONFIG } from "@/schemas/platform-config.schema";

type AffiliateCode = Database["public"]["Tables"]["affiliate_links"]["Row"];

interface AffiliateCodeCardProps {
  affiliateCode: AffiliateCode;
  clickCount: number;
  conversionCount: number;
  totalEarnings: number;
}

export function AffiliateCodeCard({
  affiliateCode,
  clickCount,
  conversionCount,
  totalEarnings,
}: AffiliateCodeCardProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const { generateQRCode, downloadQRCode, isGenerating } = useQRCode();

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://nabostylisten.no";
  const partnerLink = `${baseUrl}?code=${affiliateCode.link_code}`;

  const conversionRate =
    clickCount > 0 ? (conversionCount / clickCount) * 100 : 0;

  // Generate QR code on mount
  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await generateQRCode(partnerLink, {
          errorCorrectionLevel: "M",
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      }
    };

    generateQR();
  }, [partnerLink, generateQRCode]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(affiliateCode.link_code);
      setCopiedCode(true);
      toast.success("Partnerkode kopiert!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      toast.error("Kunne ikke kopiere kode");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(partnerLink);
      setCopiedLink(true);
      toast.success("Partnerlenke kopiert!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast.error("Kunne ikke kopiere lenke");
    }
  };

  const shareOnSocial = (platform: "instagram" | "facebook" | "tiktok") => {
    const message = `Få ${Math.round((affiliateCode.commission_percentage || DEFAULT_PLATFORM_CONFIG.fees.affiliate.defaultCommissionPercentage) * 100)}% rabatt på styling hos meg! Bruk koden ${affiliateCode.link_code} eller gå til ${partnerLink}`;

    switch (platform) {
      case "instagram":
        // Instagram doesn't support direct sharing, copy to clipboard
        navigator.clipboard.writeText(message);
        toast.success("Tekst kopiert! Lim inn i Instagram story eller post.");
        return;
      case "facebook":
        navigator.clipboard.writeText(message);
        toast.success("Tekst kopiert! Lim inn i Facebook-post.");
        return;
      case "tiktok":
        // TikTok doesn't support direct sharing, copy to clipboard
        navigator.clipboard.writeText(message);
        toast.success("Tekst kopiert! Lim inn i TikTok-beskrivelse");
        return;
    }
  };

  const handleDownloadQRCode = async () => {
    try {
      await downloadQRCode(
        partnerLink,
        `partner-qr-${affiliateCode.link_code}`,
        {
          errorCorrectionLevel: "M",
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        }
      );
      toast.success("QR-kode lastet ned!");
    } catch (error) {
      toast.error("Kunne ikke laste ned QR-kode");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Din Partnerkode
              <Badge
                variant={affiliateCode.is_active ? "default" : "secondary"}
              >
                {affiliateCode.is_active ? "Aktiv" : "Inaktiv"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Tjent totalt:{" "}
              <span className="font-semibold">
                {totalEarnings.toLocaleString("no-NO")} kr
              </span>
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {Math.round(
                (affiliateCode.commission_percentage ||
                  DEFAULT_PLATFORM_CONFIG.fees.affiliate
                    .defaultCommissionPercentage) * 100
              )}
              %
            </div>
            <div className="text-xs text-muted-foreground">provisjon</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Partner Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Partnerkode</label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-lg tracking-wider">
              {affiliateCode.link_code}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyCode}
              className="flex items-center space-x-1"
            >
              {copiedCode ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{copiedCode ? "Kopiert!" : "Kopier"}</span>
            </Button>
          </div>
        </div>

        {/* Partner Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Partnerlenke</label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm break-all">
              {partnerLink}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="flex items-center space-x-1"
            >
              {copiedLink ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{copiedLink ? "Kopiert!" : "Kopier"}</span>
            </Button>
          </div>
        </div>

        {/* QR Code */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              QR-kode for partnerlenke
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadQRCode}
              disabled={isGenerating || !qrCodeDataUrl}
              className="flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Last ned</span>
            </Button>
          </div>
          
          <QRCodeInfo />
          
          <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="QR-kode for partnerlenke"
                className="w-32 h-32 border border-border rounded"
              />
            ) : (
              <div className="w-32 h-32 border border-border rounded bg-muted animate-pulse flex items-center justify-center">
                <QrCode className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Social Media Sharing */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Del på sosiale medier
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareOnSocial("instagram")}
              className="text-xs"
            >
              Instagram
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareOnSocial("facebook")}
              className="text-xs"
            >
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareOnSocial("tiktok")}
              className="text-xs"
            >
              TikTok
            </Button>
          </div>
        </div>

        <Separator />

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <Eye className="w-5 h-5 text-blue-500" />
              {clickCount}
            </div>
            <div className="text-xs text-muted-foreground">Klikk</div>
          </div>
          <div>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <TrendingUp className="w-5 h-5 text-green-500" />
              {conversionCount}
            </div>
            <div className="text-xs text-muted-foreground">Bookinger</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {conversionRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Konvertering</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(partnerLink, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Test partnerlenke
          </Button>
        </div>

        {/* Expiration Info */}
        {affiliateCode.expires_at && (
          <div className="text-xs text-muted-foreground text-center">
            Utløper:{" "}
            {new Date(affiliateCode.expires_at).toLocaleDateString("no-NO")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
