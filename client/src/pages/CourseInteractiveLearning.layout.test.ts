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
        "@/lib/trpc": `import {useMutation,useQuery} from '@tanstack/react-query';
          import {getQueryKey} from '@trpc/react-query';
          // Classic-only fixtures explicitly opt out of supplemental tracking.
          Object.defineProperty(window.navigator,"doNotTrack",{configurable:true,value:"1"});
          const p=path=>({_def:()=>({path})});
          const anonymousIdentity=path=>{const endpoint=p(path);endpoint.useQuery=(input,options)=>useQuery({...options,queryKey:getQueryKey(endpoint,input,'query'),queryFn:async()=>null});return endpoint;};
          const unavailableActivity={useMutation:options=>useMutation({...options,mutationFn:async()=>({tracking:false})})};
          export const trpc={assessmentActivity:{record:unavailableActivity,resume:unavailableActivity},useUtils:()=>({client:{
            deepGames:{getCatalog:{mutate:async({courseKey})=>({courseKey,available:true,version:'synthetic-deep',modes:[['calculation-ladder','Calculation Ladder',3],['build-process','Build the Process',4],['find-calculation-error','Find the Calculation Error',5],['evidence-detective','Evidence Detective',6],['exam-escape-room','Exam Escape Room',2]].map(([mode,title,count])=>({mode,title,count})),authoredTaskCount:18,missionCount:2})},startSession:{mutate:()=>new Promise(()=>{})}},
            interactive:{getProgress:{mutate:async()=>({stored:false,today:{answered:0,correct:0,goal:20},streakDays:0,dueCount:0,modes:[]})},getCatalog:{mutate:async()=>({courseKey:"oit",available:true,locked:false,version:"synthetic-layout",modes:window.__content.examples.map(example=>({mode:example.mode,totalCount:1,topics:[],difficulties:[]}))})},startSession:{mutate:async input=>({courseKey:"oit",available:true,locked:false,version:"synthetic-layout",sessionId:"synthetic-layout-session",mode:input.mode,totalAvailableCount:1,examples:window.__content.examples.filter(example=>example.mode===input.mode),filters:{topicId:null,difficulty:null,requestedSize:input.sessionSize}})}}}}),auth:{me:anonymousIdentity(['auth','me'])},dashboardAuth:{me:anonymousIdentity(['dashboardAuth','me'])},stripe:{checkAccess:p(['stripe','checkAccess'])},access:{auditMyEntitlements:p(['access','auditMyEntitlements'])}};`,
      }[args.path]! }));
    } }],
  });
  script = result.outputFiles[0].text;
  css = (await Promise.all(["client/src/pages/InteractiveLearning.css", "client/src/components/InteractiveDrill.css", "client/src/pages/CourseInteractiveLearning.css"].map(path => readFile(path, "utf8")))).join("\n");
  browser = await chromium.launch({ headless: true });
}, 30000);
afterAll(async () => { await browser?.close(); });

