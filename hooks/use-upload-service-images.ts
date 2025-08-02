import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
    bucketConfigs,
    storagePaths,
    uploadFile,
    validateFile,
} from "@/lib/supabase/storage";

interface UploadServiceImagesParams {
    serviceId: string;
    files: File[];
}

export const useUploadServiceImages = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ serviceId, files }: UploadServiceImagesParams) => {
            const supabase = createClient();

            const results = [];

            for (const file of files) {
                // Validate file
                const validation = validateFile(
                    file,
                    [...bucketConfigs["service-media"].allowedTypes],
                    bucketConfigs["service-media"].maxSize,
                );
                if (validation) {
                    throw new Error(validation);
                }

                // Generate storage path for new file
                const filename = `${Date.now()}-${
                    Math.random().toString(36).substring(2, 15)
                }.${file.name.split(".").pop()}`;
                const storagePath = storagePaths.serviceMedia(
                    serviceId,
                    filename,
                );

                // Upload file to storage
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
                        service_id: serviceId,
                        file_path: storagePath.path,
                        media_type: "service_image",
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
        onSuccess: () => {
            // Invalidate service queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: ["services"] });
            queryClient.invalidateQueries({ queryKey: ["service"] });
            toast.success("Bilder opplastet!");
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
