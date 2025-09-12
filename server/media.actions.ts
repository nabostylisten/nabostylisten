"use server";

import { createServiceClient } from "@/lib/supabase/service";

/**
 * Create media record using service client to bypass RLS
 */
export async function createMediaRecord({
  applicationId,
  filePath,
  mediaType,
  ownerId,
}: {
  applicationId: string;
  filePath: string;
  mediaType: "application_image";
  ownerId?: string;
}) {
  try {
    // Use service client to bypass RLS policies for media record creation
    const serviceSupabase = await createServiceClient();

    const { error: mediaError } = await serviceSupabase
      .from("media")
      .insert({
        application_id: applicationId,
        file_path: filePath,
        media_type: mediaType,
        owner_id: ownerId || null,
      });

    if (mediaError) {
      console.error("Failed to create media record:", mediaError);
      return { 
        data: null, 
        error: "Kunne ikke lagre bildeinformasjon" 
      };
    }

    return { data: true, error: null };
  } catch (error) {
    console.error("Error creating media record:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Ukjent feil oppstod",
    };
  }
}