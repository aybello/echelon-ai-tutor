import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";

let browser: Browser;
let script: string;

type SetupOptions = {
  scope?: { identity: string; courseKey: string } | null;
  query?: { data?: { questionId: number }[]; isLoading?: boolean; isFetching?: boolean; isError?: boolean; isSuccess?: boolean };
};

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
        import QuizShell from './client/src/components/QuizShell';
        const questions = [
          {id: 17, question: 'Saved synthetic question', options: ['A','B'], correctAnswer: 0, explanation: 'Synthetic explanation'},
          {id: 29, question: 'Unsaved synthetic question', options: ['A','B'], correctAnswer: 0, explanation: 'Synthetic explanation'},
          {id: 31, question: 'Another saved synthetic question', options: ['A','B'], correctAnswer: 0, explanation: 'Synthetic explanation'},
        ];
        function App() {
          const [index, setIndex] = useState(0);
          const [course, setCourse] = useState('audit-course');
          window.showQuestion = id => setIndex(questions.findIndex(question => question.id === id));
          window.showCourse = value => setCourse(value);
          return <QuizShell currentPath={'/' + course} courseLabel="Audit" courseTitle="Practice" history={[{questionId:17},{questionId:29}]}
            correctCount={2} wrongCount={0} selectedModule={null} onModuleChange={()=>{}} calcOnly={false} onCalcOnlyToggle={()=>{}}
            current={questions[index]} selected={0} confidence={50} confirmed={true} showSteps={false} tutorOpen={false}
            onSelect={()=>{}} onConfirm={()=>{}} onNext={()=>setIndex(1)} onGoBack={()=>setIndex(0)} onConfidenceChange={()=>{}}
            onToggleSteps={()=>{}} onTutorOpen={()=>{}} onTutorClose={()=>{}} onResetSession={()=>{}} examType={course} />;
        }
        createRoot(document.getElementById('root')).render(<App/>);
      `,
    },
    loader: { ".css": "empty" },
    plugins: [{
      name: "isolated-quiz-shell",
      setup(builder) {
        builder.onResolve({ filter: /^sonner$|^wouter$|^@\/components\/|^@\/lib\/|^@shared\// }, args => ({ path: args.path, namespace: "mock" }));
        builder.onLoad({ filter: /.*/, namespace: "mock" }, args => {
          if (args.path === "sonner") return { contents: `
            window.toasts=[];
            export const toast=Object.assign(message=>window.toasts.push(message), {error(message){window.toasts.push(message)},warning(message){window.toasts.push(message)}});
          ` };
          if (args.path === "wouter") return { contents: "export const useSearch=()=>location.search;export const Link=({children})=>children;" };
          if (args.path === "@/components/PracticeSaveStatus") return { contents: `
            import {useSyncExternalStore} from 'react';
            const subscribe=fn=>{window.auditListeners.add(fn);return()=>window.auditListeners.delete(fn)};
            export const useVerifiedPracticeSaveScope=()=>useSyncExternalStore(subscribe,()=>window.auditState.scope);
            export default function PracticeSaveStatus(){return null}
          `, resolveDir: process.cwd() };
          if (args.path === "@/lib/trpc") return { contents: `
            import {useSyncExternalStore} from 'react';
            window.auditListeners=new Set();
            window.auditState={scope:window.auditConfig.scope,query:window.auditConfig.query};
            window.invalidations=[]; window.mutations=[]; window.queryCalls=[];
            const notify=()=>window.auditListeners.forEach(fn=>fn());
            window.setAuditState=patch=>{window.auditState={...window.auditState,...patch};notify()};
            window.resolveMutation=(index,data)=>window.mutations[index].resolve(data);
            const subscribe=fn=>{window.auditListeners.add(fn);return()=>window.auditListeners.delete(fn)};
            const useAuditState=()=>useSyncExternalStore(subscribe,()=>window.auditState);
            export const trpc={useUtils:()=>({dashboard:{bookmarkedQuestions:{invalidate:async input=>{window.invalidations.push(input)}}}}),dashboard:{
              bookmarkedQuestions:{useQuery:(input,options)=>{const state=useAuditState();window.queryCalls.push({input,options});return state.query}},
              toggleBookmark:{useMutation:options=>({isPending:false,mutate:input=>{const context=options.onMutate?.(input);let resolve;const promise=new Promise(r=>resolve=r);window.mutations.push({input,resolve});promise.then(data=>options.onSuccess(data,input,context));}})}
            }};
          `, resolveDir: process.cwd() };
          return { contents: `export default function Stub(){return null}; export const TutorPanelPlacement={Provider:({children})=>children}; export const readUSStudyContext=()=>({isUS:false}); export const withUSStudyContext=x=>x; export const resolveCourseKey=value=>value?{courseKey:value,examFamily:'western'}:null; export const resolveStudyNotesTopics=()=>({initialTopic:null}); export const shouldShowReviewPrompt=()=>false; export const GOOGLE_REVIEW_URL=''; export const markReviewPromptShown=()=>{}; export const markAsReviewed=()=>{}; export const getPracticeGuidePath=()=>null; export const class1OptionOrder=(_e,_i,n)=>Array.from({length:n},(_,i)=>i); export const class1DisplayLetter=()=> 'A';` };
        });
      },
    }],
    alias: { "@": `${process.cwd()}/client/src`, "@shared": `${process.cwd()}/shared` },
  });
  script = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);

afterAll(async () => { await browser?.close(); });

async function setup(options: SetupOptions = {}) {
  const page = await browser.newPage();
  await page.route("**/*", route => route.request().url() === "https://practice.echelon.test/"
    ? route.fulfill({ contentType: "text/html", body: '<div id="root"></div>' })
    : route.abort("blockedbyclient"));
  await page.goto("https://practice.echelon.test/");
  await page.evaluate(config => { (window as any).auditConfig = config; }, {
    scope: options.scope === undefined ? { identity: "user:7", courseKey: "audit-course" } : options.scope,
    query: options.query ?? { data: [{ questionId: 17 }, { questionId: 31 }], isLoading: false, isFetching: false, isError: false, isSuccess: true },
  });
  await page.addScriptTag({ content: script });
  await page.getByText("Saved synthetic question").waitFor();
  return page;
}

function bookmarkButton(page: Page) {
  return page.getByRole("button", { name: /bookmark/i }).last();
}

async function expectBookmarkText(page: Page, text: string) {
  await expect.poll(async () => bookmarkButton(page).textContent()).toBe(text);
}

describe("QuizShell saved bookmark state in an isolated browser", () => {
  it("renders the durable bookmark for each displayed question", async () => {
    const page = await setup();
    try {
      await expectBookmarkText(page, "🔖 Bookmarked");
      await page.evaluate(() => (window as any).showQuestion(29));
      await expectBookmarkText(page, "📑 Bookmark");
      await page.evaluate(() => (window as any).showQuestion(17));
      await expectBookmarkText(page, "🔖 Bookmarked");
    } finally { await page.close(); }
  });

  it("cannot mutate while the durable bookmark read is pending", async () => {
    const page = await setup({ query: { isLoading: true, isFetching: true, isError: false, isSuccess: false } });
    try {
      await expectBookmarkText(page, "Loading bookmark…");
      await expect(bookmarkButton(page).isDisabled()).resolves.toBe(true);
      await bookmarkButton(page).click({ force: true });
      expect(await page.evaluate(() => (window as any).mutations.length)).toBe(0);
    } finally { await page.close(); }
  });

  it("shows an unavailable disabled control after a failed read", async () => {
    const page = await setup({ query: { isLoading: false, isFetching: false, isError: true, isSuccess: false } });
    try {
      await expectBookmarkText(page, "Bookmark unavailable");
      await expect(bookmarkButton(page).isDisabled()).resolves.toBe(true);
      await bookmarkButton(page).click({ force: true });
      expect(await page.evaluate(() => (window as any).mutations.length)).toBe(0);
    } finally { await page.close(); }
  });

  it("does not enable the bookmark query or toggle without a verified scope", async () => {
    const page = await setup({ scope: null });
    try {
      await expectBookmarkText(page, "Bookmark unavailable");
      await expect(bookmarkButton(page).isDisabled()).resolves.toBe(true);
      expect(await page.evaluate(() => (window as any).queryCalls.at(-1).options.enabled)).toBe(false);
    } finally { await page.close(); }
  });

  it("does not apply a delayed mutation response after a question and course switch", async () => {
    const page = await setup();
    try {
      await bookmarkButton(page).click();
      expect(await page.evaluate(() => (window as any).mutations[0].input)).toEqual({ bankKey: "audit-course", questionId: 17, bookmarked: false });
      await page.evaluate(() => {
        (window as any).showQuestion(31);
        (window as any).showCourse("other-course");
        (window as any).setAuditState({ scope: { identity: "email:other@example.test", courseKey: "other-course" } });
      });
      await expectBookmarkText(page, "🔖 Bookmarked");
      await page.evaluate(() => (window as any).resolveMutation(0, { ok: true, bookmarked: false }));
      await expectBookmarkText(page, "🔖 Bookmarked");
      expect(await page.evaluate(() => (window as any).invalidations)).toEqual([{ examType: "audit-course" }]);
      expect(await page.evaluate(() => (window as any).toasts)).toEqual([]);
    } finally { await page.close(); }
  });

  it("does not present success when a bookmark mutation returns ok false", async () => {
    const page = await setup();
    try {
      await bookmarkButton(page).click();
      await page.evaluate(() => (window as any).resolveMutation(0, { ok: false, bookmarked: false }));
      await expectBookmarkText(page, "🔖 Bookmarked");
      expect(await page.evaluate(() => (window as any).invalidations)).toEqual([]);
      expect(await page.evaluate(() => (window as any).toasts)).toEqual(["Could not save bookmark — please try again."]);
    } finally { await page.close(); }
  });
});
