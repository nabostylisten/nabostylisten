import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export interface CompressionResult {
  compressedPath: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionTime: number;
  success: boolean;
  error?: string;
}

const COMPRESSION_SETTINGS = {
  ".jpg": "-quality 85",
  ".jpeg": "-quality 85",
  ".png": "-quality 90",
  ".gif": "-quality 90",
  ".webp": "-quality 80",
  ".tiff": "-quality 85",
  ".tif": "-quality 85",
} as const;

const DEFAULT_QUALITY = "-quality 85";

export async function compressImage(
  inputPath: string,
  fileExtension: string,
  tempDir: string = tmpdir()
): Promise<CompressionResult> {
  const startTime = Date.now();

  try {
    // Get original file size
    const originalStats = await fs.stat(inputPath);
    const originalSize = originalStats.size;

    // Create unique output filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const outputFilename = `compressed_${timestamp}_${randomSuffix}${fileExtension}`;
    const outputPath = path.join(tempDir, outputFilename);

    // Get compression settings for file type
    const normalizedExt = fileExtension.toLowerCase();
    const compressionSetting = COMPRESSION_SETTINGS[normalizedExt as keyof typeof COMPRESSION_SETTINGS] || DEFAULT_QUALITY;

    // Build ImageMagick command
    // Using 'magick' command for ImageMagick 7.x compatibility
    const command = `magick "${inputPath}" ${compressionSetting} "${outputPath}"`;

    console.log(`Compressing ${path.basename(inputPath)} with settings: ${compressionSetting}`);

    // Execute compression
    await execAsync(command);

    // Verify output file exists
    const compressedStats = await fs.stat(outputPath);
    const compressedSize = compressedStats.size;

    const compressionTime = Date.now() - startTime;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    return {
      compressedPath: outputPath,
      originalSize,
      compressedSize,
      compressionRatio,
      compressionTime,
      success: true,
    };
  } catch (error) {
    console.error(`Compression failed for ${inputPath}:`, error);

    // Fallback: copy original file to temp location
    try {
      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;

      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 9);
      const outputFilename = `fallback_${timestamp}_${randomSuffix}${fileExtension}`;
      const outputPath = path.join(tempDir, outputFilename);

      await fs.copyFile(inputPath, outputPath);

      const compressionTime = Date.now() - startTime;

      return {
        compressedPath: outputPath,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
        compressionTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    } catch (fallbackError) {
      throw new Error(
        `Both compression and fallback failed for ${inputPath}: ${error}, ${fallbackError}`
      );
    }
  }
}

export async function batchCompressImages(
  filePaths: Array<{ inputPath: string; fileExtension: string }>,
  tempDir: string = tmpdir(),
  concurrency: number = 3
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  const chunks = [];

  // Split into chunks for controlled concurrency
  for (let i = 0; i < filePaths.length; i += concurrency) {
    chunks.push(filePaths.slice(i, i + concurrency));
  }

  console.log(`Batch compressing ${filePaths.length} images with concurrency ${concurrency}`);

  for (const chunk of chunks) {
    const chunkPromises = chunk.map(({ inputPath, fileExtension }) =>
      compressImage(inputPath, fileExtension, tempDir)
    );

    const chunkResults = await Promise.allSettled(chunkPromises);

    for (const result of chunkResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        console.error("Batch compression error:", result.reason);
        // Create a failed result entry
        results.push({
          compressedPath: "",
          originalSize: 0,
          compressedSize: 0,
          compressionRatio: 0,
          compressionTime: 0,
          success: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    }
  }

  return results;
}

export function calculateCompressionStats(results: CompressionResult[]): {
  totalFiles: number;
  successfulCompressions: number;
  failedCompressions: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSizeSaved: number;
  averageCompressionRatio: number;
  totalCompressionTime: number;
} {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalSizeSaved = totalOriginalSize - totalCompressedSize;
  const averageCompressionRatio = successful.length > 0
    ? successful.reduce((sum, r) => sum + r.compressionRatio, 0) / successful.length
    : 0;
  const totalCompressionTime = results.reduce((sum, r) => sum + r.compressionTime, 0);

  return {
    totalFiles: results.length,
    successfulCompressions: successful.length,
    failedCompressions: failed.length,
    totalOriginalSize,
    totalCompressedSize,
    totalSizeSaved,
    averageCompressionRatio,
    totalCompressionTime,
  };
}

export async function cleanupCompressedFiles(results: CompressionResult[]): Promise<void> {
  const cleanupPromises = results
    .filter(r => r.compressedPath && r.compressedPath.length > 0)
    .map(async (result) => {
      try {
        await fs.unlink(result.compressedPath);
      } catch (error) {
        console.warn(`Failed to cleanup compressed file ${result.compressedPath}:`, error);
      }
    });

  await Promise.allSettled(cleanupPromises);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatCompressionReport(stats: ReturnType<typeof calculateCompressionStats>): string {
  const successRate = (stats.successfulCompressions / stats.totalFiles) * 100;
  const compressionPercentage = (stats.totalSizeSaved / stats.totalOriginalSize) * 100;

  return `
Compression Report:
==================
Total Files: ${stats.totalFiles}
Successful: ${stats.successfulCompressions} (${successRate.toFixed(1)}%)
Failed: ${stats.failedCompressions}

Size Reduction:
Original Size: ${formatBytes(stats.totalOriginalSize)}
Compressed Size: ${formatBytes(stats.totalCompressedSize)}
Space Saved: ${formatBytes(stats.totalSizeSaved)} (${compressionPercentage.toFixed(1)}%)
Average Compression Ratio: ${stats.averageCompressionRatio.toFixed(1)}%

Performance:
Total Compression Time: ${(stats.totalCompressionTime / 1000).toFixed(1)}s
Average Time per File: ${(stats.totalCompressionTime / stats.totalFiles / 1000).toFixed(2)}s
`;
}