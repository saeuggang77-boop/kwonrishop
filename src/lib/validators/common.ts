import { z } from "zod/v4";

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const idParamSchema = z.object({
  id: z.string().cuid(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
