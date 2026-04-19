import { z } from "zod";
import { PaginationSchema } from "./common.js";

export const ListPlansSchema = PaginationSchema.extend({
  type: z
    .enum(["all", "vc2", "vhf", "vhp", "vdc", "vcg", "voc", "vcg-a16", "vcg-a100", "vcg-l40s"])
    .default("vcg")
    .describe(
      "Plan type filter. GPU plans: vcg (all GPU), vcg-a16, vcg-a100, vcg-l40s. " +
      "CPU plans: vc2 (regular), vhf (high freq), vhp (high perf), vdc (dedicated). " +
      "Default: vcg (GPU plans only)."
    ),
  region: z
    .string()
    .optional()
    .describe("Filter plans available in a specific region (e.g. 'ewr')."),
}).strict();
export type ListPlansInput = z.infer<typeof ListPlansSchema>;

export const ListRegionsSchema = PaginationSchema.extend({}).strict();
export type ListRegionsInput = z.infer<typeof ListRegionsSchema>;
