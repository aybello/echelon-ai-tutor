import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { persistedPartnershipInquiry } from "./partnershipInquiry";
import {
  getTeamTotalPriceCents,
  getTeamStreamLabel,
  type TeamStreamTier,
} from "../shared/teamPricing";

/**
 * Institutional buying requests are only receipts, NEVER payments, signed
 * quotations, purchase orders or entitlements. The authoritative price is
 * computed on the server; staff issue formal documents after review.
 */
const base = z.object({
  requestKey: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  email: z.string().email().max(320),
  organization: z.string().trim().min(2).max(128),
  region: z.enum(["ontario", "western", "nova-scotia"]),
  notes: z.string().trim().max(500).optional().default(""),
  website: z.string().max(200).optional().default(""),
});

export const municipalRequestInput = z.discriminatedUnion("kind", [
  base.extend({
    kind: z.literal("quote"),
    tier: z.enum(["stream-water", "stream-wastewater", "stream-water-dist", "stream-wastewater-coll", "all-access"]),
    seats: z.number().int().min(5).max(500),
  }),
  base.extend({ kind: z.literal("pilot") }),
]);

export const municipalProcurementRouter = router({
  request: publicProcedure.input(municipalRequestInput).mutation(async ({ input }) => {
    // Existing partnership persistence is idempotent by requestKey, searchable
    // by admins, and durable even when email notifications fail.
    const isQuote = input.kind === "quote";
    const tier: TeamStreamTier | null = isQuote ? input.tier : null;
    const totalCents = isQuote ? getTeamTotalPriceCents(input.region, input.tier, input.seats) : null;
    const requestText = isQuote
      ? [
          "Request: municipal Teams price quotation and purchasing details",
          "Requested product: " + getTeamStreamLabel(input.region, input.tier),
          "Named annual operator licences: " + input.seats,
          "Server-calculated annual amount before tax (CAD): " + (totalCents! / 100).toFixed(2),
          "Requested terms: formal quotation / PO acceptance / invoicing review",
        ].join("\n")
      : [
          "Request: controlled three-operator utility evaluation",
          "Proposed evaluation: up to 3 operators for up to 14 days",
          "No access is granted until the request is reviewed and explicitly provisioned.",
        ].join("\n");
    const message = [
      requestText,
      "Region: " + input.region,
      "Notes: " + input.notes,
      "Status: pending staff review; not an invoice, a binding quote, or pilot activation",
    ].join("\n");
    const result = await persistedPartnershipInquiry({
      requestKey: input.requestKey,
      name: input.name,
      email: input.email,
      organization: input.organization,
      partnershipType: "Municipal Utility",
      message,
      website: input.website,
    });
    return {
      success: result.success,
      receiptId: result.receiptId,
      status: "pending_review" as const,
      kind: input.kind,
      region: input.region,
      tier,
      seats: isQuote ? input.seats : null,
      annualTotalBeforeTaxCents: totalCents,
      currency: "CAD" as const,
    };
  }),
});
