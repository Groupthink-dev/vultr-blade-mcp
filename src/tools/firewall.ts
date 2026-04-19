/**
 * Firewall tools: vultr_fw_list_groups, vultr_fw_get_group,
 * vultr_fw_create_group, vultr_fw_delete_group,
 * vultr_fw_list_rules, vultr_fw_create_rule
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vultrFetch } from "../services/vultr.js";
import {
  formatFirewallGroup,
  formatFirewallGroups,
  formatFirewallRules,
} from "../formatters/firewall.js";
import { truncateIfNeeded } from "../utils/pagination.js";
import { handleApiError } from "../utils/errors.js";
import { requireWrite } from "../utils/write-gate.js";
import {
  ListFirewallGroupsSchema,
  GetFirewallGroupSchema,
  CreateFirewallGroupSchema,
  DeleteFirewallGroupSchema,
  ListFirewallRulesSchema,
  CreateFirewallRuleSchema,
} from "../schemas/firewall.js";
import type {
  ListFirewallGroupsInput,
  GetFirewallGroupInput,
  CreateFirewallGroupInput,
  DeleteFirewallGroupInput,
  ListFirewallRulesInput,
  CreateFirewallRuleInput,
} from "../schemas/firewall.js";

export function registerFirewallTools(server: McpServer): void {
  // ─── vultr_fw_list_groups ─────────────────────────────────────
  server.registerTool(
    "vultr_fw_list_groups",
    {
      title: "List Firewall Groups",
      description:
        "List all firewall groups.\n\n" +
        "Returns: { total, firewall_groups[] } with id, description, rule/instance counts.",
      inputSchema: ListFirewallGroupsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListFirewallGroupsInput) => {
      try {
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.cursor) query.set("cursor", params.cursor);

        const res = await vultrFetch(`/firewalls?${query}`);
        const data = await res.json() as {
          firewall_groups: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };

        const groups = data.firewall_groups || [];
        const formatted = formatFirewallGroups(groups);
        const total = data.meta?.total ?? groups.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = { total, firewall_groups: formatted };
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

  // ─── vultr_fw_get_group ───────────────────────────────────────
  server.registerTool(
    "vultr_fw_get_group",
    {
      title: "Get Firewall Group",
      description:
        "Get details for a single firewall group.\n\n" +
        "Returns: { firewall_group } with id, description, rule/instance counts.",
      inputSchema: GetFirewallGroupSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetFirewallGroupInput) => {
      try {
        const res = await vultrFetch(`/firewalls/${params.firewall_group_id}`);
        const data = await res.json() as { firewall_group: Record<string, unknown> };
        const formatted = formatFirewallGroup(data.firewall_group);

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ firewall_group: formatted }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── vultr_fw_create_group ────────────────────────────────────
  server.registerTool(
    "vultr_fw_create_group",
    {
      title: "Create Firewall Group",
      description:
        "Create a new firewall group.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { created: true, firewall_group }.",
      inputSchema: CreateFirewallGroupSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateFirewallGroupInput) => {
      try {
        const gateError = requireWrite(params.confirm, "fw_create_group");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        const body: Record<string, unknown> = {};
        if (params.description) body.description = params.description;

        const res = await vultrFetch("/firewalls", {
          method: "POST",
          body: JSON.stringify(body),
        });

        const data = await res.json() as { firewall_group: Record<string, unknown> };
        const formatted = formatFirewallGroup(data.firewall_group);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ created: true, firewall_group: formatted }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── vultr_fw_delete_group ────────────────────────────────────
  server.registerTool(
    "vultr_fw_delete_group",
    {
      title: "Delete Firewall Group",
      description:
        "Delete a firewall group. THIS IS IRREVERSIBLE.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { deleted: true, firewall_group_id }.",
      inputSchema: DeleteFirewallGroupSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: DeleteFirewallGroupInput) => {
      try {
        const gateError = requireWrite(params.confirm, "fw_delete_group");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        await vultrFetch(`/firewalls/${params.firewall_group_id}`, {
          method: "DELETE",
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ deleted: true, firewall_group_id: params.firewall_group_id }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── vultr_fw_list_rules ──────────────────────────────────────
  server.registerTool(
    "vultr_fw_list_rules",
    {
      title: "List Firewall Rules",
      description:
        "List all rules in a firewall group.\n\n" +
        "Returns: { total, rules[] } with id, action, protocol, port, subnet.",
      inputSchema: ListFirewallRulesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListFirewallRulesInput) => {
      try {
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.cursor) query.set("cursor", params.cursor);

        const res = await vultrFetch(`/firewalls/${params.firewall_group_id}/rules?${query}`);
        const data = await res.json() as {
          firewall_rules: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };

        const rules = data.firewall_rules || [];
        const formatted = formatFirewallRules(rules);
        const total = data.meta?.total ?? rules.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = { total, rules: formatted };
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

  // ─── vultr_fw_create_rule ─────────────────────────────────────
  server.registerTool(
    "vultr_fw_create_rule",
    {
      title: "Create Firewall Rule",
      description:
        "Create a new rule in a firewall group.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Tip: For TCP/UDP, port is required (e.g. '22', '8000:9000').\n\n" +
        "Returns: { created: true, rule }.",
      inputSchema: CreateFirewallRuleSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateFirewallRuleInput) => {
      try {
        const gateError = requireWrite(params.confirm, "fw_create_rule");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        const body: Record<string, unknown> = {
          ip_type: params.ip_type,
          protocol: params.protocol,
          subnet: params.subnet,
          subnet_size: params.subnet_size,
        };
        if (params.port) body.port = params.port;
        if (params.source) body.source = params.source;
        if (params.notes) body.notes = params.notes;

        const res = await vultrFetch(`/firewalls/${params.firewall_group_id}/rules`, {
          method: "POST",
          body: JSON.stringify(body),
        });

        const data = await res.json() as { firewall_rule: Record<string, unknown> };

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ created: true, rule: data.firewall_rule }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );
}
