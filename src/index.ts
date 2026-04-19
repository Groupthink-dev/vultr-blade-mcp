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

  const { serve } = await import("@hono/node-server");
  serve({ fetch: app.fetch, port }, () => {
    if (getBearerToken()) {
      console.error("  ✓ Bearer token auth enabled (MCP_API_TOKEN is set)");
    } else {
      console.error("  ⚠ Bearer token auth disabled (no MCP_API_TOKEN)");
    }
    console.error(`  ✓ MCP server running at http://localhost:${port}/mcp`);
    console.error(`  ✓ Health check at http://localhost:${port}/health`);
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
