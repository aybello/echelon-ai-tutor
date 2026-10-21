import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";

let browser: Browser;
let script: string;
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
      import React, { useEffect } from 'react';
      import { createRoot } from 'react-dom/client';
      import { useQuizSession } from './client/src/hooks/useQuizSession';
      Math.random=()=>0;
      window.bank = Array.from({length:15}, (_,i)=>({id:i+1,module:i<4?'Safety':'Pumps',topic:i%2?'Topic B':'Topic A',difficulty:'medium',question:'Synthetic '+(i+1),options:['A','B','C','D'],correctIndex:2,explanation:'Synthetic explanation',isCalc:i%2===0}));
      window.attempts=[]; window.requests=[];
      window.timedCallbackCount=0;
      const nativeSetTimeout=window.setTimeout.bind(window);
      window.setTimeout=(callback,delay,...args)=>nativeSetTimeout(()=>{if(delay===800)window.timedCallbackCount++;callback(...args)},delay);
      function App(){
        const session=useQuizSession({examType:window.course,allQuestions:window.free?window.bank:[],freeCourse:window.free});
        window.session=session;
        useEffect(()=>{if(window.free&&!session.initialized)session.initialize()},[session.initialized]);
        return <pre id="state">{JSON.stringify({id:session.current?.id,selected:session.selected,confirmed:session.confirmed,history:session.history.map(h=>h.questionId),status:session.questionStatus,module:session.selectedModule,calc:session.calcOnly,mode:session.quizMode})}</pre>;
      }
      const root=createRoot(document.getElementById('root'));
      window.unmount=()=>root.unmount();
      root.render(<App/>);
    `,
    },
    plugins: [
      {
        name: "isolated-practice",
        setup(builder) {
          builder.onResolve(
            {
              filter:
                /^@\/lib\/trpc$|^wouter$|^sonner$|^@\/components\/(QuizGate|QuizModeBar|QuizSettingsDrawer)$|^@\/hooks\/useLearningActivitySession$/,
            },
            args => ({ path: args.path, namespace: "mock" })
          );
          builder.onLoad({ filter: /.*/, namespace: "mock" }, args => {
            const modules: Record<string, string> = {
              wouter: `export const useSearch=()=>location.search;`,
              sonner: `export const toast=Object.assign(()=>{}, {error(){},warning(){}});`,
              "@/components/QuizGate": `export const setTrialUnlocked=()=>{};`,
              "@/components/QuizModeBar": `export const useAttemptLogger=()=>input=>window.attempts.push(input);`,
              "@/components/QuizSettingsDrawer": `export const DEFAULT_QUIZ_SETTINGS={sessionSize:15,difficulty:'all',timedMode:false,timedSeconds:60};`,
              "@/hooks/useLearningActivitySession": `export const useLearningActivitySession=()=>{};`,
              "@/lib/trpc": `
            const query=async input=>{window.requests.push(input);let qs=window.bank.filter(q=>!input.excludeIds.includes(q.id));
              if(input.module)qs=qs.filter(q=>q.module===input.module);if(input.topic)qs=qs.filter(q=>q.topic===input.topic);if(input.calcOnly)qs=qs.filter(q=>q.isCalc);
              if(input.reviewMode==='missed')qs=qs.filter(q=>q.id===2);if(input.reviewMode==='bookmarked')qs=qs.filter(q=>q.id===3);
              return {questions:qs,total:qs.length,locked:window.access?.hasAccess!==true,hasMore:false};};
            const utils={client:{quiz:{getRandomQuestions:{query}}}};
            export const trpc={useUtils:()=>utils,stripe:{checkAccess:{useQuery:()=>({data:window.access})}},
              funnelAnalytics:{track:{useMutation:()=>({mutate(){}})}},quiz:{getMissedQuestions:{useQuery:()=>({data:{total:1,questionIds:[2]},refetch:()=>Promise.resolve()})}},
              dashboard:{bookmarkedQuestions:{useQuery:()=>({data:[{questionId:3}]})},lowConfidenceQuestions:{useQuery:()=>({data:[{questionId:4}]})}}};`,
            };
            return { contents: modules[args.path] };
          });
        },
      },
    ],
    alias: {
      "@": `${process.cwd()}/client/src`,
      "@shared": `${process.cwd()}/shared`,
    },
  });
  script = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);
afterAll(async () => {
  await browser?.close();
});
async function setup(course: string, free = false, search = "", hasAccess = true) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route("**/*", route =>
    route.request().url().startsWith("https://practice.echelon.test/")
      ? route.fulfill({
          contentType: "text/html",
          body: '<div id="root"></div>',
        })
      : route.abort("blockedbyclient")
  );
  await page.goto("https://practice.echelon.test/" + search);
  await page.evaluate(
    ({ course, free, hasAccess }) => {
      Object.assign(window, { course, free, access: { hasAccess } });
      localStorage.setItem(
        "echelon_subscription_email",
        "practice@echelon.test"
      );
    },
    { course, free, hasAccess }
  );
  await page.addScriptTag({ content: script });
  await expect
    .poll(() => page.evaluate(() => (window as any).session.current?.id))
    .toBeTruthy();
  return page;
}
async function action(page: Page, name: string, value?: unknown) {
  await page.evaluate(
    ({ name, value }) => (window as any).session[name](value),
    { name, value }
  );
  // Wait for React's committed render, rather than retaining an earlier callback.
  await page.evaluate(
    () =>
      new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
}
const courses = [
  ["class1-water", false],
  ["wpi-class1-water", false],
  ["us-class1-water", false],
  ["electrician-309a", true],
] as const;
describe.each(courses)("%s timed answer-state lifecycle", (course, free) => {
  it("does not skip the next unanswered question when Next beats timed auto-advance", async () => {
    const page = await setup(course, free);
    try {
      await action(page, "setSelected", 2);
      await action(page, "handleTimeUp");
      await action(page, "handleNext");
      const next = await page.evaluate(
        () => (window as any).session.current.id
      );
      await action(page, "setSelected", 1);
      await page.waitForTimeout(1000);
      expect(
        await page.evaluate(() => (window as any).session.current.id)
      ).toBe(next);
      expect(await page.evaluate(() => (window as any).attempts.length)).toBe(
        1
      );
      expect(await page.evaluate(() => (window as any).session.confirmed)).toBe(
        false
      );
      expect(await page.evaluate(() => (window as any).session.selected)).toBe(
        1
      );
    } finally {
      await page.context().close();
    }
  });
  it("does not advance a freshly reset session from an earlier question's timer", async () => {
    const page = await setup(course, free);
    try {
      await action(page, "handleTimeUp");
      await action(page, "resetSession");
      const fresh = await page.evaluate(
        () => (window as any).session.current.id
      );
      await action(page, "setSelected", 1);
      await page.waitForTimeout(1000);
      expect(
        await page.evaluate(() => (window as any).session.current.id)
      ).toBe(fresh);
      expect(await page.evaluate(() => (window as any).session.selected)).toBe(
        1
      );
      expect(
        await page.evaluate(() => (window as any).session.history)
      ).toHaveLength(0);
    } finally {
      await page.context().close();
    }
  });
  it.each([
    ["module", "handleModuleChange", "Pumps"],
    ["retry mistakes", "handleModeChange", "missed"],
    ["bookmarks", "handleModeChange", "bookmarked"],
    ["calculation-only", "handleCalcOnlyToggle", undefined],
    [
      "settings",
      "handleSettingsApply",
      { sessionSize: 15, difficulty: "all", timedMode: true, timedSeconds: 60 },
    ],
  ])(
    "keeps the fresh %s selection when an old timed answer is pending",
    async (_label, name, value) => {
      const page = await setup(course, free);
      try {
        await action(page, "handleTimeUp");
        await action(page, name as string, value);
        const fresh = await page.evaluate(
          () => (window as any).session.current.id
        );
        await action(page, "setSelected", 1);
        const history = await page.evaluate(() =>
          (window as any).session.history.map((h: any) => h.questionId)
        );
        await page.waitForTimeout(1000);
        expect(
          await page.evaluate(() => (window as any).session.current.id)
        ).toBe(fresh);
        expect(
          await page.evaluate(() => (window as any).session.selected)
        ).toBe(1);
        expect(
          await page.evaluate(() =>
            (window as any).session.history.map((h: any) => h.questionId)
          )
        ).toEqual(history);
        expect(
          await page.evaluate(() => (window as any).attempts)
        ).toHaveLength(1);
      } finally {
        await page.context().close();
      }
    }
  );
  it("stops timed feedback auto-advance when navigating back and preserves saved answers", async () => {
    const page = await setup(course, free);
    try {
      const firstQuestion = await page.evaluate(
        () => (window as any).session.current.id
      );
      await action(page, "setSelected", 1);
      await action(page, "handleConfirm");
      await action(page, "handleNext");
      const timedQuestion = await page.evaluate(
        () => (window as any).session.current.id
      );
      await action(page, "handleTimeUp");
      await action(page, "goBack");
      await page.waitForTimeout(1000);
      expect(
        await page.evaluate(() => (window as any).session.current.id)
      ).toBe(firstQuestion);
      expect(await page.evaluate(() => (window as any).session.selected)).toBe(
        1
      );
      expect(
        await page.evaluate(() => (window as any).session.history)
      ).toHaveLength(2);
      expect(await page.evaluate(() => (window as any).attempts)).toHaveLength(
        2
      );
      await action(page, "handleNext");
      expect(await page.evaluate(() => (window as any).session.current.id)).toBe(
        timedQuestion
      );
      expect(await page.evaluate(() => (window as any).session.confirmed)).toBe(true);
    } finally {
      await page.context().close();
    }
  });
  it("still advances once after normal expiry and logs the latest answer only once", async () => {
    const page = await setup(course, free);
    try {
      const original = await page.evaluate(
        () => (window as any).session.current.id
      );
      await action(page, "setSelected", 2);
      await action(page, "setConfidence", 75);
      await action(page, "handleTimeUp");
      expect(
        await page.evaluate(() => (window as any).session.history[0])
      ).toMatchObject({
        questionId: original,
        selectedOption: 2,
        confidence: 75,
        correct: true,
      });
      await page.waitForTimeout(1000);
      expect(
        await page.evaluate(() => (window as any).session.current.id)
      ).not.toBe(original);
      expect(await page.evaluate(() => (window as any).session.confirmed)).toBe(
        false
      );
      expect(await page.evaluate(() => (window as any).attempts)).toHaveLength(
        1
      );
      const next = await page.evaluate(
        () => (window as any).session.current.id
      );
      await page.waitForTimeout(900);
      expect(
        await page.evaluate(() => (window as any).session.current.id)
      ).toBe(next);
    } finally {
      await page.context().close();
    }
  });
  it("does not request another paged question after the hook unmounts", async () => {
    const page = await setup(course, free);
    try {
      await action(page, "handleTimeUp");
      await page.evaluate(() => (window as any).unmount());
      const requests = await page.evaluate(
        () => (window as any).requests.length
      );
      const current = await page.evaluate(
        () => (window as any).session.current.id
      );
      await page.waitForTimeout(1000);
      expect(await page.evaluate(() => (window as any).requests.length)).toBe(
        requests
      );
      expect(
        await page.evaluate(() => (window as any).session.current.id)
      ).toBe(current);
      expect(await page.evaluate(() => (window as any).attempts)).toHaveLength(
        1
      );
      expect(
        await page.evaluate(() => (window as any).timedCallbackCount)
      ).toBe(0);
    } finally {
      await page.context().close();
    }
  });
});

describe("locked finite-preview navigation", () => {
  it("returns the delivered final preview question after Back instead of showing an empty state", async () => {
    const page = await setup("oit", false, "", false);
    try {
      for (let index = 0; index < 14; index += 1) {
        await action(page, "setSelected", 2);
        await action(page, "handleConfirm");
        await action(page, "handleNext");
        await expect.poll(() => page.evaluate(() => (window as any).session.current?.id)).toBe(index + 2);
      }

      expect(await page.evaluate(() => (window as any).session.history)).toHaveLength(14);
      expect(await page.evaluate(() => (window as any).session.current?.id)).toBe(15);
      expect(await page.evaluate(() => (window as any).session.confirmed)).toBe(false);
      const attemptsBeforeBack = await page.evaluate(() => (window as any).attempts.length);
      const requestsBeforeBack = await page.evaluate(() => (window as any).requests.length);

      await action(page, "goBack");
      expect(await page.evaluate(() => (window as any).session.history)).toHaveLength(14);
      expect(await page.evaluate(() => (window as any).session.current?.id)).toBe(14);

      await action(page, "handleNext");
      await expect.poll(() => page.evaluate(() => (window as any).session.current?.id)).toBe(15);
      expect(await page.evaluate(() => (window as any).session.questionStatus)).not.toBe("empty");
      expect(await page.evaluate(() => (window as any).session.confirmed)).toBe(false);
      expect(await page.evaluate(() => (window as any).session.history)).toHaveLength(14);
      expect(await page.evaluate(() => (window as any).attempts.length)).toBe(attemptsBeforeBack);
      expect(await page.evaluate(() => (window as any).requests.length)).toBe(requestsBeforeBack);

      await action(page, "setSelected", 2);
      await action(page, "handleConfirm");
      expect(await page.evaluate(() => (window as any).session.history)).toHaveLength(15);
      expect(await page.evaluate(() => (window as any).attempts.length)).toBe(attemptsBeforeBack + 1);
      expect(await page.evaluate(() => (window as any).session.trialDone)).toBe(true);
    } finally {
      await page.context().close();
    }
  });
});
