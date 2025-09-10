import type { SupabaseClient } from "@supabase/supabase-js";

export interface UploadOptions {
    bucket: string;
    path: string;
    file: File;
    contentType?: string;
}

export interface StoragePath {
    bucket: string;
    path: string;
}

/**
 * Generate storage paths for different file types
 */
export const storagePaths = {
    // User avatars
    avatar: (userId: string, filename: string): StoragePath => ({
        bucket: "avatars",
        path: `${userId}/${filename}`,
    }),

    // Chat media
    chatMedia: (
        chatId: string,
        messageId: string,
        filename: string,
    ): StoragePath => ({
        bucket: "chat-media",
        path: `${chatId}/${messageId}/${filename}`,
    }),

    // Landing page media
    landingMedia: (filename: string): StoragePath => ({
        bucket: "landing-media",
        path: filename,
    }),

    // General assets
    asset: (filename: string): StoragePath => ({
        bucket: "assets",
        path: filename,
    }),

    // Service media
    serviceMedia: (serviceId: string, filename: string): StoragePath => ({
        bucket: "service-media",
        path: `${serviceId}/${filename}`,
    }),

    // Review media
    reviewMedia: (reviewId: string, filename: string): StoragePath => ({
        bucket: "review-media",
        path: `${reviewId}/${filename}`,
    }),

    // Application attachments
    application: (applicationId: string, filename: string): StoragePath => ({
        bucket: "applications",
        path: `${applicationId}/${filename}`,
    }),

    // Booking note media
    bookingNoteMedia: (
        bookingId: string,
        noteId: string,
        filename: string,
    ): StoragePath => ({
        bucket: "booking-note-media",
        path: `${bookingId}/${noteId}/${filename}`,
    }),
};

/**
 * Upload a file to Supabase storage
 */
export async function uploadFile(
    supabase: SupabaseClient,
    { bucket, path, file, contentType }: UploadOptions,
) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            contentType: contentType || file.type,
            upsert: true,
        });

    if (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }

    return data;
}

/**
 * Get a public URL for a file (for public buckets)
 */
export function getPublicUrl(
    supabase: SupabaseClient,
    bucket: string,
    path: string,
) {
    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

    return data.publicUrl;
}

/**
 * Get a signed URL for a file (for private buckets)
 */
export async function getSignedUrl(
    supabase: SupabaseClient,
    bucket: string,
    path: string,
    expiresIn: number = 3600,
) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

    if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
    supabase: SupabaseClient,
    bucket: string,
    path: string,
) {
    const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

    if (error) {
        throw new Error(`Delete failed: ${error.message}`);
    }
}

/**
 * List files in a bucket
 */
export async function listFiles(
    supabase: SupabaseClient,
    bucket: string,
    path?: string,
) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .list(path || "");

    if (error) {
        throw new Error(`List failed: ${error.message}`);
    }

    return data;
}

/**
 * Download a file
 */
export async function downloadFile(
    supabase: SupabaseClient,
    bucket: string,
    path: string,
) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

    if (error) {
        throw new Error(`Download failed: ${error.message}`);
    }

    return data;
}

/**
 * Helper function to extract bucket and path from file_path stored in database
 * File paths are stored without bucket prefix, just as: "id/filename.ext" or "id1/id2/filename.ext"
 * We need to determine the bucket based on the path pattern or context
 */
