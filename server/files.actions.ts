"use server";

import { createClient } from "@/lib/supabase/server";
import {
    bucketConfigs,
    generateUniqueFilename,
    storagePaths,
    validateFile,
} from "@/lib/supabase/storage";

export interface FileUploadResult {
    data: {
        path: string;
        fullPath: string;
        publicUrl?: string;
    } | null;
    error: string | null;
}

export interface FileDeleteResult {
    data: boolean | null;
    error: string | null;
}

export interface FileUrlResult {
    data: {
        url: string;
    } | null;
    error: string | null;
}

export interface FileListResult {
    data:
        | Array<{
            name: string;
            id?: string;
            size?: number;
            updated_at?: string;
            created_at?: string;
            last_accessed_at?: string;
            metadata?: Record<string, unknown>;
        }>
        | null;
    error: string | null;
}

/**
 * Upload avatar image
 */
export async function uploadAvatar({
    userId,
    file,
}: {
    userId: string;
    file: File;
}): Promise<FileUploadResult> {
    try {
        const supabase = await createClient();

        // Validate file
        const validation = validateFile(
            file,
            [...bucketConfigs.avatars.allowedTypes],
            bucketConfigs.avatars.maxSize,
        );
        if (validation) {
            return { data: null, error: validation };
        }

        // Generate unique filename
        const filename = generateUniqueFilename(file.name);
        const storagePath = storagePaths.avatar(userId, filename);

        // Upload file
        const { data, error } = await supabase.storage
            .from(storagePath.bucket)
            .upload(storagePath.path, file, {
                contentType: file.type,
                upsert: true,
            });

        if (error) {
            return { data: null, error: error.message };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(storagePath.bucket)
            .getPublicUrl(storagePath.path);

        return {
            data: {
                path: storagePath.path,
                fullPath: data.path,
                publicUrl: urlData.publicUrl,
            },
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "Unknown error occurred",
        };
    }
}

/**
 * Upload service media
 */
export async function uploadServiceMedia({
    serviceId,
    file,
}: {
    serviceId: string;
    file: File;
}): Promise<FileUploadResult> {
    try {
        const supabase = await createClient();

        // Validate file
        const validation = validateFile(
            file,
            [...bucketConfigs["service-media"].allowedTypes],
            bucketConfigs["service-media"].maxSize,
        );
        if (validation) {
            return { data: null, error: validation };
        }

        // Generate unique filename
        const filename = generateUniqueFilename(file.name);
        const storagePath = storagePaths.serviceMedia(serviceId, filename);

        // Upload file
        const { data, error } = await supabase.storage
            .from(storagePath.bucket)
            .upload(storagePath.path, file, {
                contentType: file.type,
                upsert: true,
            });

        if (error) {
            return { data: null, error: error.message };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(storagePath.bucket)
            .getPublicUrl(storagePath.path);

        return {
            data: {
                path: storagePath.path,
                fullPath: data.path,
                publicUrl: urlData.publicUrl,
            },
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "Unknown error occurred",
        };
    }
}

/**
 * Upload chat media
 */
export async function uploadChatMedia({
    chatId,
    messageId,
    file,
}: {
    chatId: string;
    messageId: string;
    file: File;
}): Promise<FileUploadResult> {
    try {
        const supabase = await createClient();

        // Validate file
        const validation = validateFile(
            file,
            [...bucketConfigs["chat-media"].allowedTypes],
            bucketConfigs["chat-media"].maxSize,
        );
        if (validation) {
            return { data: null, error: validation };
        }

        // Generate unique filename
        const filename = generateUniqueFilename(file.name);
        const storagePath = storagePaths.chatMedia(
            chatId,
            messageId,
            filename,
        );

        // Upload file
        const { data, error } = await supabase.storage
            .from(storagePath.bucket)
            .upload(storagePath.path, file, {
                contentType: file.type,
                upsert: true,
            });

        if (error) {
            return { data: null, error: error.message };
        }

        // Create signed URL for private chat media
        const { data: urlData, error: urlError } = await supabase.storage
            .from(storagePath.bucket)
            .createSignedUrl(storagePath.path, 3600); // 1 hour expiry

        if (urlError) {
            return { data: null, error: urlError.message };
        }

        return {
            data: {
                path: storagePath.path,
                fullPath: data.path,
                publicUrl: urlData.signedUrl,
            },
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "Unknown error occurred",
        };
    }
}

/**
 * Upload review media
 */
export async function uploadReviewMedia({
    reviewId,
    file,
}: {
    reviewId: string;
    file: File;
}): Promise<FileUploadResult> {
    try {
        const supabase = await createClient();

        // Validate file
        const validation = validateFile(
            file,
            [...bucketConfigs["review-media"].allowedTypes],
            bucketConfigs["review-media"].maxSize,
        );
        if (validation) {
            return { data: null, error: validation };
        }

        // Generate unique filename
        const filename = generateUniqueFilename(file.name);
        const storagePath = storagePaths.reviewMedia(reviewId, filename);

        // Upload file
        const { data, error } = await supabase.storage
            .from(storagePath.bucket)
            .upload(storagePath.path, file, {
                contentType: file.type,
                upsert: true,
            });

        if (error) {
            return { data: null, error: error.message };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(storagePath.bucket)
            .getPublicUrl(storagePath.path);

        return {
            data: {
                path: storagePath.path,
                fullPath: data.path,
                publicUrl: urlData.publicUrl,
            },
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "Unknown error occurred",
        };
    }
}

/**
 * Upload application portfolio image
 */
export async function uploadApplicationImage({
    applicationId,
    file,
}: {
    applicationId: string;
    file: File;
}): Promise<FileUploadResult> {
    try {
        const supabase = await createClient();

        // Validate file (using applications bucket config)
        const validation = validateFile(
            file,
            [...bucketConfigs.applications.allowedTypes],
            bucketConfigs.applications.maxSize,
        );
        if (validation) {
            return { data: null, error: validation };
        }

        // Generate unique filename
        const filename = generateUniqueFilename(file.name);
        const storagePath = storagePaths.application(
            applicationId,
            filename,
        );

        console.log("storagePath", storagePath);

        // Upload file
        const { data, error } = await supabase.storage
            .from(storagePath.bucket)
            .upload(storagePath.path, file, {
                contentType: file.type,
                upsert: true,
            });

        console.log("data", data);
        console.log("error", error);

        if (error) {
            return { data: null, error: error.message };
        }

        // Get public URL for application images
        const { data: urlData } = supabase.storage
            .from(storagePath.bucket)
            .getPublicUrl(storagePath.path);

        return {
            data: {
                path: data.path,
                fullPath: data.fullPath,
                publicUrl: urlData.publicUrl,
            },
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "Unknown error occurred",
        };
    }
}

export async function uploadApplicationAttachment({
    applicationId,
    file,
}: {
    applicationId: string;
    file: File;
}): Promise<FileUploadResult> {
    try {
        const supabase = await createClient();

        // Validate file
        const validation = validateFile(
            file,
            [...bucketConfigs.applications.allowedTypes],
            bucketConfigs.applications.maxSize,
        );
        if (validation) {
            return { data: null, error: validation };
        }

        // Generate unique filename
        const filename = generateUniqueFilename(file.name);
        const storagePath = storagePaths.application(
            applicationId,
            filename,
        );

        // Upload file
        const { data, error } = await supabase.storage
            .from(storagePath.bucket)
            .upload(storagePath.path, file, {
                contentType: file.type,
                upsert: true,
            });

        if (error) {
            return { data: null, error: error.message };
        }

        // Create signed URL for private application files
        const { data: urlData, error: urlError } = await supabase.storage
            .from(storagePath.bucket)
            .createSignedUrl(storagePath.path, 3600 * 24); // 24 hours expiry

        if (urlError) {
            return { data: null, error: urlError.message };
        }

        return {
            data: {
                path: storagePath.path,
                fullPath: data.path,
                publicUrl: urlData.signedUrl,
            },
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "Unknown error occurred",
        };
    }
}

/**
 * Delete a file from any bucket
 */
export async function deleteFile({
    bucket,
    path,
}: {
    bucket: string;
    path: string;
}): Promise<FileDeleteResult> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: true, error: null };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "Unknown error occurred",
        };
    }
}

