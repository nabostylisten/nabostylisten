"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkUserExists } from "@/server/auth.actions";

export type AuthMode = "login" | "signup";
export type AuthStep = "email" | "code";

interface UseAuthFormProps {
  initialMode?: AuthMode;
  redirectTo?: string;
  onSuccess?: () => void;
}

export function useAuthForm({
  initialMode = "login",
  redirectTo,
  onSuccess,
}: UseAuthFormProps = {}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setPhoneNumber("");
    setOtpCode("");
    setStep("email");
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (!otpCode.trim() || otpCode.length !== 6) {
      setError("Vennligst skriv inn en 6-sifret kode");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "email",
      });

      if (error) throw error;

      setIsSuccess(true);

      // Call success callback if provided (for dialog usage)
      if (onSuccess) {
        onSuccess();
      } else {
        // For standalone pages, redirect
        router.push(redirectTo || "/");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ugyldig kode. Prøv på nytt.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    // For signup mode, validate required fields
    if (mode === "signup" && (!fullName.trim() || !phoneNumber.trim())) {
      setError("Alle feltene er påkrevd");
      setIsLoading(false);
      return;
    }

    try {
      const emailRedirectTo = `${window.location.origin}/auth/confirm?next=${
        encodeURIComponent(redirectTo || "/")
      }`;

      if (mode === "signup") {
        // For signup: Use signInWithOtp with shouldCreateUser: true to create new users
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo,
            shouldCreateUser: true,
            data: {
              full_name: fullName.trim(),
              phone_number: phoneNumber.trim(),
            },
          },
        });

        if (error) throw error;
      } else {
        // For login: First check if user exists
        const userCheck = await checkUserExists(email);
        
        if (userCheck.error) {
          throw new Error(userCheck.error);
        }
        
        if (!userCheck.exists) {
          setError("Ingen bruker funnet med denne e-posten. Vennligst registrer deg først.");
          setIsLoading(false);
          return;
        }
        
        // User exists, proceed with OTP login
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo,
            shouldCreateUser: false,
          },
        });

        if (error) throw error;
      }

      // Transition to code input step
      setStep("code");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "En feil oppstod");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    mode,
    step,
    email,
    fullName,
    phoneNumber,
    otpCode,
    error,
    isLoading,
    isSuccess,

    // Actions
    setMode,
    setStep,
    setEmail,
    setFullName,
    setPhoneNumber,
    setOtpCode,
    setError,
    setIsLoading,
    setIsSuccess,
    resetForm,
    handleModeSwitch,
    handleSubmit,
    handleVerifyOtp,
  };
}
