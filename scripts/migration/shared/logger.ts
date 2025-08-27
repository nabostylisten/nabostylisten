/**
 * Migration logging utility with file and console output
 */

import { appendFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type {
  MigrationProgress,
  MigrationResult,
  ValidationError,
} from "./types";

export class MigrationLogger {
  private logDir: string;
  private sessionId: string;
  private startTime: Date;

  constructor(logDir?: string) {
    this.logDir = logDir || join(process.cwd(), "scripts", "migration", "logs");
    this.sessionId = new Date().toISOString().replace(/[:.]/g, "-");
    this.startTime = new Date();

    // Ensure log directory exists
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }

    // Initialize session log file
    this.writeToFile(
      "session.log",
      `\n\n=== Migration Session Started: ${this.startTime.toISOString()} ===\n`,
    );
  }

  private writeToFile(filename: string, content: string): void {
    const filepath = join(this.logDir, filename);
    try {
      appendFileSync(filepath, content);
    } catch (error) {
      console.error(`Failed to write to log file ${filepath}:`, error);
    }
  }

  private formatMessage(
    level: string,
    message: string,
    data?: unknown,
  ): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? `\nData: ${JSON.stringify(data, null, 2)}` : "";
    return `[${timestamp}] [${level.padEnd(5)}] ${message}${dataStr}\n`;
  }

  info(message: string, data?: unknown): void {
    const formatted = this.formatMessage("INFO", message, data);
    console.log(`ℹ️  ${message}`);
    if (data) console.log(data);
    this.writeToFile("session.log", formatted);
  }

  success(message: string, data?: unknown): void {
    const formatted = this.formatMessage("SUCCESS", message, data);
    console.log(`✅ ${message}`);
    if (data) console.log(data);
    this.writeToFile("session.log", formatted);
  }

  warn(message: string, data?: unknown): void {
    const formatted = this.formatMessage("WARN", message, data);
    console.warn(`⚠️  ${message}`);
    if (data) console.warn(data);
    this.writeToFile("session.log", formatted);
    this.writeToFile("warnings.log", formatted);
  }

  error(message: string, error?: unknown): void {
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;

    const formatted = this.formatMessage("ERROR", message, errorData);
    console.error(`❌ ${message}`);
    if (errorData) console.error(errorData);
    this.writeToFile("session.log", formatted);
    this.writeToFile("errors.log", formatted);
  }

  debug(message: string, data?: unknown): void {
    const formatted = this.formatMessage("DEBUG", message, data);
    if (process.env.DEBUG === "true") {
      console.debug(`🐛 ${message}`);
      if (data) console.debug(data);
    }
    this.writeToFile("debug.log", formatted);
  }

  progress(progress: MigrationProgress): void {
    const percentage = Math.round(progress.percentage);
    const progressBar = "█".repeat(Math.floor(percentage / 5)) +
      "░".repeat(20 - Math.floor(percentage / 5));

    const message =
      `${progress.phase} - ${progress.step}: [${progressBar}] ${percentage}% (${progress.current}/${progress.total})`;

    console.log(`🔄 ${message}`);
    this.writeToFile("progress.log", this.formatMessage("PROGRESS", message));

    if (progress.errors.length > 0) {
      this.warn(
        `Progress update includes ${progress.errors.length} errors`,
        progress.errors,
      );
    }
  }

  validation(errors: ValidationError[]): void {
    if (errors.length === 0) {
      this.success("Validation completed with no errors");
      return;
    }

    this.error(`Validation found ${errors.length} errors`);

    const validationLog = errors.map((err) =>
      `Record ${err.record_id} (${err.table}): ${err.field} = "${err.value}" - ${err.error}`
    ).join("\n");

    this.writeToFile(
      "validation-errors.log",
      `=== Validation Errors - ${
        new Date().toISOString()
      } ===\n${validationLog}\n\n`,
    );
  }

  result(result: MigrationResult): void {
    if (result.success) {
      this.success(result.message, result.data);
    } else {
      this.error(result.message, result.error);
    }
  }

  stats(title: string, stats: Record<string, number | string>): void {
    const statsText = Object.entries(stats)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join("\n");

    const message = `${title}:\n${statsText}`;
    this.info(message);
  }

  sessionSummary(totalTime: number, results: MigrationResult[]): void {
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    const summary = `
=== Migration Session Summary ===
Session ID: ${this.sessionId}
Start Time: ${this.startTime.toISOString()}
End Time: ${new Date().toISOString()}
Duration: ${Math.round(totalTime / 1000)}s
Total Operations: ${results.length}
Successful: ${successful}
Failed: ${failed}
Success Rate: ${Math.round((successful / results.length) * 100)}%
=====================================
`;

    console.log(summary);
    this.writeToFile("session.log", summary);

    if (failed > 0) {
      this.writeToFile(
        "session-failures.log",
        results.filter((r) => !r.success)
          .map((r) => `${r.timestamp}: ${r.message} - ${r.error}`)
          .join("\n"),
      );
    }
  }

  getLogDirectory(): string {
    return this.logDir;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}
