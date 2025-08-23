import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { sendWelcomeEmail } from "@/server/auth.actions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  console.log("[AUTH_CONFIRM] Starting OTP verification", {
    hasTokenHash: !!token_hash,
    type,
    next,
  });

  if (token_hash && type) {
    const supabase = await createClient();

    console.log("[AUTH_CONFIRM] Verifying OTP with Supabase");
    const { error, data } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      console.log("[AUTH_CONFIRM] OTP verification successful", {
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmedAt: data.user?.email_confirmed_at,
      });

      // Check if this is a new user (just confirmed their email)
      if (data.user && data.user.email_confirmed_at) {
        console.log(
          "[AUTH_CONFIRM] User has confirmed email, checking profile",
        );

        // Get user profile to check if welcome email should be sent
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, role, created_at")
          .eq("id", data.user.id)
          .single();

        console.log("[AUTH_CONFIRM] Profile query result", {
          hasProfile: !!profile,
          profileError: profileError?.message,
          profile: profile
            ? {
              role: profile.role,
              fullName: profile.full_name,
              createdAt: profile.created_at,
            }
            : null,
        });

        if (!profile || !data.user.email) {
          console.error("[AUTH_CONFIRM] Missing profile or email", {
            hasProfile: !!profile,
            hasEmail: !!data.user.email,
            userId: data.user.id,
          });
          redirect(next);
        }

        // Only send welcome email if the account was recently created (within last hour to handle verification delays)
        const accountAge = Date.now() - new Date(profile.created_at).getTime();
        const oneHourMs = 60 * 60 * 1000;

        console.log("[AUTH_CONFIRM] Checking account age", {
          accountAge: accountAge,
          oneHourMs: oneHourMs,
          withinHour: accountAge < oneHourMs,
          role: profile.role,
        });

        if (accountAge < oneHourMs) {
          console.log("[AUTH_CONFIRM] Account is new, sending welcome email", {
            email: data.user.email,
            userName: profile.full_name || "undefined",
          });

          // Send welcome email asynchronously (don't wait for it)
          await sendWelcomeEmail({
            email: data.user.email,
            userName: profile.full_name || undefined,
            userId: data.user.id,
          }).catch((error) => {
            console.error(
              "[AUTH_CONFIRM] Failed to send welcome email:",
              error,
            );
          });
        } else {
          console.log("[AUTH_CONFIRM] Account too old for welcome email", {
            accountAgeMinutes: Math.round(accountAge / (1000 * 60)),
          });
        }
      } else {
        console.log(
          "[AUTH_CONFIRM] User email not confirmed or missing user data",
        );
      }

      console.log("[AUTH_CONFIRM] Redirecting to:", next);
      // redirect user to specified redirect URL or root of app
      redirect(next);
    } else {
      console.error("[AUTH_CONFIRM] OTP verification failed:", error.message);
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${error?.message}`);
    }
  }

  console.log(
    "[AUTH_CONFIRM] Missing token hash or type, redirecting to error",
  );
  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No token hash or type`);
}
