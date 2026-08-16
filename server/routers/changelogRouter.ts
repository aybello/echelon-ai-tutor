import { z } from "zod";
import { publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { changelog } from "../../drizzle/schema";
import { eq, asc, desc, sql } from "drizzle-orm";
import { nextChangelogSortOrder } from "../../shared/changelog";

export const changelogRouter = {
  /** Public: list all visible changelog entries ordered by sortOrder ASC (newest first) */
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(changelog)
      .where(eq(changelog.visible, true))
      .orderBy(asc(changelog.sortOrder), desc(changelog.createdAt), desc(changelog.id));
    return rows;
  }),

  /** Admin: list ALL entries including hidden ones */
  adminList: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(changelog)
      .orderBy(asc(changelog.sortOrder), desc(changelog.createdAt), desc(changelog.id));
  }),

  /** Admin: create a new changelog entry */
  create: protectedProcedure
    .input(z.object({
      date: z.string().min(1).max(32),
      badge: z.string().max(32).default(""),
      badgeColor: z.string().max(16).default("#0F766E"),
      title: z.string().min(1).max(256),
      body: z.string().min(1),
      sortOrder: z.number().int().optional(),
      visible: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [orderRow] = await db
        .select({ minimum: sql<number | null>`MIN(${changelog.sortOrder})` })
        .from(changelog);
      const [result] = await db.insert(changelog).values({
        ...input,
        sortOrder: input.sortOrder ?? nextChangelogSortOrder(orderRow?.minimum),
      });
      return { id: result.insertId };
    }),

  /** Admin: update an existing changelog entry */
  update: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      date: z.string().min(1).max(32).optional(),
      badge: z.string().max(32).optional(),
      badgeColor: z.string().max(16).optional(),
      title: z.string().min(1).max(256).optional(),
      body: z.string().min(1).optional(),
      sortOrder: z.number().int().optional(),
      visible: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { id, ...updates } = input;
      await db.update(changelog).set(updates).where(eq(changelog.id, id));
      return { success: true };
    }),

  /** Admin: delete a changelog entry */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(changelog).where(eq(changelog.id, input.id));
      return { success: true };
    }),
};
