import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";
let browser: Browser; let script: string; let css: string;
beforeAll(async () => {
  const result = await build({ bundle: true, write: false, format: "iife", jsx: "automatic", loader: { ".css": "empty" },
    alias: { "@": `${process.cwd()}/client/src`, "@shared": `${process.cwd()}/shared` },
    stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Card from './client/src/components/AdminGamesActivity'; createRoot(document.getElementById('root')).render(<Card/>);` },
    plugins: [{ name: "isolated-game-admin", setup(b) {
      b.onResolve({ filter: /^@\/lib\/trpc$/ }, args => ({ path: args.path, namespace: "fixture" }));
      b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ loader: "js", contents: `export const trpc={admin:{gameActivity:{useQuery:input=>{window.__days=input.days;return {...window.__query, refetch:async()=>{window.__retried=true;}};}}}};` }));
    } }],
  });
  script = result.outputFiles[0].text; css = await readFile("client/src/pages/admin.css", "utf8");
  browser = await chromium.launch({ headless: true });
}, 30000);
afterAll(async () => { await browser?.close(); });
const data = { players: 4, anonymousBrowsers: 3, identifiedPlayers: 1, roundsStarted: 6, roundsCompleted: 2, questionsAnswered: 12, returningPlayers: 1,
  popularCourses: [{ key: "oit", rounds: 6 }], popularModes: [{ key: "rapid-swipe", rounds: 6 }], firstTrackedAt: "2026-11-17T12:00:00Z" };
async function card(query: unknown, run: (page: Page) => Promise<void>, width = 390) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  await page.route("**/*", route => route.abort());
  try {
    await page.setContent(`<style>${css}</style><main class="admin-simplified ops-admin-surface"><div id="root"></div></main>`);
    await page.evaluate(value => { (window as any).__query = value; }, query);
    await page.addScriptTag({ content: script }); await page.getByRole("heading", { name: "Games activity" }).waitFor();
    await run(page);
  } finally { await page.close(); }
}
describe("Games activity overview", () => {
  it("shows loading and an explicit error rather than fake zero counts", async () => {
    await card({ isPending: true }, async page => { expect(await page.getByRole("status").innerText()).toContain("Loading"); expect(await page.locator("dd").count()).toBe(0); });
    await card({ isError: true, data }, async page => {
      expect(await page.getByRole("alert").innerText()).toContain("Counts are unavailable"); expect(await page.locator("dd").count()).toBe(0);
      await page.getByRole("button", { name: "Try again" }).click(); expect(await page.evaluate(() => (window as any).__retried)).toBe(true);
    });
  });
  it("distinguishes no tracked answers from an unavailable report", async () => {
    await card({ data: { ...data, roundsStarted: 0, firstTrackedAt: null } }, async page => {
      expect(await page.getByRole("status").innerText()).toContain("Opening a game does not count");
      await page.getByText("How these counts work").click(); expect(await page.locator("details").innerText()).toContain("No historical backfill");
    });
  });
  it.each([390, 1280])("shows estimates, definitions, period controls without overflow at %i", async width => {
    await card({ data }, async page => {
      expect(await page.locator("dd").allTextContents()).toEqual(["4", "6", "2", "12", "1"]);
      await page.getByRole("combobox", { name: "Period" }).selectOption("7");
      expect(await page.evaluate(() => (window as any).__days)).toBe(7);
      await page.getByText("How these counts work").click();
      expect(await page.locator("details").innerText()).toContain("distinct UTC days");
      expect(await page.locator("details").innerText()).toContain("not unique people");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }, width);
  });
});
