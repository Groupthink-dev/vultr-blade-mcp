import { z } from "zod";
import { PaginationSchema, ConfirmSchema } from "./common.js";

// ─── Read schemas ────────────────────────────────────────────────

export const ListInstancesSchema = PaginationSchema.extend({
  label: z
    .string()
    .optional()
    .describe("Filter instances by label substring."),
  region: z
    .string()
    .optional()
    .describe("Filter by region ID (e.g. 'ewr', 'syd')."),
  tag: z
    .string()
    .optional()
    .describe("Filter by tag."),
}).strict();
export type ListInstancesInput = z.infer<typeof ListInstancesSchema>;

export const GetInstanceSchema = z.object({
  instance_id: z
    .string()
    .min(1)
    .describe("Vultr instance ID (UUID)."),
}).strict();
export type GetInstanceInput = z.infer<typeof GetInstanceSchema>;

export const InstanceStatusSchema = z.object({
  instance_id: z
    .string()
    .min(1)
    .describe("Vultr instance ID (UUID)."),
}).strict();
export type InstanceStatusInput = z.infer<typeof InstanceStatusSchema>;

// ─── Write schemas ───────────────────────────────────────────────

export const CreateInstanceSchema = ConfirmSchema.extend({
  region: z
    .string()
    .min(1)
    .describe("Region ID (e.g. 'ewr', 'syd'). Use vultr_vm_list_regions to see available regions."),
  plan: z
    .string()
    .min(1)
    .describe("Plan ID (e.g. 'vcg-a100-1c-6g-80gb'). Use vultr_vm_list_plans to see GPU plans."),
  os_id: z
    .number()
    .int()
    .optional()
    .describe("OS image ID. Use vultr_vm_list_images to see available images. Required unless snapshot_id or iso_id provided."),
  snapshot_id: z
    .string()
    .optional()
    .describe("Snapshot ID to restore from (alternative to os_id)."),
  hostname: z
    .string()
    .optional()
    .describe("Hostname for the instance."),
  label: z
    .string()
    .optional()
    .describe("Display label for the instance."),
  sshkey_id: z
    .array(z.string())
    .optional()
    .describe("Array of SSH key IDs to inject. Use vultr_vm_ssh_keys to list available keys."),
  user_data: z
    .string()
    .optional()
    .describe("Base64-encoded cloud-init user data. Standard provisioning primitive for GPU worker deployment."),
  tag: z
    .string()
    .optional()
    .describe("Tag for the instance."),
  tags: z
    .array(z.string())
    .optional()
    .describe("Tags array for the instance."),
  enable_ipv6: z
    .boolean()
    .default(true)
    .describe("Enable IPv6 (default: true)."),
  script_id: z
    .string()
    .optional()
    .describe("Startup script ID to run on boot. Use vultr_script_list to see available scripts."),
  firewall_group_id: z
    .string()
    .optional()
    .describe("Firewall group ID to attach. Use vultr_fw_list_groups to see available groups."),
  metadata: z
    .record(z.unknown())
    .optional()
    .describe("Provider-specific options (passed as additional body fields)."),
}).strict();
export type CreateInstanceInput = z.infer<typeof CreateInstanceSchema>;

export const DeleteInstanceSchema = ConfirmSchema.extend({
  instance_id: z
    .string()
    .min(1)
    .describe("Vultr instance ID (UUID) to delete."),
}).strict();
export type DeleteInstanceInput = z.infer<typeof DeleteInstanceSchema>;

export const StartInstanceSchema = ConfirmSchema.extend({
  instance_id: z
    .string()
    .min(1)
    .describe("Vultr instance ID (UUID) to start."),
}).strict();
export type StartInstanceInput = z.infer<typeof StartInstanceSchema>;

export const StopInstanceSchema = ConfirmSchema.extend({
  instance_id: z
    .string()
    .min(1)
    .describe("Vultr instance ID (UUID) to stop (halt)."),
}).strict();
export type StopInstanceInput = z.infer<typeof StopInstanceSchema>;

export const RebootInstanceSchema = ConfirmSchema.extend({
  instance_id: z
    .string()
    .min(1)
    .describe("Vultr instance ID (UUID) to reboot."),
}).strict();
export type RebootInstanceInput = z.infer<typeof RebootInstanceSchema>;

export const InstanceBandwidthSchema = z.object({
  instance_id: z
    .string()
    .min(1)
    .describe("Vultr instance ID (UUID)."),
  date_range: z
    .enum(["day", "week", "month"])
    .default("month")
    .describe("Time range for bandwidth data (default: month)."),
}).strict();
export type InstanceBandwidthInput = z.infer<typeof InstanceBandwidthSchema>;

export const UpdateInstanceSchema = ConfirmSchema.extend({
  instance_id: z
    .string()
    .min(1)
    .describe("Vultr instance ID (UUID) to update."),
  label: z
    .string()
    .optional()
    .describe("New display label."),
  plan: z
    .string()
    .optional()
    .describe("New plan ID (upgrade/downgrade)."),
  os_id: z
    .number()
    .int()
    .optional()
    .describe("New OS image ID (reinstall)."),
  tag: z
    .string()
    .optional()
    .describe("New tag."),
  tags: z
    .array(z.string())
    .optional()
    .describe("New tags array."),
  firewall_group_id: z
    .string()
    .optional()
    .describe("Firewall group ID to attach."),
  enable_ipv6: z
    .boolean()
    .optional()
    .describe("Enable/disable IPv6."),
  user_data: z
    .string()
    .optional()
    .describe("Base64-encoded cloud-init user data."),
}).strict();
export type UpdateInstanceInput = z.infer<typeof UpdateInstanceSchema>;

export const SetReverseDnsSchema = ConfirmSchema.extend({
  instance_id: z
    .string()
    .min(1)
    .describe("Vultr instance ID (UUID)."),
  ip: z
    .string()
    .min(1)
    .describe("IPv4 address to set reverse DNS for."),
  reverse: z
    .string()
    .min(1)
    .describe("Reverse DNS hostname (e.g. 'gpu-worker-1.example.com')."),
}).strict();
export type SetReverseDnsInput = z.infer<typeof SetReverseDnsSchema>;
