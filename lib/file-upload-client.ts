"use client";

import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import {
  generateUniqueFilename,
  storagePaths,
} from "@/lib/supabase/storage";

export interface FileUploadResult {
  data: {
    path: string;
    fullPath: string;
    publicUrl?: string;
  } | null;
  error: string | null;
}

export interface FileCompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
}

const DEFAULT_COMPRESSION_OPTIONS: FileCompressionOptions = {
  maxSizeMB: 2, // 2MB limit for good performance
  maxWidthOrHeight: 1920, // Good balance of quality vs size
  useWebWorker: true,
};

/**
 * Compress an image file with validation and feedback
 */
export async function compressImage(
  file: File,
  options: Partial<FileCompressionOptions> = {}
): Promise<{
  compressedFile: File | null;
  error: string | null;
  compressionRatio?: number;
}> {
  const compressionOptions = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };

  try {
    // Validate file type first
    if (!file.type.startsWith("image/")) {
      return {
        compressedFile: null,
        error: "Filen må være et bilde (JPG, PNG, WebP)",
      };
    }

    // Check if file is already small enough
    if (file.size <= compressionOptions.maxSizeMB * 1024 * 1024) {
      return {
        compressedFile: file,
        error: null,
        compressionRatio: 1, // No compression needed
      };
    }

    const originalSize = file.size;

    // Compress the image
    const compressedFile = await imageCompression(file, {
      ...compressionOptions,
      fileType: file.type,
    });

    const compressionRatio = originalSize / compressedFile.size;

    // Check if compression was successful enough
    if (compressedFile.size > compressionOptions.maxSizeMB * 1024 * 1024) {
      return {
        compressedFile: null,
        error: `Bildet er fortsatt for stort (${(compressedFile.size / 1024 / 1024).toFixed(1)}MB). Maksimal størrelse er ${compressionOptions.maxSizeMB}MB.`,
      };
    }

    return {
      compressedFile,
      error: null,
      compressionRatio,
    };
  } catch (error) {
    return {
      compressedFile: null,
      error: `Komprimering feilet: ${error instanceof Error ? error.message : "Ukjent feil"}`,
    };
  }
}

/**
 * Upload application portfolio image directly from client
 */
export async function uploadApplicationImageClient(
  applicationId: string,
  file: File
): Promise<FileUploadResult> {
  try {
    const supabase = createClient();

    // Generate unique filename
    const filename = generateUniqueFilename(file.name);
    const storagePath = storagePaths.application(applicationId, filename);

    // Upload file directly from client
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
        fullPath: data.fullPath,
        publicUrl: urlData.publicUrl,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Ukjent feil oppstod",
    };
  }
}

/**
 * Note: This function will be replaced by direct server action import
 * in the component that uses it, since server actions can't be called
 * from utility modules that run in the browser
 */

/**
 * Batch compress and upload multiple images
 * Note: Media records must be created separately using server actions
 */
export async function batchCompressAndUpload(
  files: File[],
  applicationId: string,
  onProgress?: (current: number, total: number, file: string) => void
): Promise<{
  data: Array<{ file: File; url: string; path: string; compressionRatio?: number }> | null;
  errors: Array<{ file: File; error: string }>;
}> {
  const results: Array<{ file: File; url: string; path: string; compressionRatio?: number }> = [];
  const errors: Array<{ file: File; error: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length, file.name);

    try {
      // Step 1: Compress image
      const { compressedFile, error: compressionError, compressionRatio } = 
        await compressImage(file);

      if (compressionError || !compressedFile) {
        errors.push({ file, error: compressionError || "Komprimering feilet" });
        continue;
      }

      // Step 2: Upload compressed file
      const uploadResult = await uploadApplicationImageClient(
        applicationId,
        compressedFile
      );

      if (uploadResult.error || !uploadResult.data?.publicUrl) {
        errors.push({ 
          file, 
          error: uploadResult.error || "Opplasting feilet" 
        });
        continue;
      }

      results.push({
        file,
        url: uploadResult.data.publicUrl,
        path: uploadResult.data.path,
        compressionRatio,
      });

    } catch (error) {
      errors.push({ 
        file, 
        error: error instanceof Error ? error.message : "Ukjent feil" 
      });
    }
  }

  return {
    data: results.length > 0 ? results : null,
    errors,
  };
}