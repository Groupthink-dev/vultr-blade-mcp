import { z } from "zod";
import { PaginationSchema, ConfirmSchema } from "./common.js";

// ─── Read schemas ────────────────────────────────────────────────

export const ListBaremetalSchema = PaginationSchema.extend({
  label: z
    .string()
    .optional()
    .describe("Filter by label substring."),
  region: z
    .string()
    .optional()
    .describe("Filter by region ID."),
  tag: z
    .string()
    .optional()
    .describe("Filter by tag."),
}).strict();
export type ListBaremetalInput = z.infer<typeof ListBaremetalSchema>;

export const GetBaremetalSchema = z.object({
  baremetal_id: z
    .string()
    .min(1)
    .describe("Bare metal instance ID (UUID)."),
}).strict();
export type GetBaremetalInput = z.infer<typeof GetBaremetalSchema>;

export const BaremetalBandwidthSchema = z.object({
  baremetal_id: z
    .string()
    .min(1)
    .describe("Bare metal instance ID (UUID)."),
}).strict();
export type BaremetalBandwidthInput = z.infer<typeof BaremetalBandwidthSchema>;

export const ListBaremetalPlansSchema = PaginationSchema.extend({}).strict();
export type ListBaremetalPlansInput = z.infer<typeof ListBaremetalPlansSchema>;

// ─── Write schemas ───────────────────────────────────────────────

export const CreateBaremetalSchema = ConfirmSchema.extend({
  region: z
    .string()
    .min(1)
    .describe("Region ID."),
  plan: z
    .string()
    .min(1)
    .describe("Bare metal plan ID. Use vultr_bm_list_plans to see available plans."),
  os_id: z
    .number()
    .int()
    .optional()
    .describe("OS image ID. Required unless snapshot_id provided."),
  snapshot_id: z
    .string()
    .optional()
    .describe("Snapshot ID to restore from (alternative to os_id)."),
  hostname: z
    .string()
    .optional()
    .describe("Hostname."),
  label: z
    .string()
    .optional()
    .describe("Display label."),
  sshkey_id: z
    .array(z.string())
    .optional()
    .describe("SSH key IDs to inject."),
  user_data: z
    .string()
    .optional()
    .describe("Base64-encoded cloud-init user data."),
  script_id: z
    .string()
    .optional()
    .describe("Startup script ID."),
  tag: z
    .string()
    .optional()
    .describe("Tag."),
  tags: z
    .array(z.string())
    .optional()
    .describe("Tags array."),
  enable_ipv6: z
    .boolean()
    .default(true)
    .describe("Enable IPv6 (default: true)."),
}).strict();
export type CreateBaremetalInput = z.infer<typeof CreateBaremetalSchema>;

export const DeleteBaremetalSchema = ConfirmSchema.extend({
  baremetal_id: z
    .string()
    .min(1)
    .describe("Bare metal instance ID to delete."),
}).strict();
export type DeleteBaremetalInput = z.infer<typeof DeleteBaremetalSchema>;

export const StartBaremetalSchema = ConfirmSchema.extend({
  baremetal_id: z
    .string()
    .min(1)
    .describe("Bare metal instance ID to start."),
}).strict();
export type StartBaremetalInput = z.infer<typeof StartBaremetalSchema>;

export const StopBaremetalSchema = ConfirmSchema.extend({
  baremetal_id: z
    .string()
    .min(1)
    .describe("Bare metal instance ID to stop (halt)."),
}).strict();
export type StopBaremetalInput = z.infer<typeof StopBaremetalSchema>;

export const RebootBaremetalSchema = ConfirmSchema.extend({
  baremetal_id: z
    .string()
    .min(1)
    .describe("Bare metal instance ID to reboot."),
}).strict();
export type RebootBaremetalInput = z.infer<typeof RebootBaremetalSchema>;
