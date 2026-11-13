import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";

// No dev server, real transport, accounts, database, or authored content. This is
// the existing esbuild/React Query isolated-component test style, not site QA.
let browser: Browser;
let script: string;
const modes = ["rapid-swipe", "speed-match", "odd-one-out", "cause-effect", "tap-the-flaw", "before-after"];
const labels = ["Rapid Swipe", "Speed-Match", "Odd-One-Out", "Cause Effect", "Tap-the-Flaw", "Before/After"];

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
      window.__online = value => {onlineManager.setOnline(value);window.dispatchEvent(new Event(value?'online':'offline'));};
      window.__client = new QueryClient();
      const root=createRoot(document.getElementById('root'));
      root.render(<QueryClientProvider client={window.__client}><Course /></QueryClientProvider>);
    ` },
    plugins: [{ name: "synthetic-session-transport", setup(builder) {
      builder.onResolve({ filter: /^(wouter|@\/lib\/trpc|@\/hooks\/usePageMeta)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "js", resolveDir: process.cwd(), contents: {
        wouter: `import React,{useSyncExternalStore} from 'react';
          const listeners=new Set();const subscribe=f=>{listeners.add(f);return()=>listeners.delete(f)};const snapshot=()=>window.__route;
          window.__routeTo=course=>{window.__route={course};listeners.forEach(f=>f())};
          export const useRoute=()=>[true,{courseKey:useSyncExternalStore(subscribe,snapshot).course}];
          export const useSearch=()=>'';export const Link=({children,...props})=>React.createElement('a',props,children);`,
        "@/hooks/usePageMeta": `export const usePageMeta=()=>{};`,
        "@/lib/trpc": `const p=path=>({_def:()=>({path})});
          export const trpc={useUtils:()=>({client:{interactive:{
            getCatalog:{mutate:(input,options)=>window.__request('catalog',input,options.signal)},
            startSession:{mutate:(input,options)=>window.__request('session',input,options.signal)}
          }}}),auth:{me:p(['auth','me'])},dashboardAuth:{me:p(['dashboardAuth','me'])},
          stripe:{checkAccess:p(['stripe','checkAccess'])},access:{auditMyEntitlements:p(['access','auditMyEntitlements'])}};`,
      }[args.path]! }));
    } }],
  });
  script = bundle.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);
afterAll(async () => { await browser?.close(); });

async function fixture(run: (page: Page) => Promise<void>, locked = false, topics = true) {
  const page = await browser.newPage();
  const requests: string[] = [];
  const sockets: string[] = [];
  page.on("request", request => requests.push(request.url()));
  page.on("websocket", socket => sockets.push(socket.url()));
  await page.route("**/*", route => route.abort());
  try {
    await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>');
    await page.evaluate(({ locked, topics, modes }) => {
      const state = window as any;
      state.__route = { course: "oit" };
      state.__calls = [];
      state.__pending = [];
      state.__aborts = [];
      state.__locked = locked;
      state.__topics = topics;
      state.__owner = "Account A";
      state.__hold = "";
      state.__error = "";
      state.__empty = false;
      state.__version = "synthetic-v1";
      state.__signals = [];
      const values: Record<string, string> = {};
      Object.defineProperty(window, "localStorage", { configurable: true, value: {
        getItem: (key: string) => values[key] ?? null,
        setItem: (key: string, value: string) => { values[key] = String(value); },
        removeItem: (key: string) => { delete values[key]; },
      } });
      state.__request = (kind: string, input: any, signal: AbortSignal) => {
        state.__calls.push({ kind, ...input });
        state.__signals.push(signal instanceof AbortSignal);
        if (state.__error === kind) return Promise.reject(new Error("Synthetic failure"));
        const example: any = { id: "same-synthetic-id", mode: input.mode,
          prompt: `Synthetic ${state.__owner} ${input.courseKey} ${input.mode} prompt`, explanation: "Synthetic explanation" };
        if (input.mode === "rapid-swipe") example.correctAnswer = true;
        else if (input.mode === "speed-match") example.pairs = [1, 2, 3].map(n => ({ id: `p${n}`, left: `Left ${n}`, right: `Right ${n}` }));
        else if (input.mode === "before-after") example.correctAnswer = "before";
        else { example.options = [{ id: "a", label: "Synthetic first" }, { id: "b", label: "Synthetic second" }]; example.correctOptionId = "a"; }
        const data = kind === "catalog" ? {
          courseKey: input.courseKey, available: true, locked: state.__locked, version: state.__version,
          modes: modes.map(mode => ({ mode, totalCount: 17,
            topics: state.__topics ? [{ id: "synthetic-topic", label: "Synthetic topic", count: 12 }, { id: "unclassified", label: "Unclassified", count: 5 }] : [],
            difficulties: state.__topics ? [{ id: "easy", count: 8 }, { id: "unclassified", count: 9 }] : [],
          })),
        } : {
          courseKey: input.courseKey, available: true, locked: state.__locked, version: state.__version,
          sessionId: "same-synthetic-session-id", mode: input.mode, totalAvailableCount: state.__empty ? 0 : 17,
          examples: state.__empty ? [] : state.__multi ? [example, { ...example, id: "second-synthetic-id", prompt: `${example.prompt} second` }] : [example],
          filters: { topicId: input.topicId ?? null, difficulty: input.difficulty ?? null, requestedSize: input.sessionSize },
        };
        if (kind === "catalog" && state.__badCatalog) Object.assign(data, state.__badCatalog);
        if (kind === "session" && state.__badSession) Object.assign(data, state.__badSession);
        if (state.__hold !== kind && state.__hold !== "both") return Promise.resolve(data);
        return new Promise(resolve => {
          state.__pending.push({ kind, release: () => resolve(data) });
          // Intentionally ignore cancellation; the UI must reject late completions.
          signal.addEventListener("abort", () => state.__aborts.push(kind), { once: true });
        });
      };
    }, { locked, topics, modes });
    await page.addScriptTag({ content: script });
    await run(page);
  } finally {
    try { expect(requests).toEqual([]); expect(sockets).toEqual([]); }
    finally { await page.close(); }
  }
}
const activity = (page: Page) => page.locator(".interactive-drill__activity");
const calls = (page: Page, kind: string) => page.evaluate(kind => (window as any).__calls.filter((item: any) => item.kind === kind), kind);
const waitForActivity = (page: Page) => activity(page).waitFor();
const waitForCall = async (page: Page, key: string, value: unknown) => {
  await expect.poll(async () => (await calls(page, "session")).at(-1)?.[key]).toEqual(value);
  await waitForActivity(page);
};

describe("bounded course session UI (synthetic isolated fixtures)", () => {
  it("keeps six mode cards visible for every single-mode session and shows published counts", async () => {
    await fixture(async page => {
      await waitForActivity(page);
      const nav = page.getByRole("navigation", { name: "Choose a practice mode" });
      for (let index = 0; index < modes.length; index++) {
        expect(await nav.getByRole("button").count()).toBe(6);
        await nav.getByRole("button", { name: new RegExp(`^${labels[index]}`) }).click();
        await waitForCall(page, "mode", modes[index]);
        expect(await activity(page).getByRole("heading", { level: 2 }).textContent()).toContain(modes[index]);
      }
      expect(await page.getByText("17 published", { exact: true }).count()).toBe(6);
      expect(await page.getByText(/1000|1,000/).count()).toBe(0);
      expect(await page.evaluate(() => (window as any).__signals.every(Boolean))).toBe(true);
    });
  });

  it("sends only catalog topics/difficulties with selected size and starts configured or untimed swipe rounds", async () => {
    await fixture(async page => {
      await waitForActivity(page);
      await page.getByLabel("Topic", { exact: true }).selectOption("synthetic-topic");
      await waitForCall(page, "topicId", "synthetic-topic");
      await page.getByLabel("Difficulty", { exact: true }).selectOption("easy");
      await waitForCall(page, "difficulty", "easy");
      for (const size of [10, 20, 30, 50]) {
        await page.getByLabel("Session size", { exact: true }).selectOption(String(size));
        await waitForCall(page, "sessionSize", size);
      }
      const last = (await calls(page, "session")).at(-1);
      expect(last).toMatchObject({ courseKey: "oit", mode: "rapid-swipe", topicId: "synthetic-topic", difficulty: "easy", sessionSize: 50 });
      for (const seconds of [60, 90, 30]) {
        const before = (await calls(page, "session")).length;
        await page.getByLabel("Swipe timer", { exact: true }).selectOption(String(seconds));
        await expect.poll(async () => (await calls(page, "session")).length).toBeGreaterThan(before);
        await page.getByRole("button", { name: `Start ${seconds}-second round` }).click();
        await page.getByRole("heading", { name: `${seconds}-second round`, exact: true }).waitFor();
        expect(await page.getByText(new RegExp(`Time: ${seconds}s`)).count()).toBe(1);
      }
      await page.getByLabel("Swipe timer", { exact: true }).selectOption("off");
      await waitForActivity(page);
      await expect.poll(() => page.getByRole("button", { name: /Start \d+-second round/ }).count()).toBe(0);
      expect(await page.getByRole("button", { name: "Yes", exact: true }).isEnabled()).toBe(true);
    });
  });

  it("has no fabricated topic or difficulty options when metadata is missing", async () => {
    await fixture(async page => {
      await waitForActivity(page);
      expect(await page.getByLabel("Topic", { exact: true }).locator("option").allTextContents()).toEqual(["All topics"]);
      expect(await page.getByLabel("Difficulty", { exact: true }).locator("option").allTextContents()).toEqual(["All difficulties"]);
      expect(await page.getByLabel("Topic", { exact: true }).isDisabled()).toBe(true);
      expect(await page.getByLabel("Difficulty", { exact: true }).isDisabled()).toBe(true);
      await page.getByText("Topic filters not available yet").waitFor();
      await page.getByText("Difficulty filters not available yet").waitFor();
      expect(await page.getByLabel("Session size", { exact: true }).isEnabled()).toBe(true);
      expect((await calls(page, "session")).at(-1)).not.toHaveProperty("topicId");
      expect((await calls(page, "session")).at(-1)).not.toHaveProperty("difficulty");
    }, false, false);
  });

  it("labels unclassified data honestly and fails explicitly when selected metadata disappears", async () => {
    await fixture(async page => {
      await waitForActivity(page);
      expect(await page.getByLabel("Topic", { exact: true }).locator('option[value="unclassified"]').textContent()).toContain("not tagged");
      expect(await page.getByLabel("Difficulty", { exact: true }).locator('option[value="unclassified"]').textContent()).toContain("not rated");
      await page.getByLabel("Topic", { exact: true }).selectOption("unclassified");
      await waitForCall(page, "topicId", "unclassified");
      const before = (await calls(page, "session")).length;
      await page.evaluate(() => { (window as any).__topics = false; window.dispatchEvent(new Event("focus")); });
      await page.getByText(/selected topic or difficulty is no longer published/).waitFor();
      expect(await activity(page).count()).toBe(0);
      expect((await calls(page, "session")).length).toBe(before);
      await page.getByLabel("Topic", { exact: true }).selectOption("");
      await waitForActivity(page);
    });
  });

  it("disables paid settings for the one-example free preview without disabling six modes", async () => {
    await fixture(async page => {
      await waitForActivity(page);
      for (const label of ["Topic", "Difficulty", "Session size", "Swipe timer"]) expect(await page.getByLabel(label, { exact: true }).isDisabled()).toBe(true);
      expect(await page.getByLabel("Session size", { exact: true }).inputValue()).toBe("1");
      await page.getByText(/one fixed example per mode/).waitFor();
      const nav = page.getByRole("navigation", { name: "Choose a practice mode" });
      expect(await nav.getByRole("button").count()).toBe(6);
      await nav.getByRole("button", { name: /^Odd-One-Out/ }).click();
      await waitForCall(page, "mode", "odd-one-out");
      for (const input of await calls(page, "session")) {
        expect(input.sessionSize).toBe(20);
        expect(input).not.toHaveProperty("topicId"); expect(input).not.toHaveProperty("difficulty");
      }
      expect(await page.getByRole("button", { name: /checkout|unlock|buy/i }).count()).toBe(0);
      expect(await page.getByRole("button", { name: "Replay preview", exact: true }).isEnabled()).toBe(true);
      expect(await page.getByRole("button", { name: "Next round →", exact: true }).count()).toBe(0);
    }, true);
  });

  it("only enables the timer for Rapid Swipe and keeps the chosen timer when returning", async () => {
    await fixture(async page => {
      await waitForActivity(page);
      await page.getByLabel("Swipe timer", { exact: true }).selectOption("60");
      await waitForActivity(page);
      const nav = page.getByRole("navigation", { name: "Choose a practice mode" });
      for (const label of labels.slice(1)) {
        await nav.getByRole("button", { name: new RegExp(`^${label}`) }).click();
        await waitForActivity(page);
        expect(await page.getByLabel("Swipe timer", { exact: true }).isDisabled()).toBe(true);
        await page.getByText("Rapid Swipe only", { exact: true }).waitFor();
      }
      await nav.getByRole("button", { name: /^Rapid Swipe/ }).click();
      await waitForActivity(page);
      expect(await page.getByLabel("Swipe timer", { exact: true }).isEnabled()).toBe(true);
      expect(await page.getByLabel("Swipe timer", { exact: true }).inputValue()).toBe("60");
    });
  });

  it("offers Skip without marking an answer and requests a fresh session at the end in every mode", async () => {
    await fixture(async page => {
      await waitForActivity(page);
      await page.evaluate(() => { (window as any).__multi = true; });
      const nav = page.getByRole("navigation", { name: "Choose a practice mode" });
      for (const label of labels) {
        await nav.getByRole("button", { name: new RegExp(`^${label}`) }).click();
        await waitForActivity(page);
        expect(await page.getByRole("button", { name: "Next activity →", exact: true }).isDisabled()).toBe(true);
        await page.getByRole("button", { name: "Skip activity →", exact: true }).click();
        await activity(page).getByRole("heading", { level: 2 }).filter({ hasText: /second$/ }).waitFor();
        expect(await page.getByText("Correct", { exact: true }).count()).toBe(0);
        const before = (await calls(page, "session")).length;
        await page.getByRole("button", { name: "Next round →", exact: true }).click();
        await expect.poll(async () => (await calls(page, "session")).length).toBeGreaterThan(before);
        await waitForActivity(page);
        expect(await activity(page).getByRole("heading", { level: 2 }).textContent()).not.toMatch(/second$/);
        await expect.poll(() => activity(page).getByRole("heading", { level: 2 }).evaluate(el => el === document.activeElement)).toBe(true);
      }
    });
  });

  it("preserves a keyboard user's focus intent while a fresh round is loading", async () => {
    await fixture(async page => {
      await waitForActivity(page);
      await page.evaluate(() => { (window as any).__hold = "session"; });
      await page.getByRole("button", { name: "Next round →", exact: true }).focus();
      await page.keyboard.press("Enter");
      await page.getByRole("status").filter({ hasText: /Loading your practice round/ }).waitFor();
      await page.evaluate(() => { const state = window as any; state.__hold = ""; state.__pending.splice(0).forEach((p: any) => p.release()); });
      await waitForActivity(page);
      await expect.poll(() => activity(page).getByRole("heading", { level: 2 }).evaluate(el => el === document.activeElement)).toBe(true);
    });
  });

  it("resets answers on New round even if session ID, content version and example IDs repeat", async () => {
    await fixture(async page => {
      await waitForActivity(page);
      await page.getByRole("button", { name: "Yes", exact: true }).click();
      await page.getByText("Synthetic explanation", { exact: true }).waitFor();
      const before = (await calls(page, "session")).length;
      await page.getByRole("button", { name: "New round", exact: true }).click();
      await expect.poll(async () => (await calls(page, "session")).length).toBeGreaterThan(before);
      await expect.poll(() => page.getByRole("button", { name: "Yes", exact: true }).isEnabled()).toBe(true);
      expect(await page.getByText("Synthetic explanation", { exact: true }).count()).toBe(0);
      expect(await page.getByText(/progress not saved/).count()).toBeGreaterThan(0);
    });
  });

  it("reports an empty filter intersection and never substitutes another mode or legacy content", async () => {
    await fixture(async page => {
      await waitForActivity(page);
      await page.evaluate(() => { (window as any).__empty = true; });
      await page.getByLabel("Difficulty", { exact: true }).selectOption("easy");
      await page.getByText(/No activities match this topic and difficulty/).waitFor();
      expect(await activity(page).count()).toBe(0);
      expect(await page.getByRole("navigation", { name: "Choose a practice mode" }).getByRole("button").count()).toBe(6);
    });
  });

  it.each(["catalog", "session"])("fails closed for a %s error with old content removed", async kind => {
    await fixture(async page => {
      await waitForActivity(page);
      await page.evaluate(kind => { (window as any).__error = kind; window.dispatchEvent(new Event("focus")); }, kind);
      await page.getByRole("alert").filter({ hasText: /couldn’t load/ }).waitFor();
      expect(await activity(page).count()).toBe(0);
      expect(await page.getByText(/Synthetic Account A/).count()).toBe(0);
    });
  });

  it.each(["catalog", "session"])("synchronously isolates token/identity changes and ignores late old %s completions", async kind => {
    await fixture(async page => {
      await waitForActivity(page);
      await page.evaluate(kind => { (window as any).__hold = kind; window.dispatchEvent(new Event("focus")); }, kind);
      await expect.poll(() => page.evaluate(kind => (window as any).__pending.filter((p: any) => p.kind === kind).length, kind)).toBeGreaterThan(0);
      await page.evaluate(() => {
        const state = window as any;
        state.__owner = "Account B"; state.__locked = true;
        localStorage.setItem("echelon_access_token", "synthetic-token-B");
        window.dispatchEvent(new StorageEvent("storage", { key: "echelon.identity-change.event", newValue: "b".repeat(32) }));
        state.__hiddenNow = !document.body.textContent?.includes("Synthetic Account A");
      });
      expect(await page.evaluate(() => (window as any).__hiddenNow)).toBe(true);
      await expect.poll(async () => (await calls(page, "catalog")).at(-1)?.accessToken).toBe("synthetic-token-B");
      await page.evaluate(() => { const state = window as any; state.__hold = ""; const old = state.__pending.shift(); old.release(); });
      expect(await page.getByText(/Synthetic Account A/).count()).toBe(0);
      await page.evaluate(() => { const state = window as any; state.__pending.splice(0).forEach((p: any) => p.release()); });
      await page.getByRole("heading", { name: /Synthetic Account B oit rapid-swipe/ }).waitFor();
      expect(await page.getByText(/Synthetic Account A/).count()).toBe(0);
      expect(await page.getByLabel("Topic", { exact: true }).isDisabled()).toBe(true);
      expect(await page.evaluate(() => (window as any).__aborts.length)).toBeGreaterThan(0);
    });
  });

  it("reauthorizes cookie-only identity changes with the same absent bearer", async () => {
    await fixture(async page => {
      await waitForActivity(page);
      await page.evaluate(() => {
        const state = window as any; state.__owner = "Cookie B";
        window.dispatchEvent(new StorageEvent("storage", { key: "echelon.identity-change.event", newValue: "c".repeat(32) }));
        state.__hiddenNow = !document.body.textContent?.includes("Synthetic Account A");
      });
      expect(await page.evaluate(() => (window as any).__hiddenNow)).toBe(true);
      await page.getByRole("heading", { name: /Synthetic Cookie B oit rapid-swipe/ }).waitFor();
      expect((await calls(page, "catalog")).every((input: any) => input.accessToken === undefined)).toBe(true);
    });
  });

  it("hides both working sets during cookie auth queries and rechecks both after success", async () => {
    await fixture(async page => {
      await waitForActivity(page);
      const before = (await calls(page, "session")).length;
      await page.evaluate(() => {
        const state = window as any;
        state.__authPromise = state.__client.fetchQuery({ queryKey: [["auth", "me"], { type: "query" }], queryFn: () => new Promise(resolve => { state.__finishAuth = resolve; }) });
        state.__hiddenNow = !document.body.textContent?.includes("Synthetic Account A");
      });
      expect(await page.evaluate(() => (window as any).__hiddenNow)).toBe(true);
      await page.getByRole("status").filter({ hasText: /Loading practice activities/ }).waitFor();
      expect(await activity(page).count()).toBe(0);
      await page.evaluate(() => { const state = window as any; state.__owner = "Cookie B"; state.__finishAuth({ id: "synthetic-cookie-B" }); });
      await page.getByRole("heading", { name: /Synthetic Cookie B oit rapid-swipe/ }).waitFor();
      expect((await calls(page, "session")).length).toBeGreaterThan(before);
    });
  });

  it("isolates a course switch while its prior session is held", async () => {
    await fixture(async page => {
      await waitForActivity(page);
      await page.evaluate(() => { const state = window as any; state.__hold = "session"; window.dispatchEvent(new Event("focus")); });
      await expect.poll(() => page.evaluate(() => (window as any).__pending.length)).toBeGreaterThan(0);
      await page.evaluate(() => { const state = window as any; state.__hold = ""; state.__routeTo("class1-water"); });
      await page.getByRole("heading", { name: /Synthetic Account A class1-water rapid-swipe/ }).waitFor();
      await page.evaluate(() => (window as any).__pending.splice(0).forEach((p: any) => p.release()));
      expect(await page.getByText(/Synthetic Account A oit/).count()).toBe(0);
      expect((await calls(page, "session")).at(-1)?.courseKey).toBe("class1-water");
    });
  });

  it("hides paid content immediately offline and reconnects both queries with the current token", async () => {
    await fixture(async page => {
      await waitForActivity(page);
      await page.evaluate(() => { (window as any).__online(false); });
      await page.getByRole("alert").filter({ hasText: /offline/ }).waitFor();
      expect(await activity(page).count()).toBe(0);
      await page.evaluate(() => { const state = window as any; state.__owner = "Reconnected"; localStorage.setItem("echelon_access_token", "synthetic-reconnect"); state.__online(true); });
      await page.getByRole("heading", { name: /Synthetic Reconnected oit rapid-swipe/ }).waitFor();
      for (const kind of ["catalog", "session"]) expect((await calls(page, kind)).at(-1)?.accessToken).toBe("synthetic-reconnect");
    });
  });

  it.each(["focus", "pageshow", "storage", "auth", "dashboard", "access", "entitlements"])("rechecks both POSTs on %s and discards answers", async signal => {
    await fixture(async page => {
      await waitForActivity(page);
      await page.getByRole("button", { name: "Yes", exact: true }).click();
      const beforeCatalog = (await calls(page, "catalog")).length;
      const beforeSession = (await calls(page, "session")).length;
      await page.evaluate(signal => {
        const state = window as any;
        if (signal === "storage") window.dispatchEvent(new StorageEvent("storage", { key: "echelon_subscription_email" }));
        else if (["focus", "pageshow"].includes(signal)) window.dispatchEvent(new Event(signal));
        else {
          const paths: Record<string, string[]> = { auth: ["auth", "me"], dashboard: ["dashboardAuth", "me"], access: ["stripe", "checkAccess"], entitlements: ["access", "auditMyEntitlements"] };
          state.__client.setQueryData([paths[signal], { type: "query" }], { synthetic: signal });
        }
      }, signal);
      await expect.poll(async () => (await calls(page, "catalog")).length).toBeGreaterThan(beforeCatalog);
      await expect.poll(async () => (await calls(page, "session")).length).toBeGreaterThan(beforeSession);
      await expect.poll(() => page.getByRole("button", { name: "Yes", exact: true }).isEnabled()).toBe(true);
      expect(await page.getByText("Synthetic explanation", { exact: true }).count()).toBe(0);
    });
  });

  it.each([
    ["catalog", { courseKey: "class1-water" }],
    ["catalog", { unexpected: true }],
    ["session", { mode: "odd-one-out" }],
    ["session", { filters: { topicId: "unrequested", difficulty: null, requestedSize: 20 } }],
    ["session", { version: "old-version" }],
  ] as const)("rejects mismatched/strict %s wire responses", async (kind, bad) => {
    await fixture(async page => {
      await waitForActivity(page);
      await page.evaluate(({ kind, bad }) => { (window as any)[kind === "catalog" ? "__badCatalog" : "__badSession"] = bad; window.dispatchEvent(new Event("focus")); }, { kind, bad });
      await page.getByRole("alert").filter({ hasText: /couldn’t load/ }).waitFor();
      expect(await activity(page).count()).toBe(0);
    });
  });
});
