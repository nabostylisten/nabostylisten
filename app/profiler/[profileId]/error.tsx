"use client";

import { useEffect } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { UserX } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Profile detail error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <ErrorBoundary
          icon={UserX}
          title="Feil ved lasting av profil"
          description="Profilen kunne ikke lastes. Dette kan skyldes at profilen ikke finnes eller at det oppstod en teknisk feil."
          linkHref="/profiler"
          linkText="Se alle profiler"
          onRetry={reset}
        />
      </div>
    </div>
  );
}