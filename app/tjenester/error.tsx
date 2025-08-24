"use client";

import { useEffect } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Scissors } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Tjenester error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <ErrorBoundary
          icon={Scissors}
          title="Tjenestefeil"
          description="En feil oppstod ved lasting av tjenester. Prøv å laste siden på nytt eller gå tilbake til forsiden."
          linkHref="/"
          linkText="Gå til forsiden"
          onRetry={reset}
        />
      </div>
    </div>
  );
}