import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";

let browser: Browser;
let script: string;
const origin = "https://missed.practice.test";

beforeAll(async () => {
  const result = await build({
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    stdin: {
      resolveDir: process.cwd(),
      loader: "tsx",
      contents: `
        import React, { useState } from 'react';
        import { createRoot } from 'react-dom/client';
        import { flushSync } from 'react-dom';
        import { useQuizSession } from './client/src/hooks/useQuizSession';
        Math.random=()=>0;
        window.bank=Array.from({length:120},(_,i)=>({
          id:i+1,module:i<12?'Safety':'Pumps',topic:i%2?'Topic B':'Topic A',
          difficulty:(i+1)%3===0?'hard':'medium',question:'Synthetic '+(i+1),
          options:['A','B','C','D'],correctIndex:2,explanation:'Synthetic explanation',isCalc:(i+1)%2===0
        }));
        window.misses=Array.from({length:window.config.missedTotal},(_,i)=>i+1);
        window.course='oit'; window.actor='fixture:user:101';
        window.requests=[]; window.responses=[]; window.attempts=[]; window.events=[];
        window.action=(name,value)=>flushSync(()=>window.session[name](value));
        window.answer=()=>{window.action('setSelected',2);window.action('handleConfirm')};
        function App(){
          const [,render]=useState(0);
          window.rerender=()=>flushSync(()=>render(v=>v+1));
          const session=useQuizSession({examType:window.course,allQuestions:window.bank});
          window.session=session;
          return <main><span id="badge">{session.missedCount}</span>
            <span id="total">{session.sessionSize}</span></main>;
        }
        createRoot(document.getElementById('root')).render(<App/>);
      `,
    },
    alias: {
      "@": `${process.cwd()}/client/src`,
      "@shared": `${process.cwd()}/shared`,
    },
    plugins: [{
      name: "isolated-missed-review",
      setup(builder) {
        const modules: Record<string, string> = {
          wouter: `const navigate=()=>{};export const useSearch=()=>location.search;export const useLocation=()=>['/',navigate];`,
          sonner: `export const toast=()=>{};`,
          "@/lib/nextStepHref": `export const legacyQuick10Redirect=()=>null;`,
          "@/lib/anonymousAnalytics": `export const getAnonymousAnalyticsId=()=>'synthetic-visitor';`,
          "@/components/QuizGate": `export const setTrialUnlocked=()=>{};`,
          "@/components/QuizSettingsDrawer": `export const DEFAULT_QUIZ_SETTINGS={sessionSize:window.config.sessionSize??15,difficulty:'all',timedMode:false,timedSeconds:60};`,
          "@/components/PracticeSaveStatus": `export const useStablePracticeActorKey=()=>window.actor;`,
          "@/hooks/useAssessmentActivity": `const observeFor=()=>{};const retry=()=>Promise.resolve();export const useAssessmentActivity=()=>({observeFor,retry});`,
          "@/hooks/useLearningActivitySession": `export const useLearningActivitySession=()=>{};`,
          "@/components/QuizModeBar": `
            import {useCallback} from 'react';
            export const useAttemptLogger=(course,mode,scope)=>useCallback(input=>{
              window.attempts.push({...input,course,mode,scope});
              if(input.selectedIndex===2)window.misses=window.misses.filter(id=>id!==input.questionId);
              return Promise.resolve(true);
            },[course,mode,scope]);`,
          "@/lib/trpc": `
            const query=async input=>{
              window.requests.push({...input,excludeIds:[...input.excludeIds]});
              let eligible=window.bank;
              if(!window.config.hasAccess)eligible=eligible.slice(0,15);
              if(input.reviewMode==='missed')eligible=eligible.filter(q=>window.misses.includes(q.id));
              if(input.module)eligible=eligible.filter(q=>q.module===input.module);
              if(input.topic)eligible=eligible.filter(q=>q.topic===input.topic);
              if(input.calcOnly)eligible=eligible.filter(q=>q.isCalc);
              if(input.difficulty!=='all')eligible=eligible.filter(q=>q.difficulty===input.difficulty);
              const questions=eligible.filter(q=>!input.excludeIds.includes(q.id)).slice(0,input.limit)
                .map(q=>({...q,attemptToken:'fixture:'+input.bankKey+':'+q.id}));
              const page={questions,total:eligible.length,locked:!window.config.hasAccess,hasMore:questions.length===input.limit};
              window.responses.push({total:page.total,ids:questions.map(q=>q.id)});
              if(window.holdNext){window.holdNext=false;await new Promise(resolve=>{window.releasePage=resolve})}
              return page;
            };
            const utils={client:{quiz:{getRandomQuestions:{query}}}};
            const analytics={mutate:event=>window.events.push(event)};
            const refetch=()=>Promise.resolve();
            const access={hasAccess:window.config.hasAccess};
            export const trpc={useUtils:()=>utils,
              stripe:{checkAccess:{useQuery:()=>({data:access})}},
              funnelAnalytics:{track:{useMutation:()=>analytics}},
              quiz:{getMissedQuestions:{useQuery:()=>({data:{total:window.config.badgeTotal,questionIds:[1]},refetch})}},
              dashboard:{bookmarkedQuestions:{useQuery:()=>({data:[]})},lowConfidenceQuestions:{useQuery:()=>({data:[]})}}
            };`,
        };
        builder.onResolve({ filter: /^(?:@\/|wouter$|sonner$)/ }, args =>
          args.path in modules ? { path: args.path, namespace: "fixture" } : undefined
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({
          contents: modules[args.path],
          resolveDir: process.cwd(),
        }));
      },
    }],
  });
  script = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30_000);

afterAll(async () => { await browser?.close(); });

type FixtureConfig = {
  mode?: string;
  hasAccess?: boolean;
  missedTotal?: number;
  badgeTotal?: number;
  sessionSize?: number;
};
async function setup(config: FixtureConfig = {}) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  // No application server, auth provider, database, or HTTP fixture endpoints.
  // Every dependency capable of I/O is mocked; abort any accidental request.
  await page.route("**/*", route =>
    route.request().url() === `${origin}/?mode=${config.mode ?? "missed"}`
      ? route.fulfill({ contentType: "text/html", body: '<div id="root"></div>' })
      : route.abort("blockedbyclient")
  );
  await page.goto(`${origin}/?mode=${config.mode ?? "missed"}`);
  await page.evaluate(config => {
    (window as any).config = { hasAccess: true, missedTotal: 49, badgeTotal: 49, ...config };
    window.fetch = () => { throw new Error("Unexpected fixture network request"); };
  }, config);
  await page.addScriptTag({ content: script });
  await ready(page);
  return page;
}
async function ready(page: Page) {
  await page.waitForFunction(() => {
    const s = (window as any).session;
    return s?.current && s.questionStatus === undefined;
  });
}
async function action(page: Page, name: string, value?: unknown) {
  await page.evaluate(({ name, value }) => (window as any).action(name, value), { name, value });
}
async function state(page: Page) {
  return page.evaluate(() => {
    const w = window as any;
    const s = w.session;
    return {
      id: s.current?.id ?? null, total: s.sessionSize, badge: s.missedCount,
      history: s.history.map((h: any) => h.questionId), confirmed: s.confirmed,
      correct: s.correctCount, wrong: s.wrongCount, done: s.trialDone,
      status: s.questionStatus ?? null, requests: w.requests, responses: w.responses,
      attempts: w.attempts, completed: w.events.filter((e: any) => e.event === "quiz_completed"),
    };
  });
}
async function answer(page: Page) {
  await page.evaluate(() => (window as any).answer());
}
async function next(page: Page) {
  const before = (await state(page)).id;
  await action(page, "handleNext");
  await page.waitForFunction(id => {
    const s = (window as any).session;
    return s.current?.id !== id && s.questionStatus !== "loading";
  }, before);
}
const settings = (sessionSize: number, difficulty = "all") => ({
  sessionSize, difficulty, timedMode: false, timedSeconds: 60,
});