for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 900 }, { width: 600, height: 844 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
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
        const chooser = page.locator(".course-interactive__chooser");
        const summary = chooser.locator("summary");
        const nav = page.getByRole("navigation", { name: "Choose a practice mode" });
        const mobile = viewport.width < 700;
        expect(await chooser.evaluate(el => (el as HTMLDetailsElement).open)).toBe(!mobile);
        // Initial game is reachable without traversing the full mode inventory.
        expect(await page.locator(".interactive-drill__activity").evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(mobile ? 360 : 320);
        if (mobile) {
          expect(await nav.count()).toBe(0);
          await summary.focus();
          await page.keyboard.press("Enter");
        }
        await nav.getByRole("button", { name: /^Exam Escape Room/ }).waitFor();
        expect(await nav.getByRole("button").count()).toBe(11);
        for (const group of ["Quick practice", "Build understanding", "Challenge"]) expect(await nav.getByRole("group", { name: group, exact: true }).count()).toBe(1);
        expect(await nav.locator("button > svg.course-interactive__mode-icon").count()).toBe(11);
        expect(await nav.getByRole("button").evaluateAll(buttons => buttons.every(button => button.getBoundingClientRect().height >= 44))).toBe(true);
        expect(await nav.getByRole("button", { name: /^Calculation Ladder/ }).textContent()).toContain("3 published");
        expect(await nav.getByRole("button", { name: /^Exam Escape Room/ }).textContent()).toContain("2 published missions");
        expect(await nav.getByRole("button", { name: /^Rapid Swipe/ }).getAttribute("aria-current")).toBe("true");
        expect(await nav.getByRole("button", { name: /^Rapid Swipe/ }).locator(".course-interactive__count").evaluate(el => getComputedStyle(el).color)).toBe("rgb(0, 0, 0)");
        const chooserMetrics = await nav.evaluate(el => ({ height: el.getBoundingClientRect().height, scrollHeight: el.scrollHeight, overflow: getComputedStyle(el).overflowY }));
        expect(chooserMetrics.height).toBeLessThanOrEqual(mobile ? viewport.height * 0.64 + 1 : Math.min(760, viewport.height - 116));
        expect(chooserMetrics.overflow).toBe("auto");
        expect(chooserMetrics.scrollHeight).toBeGreaterThan(chooserMetrics.height);
        await summary.focus();
        await page.keyboard.press("Space");
        expect(await nav.count()).toBe(0);
        await page.keyboard.press("Enter");
        // Tab order enters the published mode buttons, not a hidden inventory.
        await page.keyboard.press("Tab");
        expect(await nav.getByRole("button", { name: /^Rapid Swipe/ }).evaluate(el => el === document.activeElement)).toBe(true);
        if (mobile) await summary.click();
        const chooseMode = async (name: string) => {
          if (!(await chooser.evaluate(el => (el as HTMLDetailsElement).open))) await summary.click();
          await nav.getByRole("button", { name: new RegExp(`^${name}`) }).click();
          if (mobile) {
            expect(await chooser.evaluate(el => (el as HTMLDetailsElement).open)).toBe(false);
            expect(await summary.evaluate(el => el === document.activeElement)).toBe(true);
            expect(await summary.textContent()).toContain(name);
            expect(await nav.count()).toBe(0);
          } else expect(await nav.getByRole("button", { name: new RegExp(`^${name}`) }).getAttribute("aria-current")).toBe("true");
        };
        // Supplemental modes participate in the same chooser. This fixture holds
        // their delivery pending; gameplay remains covered by deep-game tests.
        await chooseMode("Evidence Detective");
        expect(await page.locator(".course-interactive__session-heading").textContent()).toContain("Evidence Detective");
        await page.getByText("Loading your practice round…", { exact: true }).waitFor();
        await chooseMode("Rapid Swipe");
        await page.locator(".interactive-drill__activity").waitFor();
        const settings = page.locator(".course-interactive__settings-panel");
        expect(await settings.evaluate(el => (el as HTMLDetailsElement).open)).toBe(viewport.width >= 700);
        if (viewport.width < 700) await settings.locator("summary").click();
        expect(await page.getByLabel("Session size", { exact: true }).isVisible()).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
        if (viewport.width < 700) await settings.locator("summary").click();
        const assertFits = async () => {
          // Feedback may need natural scrolling on short phones; the initial
          // activity position is separately asserted above without scrolling.
          if (viewport.width < 600) await page.locator(".interactive-drill__activity").scrollIntoViewIfNeeded();
          const metrics = await page.evaluate(() => ({
            bottom: document.querySelector(".interactive-drill__activity")!.getBoundingClientRect().bottom,
            activityHeight: document.querySelector(".interactive-drill__activity")!.getBoundingClientRect().height,
            width: document.documentElement.scrollWidth,
            text: getComputedStyle(document.querySelector(".interactive-drill__content h2")!).color,
            targets: [...document.querySelectorAll(".course-interactive button, .course-interactive summary, .course-interactive nav a")].filter(el => el.checkVisibility()).map(el => el.getBoundingClientRect().height),
          }));
          expect(viewport.width < 600 ? metrics.activityHeight : metrics.bottom, JSON.stringify(await page.locator(".interactive-drill__round > *").evaluateAll(els => els.map(el => ({ tag: el.tagName, text: el.textContent?.slice(0, 30), h: el.getBoundingClientRect().height, mt: getComputedStyle(el).marginTop, mb: getComputedStyle(el).marginBottom }))))).toBeLessThanOrEqual(viewport.height);
          expect(metrics.width).toBeLessThanOrEqual(viewport.width);
          expect(metrics.text).toBe("rgb(0, 0, 0)");
          expect(metrics.targets.every(height => height >= 44)).toBe(true);
        };
        for (const name of ["Rapid Swipe", "Speed-Match", "Odd-One-Out", "Cause Effect", "Tap-the-Flaw", "Before/After"]) {
          await chooseMode(name);
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
        await chooseMode("Rapid Swipe");
        await page.locator(".interactive-drill__activity").waitFor();
        await page.getByRole("button", { name: "Start 30-second round" }).click();
        await assertFits();
        await page.getByRole("button", { name: "Yes", exact: true }).click();
        await page.locator(".interactive-drill__feedback").waitFor();
        await assertFits();
        await page.locator(".course-interactive__details > summary").click();
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
