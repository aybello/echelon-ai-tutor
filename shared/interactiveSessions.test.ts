import { describe, expect, it } from "vitest";
import { chromium } from "@playwright/test";
import { build } from "esbuild";
import { interactiveDrillExampleSchema, interactiveSessionResponseSchema, interactiveStartSessionResponseSchema } from "./interactiveSessions";
import { engineExampleSchema } from "../server/interactiveContent/engine/schema";

const named = {
  id: "named", mode: "before-after", prompt: "Which stage comes earlier?",
  instruction: "Choose the earlier stage.", options: ["Screening", "Disinfection"],
  correctAnswer: "  screening  ", explanation: "The answer is Screening: this explanation is shown after grading.",
};
const legacy = { id: "legacy", mode: "before-after", prompt: "Does this stage occur earlier?", correctAnswer: "before", explanation: "Synthetic explanation." };
const matching = {
  id: "matching", mode: "speed-match", prompt: "Connect each pair.",
  pairs: [{ id: "p1", left: "Alpha", right: "One" }, { id: "p2", left: "Beta", right: "Two" }, { id: "p3", left: "Gamma", right: "Three" }],
};
const choice = (mode: string) => ({
  id: "choice", mode, prompt: "Which belongs?", options: [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }],
  correctOptionId: "a", explanation: "Synthetic explanation.",
});
const session = (example: Record<string, unknown>) => ({
  courseKey: "oit", available: true, locked: false, version: "synthetic-v1", sessionId: "synthetic-session",
  mode: example.mode, totalAvailableCount: 1, examples: [example],
  filters: { topicId: null, difficulty: null, requestedSize: 20 },
});
const check = (example: Record<string, unknown>, accepted: boolean) => {
  expect(interactiveDrillExampleSchema.safeParse(example).success).toBe(accepted);
  expect(engineExampleSchema.safeParse(example).success).toBe(accepted);
  expect(interactiveSessionResponseSchema.safeParse(JSON.parse(JSON.stringify(session(example)))).success).toBe(accepted);
  expect(interactiveStartSessionResponseSchema.safeParse(session(example)).success).toBe(accepted);
};

