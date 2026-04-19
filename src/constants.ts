/** Vultr API base URL */
export const VULTR_API_BASE = "https://api.vultr.com/v2";

/** Default items per page (Vultr max is 500, default is 100 — we use 25 for token efficiency) */
export const DEFAULT_PER_PAGE = 25;

/** Maximum response characters before truncation */
export const CHARACTER_LIMIT = 4000;

/** Environment variable names */
export const ENV = {
  API_KEY: "VULTR_API_KEY",
  WRITE_ENABLED: "VULTR_WRITE_ENABLED",
  MCP_API_TOKEN: "MCP_API_TOKEN",
  TRANSPORT: "TRANSPORT",
  PORT: "PORT",
} as const;

/** Default HTTP port for Hono transport */
export const DEFAULT_PORT = 8780;
