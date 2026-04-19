/**
 * Read-only instance tools: vultr_vm_list, vultr_vm_get, vultr_vm_status
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vultrFetch } from "../services/vultr.js";
import { formatInstance, formatInstances, formatInstanceStatus, formatBandwidth } from "../formatters/instance.js";
import { truncateIfNeeded } from "../utils/pagination.js";
import { handleApiError } from "../utils/errors.js";
import {
  ListInstancesSchema,
  GetInstanceSchema,
  InstanceStatusSchema,
  InstanceBandwidthSchema,
} from "../schemas/instances.js";
import type {
  ListInstancesInput,
  GetInstanceInput,
  InstanceStatusInput,
  InstanceBandwidthInput,
} from "../schemas/instances.js";

export function registerInstanceReadTools(server: McpServer): void {
  // ─── vultr_vm_list ─────────────────────────────────────────────
  server.registerTool(
    "vultr_vm_list",
    {
      title: "List VMs",
      description:
        "List all Vultr instances with status, region, plan, IP, and cost.\n\n" +
        "Tip: Filter by region or tag to narrow results.\n\n" +
        "Returns: { total, instances[] } with id, label, status, region, plan, main_ip, cost_per_month.",
      inputSchema: ListInstancesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListInstancesInput) => {
      try {
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.cursor) query.set("cursor", params.cursor);
        if (params.label) query.set("label", params.label);
        if (params.region) query.set("region", params.region);
        if (params.tag) query.set("tag", params.tag);

        const res = await vultrFetch(`/instances?${query}`);
        const data = await res.json() as {
          instances: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };

        const instances = data.instances || [];
        const formatted = formatInstances(instances);
        const total = data.meta?.total ?? instances.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = {
          total,
          instances: formatted,
        };
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

  // ─── vultr_vm_get ──────────────────────────────────────────────
  server.registerTool(
    "vultr_vm_get",
    {
      title: "Get VM Details",
      description:
        "Get full details for a single Vultr instance by ID.\n\n" +
        "Returns: { instance } with id, label, hostname, status, power_status, region, plan, os, IPs, tags, cost.",
      inputSchema: GetInstanceSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetInstanceInput) => {
      try {
        const res = await vultrFetch(`/instances/${params.instance_id}`);
        const data = await res.json() as { instance: Record<string, unknown> };
        const formatted = formatInstance(data.instance);

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ instance: formatted }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── vultr_vm_status ───────────────────────────────────────────
  server.registerTool(
    "vultr_vm_status",
    {
      title: "Get VM Status",
      description:
        "Get current power state and health for a Vultr instance.\n\n" +
        "Tip: Lighter than vultr_vm_get — returns only status fields.\n\n" +
        "Returns: { id, status, power_status, server_status, main_ip }.",
      inputSchema: InstanceStatusSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: InstanceStatusInput) => {
      try {
        const res = await vultrFetch(`/instances/${params.instance_id}`);
        const data = await res.json() as { instance: Record<string, unknown> };
        const formatted = formatInstanceStatus(data.instance);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(formatted, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── vultr_vm_bandwidth ───────────────────────────────────────
  server.registerTool(
    "vultr_vm_bandwidth",
    {
      title: "Get VM Bandwidth",
      description:
        "Get bandwidth usage (incoming/outgoing bytes) for a Vultr instance.\n\n" +
        "Returns: { instance_id, bandwidth } with date-keyed entries showing incoming/outgoing bytes.",
      inputSchema: InstanceBandwidthSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: InstanceBandwidthInput) => {
      try {
        const query = new URLSearchParams();
        if (params.date_range) query.set("date_range", params.date_range);

        const res = await vultrFetch(`/instances/${params.instance_id}/bandwidth?${query}`);
        const data = await res.json() as { bandwidth: Record<string, Record<string, unknown>> };

        const formatted = formatBandwidth(params.instance_id, data.bandwidth ?? {});
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
