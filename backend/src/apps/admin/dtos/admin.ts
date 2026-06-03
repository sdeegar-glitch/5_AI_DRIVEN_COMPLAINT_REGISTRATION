import { z } from "zod";

export const UpdateLimitsSchema = z.object({
  uploadLimit: z.number().int().min(0, "Upload limit must be 0 or more"),
  searchLimit: z.number().int().min(0, "Search limit must be 0 or more"),
});

export const SearchUsersQuerySchema = z.object({
  q: z.string().optional(),
});

export type UpdateLimitsInput = z.infer<typeof UpdateLimitsSchema>;
export type SearchUsersQueryInput = z.infer<typeof SearchUsersQuerySchema>;
