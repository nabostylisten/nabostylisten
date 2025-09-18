import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export interface FileTypeInfo {
  mimeType: string;
  extension: string;
  isImage: boolean;
  isSupported: boolean;
}

const SUPPORTED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;

export async function detectFileType(filePath: string): Promise<FileTypeInfo> {
  try {
    // Use the `file` command to detect MIME type
    const { stdout } = await execAsync(`file --mime-type "${filePath}"`);
    const mimeType = stdout.split(":")[1]?.trim() || "application/octet-stream";

    // Get file extension (if any)
    const fileExtension = path.extname(filePath).toLowerCase().slice(1);

    // Determine if it's an image
    const isImage = mimeType.startsWith("image/");

    // Determine if it's a supported image type
    const isSupported = isImage && mimeType in SUPPORTED_IMAGE_TYPES;

    // Get the correct extension based on MIME type or fall back to file extension
    let extension = fileExtension;
    if (isSupported) {
      extension = SUPPORTED_IMAGE_TYPES[mimeType as keyof typeof SUPPORTED_IMAGE_TYPES];
    }

    return {
      mimeType,
      extension,
      isImage,
      isSupported,
    };
  } catch (error) {
    console.error(`Failed to detect file type for ${filePath}:`, error);

    // Fallback to file extension if available
    const fileExtension = path.extname(filePath).toLowerCase().slice(1);
    const fallbackMimeType = getFallbackMimeType(fileExtension);
    const isImage = fallbackMimeType.startsWith("image/");
    const isSupported = isImage && fallbackMimeType in SUPPORTED_IMAGE_TYPES;

    return {
      mimeType: fallbackMimeType,
      extension: fileExtension || "bin",
      isImage,
      isSupported,
    };
  }
}

function getFallbackMimeType(extension: string): string {
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    tiff: "image/tiff",
    ico: "image/x-icon",
  };

  return mimeMap[extension] || "application/octet-stream";
}

export async function validateImageFile(filePath: string): Promise<{
  isValid: boolean;
  fileInfo: FileTypeInfo;
  error?: string;
}> {
  try {
    const fileInfo = await detectFileType(filePath);

    if (!fileInfo.isImage) {
      return {
        isValid: false,
        fileInfo,
        error: `File is not an image. MIME type: ${fileInfo.mimeType}`,
      };
    }

    if (!fileInfo.isSupported) {
      return {
        isValid: false,
        fileInfo,
        error: `Unsupported image type: ${fileInfo.mimeType}`,
      };
    }

    return {
      isValid: true,
      fileInfo,
    };
  } catch (error) {
    const fileInfo: FileTypeInfo = {
      mimeType: "unknown",
      extension: "unknown",
      isImage: false,
      isSupported: false,
    };

    return {
      isValid: false,
      fileInfo,
      error: `Failed to validate file: ${error}`,
    };
  }
}

export function generateFileName(originalName: string, fileInfo: FileTypeInfo): string {
  const baseName = path.basename(originalName, path.extname(originalName));
  const extension = fileInfo.extension;

  // If the original file had no extension, use the detected one
  if (!path.extname(originalName) && extension) {
    return `${baseName}.${extension}`;
  }

  // If the detected extension differs from the original, use the detected one
  const originalExt = path.extname(originalName).slice(1).toLowerCase();
  if (originalExt !== extension) {
    return `${baseName}.${extension}`;
  }

  return originalName;
}