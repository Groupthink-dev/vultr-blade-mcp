import { z } from "zod";
import { PaginationSchema } from "./common.js";

export const ListSshKeysSchema = PaginationSchema.extend({}).strict();
export type ListSshKeysInput = z.infer<typeof ListSshKeysSchema>;
