import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { build } from "esbuild";

let browser: Browser;
let script: string;
const contexts: BrowserContext[] = [];

type DiagnosticResult = {
  score: number;
  label: string;
  weakTopics: string[];
  strongTopics: string[];
  topicBreakdown?: Record<string, { correct: number; total: number; accuracy: number }>;
  calibrationNote: string;
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
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import Activation from './client/src/pages/LearnerActivation';
        createRoot(document.getElementById('root')).render(<Activation />);
      `,
    },
    plugins: [{
      name: "isolated-diagnostic-topic-evidence",
      setup(builder) {
        builder.onResolve({ filter: /^@\/lib\/trpc$|^@\/_core\/hooks\/useAuth$|^@\/components\/SiteNav$|^@\/hooks\/usePageMeta$|^wouter$|^sonner$/ }, args => ({ path: args.path, namespace: "mock" }));
        builder.onLoad({ filter: /.*/, namespace: "mock" }, args => {
          const contents: Record<string, string> = {
            "wouter": `import React from 'react'; export const useRoute = () => [true, {courseKey:'oit'}]; export const Link = props => React.createElement('a', props);`,
            "sonner": "export const toast = {error() {}};",
            "@/components/SiteNav": "export default function Nav() {return null;}",
            "@/hooks/usePageMeta": "export function usePageMeta() {}",
            "@/_core/hooks/useAuth": "export const useAuth = () => ({user:{id:17,email:'learner@echelon.test'}, isAuthenticated:true, loading:false});",
            "@/lib/trpc": `
              const diagnostic = globalThis.__DIAGNOSTIC_RESULT__;
              const status = {status:'completed', profile:{sessionMinutes:25,weeklyQuestionGoal:39,studyDaysPerWeek:3}, diagnostic, course:{displayName:'Synthetic OIT',quizPath:'/quiz'}};
              const idleMutation = () => ({isPending:false,mutate(){throw Error('Unexpected mutation in isolated result fixture');}});
              export const trpc = {
                dashboardAuth:{me:{useQuery:()=>({data:null,isLoading:false})}},
                activation:{
                  status:{useQuery:()=>({data:status,isLoading:false,refetch(){}})},
                  diagnosticQuestions:{useQuery:()=>({data:null,isLoading:false})},
                  saveProfile:{useMutation:idleMutation},submitDiagnostic:{useMutation:idleMutation}
                }
              };
            `,
          };
          return { contents: contents[args.path], loader: "js", resolveDir: process.cwd() };
        });
      },
    }],
    alias: { "@": `${process.cwd()}/client/src`, "@shared": `${process.cwd()}/shared` },
  });
  script = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);

afterAll(async () => {
  await Promise.all(contexts.map(context => context.close()));
  await browser?.close();
});

async function openResult(diagnostic: DiagnosticResult): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  contexts.push(context);
  await context.route("**/*", route => route.request().url() === "https://diagnostic.invalid/activate/oit"
    ? route.fulfill({ contentType: "text/html", body: '<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>' })
    : route.abort("blockedbyclient"));
  await context.addInitScript(value => { (globalThis as typeof globalThis & { __DIAGNOSTIC_RESULT__: DiagnosticResult }).__DIAGNOSTIC_RESULT__ = value; }, diagnostic);
  const page = await context.newPage();
  page.setDefaultTimeout(3000);
  page.on("pageerror", error => console.error("diagnostic result fixture browser error:", error.message));
  await page.goto("https://diagnostic.invalid/activate/oit");
  await page.addScriptTag({ content: script });
  await page.getByRole("heading", { name: diagnostic.label, exact: true }).waitFor();
  return page;
}

const baseResult = {
  score: 50,
  label: "Building foundations",
  calibrationNote: "Starting baseline only — not an official exam score or a prediction of passing.",
};

describe("diagnostic topic evidence labels", () => {
  it("shows answered counts as early signals and omits invented counts for legacy results", async () => {
    const single = await openResult({
      ...baseResult,
      weakTopics: ["Hydraulics"],
      strongTopics: ["Safety"],
      topicBreakdown: {
        Hydraulics: { correct: 0, total: 1, accuracy: 0 },
        Safety: { correct: 1, total: 1, accuracy: 1 },
      },
    });
    await single.getByText("Hydraulics · 0/1 correct", { exact: true }).waitFor();
    await single.getByText("Safety · 1/1 correct", { exact: true }).waitFor();
    await single.getByText(/early signals from a short diagnostic.*not confirmed mastery/i).waitFor();

    const multiple = await openResult({
      ...baseResult,
      weakTopics: ["Math"],
      strongTopics: ["Regulations"],
      topicBreakdown: {
        Math: { correct: 1, total: 3, accuracy: 1 / 3 },
        Regulations: { correct: 4, total: 5, accuracy: 0.8 },
      },
    });
    await multiple.getByText("Math · 1/3 correct", { exact: true }).waitFor();
    await multiple.getByText("Regulations · 4/5 correct", { exact: true }).waitFor();

    const legacy = await openResult({
      ...baseResult,
      weakTopics: ["Disinfection"],
      strongTopics: ["Operations"],
    });
    await legacy.getByText("Disinfection", { exact: true }).waitFor();
    await legacy.getByText("Operations", { exact: true }).waitFor();
    expect(await legacy.getByText(/0\/0 correct/).count()).toBe(0);
  }, 20000);
});
