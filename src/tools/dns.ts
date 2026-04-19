/**
 * DNS tools: vultr_dns_list_domains, vultr_dns_list_records,
 * vultr_dns_create_record, vultr_dns_update_record, vultr_dns_delete_record
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vultrFetch } from "../services/vultr.js";
import { formatDomains, formatRecord, formatRecords } from "../formatters/dns.js";
import { truncateIfNeeded } from "../utils/pagination.js";
import { handleApiError } from "../utils/errors.js";
import { requireWrite } from "../utils/write-gate.js";
import {
  ListDomainsSchema,
  ListRecordsSchema,
  CreateRecordSchema,
  UpdateRecordSchema,
  DeleteRecordSchema,
} from "../schemas/dns.js";
import type {
  ListDomainsInput,
  ListRecordsInput,
  CreateRecordInput,
  UpdateRecordInput,
  DeleteRecordInput,
} from "../schemas/dns.js";

export function registerDnsTools(server: McpServer): void {
  // ─── vultr_dns_list_domains ───────────────────────────────────
  server.registerTool(
    "vultr_dns_list_domains",
    {
      title: "List DNS Domains",
      description:
        "List all DNS domains managed in Vultr.\n\n" +
        "Returns: { total, domains[] } with domain name, DNSSEC status, date.",
      inputSchema: ListDomainsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListDomainsInput) => {
      try {
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.cursor) query.set("cursor", params.cursor);

        const res = await vultrFetch(`/domains?${query}`);
        const data = await res.json() as {
          domains: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };

        const domains = data.domains || [];
        const formatted = formatDomains(domains);
        const total = data.meta?.total ?? domains.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = { total, domains: formatted };
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

  // ─── vultr_dns_list_records ───────────────────────────────────
  server.registerTool(
    "vultr_dns_list_records",
    {
      title: "List DNS Records",
      description:
        "List all DNS records for a domain.\n\n" +
        "Returns: { total, records[] } with id, type, name, data, TTL, priority.",
      inputSchema: ListRecordsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListRecordsInput) => {
      try {
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.cursor) query.set("cursor", params.cursor);

        const res = await vultrFetch(`/domains/${params.domain}/records?${query}`);
        const data = await res.json() as {
          records: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };

        const records = data.records || [];
        const formatted = formatRecords(records);
        const total = data.meta?.total ?? records.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = { total, records: formatted };
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

  // ─── vultr_dns_create_record ──────────────────────────────────
  server.registerTool(
    "vultr_dns_create_record",
    {
      title: "Create DNS Record",
      description:
        "Create a new DNS record for a domain.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { created: true, record }.",
      inputSchema: CreateRecordSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateRecordInput) => {
      try {
        const gateError = requireWrite(params.confirm, "dns_create_record");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        const body: Record<string, unknown> = {
          type: params.type,
          name: params.name,
          data: params.data,
        };
        if (params.ttl !== undefined) body.ttl = params.ttl;
        if (params.priority !== undefined) body.priority = params.priority;

        const res = await vultrFetch(`/domains/${params.domain}/records`, {
          method: "POST",
          body: JSON.stringify(body),
        });

        const data = await res.json() as { record: Record<string, unknown> };
        const formatted = formatRecord(data.record);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ created: true, record: formatted }, null, 2),
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

  // ─── vultr_dns_update_record ──────────────────────────────────
  server.registerTool(
    "vultr_dns_update_record",
    {
      title: "Update DNS Record",
      description:
        "Update an existing DNS record.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { updated: true, domain, record_id }.",
      inputSchema: UpdateRecordSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: UpdateRecordInput) => {
      try {
        const gateError = requireWrite(params.confirm, "dns_update_record");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        const body: Record<string, unknown> = {};
        if (params.name !== undefined) body.name = params.name;
        if (params.data !== undefined) body.data = params.data;
        if (params.ttl !== undefined) body.ttl = params.ttl;
        if (params.priority !== undefined) body.priority = params.priority;

        await vultrFetch(`/domains/${params.domain}/records/${params.record_id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              updated: true,
              domain: params.domain,
              record_id: params.record_id,
            }, null, 2),
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

  // ─── vultr_dns_delete_record ──────────────────────────────────
  server.registerTool(
    "vultr_dns_delete_record",
    {
      title: "Delete DNS Record",
      description:
        "Delete a DNS record. THIS IS IRREVERSIBLE.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { deleted: true, domain, record_id }.",
      inputSchema: DeleteRecordSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: DeleteRecordInput) => {
      try {
        const gateError = requireWrite(params.confirm, "dns_delete_record");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        await vultrFetch(`/domains/${params.domain}/records/${params.record_id}`, {
          method: "DELETE",
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              deleted: true,
              domain: params.domain,
              record_id: params.record_id,
            }, null, 2),
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
