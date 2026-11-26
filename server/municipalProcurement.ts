import { z } from "zod";
import { createHash } from "node:crypto";
import { router, publicProcedure } from "./_core/trpc";
import { persistedPartnershipInquiry } from "./partnershipInquiry";
import { municipalCallbackHeader } from "../shared/municipalCallback";
import { checkMunicipalRequestThrottle } from "./municipalRequestThrottle";
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
  phone: z.string().trim().max(32).regex(/^[+()\d .-]*$/).optional().default(""),
  callbackRequested: z.boolean().optional().default(false),
  preferredCallbackTime: z.string().trim().max(120).optional().default(""),
});

export const municipalRequestInput = z.discriminatedUnion("kind", [
  base.extend({
    kind: z.literal("quote"),
    tier: z.enum(["stream-water", "stream-wastewater", "stream-water-dist", "stream-wastewater-coll", "all-access"]),
    seats: z.number().int().min(5).max(500),
  }),
  base.extend({ kind: z.literal("pilot") }),
]).superRefine((input, ctx) => {
  if (input.callbackRequested !== Boolean(input.phone.replace(/\D/g, "").length >= 7)) {
    ctx.addIssue({ code: "custom", path: ["phone"], message: "To request a call, provide a valid phone number and select the callback permission. Otherwise leave the phone blank." });
  }
  if (!input.callbackRequested && (input.phone || input.preferredCallbackTime)) {
    ctx.addIssue({ code: "custom", path: ["callbackRequested"], message: "Callback details require your permission to call about this request." });
  }
});

export const municipalProcurementRouter = router({
  request: publicProcedure.input(municipalRequestInput).mutation(async ({ input, ctx }) => {
    checkMunicipalRequestThrottle(ctx.req.ip ?? "unknown", input.email);
    // Existing partnership persistence is idempotent by requestKey, searchable
    // by admins, and durable even when email notifications fail.
    const isQuote = input.kind === "quote";
    const tier: TeamStreamTier | null = isQuote ? input.tier : null;
    const totalCents = isQuote ? getTeamTotalPriceCents(input.region, input.tier, input.seats) : null;
    // Idempotency must cover the whole priced payload, not just the client
    // supplied key. Replaying one key with different seats or a different tier
    // would otherwise return the ORIGINAL receipt number while echoing the NEW
    // price, letting someone print an official looking estimate whose reference
    // number does not match what Echelon actually holds on file. Keying on the
    // payload means a changed request becomes a new receipt, and a genuine
    // retry of the same request still returns the same one.
    const payloadHash = createHash("sha256")
      .update(
        JSON.stringify([
          input.requestKey,
          input.kind,
          input.email.trim().toLowerCase(),
          input.organization.trim().toLowerCase(),
          input.region,
          tier,
          isQuote ? input.seats : null,
          totalCents,
          input.name,
          input.notes,
          input.phone,
          input.callbackRequested,
          input.preferredCallbackTime,
        ])
      )
      .digest("hex");
    // The durable partnership adapter validates UUIDs; a raw 64-byte hash
    // rejects every request. Keep 122 hash bits with UUID version/variant bits.
    const idempotencyKey = `${payloadHash.slice(0, 8)}-${payloadHash.slice(8, 12)}-5${payloadHash.slice(13, 16)}-${((parseInt(payloadHash[16], 16) & 3) | 8).toString(16)}${payloadHash.slice(17, 20)}-${payloadHash.slice(20, 32)}`;
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
      ...(input.callbackRequested ? [municipalCallbackHeader(input.phone, input.preferredCallbackTime)] : []),
      requestText,
      "Region: " + input.region,
      "Notes: " + input.notes,
      "Status: pending staff review; not an invoice, a binding quote, or pilot activation",
    ].join("\n");
    const result = await persistedPartnershipInquiry({
      requestKey: idempotencyKey,
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
