import { z } from "zod";
import { PaginationSchema, ConfirmSchema } from "./common.js";

export const ListDomainsSchema = PaginationSchema.extend({}).strict();
export type ListDomainsInput = z.infer<typeof ListDomainsSchema>;

export const ListRecordsSchema = PaginationSchema.extend({
  domain: z
    .string()
    .min(1)
    .describe("Domain name (e.g. 'example.com')."),
}).strict();
export type ListRecordsInput = z.infer<typeof ListRecordsSchema>;

export const CreateRecordSchema = ConfirmSchema.extend({
  domain: z
    .string()
    .min(1)
    .describe("Domain name."),
  type: z
    .enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA", "SSHFP"])
    .describe("DNS record type."),
  name: z
    .string()
    .min(1)
    .describe("Record name (e.g. 'www', '@' for root)."),
  data: z
    .string()
    .min(1)
    .describe("Record value (e.g. IP address, hostname)."),
  ttl: z
    .number()
    .int()
    .optional()
    .describe("TTL in seconds (default: 300)."),
  priority: z
    .number()
    .int()
    .optional()
    .describe("Priority (required for MX and SRV records)."),
}).strict();
export type CreateRecordInput = z.infer<typeof CreateRecordSchema>;

export const UpdateRecordSchema = ConfirmSchema.extend({
  domain: z
    .string()
    .min(1)
    .describe("Domain name."),
  record_id: z
    .string()
    .min(1)
    .describe("DNS record ID."),
  name: z
    .string()
    .optional()
    .describe("Updated record name."),
  data: z
    .string()
    .optional()
    .describe("Updated record value."),
  ttl: z
    .number()
    .int()
    .optional()
    .describe("Updated TTL in seconds."),
  priority: z
    .number()
    .int()
    .optional()
    .describe("Updated priority."),
}).strict();
export type UpdateRecordInput = z.infer<typeof UpdateRecordSchema>;

export const DeleteRecordSchema = ConfirmSchema.extend({
  domain: z
    .string()
    .min(1)
    .describe("Domain name."),
  record_id: z
    .string()
    .min(1)
    .describe("DNS record ID to delete."),
}).strict();
export type DeleteRecordInput = z.infer<typeof DeleteRecordSchema>;
