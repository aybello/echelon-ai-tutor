import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { rankRelatedPosts } from "./relatedPosts";

const seed = fs.readFileSync(
  path.resolve(process.cwd(), "server/scripts/seedBlog2026.mjs"),
  "utf8"
);

const expectedSlugs = [
  "how-to-become-water-wastewater-operator-ontario",
  "ontario-oit-exam-eligibility-format-fees-study-plan",
  "class-1-water-treatment-practice-questions-study-guide",
  "class-1-wastewater-treatment-practice-questions-study-guide",
  "how-long-study-water-operator-certification-exam",
  "water-operator-certification-reciprocity-canada",
  "utilities-build-certification-ready-operator-workforce",
  "water-operator-training-programs-municipal-manager-checklist",
  "water-operator-salary-canada-by-province-2026",
];

describe("2026 blog authority cluster", () => {
  it("contains every approved article and salary refresh", () => {
    for (const slug of expectedSlugs) expect(seed).toContain(`slug: "${slug}"`);
  });

  it("adds governance metadata to all nine deliverables", () => {
    expect(seed.match(/governance\(\{/g)).toHaveLength(9);
    expect(seed).toContain("Last editorial review");
    expect(seed).toContain("Technical review");
    expect(seed).toContain("Official sources");
  });

  it("does not hard-code an OIT fee or retain broken internal routes", () => {
    expect(seed).toContain("does not hard-code a dollar figure");
    expect(seed).not.toContain('href="/courses"');
    expect(seed).not.toContain('href="/contact"');
    expect(seed).not.toContain('href="/career-map"');
  });

  it("labels employer and operator lanes", () => {
    expect(seed.match(/tags: "Employer Resources/g)).toHaveLength(2);
    expect(seed.match(/tags: "Operator Guides/g)).toHaveLength(5);
  });
});

describe("related article ranking", () => {
  it("prefers shared categories before recency", () => {
    const posts = [
      {
        slug: "new-unrelated",
        tags: "Employer Resources",
        publishedAt: new Date("2026-08-11"),
      },
      {
        slug: "older-related",
        tags: "Operator Guides,Ontario",
        publishedAt: new Date("2026-08-01"),
      },
      {
        slug: "new-related",
        tags: "Operator Guides,Exam Prep",
        publishedAt: new Date("2026-08-10"),
      },
    ];
    expect(
      rankRelatedPosts(posts, "Operator Guides,Ontario", 3).map(
        post => post.slug
      )
    ).toEqual(["older-related", "new-related", "new-unrelated"]);
  });
});
