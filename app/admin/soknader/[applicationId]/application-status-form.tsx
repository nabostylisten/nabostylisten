"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateApplicationStatus } from "@/server/application.actions";

type ApplicationStatus = "applied" | "pending_info" | "rejected" | "approved";

const getStatusBadge = (status: ApplicationStatus) => {
  const variants = {
    applied: "secondary",
    pending_info: "outline",
    approved: "default",
    rejected: "destructive",
  } as const;

  const labels = {
    applied: "Ny søknad",
    pending_info: "Venter på info",
    approved: "Godkjent",
    rejected: "Avvist",
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
};

interface ApplicationStatusFormProps {
  applicationId: string;
  currentStatus: ApplicationStatus;
}

export function ApplicationStatusForm({
  applicationId,
  currentStatus,
}: ApplicationStatusFormProps) {
  const [status, setStatus] = useState<ApplicationStatus>(currentStatus);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async () => {
    if (status === currentStatus) {
      toast.error("Status er allerede satt til denne verdien");
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateApplicationStatus({
        applicationId,
        status,
        message,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Status oppdatert");
        router.refresh();
      }
    } catch (error) {
      toast.error("En feil oppstod ved oppdatering av status");
      console.error("Error updating application status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Endre Status</CardTitle>
        <CardDescription>
          Oppdater søknadsstatus og send melding til søker
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Nåværende status</p>
          {getStatusBadge(currentStatus)}
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Ny status</p>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as ApplicationStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="applied">Ny søknad</SelectItem>
              <SelectItem value="pending_info">Venter på info</SelectItem>
              <SelectItem value="approved">Godkjent</SelectItem>
              <SelectItem value="rejected">Avvist</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">
            Melding til søker (valgfritt)
          </p>
          <Textarea
            placeholder="Skriv en melding til søkeren..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>

        <div className="pt-4">
          <Button
            onClick={handleStatusChange}
            disabled={isLoading || status === currentStatus}
            className="w-full"
          >
            {isLoading ? "Oppdaterer..." : "Oppdater status"}
          </Button>
        </div>

        {status === "approved" && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Merk:</strong> Når du godkjenner denne søknaden, vil
              brukeren få tilgang til å opprette tjenester på platformen.
            </p>
          </div>
        )}

        {status === "rejected" && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Merk:</strong> Avviste søknader kan ikke endres tilbake
              til godkjent.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
