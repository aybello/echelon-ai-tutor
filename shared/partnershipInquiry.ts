import { z } from "zod";

export const PARTNERSHIP_TYPES = ["", "Municipal Utility", "Training Provider", "College or University", "Industry Association", "Other"] as const;

export const partnershipInquirySchema = z.object({
  requestKey: z.string().uuid(),
  name: z.string().min(1).max(100).refine(value => value.trim().length > 0, "Name is required"),
  email: z.string().email().max(320),
  organization: z.string().min(1).max(128).refine(value => value.trim().length > 0, "Organization is required"),
  partnershipType: z.enum(PARTNERSHIP_TYPES),
  message: z.string().min(10).max(2000).refine(value => value.trim().length >= 10, "Message must be at least 10 characters"),
  website: z.string().max(200).optional().default(""),
});

export type PartnershipInquiryInput = z.input<typeof partnershipInquirySchema>;
