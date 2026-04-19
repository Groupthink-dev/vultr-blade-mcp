import { z } from "zod";
import { DEFAULT_PER_PAGE } from "../constants.js";

/** Pagination schema for list operations. Vultr uses cursor-based pagination. */
export const PaginationSchema = z.object({
  per_page: z
    .number()
    .int()
    .min(1)
    .max(500)
    .default(DEFAULT_PER_PAGE)
    .describe(`Results per page (default: ${DEFAULT_PER_PAGE}, max: 500).`),
  cursor: z
    .string()
    .optional()
    .describe("Pagination cursor from a previous response."),
});

/** Confirmation gate for write operations. */
export const ConfirmSchema = z.object({
  confirm: z
    .literal(true)
    .describe("Safety gate: must be explicitly set to true to proceed with this write operation."),
});
