/**
 * Vultr API client — thin fetch wrapper with auth and base URL.
 *
 * API key is read from VULTR_API_KEY env var. Never logged or included
 * in error messages.
 */

import { VULTR_API_BASE, ENV } from "../constants.js";

let _apiKey: string | null = null;

function getApiKey(): string {
  if (_apiKey) return _apiKey;
  const key = (process.env[ENV.API_KEY] || "").trim();
  if (!key) {
    throw new Error(
      `${ENV.API_KEY} environment variable is not set. ` +
        "Create an API key at https://my.vultr.com/settings/#settingsapi"
    );
  }
  _apiKey = key;
  return _apiKey;
}

/**
 * Validate the API key by hitting GET /v2/account.
 * Throws if the key is invalid or the API is unreachable.
 */
export async function validateApiKey(): Promise<{ email: string; name: string }> {
  const res = await vultrFetch("/account");
  const data = (await res.json()) as { account: { email: string; name: string } };
  return data.account;
}

/**
 * Fetch wrapper for Vultr API.
 * Adds Authorization header, base URL, and content-type.
 * Throws on non-2xx responses with actionable messages.
 */
export async function vultrFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${VULTR_API_BASE}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let message = "";
    try {
      const json = JSON.parse(body);
      message = json.error || json.message || body;
    } catch {
      message = body;
    }
    const err = new VultrApiError(res.status, message, path);
    throw err;
  }

  return res;
}

/**
 * Typed error for Vultr API responses.
 */
export class VultrApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly path: string
  ) {
    super(`Vultr API error ${status}: ${detail}`);
    this.name = "VultrApiError";
  }
}
