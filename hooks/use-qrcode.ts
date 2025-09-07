import { useState, useCallback } from "react";
import QRCode from "qrcode";

interface UseQRCodeOptions {
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

interface UseQRCodeReturn {
  generateQRCode: (text: string, options?: UseQRCodeOptions) => Promise<string>;
  downloadQRCode: (text: string, filename: string, options?: UseQRCodeOptions) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
}

export function useQRCode(): UseQRCodeReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQRCode = useCallback(async (
    text: string,
    options: UseQRCodeOptions = {}
  ): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      const qrOptions = {
        errorCorrectionLevel: options.errorCorrectionLevel || "M" as const,
        margin: options.margin || 4,
        color: {
          dark: options.color?.dark || "#000000",
          light: options.color?.light || "#FFFFFF",
        },
      };

      const dataUrl = await QRCode.toDataURL(text, qrOptions);
      return dataUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate QR code";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const downloadQRCode = useCallback(async (
    text: string,
    filename: string,
    options: UseQRCodeOptions = {}
  ): Promise<void> => {
    try {
      const dataUrl = await generateQRCode(text, options);
      
      // Create download link
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${filename}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to download QR code";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [generateQRCode]);

  return {
    generateQRCode,
    downloadQRCode,
    isGenerating,
    error,
  };
}