import { describe, expect, it, vi } from "vitest";
import {
  AUTOMATED_ARTICLE_TAG,
  BLOG_TOPICS,
  ensureWeeklyBlogHeartbeat,
  fetchOfficialSource,
  runBlogAutomation,
  sanitizeGeneratedHtml,
  type BlogAutomationDependencies,
  type BlogPostInsert,
  type GeneratedArticle,
} from "./blogAutomation";

const NOW = new Date("2026-08-24T16:00:00.000Z");

function validArticle(topicIndex = 0): GeneratedArticle {
  const links = BLOG_TOPICS[topicIndex].internalLinks;
  const paragraphs = Array.from(
    { length: 18 },
    (_, index) =>
      `<p>Operators need a practical process for reviewing official requirements and documenting each decision carefully. This section explains a useful step ${index + 1} without inventing regulatory facts, fees, dates, or unsupported claims. Candidates should verify changing details with the certifying authority and keep accurate records for their own application.</p>`
  ).join("");
  return {
    title: `${BLOG_TOPICS[topicIndex].workingTitle}: A Practical Guide`,
    excerpt:
      "A practical, source-grounded guide for operators who want to understand the official process, organize their records, and plan the next certification step.",
    content: `<p>This guide turns official information into an organized plan.</p><h2>Understand the official framework</h2>${paragraphs}<h2>Build your checklist</h2><p>Use <a href="${links[0].href}">${links[0].label}</a> to continue.</p><h2>Verify changing details</h2><p>Review <a href="${links[1].href}">${links[1].label}</a> before acting.</p><h2>Plan the next step</h2><p>Keep your notes current and confirm requirements.</p>`,
    metaTitle: "Ontario Operator Exam Results: Practical Guide",
    metaDescription:
      "Understand how to organize Ontario operator certification decisions, verify current official requirements, and build a practical preparation plan.",
    tags: ["Ontario", "Operators", "Certification"],
  };
}

