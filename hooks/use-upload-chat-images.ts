import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import {
    bucketConfigs,
    storagePaths,
    uploadFile,
    validateFile,
    generateUniqueFilename,
    getSignedUrl,
} from "@/lib/supabase/storage";

interface UploadChatImagesParams {
    chatId: string;
    messageId?: string; // Optional - will be generated if not provided
    files: File[];
}

interface UploadedImage {
    id: string;
    file_path: string;
    url: string;
}

export const useUploadChatImages = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ chatId, messageId, files }: UploadChatImagesParams): Promise<UploadedImage[]> => {
            const supabase = createClient();

            // Get current user
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                throw new Error("Du må være logget inn for å laste opp bilder");
            }

            // Validate all files
            const config = bucketConfigs["chat-media"];
            const allowedTypes = [...config.allowedTypes] as string[];
            
            for (const file of files) {
                if (!allowedTypes.includes(file.type)) {
                    throw new Error(
                        `Filtype ${file.type} er ikke tillatt. Tillatte typer: ${allowedTypes.join(", ")}`
                    );
                }

                const validation = validateFile(file, allowedTypes, config.maxSize);
                if (validation) {
                    throw new Error(validation);
                }
            }

            const uploadedImages: UploadedImage[] = [];

            // Process each file
            for (const file of files) {
                try {
                    // Compress the image before upload
                    let compressedFile: File;
                    try {
                        compressedFile = await imageCompression(file, {
                            maxSizeMB: config.maxSize / (1024 * 1024), // Convert bytes to MB
                            maxWidthOrHeight: 1920, // Larger for chat images
                            useWebWorker: true,
                            fileType: file.type,
                        });
                    } catch (compressionError) {
                        console.error("Image compression failed:", compressionError);
                        // If compression fails, use original file
                        compressedFile = file;
                    }

                    // Generate unique filename and storage path
                    const filename = generateUniqueFilename(file.name);
                    const finalMessageId = messageId || crypto.randomUUID();
                    const storagePath = storagePaths.chatMedia(chatId, finalMessageId, filename);

                    // Upload file to storage
                    await uploadFile(supabase, {
                        bucket: storagePath.bucket,
                        path: storagePath.path,
                        file: compressedFile,
                        contentType: compressedFile.type,
                    });

                    // Create media record in database
                    const { data: mediaRecord, error: mediaError } = await supabase
                        .from("media")
                        .insert({
                            owner_id: user.id,
                            file_path: storagePath.path,
                            media_type: "chat_image",
                            chat_message_id: finalMessageId,
                        })
                        .select("id, file_path")
                        .single();

                    if (mediaError) {
                        throw new Error(`Failed to create media record: ${mediaError.message}`);
                    }

                    // Get signed URL for the uploaded image
                    const signedUrl = await getSignedUrl(supabase, storagePath.bucket, storagePath.path, 86400); // 24 hours

                    uploadedImages.push({
                        id: mediaRecord.id,
                        file_path: mediaRecord.file_path,
                        url: signedUrl,
                    });
                } catch (error) {
                    throw new Error(
                        `Upload failed for ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`
                    );
                }
            }

            return uploadedImages;
        },
        onSuccess: (uploadedImages) => {
            // Invalidate chat-related queries
            queryClient.invalidateQueries({ queryKey: ["chat", "messages"] });
            toast.success(`${uploadedImages.length} bilde${uploadedImages.length > 1 ? "r" : ""} lastet opp!`);
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