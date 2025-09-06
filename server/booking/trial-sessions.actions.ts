"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Calculate the optimal trial session time for a given main booking time
 * Maintains relative timing and provides the calculated time
 */
export async function calculateOptimalTrialSessionTime({
    originalMainStart,
    originalTrialStart,
    originalTrialEnd,
    newMainStart,
}: {
    originalMainStart: string;
    originalTrialStart: string;
    originalTrialEnd: string;
    newMainStart: string;
}) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return { error: "User not authenticated", data: null };
    }

    // Calculate original time difference and duration
    const originalMainDate = new Date(originalMainStart);
    const originalTrialDate = new Date(originalTrialStart);
    const originalTrialEndDate = new Date(originalTrialEnd);
    const newMainDate = new Date(newMainStart);
    
    // Validate input dates
    if (isNaN(originalMainDate.getTime()) || isNaN(originalTrialDate.getTime()) || 
        isNaN(originalTrialEndDate.getTime()) || isNaN(newMainDate.getTime())) {
        console.error("Invalid input dates:", {
            originalMainStart,
            originalTrialStart,
            originalTrialEnd,
            newMainStart
        });
        return {
            error: "Ugyldig dato oppgitt for beregning",
            data: null,
        };
    }
    
    const timeDifference = originalMainDate.getTime() - originalTrialDate.getTime();
    const trialDuration = originalTrialEndDate.getTime() - originalTrialDate.getTime();
    
    // Calculate ideal trial session time (maintaining same relative timing)
    const idealTrialStart = new Date(newMainDate.getTime() - timeDifference);
    const idealTrialEnd = new Date(idealTrialStart.getTime() + trialDuration);
    
    // Validate calculated dates
    if (isNaN(idealTrialStart.getTime()) || isNaN(idealTrialEnd.getTime())) {
        console.error("Invalid calculated dates:", {
            newMainDate: newMainDate.toISOString(),
            timeDifference,
            trialDuration,
            idealTrialStart: idealTrialStart.toString(),
            idealTrialEnd: idealTrialEnd.toString()
        });
        return {
            error: "Kunne ikke beregne nytt tidspunkt for prøvetime",
            data: null,
        };
    }
    
    // Validate basic constraints
    const now = new Date();
    const hoursBeforeMain = (newMainDate.getTime() - idealTrialEnd.getTime()) / (1000 * 60 * 60);
    
    // Check if calculated time meets basic requirements
    if (idealTrialStart <= now) {
        return {
            error: "Den beregnede prøvetiden ville være i fortiden. Hovedbookingen må flyttes til et senere tidspunkt.",
            data: null,
        };
    }
    
    if (hoursBeforeMain < 24) {
        return {
            error: "Den beregnede prøvetiden ville være for nær hovedbookingen. Hovedbookingen må flyttes til et senere tidspunkt.",
            data: null,
        };
    }
    
    // Return the calculated times - the actual availability check will happen during booking update
    return {
        data: {
            start: idealTrialStart.toISOString(),
            end: idealTrialEnd.toISOString(),
            isIdealTime: true, // We're maintaining relative timing
        },
        error: null,
    };
}