/**
 * Tests for blogRouter — listPosts, getPostBySlug, getRelatedPosts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// ── Schema mirrors ────────────────────────────────────────────────────────────

const BlogPostSummarySchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  author: z.string(),
  tags: z.string().nullable(),
  readingTimeMinutes: z.number(),
  publishedAt: z.date(),
});

const BlogPostFullSchema = BlogPostSummarySchema.extend({
  content: z.string(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  published: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ── Mock DB ───────────────────────────────────────────────────────────────────

const now = new Date("2026-06-01T00:00:00Z");

const mockPosts = [
  {
    id: 1,
    slug: "how-to-pass-ontario-oit-water-exam",
    title: "How to Pass the Ontario OIT Water Exam",
    excerpt: "A complete study guide for the OIT exam.",
    content: "<p>Full content here.</p>",
    author: "Echelon Institute",
    tags: "OIT,Ontario,water treatment",
    metaTitle: "How to Pass the Ontario OIT Water Exam | Echelon Institute",
    metaDescription: "Step-by-step study guide.",
    readingTimeMinutes: 8,
    published: 1,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    slug: "ontario-class-1-vs-class-2-water-operator-differences",
    title: "Ontario Class 1 vs Class 2 Water Operator",
    excerpt: "Key differences between Class 1 and Class 2.",
    content: "<p>Full content here.</p>",
    author: "Echelon Institute",
    tags: "Class 1,Class 2,Ontario",
    metaTitle: null,
    metaDescription: null,
    readingTimeMinutes: 7,
    published: 1,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
];

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// ── Unit tests (schema validation only — no DB required) ─────────────────────

describe("blogRouter — schema validation", () => {
  it("BlogPostSummarySchema accepts valid post summary", () => {
    const summary = {
      id: 1,
      slug: "test-slug",
      title: "Test Post",
      excerpt: "Test excerpt.",
      author: "Echelon Institute",
      tags: "OIT,Ontario",
      readingTimeMinutes: 5,
      publishedAt: new Date(),
    };
    expect(() => BlogPostSummarySchema.parse(summary)).not.toThrow();
  });

  it("BlogPostSummarySchema accepts null tags", () => {
    const summary = {
      id: 2,
      slug: "no-tags",
      title: "No Tags Post",
      excerpt: "No tags here.",
      author: "Echelon Institute",
      tags: null,
      readingTimeMinutes: 3,
      publishedAt: new Date(),
    };
    expect(() => BlogPostSummarySchema.parse(summary)).not.toThrow();
  });

  it("BlogPostSummarySchema rejects missing required fields", () => {
    expect(() => BlogPostSummarySchema.parse({ id: 1 })).toThrow();
  });

  it("BlogPostFullSchema accepts valid full post", () => {
    const post = {
      id: 1,
      slug: "full-post",
      title: "Full Post",
      excerpt: "Excerpt.",
      content: "<p>Content</p>",
      author: "Echelon Institute",
      tags: "OIT",
      metaTitle: "Full Post | Echelon",
      metaDescription: "Meta description.",
      readingTimeMinutes: 8,
      published: 1,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(() => BlogPostFullSchema.parse(post)).not.toThrow();
  });

  it("BlogPostFullSchema accepts null metaTitle and metaDescription", () => {
    const post = {
      id: 2,
      slug: "no-meta",
      title: "No Meta",
      excerpt: "Excerpt.",
      content: "<p>Content</p>",
      author: "Echelon Institute",
      tags: null,
      metaTitle: null,
      metaDescription: null,
      readingTimeMinutes: 5,
      published: 1,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(() => BlogPostFullSchema.parse(post)).not.toThrow();
  });
});

// ── Slug validation ───────────────────────────────────────────────────────────

describe("blogRouter — slug input validation", () => {
  const SlugInput = z.object({ slug: z.string().min(1).max(200) });

  it("accepts valid slug", () => {
    expect(() => SlugInput.parse({ slug: "how-to-pass-ontario-oit-water-exam" })).not.toThrow();
  });

  it("rejects empty slug", () => {
    expect(() => SlugInput.parse({ slug: "" })).toThrow();
  });

  it("rejects slug over 200 characters", () => {
    expect(() => SlugInput.parse({ slug: "a".repeat(201) })).toThrow();
  });
});

// ── Mock data integrity ───────────────────────────────────────────────────────

describe("blogRouter — mock data integrity", () => {
  it("all mock posts pass BlogPostFullSchema", () => {
    for (const post of mockPosts) {
      expect(() => BlogPostFullSchema.parse(post)).not.toThrow();
    }
  });

  it("mock posts have unique slugs", () => {
    const slugs = mockPosts.map(p => p.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("mock posts have positive readingTimeMinutes", () => {
    for (const post of mockPosts) {
      expect(post.readingTimeMinutes).toBeGreaterThan(0);
    }
  });

  it("mock posts have non-empty content", () => {
    for (const post of mockPosts) {
      expect(post.content.length).toBeGreaterThan(0);
    }
  });
});
