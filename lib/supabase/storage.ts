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
 * File paths are stored as: "bucket_name/path/to/file.ext"
 */
export function parseFilePath(
    filePath: string,
): { bucket: string; path: string } {
    const firstSlashIndex = filePath.indexOf("/");
    if (firstSlashIndex === -1) {
        // If no slash, assume it's in a default bucket
        return { bucket: "service-media", path: filePath };
    }

    const bucket = filePath.substring(0, firstSlashIndex);
    const path = filePath.substring(firstSlashIndex + 1);

    return { bucket, path };
}

/**
 * Get public URL from file_path stored in database
 */
export function getPublicUrlFromPath(
    supabase: SupabaseClient,
    filePath: string,
): string {
    if (filePath.startsWith("https://images.unsplash.com/")) {
        return filePath;
    }

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
