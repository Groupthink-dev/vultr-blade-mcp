/**
 * Write (gated) bare metal tools: vultr_bm_create, vultr_bm_delete,
 * vultr_bm_start, vultr_bm_stop, vultr_bm_reboot
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vultrFetch } from "../services/vultr.js";
import { formatBaremetal } from "../formatters/baremetal.js";
import { handleApiError } from "../utils/errors.js";
import { requireWrite } from "../utils/write-gate.js";
import {
  CreateBaremetalSchema,
  DeleteBaremetalSchema,
  StartBaremetalSchema,
  StopBaremetalSchema,
  RebootBaremetalSchema,
} from "../schemas/baremetal.js";
import type {
  CreateBaremetalInput,
  DeleteBaremetalInput,
  StartBaremetalInput,
  StopBaremetalInput,
  RebootBaremetalInput,
} from "../schemas/baremetal.js";

export function registerBaremetalWriteTools(server: McpServer): void {
  // ─── vultr_bm_create ──────────────────────────────────────────
  server.registerTool(
    "vultr_bm_create",
    {
      title: "Create Bare Metal",
      description:
        "Create a new bare metal instance.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true. " +
        "Bare metal instances incur charges immediately.\n\n" +
        "Returns: { created: true, server }.",
      inputSchema: CreateBaremetalSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateBaremetalInput) => {
      try {
        const gateError = requireWrite(params.confirm, "bm_create");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        const body: Record<string, unknown> = {
          region: params.region,
          plan: params.plan,
          enable_ipv6: params.enable_ipv6,
        };

        if (params.os_id !== undefined) body.os_id = params.os_id;
        if (params.snapshot_id) body.snapshot_id = params.snapshot_id;
        if (params.hostname) body.hostname = params.hostname;
        if (params.label) body.label = params.label;
        if (params.sshkey_id) body.sshkey_id = params.sshkey_id;
        if (params.user_data) body.user_data = params.user_data;
        if (params.script_id) body.script_id = params.script_id;
        if (params.tag) body.tag = params.tag;
        if (params.tags) body.tags = params.tags;

        const res = await vultrFetch("/bare-metals", {
          method: "POST",
          body: JSON.stringify(body),
        });

        const data = await res.json() as { bare_metal: Record<string, unknown> };
        const formatted = formatBaremetal(data.bare_metal);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ created: true, server: formatted }, null, 2),
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

  // ─── vultr_bm_delete ──────────────────────────────────────────
  server.registerTool(
    "vultr_bm_delete",
    {
      title: "Delete Bare Metal",
      description:
        "Permanently delete a bare metal instance. THIS IS IRREVERSIBLE.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { deleted: true, baremetal_id }.",
      inputSchema: DeleteBaremetalSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: DeleteBaremetalInput) => {
      try {
        const gateError = requireWrite(params.confirm, "bm_delete");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        await vultrFetch(`/bare-metals/${params.baremetal_id}`, {
          method: "DELETE",
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ deleted: true, baremetal_id: params.baremetal_id }, null, 2),
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

  // ─── vultr_bm_start ───────────────────────────────────────────
  server.registerTool(
    "vultr_bm_start",
    {
      title: "Start Bare Metal",
      description:
        "Start a stopped bare metal instance.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { started: true, baremetal_id }.",
      inputSchema: StartBaremetalSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: StartBaremetalInput) => {
      try {
        const gateError = requireWrite(params.confirm, "bm_start");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        await vultrFetch(`/bare-metals/${params.baremetal_id}/start`, {
          method: "POST",
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ started: true, baremetal_id: params.baremetal_id }, null, 2),
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

  // ─── vultr_bm_stop ────────────────────────────────────────────
  server.registerTool(
    "vultr_bm_stop",
    {
      title: "Stop Bare Metal",
      description:
        "Stop (halt) a running bare metal instance.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { stopped: true, baremetal_id }.",
      inputSchema: StopBaremetalSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: StopBaremetalInput) => {
      try {
        const gateError = requireWrite(params.confirm, "bm_stop");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        await vultrFetch(`/bare-metals/${params.baremetal_id}/halt`, {
          method: "POST",
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ stopped: true, baremetal_id: params.baremetal_id }, null, 2),
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

  // ─── vultr_bm_reboot ──────────────────────────────────────────
  server.registerTool(
    "vultr_bm_reboot",
    {
      title: "Reboot Bare Metal",
      description:
        "Reboot a running bare metal instance.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { rebooted: true, baremetal_id }.",
      inputSchema: RebootBaremetalSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: RebootBaremetalInput) => {
      try {
        const gateError = requireWrite(params.confirm, "bm_reboot");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        await vultrFetch(`/bare-metals/${params.baremetal_id}/reboot`, {
          method: "POST",
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ rebooted: true, baremetal_id: params.baremetal_id }, null, 2),
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
