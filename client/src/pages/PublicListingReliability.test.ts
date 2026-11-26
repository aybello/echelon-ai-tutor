import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { beforeEach, describe, expect, it, vi } from "vitest";
const queries = vi.hoisted(() => ({ jobs: {} as any, stats: {} as any, blog: {} as any }));
vi.mock("@/lib/trpc", () => ({ trpc: { jobs: { listJobs: { useQuery: () => queries.jobs }, stats: { useQuery: () => queries.stats } }, blog: { listPosts: { useQuery: () => queries.blog } } } }));
vi.mock("@/components/SiteNav", () => ({ default: () => null }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: () => {} }));
import Careers from "./Careers";
import Blog from "./Blog";
const render = (component: typeof Blog) => renderToStaticMarkup(createElement(Router, { ssrPath: "/blog", children: createElement(component) }));
const posting = { id: 1, title: "Water Operator Fixture", company: null, location: "Ontario", province: "ON", salary: null, jobType: "full-time", sourceUrl: "https://employer.example.test", sourceName: "fixture", description: null, postedAt: null, isFeatured: 0 };
const article = { id: 1, slug: "fixture", title: "Fixture study guide", excerpt: "Fixture content", author: "Echelon Institute", tags: null, readingTimeMinutes: 5, publishedAt: new Date("2026-07-02T00:00:00Z") };
beforeEach(() => {
  vi.stubGlobal("React", React);
  queries.jobs = { data: undefined, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() };
  queries.blog = { ...queries.jobs };
  queries.stats = { ...queries.jobs };
});
describe("public listing failure and recovery UI", () => {
  it("shows Retry instead of false empty inventory or no matching articles on first-load failure", () => {
    queries.jobs.isError = true; queries.blog.isError = true;
    const jobs = render(Careers); const blog = render(Blog);
    expect(jobs).toContain("Jobs are temporarily unavailable"); expect(jobs).toContain("Retry"); expect(jobs).not.toContain("No postings found");
    expect(blog).toContain("Articles are temporarily unavailable"); expect(blog).toContain("Retry"); expect(blog).not.toContain("No matching articles");
  });
  it("labels retained cached results honestly during failed revalidation", () => {
    queries.jobs = { ...queries.jobs, isError: true, data: { jobs: [posting], total: 1, totalPages: 1 } };
    queries.blog = { ...queries.blog, isError: true, data: [article] };
    expect(render(Careers)).toContain("Showing previously loaded postings"); expect(render(Careers)).toContain(posting.title);
    expect(render(Blog)).toContain("Showing previously loaded articles"); expect(render(Blog)).toContain(article.title);
  });
  it("successful zero-result queries alone display normal empty states", () => {
    queries.jobs.data = { jobs: [], total: 0, totalPages: 0 }; queries.blog.data = [];
    expect(render(Careers)).toContain("No postings found"); expect(render(Blog)).toContain("No matching articles");
  });
  it("recovery restores content and removes the error banner", () => {
    queries.jobs.data = { jobs: [posting], total: 1, totalPages: 1 }; queries.blog.data = [article];
    expect(render(Careers)).toContain(posting.title); expect(render(Careers)).not.toContain("Jobs are temporarily unavailable");
    expect(render(Blog)).toContain(article.title); expect(render(Blog)).not.toContain("Articles are temporarily unavailable");
  });
  it("distinguishes failed/overdue refresh coverage from retained inventory counts", () => {
    queries.stats.data = { total: 36, isStale: true, refreshedSourceCount: 2, expectedSourceCount: 5 };
    const html = render(Careers);
    expect(html).toContain("Verified sources in the latest run: 2 of 5"); expect(html).toContain("Retained listings are not proof"); expect(html).not.toContain("36 active postings");
  });
});
