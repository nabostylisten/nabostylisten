"use client";

import { useEffect } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Calendar } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Bookinger error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <ErrorBoundary
          icon={Calendar}
          title="Bookingfeil"
          description="En feil oppstod ved lasting av booking-informasjon. Prøv å laste siden på nytt eller gå tilbake til oversikten."
          linkHref="/"
          linkText="Gå til forsiden"
          onRetry={reset}
        />
      </div>
    </div>
  );
}