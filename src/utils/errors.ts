/**
 * Vultr API error handler — maps HTTP status codes to actionable messages.
 * Never exposes API keys or sensitive data in error output.
 */

import { VultrApiError } from "../services/vultr.js";
import { ENV } from "../constants.js";

export function handleApiError(error: unknown): string {
  if (error instanceof VultrApiError) {
    switch (error.status) {
      case 400:
        return `Error (400 Bad Request): ${error.detail}. Check parameters — a required field may be missing or malformed.`;
      case 401:
        return `Error (401 Unauthorized): Invalid or expired API key. Verify ${ENV.API_KEY} is set and valid.`;
      case 403:
        return `Error (403 Forbidden): API key lacks required permissions. Check your Vultr API key access controls.`;
      case 404:
        return `Error (404 Not Found): Resource does not exist. Double-check the instance ID, plan, or region.`;
      case 409:
        return `Error (409 Conflict): ${error.detail}. The resource may already exist or be in a conflicting state.`;
      case 429:
        return `Error (429 Rate Limited): Vultr API rate limit hit. Wait a moment and retry.`;
      case 500:
        return `Error (500 Internal Server Error): Vultr API internal error. Retry in a few seconds.`;
      case 503:
        return `Error (503 Service Unavailable): Vultr API temporarily unavailable. Retry shortly.`;
      default:
        return `Error (${error.status}): ${error.detail}`;
    }
  }

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "Error: Vultr API request timed out after 15s. The API may be slow or unreachable.";
    }
    if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")) {
      const cause = error.cause instanceof Error ? ` (${error.cause.message})` : "";
      return `Error: Could not connect to Vultr API${cause}. Retried once — check network connectivity.`;
    }
    return `Error: ${error.message}`;
  }

  return `Error: An unexpected error occurred: ${String(error)}`;
}

/**
 * Wraps a tool handler with consistent error handling.
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>
): Promise<T | { content: Array<{ type: "text"; text: string }>; isError: true }> {
  try {
    return await fn();
  } catch (error) {
    return {
      content: [{ type: "text" as const, text: handleApiError(error) }],
      isError: true,
    };
  }
}
