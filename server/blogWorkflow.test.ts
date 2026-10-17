import { afterEach, describe, expect, it, vi } from "vitest";
import { OutboundError } from "./_core/outboundHttp";
import { BlogProviderError, submitBlogResponse } from "./blogModel";
import { BLOG_TOPICS, fetchOfficialSource, type GeneratedArticle } from "./blogAutomation";
import { advanceBlogWorkflow, blogRunKey, buildPublication, type BlogClaim, type BlogProgress, type BlogWorkflowDependencies } from "./blogWorkflow";
const NOW = new Date("2026-10-05T14:00:00Z");
const topic = BLOG_TOPICS[0];
function article(): GeneratedArticle {
  const prose = "Operators should review official sources and document changing requirements carefully before choosing a practical study plan. ".repeat(60);
  return { title: "How Ontario Operators Can Track Exam Result Validity", excerpt: "A practical guide to organizing exam results, verifying current official requirements and planning the next certification step without guesswork.",
    content: `<h2>Understand the process</h2><p>${prose}</p><h2>Keep records</h2><p>Write a checklist.</p><h2>Check requirements</h2><p>Try <a href="${topic.internalLinks[0].href}">practice</a>.</p><h2>Plan your next step</h2><p>See <a href="${topic.internalLinks[1].href}">guides</a>.</p>`,
    metaTitle: "Ontario Exam Result Validity: An Operator Guide", metaDescription: "Learn how to record exam results, verify current Ontario requirements and build a practical preparation plan for your next operator certification step.", tags: ["Ontario", "Operators", "Certification"] };
}
const research = topic.sources.map(source => ({ source, text: "Official certification guidance ".repeat(40) }));
function completed(value: unknown) { return { id: "resp_test", status: "completed" as const, output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(value) }] }] }; }
function harness(initial: BlogProgress = { phase: "topic", revision: 0 }) {
  let progress = structuredClone(initial);
  let ended = false;
  const claim: BlogClaim = {
    run: { runKey: blogRunKey(NOW), startedAt: NOW, progress },
    checkpoint: vi.fn(async p => { progress = structuredClone(p); }),
    save: vi.fn(async p => { progress = structuredClone(p); }),
    complete: vi.fn(async () => { ended = true; }),
    fail: vi.fn(async (_reason, p) => { if (p) progress = structuredClone(p); ended = true; }),
    retry: vi.fn(async p => { if (p) progress = structuredClone(p); }),
    publish: vi.fn(async () => { ended = true; return "published" as const; }),
  };
  const deps: BlogWorkflowDependencies = {
    now: () => NOW, listPosts: vi.fn().mockResolvedValue([]),
    claim: vi.fn(async () => { claim.run.progress = structuredClone(progress); return ended ? null : claim; }),
    fetchSource: vi.fn().mockResolvedValue("Official source text ".repeat(60)),
    submit: vi.fn().mockResolvedValue({ id: "resp_test", status: "queued" }),
    retrieve: vi.fn().mockResolvedValue(completed(article())),
  };
  return { deps, claim, get progress() { return progress; } };
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("durable blog workflow", () => {
  it("saves one step per callback, resumes generation/review and publishes only after approval", async () => {
    const h = harness();
    await advanceBlogWorkflow(h.deps); expect(h.progress.phase).toBe("research");
    await advanceBlogWorkflow(h.deps); expect(h.progress.phase).toBe("draft-submit");
    await advanceBlogWorkflow(h.deps); expect(h.progress.phase).toBe("draft-poll");
    expect(h.claim.checkpoint).toHaveBeenCalledWith(expect.objectContaining({ submissionPending: true }));
    await advanceBlogWorkflow(h.deps); expect(h.progress.phase).toBe("review-submit");
    await advanceBlogWorkflow(h.deps); expect(h.progress.phase).toBe("review-poll");
    vi.mocked(h.deps.retrieve).mockResolvedValue(completed({ approved: true, issues: [] }));
    await advanceBlogWorkflow(h.deps); expect(h.progress.phase).toBe("publish");
    expect(h.claim.publish).not.toHaveBeenCalled();
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "article_published" });
    expect(h.claim.publish).toHaveBeenCalledOnce();
    expect(h.claim.publish).toHaveBeenCalledWith(expect.objectContaining({ published: 1, tags: expect.stringContaining("Automated Article") }));
    expect(h.deps.submit).toHaveBeenCalledTimes(2);
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "idle" });
  });
  it("preserves committed publication if the owner notification fails", async () => {
    const h = harness({ phase: "publish", revision: 0, topic, research, article: article(), approved: true });
    h.deps.notify = vi.fn().mockRejectedValue(new Error("Notice unavailable"));
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "article_published", ok: true });
    expect(h.claim.fail).not.toHaveBeenCalled();
    expect(h.claim.publish).toHaveBeenCalledOnce();
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "idle" });
  });
  it("retains a queued model response across callbacks without paying for another submission", async () => {
    const h = harness({ phase: "draft-poll", revision: 0, topic, research, responseId: "resp_test" });
    vi.mocked(h.deps.retrieve).mockResolvedValue({ id: "resp_test", status: "in_progress" });
    for (let n = 0; n < 3; n++) expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "waiting_for_model" });
    expect(h.progress.responseId).toBe("resp_test"); expect(h.deps.submit).not.toHaveBeenCalled();
  });
  it.each(["failed", "cancelled", "incomplete"] as const)("never publishes a %s provider response", async status => {
    const h = harness({ phase: "draft-poll", revision: 0, topic, research, responseId: "resp_test" });
    vi.mocked(h.deps.retrieve).mockResolvedValue({ ...completed(article()), status });
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ ok: false, action: "failed" });
    expect(h.claim.publish).not.toHaveBeenCalled(); expect(h.claim.fail).toHaveBeenCalledOnce();
  });
  it("allows one revision, then fails closed after a second rejection", async () => {
    const h = harness({ phase: "review-poll", revision: 0, topic, research, article: article(), responseId: "resp_test" });
    vi.mocked(h.deps.retrieve).mockResolvedValue(completed({ approved: false, issues: ["An eligibility statement lacks source support."] }));
    await advanceBlogWorkflow(h.deps); expect(h.progress).toMatchObject({ phase: "draft-submit", revision: 1 });
    await advanceBlogWorkflow(h.deps);
    expect(vi.mocked(h.deps.submit).mock.calls[0][0].input).toContain("REVISION REQUIRED");
    vi.mocked(h.deps.retrieve).mockResolvedValue(completed(article())); await advanceBlogWorkflow(h.deps);
    await advanceBlogWorkflow(h.deps);
    vi.mocked(h.deps.retrieve).mockResolvedValue(completed({ approved: false, issues: ["An unsupported statement remains."] }));
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "failed" }); expect(h.claim.publish).not.toHaveBeenCalled();
  });
  it("rejects a contradictory review approval", async () => {
    const h = harness({ phase: "review-poll", revision: 0, topic, research, article: article(), responseId: "resp_test" });
    vi.mocked(h.deps.retrieve).mockResolvedValue(completed({ approved: true, issues: ["Unsupported claim still present."] }));
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "failed" });
  });
  it("does not resubmit after a crash left an uncertain paid submission", async () => {
    const h = harness({ phase: "draft-submit", revision: 0, topic, research, submissionPending: true });
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "failed" });
    expect(h.deps.submit).not.toHaveBeenCalled();
    expect(h.claim.fail).toHaveBeenCalledWith('Blog step failed: {"phase":"draft-submit","service":"workflow","kind":"submission_uncertain"}', undefined);
    expect(h.progress.submissionPending).toBe(true);
    expect(h.progress.submissionNotSent).toBeUndefined();
  });
  it("does not blindly retry a submit timeout", async () => {
    const h = harness({ phase: "draft-submit", revision: 0, topic, research });
    vi.mocked(h.deps.submit).mockRejectedValue(new OutboundError("openai", "timeout"));
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "failed" });
    expect(h.claim.retry).not.toHaveBeenCalled(); expect(h.progress.submissionPending).toBe(true);
    expect(h.progress.submissionNotSent).toBeUndefined();
  });
  it("clears stale not-sent evidence before a new explicitly authorized submission attempt", async () => {
    const h = harness({ phase: "draft-submit", revision: 0, topic, research, submissionNotSent: true });
    vi.mocked(h.deps.submit).mockRejectedValue(new OutboundError("openai", "network"));
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "failed" });
    expect(h.claim.checkpoint).toHaveBeenCalledWith(expect.objectContaining({ submissionPending: true }));
    expect(vi.mocked(h.claim.checkpoint).mock.calls[0][0].submissionNotSent).toBeUndefined();
    expect(h.progress.submissionNotSent).toBeUndefined();
    expect(h.progress.submissionPending).toBe(true);
    expect(h.claim.retry).not.toHaveBeenCalled();
  });
  it.each(["missing_credential", "schema_unexpected"] as const)("records a terminal polling %s failure without marking an existing response not sent", async kind => {
    const h = harness({ phase: "draft-poll", revision: 0, topic, research, responseId: "resp_test" });
    vi.mocked(h.deps.retrieve).mockRejectedValue(new BlogProviderError(kind));
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "failed" });
    expect(h.claim.fail).toHaveBeenCalledWith(`Blog step failed: {"phase":"draft-poll","service":"openai","kind":"${kind}"}`, undefined);
    expect(h.progress.responseId).toBe("resp_test");
    expect(h.progress.submissionNotSent).toBeUndefined();
    expect(h.claim.retry).not.toHaveBeenCalled();
    expect(h.deps.submit).not.toHaveBeenCalled();
    expect(h.claim.publish).not.toHaveBeenCalled();
  });
  it("records a missing credential as definitely not sent without permitting automatic recovery", async () => {
    vi.stubEnv("OPENAI_CUSTOM_API_KEY", ""); vi.stubEnv("OPENAI_API_KEY", "");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const h = harness({ phase: "draft-submit", revision: 0, topic, research });
    h.deps.submit = vi.fn(submitBlogResponse);
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "failed" });
    expect(fetch).not.toHaveBeenCalled();
    expect(h.progress).toMatchObject({ phase: "draft-submit", submissionPending: true, submissionNotSent: true });
    expect(h.claim.fail).toHaveBeenCalledWith('Blog step failed: {"phase":"draft-submit","service":"openai","kind":"missing_credential"}', expect.objectContaining({ submissionPending: true, submissionNotSent: true }));
    expect(warn).toHaveBeenCalledWith("[blog-workflow]", { phase: "draft-submit", service: "openai", kind: "missing_credential", retryable: false });
    expect(h.claim.retry).not.toHaveBeenCalled();
    // Even a manually re-exposed failed run cannot use this diagnostic as retry authorization.
    h.deps.claim = vi.fn(async () => ({ ...h.claim, run: { ...h.claim.run, progress: h.progress } }));
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "failed" });
    expect(h.deps.submit).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([400, 401, 403, 429, 500, 503])("persists only safe metadata for a submit HTTP %s rejection", async status => {
    vi.stubEnv("OPENAI_CUSTOM_API_KEY", "PRIVATE_CREDENTIAL");
    const fetch = vi.fn().mockResolvedValue(new Response("PRIVATE_PROVIDER_BODY", { status, headers: { "x-private": "PRIVATE_HEADER" } }));
    vi.stubGlobal("fetch", fetch);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const h = harness({ phase: "draft-submit", revision: 0, topic, research });
    h.deps.submit = vi.fn(submitBlogResponse);
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "failed" });
    expect(h.claim.fail).toHaveBeenCalledWith(`Blog step failed: {"phase":"draft-submit","service":"openai","kind":"http","status":${status}}`, undefined);
    expect(warn).toHaveBeenCalledWith("[blog-workflow]", { phase: "draft-submit", service: "openai", kind: "http", status, retryable: false });
    expect(JSON.stringify([vi.mocked(h.claim.fail).mock.calls, warn.mock.calls])).not.toContain("PRIVATE_");
    expect(h.progress.submissionPending).toBe(true);
    expect(h.progress.submissionNotSent).toBeUndefined();
    expect(h.claim.retry).not.toHaveBeenCalled();
    expect(h.claim.publish).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("redacts a raw network error and retains the uncertain paid submission", async () => {
    vi.stubEnv("OPENAI_CUSTOM_API_KEY", "PRIVATE_CREDENTIAL");
    const fetch = vi.fn().mockRejectedValue(new Error("PRIVATE_NETWORK https://private.test?key=PRIVATE_CREDENTIAL"));
    vi.stubGlobal("fetch", fetch);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const h = harness({ phase: "draft-submit", revision: 0, topic, research });
    h.deps.submit = vi.fn(submitBlogResponse);
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "failed" });
    expect(h.claim.fail).toHaveBeenCalledWith('Blog step failed: {"phase":"draft-submit","service":"openai","kind":"network"}', undefined);
    expect(JSON.stringify([vi.mocked(h.claim.fail).mock.calls, warn.mock.calls])).not.toMatch(/PRIVATE_|private.test/);
    expect(h.progress.submissionPending).toBe(true);
    expect(h.progress.submissionNotSent).toBeUndefined();
    expect(h.claim.retry).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledOnce();
  });
  it.each([
    ['{"id":"resp_test","status":"PRIVATE_STATUS","PRIVATE_FIELD":"PRIVATE_BODY"}', "schema_unexpected", 200],
    ["PRIVATE_MALFORMED_JSON", "invalid_json", undefined],
  ] as const)("does not persist or log response validation details for %s", async (body, kind, status) => {
    vi.stubEnv("OPENAI_CUSTOM_API_KEY", "PRIVATE_CREDENTIAL");
    const fetch = vi.fn().mockResolvedValue(new Response(body, { headers: { "x-private": "PRIVATE_HEADER" } }));
    vi.stubGlobal("fetch", fetch);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const h = harness({ phase: "draft-submit", revision: 0, topic, research });
    h.deps.submit = vi.fn(submitBlogResponse);
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "failed" });
    const metadata = { phase: "draft-submit", service: "openai", kind, ...(status ? { status } : {}) };
    expect(h.claim.fail).toHaveBeenCalledWith(`Blog step failed: ${JSON.stringify(metadata)}`, undefined);
    expect(warn).toHaveBeenCalledWith("[blog-workflow]", { ...metadata, retryable: false });
    expect(JSON.stringify([vi.mocked(h.claim.fail).mock.calls, warn.mock.calls])).not.toContain("PRIVATE_");
    expect(h.progress.submissionPending).toBe(true);
    expect(h.progress.submissionNotSent).toBeUndefined();
    expect(h.claim.retry).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledOnce();
  });
  it.each([
    new Error("PRIVATE_RAW_ERROR"),
    Object.assign(new Error("PRIVATE_FORGED_ERROR"), { service: "openai", kind: "missing_credential", status: 401, body: "PRIVATE_BODY" }),
    Object.assign(new BlogProviderError("schema_unexpected"), { message: "PRIVATE_MESSAGE", cause: "PRIVATE_CAUSE", issues: ["PRIVATE_ISSUE"] }),
    Object.assign(new OutboundError("openai", "http", 401), { message: "PRIVATE_MESSAGE", headers: { authorization: "PRIVATE_CREDENTIAL" } }),
    Object.assign(new BlogProviderError("schema_unexpected"), { kind: "PRIVATE_KIND", status: "PRIVATE_STATUS" }),
    Object.assign(new OutboundError("openai", "http"), { service: "PRIVATE_SERVICE", kind: "PRIVATE_KIND", status: "PRIVATE_STATUS" }),
    Object.assign(new OutboundError("openai", "http"), { status: 600 }),
  ])("never copies arbitrary error properties into persisted or logged diagnostics", async error => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const h = harness({ phase: "draft-submit", revision: 0, topic, research });
    vi.mocked(h.deps.submit).mockRejectedValue(error);
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "failed" });
    const reason = vi.mocked(h.claim.fail).mock.calls[0][0];
    const metadata = JSON.parse(reason.slice("Blog step failed: ".length));
    expect(Object.keys(metadata).sort()).toEqual(metadata.status ? ["kind", "phase", "service", "status"] : ["kind", "phase", "service"]);
    expect(warn).toHaveBeenCalledWith("[blog-workflow]", { ...metadata, retryable: false });
    expect(JSON.stringify([vi.mocked(h.claim.fail).mock.calls, warn.mock.calls])).not.toContain("PRIVATE_");
    expect(h.progress.submissionPending).toBe(true);
    expect(h.progress.submissionNotSent).toBeUndefined();
    expect(h.claim.retry).not.toHaveBeenCalled();
    expect(h.claim.publish).not.toHaveBeenCalled();
  });
  it("preserves a returned response even when the callback deadline expires", async () => {
    vi.useFakeTimers();
    const h = harness({ phase: "draft-submit", revision: 0, topic, research });
    let resolve!: (value: { id: string; status: "queued" }) => void;
    vi.mocked(h.deps.submit).mockImplementation(() => new Promise(done => { resolve = done; }));
    const work = advanceBlogWorkflow(h.deps);
    await vi.advanceTimersByTimeAsync(23_001);
    resolve({ id: "resp_returned", status: "queued" });
    expect(await work).toMatchObject({ action: "retry_pending" });
    expect(h.progress).toMatchObject({ phase: "draft-poll", responseId: "resp_returned" });
    expect(h.progress.submissionPending).toBeUndefined();
    vi.mocked(h.deps.retrieve).mockResolvedValue({ id: "resp_returned", status: "in_progress" });
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "waiting_for_model" });
    expect(h.deps.submit).toHaveBeenCalledOnce();
    expect(h.deps.retrieve).toHaveBeenCalledWith("resp_returned", expect.any(AbortSignal));
  });
  it.each(["save", "checkpoint"] as const)("recovers a returned ID after one %s write failure without resubmitting", async method => {
    const h = harness({ phase: "draft-submit", revision: 0, topic, research });
    if (method === "save") vi.mocked(h.claim.save).mockRejectedValueOnce(new Error("Temporary persistence failure"));
    else vi.mocked(h.claim.checkpoint).mockImplementationOnce(async p => { h.claim.run.progress = structuredClone(p); })
      .mockRejectedValueOnce(new Error("Temporary persistence failure"));
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "retry_pending" });
    expect(h.progress).toMatchObject({ phase: "draft-poll", responseId: "resp_test" });
    expect(h.progress.submissionPending).toBeUndefined();
    vi.mocked(h.deps.retrieve).mockResolvedValue({ id: "resp_test", status: "in_progress" });
    await advanceBlogWorkflow(h.deps);
    expect(h.deps.submit).toHaveBeenCalledOnce();
    expect(h.deps.retrieve).toHaveBeenCalledOnce();
  });
  it.each([500, 503])("resumes research after the official source returns HTTP %s", async status => {
    const h = harness({ phase: "research", topic, revision: 0 });
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("Temporarily unavailable", { status })));
    h.deps.fetchSource = fetchOfficialSource;
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "retry_pending" });
    expect(h.progress.phase).toBe("research");
    expect(h.claim.fail).not.toHaveBeenCalled();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("Official guidance ".repeat(80))));
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "progress_saved", phase: "draft-submit" });
    expect(h.progress.research).toHaveLength(topic.sources.length);
    expect(h.deps.submit).not.toHaveBeenCalled();
  });
  it("safely retries provider polling outages without replacing the response", async () => {
    const h = harness({ phase: "draft-poll", revision: 0, topic, research, responseId: "resp_test" });
    vi.mocked(h.deps.retrieve).mockRejectedValue(new OutboundError("openai", "http", 503));
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "retry_pending" });
    expect(h.claim.retry).toHaveBeenCalledOnce(); expect(h.deps.submit).not.toHaveBeenCalled();
  });
  it("stops a stalled run after thirty minutes", async () => {
    const h = harness(); h.deps.now = () => new Date(NOW.getTime() + 31 * 60_000);
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "failed" }); expect(h.deps.listPosts).not.toHaveBeenCalled();
  });
  it("aborts source reads inside the callback deadline", async () => {
    vi.useFakeTimers(); const h = harness({ phase: "research", topic, revision: 0 });
    vi.mocked(h.deps.fetchSource).mockImplementation((_source, signal) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new OutboundError("editorial-source", "cancelled")), { once: true })));
    const run = advanceBlogWorkflow(h.deps); await vi.advanceTimersByTimeAsync(23_001);
    expect(await run).toMatchObject({ ok: false, action: "retry_pending" });
    expect(h.claim.publish).not.toHaveBeenCalled(); expect(h.claim.fail).not.toHaveBeenCalled();
    expect(h.progress.phase).toBe("research");
    vi.mocked(h.deps.fetchSource).mockResolvedValue("Official source text ".repeat(60));
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "progress_saved", phase: "draft-submit" });
  });
  it("rechecks existing automated articles before starting any model call", async () => {
    const h = harness(); vi.mocked(h.deps.listPosts).mockResolvedValue([{ slug: "already-live", title: "Existing guide", tags: "Automated Article", createdAt: NOW }]);
    expect(await advanceBlogWorkflow(h.deps)).toMatchObject({ action: "skipped_recent_article" }); expect(h.deps.submit).not.toHaveBeenCalled();
  });
  it("uses one week key over UTC week rollover", () => {
    expect(blogRunKey(new Date("2026-10-04T23:59:59Z"))).toBe("weekly:2026-09-28");
    expect(blogRunKey(NOW)).toBe("weekly:2026-10-05");
  });
  it("blocks forged publish state and sanitizes the final article", () => {
    expect(() => buildPublication({ phase: "publish", revision: 0, topic, research, article: article() }, [], NOW)).toThrow("not source-checked");
    const unsafe = { ...article(), content: article().content + "<script>bad()</script>" };
    expect(() => buildPublication({ phase: "publish", revision: 0, topic, research, article: unsafe, approved: true }, [], NOW)).toThrow("prohibited");
  });
});
