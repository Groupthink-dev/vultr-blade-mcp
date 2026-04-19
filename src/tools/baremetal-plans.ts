/**
 * Bare metal plan tools: vultr_bm_list_plans
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vultrFetch } from "../services/vultr.js";
import { formatBaremetalPlans } from "../formatters/baremetal.js";
import { truncateIfNeeded } from "../utils/pagination.js";
import { handleApiError } from "../utils/errors.js";
import { ListBaremetalPlansSchema } from "../schemas/baremetal.js";
import type { ListBaremetalPlansInput } from "../schemas/baremetal.js";

export function registerBaremetalPlanTools(server: McpServer): void {
  // ─── vultr_bm_list_plans ──────────────────────────────────────
  server.registerTool(
    "vultr_bm_list_plans",
    {
      title: "List Bare Metal Plans",
      description:
        "List available bare metal plans with CPU, RAM, disk, and pricing.\n\n" +
        "Returns: { total, plans[] } with id, cpu, ram, disk, bandwidth, monthly_cost.",
      inputSchema: ListBaremetalPlansSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListBaremetalPlansInput) => {
      try {
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.cursor) query.set("cursor", params.cursor);

        const res = await vultrFetch(`/plans-metal?${query}`);
        const data = await res.json() as {
          plans_metal: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };

        const plans = data.plans_metal || [];
        const formatted = formatBaremetalPlans(plans);
        const total = data.meta?.total ?? plans.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = { total, plans: formatted };
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
}
