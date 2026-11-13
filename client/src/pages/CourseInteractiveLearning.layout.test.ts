import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser } from "@playwright/test";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";

let browser: Browser;
let script: string;
let css: string;
const choices = [{ id: "a", label: "Synthetic first choice" }, { id: "b", label: "Synthetic second choice" }, { id: "c", label: "Synthetic third choice" }, { id: "d", label: "Synthetic fourth choice" }];
const examples = [
  { id: "rapid", mode: "rapid-swipe", prompt: "Synthetic statement for exam practice?", correctAnswer: true, explanation: "Synthetic explanation for this short practice statement." },
  { id: "match", mode: "speed-match", prompt: "Match these synthetic items.", pairs: [1, 2, 3].map(n => ({ id: `pair-${n}`, left: `Synthetic item ${n}`, right: `Synthetic partner ${n}` })), explanation: "Synthetic explanation for these three pairs." },
  ...["odd-one-out", "cause-effect", "tap-the-flaw"].map(mode => ({ id: mode, mode, prompt: "Choose the appropriate synthetic answer.", options: choices, correctOptionId: "a", explanation: "Synthetic explanation for this short practice question." })),
  { id: "order", mode: "before-after", prompt: "Which synthetic stage comes earlier?", options: ["Synthetic stage Alpha", "Synthetic stage Beta"], correctAnswer: "Synthetic stage Alpha", explanation: "Synthetic explanation for these two stages." },
];

