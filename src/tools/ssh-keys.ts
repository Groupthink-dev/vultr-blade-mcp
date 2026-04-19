/**
 * SSH key tools: vultr_vm_ssh_keys
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vultrFetch } from "../services/vultr.js";
import { formatSshKeys } from "../formatters/ssh-key.js";
import { truncateIfNeeded } from "../utils/pagination.js";
import { handleApiError } from "../utils/errors.js";
import { ListSshKeysSchema } from "../schemas/ssh-keys.js";
import type { ListSshKeysInput } from "../schemas/ssh-keys.js";

export function registerSshKeyTools(server: McpServer): void {
  server.registerTool(
    "vultr_vm_ssh_keys",
    {
      title: "List SSH Keys",
      description:
        "List SSH keys available for injection into new instances.\n\n" +
        "Tip: Use the returned id values in vultr_vm_create's sshkey_id array.\n\n" +
        "Returns: { total, ssh_keys[] } with id, name, date_created. Key material is not returned.",
      inputSchema: ListSshKeysSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListSshKeysInput) => {
      try {
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.cursor) query.set("cursor", params.cursor);

        const res = await vultrFetch(`/ssh-keys?${query}`);
        const data = await res.json() as {
          ssh_keys: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };

        const keys = data.ssh_keys || [];
        const formatted = formatSshKeys(keys);
        const total = data.meta?.total ?? keys.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = {
          total,
          ssh_keys: formatted,
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
}
