import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { build } from "esbuild";

let browser: Browser;
let script: string;
const contexts: BrowserContext[] = [];
const draftKey = 'echelon:diagnostic-draft:v2:["user:17","oit"]';
const originalSessionId = "550e8400-e29b-41d4-a716-446655440000";
const original = {
  version: 1, scope: { identity: "user:17", courseKey: "oit" }, sessionId: originalSessionId,
  questionIds: Array.from({ length: 15 }, (_, index) => index + 1),
  answers: { 1: 0 }, questionIndex: 0, updatedAt: 1,
};

beforeAll(async () => {
  const result = await build({
    bundle: true, write: false, format: "iife", jsx: "automatic",
    stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import Activation from './client/src/pages/LearnerActivation';
      createRoot(document.getElementById('root')).render(<Activation />);
    ` },
    plugins: [{ name: "isolated-diagnostic", setup(builder) {
      builder.onResolve({ filter: /^@\/lib\/trpc$|^@\/_core\/hooks\/useAuth$|^@\/components\/SiteNav$|^@\/hooks\/usePageMeta$|^wouter$|^sonner$/ }, args => ({ path: args.path, namespace: "mock" }));
      builder.onLoad({ filter: /.*/, namespace: "mock" }, args => {
        const contents: Record<string, string> = {
          "wouter": `import React from 'react'; export const useRoute = () => [true, {courseKey:'oit'}]; export const Link = props => React.createElement('a', props);`,
          "sonner": "export const toast = {error() {}};",
          "@/components/SiteNav": "export default function Nav() {return null;}",
          "@/hooks/usePageMeta": "export function usePageMeta() {}",
          "@/_core/hooks/useAuth": "export const useAuth = () => ({user:{id:17,email:'learner@echelon.test'}, isAuthenticated:true, loading:false});",
          "@/lib/trpc": `
            const status = {status:'diagnostic_started', profile:null, diagnostic:null, course:{displayName:'Synthetic OIT',quizPath:'/quiz'}};
            const questions = {questions:Array.from({length:15},(_,i)=>({id:i+1,module:'Safety',question:'Synthetic question '+(i+1),options:['Option A','Option B','Option C','Option D']}))};
            const idleMutation = () => ({isPending:false,mutate(){throw Error('Unexpected mutation in isolated diagnostic fixture');}});
            export const trpc = {
              dashboardAuth:{me:{useQuery:()=>({data:null,isLoading:false})}},
              activation:{
                status:{useQuery:()=>({data:status,isLoading:false,refetch(){}})},
                diagnosticQuestions:{useQuery:()=>({data:questions,isLoading:false})},
                saveProfile:{useMutation:idleMutation},submitDiagnostic:{useMutation:idleMutation}
              }
            };
          `,
        };
        return { contents: contents[args.path], loader: "js", resolveDir: process.cwd() };
      });
    } }],
    alias: { "@": `${process.cwd()}/client/src`, "@shared": `${process.cwd()}/shared` },
  });
  script = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);

afterAll(async () => {
  await Promise.all(contexts.map(context => context.close()));
  await browser?.close();
});

async function open(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  page.setDefaultTimeout(3000);
  page.on("pageerror", error => console.error("diagnostic fixture browser error:", error.message));
  await page.goto("https://diagnostic.invalid/activate/oit");
  await page.addScriptTag({ content: script });
  await page.getByRole("heading", { name: "Question 1 of 15", exact: true }).waitFor();
  return page;
}

describe("diagnostic draft recovery in isolated same-origin mobile tabs", () => {
  it("preserves the restarted diagnostic when an older tab continues answering", async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    contexts.push(context);
    await context.route("**/*", route => route.request().url() === "https://diagnostic.invalid/activate/oit"
      ? route.fulfill({ contentType: "text/html", body: '<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>' })
      : route.abort("blockedbyclient"));
    const seed = await context.newPage();
    await seed.goto("https://diagnostic.invalid/activate/oit");
    await seed.evaluate(({ key, draft }) => localStorage.setItem(key, JSON.stringify(draft)), { key: draftKey, draft: original });
    await seed.close();
    const active = await open(context);
    const stale = await open(context);
    await active.getByRole("button", { name: "Restart diagnostic", exact: true }).click();
    await active.getByRole("button", { name: /Option A/ }).click();
    await active.getByRole("button", { name: "Next", exact: true }).click();
    await active.getByRole("heading", { name: "Question 2 of 15", exact: true }).waitFor();
    await active.getByRole("button", { name: /Option B/ }).click();
    const restarted = await active.evaluate(key => JSON.parse(localStorage.getItem(key)!), draftKey);
    expect(restarted.sessionId).not.toBe(originalSessionId);
    expect(restarted.answers).toEqual({ 1: 0, 2: 1 });
    await stale.getByRole("button", { name: /Option C/ }).click();
    await expect.poll(() => active.evaluate(key => JSON.parse(localStorage.getItem(key)!), draftKey)).toEqual(restarted);
    await stale.getByText(/Unfinished answers could not be saved|Browser storage is unavailable/).waitFor();
    await active.reload();
    await active.addScriptTag({ content: script });
    await active.getByRole("heading", { name: "Question 2 of 15", exact: true }).waitFor();
    expect(await active.evaluate(key => JSON.parse(localStorage.getItem(key)!), draftKey)).toMatchObject({ sessionId: restarted.sessionId, answers: { 1: 0, 2: 1 }, questionIndex: 1 });
  }, 20000);
});