describe("client-safe interactive example semantics", () => {
  it("uses the very same schema in the engine and client wire parser", () => {
    expect(engineExampleSchema).toBe(interactiveDrillExampleSchema);
  });
  it.each([named, legacy, matching, ...["odd-one-out", "cause-effect", "tap-the-flaw"].map(choice),
    { id: "swipe", mode: "rapid-swipe", prompt: "Is this accurate?", correctAnswer: true, explanation: "Yes." },
    { ...named, options: ["ML", "DO"], correctAnswer: " mL ", prompt: "Compare the sample stages." },
    { ...named, options: ["mL", "DO"], correctAnswer: "ML", prompt: "Compare the sample stages." },
    { ...named, options: ["pH", "DO"], correctAnswer: "PH", prompt: "Compare phosphorus in the downstream phase." },
    { ...matching, pairs: matching.pairs.map(p => ({ ...p, right: p.left })) },
  ])("accepts valid renderer-compatible payload %#", example => check(example, true));

  it.each([
    ["missing answer", { ...named, correctAnswer: undefined }],
    ["unknown answer", { ...named, correctAnswer: "Other" }],
    ["missing option", { ...named, options: ["Screening"] }],
    ["extra option", { ...named, options: ["Screening", "Disinfection", "Other"] }],
    ["blank option", { ...named, options: ["Screening", " "] }],
    ["non-string option", { ...named, options: ["Screening", 1] }],
    ["case duplicate", { ...named, options: ["Screening", " SCREENING "] }],
    ["NFKC duplicate", { ...named, options: ["Screening", "Ｓｃｒｅｅｎｉｎｇ"] }],
    ["renderer-incompatible NFKC answer", { ...named, correctAnswer: "Ｓｃｒｅｅｎｉｎｇ" }],
    ["mL NFKC answer trap", { ...named, options: ["mL", "DO"], correctAnswer: "ｍＬ" }],
    ["mL NFKC duplicate trap", { ...named, options: ["mL", "ｍＬ"], correctAnswer: "mL" }],
    ["unexpected key", { ...named, extra: true }],
    ["Argon visible substring", { ...named, options: ["Argon", "Oxygen"], correctAnswer: "Argon", prompt: "Compare argonated samples." }],
    ["long-label raw lowercase expansion", { ...named, options: ["İİ", "DO"], correctAnswer: "İİ", prompt: "Inspect xi̇i̇x samples." }],
    ["long-label NFKC visible leak", { ...named, instruction: "Consider Ｓｃｒｅｅｎｉｎｇ." }],
  ] as const)("rejects %s directly from the wire", (_reason, example) => check(example, false));

  it.each(["odd-one-out", "cause-effect", "tap-the-flaw"])("rejects every %s option hazard", mode => {
    const item = choice(mode);
    for (const bad of [
      { ...item, correctOptionId: "missing" },
      { ...item, options: [{ id: "a", label: "Alpha" }, { id: "a", label: "Beta" }] },
      { ...item, options: [{ id: "a", label: "Alpha" }, { id: "b", label: " ALPHA " }] },
      { ...item, options: [{ id: "a", label: "Alpha" }, { id: "b", label: "Ａｌｐｈａ" }] },
    ]) check(bad, false);
  });
  it("rejects duplicate pair IDs and normalized labels independently on each side", () => {
    for (const field of ["id", "left", "right"] as const) {
      const pairs = matching.pairs.map(p => ({ ...p }));
      pairs[1][field] = pairs[0][field];
      check({ ...matching, pairs }, false);
    }
    for (const side of ["left", "right"] as const) {
      const pairs = matching.pairs.map(p => ({ ...p }));
      pairs[0][side] = "Flow rate"; pairs[1][side] = " ＦＬＯＷ\t ＲＡＴＥ ";
      check({ ...matching, pairs }, false);
    }
  });

  const hints = ["A → B", "A ⇒ B", "A ⟶ B", "A ➝ B", "A -> B", "A => B", "Answer is before.",
    "Correct answer: before.", "Choice = before.", "Option is before.", "Answer key", "Hint: before.",
    "Choose the first option.", "Select second choice.", "Pick the left answer.", "Choose right option.",
    "First option is correct.", "Second choice is correct.", "Left answer is correct.", "Right option is correct.",
    "A followed by B.", "A precedes B.", "A then B.", "First stage, second stage."];
  it.each(hints)("rejects legacy and named prompt/instruction sequence or hint: %s", hint => {
    for (const example of [named, legacy]) for (const field of ["prompt", "instruction"])
      check({ ...example, [field]: hint }, false);
  });

  it.each(["(pH)", "[PH]", "ｐＨ", "pH!", "pH", "(DO)", "mL", "(ｍＬ)", "(A+)", "(😀)"])("rejects standalone short label %s", visible => {
    const options = visible.includes("mL") || visible.includes("ｍ") ? ["mL", "DO"] : visible.includes("A+") ? ["A+", "DO"] : visible.includes("😀") ? ["😀", "DO"] : ["pH", "DO"];
    check({ ...named, options, correctAnswer: options[0], prompt: `Compare ${visible} stages.` }, false);
  });
  it.each(["xph", "phx", "éph", "phé", "́ph", "ph́", "1ph", "ph1", "_ph", "ph_", "xｍＬx", "x😀x", "xA+x"])("preserves Unicode short-label word context %s", visible => {
    const options = visible.includes("ｍ") ? ["mL", "DO"] : visible.includes("😀") ? ["😀", "DO"] : visible.includes("A+") ? ["A+", "DO"] : ["pH", "DO"];
    check({ ...named, options, correctAnswer: options[0], prompt: `Compare ${visible} stages.` }, true);
  });
});

