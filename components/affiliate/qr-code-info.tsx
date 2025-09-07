import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function QRCodeInfo() {
  return (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertDescription className="text-sm leading-relaxed">
        <strong>Tips:</strong> Bruk QR-koder når du deler lenken fysisk - på
        visittkort, brosjyrer, eller når kunder står foran deg. For digital
        deling (e-post, meldinger, sosiale medier) er det enklere å kopiere
        lenken direkte.
      </AlertDescription>
    </Alert>
  );
}
