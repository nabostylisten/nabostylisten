/**
 * Stylist onboarding status utility functions
 * 
 * These functions determine the current state of a stylist's onboarding process
 * and control access to platform features based on completion status.
 * 
 * This utility provides comprehensive verification logic that checks both Stripe API
 * and database records to ensure accurate status determination.
 */

import { getStripeAccountStatus, checkIdentityVerificationStatus } from "@/server/stripe.actions";

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
 * Comprehensive verification status returned by getStylistVerificationStatus
 */
export interface StylistVerificationStatus {
  // Overall status
  status: StylistOnboardingStatus;
  isFullyVerified: boolean;
  canCreateServices: boolean;
  shouldShowServices: boolean;
  
  // Stripe account status
  hasStripeAccount: boolean;
  stripeAccountStatus: {
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  } | null;
  
  // Identity verification status
  hasVerificationSession: boolean;
  identityVerificationComplete: boolean;
  identityVerificationStatus: string | null;
  
  // Database sync status
  databaseNeedsSync: boolean;
  
  // User-friendly messaging
  statusMessage: string;
  nextAction: string | null;
}

/**
 * Get comprehensive stylist verification status by checking both Stripe API and database
 * 
 * This is the main function that should be used for accurate status determination.
 * It checks Stripe API as the source of truth and compares with database records.
 * 
 * @param stylistDetails - Stylist details from database
 * @returns Comprehensive verification status with all relevant flags and information
 */
export async function getStylistVerificationStatus(stylistDetails: {
  stripe_account_id?: string | null;
  stripe_verification_session_id?: string | null;
  identity_verification_completed_at?: string | null;
}): Promise<StylistVerificationStatus> {
  let stripeAccountStatus = null;
  let identityVerificationStatus = null;
  let identityVerificationComplete = false;
  let databaseNeedsSync = false;

  // Check Stripe account status if account exists
  if (stylistDetails.stripe_account_id) {
    try {
      const statusResult = await getStripeAccountStatus({
        stripeAccountId: stylistDetails.stripe_account_id,
      });
      
      if (statusResult.data) {
        stripeAccountStatus = statusResult.data;
      }
    } catch (error) {
      console.error("Error fetching Stripe account status:", error);
    }
  }

  // Check identity verification status from Stripe (source of truth)
  if (stylistDetails.stripe_verification_session_id) {
    try {
      const verificationResult = await checkIdentityVerificationStatus();
      identityVerificationStatus = verificationResult.data?.status;
      
      // Check if database needs sync - Stripe says verified but DB doesn't reflect it
      if (
        identityVerificationStatus === "verified" &&
        !stylistDetails.identity_verification_completed_at
      ) {
        databaseNeedsSync = true;
      } else if (identityVerificationStatus === "verified") {
        identityVerificationComplete = true;
      }
    } catch (error) {
      console.error("Error checking identity verification status:", error);
    }
  }

  // Determine basic Stripe completion
  const basicStripeComplete = stripeAccountStatus ? 
    stripeAccountStatus.charges_enabled &&
    stripeAccountStatus.details_submitted &&
    stripeAccountStatus.payouts_enabled : false;

  // Determine overall status using existing logic
  const status = getStylistOnboardingStatus(
    stripeAccountStatus,
    !!stylistDetails.stripe_verification_session_id,
    stylistDetails.identity_verification_completed_at
  );

  // Determine derived flags
  const isFullyVerified = basicStripeComplete && identityVerificationComplete;
  const canCreateServices = isFullyVerified;
  const shouldShowServices = isFullyVerified; // Only show services for fully verified stylists

  return {
    // Overall status
    status,
    isFullyVerified,
    canCreateServices,
    shouldShowServices,
    
    // Stripe account status
    hasStripeAccount: !!stylistDetails.stripe_account_id,
    stripeAccountStatus,
    
    // Identity verification status
    hasVerificationSession: !!stylistDetails.stripe_verification_session_id,
    identityVerificationComplete,
    identityVerificationStatus,
    
    // Database sync status
    databaseNeedsSync,
    
    // User-friendly messaging
    statusMessage: getOnboardingStatusMessage(status),
    nextAction: getNextAction(status),
  };
}

/**
 * Simple boolean check for fully verified stylists
 * 
 * Use this when you only need to know if a stylist is fully verified.
 * For more detailed status information, use getStylistVerificationStatus.
 * 
 * @param stylistDetails - Stylist details from database
 * @returns True if stylist is fully verified (can create services and receive payments)
 */
export async function isStylistFullyVerified(stylistDetails: {
  stripe_account_id?: string | null;
  stripe_verification_session_id?: string | null;
  identity_verification_completed_at?: string | null;
}): Promise<boolean> {
  const status = await getStylistVerificationStatus(stylistDetails);
  return status.isFullyVerified;
}

/**
 * Determine if a stylist's services should be shown on the platform
 * 
 * This function implements the filtering logic for service visibility.
 * Only fully verified stylists should have their services visible to customers.
 * 
 * @param stylistDetails - Stylist details from database
 * @returns True if stylist's services should be visible on platform
 */
export async function shouldShowStylistServices(stylistDetails: {
  stripe_account_id?: string | null;
  stripe_verification_session_id?: string | null;
  identity_verification_completed_at?: string | null;
}): Promise<boolean> {
  const status = await getStylistVerificationStatus(stylistDetails);
  return status.shouldShowServices;
}

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