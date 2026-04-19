/**
 * Startup script tools: vultr_script_list, vultr_script_get,
 * vultr_script_create, vultr_script_delete
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vultrFetch } from "../services/vultr.js";
import { formatScript, formatScripts } from "../formatters/script.js";
import { truncateIfNeeded } from "../utils/pagination.js";
import { handleApiError } from "../utils/errors.js";
import { requireWrite } from "../utils/write-gate.js";
import {
  ListScriptsSchema,
  GetScriptSchema,
  CreateScriptSchema,
  DeleteScriptSchema,
} from "../schemas/scripts.js";
import type {
  ListScriptsInput,
  GetScriptInput,
  CreateScriptInput,
  DeleteScriptInput,
} from "../schemas/scripts.js";

export function registerScriptTools(server: McpServer): void {
  // ─── vultr_script_list ────────────────────────────────────────
  server.registerTool(
    "vultr_script_list",
    {
      title: "List Startup Scripts",
      description:
        "List all startup scripts.\n\n" +
        "Returns: { total, scripts[] } with id, name, type, dates.",
      inputSchema: ListScriptsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListScriptsInput) => {
      try {
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.cursor) query.set("cursor", params.cursor);
        if (params.type) query.set("type", params.type);

        const res = await vultrFetch(`/startup-scripts?${query}`);
        const data = await res.json() as {
          startup_scripts: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };

        const scripts = data.startup_scripts || [];
        const formatted = formatScripts(scripts);
        const total = data.meta?.total ?? scripts.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = { total, scripts: formatted };
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

  // ─── vultr_script_get ─────────────────────────────────────────
  server.registerTool(
    "vultr_script_get",
    {
      title: "Get Startup Script",
      description:
        "Get details for a single startup script.\n\n" +
        "Returns: { script } with id, name, type, dates.",
      inputSchema: GetScriptSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetScriptInput) => {
      try {
        const res = await vultrFetch(`/startup-scripts/${params.script_id}`);
        const data = await res.json() as { startup_script: Record<string, unknown> };
        const formatted = formatScript(data.startup_script);

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ script: formatted }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── vultr_script_create ──────────────────────────────────────
  server.registerTool(
    "vultr_script_create",
    {
      title: "Create Startup Script",
      description:
        "Create a new startup script (boot or PXE).\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { created: true, script } with id, name, type.",
      inputSchema: CreateScriptSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateScriptInput) => {
      try {
        const gateError = requireWrite(params.confirm, "script_create");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        const res = await vultrFetch("/startup-scripts", {
          method: "POST",
          body: JSON.stringify({
            name: params.name,
            script: params.script,
            type: params.type,
          }),
        });

        const data = await res.json() as { startup_script: Record<string, unknown> };
        const formatted = formatScript(data.startup_script);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ created: true, script: formatted }, null, 2),
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

  // ─── vultr_script_delete ──────────────────────────────────────
  server.registerTool(
    "vultr_script_delete",
    {
      title: "Delete Startup Script",
      description:
        "Delete a startup script. THIS IS IRREVERSIBLE.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { deleted: true, script_id }.",
      inputSchema: DeleteScriptSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: DeleteScriptInput) => {
      try {
        const gateError = requireWrite(params.confirm, "script_delete");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        await vultrFetch(`/startup-scripts/${params.script_id}`, {
          method: "DELETE",
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ deleted: true, script_id: params.script_id }, null, 2),
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