/**
 * Get signed URL for private files
 */
export async function getSignedUrl({
    bucket,
    path,
    expiresIn = 3600,
}: {
    bucket: string;
    path: string;
    expiresIn?: number;
}): Promise<FileUrlResult> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);

        if (error) {
            return { data: null, error: error.message };
        }

        return {
            data: { url: data.signedUrl },
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "Unknown error occurred",
        };
    }
}

/**
 * Get public URL for public files
 */
export async function getPublicUrl({
    bucket,
    path,
}: {
    bucket: string;
    path: string;
}): Promise<FileUrlResult> {
    try {
        const supabase = await createClient();

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return {
            data: { url: data.publicUrl },
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "Unknown error occurred",
        };
    }
}

/**
 * List files in a bucket path
 */
export async function listFiles({
    bucket,
    path,
    limit = 100,
}: {
    bucket: string;
    path?: string;
    limit?: number;
}): Promise<FileListResult> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.storage
            .from(bucket)
            .list(path || "", {
                limit,
                sortBy: { column: "created_at", order: "desc" },
            });

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: data || [], error: null };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "Unknown error occurred",
        };
    }
}

/**
 * List service media files
 */
export async function listServiceMedia(
    serviceId: string,
): Promise<FileListResult> {
    return listFiles({
        bucket: "service-media",
        path: serviceId,
    });
}

