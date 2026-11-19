import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";

let browser: Browser;
let script: string;
let css: string;

beforeAll(async () => {
  // Bundle the actual wrapper, CourseFinder, registry and wouter. No app server,
  // auth providers, service credentials, requests or database are needed.
  const result = await build({
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    outfile: "homepage-course-discovery-harness.js",
    alias: {
      "@": `${process.cwd()}/client/src`,
      "@shared": `${process.cwd()}/shared`,
    },
    define: { "process.env.NODE_ENV": '"test"' },
    stdin: {
      resolveDir: process.cwd(),
      loader: "tsx",
      contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import HomepageCourseDiscovery from './client/src/components/HomepageCourseDiscovery';
        import CourseFinder from './client/src/components/CourseFinder';
        window.selections = [];
        const Component = window.baseline ? CourseFinder : HomepageCourseDiscovery;
        createRoot(document.getElementById('root')).render(
          <Component initialProvince={window.initialProvince}
            onCourseSelected={selection => window.selections.push(selection)} />
        );
      `,
    },
  });
  script = result.outputFiles.find(file => file.path.endsWith(".js"))!.text;
  css = result.outputFiles.find(file => file.path.endsWith(".css"))!.text;
  browser = await chromium.launch({ headless: true });
}, 30000);

afterAll(async () => {
  await browser?.close();
});

async function render({
  width = 1280,
  search = "",
  initialProvince = null,
  baseline = false,
}: {
  width?: number;
  search?: string;
  initialProvince?: string | null;
  baseline?: boolean;
} = {}) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  page.on("pageerror", error => console.error("Discovery render error:", error.message));
  page.setDefaultTimeout(2500);
  await page.route("**/*", route => {
    if (route.request().resourceType() === "document" && route.request().url().startsWith("https://discovery.echelon.test/")) {
      return route.fulfill({ contentType: "text/html", body: '<!doctype html><html><head></head><body><div id="root"></div></body></html>' });
    }
    return route.abort();
  });
  await page.goto(`https://discovery.echelon.test/${search}`);
  await page.evaluate(values => Object.assign(window, values), { baseline, initialProvince });
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: script });
  await page.getByLabel("1. Province").waitFor();
  return page;
}

async function selections(page: Page) {
  return page.evaluate(() => (window as unknown as {
    selections: { courseKey: string; examFamily: string }[];
  }).selections);
}

describe("HomepageCourseDiscovery actual render", () => {
  for (const width of [390, 1440]) {
    it(`defaults to Canada, with one heading and separate trade/team links at ${width}px`, async () => {
      const page = await render({ width, initialProvince: "on" });
      try {
        expect(await page.getByRole("heading", { name: "Find your course", exact: true }).count()).toBe(1);
        const tabs = page.getByRole("tablist", { name: "Exam country" });
        expect(await tabs.getByRole("tab").allTextContents()).toEqual(["Canada", "United States"]);
        expect(await page.getByRole("tab", { name: "Canada", selected: true }).count()).toBe(1);
        const canada = page.getByRole("tabpanel", { name: "Canada", exact: true });
        expect(await canada.isVisible()).toBe(true);
        expect(await page.getByLabel("1. Province").inputValue()).toBe("on");
        expect(await page.getByLabel("2. System").isEnabled()).toBe(true);
        expect(await page.getByLabel("3. Level").isDisabled()).toBe(true);
        expect(await page.getByRole("link", { name: "Looking for a US exam?" }).count()).toBe(0);
        expect(await page.getByRole("link", { name: /309A/ }).count()).toBe(1);
        expect(await page.getByRole("link", { name: /Free 309A practice & mock exams/ }).getAttribute("href")).toBe("/electrician-309a");
        expect(await page.locator(".homepage-course-discovery__trade").innerText()).not.toMatch(/games/i);
        const employerLane = page.locator(".homepage-course-discovery__team");
        expect(await employerLane.getByRole("link").count()).toBe(1);
        expect(await employerLane.getByRole("link", { name: "Training a team?" }).getAttribute("href")).toBe("/teams");
        expect(await employerLane.locator('a[href*="pricing"], a[href*="individual"]').count()).toBe(0);
        const selectedTab = page.getByRole("tab", { name: "Canada" });
        expect(await selectedTab.evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(23, 87, 184)");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        const tabControls = await selectedTab.getAttribute("aria-controls");
        expect(await canada.getAttribute("id")).toBe(tabControls);
      } finally {
        await page.close();
      }
    });
  }

  it("supports keyboard country tabs and a real U.S. destination, not an unfinished selector", async () => {
    const page = await render({ search: "?province=BC&track=water-treatment&product=wpi-class1-water&utm_source=fixture" });
    try {
      const originalUrl = page.url();
      await page.getByRole("tab", { name: "Canada" }).focus();
      await page.keyboard.press("End");
      const usTab = page.getByRole("tab", { name: "United States", selected: true });
      expect(await usTab.evaluate(el => el === document.activeElement)).toBe(true);
      const us = page.getByRole("tabpanel", { name: "United States", exact: true });
      expect(await us.isVisible()).toBe(true);
      expect(await us.getAttribute("id")).toBe(await usTab.getAttribute("aria-controls"));
      expect(await page.getByRole("combobox").count()).toBe(0);
      expect(page.url()).toBe(originalUrl);
      expect(await selections(page)).toEqual([]);
      await page.keyboard.press("ArrowRight");
      expect(await page.getByRole("tab", { name: "Canada", selected: true }).count()).toBe(1);
      expect(await page.getByLabel("3. Level").inputValue()).toBe("wpi-class1-water");
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("Home");
      expect(await page.getByRole("tab", { name: "Canada", selected: true }).count()).toBe(1);
      await page.getByRole("tab", { name: "United States" }).click();
      const link = us.getByRole("link", { name: "Find U.S. exam prep" });
      expect(await link.getAttribute("href")).toBe("/us");
      await link.click();
      expect(new URL(page.url()).pathname).toBe("/us");
    } finally {
      await page.close();
    }
  });

  it("preserves the existing Canadian URL, course links and exactly-once selection callbacks", async () => {
    const observed = [];
    for (const baseline of [true, false]) {
      const page = await render({ baseline, initialProvince: "on", search: "?utm_source=fixture&utm_campaign=course-discovery" });
      try {
        await page.getByLabel("1. Province").selectOption("bc");
        await page.getByLabel("2. System").selectOption("water-treatment");
        await page.getByLabel("3. Level").selectOption("wpi-class1-water");
        const href = await page.getByRole("link", { name: "Try this course" }).getAttribute("href");
        const pricing = await page.getByRole("link", { name: "View access plans" }).getAttribute("href");
        const url = page.url();
        expect(await selections(page)).toEqual([{ courseKey: "wpi-class1-water", examFamily: "western" }]);
        if (!baseline) {
          await page.getByRole("tab", { name: "United States" }).click();
          await page.getByRole("tab", { name: "Canada" }).click();
          expect(page.url()).toBe(url);
          expect(await page.getByLabel("3. Level").inputValue()).toBe("wpi-class1-water");
        }
        observed.push({ url, href, pricing, selections: await selections(page) });
      } finally {
        await page.close();
      }
    }
    expect(observed[1]).toEqual(observed[0]);
    expect(observed[1].url).toContain("?province=BC&track=water-treatment&product=wpi-class1-water");
    expect(observed[1].href).toBe("/wpi-class1-water?province=BC");
    expect(observed[1].pricing).toBe("/pricing?product=wpi-class1-water&province=BC");
  });

  it("honours URL province over the initial prop and resets downstream choices using CourseFinder", async () => {
    const page = await render({ initialProvince: "on", search: "?province=NS&track=water-treatment&product=wpi-class1-water" });
    try {
      expect(await page.getByLabel("1. Province").inputValue()).toBe("ns");
      expect(await page.getByRole("link", { name: "Official exam guidance" }).isVisible()).toBe(true);
      expect(await selections(page)).toEqual([]);
      await page.getByLabel("1. Province").selectOption("on");
      expect(await page.getByLabel("2. System").inputValue()).toBe("");
      expect(await page.getByLabel("3. Level").isDisabled()).toBe(true);
      await page.getByLabel("2. System").selectOption("water-treatment");
      await page.getByLabel("3. Level").selectOption("class1-water");
      expect(await selections(page)).toEqual([{ courseKey: "class1-water", examFamily: "ontario" }]);
      expect(await page.getByRole("link", { name: "Try this course" }).getAttribute("href")).toBe("/class1-water?province=ON");
    } finally {
      await page.close();
    }
  });

  it("does not leak duplicate-row suppression or blue wrapper styles to standalone CourseFinder", async () => {
    const page = await render({ baseline: true });
    try {
      expect(await page.getByRole("heading", { name: "Find your course" }).isVisible()).toBe(true);
      expect(await page.getByRole("link", { name: "Looking for a US exam?" }).isVisible()).toBe(true);
      expect(await page.getByRole("link", { name: "Ontario 309A electrician" }).isVisible()).toBe(true);
    } finally {
      await page.close();
    }
  });
});
