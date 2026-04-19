/**
 * OS image tools: vultr_vm_list_images
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vultrFetch } from "../services/vultr.js";
import { formatImages } from "../formatters/image.js";
import { truncateIfNeeded } from "../utils/pagination.js";
import { handleApiError } from "../utils/errors.js";
import { ListImagesSchema } from "../schemas/images.js";
import type { ListImagesInput } from "../schemas/images.js";

export function registerImageTools(server: McpServer): void {
  server.registerTool(
    "vultr_vm_list_images",
    {
      title: "List OS Images",
      description:
        "List available OS images for Vultr instances.\n\n" +
        "Tip: Default filter is type=linux. Use the returned id as os_id in vultr_vm_create.\n\n" +
        "Returns: { total, images[] } with id, name, arch, family.",
      inputSchema: ListImagesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListImagesInput) => {
      try {
        const query = new URLSearchParams();
        query.set("per_page", String(params.per_page));
        if (params.type !== "all") query.set("type", params.type);
        if (params.cursor) query.set("cursor", params.cursor);

        const res = await vultrFetch(`/os?${query}`);
        const data = await res.json() as {
          os: Record<string, unknown>[];
          meta?: { total: number; links?: { next: string } };
        };

        const images = data.os || [];
        const formatted = formatImages(images);
        const total = data.meta?.total ?? images.length;
        const nextCursor = data.meta?.links?.next ?? "";

        const output: Record<string, unknown> = {
          total,
          images: formatted,
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
