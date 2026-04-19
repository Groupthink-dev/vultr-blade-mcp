import { z } from "zod";
import { PaginationSchema, ConfirmSchema } from "./common.js";

export const ListInferenceSchema = PaginationSchema.extend({}).strict();
export type ListInferenceInput = z.infer<typeof ListInferenceSchema>;

export const GetInferenceSchema = z.object({
  subscription_id: z
    .string()
    .min(1)
    .describe("Inference subscription ID."),
}).strict();
export type GetInferenceInput = z.infer<typeof GetInferenceSchema>;

export const CreateInferenceSchema = ConfirmSchema.extend({
  label: z
    .string()
    .min(1)
    .describe("Label for the inference subscription."),
}).strict();
export type CreateInferenceInput = z.infer<typeof CreateInferenceSchema>;

export const DeleteInferenceSchema = ConfirmSchema.extend({
  subscription_id: z
    .string()
    .min(1)
    .describe("Inference subscription ID to delete."),
}).strict();
export type DeleteInferenceInput = z.infer<typeof DeleteInferenceSchema>;

export const InferenceUsageSchema = z.object({
  subscription_id: z
    .string()
    .min(1)
    .describe("Inference subscription ID."),
}).strict();
export type InferenceUsageInput = z.infer<typeof InferenceUsageSchema>;
