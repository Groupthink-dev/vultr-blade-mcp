/**
 * Account and billing tools: vultr_account_info, vultr_billing_history
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vultrFetch } from "../services/vultr.js";
import { formatAccountInfo, formatBillingItems } from "../formatters/account.js";
import { truncateIfNeeded } from "../utils/pagination.js";
import { handleApiError } from "../utils/errors.js";
import { AccountInfoSchema, BillingHistorySchema } from "../schemas/account.js";
import type { AccountInfoInput, BillingHistoryInput } from "../schemas/account.js";

export function registerAccountTools(server: McpServer): void {
  // ─── vultr_account_info ───────────────────────────────────────
  server.registerTool(
    "vultr_account_info",
    {
      title: "Account Info",
      description:
        "Get account information including balance and pending charges.\n\n" +
        "Returns: { account } with name, email, balance, pending_charges, last payment.",
      inputSchema: AccountInfoSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_params: AccountInfoInput) => {
      try {
        const res = await vultrFetch("/account");
        const data = await res.json() as { account: Record<string, unknown> };
        const formatted = formatAccountInfo(data.account);

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ account: formatted }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── vultr_billing_history ────────────────────────────────────
  server.registerTool(
    "vultr_billing_history",
    {
      title: "Billing History",
      description:
        "Get billing history with charges and payments.\n\n" +
        "Returns: { total, items[] } with date, type, description, amount, balance.",
      inputSchema: BillingHistorySchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: BillingHistoryInput) => {
      try {
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.cursor) query.set("cursor", params.cursor);

        const res = await vultrFetch(`/billing/history?${query}`);
        const data = await res.json() as {
          billing_history: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };

        const items = data.billing_history || [];
        const formatted = formatBillingItems(items);
        const total = data.meta?.total ?? items.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = { total, items: formatted };
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