export function parseFilePath(
    filePath: string,
): { bucket: string; path: string } {
    // For application images, the path format is: "applicationId/filename.ext"
    // For service images, the path format is: "serviceId/filename.ext"
    // For chat images, the path format is: "chatId/messageId/filename.ext"
    // For review images, the path format is: "reviewId/filename.ext"
    // For booking note images, the path format is: "bookingId/noteId/filename.ext"
    
    // Count the number of segments in the path
    const segments = filePath.split("/");
    
    // If the path starts with a known bucket name, extract it
    const knownBuckets = ["avatars", "chat-media", "landing-media", "assets", "service-media", 
                          "review-media", "applications", "booking-note-media", "portfolio"];
    
    if (knownBuckets.includes(segments[0])) {
        // Path includes bucket name as first segment
        return {
            bucket: segments[0],
            path: segments.slice(1).join("/")
        };
    }
    
    // Otherwise, infer bucket from path structure
    // This is a fallback for legacy data where bucket isn't included in path
    if (segments.length === 3) {
        // Three segments typically means chat-media or booking-note-media
        // Format: id1/id2/filename
        return { bucket: "chat-media", path: filePath };
    } else if (segments.length === 2) {
        // Two segments could be service-media, review-media, or applications
        // Format: id/filename
        // Default to applications for now since that's what we're fixing
        return { bucket: "applications", path: filePath };
    } else if (segments.length === 1) {
        // Single segment with no path separator
        // Likely a standalone file in service-media or assets
        return { bucket: "service-media", path: filePath };
    }
    
    // Default fallback
    return { bucket: "service-media", path: filePath };
}

/**
 * Get public URL from file_path stored in database
 * @param mediaType - Optional media type to help determine the correct bucket
 */
export function getPublicUrlFromPath(
    supabase: SupabaseClient,
    filePath: string,
    mediaType?: string,
): string {
    if (filePath.startsWith("https://images.unsplash.com/")) {
        return filePath;
    }

    // Use media type to determine bucket if provided
    if (mediaType) {
        const bucketMap: Record<string, string> = {
            "avatar": "avatars",
            "service_image": "service-media",
            "review_image": "review-media",
            "chat_image": "chat-media",
            "application_image": "applications",
            "landing_asset": "landing-media",
            "logo_asset": "assets",
            "booking_note_image": "booking-note-media",
            "other": "assets",
        };
        
        const bucket = bucketMap[mediaType];
        if (bucket) {
            // If the path already includes the bucket name, remove it
            const pathWithoutBucket = filePath.startsWith(bucket + "/") 
                ? filePath.substring(bucket.length + 1)
                : filePath;
            return getPublicUrl(supabase, bucket, pathWithoutBucket);
        }
    }

    // Fallback to parsing the path
    const { bucket, path } = parseFilePath(filePath);
    return getPublicUrl(supabase, bucket, path);
}

/**
 * Generate a unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split(".").pop();
    return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Validate file type and size before upload
 */
export function validateFile(
    file: File,
    allowedTypes: string[],
    maxSize: number,
): string | null {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
        return `File type ${file.type} is not allowed. Allowed types: ${
            allowedTypes.join(", ")
        }`;
    }

    // Check file size (maxSize in bytes)
    if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return `File size ${
            Math.round(file.size / (1024 * 1024))
        }MB exceeds maximum size of ${maxSizeMB}MB`;
    }

    return null;
}

/**
 * Bucket configurations for validation
 */
export const bucketConfigs = {
    avatars: {
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
        maxSize: 2 * 1024 * 1024, // 2MB
    },
    "chat-media": {
        allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        maxSize: 5 * 1024 * 1024, // 5MB
    },
    "landing-media": {
        allowedTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/svg+xml",
        ],
        maxSize: 10 * 1024 * 1024, // 10MB
    },
    assets: {
        allowedTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/svg+xml",
        ],
        maxSize: 5 * 1024 * 1024, // 5MB
    },
    "service-media": {
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
        maxSize: 10 * 1024 * 1024, // 10MB
    },
    "review-media": {
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
        maxSize: 5 * 1024 * 1024, // 5MB
    },
    portfolio: {
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
        maxSize: 15 * 1024 * 1024, // 15MB
    },
    applications: {
        allowedTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
        ],
        maxSize: 10 * 1024 * 1024, // 10MB
    },
    "booking-note-media": {
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
        maxSize: 10 * 1024 * 1024, // 10MB
    },
} as const;
