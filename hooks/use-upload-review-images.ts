import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import {
    bucketConfigs,
    storagePaths,
    uploadFile,
    validateFile,
} from "@/lib/supabase/storage";
import { useAuth } from "./use-auth";

interface UploadReviewImagesParams {
    reviewId: string;
    files: File[];
}

export const useUploadReviewImages = () => {
    const queryClient = useQueryClient();
    const { profile } = useAuth();

    const mutation = useMutation({
        mutationFn: async ({ reviewId, files }: UploadReviewImagesParams) => {
            const supabase = createClient();

            if (!profile) {
                throw new Error("Du må være logget inn for å opplaste bilder");
            }

            const results = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // Validate original file type
                const allowedTypes = [
                    ...bucketConfigs["review-media"].allowedTypes,
                ] as string[];
                if (!allowedTypes.includes(file.type)) {
                    throw new Error(
                        `File type ${file.type} is not allowed. Allowed types: ${
                            allowedTypes.join(", ")
                        }`,
                    );
                }

                // Compress the image before upload
                let compressedFile: File;
                try {
                    compressedFile = await imageCompression(file, {
                        maxSizeMB: bucketConfigs["review-media"].maxSize /
                            (1024 * 1024), // Convert bytes to MB
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                        fileType: file.type,
                    });
                } catch (compressionError) {
                    console.error(
                        "Image compression failed:",
                        compressionError,
                    );
                    // If compression fails, use original file but validate size
                    const validation = validateFile(
                        file,
                        allowedTypes,
                        bucketConfigs["review-media"].maxSize,
                    );
                    if (validation) {
                        throw new Error(validation);
                    }
                    compressedFile = file;
                }

                // Generate storage path for new file
                const filename = `${Date.now()}-${
                    Math.random().toString(36).substring(2, 15)
                }.${compressedFile.name.split(".").pop()}`;
                const storagePath = storagePaths.reviewMedia(
                    reviewId,
                    filename,
                );

                // Upload compressed file to storage
                await uploadFile(supabase, {
                    bucket: storagePath.bucket,
                    path: storagePath.path,
                    file: compressedFile,
                    contentType: compressedFile.type,
                });

                // Get public URL for the new file
                const { data: urlData } = supabase.storage
                    .from(storagePath.bucket)
                    .getPublicUrl(storagePath.path);

                // Create new media record
                const { data: mediaData, error: mediaError } = await supabase
                    .from("media")
                    .insert({
                        review_id: reviewId,
                        file_path: storagePath.path,
                        media_type: "review_image",
                        is_preview_image: false,
                        owner_id: profile.id,
                    })
                    .select()
                    .single();

                if (mediaError) {
                    throw new Error(
                        `Failed to create media record: ${mediaError.message}`,
                    );
                }

                results.push({
                    ...mediaData,
                    publicUrl: urlData.publicUrl,
                });
            }

            return results;
        },
        onSuccess: (data) => {
            // Invalidate review queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
            queryClient.invalidateQueries({ queryKey: ["review"] });
            toast.success(`${data.length} bilde(r) lastet opp!`);
        },
        onError: (error) => {
            toast.error("Feil ved opplasting av bilder: " + error.message);
        },
    });

    return {
        ...mutation,
        // Expose loading state for components to use
        isUploading: mutation.isPending,
    };
};