/**
 * Stylist onboarding status utility functions
 * 
 * These functions determine the current state of a stylist's onboarding process
 * and control access to platform features based on completion status.
 */

/**
 * Possible onboarding states for stylists
 */
export type StylistOnboardingStatus = 
  | "not_started"                        // No Stripe account created
  | "charges_pending"                     // Stripe account created but charges not enabled
  | "payouts_pending"                     // Charges enabled but payouts not enabled
  | "identity_verification_required"      // Basic Stripe complete, but identity verification needed
  | "identity_verification_pending"       // Identity verification started but not completed
  | "fully_verified";                     // All requirements completed

/**
 * Determine the current onboarding status for a stylist
 * 
 * @param stripeAccountStatus - Stripe account status data from getStripeAccountStatus
 * @param hasVerificationSession - Whether stylist has started identity verification
 * @param verificationCompletedAt - When identity verification was completed (if any)
 * @returns Current onboarding status
 */
export function getStylistOnboardingStatus(
  stripeAccountStatus: { charges_enabled: boolean; payouts_enabled: boolean } | null,
  hasVerificationSession: boolean,
  verificationCompletedAt: string | null
): StylistOnboardingStatus {
  // Basic Stripe checks first
  if (!stripeAccountStatus) {
    return "not_started";
  }
  
  if (!stripeAccountStatus.charges_enabled) {
    return "charges_pending";
  }
  
  if (!stripeAccountStatus.payouts_enabled) {
    return "payouts_pending";
  }

  // Identity verification checks
  if (!hasVerificationSession) {
    return "identity_verification_required";
  }
  
  if (!verificationCompletedAt) {
    return "identity_verification_pending";
  }

  return "fully_verified";
}

/**
 * Determine if a stylist can create services
 * 
 * Stylists can only create services when they are fully verified:
 * - Stripe account with charges and payouts enabled
 * - Identity verification completed
 * 
 * @param stripeAccountStatus - Stripe account status data from getStripeAccountStatus
 * @param verificationCompletedAt - When identity verification was completed (if any)
 * @returns Whether stylist can create services
 */
export function canCreateServices(
  stripeAccountStatus: { charges_enabled: boolean; payouts_enabled: boolean } | null,
  verificationCompletedAt: string | null
): boolean {
  const status = getStylistOnboardingStatus(
    stripeAccountStatus,
    !!verificationCompletedAt,
    verificationCompletedAt
  );

  return status === "fully_verified";
}

/**
 * Get user-friendly status message for the current onboarding state
 * 
 * @param status - Current onboarding status
 * @returns User-friendly message explaining the current state
 */
export function getOnboardingStatusMessage(status: StylistOnboardingStatus): string {
  switch (status) {
    case "not_started":
      return "Stripe-konto må opprettes før du kan motta betalinger.";
    
    case "charges_pending":
      return "Stripe-kontoen din er opprettet, men venter på godkjenning for å kunne motta betalinger.";
    
    case "payouts_pending":
      return "Du kan motta betalinger, men utbetalinger er ikke aktivert ennå.";
    
    case "identity_verification_required":
      return "Identitetsverifisering kreves før du kan opprette tjenester.";
    
    case "identity_verification_pending":
      return "Identitetsverifisering er startet, men ikke fullført ennå.";
    
    case "fully_verified":
      return "Kontoen din er fullt verifisert og klar for bruk!";
    
    default:
      return "Ukjent status. Kontakt support for hjelp.";
  }
}

/**
 * Get the next action needed based on current onboarding status
 * 
 * @param status - Current onboarding status
 * @returns Action description or null if no action needed
 */
export function getNextAction(status: StylistOnboardingStatus): string | null {
  switch (status) {
    case "not_started":
      return "Opprett Stripe-konto";
    
    case "charges_pending":
    case "payouts_pending":
      return "Fullfør Stripe-onboarding";
    
    case "identity_verification_required":
      return "Start identitetsverifisering";
    
    case "identity_verification_pending":
      return "Vent på verifiseringsresultat";
    
    case "fully_verified":
      return null; // No action needed
    
    default:
      return "Kontakt support";
  }
}