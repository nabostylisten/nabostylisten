"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthForm, type AuthMode } from "./use-auth-form";

interface AuthFormProps {
  initialMode?: AuthMode;
  redirectTo?: string;
  onSuccess?: () => void;
  onModeChange?: (mode: AuthMode) => void;
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

export function AuthForm({
  initialMode = "login",
  redirectTo,
  onSuccess,
  onModeChange,
  labels = {},
}: AuthFormProps) {
  const {
    mode,
    step,
    email,
    fullName,
    phoneNumber,
    otpCode,
    error,
    isLoading,
    isSuccess,
    setEmail,
    setFullName,
    setPhoneNumber,
    setOtpCode,
    setStep,
    setIsSuccess,
    handleModeSwitch,
    handleSubmit,
    handleVerifyOtp,
  } = useAuthForm({ initialMode, redirectTo, onSuccess });

  const defaultLabels = {
    loginTitle: "Logg inn",
    signupTitle: "Registrer deg",
    loginDescription: "Skriv inn din e-post for å logge inn på kontoen din",
    signupDescription: "Opprett en ny konto med e-post-bekreftelse",
    loginButton: "Send påloggingslenke",
    signupButton: "Send bekreftelseslenke",
    loginLoadingButton: "Sender påloggingslenke...",
    signupLoadingButton: "Oppretter konto...",
    switchToSignup: "Opprett ny konto",
    switchToLogin: "Logg inn med eksisterende konto",
  };

  const finalLabels = { ...defaultLabels, ...labels };

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-4 text-center py-4">
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
          <p className="text-sm text-green-800 dark:text-green-200">
            Du er nå logget inn!
          </p>
          <p className="mt-2 text-xs text-green-600 dark:text-green-400">
            Omdirigerer deg...
          </p>
        </div>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Vi har sendt en 6-sifret kode til
          </p>
          <p className="font-medium">{email}</p>
          <p className="text-sm text-muted-foreground">
            Skriv inn koden eller klikk på lenken i e-posten
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="otp-code">Bekreftelseskode</Label>
            <Input
              id="otp-code"
              type="text"
              placeholder="123456"
              required
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-lg tracking-widest"
              autoComplete="one-time-code"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Bekrefter..." : "Bekreft kode"}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs uppercase text-muted-foreground">eller</span>
          <Separator className="flex-1" />
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={() => {
              setStep("email");
              setOtpCode("");
            }}
            className="w-full"
          >
            Tilbake til e-post
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              const newMode = mode === "login" ? "signup" : "login";
              handleModeSwitch(newMode);
              onModeChange?.(newMode);
            }}
            className="w-full"
            size="sm"
          >
            {mode === "login"
              ? finalLabels.switchToSignup
              : finalLabels.switchToLogin}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="grid gap-2">
            <Label htmlFor="full-name">Fullt navn</Label>
            <Input
              id="full-name"
              type="text"
              placeholder="Ola Nordmann"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            type="email"
            placeholder="ola@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {mode === "signup" && (
          <div className="grid gap-2">
            <Label htmlFor="phone-number">Telefonnummer</Label>
            <Input
              id="phone-number"
              type="tel"
              placeholder="+47 123 45 678"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading
            ? mode === "login"
              ? finalLabels.loginLoadingButton
              : finalLabels.signupLoadingButton
            : mode === "login"
              ? finalLabels.loginButton
              : finalLabels.signupButton}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase text-muted-foreground">eller</span>
        <Separator className="flex-1" />
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep("code")}
          className="w-full"
        >
          Har du allerede mottatt en kode?
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            const newMode = mode === "login" ? "signup" : "login";
            handleModeSwitch(newMode);
            onModeChange?.(newMode);
          }}
          className="w-full"
          size="sm"
        >
          {mode === "login"
            ? finalLabels.switchToSignup
            : finalLabels.switchToLogin}
        </Button>
      </div>
    </div>
  );
}
