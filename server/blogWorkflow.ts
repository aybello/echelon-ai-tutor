import {
  AUTOMATED_ARTICLE_TAG, BLOG_TOPICS, buildGovernance, buildGenerationRequest,
  buildReviewRequest, buildTopicRequest, parseEditorialReview, parseModelArticle,
  parsePlannedTopic, validateArticle,
  type BlogPostInsert, type BlogSource, type BlogTopic, type ExistingBlogPost, type GeneratedArticle,
} from "./blogAutomation";
import { blogResponseText, type BlogModelRequest, type BlogModelResponse } from "./blogModel";

export type BlogPhase = "topic" | "plan-submit" | "plan-poll" | "research" | "draft-submit" | "draft-poll" | "review-submit" | "review-poll" | "publish";
export type BlogProgress = {
  phase: BlogPhase;
  topic?: BlogTopic;
  research?: Array<{ source: BlogSource; text: string }>;
  article?: GeneratedArticle;
  issues?: string[];
  responseId?: string;
  revision: number;
  approved?: boolean;
  submissionPending?: boolean;
};
export type BlogRun = { runKey: string; startedAt: Date; progress: BlogProgress };
export interface BlogClaim {
  run: BlogRun;
  checkpoint(progress: BlogProgress): Promise<void>;
  save(progress: BlogProgress): Promise<void>;
  complete(reason: string): Promise<void>;
  fail(reason: string): Promise<void>;
  retry(): Promise<void>;
  publish(post: BlogPostInsert): Promise<"published" | "already_published" | "recent_article">;
}
export type BlogWorkflowDependencies = {
  claim(): Promise<BlogClaim | null>;
  listPosts(): Promise<ExistingBlogPost[]>;
  fetchSource(source: BlogSource, signal: AbortSignal): Promise<string>;
  submit(request: BlogModelRequest, signal: AbortSignal): Promise<BlogModelResponse>;
  retrieve(id: string, signal: AbortSignal): Promise<BlogModelResponse>;
  now(): Date;
  notify?(title: string, content: string): Promise<boolean>;
};
const CALLBACK_BUDGET_MS = 23_000;
const RUN_MAX_AGE_MS = 30 * 60_000;
export function recentAutomatedPost(posts: ExistingBlogPost[], now: Date) {
  return posts.find(post => post.tags?.split(",").map(tag => tag.trim()).includes(AUTOMATED_ARTICLE_TAG)
    && now.getTime() - new Date(post.createdAt).getTime() < 6 * 24 * 60 * 60_000);
}
export function blogRunKey(now: Date): string {
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return `weekly:${monday.toISOString().slice(0, 10)}`;
}
export function buildPublication(progress: BlogProgress, posts: ExistingBlogPost[], now: Date): BlogPostInsert {
  if (!progress.approved || !progress.topic || !progress.article || !progress.research?.length)
    throw new Error("Blog article is not source-checked and approved");
  const article = validateArticle(progress.article, progress.topic, posts.map(post => post.title));
  const content = `${article.content}\n${buildGovernance(progress.topic, now)}`;
  return { ...article, slug: progress.topic.slug, content,
    tags: [...new Set([...progress.topic.tags, ...article.tags, AUTOMATED_ARTICLE_TAG])].join(","),
    readingTimeMinutes: Math.max(4, Math.ceil(content.replace(/<[^>]+>/g, " ").split(/\s+/).length / 220)),
    published: 1, publishedAt: now };
}
/** No detached work: each Heartbeat performs one bounded step and persists before returning. */
export async function advanceBlogWorkflow(deps: BlogWorkflowDependencies) {
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), CALLBACK_BUDGET_MS);
  const claim = await deps.claim().catch(error => { clearTimeout(deadline); throw error; });
  if (!claim) { clearTimeout(deadline); return { ok: true, action: "idle" }; }
  const { run } = claim;
  const p = structuredClone(run.progress);
  try {
    if (p.submissionPending) throw new Error("Previous blog submission is uncertain; inspect before retrying");
    if (deps.now().getTime() - run.startedAt.getTime() > RUN_MAX_AGE_MS) {
      await claim.fail("Blog run exceeded its thirty-minute budget");
      return { ok: false, action: "failed", phase: p.phase };
    }
    const posts = await deps.listPosts();
    if (recentAutomatedPost(posts, deps.now())) {
      await claim.complete("skipped_recent_article");
      return { ok: true, action: "skipped_recent_article" };
    }
    if (p.phase === "topic") {
      p.topic = BLOG_TOPICS.find(topic => !posts.some(post => post.slug === topic.slug));
      p.phase = p.topic ? "research" : "plan-submit";
    } else if (p.phase.endsWith("-submit")) {
      let request: BlogModelRequest;
      if (p.phase === "plan-submit") request = buildTopicRequest({ existingSlugs: posts.map(post => post.slug), existingTitles: posts.map(post => post.title) });
      else {
        if (!p.topic || !p.research) throw new Error("Missing blog research state");
        request = p.phase === "draft-submit" ? buildGenerationRequest({ topic: p.topic, research: p.research,
          existingTitles: posts.map(post => post.title),
          revision: p.revision ? { previousArticle: p.article!, issues: p.issues! } : undefined })
          : buildReviewRequest({ topic: p.topic, research: p.research, article: p.article! });
      }
      p.submissionPending = true;
      await claim.checkpoint(structuredClone(p));
      const response = await deps.submit(request, controller.signal);
      p.responseId = response.id;
      p.phase = p.phase.replace("-submit", "-poll") as BlogPhase;
      delete p.submissionPending;
    } else if (p.phase.endsWith("-poll")) {
      if (!p.responseId) throw new Error("Missing pending blog response");
      const response = await deps.retrieve(p.responseId, controller.signal);
      if (response.status === "queued" || response.status === "in_progress") {
        await claim.save(p);
        return { ok: true, action: "waiting_for_model", phase: p.phase };
      }
      const content = blogResponseText(response); // Fails closed on incomplete/failed/cancelled/refusal.
      if (p.phase === "plan-poll") {
        p.topic = parsePlannedTopic(content, { existingSlugs: posts.map(post => post.slug), existingTitles: posts.map(post => post.title) });
        p.phase = "research";
      } else if (p.phase === "draft-poll") {
        p.article = validateArticle(parseModelArticle(content), p.topic!, posts.map(post => post.title));
        p.phase = "review-submit";
      } else {
        const review = parseEditorialReview(content);
        if (review.approved) { p.approved = true; p.phase = "publish"; }
        else if (p.revision === 0) { p.revision = 1; p.issues = review.issues; p.phase = "draft-submit"; }
        else throw new Error("Editorial review rejected revised article");
      }
      delete p.responseId;
    } else if (p.phase === "research") {
      if (!p.topic) throw new Error("Missing selected blog topic");
      p.research = await Promise.all(p.topic.sources.map(async source => ({ source, text: await deps.fetchSource(source, controller.signal) })));
      p.phase = "draft-submit";
    } else if (p.phase === "publish") {
      const result = await claim.publish(buildPublication(p, posts, deps.now()));
      if (result === "published" && deps.notify) {
        // Publication is already committed. Notification failure must never republish.
        try { await deps.notify("Weekly Echelon article published", `The reviewed article is live at https://echeloninstitute.ca/blog/${p.topic!.slug}.`); }
        catch { console.warn("[blog-workflow] publication notification unavailable"); }
      }
      return { ok: true, action: result === "published" ? "article_published" : result, slug: p.topic!.slug };
    } else throw new Error("Unknown blog workflow phase");
    if (controller.signal.aborted) throw new Error("Blog callback deadline exceeded");
    await claim.save(p);
    return { ok: true, action: "progress_saved", phase: p.phase };
  } catch (error) {
    // Submission uncertainty must never start another paid response blindly.
    // Polling and source reads are safe to retry; failed submissions require inspection.
    const retryable = !p.phase.endsWith("-submit") &&
      (error as { name?: string }).name === "OutboundError" &&
      ["timeout", "network", "http"].includes((error as { kind?: string }).kind ?? "") &&
      (!(error as { status?: number }).status || [429, 500, 502, 503, 504].includes((error as { status: number }).status));
    if (retryable) await claim.retry();
    else await claim.fail("Blog step failed; inspect editorial or provider logs before retrying");
    console.warn("[blog-workflow]", { phase: p.phase, retryable });
    return { ok: false, action: retryable ? "retry_pending" : "failed", phase: p.phase };
  } finally { clearTimeout(deadline); }
}
