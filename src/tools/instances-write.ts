/**
 * Write (gated) instance tools: vultr_vm_create, vultr_vm_delete,
 * vultr_vm_start, vultr_vm_stop, vultr_vm_reboot
 *
 * All write tools require dual-gate:
 *   1. VULTR_WRITE_ENABLED=true (env var)
 *   2. confirm=true (per-call parameter)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vultrFetch } from "../services/vultr.js";
import { formatInstance } from "../formatters/instance.js";
import { handleApiError } from "../utils/errors.js";
import { requireWrite } from "../utils/write-gate.js";
import {
  CreateInstanceSchema,
  DeleteInstanceSchema,
  StartInstanceSchema,
  StopInstanceSchema,
  RebootInstanceSchema,
} from "../schemas/instances.js";
import type {
  CreateInstanceInput,
  DeleteInstanceInput,
  StartInstanceInput,
  StopInstanceInput,
  RebootInstanceInput,
} from "../schemas/instances.js";

export function registerInstanceWriteTools(server: McpServer): void {
  // ─── vultr_vm_create ───────────────────────────────────────────
  server.registerTool(
    "vultr_vm_create",
    {
      title: "Create VM",
      description:
        "Create a new Vultr instance with GPU support and cloud-init.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true. " +
        "Creating instances incurs charges immediately.\n\n" +
        "Tip: Use vultr_vm_list_plans (type=vcg) to find GPU plans, " +
        "vultr_vm_list_images for OS IDs, and vultr_vm_ssh_keys for key IDs.\n\n" +
        "Returns: { created: true, instance } with id, status, region, plan, cost.",
      inputSchema: CreateInstanceSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateInstanceInput) => {
      try {
        const gateError = requireWrite(params.confirm, "vm_create");
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
        if (params.tag) body.tag = params.tag;
        if (params.tags) body.tags = params.tags;

        // Spread provider-specific metadata
        if (params.metadata) {
          Object.assign(body, params.metadata);
        }

        const res = await vultrFetch("/instances", {
          method: "POST",
          body: JSON.stringify(body),
        });

        const data = await res.json() as { instance: Record<string, unknown> };
        const formatted = formatInstance(data.instance);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ created: true, instance: formatted }, null, 2),
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

  // ─── vultr_vm_delete ───────────────────────────────────────────
  server.registerTool(
    "vultr_vm_delete",
    {
      title: "Delete VM",
      description:
        "Permanently delete a Vultr instance. THIS IS IRREVERSIBLE.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Tip: Use vultr_vm_get first to verify you have the right instance.\n\n" +
        "Returns: { deleted: true, instance_id }.",
      inputSchema: DeleteInstanceSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: DeleteInstanceInput) => {
      try {
        const gateError = requireWrite(params.confirm, "vm_delete");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        await vultrFetch(`/instances/${params.instance_id}`, {
          method: "DELETE",
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              deleted: true,
              instance_id: params.instance_id,
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

  // ─── vultr_vm_start ────────────────────────────────────────────
  server.registerTool(
    "vultr_vm_start",
    {
      title: "Start VM",
      description:
        "Start a stopped Vultr instance. Resumes billing.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { started: true, instance_id }.",
      inputSchema: StartInstanceSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: StartInstanceInput) => {
      try {
        const gateError = requireWrite(params.confirm, "vm_start");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        await vultrFetch(`/instances/${params.instance_id}/start`, {
          method: "POST",
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ started: true, instance_id: params.instance_id }, null, 2),
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

  // ─── vultr_vm_stop ─────────────────────────────────────────────
  server.registerTool(
    "vultr_vm_stop",
    {
      title: "Stop VM",
      description:
        "Stop (halt) a running Vultr instance. Disk is preserved; some plans stop billing.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { stopped: true, instance_id }.",
      inputSchema: StopInstanceSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: StopInstanceInput) => {
      try {
        const gateError = requireWrite(params.confirm, "vm_stop");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        await vultrFetch(`/instances/${params.instance_id}/halt`, {
          method: "POST",
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ stopped: true, instance_id: params.instance_id }, null, 2),
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

  // ─── vultr_vm_reboot ───────────────────────────────────────────
  server.registerTool(
    "vultr_vm_reboot",
    {
      title: "Reboot VM",
      description:
        "Reboot a running Vultr instance.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { rebooted: true, instance_id }.",
      inputSchema: RebootInstanceSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: RebootInstanceInput) => {
      try {
        const gateError = requireWrite(params.confirm, "vm_reboot");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        await vultrFetch(`/instances/${params.instance_id}/reboot`, {
          method: "POST",
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ rebooted: true, instance_id: params.instance_id }, null, 2),
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
