import { z } from "zod";
import { PaginationSchema, ConfirmSchema } from "./common.js";

export const ListFirewallGroupsSchema = PaginationSchema.extend({}).strict();
export type ListFirewallGroupsInput = z.infer<typeof ListFirewallGroupsSchema>;

export const GetFirewallGroupSchema = z.object({
  firewall_group_id: z
    .string()
    .min(1)
    .describe("Firewall group ID."),
}).strict();
export type GetFirewallGroupInput = z.infer<typeof GetFirewallGroupSchema>;

export const CreateFirewallGroupSchema = ConfirmSchema.extend({
  description: z
    .string()
    .optional()
    .describe("Description for the firewall group."),
}).strict();
export type CreateFirewallGroupInput = z.infer<typeof CreateFirewallGroupSchema>;

export const DeleteFirewallGroupSchema = ConfirmSchema.extend({
  firewall_group_id: z
    .string()
    .min(1)
    .describe("Firewall group ID to delete."),
}).strict();
export type DeleteFirewallGroupInput = z.infer<typeof DeleteFirewallGroupSchema>;

export const ListFirewallRulesSchema = PaginationSchema.extend({
  firewall_group_id: z
    .string()
    .min(1)
    .describe("Firewall group ID."),
}).strict();
export type ListFirewallRulesInput = z.infer<typeof ListFirewallRulesSchema>;

export const CreateFirewallRuleSchema = ConfirmSchema.extend({
  firewall_group_id: z
    .string()
    .min(1)
    .describe("Firewall group ID."),
  ip_type: z
    .enum(["v4", "v6"])
    .describe("IP type: 'v4' or 'v6'."),
  protocol: z
    .enum(["icmp", "tcp", "udp", "gre", "esp", "ah"])
    .describe("Network protocol."),
  subnet: z
    .string()
    .min(1)
    .describe("IP subnet (e.g. '0.0.0.0' for any, '10.0.0.0' for specific)."),
  subnet_size: z
    .number()
    .int()
    .min(0)
    .max(128)
    .describe("Subnet CIDR prefix size (e.g. 0 for any, 24 for /24)."),
  port: z
    .string()
    .optional()
    .describe("Port or port range (e.g. '22', '8000:9000'). Required for TCP/UDP."),
  source: z
    .string()
    .optional()
    .describe("Source type: '' (custom), 'cloudflare' (Cloudflare IPs)."),
  notes: z
    .string()
    .optional()
    .describe("Human-readable note for this rule."),
}).strict();
export type CreateFirewallRuleInput = z.infer<typeof CreateFirewallRuleSchema>;
