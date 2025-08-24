import { Suspense } from "react";
import { DeleteAccountConfirmation } from "./delete-account-confirmation";
import { BlurFade } from "@/components/magicui/blur-fade";

export default function DeleteAccountConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <BlurFade delay={0.1} duration={0.5} inView>
          <Suspense fallback={
            <div className="text-center">
              <p className="text-muted-foreground">Laster...</p>
            </div>
          }>
            <DeleteAccountConfirmation />
          </Suspense>
        </BlurFade>
      </div>
    </div>
  );
}