describe("authoritative missed-review session total", () => {
  it("reviews all 49 once in bounded pages, keeping 49 as corrections shrink later totals", async () => {
    const page = await setup();
    try {
      expect(await page.locator("#badge").textContent()).toBe("49");
      expect(await page.locator("#total").textContent()).toBe("49");
      const seen: number[] = [];
      for (let count = 1; count <= 49; count++) {
        const before = await state(page);
        seen.push(before.id!);
        expect(before.total).toBe(49);
        await answer(page);
        const confirmed = await state(page);
        expect(confirmed.history).toHaveLength(count);
        expect(confirmed.total).toBe(49);
        // In particular, neither question 15 nor 49 prematurely emits session_limit.
        expect(confirmed.completed).toEqual([]);
        await next(page);
      }
      const final = await state(page);
      expect(final).toMatchObject({ id: null, total: 49, correct: 49, wrong: 0, done: false, status: "empty" });
      expect(seen.sort((a, b) => a - b)).toEqual(Array.from({ length: 49 }, (_, i) => i + 1));
      expect(new Set(final.history).size).toBe(49);
      expect(final.requests).toHaveLength(4);
      expect(final.requests.every((r: any) => r.limit === 15 && r.reviewMode === "missed")).toBe(true);
      expect(final.responses.map((r: any) => r.ids.length)).toEqual([15, 15, 15, 4]);
      expect(final.responses[0].total).toBe(49);
      expect(final.responses.slice(1).every((r: any) => r.total < 49)).toBe(true);
      expect(final.responses.flatMap((r: any) => r.ids).sort((a: number, b: number) => a - b)).toEqual(seen);
      expect(final.completed).toEqual([expect.objectContaining({ questionCount: 49, correctCount: 49, quizMode: "missed", completionReason: "pool_exhausted" })]);
      expect(final.attempts).toHaveLength(49);
      for (const attempt of final.attempts) {
        expect(attempt).toMatchObject({
          attemptToken: `fixture:oit:${attempt.questionId}`, bankKey: "oit", course: "oit", mode: "missed", selectedIndex: 2,
        });
        expect(JSON.parse(attempt.scope).actorKey).toBe("fixture:user:101");
      }
    } finally { await page.context().close(); }
  }, 30_000);

  it("uses the actual eligible pool and each filter, never the badge or the 120-question bank", async () => {
    const page = await setup({ missedTotal: 23, badgeTotal: 49 });
    try {
      expect(await state(page)).toMatchObject({ total: 23, badge: 49 });
      await action(page, "handleModuleChange", "Safety");
      await ready(page);
      expect((await state(page)).total).toBe(12);
      await action(page, "handleCalcOnlyToggle");
      await ready(page);
      expect((await state(page)).total).toBe(6);
      await action(page, "handleSettingsApply", settings(20, "hard"));
      await ready(page);
      expect(await state(page)).toMatchObject({ total: 2, badge: 49 });
      expect((await state(page)).requests.at(-1)).toMatchObject({ limit: 20, module: "Safety", calcOnly: true, difficulty: "hard" });
      await action(page, "handleModuleChange", "Absent module");
      await page.waitForFunction(() => (window as any).session.questionStatus === "empty");
      expect(await state(page)).toMatchObject({ id: null, total: 0, badge: 49 });
    } finally { await page.context().close(); }
  });

  it("refreshes the initial total on restart, mode, actor and course changes", async () => {
    const page = await setup();
    try {
      await answer(page);
      await page.evaluate(() => { (window as any).misses = [7, 8, 9, 10, 11, 12, 13]; });
      await action(page, "resetSession");
      await ready(page);
      expect(await state(page)).toMatchObject({ total: 7, history: [] });
      await action(page, "handleModeChange", "standard");
      await ready(page);
      expect((await state(page)).total).toBe(15);
      await page.evaluate(() => { (window as any).misses = [21, 22, 23]; });
      await action(page, "handleModeChange", "missed");
      await ready(page);
      expect((await state(page)).total).toBe(3);
      await answer(page);
      await page.evaluate(() => {
        Object.assign(window, { misses: [31, 32, 33, 34], actor: "fixture:user:202" });
        (window as any).rerender();
      });
      await ready(page);
      expect(await state(page)).toMatchObject({ total: 4, history: [] });
      await page.evaluate(() => {
        Object.assign(window, { misses: [41, 42], course: "class1-water" });
        (window as any).rerender();
      });
      await ready(page);
      expect((await state(page)).total).toBe(2);
      expect((await state(page)).requests.at(-1).bankKey).toBe("class1-water");
    } finally { await page.context().close(); }
  });

  it("does not display a retired generation's total while loading or accept its late first page", async () => {
    const page = await setup();
    try {
      await page.evaluate(() => { (window as any).holdNext = true; });
      await action(page, "handleModuleChange", "Safety");
      await page.waitForFunction(() => Boolean((window as any).releasePage));
      expect(await state(page)).toMatchObject({ id: null, total: 0, status: "loading" });
      await action(page, "handleModuleChange", "Pumps");
      await ready(page);
      expect((await state(page)).total).toBe(37);
      await page.evaluate(async () => {
        (window as any).releasePage();
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      expect((await state(page)).total).toBe(37);
      await action(page, "handleModuleChange", "Safety");
      await ready(page);
      expect((await state(page)).total).toBe(12);
    } finally { await page.context().close(); }
  });

  it("caps configured request pages at 50 independently of the review total", async () => {
    const page = await setup();
    try {
      await action(page, "handleSettingsApply", settings(80));
      await ready(page);
      expect((await state(page)).total).toBe(49);
      expect((await state(page)).requests.at(-1).limit).toBe(50);
    } finally { await page.context().close(); }
  });
});

describe("existing finite session limits", () => {
  it.each([
    { mode: "standard", hasAccess: true, count: 15, reason: "session_limit" },
    { mode: "standard", hasAccess: false, count: 15, reason: "preview_gate" },
    { mode: "missed", hasAccess: false, count: 15, reason: "preview_gate" },
    { mode: "quick10", hasAccess: true, count: 10, reason: "session_limit" },
  ])("preserves $mode (access=$hasAccess) at $count", async ({ mode, hasAccess, count, reason }) => {
    // An oversized configured size must not enlarge a locked preview.
    const page = await setup({ mode, hasAccess, sessionSize: hasAccess ? 15 : 50 });
    try {
      expect((await state(page)).total).toBe(count);
      for (let index = 0; index < count; index++) {
        await answer(page);
        if (index < count - 1) await next(page);
      }
      await action(page, "handleNext");
      const final = await state(page);
      expect(final.history).toHaveLength(count);
      expect(new Set(final.history).size).toBe(count);
      expect(final.attempts).toHaveLength(count);
      expect(final.correct).toBe(count);
      expect(final.wrong).toBe(0);
      expect(final.total).toBe(count);
      expect(final.done).toBe(!hasAccess);
      if (hasAccess) expect(final.id).toBeNull();
      expect(final.completed).toEqual([expect.objectContaining({ questionCount: count, correctCount: count, completionReason: reason })]);
      if (!hasAccess) expect(final.requests.every((r: any) => r.limit === 15)).toBe(true);
    } finally { await page.context().close(); }
  }, 20_000);
});
