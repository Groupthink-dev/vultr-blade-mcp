import { z } from "zod";
import { PaginationSchema } from "./common.js";

export const ListImagesSchema = PaginationSchema.extend({
  type: z
    .enum(["all", "windows", "linux", "freebsd", "iso", "snapshot", "backup"])
    .default("linux")
    .describe("OS type filter (default: linux)."),
}).strict();
export type ListImagesInput = z.infer<typeof ListImagesSchema>;
