import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { jobPostings } from "../../drizzle/schema";
import { eq, and, desc, getTableColumns, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { publicDatabaseRead } from "../publicRead";
import { readJobRefreshHealth, summarizeJobHealth, publicJobVerificationCondition, publicJobPostedAt } from "../jobBoardState";

const PAGE_SIZE = 20;
const PUBLIC_STALE_JOB_DAYS = 21;

const ProvinceEnum = z.enum(["ON", "BC", "AB", "SK", "MB", "other"]);
const JobTypeEnum = z.enum(["full-time", "part-time", "contract"]);

export const jobsRouter = router({
  listJobs: publicProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        province: ProvinceEnum.nullable().default(null),
        jobType: JobTypeEnum.nullable().default(null),
      })
    )
    .query(({ input }) => publicDatabaseRead("Jobs", async db => {
      const { page, province, jobType } = input;
      const offset = (page - 1) * PAGE_SIZE;
      const publicCutoff = new Date(
        Date.now() - PUBLIC_STALE_JOB_DAYS * 24 * 60 * 60 * 1000
      );

      const conditions = [
        eq(jobPostings.isActive, 1),
        gte(jobPostings.lastSeenAt, publicCutoff),
        publicJobVerificationCondition(jobPostings.sourceUrl),
      ];
      if (province) conditions.push(eq(jobPostings.province, province));
      if (jobType) conditions.push(eq(jobPostings.jobType, jobType));
      const where = and(...conditions);

      const [jobs, countResult] = await Promise.all([
        db
          .select({
            id: jobPostings.id,
            title: jobPostings.title,
            company: jobPostings.company,
            location: jobPostings.location,
            province: jobPostings.province,
            salary: jobPostings.salary,
            jobType: jobPostings.jobType,
            sourceUrl: jobPostings.sourceUrl,
            sourceName: jobPostings.sourceName,
            description: jobPostings.description,
            postedAt: publicJobPostedAt(jobPostings.sourceUrl),
            isFeatured: jobPostings.isFeatured,
          })
          .from(jobPostings)
          .where(where)
          .orderBy(desc(jobPostings.isFeatured), desc(publicJobPostedAt(jobPostings.sourceUrl)))
          .limit(PAGE_SIZE)
          .offset(offset),

        db
          .select({ count: sql<number>`count(*)` })
          .from(jobPostings)
          .where(where),
      ]);

      const total = Number(countResult[0]?.count ?? 0);
      return {
        jobs,
        total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
      };
    })),

  getJob: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const [job] = await publicDatabaseRead("Jobs", db => db
        .select({ ...getTableColumns(jobPostings), postedAt: publicJobPostedAt(jobPostings.sourceUrl) })
        .from(jobPostings)
        .where(
          and(
            eq(jobPostings.id, input.id),
            eq(jobPostings.isActive, 1),
            publicJobVerificationCondition(jobPostings.sourceUrl),
            gte(
              jobPostings.lastSeenAt,
              new Date(Date.now() - PUBLIC_STALE_JOB_DAYS * 24 * 60 * 60 * 1000)
            )
          )
        )
        .limit(1));
      if (!job)
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      return job;
    }),

  markFeatured: protectedProcedure
    .input(z.object({ id: z.number().int(), featured: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DB unavailable",
        });
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      await db
        .update(jobPostings)
        .set({ isFeatured: input.featured ? 1 : 0 })
        .where(eq(jobPostings.id, input.id));
      return { success: true };
    }),

  // Returns stats for the board header
  stats: publicProcedure.query(() => publicDatabaseRead("Jobs", async db => {
    const publicCutoff = new Date(Date.now() - PUBLIC_STALE_JOB_DAYS * 24 * 60 * 60 * 1000);
    const [result] = await db.select({
      total: sql<number>`count(*)`,
      sourceCount: sql<number>`count(distinct ${jobPostings.sourceName})`,
      provinceCount: sql<number>`count(distinct case when ${jobPostings.province} <> 'other' then ${jobPostings.province} end)`,
    }).from(jobPostings).where(and(eq(jobPostings.isActive, 1), gte(jobPostings.lastSeenAt, publicCutoff), publicJobVerificationCondition(jobPostings.sourceUrl)));
    const health = await readJobRefreshHealth(db);
    return {
      total: Number(result?.total ?? 0),
      sourceCount: Number(result?.sourceCount ?? 0),
      provinceCount: Number(result?.provinceCount ?? 0),
      ...summarizeJobHealth(health),
    };
  })),
});
