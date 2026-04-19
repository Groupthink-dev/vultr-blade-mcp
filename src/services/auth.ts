/**
 * Bearer token authentication for the HTTP transport.
 *
 * Set MCP_API_TOKEN env var to require Authorization: Bearer <token>
 * on every HTTP request. If unset, bearer auth is disabled (localhost-only).
 *
 * Uses timing-safe comparison to prevent side-channel attacks.
 */

import { timingSafeEqual } from "node:crypto";
import { ENV } from "../constants.js";

let _bearerToken: string | null | undefined = undefined;

export function getBearerToken(): string | null {
  if (_bearerToken !== undefined) return _bearerToken;
  const token = (process.env[ENV.MCP_API_TOKEN] || "").trim();
  _bearerToken = token || null;
  return _bearerToken;
}

/**
 * Validate an Authorization: Bearer header value against MCP_API_TOKEN.
 * Returns true if valid, false if invalid, null if bearer auth not configured.
 */
export function validateBearerToken(authHeader: string | null | undefined): boolean | null {
  const expected = getBearerToken();
  if (!expected) return null;

  if (!authHeader) return false;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;

  return safeCompare(match[1], expected);
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
