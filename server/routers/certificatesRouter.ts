/**
 * Licence expiry tracking — tRPC surface.
 *
 * Manager procedures are scoped by resolveOrgManager (the same resolution
 * the rest of the manager dashboard uses): a manager only ever sees and
 * changes their own organization's certificate register. The operator
 * procedure returns only the signed-in operator's own certificates.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  CERTIFICATE_CSV_LIMITS,
  isCertificateTypeKey,
  parseCertificateDate,
} from "../../shared/certificates";
import { identityEmail, resolveVerifiedIdentity } from "../_core/accessService";
import { publicProcedure, router } from "../_core/trpc";
import {
  createCertificate,
  deleteCertificate,
  findUserIdByEmail,
  getCertificateSummaryForOrg,
  importCertificates,
  listCertificatesForOperator,
  listCertificatesForOrg,
  renewCertificate,
  updateCertificate,
} from "../certificates/certificateService";
import { getDb } from "../db";
import { resolveOrgManager } from "./orgRouter";

// Mirrors teamProcedure in orgRouter.ts: organization selection is
// request-scoped input, never an identity or membership grant.
const managerProcedure = publicProcedure
  .input(z.object({ orgId: z.number().int().positive().optional() }).optional())
  .use(({ ctx, input, next }) =>
    next({ ctx: { ...ctx, selectedOrganizationId: input?.orgId } })
  );

const certificateTypeInput = z
  .string()
  .refine(value => isCertificateTypeKey(value), {
    message: "Unknown certificate type.",
  });

const dateInput = z.union([z.date(), z.string()]).transform((value, ctx) => {
  const parsed = value instanceof Date ? value : parseCertificateDate(value);
  if (!parsed || Number.isNaN(parsed.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid calendar date.",
    });
    return z.NEVER;
  }
  return parsed;
});
const expectedVersionInput = z.number().int().positive();

export const certificatesRouter = router({
  /** Roster for the manager dashboard, sorted by soonest expiry. */
  list: managerProcedure.query(async ({ ctx }) => {
    const { orgId } = await resolveOrgManager(ctx);
    return listCertificatesForOrg(orgId);
  }),

  /** Summary counts for the dashboard header: operators tracked, expiring in 90/30 days, expired. */
  summary: managerProcedure.query(async ({ ctx }) => {
    const { orgId } = await resolveOrgManager(ctx);
    return getCertificateSummaryForOrg(orgId);
  }),

  create: managerProcedure
    .input(
      z.object({
        operatorName: z.string().trim().min(1).max(200),
        operatorEmail: z.string().email().optional(),
        certificateType: certificateTypeInput,
        certificateNumber: z.string().trim().min(1).max(100),
        issuedAt: dateInput.nullable().optional(),
        expiresAt: dateInput,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId } = await resolveOrgManager(ctx);
      return createCertificate(orgId, ctx.user?.id ?? null, {
        operatorName: input.operatorName,
        operatorEmail: input.operatorEmail,
        certificateType: input.certificateType,
        certificateNumber: input.certificateNumber,
        issuedAt: input.issuedAt ?? null,
        expiresAt: input.expiresAt,
      });
    }),

  update: managerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        operatorName: z.string().trim().min(1).max(200).optional(),
        certificateType: certificateTypeInput.optional(),
        certificateNumber: z.string().trim().min(1).max(100).optional(),
        issuedAt: dateInput.nullable().optional(),
        expiresAt: dateInput.optional(),
        expectedVersion: expectedVersionInput,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId } = await resolveOrgManager(ctx);
      const { id, ...patch } = input;
      try {
        const updated = await updateCertificate(orgId, id, patch);
        if (!updated)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Certificate not found in your organization.",
          });
        return updated;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "CERTIFICATE_VERSION_CONFLICT"
        )
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Certificate changed by another manager. Refresh and try again.",
          });
        if (
          error instanceof Error &&
          /Issue date|Renewal expiry/.test(error.message)
        )
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        throw error;
      }
    }),

  remove: managerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        expectedVersion: expectedVersionInput,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId } = await resolveOrgManager(ctx);
      const removed = await deleteCertificate(
        orgId,
        input.id,
        input.expectedVersion
      );
      if (!removed)
        throw new TRPCError({
          code: input.expectedVersion != null ? "CONFLICT" : "NOT_FOUND",
          message:
            input.expectedVersion != null
              ? "Certificate changed by another manager. Refresh and try again."
              : "Certificate not found in your organization.",
        });
      return { success: true as const };
    }),

  /**
   * Records a renewal. The response carries the matching Echelon course
   * (courseKey/coursePath) so the dashboard can link the operator straight
   * to renewal preparation.
   */
  renew: managerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        expiresAt: dateInput,
        issuedAt: dateInput.nullable().optional(),
        expectedVersion: expectedVersionInput,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId } = await resolveOrgManager(ctx);
      const renewed = await renewCertificate(orgId, input.id, {
        expiresAt: input.expiresAt,
        ...(input.issuedAt !== undefined ? { issuedAt: input.issuedAt } : {}),
        expectedVersion: input.expectedVersion,
      });
      if (!renewed)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Certificate not found in your organization.",
        });
      return renewed;
    }),

  /**
   * Spreadsheet import: CSV text plus the manager's column mapping. Returns
   * the imported count and every failed row with its reason.
   */
  importCsv: managerProcedure
    .input(
      z.object({
        csvText: z.string().min(1).max(CERTIFICATE_CSV_LIMITS.maxChars),
        mapping: z.object({
          operatorName: z.number().int().min(0),
          certificateType: z.number().int().min(0),
          certificateNumber: z.number().int().min(0),
          expiresAt: z.number().int().min(0),
          issuedAt: z.number().int().min(0).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId } = await resolveOrgManager(ctx);
      return importCertificates(
        orgId,
        ctx.user?.id ?? null,
        input.csvText,
        input.mapping
      );
    }),

  /** The signed-in operator's own certificates, soonest expiry first. */
  myCertificates: publicProcedure.query(async ({ ctx }) => {
    const identity = resolveVerifiedIdentity(ctx);
    const email = identityEmail(identity);
    if (!email) return [];
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    const userId =
      identity.type === "oauth"
        ? identity.userId
        : ((await findUserIdByEmail(db, email)) ?? 0);
    return listCertificatesForOperator(userId, email);
  }),
});