function dependencies(overrides: Partial<BlogAutomationDependencies> = {}) {
  const inserted: BlogPostInsert[] = [];
  const deps: BlogAutomationDependencies = {
    now: () => NOW,
    listPosts: vi.fn().mockResolvedValue([]),
    planTopic: vi.fn().mockResolvedValue(BLOG_TOPICS[0]),
    fetchSource: vi
      .fn()
      .mockResolvedValue("Official source information ".repeat(80)),
    generateArticle: vi.fn().mockResolvedValue(validArticle()),
    reviewArticle: vi.fn().mockResolvedValue({ approved: true, issues: [] }),
    insertPost: vi.fn(async post => {
      inserted.push(post);
    }),
    notify: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
  return { deps, inserted };
}

describe("weekly blog automation", () => {
  it("researches, independently reviews, and publishes an approved article", async () => {
    const { deps, inserted } = dependencies();
    const result = await runBlogAutomation(deps);

    expect(result).toMatchObject({
      ok: true,
      action: "article_published",
      slug: BLOG_TOPICS[0].slug,
    });
    expect(deps.fetchSource).toHaveBeenCalledTimes(
      BLOG_TOPICS[0].sources.length
    );
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      slug: BLOG_TOPICS[0].slug,
      published: 1,
    });
    expect(inserted[0].tags).toContain(AUTOMATED_ARTICLE_TAG);
    expect(inserted[0].content).toContain(
      "Automated source and quality review passed"
    );
    for (const source of BLOG_TOPICS[0].sources) {
      expect(inserted[0].content).toContain(source.url);
    }
    expect(deps.notify).toHaveBeenCalledOnce();
  });

  it("automatically revises an article that fails the first editorial review", async () => {
    const reviewArticle = vi
      .fn()
      .mockResolvedValueOnce({
        approved: false,
        issues: ["A certification statement needs clearer source support."],
      })
      .mockResolvedValueOnce({ approved: true, issues: [] });
    const generateArticle = vi.fn().mockResolvedValue(validArticle());
    const { deps, inserted } = dependencies({
      reviewArticle,
      generateArticle,
    });

    const result = await runBlogAutomation(deps);

    expect(result.action).toBe("article_published");
    expect(generateArticle).toHaveBeenCalledTimes(2);
    expect(generateArticle.mock.calls[1][0].revision.issues).toEqual([
      "A certification statement needs clearer source support.",
    ]);
    expect(reviewArticle).toHaveBeenCalledTimes(2);
    expect(inserted).toHaveLength(1);
  });

  it("does not publish when the independent review still fails after revision", async () => {
    const { deps } = dependencies({
      reviewArticle: vi.fn().mockResolvedValue({
        approved: false,
        issues: ["An unsupported eligibility claim remains."],
      }),
    });

    await expect(runBlogAutomation(deps)).rejects.toThrow(
      "Automated editorial review rejected the article after revision"
    );
    expect(deps.generateArticle).toHaveBeenCalledTimes(2);
    expect(deps.insertPost).not.toHaveBeenCalled();
    expect(deps.notify).not.toHaveBeenCalled();
  });

  it("does not publish a second automated article inside the six-day safety window", async () => {
    const { deps } = dependencies({
      listPosts: vi.fn().mockResolvedValue([
        {
          slug: "existing-weekly-article",
          title: "Existing article",
          tags: `Ontario,${AUTOMATED_ARTICLE_TAG}`,
          createdAt: new Date("2026-08-22T12:00:00.000Z"),
        },
      ]),
    });
    const result = await runBlogAutomation(deps);
    expect(result.action).toBe("skipped_recent_article");
    expect(deps.fetchSource).not.toHaveBeenCalled();
    expect(deps.generateArticle).not.toHaveBeenCalled();
    expect(deps.insertPost).not.toHaveBeenCalled();
  });

  it("moves to the next approved topic when a slug already exists", async () => {
    const { deps, inserted } = dependencies({
      listPosts: vi.fn().mockResolvedValue([
        {
          slug: BLOG_TOPICS[0].slug,
          title: BLOG_TOPICS[0].workingTitle,
          tags: "Ontario,Certification",
          createdAt: new Date("2026-01-01T12:00:00.000Z"),
        },
      ]),
      generateArticle: vi.fn().mockResolvedValue(validArticle(1)),
    });
    const result = await runBlogAutomation(deps);
    expect(result).toMatchObject({
      action: "article_published",
      slug: BLOG_TOPICS[1].slug,
    });
    expect(inserted[0].slug).toBe(BLOG_TOPICS[1].slug);
  });

  it("plans a new approved-source topic when the curated starter queue is exhausted", async () => {
    const plannedTopic = BLOG_TOPICS[2];
    const { deps, inserted } = dependencies({
      planTopic: vi.fn().mockResolvedValue(plannedTopic),
      generateArticle: vi.fn().mockResolvedValue(validArticle(2)),
    });
    const result = await runBlogAutomation(deps, []);
    expect(deps.planTopic).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      action: "article_published",
      slug: plannedTopic.slug,
    });
    expect(inserted[0].slug).toBe(plannedTopic.slug);
  });

  it("rejects unsafe generated markup before a database write", async () => {
    const { deps } = dependencies({
      generateArticle: vi.fn().mockResolvedValue({
        ...validArticle(),
        content: `${validArticle().content}<script>alert('xss')</script>`,
      }),
    });
    await expect(runBlogAutomation(deps)).rejects.toThrow(
      "prohibited HTML element"
    );
    expect(deps.insertPost).not.toHaveBeenCalled();
  });

  it("rejects unapproved source hosts before fetching", async () => {
    await expect(
      fetchOfficialSource({
        url: "https://example.com/operator-guide",
        label: "Unapproved",
      })
    ).rejects.toThrow("Source host is not approved");
  });

  it("removes unsafe attributes and non-approved tags from otherwise safe HTML", () => {
    expect(
      sanitizeGeneratedHtml(
        '<p onclick="steal()">Safe text</p><a href="javascript:steal()">bad</a><a href="//evil.example">also bad</a><div>kept text</div>'
      )
    ).toBe("<p>Safe text</p><a>bad</a><a>also bad</a>kept text");
  });

  it("creates the weekly Heartbeat once and leaves a current schedule alone", async () => {
    const create = vi.fn().mockResolvedValue({ taskUid: "blog-task" });
    const update = vi.fn().mockResolvedValue({});
    const list = vi
      .fn()
      .mockResolvedValueOnce({ total: 0, actorUserId: "owner", jobs: [] })
      .mockResolvedValueOnce({
        total: 1,
        actorUserId: "owner",
        jobs: [
          {
            taskUid: "blog-task",
            name: "weekly-echelon-blog",
            userId: "owner",
            description:
              "Research, review, revise, and publish one source-grounded Echelon article each week.",
            cronExpression: "0 0 14 * * 1",
            callbackPath: "/api/scheduled/generate-blog",
            callbackMethod: "POST",
            callbackPayload: "{}",
            isEnable: true,
          },
        ],
      });

    await expect(
      ensureWeeklyBlogHeartbeat({ list, create, update })
    ).resolves.toBe("created");
    await expect(
      ensureWeeklyBlogHeartbeat({ list, create, update })
    ).resolves.toBe("unchanged");
    expect(create).toHaveBeenCalledOnce();
    expect(update).not.toHaveBeenCalled();
  });
});
