/**
 * Read-only bare metal tools: vultr_bm_list, vultr_bm_get, vultr_bm_bandwidth
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vultrFetch } from "../services/vultr.js";
import { formatBaremetal, formatBaremetals } from "../formatters/baremetal.js";
import { formatBandwidth } from "../formatters/instance.js";
import { truncateIfNeeded } from "../utils/pagination.js";
import { handleApiError } from "../utils/errors.js";
import {
  ListBaremetalSchema,
  GetBaremetalSchema,
  BaremetalBandwidthSchema,
} from "../schemas/baremetal.js";
import type {
  ListBaremetalInput,
  GetBaremetalInput,
  BaremetalBandwidthInput,
} from "../schemas/baremetal.js";

export function registerBaremetalReadTools(server: McpServer): void {
  // ─── vultr_bm_list ────────────────────────────────────────────
  server.registerTool(
    "vultr_bm_list",
    {
      title: "List Bare Metal",
      description:
        "List all bare metal instances with status, region, plan, IP, and cost.\n\n" +
        "Returns: { total, servers[] }.",
      inputSchema: ListBaremetalSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListBaremetalInput) => {
      try {
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.cursor) query.set("cursor", params.cursor);
        if (params.label) query.set("label", params.label);
        if (params.region) query.set("region", params.region);
        if (params.tag) query.set("tag", params.tag);

        const res = await vultrFetch(`/bare-metals?${query}`);
        const data = await res.json() as {
          bare_metals: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };

        const servers = data.bare_metals || [];
        const formatted = formatBaremetals(servers);
        const total = data.meta?.total ?? servers.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = { total, servers: formatted };
        if (nextCursor) output.next_cursor = nextCursor;

        const text = truncateIfNeeded(JSON.stringify(output, null, 2));
        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── vultr_bm_get ─────────────────────────────────────────────
  server.registerTool(
    "vultr_bm_get",
    {
      title: "Get Bare Metal Details",
      description:
        "Get full details for a single bare metal instance.\n\n" +
        "Returns: { server }.",
      inputSchema: GetBaremetalSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetBaremetalInput) => {
      try {
        const res = await vultrFetch(`/bare-metals/${params.baremetal_id}`);
        const data = await res.json() as { bare_metal: Record<string, unknown> };
        const formatted = formatBaremetal(data.bare_metal);

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ server: formatted }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── vultr_bm_bandwidth ───────────────────────────────────────
  server.registerTool(
    "vultr_bm_bandwidth",
    {
      title: "Get Bare Metal Bandwidth",
      description:
        "Get bandwidth usage for a bare metal instance.\n\n" +
        "Returns: { instance_id, entries[], totals }.",
      inputSchema: BaremetalBandwidthSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: BaremetalBandwidthInput) => {
      try {
        const res = await vultrFetch(`/bare-metals/${params.baremetal_id}/bandwidth`);
        const data = await res.json() as { bandwidth: Record<string, Record<string, unknown>> };

        const formatted = formatBandwidth(params.baremetal_id, data.bandwidth ?? {});
        const text = truncateIfNeeded(JSON.stringify(formatted, null, 2));

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );
}
