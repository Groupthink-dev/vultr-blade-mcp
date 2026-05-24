/**
 * Plan and region tools: vultr_vm_list_plans, vultr_vm_list_regions
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vultrFetch } from "../services/vultr.js";
import { formatPlans } from "../formatters/plan.js";
import { formatRegions } from "../formatters/region.js";
import { truncateIfNeeded } from "../utils/pagination.js";
import { handleApiError } from "../utils/errors.js";
import { formatMetaLine, appendMeta, type MetaEnvelope } from "stallari-mcp-helpers";
import { ListPlansSchema, ListRegionsSchema } from "../schemas/plans.js";
import type { ListPlansInput, ListRegionsInput } from "../schemas/plans.js";

export function registerPlanTools(server: McpServer): void {
  // ─── vultr_vm_list_plans ───────────────────────────────────────
  server.registerTool(
    "vultr_vm_list_plans",
    {
      title: "List VM Plans",
      description:
        "List available Vultr plans with GPU specs and pricing.\n\n" +
        "Tip: Default filter is type=vcg (GPU plans only). Use type=all to see all plan types.\n\n" +
        "Returns: { total, plans[] } with id, type, vcpu_count, ram_mb, disk_gb, " +
        "price_monthly, price_hourly, gpu { type, vram_gb, count }, locations[].",
      inputSchema: ListPlansSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListPlansInput) => {
      try {
        const t0 = performance.now();
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.type !== "all") query.set("type", params.type);
        if (params.cursor) query.set("cursor", params.cursor);
        if (params.region) query.set("region", params.region);

        const res = await vultrFetch(`/plans?${query}`);
        const data = await res.json() as {
          plans: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };
        const latencyMs = Math.round(performance.now() - t0);

        const plans = data.plans || [];
        const formatted = formatPlans(plans);
        const total = data.meta?.total ?? plans.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = {
          total,
          plans: formatted,
        };
        if (nextCursor) output.next_cursor = nextCursor;

        const text = truncateIfNeeded(JSON.stringify(output, null, 2));
        const filteredBy: string[] = [];
        if (params.type !== "all") filteredBy.push(`type=${params.type}`);
        if (params.region) filteredBy.push(`region=${params.region}`);
        if (params.cursor) filteredBy.push(`cursor=${params.cursor}`);
        const metaLine = formatMetaLine({
          matched_total: total,
          returned: plans.length,
          filtered_by: filteredBy,
          latency_ms: latencyMs,
          redactions: [],
          next_cursor: nextCursor || null,
        });
        return { content: [{ type: "text" as const, text: appendMeta(text, metaLine) }] };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── vultr_vm_list_regions ─────────────────────────────────────
  server.registerTool(
    "vultr_vm_list_regions",
    {
      title: "List Regions",
      description:
        "List available Vultr regions / datacentres.\n\n" +
        "Returns: { total, regions[] } with id, city, country, continent, options[].",
      inputSchema: ListRegionsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListRegionsInput) => {
      try {
        const t0 = performance.now();
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.cursor) query.set("cursor", params.cursor);

        const res = await vultrFetch(`/regions?${query}`);
        const data = await res.json() as {
          regions: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };
        const latencyMs = Math.round(performance.now() - t0);

        const regions = data.regions || [];
        const formatted = formatRegions(regions);
        const total = data.meta?.total ?? regions.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = {
          total,
          regions: formatted,
        };
        if (nextCursor) output.next_cursor = nextCursor;

        const text = truncateIfNeeded(JSON.stringify(output, null, 2));
        const filteredBy: string[] = [];
        if (params.cursor) filteredBy.push(`cursor=${params.cursor}`);
        const metaLine = formatMetaLine({
          matched_total: total,
          returned: regions.length,
          filtered_by: filteredBy,
          latency_ms: latencyMs,
          redactions: [],
          next_cursor: nextCursor || null,
        });
        return { content: [{ type: "text" as const, text: appendMeta(text, metaLine) }] };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );
}