/**
 * List portfolio images
 */
export async function listPortfolioImages(
    stylistId: string,
): Promise<FileListResult> {
    return listFiles({
        bucket: "portfolio",
        path: stylistId,
    });
}

/**
 * List chat media files
 */
export async function listChatMedia(chatId: string): Promise<FileListResult> {
    return listFiles({
        bucket: "chat-media",
        path: chatId,
    });
}

/**
 * List review media files
 */
export async function listReviewMedia(
    reviewId: string,
): Promise<FileListResult> {
    return listFiles({
        bucket: "review-media",
        path: reviewId,
    });
}

/**
 * Batch upload multiple files
 */
export async function batchUpload({
    files,
    uploadFn,
}: {
    files: File[];
    uploadFn: (file: File) => Promise<FileUploadResult>;
}): Promise<{
    data: FileUploadResult[] | null;
    error: string | null;
}> {
    try {
        const results = await Promise.all(files.map(uploadFn));

        // Check if any uploads failed
        const failedUploads = results.filter((result) => result.error);
        if (failedUploads.length > 0) {
            return {
                data: null,
                error: `${failedUploads.length} uploads failed: ${
                    failedUploads.map((f) => f.error).join(", ")
                }`,
            };
        }

        return {
            data: results,
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "Unknown error occurred",
        };
    }
}

/**
 * Batch delete multiple files
 */
export async function batchDelete({
    files,
}: {
    files: Array<{ bucket: string; path: string }>;
}): Promise<FileDeleteResult> {
    try {
        const results = await Promise.all(
            files.map(({ bucket, path }) => deleteFile({ bucket, path })),
        );

        // Check if any deletes failed
        const failedDeletes = results.filter((result) => result.error);
        if (failedDeletes.length > 0) {
            return {
                data: null,
                error: `${failedDeletes.length} deletes failed: ${
                    failedDeletes.map((f) => f.error).join(", ")
                }`,
            };
        }

        return {
            data: true,
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "Unknown error occurred",
        };
    }
}
