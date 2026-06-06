#!/usr/bin/env node
/**
 * vultr-blade-mcp — Entry point
 *
 * Supports two transport modes:
 *   TRANSPORT=stdio  (default) — for Claude Desktop and local MCP clients
 *   TRANSPORT=http   — Hono-based Streamable HTTP for remote access
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Hono } from "hono";
import { createServer } from "./server.js";
import { validateApiKey } from "./services/vultr.js";
import { getBearerToken, validateBearerToken } from "./services/auth.js";
import { ENV, DEFAULT_PORT } from "./constants.js";

// ─── stdio transport ─────────────────────────────────────────────

async function runStdio(): Promise<void> {
  console.error("vultr-blade-mcp: starting in stdio mode...");

  try {
    const account = await validateApiKey();
    console.error(`  ✓ API key verified (account: ${account.email})`);
  } catch (err) {
    console.error(`  ✗ ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("  ✓ MCP server running via stdio. Waiting for requests...");
}

// ─── HTTP transport (Hono) ───────────────────────────────────────

async function runHttp(): Promise<void> {
  const port = parseInt(process.env[ENV.PORT] || String(DEFAULT_PORT), 10);
  console.error(`vultr-blade-mcp: starting in HTTP mode on port ${port}...`);

  try {
    const account = await validateApiKey();
    console.error(`  ✓ API key verified (account: ${account.email})`);
  } catch (err) {
    console.error(`  ✗ ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  const app = new Hono();

  // Bearer token middleware
  app.use("/*", async (c, next) => {
    const result = validateBearerToken(c.req.header("Authorization") ?? null);
    if (result === null) {
      await next();
      return;
    }
    if (!result) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
  });

  // Health check
  app.get("/health", (c) => c.json({ status: "ok", server: "vultr-blade-mcp" }));

  // MCP endpoint — Streamable HTTP
  app.post("/mcp", async (c) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    const body = await c.req.json();

    const nodeReq = (c.env as Record<string, unknown>)?.incoming as
      | import("node:http").IncomingMessage
      | undefined;
    const nodeRes = (c.env as Record<string, unknown>)?.outgoing as
      | import("node:http").ServerResponse
      | undefined;

    if (nodeReq && nodeRes) {
      nodeRes.on("close", () => transport.close());
      await server.connect(transport);
      await transport.handleRequest(nodeReq, nodeRes, body);
      return undefined as unknown as Response;
    }

    return c.json(
      { error: "HTTP transport requires Node.js runtime." },
      501
    );
  });

  // HTTP transport is a manual loopback path only. Unlike a read-only blade,
  // vultr can delete VMs / bare-metal / snapshots, and the /mcp route has no
  // per-request auth fallback — so without a bearer token it would serve every
  // tool unauthenticated. Refuse to start http without MCP_API_TOKEN, and bind
  // loopback by default (`@hono/node-server` otherwise binds all interfaces).
  // Blade-mcp transport policy: DD-242 / access-policy.
  const hostname = process.env.HOST || "127.0.0.1";
  const isLoopback = hostname === "127.0.0.1" || hostname === "::1" || hostname === "localhost";
  if (!getBearerToken()) {
    console.error(
      "  ✗ Refusing to start HTTP transport without auth. Set MCP_API_TOKEN " +
        "(the bearer token clients must send), or use the default stdio transport."
    );
    process.exit(1);
  }
  if (!isLoopback) {
    console.error(
      `  ✗ Refusing to bind HTTP to non-loopback host ${hostname}. ` +
        "vultr tools mutate cloud infrastructure; the http path is loopback-only."
    );
    process.exit(1);
  }
  const { serve } = await import("@hono/node-server");
  serve({ fetch: app.fetch, port, hostname }, () => {
    console.error("  ✓ Bearer token auth enabled (MCP_API_TOKEN is set)");
    console.error(`  ✓ MCP server running at http://${hostname}:${port}/mcp`);
    console.error(`  ✓ Health check at http://${hostname}:${port}/health`);
  });
}

// ─── Main ────────────────────────────────────────────────────────

const transport = process.env[ENV.TRANSPORT] || "stdio";

if (transport === "http") {
  runHttp().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
} else {
  runStdio().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}
