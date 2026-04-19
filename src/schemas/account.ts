import { z } from "zod";
import { PaginationSchema } from "./common.js";

export const AccountInfoSchema = z.object({}).strict();
export type AccountInfoInput = z.infer<typeof AccountInfoSchema>;

export const BillingHistorySchema = PaginationSchema.extend({}).strict();
export type BillingHistoryInput = z.infer<typeof BillingHistorySchema>;
