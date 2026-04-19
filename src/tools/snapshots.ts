/**
 * Snapshot tools: vultr_snap_list, vultr_snap_get,
 * vultr_snap_create, vultr_snap_delete
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vultrFetch } from "../services/vultr.js";
import { formatSnapshot, formatSnapshots } from "../formatters/snapshot.js";
import { truncateIfNeeded } from "../utils/pagination.js";
import { handleApiError } from "../utils/errors.js";
import { requireWrite } from "../utils/write-gate.js";
import {
  ListSnapshotsSchema,
  GetSnapshotSchema,
  CreateSnapshotSchema,
  DeleteSnapshotSchema,
} from "../schemas/snapshots.js";
import type {
  ListSnapshotsInput,
  GetSnapshotInput,
  CreateSnapshotInput,
  DeleteSnapshotInput,
} from "../schemas/snapshots.js";

export function registerSnapshotTools(server: McpServer): void {
  // ─── vultr_snap_list ──────────────────────────────────────────
  server.registerTool(
    "vultr_snap_list",
    {
      title: "List Snapshots",
      description:
        "List all snapshots.\n\n" +
        "Returns: { total, snapshots[] } with id, description, status, size, os_id, date.",
      inputSchema: ListSnapshotsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListSnapshotsInput) => {
      try {
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.cursor) query.set("cursor", params.cursor);
        if (params.description) query.set("description", params.description);

        const res = await vultrFetch(`/snapshots?${query}`);
        const data = await res.json() as {
          snapshots: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };

        const snapshots = data.snapshots || [];
        const formatted = formatSnapshots(snapshots);
        const total = data.meta?.total ?? snapshots.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = { total, snapshots: formatted };
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

  // ─── vultr_snap_get ───────────────────────────────────────────
  server.registerTool(
    "vultr_snap_get",
    {
      title: "Get Snapshot",
      description:
        "Get details for a single snapshot.\n\n" +
        "Returns: { snapshot } with id, description, status, size, os_id, date.",
      inputSchema: GetSnapshotSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetSnapshotInput) => {
      try {
        const res = await vultrFetch(`/snapshots/${params.snapshot_id}`);
        const data = await res.json() as { snapshot: Record<string, unknown> };
        const formatted = formatSnapshot(data.snapshot);

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ snapshot: formatted }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── vultr_snap_create ────────────────────────────────────────
  server.registerTool(
    "vultr_snap_create",
    {
      title: "Create Snapshot",
      description:
        "Create a snapshot from an existing instance.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Note: Snapshot creation takes time. Poll vultr_snap_get to check status.\n\n" +
        "Returns: { created: true, snapshot }.",
      inputSchema: CreateSnapshotSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateSnapshotInput) => {
      try {
        const gateError = requireWrite(params.confirm, "snap_create");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        const body: Record<string, unknown> = {
          instance_id: params.instance_id,
        };
        if (params.description) body.description = params.description;

        const res = await vultrFetch("/snapshots", {
          method: "POST",
          body: JSON.stringify(body),
        });

        const data = await res.json() as { snapshot: Record<string, unknown> };
        const formatted = formatSnapshot(data.snapshot);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ created: true, snapshot: formatted }, null, 2),
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

  // ─── vultr_snap_delete ────────────────────────────────────────
  server.registerTool(
    "vultr_snap_delete",
    {
      title: "Delete Snapshot",
      description:
        "Delete a snapshot. THIS IS IRREVERSIBLE.\n\n" +
        "Safety: Requires VULTR_WRITE_ENABLED=true AND confirm=true.\n\n" +
        "Returns: { deleted: true, snapshot_id }.",
      inputSchema: DeleteSnapshotSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: DeleteSnapshotInput) => {
      try {
        const gateError = requireWrite(params.confirm, "snap_delete");
        if (gateError) {
          return {
            content: [{ type: "text" as const, text: gateError }],
            isError: true,
          };
        }

        await vultrFetch(`/snapshots/${params.snapshot_id}`, {
          method: "DELETE",
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ deleted: true, snapshot_id: params.snapshot_id }, null, 2),
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
