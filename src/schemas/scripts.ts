import { z } from "zod";
import { PaginationSchema, ConfirmSchema } from "./common.js";

export const ListScriptsSchema = PaginationSchema.extend({
  type: z
    .enum(["boot", "pxe"])
    .optional()
    .describe("Filter by script type (default: all)."),
}).strict();
export type ListScriptsInput = z.infer<typeof ListScriptsSchema>;

export const GetScriptSchema = z.object({
  script_id: z
    .string()
    .min(1)
    .describe("Startup script ID."),
}).strict();
export type GetScriptInput = z.infer<typeof GetScriptSchema>;

export const CreateScriptSchema = ConfirmSchema.extend({
  name: z
    .string()
    .min(1)
    .describe("Name for the startup script."),
  script: z
    .string()
    .min(1)
    .describe("Base64-encoded script content (boot) or PXE script URL."),
  type: z
    .enum(["boot", "pxe"])
    .default("boot")
    .describe("Script type: 'boot' (cloud-init/bash) or 'pxe' (iPXE)."),
}).strict();
export type CreateScriptInput = z.infer<typeof CreateScriptSchema>;

export const DeleteScriptSchema = ConfirmSchema.extend({
  script_id: z
    .string()
    .min(1)
    .describe("Startup script ID to delete."),
}).strict();
export type DeleteScriptInput = z.infer<typeof DeleteScriptSchema>;
