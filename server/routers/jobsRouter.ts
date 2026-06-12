import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { jobPostings } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const PAGE_SIZE = 20;

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
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { jobs: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 };
      const { page, province, jobType } = input;
      const offset = (page - 1) * PAGE_SIZE;

      const conditions: ReturnType<typeof eq>[] = [eq(jobPostings.isActive, 1)];
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
            postedAt: jobPostings.postedAt,
            isFeatured: jobPostings.isFeatured,
          })
          .from(jobPostings)
          .where(where)
          .orderBy(desc(jobPostings.isFeatured), desc(jobPostings.postedAt))
          .limit(PAGE_SIZE)
          .offset(offset),

        db.select({ count: sql<number>`count(*)` }).from(jobPostings).where(where),
      ]);

      const total = Number(countResult[0]?.count ?? 0);
      return {
        jobs,
        total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
      };
    }),

  getJob: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [job] = await db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, input.id))
        .limit(1);
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      return job;
    }),

  markFeatured: protectedProcedure
    .input(z.object({ id: z.number().int(), featured: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
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
  stats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0 };
    const [result] = await db
      .select({ total: sql<number>`count(*)` })
      .from(jobPostings)
      .where(eq(jobPostings.isActive, 1));
    return { total: Number(result?.total ?? 0) };
  }),
});
