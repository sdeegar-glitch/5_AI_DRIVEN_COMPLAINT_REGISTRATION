import { z } from "zod";

export const SaveComplaintSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(12, "Title must be 12 characters or less"),
  complainantName: z.string().trim().min(1, "Complainant Name is required"),
  complainantContact: z.string().trim().min(1, "Complainant Contact is required"),
  incidentDatetime: z.string().trim().min(1, "Date & Time of Incident is required"),
  incidentPlace: z.string().trim().min(1, "Place of Incident is required"),
  accusedDetails: z.string().trim().min(1, "Accused Details are required"),
  description: z.string().trim().min(1, "Description is required"),
  ipcSections: z.array(z.string()),
  imageUrl: z.string().url("Valid Image URL is required"),
});

export const SearchQuerySchema = z.object({
  q: z.string().default(""),
  ai: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
});

export type SaveComplaintInput = z.infer<typeof SaveComplaintSchema>;
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
