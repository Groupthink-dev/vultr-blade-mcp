/**
 * Serverless inference tools: vultr_inference_list, vultr_inference_get,
 * vultr_inference_create, vultr_inference_delete, vultr_inference_usage
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vultrFetch } from "../services/vultr.js";
import { formatSubscription, formatSubscriptions, formatUsage } from "../formatters/inference.js";
import { truncateIfNeeded } from "../utils/pagination.js";
import { handleApiError } from "../utils/errors.js";
import { requireWrite } from "../utils/write-gate.js";
import {
  ListInferenceSchema,
  GetInferenceSchema,
  CreateInferenceSchema,
  DeleteInferenceSchema,
  InferenceUsageSchema,
} from "../schemas/inference.js";
import type {
  ListInferenceInput,
  GetInferenceInput,
  CreateInferenceInput,
  DeleteInferenceInput,
  InferenceUsageInput,
} from "../schemas/inference.js";

export function registerInferenceTools(server: McpServer): void {
  // ─── vultr_inference_list ─────────────────────────────────────
  server.registerTool(
    "vultr_inference_list",
    {
      title: "List Inference Subscriptions",
      description:
        "List all serverless inference subscriptions.\n\n" +
        "Returns: { total, subscriptions[] } with id, label, status.",
      inputSchema: ListInferenceSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListInferenceInput) => {
      try {
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.cursor) query.set("cursor", params.cursor);

        const res = await vultrFetch(`/inference/subscriptions?${query}`);
        const data = await res.json() as {
          subscriptions: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };

        const subs = data.subscriptions || [];
        const formatted = formatSubscriptions(subs);
        const total = data.meta?.total ?? subs.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = { total, subscriptions: formatted };
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

  // ─── vultr_inference_get ──────────────────────────────────────
  server.registerTool(
    "vultr_inference_get",
    {
      title: "Get Inference Subscription",
      description:
        "Get details for a single inference subscription.\n\n" +
        "Returns: { subscription } with id, label, status, masked API key.",
      inputSchema: GetInferenceSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetInferenceInput) => {
      try {
        const res = await vultrFetch(`/inference/subscriptions/${params.subscription_id}`);
        const data = await res.json() as { subscription: Record<string, unknown> };
        const formatted = formatSubscription(data.subscription);

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ subscription: formatted }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── vultr_inference_create ───────────────────────────────────
  server.registerTool(
    "vultr_inference_create",
    {
      title: "Create Inference Subscription",
      description:
        "Create a new serverless inference subscription.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { created: true, subscription }.",
      inputSchema: CreateInferenceSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateInferenceInput) => {
      try {
        const gateError = requireWrite(params.confirm, "inference_create");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        const res = await vultrFetch("/inference/subscriptions", {
          method: "POST",
          body: JSON.stringify({ label: params.label }),
        });

        const data = await res.json() as { subscription: Record<string, unknown> };
        const formatted = formatSubscription(data.subscription);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ created: true, subscription: formatted }, null, 2),
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

  // ─── vultr_inference_delete ───────────────────────────────────
  server.registerTool(
    "vultr_inference_delete",
    {
      title: "Delete Inference Subscription",
      description:
        "Delete an inference subscription. THIS IS IRREVERSIBLE.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { deleted: true, subscription_id }.",
      inputSchema: DeleteInferenceSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: DeleteInferenceInput) => {
      try {
        const gateError = requireWrite(params.confirm, "inference_delete");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        await vultrFetch(`/inference/subscriptions/${params.subscription_id}`, {
          method: "DELETE",
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ deleted: true, subscription_id: params.subscription_id }, null, 2),
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

  // ─── vultr_inference_usage ────────────────────────────────────
  server.registerTool(
    "vultr_inference_usage",
    {
      title: "Get Inference Usage",
      description:
        "Get usage statistics for an inference subscription.\n\n" +
        "Returns: { usage } with chat, completions, embeddings, audio token counts.",
      inputSchema: InferenceUsageSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: InferenceUsageInput) => {
      try {
        const res = await vultrFetch(`/inference/subscriptions/${params.subscription_id}/usage`);
        const data = await res.json() as { usage: Record<string, unknown> };
        const formatted = formatUsage(params.subscription_id, data.usage ?? {});

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ usage: formatted }, null, 2) }],
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