beforeAll(async () => {
  const result = await build({
    bundle: true, write: false, format: "iife", jsx: "automatic", loader: { ".css": "empty" },
    alias: { "@": `${process.cwd()}/client/src`, "@shared": `${process.cwd()}/shared` },
    stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
      import Course from './client/src/pages/CourseInteractiveLearning';
      createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><Course /></QueryClientProvider>);
    ` },
    plugins: [{ name: "isolated-layout", setup(builder) {
      builder.onResolve({ filter: /^(wouter|@\/lib\/trpc|@\/hooks\/usePageMeta)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "js", resolveDir: process.cwd(), contents: {
        wouter: `import React from 'react'; export const useRoute=()=>[true,{courseKey:'oit'}]; export const useSearch=()=>''; export const Link=({children,...props})=>React.createElement('a',props,children);`,
        "@/hooks/usePageMeta": `export const usePageMeta=()=>{};`,
        "@/lib/trpc": `const p=path=>({_def:()=>({path})}); export const trpc={useUtils:()=>({client:{interactive:{getCatalog:{mutate:async()=>({courseKey:"oit",available:true,locked:false,version:"synthetic-layout",modes:window.__content.examples.map(example=>({mode:example.mode,totalCount:1,topics:[],difficulties:[]}))})},startSession:{mutate:async input=>({courseKey:"oit",available:true,locked:false,version:"synthetic-layout",sessionId:"synthetic-layout-session",mode:input.mode,totalAvailableCount:1,examples:window.__content.examples.filter(example=>example.mode===input.mode),filters:{topicId:null,difficulty:null,requestedSize:input.sessionSize}})}}}}),auth:{me:p(['auth','me'])},dashboardAuth:{me:p(['dashboardAuth','me'])},stripe:{checkAccess:p(['stripe','checkAccess'])},access:{auditMyEntitlements:p(['access','auditMyEntitlements'])}};`,
      }[args.path]! }));
    } }],
  });
  script = result.outputFiles[0].text;
  css = (await Promise.all(["client/src/pages/InteractiveLearning.css", "client/src/components/InteractiveDrill.css", "client/src/pages/CourseInteractiveLearning.css"].map(path => readFile(path, "utf8")))).join("\n");
  browser = await chromium.launch({ headless: true });
}, 30000);
afterAll(async () => { await browser?.close(); });

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  describe(`course layout ${viewport.width}x${viewport.height}`, () => {
    it("fits short activities and feedback, retains targets and allows expanded content to scroll", async () => {
      const page = await browser.newPage({ viewport });
      page.setDefaultTimeout(3000);
      const requests: string[] = [];
      page.on("request", request => requests.push(request.url()));
      await page.route("**/*", route => route.abort());
      try {
        await page.setContent('<!doctype html><html><body style="margin:0"><div id="root"></div></body></html>');
        await page.evaluate(data => {
          Object.defineProperty(window, "localStorage", { configurable: true, value: { getItem: () => null } });
          (window as any).__content = { courseKey: "oit", available: true, locked: false, version: "synthetic-layout", examples: data };
        }, examples);
        await page.addStyleTag({ content: css });
        await page.addScriptTag({ content: script });
        await page.locator(".interactive-drill__activity").waitFor();
        const assertFits = async () => {
          // New catalog/settings controls precede the activity on mobile. Keep
          // the compact activity/feedback fit intent after natural page scrolling,
          // rather than incorrectly requiring the entire controls+round above fold.
          if (viewport.width < 600) await page.locator(".interactive-drill__activity").scrollIntoViewIfNeeded();
          const metrics = await page.evaluate(() => ({
            bottom: document.querySelector(".interactive-drill__activity")!.getBoundingClientRect().bottom,
            activityHeight: document.querySelector(".interactive-drill__activity")!.getBoundingClientRect().height,
            width: document.documentElement.scrollWidth,
            text: getComputedStyle(document.querySelector(".interactive-drill__content h2")!).color,
            targets: [...document.querySelectorAll(".course-interactive button, .course-interactive summary, .course-interactive nav a")].map(el => el.getBoundingClientRect().height),
          }));
          expect(viewport.width < 600 ? metrics.activityHeight : metrics.bottom, JSON.stringify(await page.locator(".interactive-drill__round > *").evaluateAll(els => els.map(el => ({ tag: el.tagName, text: el.textContent?.slice(0, 30), h: el.getBoundingClientRect().height, mt: getComputedStyle(el).marginTop, mb: getComputedStyle(el).marginBottom }))))).toBeLessThanOrEqual(viewport.height);
          expect(metrics.width).toBeLessThanOrEqual(viewport.width);
          expect(metrics.text).toBe("rgb(0, 0, 0)");
          expect(metrics.targets.every(height => height >= 44)).toBe(true);
        };
        for (const name of ["Rapid Swipe", "Speed-Match", "Odd-One-Out", "Cause Effect", "Tap-the-Flaw", "Before/After"]) {
          await page.getByRole("navigation", { name: "Choose a practice mode" }).getByRole("button", { name: new RegExp(`^${name}`) }).click();
          await page.locator(".interactive-drill__activity").waitFor();
          await assertFits();
          if (name === "Speed-Match") {
            for (const n of [1, 2, 3]) {
              await page.getByRole("button", { name: `Synthetic item ${n}`, exact: true }).click();
              await page.getByRole("button", { name: `Synthetic partner ${n}`, exact: true }).click();
            }
          } else await page.getByRole("button", { name: name === "Rapid Swipe" ? "Yes" : name === "Before/After" ? "Synthetic stage Alpha" : "Synthetic first choice", exact: true }).click();
          await page.locator(".interactive-drill__feedback").waitFor();
          await assertFits();
          expect(await page.locator(".interactive-drill__feedback").evaluate(el => getComputedStyle(el).color)).toBe("rgb(0, 0, 0)");
        }
        await page.getByRole("navigation", { name: "Choose a practice mode" }).getByRole("button", { name: /^Rapid Swipe/ }).click();
        await page.locator(".interactive-drill__activity").waitFor();
        await page.getByRole("button", { name: "Start 30-second round" }).click();
        await assertFits();
        await page.getByRole("button", { name: "Yes", exact: true }).click();
        await page.locator(".interactive-drill__feedback").waitFor();
        await assertFits();
        await page.locator("summary").click();
        expect(await page.getByText("Exam practice, not operating instructions or regulatory advice.").isVisible()).toBe(true);
        await page.evaluate(() => {
          const prompt = document.querySelector(".interactive-drill__content h2")!;
          prompt.textContent = "Synthetic long content for natural scrolling. ".repeat(100);
        });
        expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(viewport.height);
        expect(await page.locator(".interactive-drill__activity").evaluate(el => getComputedStyle(el).overflowY)).toBe("visible");
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
        // The real brand asset is intentionally blocked; there are no data requests.
        expect(requests.every(url => url.endsWith("/echelon-logo.webp"))).toBe(true);
      } finally { await page.close(); }
    }, 20000);
  });
}
