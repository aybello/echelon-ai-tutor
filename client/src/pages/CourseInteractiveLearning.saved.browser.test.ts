import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";

// Isolated page with a synthetic transport. No server, database, accounts or authored content.
let browser: Browser;
let script: string;
const modes = ["rapid-swipe", "speed-match", "odd-one-out", "cause-effect", "tap-the-flaw", "before-after"];

beforeAll(async () => {
  const bundle = await build({
    bundle: true, write: false, format: "iife", jsx: "automatic", loader: { ".css": "empty" },
    alias: { "@": `${process.cwd()}/client/src`, "@shared": `${process.cwd()}/shared` },
    stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {QueryClient,QueryClientProvider,onlineManager} from '@tanstack/react-query';
      import Course from './client/src/pages/CourseInteractiveLearning';
      onlineManager.setOnline(true);
      window.__client = new QueryClient();
      createRoot(document.getElementById('root')).render(<QueryClientProvider client={window.__client}><Course /></QueryClientProvider>);
    ` },
    plugins: [{ name: "synthetic-transport", setup(builder) {
      builder.onResolve({ filter: /^(wouter|@\/lib\/trpc|@\/hooks\/usePageMeta)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "js", resolveDir: process.cwd(), contents: {
        wouter: `import React from 'react';
          export const useRoute=()=>[true,{courseKey:'oit'}];export const useSearch=()=>'';
          export const Link=({children,...props})=>React.createElement('a',props,children);`,
        "@/hooks/usePageMeta": `export const usePageMeta=()=>{};`,
        "@/lib/trpc": `const p=path=>({_def:()=>({path})});
          export const trpc={useUtils:()=>({client:{interactive:{
            getCatalog:{mutate:async()=>window.__catalog()},
            startSession:{mutate:async input=>{window.__sessionInputs.push(input);return window.__session(input);}},
            getProgress:{mutate:async()=>window.__getProgress()},
            recordResults:{mutate:async input=>{window.__recorded.push(input);return window.__record(input);}}
          }}}),auth:{me:p(['auth','me'])},dashboardAuth:{me:p(['dashboardAuth','me'])},
          stripe:{checkAccess:p(['stripe','checkAccess'])},access:{auditMyEntitlements:p(['access','auditMyEntitlements'])}};`,
      }[args.path]! }));
    } }],
  });
  script = bundle.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);
afterAll(async () => { await browser?.close(); });

type ProgressShape = { stored: boolean; today: { answered: number; correct: number; goal: number }; streakDays: number; dueCount: number; modes: unknown[] };
const anonymous: ProgressShape = { stored: false, today: { answered: 0, correct: 0, goal: 20 }, streakDays: 0, dueCount: 0, modes: [] };
const signedIn: ProgressShape = { stored: true, today: { answered: 12, correct: 9, goal: 20 }, streakDays: 3, dueCount: 4, modes: [] };

async function withPage(progress: ProgressShape, run: (page: Page) => Promise<void>, options: { recordFails?: boolean } = {}) {
  const page = await browser.newPage();
  await page.route("**/*", route => route.abort());
  try {
    await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>');
    await page.evaluate(({ progress, modes, recordFails }) => {
      const w = window as any;
      w.__sessionInputs = []; w.__recorded = [];
      w.__catalog = () => ({ courseKey: "oit", available: true, locked: false, version: "v1",
        modes: modes.map((mode: string) => ({ mode, totalCount: 8, topics: [], difficulties: [] })) });
      w.__session = (input: { mode: string }) => ({
        courseKey: "oit", available: true, locked: false, version: "v1", sessionId: `s-${w.__sessionInputs.length}`, mode: input.mode,
        totalAvailableCount: 8, filters: { topicId: null, difficulty: null, requestedSize: 20 },
        examples: Array.from({ length: 6 }, (_, i) => ({ id: `sw-${i + 1}`, mode: "rapid-swipe", prompt: `Synthetic statement ${i + 1}`, correctAnswer: true, explanation: "Synthetic explanation." })),
      });
      w.__getProgress = () => progress;
      w.__record = (input: { results: unknown[] }) => recordFails ? Promise.reject(new Error("storage down")) : ({ stored: true, saved: input.results.length, ignored: 0 });
    }, { progress, modes, recordFails: options.recordFails ?? false });
    await page.addScriptTag({ content: script });
    await page.getByRole("button", { name: "Yes", exact: true }).waitFor();
    await run(page);
  } finally { await page.close(); }
}
const hidePage = (page: Page) => page.evaluate(() => {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
  document.dispatchEvent(new Event("visibilitychange"));
});

describe("course game results are saved only for signed-in learners", () => {
  it("shows the saved note and records an answer when the page is hidden", async () => {
    await withPage(signedIn, async page => {
      await page.locator(".interactive-drill__pill", { hasText: "Progress saved" }).waitFor();
      await page.getByRole("button", { name: "Yes", exact: true }).click();
      await hidePage(page);
      await page.waitForFunction(() => (window as any).__recorded.length === 1);
      const recorded = await page.evaluate(() => (window as any).__recorded);
      expect(recorded).toHaveLength(1);
      expect(recorded[0]).toMatchObject({ courseKey: "oit", results: [{ itemId: "sw-1", mode: "rapid-swipe", correct: true }] });
      expect(recorded[0].localDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("records a wrong answer as incorrect", async () => {
    await withPage(signedIn, async page => {
      await page.getByRole("button", { name: "No", exact: true }).click();
      await hidePage(page);
      await page.waitForFunction(() => (window as any).__recorded.length === 1);
      expect((await page.evaluate(() => (window as any).__recorded))[0].results).toEqual([{ itemId: "sw-1", mode: "rapid-swipe", correct: false }]);
    });
  });

  it("batches five answers into one request without waiting", async () => {
    await withPage(signedIn, async page => {
      for (let i = 0; i < 5; i++) {
        await page.getByRole("button", { name: "Yes", exact: true }).click();
        if (i < 4) await page.getByRole("button", { name: /Next activity/ }).click();
      }
      await page.waitForFunction(() => (window as any).__recorded.length === 1);
      const recorded = await page.evaluate(() => (window as any).__recorded);
      expect(recorded[0].results.map((r: { itemId: string }) => r.itemId)).toEqual(["sw-1", "sw-2", "sw-3", "sw-4", "sw-5"]);
    });
  });

  it("saves nothing, shows no card and keeps the not-saved note for anonymous play", async () => {
    await withPage(anonymous, async page => {
      await page.locator(".interactive-drill__pill", { hasText: "Practice · not saved" }).waitFor();
      await page.getByRole("button", { name: "Yes", exact: true }).click();
      await hidePage(page);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => (window as any).__recorded)).toHaveLength(0);
      expect(await page.locator(".course-interactive__progress").count()).toBe(0);
      expect(await page.locator(".interactive-drill__pill", { hasText: "Progress saved" }).count()).toBe(0);
    });
  });

  it("skipped activities are not recorded", async () => {
    await withPage(signedIn, async page => {
      await page.getByRole("button", { name: /Next activity/ }).click();
      await hidePage(page);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => (window as any).__recorded)).toHaveLength(0);
    });
  });

  it("keeps working when storage fails", async () => {
    await withPage(signedIn, async page => {
      await page.getByRole("button", { name: "Yes", exact: true }).click();
      await hidePage(page);
      await page.waitForFunction(() => (window as any).__recorded.length === 1);
      await page.evaluate(() => Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }));
      await page.getByRole("button", { name: /Next activity/ }).click();
      await page.getByRole("button", { name: "Yes", exact: true }).waitFor();
      expect(await page.locator("text=Synthetic statement 2").count()).toBe(1);
    }, { recordFails: true });
  });
});

describe("progress card and replay", () => {
  it("shows today's count, the streak and the due count", async () => {
    await withPage(signedIn, async page => {
      const card = page.getByRole("status", { name: "Your saved progress" });
      await card.waitFor();
      const text = await card.innerText();
      expect(text).toContain("Today 12 of 20");
      expect(text).toContain("3 day streak");
      expect(text).toContain("4 due for review");
    });
  });

  it("starts a replay session with focus review, then returns to mixed practice", async () => {
    await withPage(signedIn, async page => {
      await page.getByRole("button", { name: "Review missed" }).click();
      await page.getByRole("button", { name: "Back to mixed practice" }).waitFor();
      const inputs = await page.evaluate(() => (window as any).__sessionInputs);
      expect(inputs[inputs.length - 1].focus).toBe("review");
      await page.getByRole("button", { name: "Back to mixed practice" }).click();
      await page.getByRole("button", { name: "Review missed" }).waitFor();
      const after = await page.evaluate(() => (window as any).__sessionInputs);
      expect(after[after.length - 1].focus).toBeUndefined();
    });
  });

  it("hides the replay button when nothing is due", async () => {
    await withPage({ ...signedIn, dueCount: 0 }, async page => {
      await page.getByRole("status", { name: "Your saved progress" }).waitFor();
      expect(await page.getByRole("button", { name: "Review missed" }).count()).toBe(0);
    });
  });

  it("never sends the replay focus for anonymous play", async () => {
    await withPage(anonymous, async page => {
      const inputs = await page.evaluate(() => (window as any).__sessionInputs);
      expect(inputs.every((input: { focus?: string }) => input.focus === undefined)).toBe(true);
    });
  });
});
