import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
    bucketConfigs,
    deleteFile,
    storagePaths,
    uploadFile,
    validateFile,
} from "@/lib/supabase/storage";

interface UploadAvatarParams {
    userId: string;
    file: File;
}

export const useUploadAvatar = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ userId, file }: UploadAvatarParams) => {
            const supabase = createClient();

            // Validate file
            const validation = validateFile(
                file,
                [...bucketConfigs.avatars.allowedTypes],
                bucketConfigs.avatars.maxSize,
            );
            if (validation) {
                throw new Error(validation);
            }

            // First, get the existing avatar media record to delete the old file
            const { data: existingMedia } = await supabase
                .from("media")
                .select("file_path")
                .eq("owner_id", userId)
                .eq("media_type", "avatar")
                .single();

            // Delete existing file from storage if it exists
            if (existingMedia?.file_path) {
                try {
                    await deleteFile(
                        supabase,
                        "avatars",
                        existingMedia.file_path,
                    );
                } catch (error) {
                    console.error(
                        "Error deleting existing avatar file:",
                        error,
                    );
                    // Don't throw here, continue with upload
                }
            }

            // Delete existing avatar media record if it exists
            const { error: deleteError } = await supabase
                .from("media")
                .delete()
                .eq("owner_id", userId)
                .eq("media_type", "avatar");

            if (deleteError && deleteError.code !== "PGRST116") {
                console.error(
                    "Error deleting existing avatar record:",
                    deleteError,
                );
                // Don't throw here, continue with upload
            }

            // Generate storage path for new file
            const filename = `${Date.now()}-${
                Math.random().toString(36).substring(2, 15)
            }.${file.name.split(".").pop()}`;
            const storagePath = storagePaths.avatar(userId, filename);

            // Upload new file to storage
            await uploadFile(supabase, {
                bucket: storagePath.bucket,
                path: storagePath.path,
                file,
                contentType: file.type,
            });

            // Get public URL for the new file
            const { data: urlData } = supabase.storage
                .from(storagePath.bucket)
                .getPublicUrl(storagePath.path);

            // Create new media record
            const { data: mediaData, error: mediaError } = await supabase
                .from("media")
                .insert({
                    owner_id: userId,
                    file_path: storagePath.path,
                    media_type: "avatar",
                })
                .select()
                .single();

            if (mediaError) {
                throw new Error(
                    `Failed to create media record: ${mediaError.message}`,
                );
            }

            return {
                ...mediaData,
                publicUrl: urlData.publicUrl,
            };
        },
        onSuccess: () => {
            // Invalidate the user avatar query to refresh the UI
            queryClient.invalidateQueries({ queryKey: ["user", "avatar"] });
            // Also invalidate profile queries in case they're used elsewhere
            queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            toast.success("Profilbilde oppdatert!");
        },
        onError: (error) => {
            toast.error("Feil ved opplasting av profilbilde: " + error.message);
        },
    });

    return {
        ...mutation,
        // Expose loading state for components to use
        isUploading: mutation.isPending,
    };
};
