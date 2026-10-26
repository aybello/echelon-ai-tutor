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
          window.showQuestion = id => setIndex(questions.findIndex(question => question.id === id));
          return <QuizShell currentPath="/audit" courseLabel="Audit" courseTitle="Practice" history={[{questionId:17},{questionId:29}]}
            correctCount={2} wrongCount={0} selectedModule={null} onModuleChange={()=>{}} calcOnly={false} onCalcOnlyToggle={()=>{}}
            current={questions[index]} selected={0} confidence={50} confirmed={true} showSteps={false} tutorOpen={false}
            onSelect={()=>{}} onConfirm={()=>{}} onNext={()=>setIndex(1)} onGoBack={()=>setIndex(0)} onConfidenceChange={()=>{}}
            onToggleSteps={()=>{}} onTutorOpen={()=>{}} onTutorClose={()=>{}} onResetSession={()=>{}} examType="audit-course" />;
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
          if (args.path === "sonner") return { contents: "export const toast=Object.assign(()=>{}, {error(){},warning(){}});" };
          if (args.path === "wouter") return { contents: "export const useSearch=()=>location.search;export const Link=({children})=>children;" };
          if (args.path === "@/lib/trpc") return { contents: `
            import {useSyncExternalStore} from 'react';
            const listeners=new Set(); const notify=()=>listeners.forEach(fn=>fn());
            window.bookmarks=[{questionId:17},{questionId:31}]; window.invalidations=[]; window.mutations=[];
            window.resolveMutation=(index,bookmarked)=>window.mutations[index].resolve({bookmarked});
            const useBookmarks=()=>useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn)},()=>window.bookmarks);
            export const trpc={useUtils:()=>({dashboard:{bookmarkedQuestions:{invalidate:async input=>{window.invalidations.push(input);notify()}}}}),dashboard:{
              bookmarkedQuestions:{useQuery:(_input,options)=>{window.queryOptions=options;return {data:useBookmarks()}}},
              toggleBookmark:{useMutation:options=>({isPending:false,mutate:input=>{let resolve;const promise=new Promise(r=>resolve=r);window.mutations.push({input,resolve});promise.then(data=>options.onSuccess(data,input));}})}
            }};
          `, resolveDir: process.cwd() };
          return { contents: `export default function Stub(){return null}; export const TutorPanelPlacement={Provider:({children})=>children}; export const readUSStudyContext=()=>({isUS:false}); export const withUSStudyContext=x=>x; export const resolveCourseKey=()=>null; export const resolveStudyNotesTopics=()=>({initialTopic:null}); export const shouldShowReviewPrompt=()=>false; export const GOOGLE_REVIEW_URL=''; export const markReviewPromptShown=()=>{}; export const markAsReviewed=()=>{}; export const getPracticeGuidePath=()=>null; export const class1OptionOrder=(_e,_i,n)=>Array.from({length:n},(_,i)=>i); export const class1DisplayLetter=()=> 'A';` };
        });
      },
    }],
    alias: { "@": `${process.cwd()}/client/src`, "@shared": `${process.cwd()}/shared` },
  });
  script = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);

afterAll(async () => { await browser?.close(); });

async function setup() {
  const page = await browser.newPage();
  await page.route("**/*", route => route.request().url() === "https://practice.echelon.test/"
    ? route.fulfill({ contentType: "text/html", body: '<div id="root"></div>' })
    : route.abort("blockedbyclient"));
  await page.goto("https://practice.echelon.test/");
  await page.addScriptTag({ content: script });
  await page.getByText("Saved synthetic question").waitFor();
  return page;
}

async function bookmarkButton(page: Page) {
  return page.getByRole("button", { name: /Bookmark/ }).last();
}

async function expectBookmarkText(page: Page, text: string) {
  await expect.poll(async () => (await bookmarkButton(page)).textContent()).toBe(text);
}

describe("QuizShell saved bookmark state in an isolated browser", () => {
  it("hydrates each displayed question and refreshes after a mutation", async () => {
    const page = await setup();
    try {
      await expectBookmarkText(page, "🔖 Bookmarked");
      await page.evaluate(() => (window as any).showQuestion(29));
      await expectBookmarkText(page, "📑 Bookmark");
      await page.evaluate(() => (window as any).showQuestion(17));
      await expectBookmarkText(page, "🔖 Bookmarked");

      await (await bookmarkButton(page)).click();
      expect(await page.evaluate(() => (window as any).mutations[0].input)).toEqual({ bankKey: "audit-course", questionId: 17 });
      await page.evaluate(() => { (window as any).bookmarks=[]; (window as any).resolveMutation(0, false); });
      await expectBookmarkText(page, "📑 Bookmark");
      expect(await page.evaluate(() => (window as any).invalidations)).toEqual([{ examType: "audit-course" }]);
      expect(await page.evaluate(() => (window as any).queryOptions.retry)).toBe(false);
    } finally { await page.close(); }
  });

  it("does not apply a delayed mutation response to a different question", async () => {
    const page = await setup();
    try {
      await (await bookmarkButton(page)).click();
      await page.evaluate(() => (window as any).showQuestion(31));
      await expectBookmarkText(page, "🔖 Bookmarked");
      await page.evaluate(() => (window as any).resolveMutation(0, false));
      await expectBookmarkText(page, "🔖 Bookmarked");
    } finally { await page.close(); }
  });
});