describe("actual course-page session parser", () => {
  it("fails closed when transport resolves malformed semantic wire data, without simulated server rejection", async () => {
    const result = await build({
      bundle: true, write: false, format: "iife", jsx: "automatic", loader: { ".css": "empty" },
      alias: { "@": `${process.cwd()}/client/src`, "@shared": `${process.cwd()}/shared` },
      stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
        import React from 'react'; import {createRoot} from 'react-dom/client';
        import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
        import Course from './client/src/pages/CourseInteractiveLearning';
        const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
        createRoot(document.getElementById('root')).render(<QueryClientProvider client={client}><Course /></QueryClientProvider>);
      ` },
      plugins: [{ name: "wire-only-transport", setup(builder) {
        builder.onResolve({ filter: /^(wouter|@\/lib\/trpc|@\/hooks\/usePageMeta)$/ }, args => ({ path: args.path, namespace: "fixture" }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "js", contents: {
          wouter: `import React from 'react'; export const useRoute=()=>[true,{courseKey:'oit'}]; export const useSearch=()=>''; export const Link=({children,...props})=>React.createElement('a',props,children);`,
          "@/hooks/usePageMeta": `export const usePageMeta=()=>{};`,
          "@/lib/trpc": `const p=path=>({_def:()=>({path})}); export const trpc={
            useUtils:()=>({client:{interactive:{getCatalog:{mutate:()=>Promise.resolve(window.__catalog)},startSession:{mutate:()=>{window.__resolved++;return Promise.resolve(JSON.parse(JSON.stringify(window.__wire)));}}}}}),
            auth:{me:p(['auth','me'])},dashboardAuth:{me:p(['dashboardAuth','me'])},stripe:{checkAccess:p(['stripe','checkAccess'])},access:{auditMyEntitlements:p(['access','auditMyEntitlements'])}};`,
        }[args.path]!, resolveDir: process.cwd() }));
      } }],
    });
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const requests: string[] = [];
    page.on("request", request => requests.push(request.url()));
    await page.route("**/*", route => route.abort());
    try {
      await page.setContent('<html><body><div id="root"></div></body></html>');
      await page.evaluate(({ wire, modes }) => {
        const state = window as any;
        state.__wire = wire; state.__resolved = 0;
        Object.defineProperty(window, "localStorage", { value: { getItem: () => null } });
        state.__catalog = { courseKey: "oit", available: true, locked: false, version: "synthetic-v1", modes: modes.map(mode => ({ mode, totalCount: 1, topics: [], difficulties: [] })) };
      }, { wire: session({ ...choice("rapid-swipe"), mode: "rapid-swipe", options: undefined, correctOptionId: undefined, correctAnswer: true }), modes: ["rapid-swipe", "cause-effect", "before-after"] });
      // Initial wire is strictly valid; malformed examples are returned only after
      // the real page is mounted and requests its next mode. No engine runs here.
      await page.evaluate(() => { delete (window as any).__wire.examples[0].options; delete (window as any).__wire.examples[0].correctOptionId; });
      await page.addScriptTag({ content: result.outputFiles[0].text });
      await page.locator(".interactive-drill__activity").waitFor({ timeout: 5000 });
      for (const [mode, label, example] of [
        ["cause-effect", "Cause Effect", { ...choice("cause-effect"), correctOptionId: "missing" }],
        ["before-after", "Before/After", { ...named, options: ["Argon", "Oxygen"], correctAnswer: "Argon", prompt: "Compare argonated samples." }],
      ] as const) {
        await page.evaluate(wire => { (window as any).__wire = wire; }, session(example));
        await page.getByRole("navigation", { name: "Choose a practice mode" }).getByRole("button", { name: new RegExp(`^${label}`) }).click();
        await page.getByRole("alert").filter({ hasText: /couldn’t load/ }).waitFor({ timeout: 5000 });
        expect(await page.locator(".interactive-drill__activity").count()).toBe(0);
        expect(await page.getByRole("group", { name: "Answer choices" }).count()).toBe(0);
        expect(await page.getByText(String(example.prompt), { exact: true }).count()).toBe(0);
        expect(await page.evaluate(() => (window as any).__wire.mode)).toBe(mode);
      }
      expect(await page.evaluate(() => (window as any).__resolved)).toBe(3);
      expect(requests).toEqual([]);
    } finally { await page.close(); await browser.close(); }
  }, 30000);
});
