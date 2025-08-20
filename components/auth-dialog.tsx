"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth";
import type { AuthMode } from "@/components/auth";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
  initialMode?: AuthMode;
  labels?: {
    loginTitle?: string;
    signupTitle?: string;
    loginDescription?: string;
    signupDescription?: string;
    loginButton?: string;
    signupButton?: string;
    loginLoadingButton?: string;
    signupLoadingButton?: string;
    switchToSignup?: string;
    switchToLogin?: string;
  };
}

export function AuthDialog({
  open,
  onOpenChange,
  redirectTo,
  initialMode = "login",
  labels = {},
}: AuthDialogProps) {
  const [currentMode, setCurrentMode] = useState<AuthMode>(initialMode);

  const defaultLabels = {
    loginTitle: "Logg inn",
    signupTitle: "Registrer deg", 
    loginDescription: "Skriv inn din e-post for å logge inn",
    signupDescription: "Opprett en ny konto",
  };

  const finalLabels = { ...defaultLabels, ...labels };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setCurrentMode(initialMode);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentMode === "login" ? finalLabels.loginTitle : finalLabels.signupTitle}
          </DialogTitle>
          <DialogDescription>
            {currentMode === "login" ? finalLabels.loginDescription : finalLabels.signupDescription}
          </DialogDescription>
        </DialogHeader>

        <AuthForm
          initialMode={currentMode}
          redirectTo={redirectTo}
          labels={labels}
          onModeChange={(newMode) => setCurrentMode(newMode)}
          onSuccess={() => {
            // Close dialog after showing success state
            setTimeout(() => {
              onOpenChange(false);
            }, 2000);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
