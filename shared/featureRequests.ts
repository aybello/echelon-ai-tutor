import { z } from "zod";

export const featureRequestStatuses = ["new", "reviewing", "planned", "released"] as const;
export const featureRequestStatusLabels = {
  new: "New", reviewing: "Reviewing", planned: "Planned", released: "Released",
} as const;
export const featureRequestSources = ["dashboard", "quick10", "practice"] as const;
export const featureRequestLimits = {
  courseKey: 64, pagePath: 256, suggestion: 2000, problem: 1000,
} as const;
export const featureRequestStatusSchema = z.enum(featureRequestStatuses);
export const featureRequestSourceSchema = z.enum(featureRequestSources);
export type FeatureRequestStatus = z.infer<typeof featureRequestStatusSchema>;
export type FeatureRequestSource = z.infer<typeof featureRequestSourceSchema>;

/** A pathname only, never location.href, search/hash, encoded credentials or auth links. */
export const featureRequestPagePathSchema = z.string().trim().min(1).max(256)
  .regex(/^\/(?!\/)[A-Za-z0-9/_-]*$/, "Use a pathname without query parameters or fragments")
  .refine(path => !path.split("/").some(segment =>
    /^(?:access[-_]?token|token|secret|password|reset[-_]?password|verify|magic[-_]?link|auth|callback|session|otp)$/i.test(segment)
      || segment.length > 64
      || /[A-Za-z0-9_-]{32,}/.test(segment)), "Do not include credentials or private links");

/** Strict deliberately: identity, status, timestamps and ratings are not learner input. */
export const featureRequestSubmitInputSchema = z.object({
  courseKey: z.string().trim().min(1).max(64),
  pagePath: featureRequestPagePathSchema,
  source: featureRequestSourceSchema,
  suggestion: z.string().trim().min(3).max(2000),
  problem: z.string().trim().max(1000).optional(),
  followUpAllowed: z.boolean().default(false),
}).strict();
export const featureRequestListInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  page: z.number().int().min(1).max(100000).default(1),
  status: featureRequestStatusSchema.optional(),
}).strict().default({ limit: 50, page: 1 });
export const featureRequestSetStatusInputSchema = z.object({
  id: z.number().int().positive(), status: featureRequestStatusSchema,
}).strict();
export type FeatureRequestSubmitInput = z.input<typeof featureRequestSubmitInputSchema>;
export type FeatureRequestListInput = z.input<typeof featureRequestListInputSchema>;
export type FeatureRequestSetStatusInput = z.input<typeof featureRequestSetStatusInputSchema>;
