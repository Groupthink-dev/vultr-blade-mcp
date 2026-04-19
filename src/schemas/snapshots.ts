import { z } from "zod";
import { PaginationSchema, ConfirmSchema } from "./common.js";

export const ListSnapshotsSchema = PaginationSchema.extend({
  description: z
    .string()
    .optional()
    .describe("Filter snapshots by description substring."),
}).strict();
export type ListSnapshotsInput = z.infer<typeof ListSnapshotsSchema>;

export const GetSnapshotSchema = z.object({
  snapshot_id: z
    .string()
    .min(1)
    .describe("Snapshot ID."),
}).strict();
export type GetSnapshotInput = z.infer<typeof GetSnapshotSchema>;

export const CreateSnapshotSchema = ConfirmSchema.extend({
  instance_id: z
    .string()
    .min(1)
    .describe("Instance ID to snapshot."),
  description: z
    .string()
    .optional()
    .describe("Description for the snapshot."),
}).strict();
export type CreateSnapshotInput = z.infer<typeof CreateSnapshotSchema>;

export const DeleteSnapshotSchema = ConfirmSchema.extend({
  snapshot_id: z
    .string()
    .min(1)
    .describe("Snapshot ID to delete."),
}).strict();
export type DeleteSnapshotInput = z.infer<typeof DeleteSnapshotSchema>;
