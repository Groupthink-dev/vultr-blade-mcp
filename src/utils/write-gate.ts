/**
 * Dual write-gate for destructive operations.
 *
 * Two independent gates must both pass:
 * 1. Environment variable: VULTR_WRITE_ENABLED=true
 * 2. Per-call confirmation: confirm=true in tool input
 *
 * This prevents accidental writes from both misconfigured environments
 * and careless tool invocations.
 */

import { ENV } from "../constants.js";

/**
 * Check if writes are enabled via environment variable.
 */
export function isWriteEnabled(): boolean {
  return process.env[ENV.WRITE_ENABLED] === "true";
}

/**
 * Validate both write gates. Returns null if both pass,
 * or an error message string if either gate fails.
 */
export function requireWrite(confirm: boolean | undefined, operation: string): string | null {
  if (!isWriteEnabled()) {
    return (
      `Write operation "${operation}" blocked: ${ENV.WRITE_ENABLED} is not set to "true". ` +
      `Set ${ENV.WRITE_ENABLED}=true in your environment to enable write operations.`
    );
  }

  if (confirm !== true) {
    return (
      `Write operation "${operation}" blocked: confirm must be set to true. ` +
      `This is a safety gate to prevent accidental modifications.`
    );
  }

  return null;
}
