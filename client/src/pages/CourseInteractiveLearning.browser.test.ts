import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";

let browser: Browser;
let script: string;

// The registry, adapter, drill, and React Query are real. Only routing, metadata,
// and the tRPC transport are replaced; all question content is synthetic.
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
        import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
        import CourseInteractiveLearning from './client/src/pages/CourseInteractiveLearning';
        onlineManager.setOnline(!window.__startOffline);
        window.__setOnline = online => { onlineManager.setOnline(online); if (online) window.dispatchEvent(new Event('online')); };
        const client = new QueryClient({defaultOptions:{queries:{retry:false}}});
        window.__client = client;
        const root = createRoot(document.getElementById('root'));
        root.render(<QueryClientProvider client={client}><CourseInteractiveLearning /></QueryClientProvider>);
      `,
    },
    alias: { "@": `${process.cwd()}/client/src`, "@shared": `${process.cwd()}/shared` },
    loader: { ".css": "empty" },
    plugins: [{
      name: "isolated-course-practice",
      setup(builder) {
        builder.onResolve({ filter: /^(wouter|@\/lib\/trpc|@\/hooks\/usePageMeta)$/ }, args => ({ path: args.path, namespace: "mock" }));
        builder.onLoad({ filter: /.*/, namespace: "mock" }, args => {
          const modules: Record<string, string> = {
            wouter: `
              import React, { useSyncExternalStore } from 'react';
              const listeners = new Set();
              window.__setRoute = (course, search='') => { window.__route={course, search}; listeners.forEach(f=>f()); };
              const subscribe = f => { listeners.add(f); return () => listeners.delete(f); };
              const snapshot = () => window.__route;
              export const useRoute = () => { const route=useSyncExternalStore(subscribe,snapshot); return [true,{courseKey:route.course}]; };
              export const useSearch = () => useSyncExternalStore(subscribe,snapshot).search;
              export const Link = ({href,children,...props}) => React.createElement('a',{href,...props},children);
            `,
            "@/hooks/usePageMeta": `export const usePageMeta = () => {};`,
            "@/lib/trpc": `
              import { useQuery } from '@tanstack/react-query';
              import { getQueryKey } from '@trpc/react-query';
              import { createTRPCClient, httpBatchLink } from '@trpc/client';
              import superjson from 'superjson';
              const httpClient = createTRPCClient({links:[httpBatchLink({
                url:'https://fixture.invalid/api/trpc', transformer:superjson,
                fetch: async (url, init) => {
                  window.__transportCalls.push({url:String(url), method:init.method, body:init.body});
                  const inputs = Object.values(JSON.parse(init.body)).map(value => superjson.deserialize(value));
                  const isQuiz = String(url).includes("quiz.getInteractiveQuestions");
                  const results = await Promise.all(inputs.map(async input => ({result:{data:superjson.serialize(await (isQuiz ? window.__query(input, init.signal) : window.__contentQuery(input, init.signal)))}})));
                  return new Response(JSON.stringify(results), {status:200, headers:{'content-type':'application/json'}});
                },
              })]});
              const procedure = path => ({_def:()=>({path})});
              const questions = procedure(['quiz','getQuestions']);
              questions.useQuery = (input, options) => useQuery({
                ...options, retry:false,
                queryKey:getQueryKey(questions,input,'query'),
                queryFn:({signal})=>window.__query(input,signal),
              });
              export const trpc = {
                useUtils:() => ({ client: { interactive: { getContent: { mutate: (input, options) => window.__useHttpTransport ? httpClient.interactive.getContent.mutate(input, options) : window.__contentQuery(input, options.signal) } }, quiz: { getInteractiveQuestions: { mutate: (input, options) => window.__useHttpTransport ? httpClient.quiz.getInteractiveQuestions.mutate(input, options) : window.__query(input, options.signal) } } } }),
                quiz:{getQuestions:questions}, auth:{me:procedure(['auth','me'])},
                dashboardAuth:{me:procedure(['dashboardAuth','me'])},
                stripe:{checkAccess:procedure(['stripe','checkAccess'])},
                access:{auditMyEntitlements:procedure(['access','auditMyEntitlements'])},
              };
            `,
          };
          return { contents: modules[args.path], loader: "js", resolveDir: process.cwd() };
        });
      },
    }],
  });
  script = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);

afterAll(async () => { await browser?.close(); });

type MockResponse = { questions: unknown[]; locked: boolean };
const question = (label: string) => ({
  question: `Synthetic ${label} question?`,
  options: [`Synthetic ${label} correct`, `Synthetic ${label} wrong`],
  correctIndex: 0,
  explanation: `Synthetic ${label} explanation.`,
});
const response = (label: string, locked = false): MockResponse => ({ questions: [question(label)], locked });
// Synthetic JWT-shaped fixtures only: no cryptographic verification is performed
// by the component, and these tests cannot prove server identity or authorization.
const receipt = (owner: string, issuedAt = 1) => `header.${Buffer.from(JSON.stringify({ owner, iat: issuedAt })).toString("base64url")}.signature`;
const identified = (label: string, owner = "a".repeat(64), issuedAt = 1, locked = false): MockResponse => ({
  questions: [{ ...question(label), attemptToken: receipt(owner, issuedAt) }], locked,
});

async function withCourse(
  course: string,
  responses: Record<string, MockResponse>,
  run: (page: Page) => Promise<void>,
  search = "",
  startOffline = false,
  contentResponses: Record<string, unknown> = {},
  contentMode = "success",
  useHttpTransport = false,
  initialToken?: string,
) {
  const page = await browser.newPage();
  const requests: string[] = [];
  const sockets: string[] = [];
  page.on("request", request => requests.push(request.url()));
  page.on("websocket", socket => sockets.push(socket.url()));
  await page.route("**/*", route => route.abort("blockedbyclient"));
  try {
    await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>');
    await page.evaluate(({ course, search, responses, startOffline, contentResponses, contentMode, useHttpTransport, initialToken }) => {
      const state = window as any;
      state.__route = { course, search };
      state.__startOffline = startOffline;
      state.__responses = responses;
      state.__calls = [];
      state.__contentCalls = [];
      state.__transportCalls = [];
      state.__useHttpTransport = useHttpTransport;
      state.__contentResponses = contentResponses;
      state.__contentMode = contentMode;
      state.__contentPending = [];
      state.__mode = "success";
      state.__pending = [];
      const originalInterval = window.setInterval.bind(window);
      window.setInterval = ((callback: TimerHandler, delay?: number, ...args: any[]) => {
        if (delay === 5 * 60_000 && typeof callback === "function") state.__periodic = callback;
        return originalInterval(callback, delay, ...args);
      }) as typeof window.setInterval;
      const values: Record<string, string> = {};
      if (initialToken !== undefined) values.echelon_access_token = initialToken;
      const storage = {
        get length() { return Object.keys(values).length; },
        key: (i: number) => Object.keys(values)[i] ?? null,
        getItem: (key: string) => values[key] ?? null,
        setItem: (key: string, value: string) => { values[key] = String(value); },
        removeItem: (key: string) => { delete values[key]; },
        clear: () => { for (const key of Object.keys(values)) delete values[key]; },
      };
      Object.defineProperty(window, "localStorage", { configurable: true, get: () => storage });
      state.__contentQuery = (input: { courseKey: string; accessToken?: string }, signal: AbortSignal) => {
        state.__contentCalls.push({ ...input });
        if (state.__contentMode === "error" || state.__contentMode === "unauthorized") {
          return Promise.reject(Object.assign(new Error("Synthetic transport error"), { data: { httpStatus: state.__contentMode === "unauthorized" ? 401 : 500 } }));
        }
        const data = structuredClone(state.__contentResponses[input.courseKey] ?? { courseKey: input.courseKey, available: false, locked: true, version: null, examples: [] });
        if (state.__contentMode !== "hold") return Promise.resolve(data);
        return new Promise((resolve, reject) => {
          state.__contentPending.push(() => resolve(data));
          if (!state.__ignoreAbort) signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
        });
      };
      state.__query = (input: any, signal: AbortSignal) => {
        state.__calls.push({ ...input });
        if (state.__mode === "error") return Promise.reject(new Error("Synthetic transport error"));
        // Snapshot the server result at request time; deferred requests are released
        // explicitly by the test so stale responses and loading can be observed.
        const data = structuredClone(state.__responses[input.bankKey] ?? { questions: [], locked: true });
        if (state.__mode !== "hold") return Promise.resolve(data);
        return new Promise((resolve, reject) => {
          state.__pending.push(() => resolve(data));
          if (!state.__ignoreAbort) signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
        });
      };
    }, { course, search, responses, startOffline, contentResponses, contentMode, useHttpTransport, initialToken });
    await page.addScriptTag({ content: script });
    await run(page);
  } finally {
    try {
      expect(requests).toEqual([]);
      expect(sockets).toEqual([]);
    } finally { await page.close(); }
  }
}

const calls = (page: Page) => page.evaluate(() => (window as any).__calls as Array<Record<string, unknown>>);
const contentCalls = (page: Page) => page.evaluate(() => (window as any).__contentCalls as Array<Record<string, unknown>>);
const authored = (courseKey: string, label: string, locked = false) => ({ courseKey, available: true, locked, version: "synthetic-v1", examples: [{ id: "one", mode: "rapid-swipe", prompt: `Authored ${label}?`, correctAnswer: false, explanation: `Authored ${label} explanation.` }] });
const named = (label: string) => ({ id: "named", mode: "before-after", prompt: `Synthetic ${label}: which stage comes earlier?`, instruction: "Choose the earlier stage.", options: ["Screening", "Disinfection"], correctAnswer: "  screening  ", explanation: `Synthetic ${label} explanation.` });
const namedContent = (label: string, locked = false) => ({ ...authored("oit", label, locked), examples: [named(label)] });
const heading = (page: Page, text: string) => page.getByRole("heading", { name: text, exact: true });

// These expectations exercise client routing and the server-supplied working set;
// a mock cannot establish that the real server enforces entitlements.
describe("CourseInteractiveLearning isolated browser", () => {
  it.each(["authored", "fallback"])("omits an empty stored bearer for authenticated %s requests", async source => {
    // The mocked successful response represents an authenticated request; no cookie or server is exercised.
    const content = source === "authored" ? { oit: authored("oit", "Cookie") } : {};
    await withCourse("oit", { oit: response("Cookie") }, async page => {
      await page.getByText(source === "authored" ? "Authored Cookie?" : "Synthetic Cookie question?", { exact: false }).first().waitFor();
      expect((await contentCalls(page)).length).toBeGreaterThan(0);
      expect((await contentCalls(page)).every(input => input.accessToken === undefined)).toBe(true);
      if (source === "fallback") {
        expect((await calls(page)).length).toBeGreaterThan(0);
        expect((await calls(page)).every(input => input.accessToken === undefined)).toBe(true);
      }
    }, "", false, content, "success", false, "");
  });

  it.each([
    ["empty", "", undefined],
    ["whitespace", "  ", undefined],
    ["oversized characters", "x".repeat(8193), undefined],
    ["oversized UTF-8 bytes", "é".repeat(4097), undefined],
    ["character boundary", "x".repeat(8192), "x".repeat(8192)],
    ["byte boundary", "é".repeat(4096), "é".repeat(4096)],
  ])("bounds %s before both authored and fallback POSTs", async (_label, token, expected) => {
    await withCourse("oit", { oit: response("Fixture") }, async page => {
      await page.getByText("Synthetic Fixture question?", { exact: false }).first().waitFor();
      expect((await contentCalls(page)).every(input => input.accessToken === expected)).toBe(true);
      expect((await calls(page)).every(input => input.accessToken === expected)).toBe(true);
      const requests = await page.evaluate(() => (window as any).__transportCalls as Array<{url: string; method: string; body: string}>);
      expect(requests.some(request => request.url.includes("interactive.getContent"))).toBe(true);
      expect(requests.some(request => request.url.includes("quiz.getInteractiveQuestions"))).toBe(true);
      expect(requests.every(request => request.method === "POST" && (!token || !request.url.includes(token)))).toBe(true);
      for (const request of requests) {
        const encoded = JSON.parse(request.body)["0"];
        if (expected === undefined) {
          expect(encoded.json.accessToken).toBeNull();
          expect(encoded.meta.values.accessToken).toEqual(["undefined"]);
        } else expect(encoded.json.accessToken).toBe(expected);
      }
    }, "", false, {}, "success", true, token);
  });

  it.each([false, true])("uses the mocked server's %s locked outcome with an oversized bearer", async locked => {
    // The fixture models server decisions only; it does not validate a cookie or entitlement.
    await withCourse("oit", {}, async page => {
      await page.getByText(`Authored ${locked ? "Preview" : "Account"}?`).waitFor();
      expect(await page.getByText(/available free preview/i).count()).toBe(locked ? 1 : 0);
      expect((await contentCalls(page)).every(input => input.accessToken === undefined)).toBe(true);
    }, "", false, { oit: authored("oit", locked ? "Preview" : "Account", locked) }, "success", true, "x".repeat(8193));
  });

  it.each(["authored", "fallback"])("gates and reauthorizes %s on a same-token identity signal, ignoring a late pre-signal response", async source => {
    const content = source === "authored" ? { oit: authored("oit", "Old") } : {};
    await withCourse("oit", { oit: response("Old") }, async page => {
      await page.getByText(source === "authored" ? "Authored Old?" : "Synthetic Old question?", { exact: false }).first().waitFor();
      await page.evaluate(source => {
        const state = window as any;
        state.__ignoreAbort = true;
        if (source === "authored") state.__contentMode = "hold"; else state.__mode = "hold";
        window.dispatchEvent(new Event("focus"));
      }, source);
      await expect.poll(() => page.evaluate(source => (window as any)[source === "authored" ? "__contentPending" : "__pending"].length, source)).toBeGreaterThanOrEqual(1);
      const oldPending = await page.evaluate(source => (window as any)[source === "authored" ? "__contentPending" : "__pending"].length, source);
      await page.evaluate(({ source, nextContent, nextQuestions }) => {
        const state = window as any;
        state.__contentResponses.oit = nextContent;
        state.__responses.oit = nextQuestions;
        if (source === "fallback") state.__contentMode = "success";
        // The hint carries only a nonce, and the stored token is unchanged.
        window.dispatchEvent(new StorageEvent("storage", { key: "echelon.identity-change.event", newValue: "a".repeat(32) }));
        state.__hiddenImmediately = !document.body.textContent?.includes("Old");
      }, { source, nextContent: source === "authored" ? authored("oit", "New", true) : { courseKey: "oit", available: false, locked: true, version: null, examples: [] }, nextQuestions: response("New", true) });
      expect(await page.evaluate(() => (window as any).__hiddenImmediately)).toBe(true);
      await expect.poll(() => page.evaluate(source => (window as any)[source === "authored" ? "__contentPending" : "__pending"].length, source)).toBeGreaterThan(oldPending);
      await page.evaluate(({ source, oldPending }) => (window as any)[source === "authored" ? "__contentPending" : "__pending"].splice(0, oldPending).forEach((release: () => void) => release()), { source, oldPending });
      await page.getByRole("status").filter({ hasText: /loading/i }).waitFor();
      expect(await page.getByText(/Old/).count()).toBe(0);
      await page.evaluate(source => {
        const state = window as any;
        state.__contentMode = "success"; state.__mode = "success";
        state[source === "authored" ? "__contentPending" : "__pending"].splice(0).forEach((release: () => void) => release());
      }, source);
      await page.getByText(source === "authored" ? "Authored New?" : "Synthetic New question?", { exact: false }).first().waitFor();
      await page.getByText(/available free preview/i).waitFor();
      expect((await contentCalls(page)).every(input => input.accessToken === "same-token")).toBe(true);
      if (source === "fallback") expect((await calls(page)).every(input => input.accessToken === "same-token")).toBe(true);
    }, "", false, content, "success", true, "same-token");
  });

  it.each(["echelon.logout.event", "echelon_access_token", "manus-runtime-user-info", "echelon_trial_email", "echelon_subscription_email", null])(
    "treats storage hint %s as a recheck, not an identity assertion", async key => {
      await withCourse("oit", {}, async page => {
        await page.getByText("Authored Old?").waitFor();
        const before = (await contentCalls(page)).length;
        await page.evaluate(({ key, next }) => {
          const state = window as any;
          state.__contentResponses.oit = next;
          state.__contentMode = "hold";
          // An untrusted synthetic notification is only a reason to recheck.
          window.dispatchEvent(new StorageEvent("storage", { key, newValue: "untrusted" }));
        }, { key, next: authored("oit", "Verified preview", true) });
        await expect.poll(async () => (await contentCalls(page)).length).toBeGreaterThan(before);
        await page.getByRole("status").filter({ hasText: /loading/i }).waitFor();
        expect(await page.locator("body").evaluate(body => body.textContent?.includes("Authored Old"))).toBe(false);
        expect(await page.getByText("Authored Verified preview?").count()).toBe(0);
        await page.evaluate(() => { const state = window as any; state.__contentMode = "success"; state.__contentPending.splice(0).forEach((release: () => void) => release()); });
        await page.getByText("Authored Verified preview?").waitFor();
        await page.getByText(/available free preview/i).waitFor();
      }, "", false, { oit: authored("oit", "Old") });
    });

  it.each(["authored", "fallback"])("ignores pre-notification %s responses after a cross-tab identity hint", async source => {
    const content = source === "authored" ? { oit: authored("oit", "Old") } : {};
    await withCourse("oit", { oit: response("Old") }, async page => {
      await page.getByText(source === "authored" ? "Authored Old?" : "Synthetic Old question?", { exact: false }).first().waitFor();
      await page.evaluate(source => {
        const state = window as any;
        state.__ignoreAbort = true;
        if (source === "authored") state.__contentMode = "hold";
        else state.__mode = "hold";
        window.dispatchEvent(new Event("focus"));
      }, source);
      await expect.poll(() => page.evaluate(source => (window as any)[source === "authored" ? "__contentPending" : "__pending"].length, source)).toBeGreaterThanOrEqual(1);
      const oldPending = await page.evaluate(source => (window as any)[source === "authored" ? "__contentPending" : "__pending"].length, source);
      await page.evaluate(({ source, nextContent, nextQuestions }) => {
        const state = window as any;
        state.__contentResponses.oit = nextContent;
        state.__responses.oit = nextQuestions;
        // Keep the authored request held only in authored mode. The fallback
        // parent must finish its new access check before its child can remount.
        if (source === "fallback") state.__contentMode = "success";
        window.dispatchEvent(new StorageEvent("storage", { key: "echelon_trial_email", newValue: "untrusted" }));
      }, { source, nextContent: source === "authored" ? authored("oit", "New", true) : { courseKey: "oit", available: false, locked: true, version: null, examples: [] }, nextQuestions: response("New", true) });
      await expect.poll(() => page.evaluate(source => (window as any)[source === "authored" ? "__contentPending" : "__pending"].length, source)).toBeGreaterThan(oldPending);
      await page.evaluate(({ source, oldPending }) => (window as any)[source === "authored" ? "__contentPending" : "__pending"].splice(0, oldPending).forEach((release: () => void) => release()), { source, oldPending });
      await page.getByRole("status").filter({ hasText: /loading/i }).waitFor();
      expect(await page.locator("body").evaluate(body => body.textContent?.includes("Old"))).toBe(false);
      await page.evaluate(source => {
        const state = window as any;
        state.__contentMode = "success"; state.__mode = "success";
        state[source === "authored" ? "__contentPending" : "__pending"].splice(0).forEach((release: () => void) => release());
      }, source);
      await page.getByText(source === "authored" ? "Authored New?" : "Synthetic New question?", { exact: false }).first().waitFor();
      expect(await page.locator("body").evaluate(body => body.textContent?.includes("Old"))).toBe(false);
    }, "", false, content);
  });

  it("renders the canonical authored working set, including its real answer and locked preview, without requesting legacy questions", async () => {
    await withCourse("class1-ww", { "class1-wastewater": response("Legacy") }, async page => {
      await page.getByText("Authored Preview?").waitFor();
      await page.getByText(/available free preview/i).waitFor();
      expect(await calls(page)).toEqual([]);
      expect((await contentCalls(page)).every(input => input.courseKey === "class1-ww" && input.accessToken === undefined)).toBe(true);
      await page.getByRole("button", { name: "No", exact: true }).click();
      await page.getByText("Authored Preview explanation.").waitFor();
      expect(await page.getByText("Correct", { exact: true }).count()).toBe(1);
      expect(await page.getByText(/Synthetic Legacy/).count()).toBe(0);
    }, "", false, { "class1-ww": authored("class1-ww", "Preview", true) });
  });

  it("renders and grades a server-valid named before/after activity", async () => {
    await withCourse("oit", { oit: response("Legacy") }, async page => {
      await page.getByText("Synthetic Named: which stage comes earlier?").waitFor();
      await page.getByRole("button", { name: "Screening", exact: true }).click();
      await page.getByText("Synthetic Named explanation.").waitFor();
      expect(await page.getByText("Correct", { exact: true }).count()).toBe(1);
      expect(await calls(page)).toEqual([]);
    }, "", false, { oit: namedContent("Named") });
  });

  it("continues to grade the legacy before/after form", async () => {
    const legacy = { id: "legacy", mode: "before-after", prompt: "Does this stage occur earlier?", correctAnswer: "before", explanation: "Synthetic legacy explanation." };
    await withCourse("oit", {}, async page => {
      await page.getByText(legacy.prompt).waitFor();
      await page.getByRole("button", { name: "Before", exact: true }).click();
      await page.getByText(legacy.explanation).waitFor();
      expect(await page.getByText("Correct", { exact: true }).count()).toBe(1);
    }, "", false, { oit: { ...namedContent("Legacy"), examples: [legacy] } });
  });

  it("does not confuse a short answer label with a substring in another word", async () => {
    const short = { ...named("Short"), prompt: "Which comes earlier in the phase?", options: ["pH", "DO"], correctAnswer: "pH" };
    await withCourse("oit", {}, async page => {
      await heading(page, short.prompt).waitFor();
      expect(await page.getByRole("group", { name: "Answer choices" }).getByRole("button").allTextContents()).toEqual(["pH", "DO"]);
      expect(await page.getByRole("alert").count()).toBe(0);
      await page.getByRole("button", { name: "pH", exact: true }).click();
      await page.getByText(short.explanation).waitFor();
      expect(await page.getByText("Correct", { exact: true }).count()).toBe(1);
      expect(await calls(page)).toEqual([]);
    }, "", false, { oit: { ...namedContent("Short"), examples: [short] } });
    await withCourse("oit", {}, async page => {
      await page.getByRole("button", { name: "DO", exact: true }).click();
      await page.getByText(`The correct answer is pH. ${short.explanation}`).waitFor();
      expect(await page.getByText("Not quite", { exact: true }).count()).toBe(1);
    }, "", false, { oit: { ...namedContent("Short"), examples: [short] } });
    const standalone = { ...short, prompt: "Which comes earlier: (pH)?" };
    await withCourse("oit", { oit: response("Legacy") }, async page => {
      await page.getByRole("alert").filter({ hasText: "We couldn’t load practice activities" }).waitFor();
      expect(await page.getByRole("group", { name: "Answer choices" }).count()).toBe(0);
      expect(await page.getByText(standalone.prompt).count()).toBe(0);
      expect(await calls(page)).toEqual([]);
    }, "", false, { oit: { ...namedContent("Short"), examples: [standalone] } });
  });

  it("posts the token for named content and removes paid content across an identity change", async () => {
    await withCourse("oit", { oit: response("Legacy") }, async page => {
      await page.getByText("Synthetic Paid: which stage comes earlier?").waitFor();
      await page.getByRole("button", { name: "Screening", exact: true }).click();
      await page.getByText("Synthetic Paid explanation.").waitFor();
      await page.evaluate(next => {
        const state = window as any;
        state.__contentResponses.oit = next;
        state.__contentMode = "hold";
        localStorage.setItem("echelon_access_token", "synthetic-new-token");
        window.dispatchEvent(new StorageEvent("storage", { key: "echelon_access_token" }));
      }, namedContent("Preview", true));
      await expect.poll(async () => (await contentCalls(page)).some(input => input.accessToken === "synthetic-new-token")).toBe(true);
      await page.getByRole("status").filter({ hasText: /loading/i }).waitFor();
      expect(await page.locator("body").evaluate(body => body.textContent?.includes("Synthetic Paid"))).toBe(false);
      const requests = await page.evaluate(() => (window as any).__transportCalls as Array<{url: string; method: string; body: string}>);
      const tokenRequest = requests.find(request => request.body.includes("synthetic-new-token"));
      expect(tokenRequest).toBeDefined();
      expect(tokenRequest?.method).toBe("POST");
      expect(tokenRequest?.url).not.toContain("synthetic-new-token");
      expect(JSON.parse(tokenRequest!.body)["0"].json).toEqual({ courseKey: "oit", accessToken: "synthetic-new-token" });
      await page.evaluate(() => { const state = window as any; state.__contentMode = "success"; state.__contentPending.splice(0).forEach((release: () => void) => release()); });
      await page.getByText("Synthetic Preview: which stage comes earlier?").waitFor();
      await page.getByText(/available free preview/i).waitFor();
      expect(await page.locator("body").evaluate(body => body.textContent?.includes("Synthetic Paid"))).toBe(false);
      expect(await calls(page)).toEqual([]);
    }, "", false, { oit: namedContent("Paid") }, "success", true);
  }, 60000);

  it("does not fall back when an available package contains no preview examples", async () => {
    await withCourse("oit", { oit: response("Legacy") }, async page => {
      await page.getByText(/no interactive activities are available/i).waitFor();
      expect(await calls(page)).toEqual([]);
    }, "", false, { oit: { ...authored("oit", "Empty", true), examples: [] } });
  });

  it.each(["error", "unauthorized"])("does not fall back for authored-content %s", async mode => {
    await withCourse("oit", { oit: response("Legacy") }, async page => {
      await page.getByRole("alert").waitFor();
      expect(await calls(page)).toEqual([]);
      expect(await page.getByText(/Synthetic Legacy/).count()).toBe(0);
    }, "", false, {}, mode);
  });

  it.each([
    ["wrong canonical course", { ...authored("class1-water", "Wrong") }],
    ["missing availability", { courseKey: "oit", locked: true, version: null, examples: [] }],
    ["inconsistent unavailable", { courseKey: "oit", available: false, locked: true, version: null, examples: [{ id: "x" }] }],
    ["missing correct answer", { ...authored("oit", "Broken"), examples: [{ id: "x", mode: "rapid-swipe", prompt: "Bad", explanation: "Bad" }] }],
    ["invalid option reference", { ...authored("oit", "Broken"), examples: [{ id: "x", mode: "cause-effect", prompt: "Bad", options: [{ id: "a", label: "A" }, { id: "b", label: "B" }], correctOptionId: "c", explanation: "Bad" }] }],
    ["named missing answer", { ...namedContent("Bad"), examples: [{ ...named("Bad"), correctAnswer: undefined }] }],
    ["named wrong answer", { ...namedContent("Bad"), examples: [{ ...named("Bad"), correctAnswer: "Other" }] }],
    ["named missing option", { ...namedContent("Bad"), examples: [{ ...named("Bad"), options: ["Screening"] }] }],
    ["named extra option", { ...namedContent("Bad"), examples: [{ ...named("Bad"), options: ["Screening", "Disinfection", "Other"] }] }],
    ["named blank option", { ...namedContent("Bad"), examples: [{ ...named("Bad"), options: ["Screening", "   "] }] }],
    ["named non-string option", { ...namedContent("Bad"), examples: [{ ...named("Bad"), options: ["Screening", 1] }] }],
    ["named duplicate normalized options", { ...namedContent("Bad"), examples: [{ ...named("Bad"), options: ["Screening", "  SCREENING "] }] }],
    ["named unicode-equivalent options", { ...namedContent("Bad"), examples: [{ ...named("Bad"), options: ["Screening", "Ｓｃｒｅｅｎｉｎｇ"] }] }],
    ["named renderer-incompatible answer", { ...namedContent("Bad"), examples: [{ ...named("Bad"), correctAnswer: "Ｓｃｒｅｅｎｉｎｇ" }] }],
    ["named leaked option in instruction", { ...namedContent("Bad"), examples: [{ ...named("Bad"), instruction: "Consider Ｓｃｒｅｅｎｉｎｇ." }] }],
    ["named leaked short label", { ...namedContent("Bad"), examples: [{ ...named("Bad"), options: ["pH", "DO"], correctAnswer: "pH", prompt: "Which pH stage comes earlier?" }] }],
    ["named answer hint", { ...namedContent("Bad"), examples: [{ ...named("Bad"), prompt: "Choose the first option." }] }],
    ["legacy answer hint", { ...namedContent("Bad"), examples: [{ id: "x", mode: "before-after", prompt: "The answer is before.", correctAnswer: "before", explanation: "Bad" }] }],
    ["named unexpected key", { ...namedContent("Bad"), examples: [{ ...named("Bad"), extra: true }] }],
  ])("fails closed for malformed or denied content: %s", async (_reason, data) => {
    await withCourse("oit", { oit: response("Legacy") }, async page => {
      await page.getByRole("alert").waitFor();
      expect(await calls(page)).toEqual([]);
      expect(await page.getByText(/Synthetic Legacy/).count()).toBe(0);
    }, "", false, { oit: data });
  });

  it("rechecks authored content and unmounts answered paid content while access changes", async () => {
    await withCourse("oit", { oit: response("Legacy") }, async page => {
      await page.getByText("Authored Paid?").waitFor();
      await page.getByRole("button", { name: "No", exact: true }).click();
      await page.getByText("Authored Paid explanation.").waitFor();
      await page.evaluate(next => {
        const state = window as any;
        state.__contentResponses.oit = next;
        state.__contentMode = "hold";
        localStorage.setItem("echelon_access_token", "new-token");
        window.dispatchEvent(new StorageEvent("storage", { key: "echelon_access_token" }));
      }, authored("oit", "New preview", true));
      await expect.poll(async () => (await contentCalls(page)).some(input => input.accessToken === "new-token")).toBe(true);
      await page.getByRole("status").filter({ hasText: /loading/i }).waitFor();
      expect(await page.getByText(/Authored Paid/).count()).toBe(0);
      await page.evaluate(() => { const state = window as any; state.__contentMode = "success"; state.__contentPending.splice(0).forEach((release: () => void) => release()); });
      await page.getByText("Authored New preview?").waitFor();
      await page.getByText(/available free preview/i).waitFor();
      expect(await calls(page)).toEqual([]);
      expect(await page.getByText(/Authored Paid/).count()).toBe(0);
    }, "", false, { oit: authored("oit", "Paid") });
  });

  it("ignores a cancelled authored POST even when the transport resolves late", async () => {
    await withCourse("oit", { oit: response("Legacy") }, async page => {
      await page.getByText("Authored Old?").waitFor();
      await page.evaluate(() => {
        const state = window as any;
        state.__contentMode = "hold";
        state.__ignoreAbort = true;
        window.dispatchEvent(new Event("focus"));
      });
      await expect.poll(() => page.evaluate(() => (window as any).__contentPending.length)).toBe(1);
      await page.evaluate(next => {
        const state = window as any;
        state.__contentResponses.oit = next;
        state.__client.setQueryData([["auth", "me"], { type: "query" }], { id: "new-identity" });
      }, authored("oit", "New", true));
      await expect.poll(() => page.evaluate(() => (window as any).__contentPending.length)).toBe(2);
      await page.evaluate(() => (window as any).__contentPending.shift()());
      await page.getByRole("status").filter({ hasText: /loading/i }).waitFor();
      expect(await page.getByText(/Authored Old/).count()).toBe(0);
      expect(await page.getByText(/Authored New/).count()).toBe(0);
      await page.evaluate(() => { const state = window as any; state.__contentMode = "success"; state.__contentPending.splice(0).forEach((release: () => void) => release()); });
      await page.getByText("Authored New?").waitFor();
      expect(await calls(page)).toEqual([]);
    }, "", false, { oit: authored("oit", "Old") });
  });

  it("keeps authored content hidden offline and reconnects with the latest token", async () => {
    await withCourse("oit", { oit: response("Legacy") }, async page => {
      await page.getByText("Authored Paid?").waitFor();
      await page.evaluate(next => {
        const state = window as any;
        state.__setOnline(false);
        state.__contentResponses.oit = next;
        window.dispatchEvent(new Event("focus"));
      }, authored("oit", "Reconnected", true));
      await page.getByRole("alert").filter({ hasText: /offline/i }).waitFor();
      expect(await page.getByText(/Authored Paid/).count()).toBe(0);
      await page.evaluate(() => { localStorage.setItem("echelon_access_token", "reconnect-token"); (window as any).__setOnline(true); });
      await page.getByText("Authored Reconnected?").waitFor();
      expect((await contentCalls(page)).some(input => input.accessToken === "reconnect-token")).toBe(true);
      expect(await calls(page)).toEqual([]);
    }, "", false, { oit: authored("oit", "Paid") });
  });

  it("resets authored answers on a same-identity successful recheck", async () => {
    await withCourse("oit", {}, async page => {
      await page.getByText("Authored Stable?").waitFor();
      await page.getByRole("button", { name: "No", exact: true }).click();
      await page.getByText("Authored Stable explanation.").waitFor();
      const before = (await contentCalls(page)).length;
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await expect.poll(async () => (await contentCalls(page)).length).toBeGreaterThan(before);
      await expect.poll(() => page.getByRole("button", { name: "No", exact: true }).isEnabled()).toBe(true);
      expect(await page.getByText("Authored Stable explanation.").count()).toBe(0);
    }, "", false, { oit: authored("oit", "Stable") });
  });

  it("revokes legacy fallback immediately when an authored recheck is denied", async () => {
    await withCourse("oit", { oit: response("Legacy") }, async page => {
      await page.getByText("Synthetic Legacy question?", { exact: false }).first().waitFor();
      const before = (await calls(page)).length;
      await page.evaluate(() => { (window as any).__contentMode = "unauthorized"; window.dispatchEvent(new Event("focus")); });
      await page.getByRole("alert").waitFor();
      expect(await page.getByText(/Synthetic Legacy/).count()).toBe(0);
      // A legacy refetch may have already started on the same focus event, but its result cannot be displayed.
      expect((await calls(page)).length).toBeGreaterThanOrEqual(before);
    });
  });

  it.each([
    ["class1-ww", "class1-wastewater", "Class 1 Wastewater Treatment", "Ontario"],
    ["wpi-class1-water-coll", "wpi-class1-wastewater-coll", "WPI Class I Wastewater Collection", "Western"],
    ["us-class1-water", "us-class1-water", "US Class I Water Treatment", "US"],
  ])("requests the registry bank for %s and renders only its returned content", async (course, bank, title, label) => {
    await withCourse(course, { [bank]: response(label), "class1-water": response("Other") }, async page => {
      await heading(page, title).waitFor();
      await page.getByText(`Synthetic ${label} question?`, { exact: false }).first().waitFor();
      const requested = await calls(page);
      expect(requested.length).toBeGreaterThan(0);
      for (const input of requested) {
        expect(input).toEqual({ bankKey: bank, accessToken: undefined, previewSurface: "practice" });
      }
      expect(await page.getByText("Synthetic Other question?", { exact: false }).count()).toBe(0);
      expect(await page.getByText(/free preview/i).count()).toBe(0);
    });
  });

  it("posts the fallback token in the body and hides paid questions when entitlement expires", async () => {
    await withCourse("oit", { oit: response("Paid") }, async page => {
      await page.getByText("Synthetic Paid question?", { exact: false }).first().waitFor();
      await page.evaluate(() => {
        const state = window as any;
        state.__responses.oit = { questions: [{ question: "Synthetic Expired preview question?", options: ["Synthetic A", "Synthetic B"], correctIndex: 0, explanation: "Preview." }], locked: true };
        state.__mode = "hold";
        localStorage.setItem("echelon_access_token", "synthetic-fallback-token");
        window.dispatchEvent(new StorageEvent("storage", { key: "echelon_access_token" }));
      });
      await expect.poll(async () => (await calls(page)).some(input => input.accessToken === "synthetic-fallback-token")).toBe(true);
      await page.getByRole("status").filter({ hasText: /loading/i }).waitFor();
      expect(await page.getByText(/Synthetic Paid/).count()).toBe(0);
      const requests = await page.evaluate(() => (window as any).__transportCalls as Array<{url: string; method: string; body: string}>);
      const fallback = requests.filter(request => request.url.includes("quiz.getInteractiveQuestions"));
      expect(fallback.length).toBeGreaterThan(0);
      expect(requests.every(request => !request.url.includes("synthetic-fallback-token"))).toBe(true);
      const tokenRequest = fallback.find(request => request.body.includes("synthetic-fallback-token"));
      expect(tokenRequest?.method).toBe("POST");
      expect(tokenRequest?.url).not.toContain("input=");
      expect(JSON.parse(tokenRequest!.body)["0"].json).toEqual({ bankKey: "oit", accessToken: "synthetic-fallback-token", previewSurface: "practice" });
      await page.evaluate(() => { const state = window as any; state.__mode = "success"; state.__pending.splice(0).forEach((release: () => void) => release()); });
      await page.getByText("Synthetic Expired preview question?", { exact: false }).first().waitFor();
      await page.getByText(/available free preview/i).waitFor();
      expect(await page.getByText(/Synthetic Paid/).count()).toBe(0);
    }, "", false, {}, "success", true);
  }, 60000);

  it("uses only the locked preview delivered by the mock server", async () => {
    await withCourse("class1-water", { "class1-water": response("Preview", true), "class1-wastewater": response("Private other course") }, async page => {
      await page.getByText(/available free preview/i).waitFor();
      await page.getByText("Synthetic Preview question?", { exact: false }).first().waitFor();
      expect(await page.getByText("Synthetic Private other course", { exact: false }).count()).toBe(0);
      expect((await calls(page)).every(input => input.bankKey === "class1-water")).toBe(true);
    });
  });

  it("switches courses without showing the previous course's questions", async () => {
    await withCourse("class1-water", { "class1-water": response("First"), "class1-wastewater": response("Second") }, async page => {
      await page.getByText("Synthetic First question?", { exact: false }).first().waitFor();
      await page.evaluate(() => (window as any).__setRoute("class1-ww"));
      await page.getByText("Synthetic Second question?", { exact: false }).first().waitFor();
      expect(await page.getByText("Synthetic First question?", { exact: false }).count()).toBe(0);
      expect((await calls(page)).map(input => input.bankKey)).toContain("class1-wastewater");
    });
  });

  it.each(["not-a-real-course", "class1", "class1-wastewater", "electrician-309a-demo"])("fails closed for unknown or noncanonical key %s", async course => {
    await withCourse(course, {}, async page => {
      await heading(page, "Course unavailable").waitFor();
      expect(await calls(page)).toEqual([]);
      expect(await contentCalls(page)).toEqual([]);
      expect(await page.getByRole("link", { name: "← Home" }).getAttribute("href")).toBe("/");
    });
  });

  it("does not query the bank for the 309A beta", async () => {
    await withCourse("electrician-309a", {}, async page => {
      await heading(page, "Ontario 309A Construction Electrician").waitFor();
      await page.getByText(/interactive practice is not available for the 309A beta/i).waitFor();
      expect(await calls(page)).toEqual([]);
      expect(await contentCalls(page)).toEqual([]);
      expect(await page.getByRole("link", { name: /back to course practice/i }).getAttribute("href")).toBe("/electrician-309a");
    });
  });

  it("shows a safe empty state for an empty or unusable working set", async () => {
    await withCourse("oit", { oit: { locked: true, questions: [{ question: "Synthetic invalid" }] } }, async page => {
      await page.getByText(/no interactive activities are available/i).waitFor();
      expect(await page.getByText("Synthetic invalid", { exact: false }).count()).toBe(0);
    });
  });

  it("shows an error and can retry without rendering stale authorized content", async () => {
    await withCourse("oit", { oit: response("Old") }, async page => {
      await page.getByText("Synthetic Old question?", { exact: false }).first().waitFor();
      await page.evaluate(() => {
        const state = window as any;
        state.__mode = "error";
        void state.__client.invalidateQueries();
      });
      await page.getByRole("alert").waitFor();
      expect(await page.getByText("Synthetic Old question?", { exact: false }).count()).toBe(0);
      await page.evaluate(() => {
        const state = window as any;
        state.__mode = "success";
        state.__responses.oit = { questions: [{ question: "Synthetic Recovered question?", options: ["Synthetic A", "Synthetic B"], correctIndex: 0, explanation: "Synthetic recovery." }], locked: true };
      });
      await page.getByRole("button", { name: "Try again" }).click();
      await page.getByText("Synthetic Recovered question?", { exact: false }).first().waitFor();
      await page.getByText(/available free preview/i).waitFor();
    });
  });

  it("shows an actionable offline state on initial pause and retries with the current token", async () => {
    await withCourse("oit", { oit: response("Offline recovery") }, async page => {
      await page.getByRole("alert").filter({ hasText: /offline.*check your connection/i }).waitFor();
      expect(await calls(page)).toEqual([]);
      expect(await page.getByText(/loading practice activities/i).count()).toBe(0);
      await page.evaluate(() => localStorage.setItem("echelon_access_token", "new-offline-token"));
      await page.getByRole("button", { name: "Try again" }).click();
      await page.getByRole("alert").filter({ hasText: /offline/i }).waitFor();
      expect(await calls(page)).toEqual([]);
      await page.evaluate(() => (window as any).__setOnline(true));
      await page.getByText("Synthetic Offline recovery question?", { exact: false }).first().waitFor();
      expect((await calls(page)).every(input => input.accessToken === "new-offline-token")).toBe(true);
    }, "", true);
  });

  it("hides cached activities during an offline recheck and reauthorizes on reconnect with the latest token", async () => {
    await withCourse("oit", { oit: response("Cached paid") }, async page => {
      await page.getByText("Synthetic Cached paid question?", { exact: false }).first().waitFor();
      const before = (await calls(page)).length;
      await page.evaluate(() => {
        const state = window as any;
        state.__mode = "hold";
        state.__ignoreAbort = true;
        window.dispatchEvent(new Event("focus"));
      });
      await expect.poll(async () => (await calls(page)).length).toBeGreaterThan(before);
      await page.evaluate(() => {
        const state = window as any;
        state.__setOnline(false);
        state.__responses.oit = { questions: [{ question: "Synthetic Reconnected question?", options: ["Synthetic A", "Synthetic B"], correctIndex: 0, explanation: "Synthetic recovery." }], locked: true };
        window.dispatchEvent(new Event("focus"));
      });
      await page.getByRole("alert").filter({ hasText: /offline/i }).waitFor();
      expect(await page.locator("body").evaluate(body => body.textContent?.includes("Synthetic Cached paid question?"))).toBe(false);
      const beforeReconnect = (await calls(page)).length;
      await page.evaluate(() => {
        localStorage.setItem("echelon_access_token", "reconnected-token"); // No storage event in the same tab.
        (window as any).__setOnline(true);
      });
      await expect.poll(async () => (await calls(page)).some(input => input.accessToken === "reconnected-token")).toBe(true);
      expect((await calls(page)).slice(beforeReconnect).every(input => input.accessToken === "reconnected-token")).toBe(true);
      await page.evaluate(() => { (window as any).__pending.shift()(); }); // Old request ignores abort.
      await page.getByRole("status").filter({ hasText: /loading/i }).waitFor();
      expect(await page.getByText("Synthetic Cached paid question?", { exact: false }).count()).toBe(0);
      await page.evaluate(() => {
        const state = window as any;
        state.__mode = "success";
        state.__pending.splice(0).forEach((release: () => void) => release());
      });
      await page.getByText("Synthetic Reconnected question?", { exact: false }).first().waitFor();
      await page.getByText(/available free preview/i).waitFor();
      expect(await page.getByText("Synthetic Cached paid question?", { exact: false }).count()).toBe(0);
    });
  });

  it("rereads a changed token on error retry rather than refetching the old key", async () => {
    await withCourse("oit", { oit: response("After retry") }, async page => {
      await page.getByText("Synthetic After retry question?", { exact: false }).first().waitFor();
      await page.evaluate(() => {
        (window as any).__mode = "error";
        window.dispatchEvent(new Event("focus"));
      });
      await page.getByRole("alert").waitFor();
      const before = (await calls(page)).length;
      await page.evaluate(() => {
        localStorage.setItem("echelon_access_token", "retry-token");
        (window as any).__mode = "success";
      });
      await page.getByRole("button", { name: "Try again" }).click();
      await page.getByText("Synthetic After retry question?", { exact: false }).first().waitFor();
      expect((await calls(page)).slice(before).length).toBeGreaterThan(0);
      expect((await calls(page)).slice(before).every(input => input.accessToken === "retry-token")).toBe(true);
    });
  });

  it("reauthorizes after a token change and replaces paid content with the new preview", async () => {
    await withCourse("oit", { oit: response("Paid") }, async page => {
      await page.getByText("Synthetic Paid question?", { exact: false }).first().waitFor();
      await page.evaluate(() => {
        const state = window as any;
        state.__responses.oit = { questions: [{ question: "Synthetic New preview question?", options: ["Synthetic A", "Synthetic B"], correctIndex: 0, explanation: "Synthetic preview." }], locked: true };
        state.__mode = "hold";
        localStorage.setItem("echelon_access_token", "synthetic-new-identity");
        window.dispatchEvent(new StorageEvent("storage", { key: "echelon_access_token" }));
      });
      await expect.poll(async () => (await calls(page)).some(input => input.accessToken === "synthetic-new-identity")).toBe(true);
      await page.getByRole("status").filter({ hasText: /loading practice activities/i }).waitFor();
      expect(await page.getByText("Synthetic Paid question?", { exact: false }).count()).toBe(0);
      await page.evaluate(() => {
        const state = window as any;
        state.__mode = "success";
        state.__pending.splice(0).forEach((release: () => void) => release());
      });
      await page.getByText("Synthetic New preview question?", { exact: false }).first().waitFor();
      await page.getByText(/available free preview/i).waitFor();
      expect(await page.getByText("Synthetic Paid question?", { exact: false }).count()).toBe(0);
    });
  });

  it("rechecks the same token after a successful identity query", async () => {
    await withCourse("oit", { oit: response("Prior identity") }, async page => {
      await page.getByText("Synthetic Prior identity question?", { exact: false }).first().waitFor();
      const before = (await calls(page)).length;
      await page.evaluate(() => {
        const state = window as any;
        state.__responses.oit = { questions: [{ question: "Synthetic Current identity question?", options: ["Synthetic A", "Synthetic B"], correctIndex: 0, explanation: "Synthetic identity." }], locked: true };
        state.__mode = "hold";
        // This is the same cache event a successful auth.me query produces;
        // it simulates a cookie identity change without an access-token change.
        state.__client.setQueryData([["auth", "me"], { type: "query" }], { id: "synthetic-identity" });
      });
      await expect.poll(async () => (await calls(page)).length).toBeGreaterThan(before);
      await page.getByRole("status").filter({ hasText: /loading practice activities/i }).waitFor();
      expect(await page.getByText("Synthetic Prior identity question?", { exact: false }).count()).toBe(0);
      await page.evaluate(() => {
        const state = window as any;
        state.__mode = "success";
        state.__pending.splice(0).forEach((release: () => void) => release());
      });
      await page.getByText("Synthetic Current identity question?", { exact: false }).first().waitFor();
      await page.getByText(/available free preview/i).waitFor();
    });
  });

  it("preserves the local answer on an ordinary same-course rerender", async () => {
    await withCourse("oit", { oit: response("Session") }, async page => {
      await page.getByText("Synthetic Session question?", { exact: false }).first().waitFor();
      await page.getByRole("button", { name: "Yes", exact: true }).click();
      await page.getByText("Synthetic Session explanation.", { exact: false }).waitFor();
      // Change only navigation context; this is not an entitlement refresh.
      await page.evaluate(() => (window as any).__setRoute("oit", "province=ON"));
      await expect.poll(() => page.getByRole("link", { name: /back to course practice/i }).getAttribute("href")).toBe("/quiz?province=ON");
      expect(await page.getByText("Synthetic Session explanation.", { exact: false }).count()).toBe(1);
      expect(await page.getByRole("button", { name: "Yes", exact: true }).isDisabled()).toBe(true);
    });
  });

  it.each(["focus", "periodic", "invalidation"])("removes the drill and resets answered state through a %s recheck", async trigger => {
    await withCourse("oit", { oit: identified("Stable") }, async page => {
      await page.getByText("Synthetic Stable question?", { exact: false }).first().waitFor();
      await page.getByRole("button", { name: "Yes", exact: true }).click();
      await page.getByText("Synthetic Stable explanation.", { exact: false }).waitFor();
      const before = (await calls(page)).length;
      await page.evaluate(({ trigger, next }) => {
        const state = window as any;
        state.__mode = "hold";
        state.__responses.oit = next; // Even an unchanged working set must reset.
        if (trigger === "focus") window.dispatchEvent(new Event("focus"));
        else if (trigger === "periodic") state.__periodic();
        else void state.__client.invalidateQueries();
      }, { trigger, next: identified("Stable", "a".repeat(64), 2) });
      await expect.poll(async () => (await calls(page)).length).toBeGreaterThan(before);
      await page.getByRole("status").filter({ hasText: /loading practice activities/i }).waitFor();
      // Check the DOM, not merely visibility or the accessibility tree.
      expect(await page.locator("body").evaluate(body => body.textContent?.includes("Synthetic Stable question?"))).toBe(false);
      expect(await page.locator("body").evaluate(body => body.textContent?.includes("Synthetic Stable explanation."))).toBe(false);
      expect(await page.getByRole("button", { name: "Yes", exact: true }).count()).toBe(0);
      await page.evaluate(() => {
        const state = window as any;
        state.__mode = "success";
        state.__pending.splice(0).forEach((release: () => void) => release());
      });
      await expect.poll(() => page.getByRole("button", { name: "Yes", exact: true }).isEnabled()).toBe(true);
      expect(await page.getByText("Synthetic Stable explanation.", { exact: false }).count()).toBe(0);
    });
  });

  it("resets answered state even if a recheck resolves without a visible loading frame", async () => {
    await withCourse("oit", { oit: identified("Fast") }, async page => {
      await page.getByText("Synthetic Fast question?", { exact: false }).first().waitFor();
      await page.getByRole("button", { name: "Yes", exact: true }).click();
      await page.getByText("Synthetic Fast explanation.", { exact: false }).waitFor();
      const before = (await calls(page)).length;
      await page.evaluate(() => { void (window as any).__client.invalidateQueries(); });
      await expect.poll(async () => (await calls(page)).length).toBeGreaterThan(before);
      await expect.poll(() => page.getByRole("button", { name: "Yes", exact: true }).isEnabled()).toBe(true);
      expect(await page.getByText("Synthetic Fast explanation.", { exact: false }).count()).toBe(0);
    });
  });

  it("removes the prior working set when a recheck returns no access", async () => {
    await withCourse("oit", { oit: response("Paid") }, async page => {
      await page.getByText("Synthetic Paid question?", { exact: false }).first().waitFor();
      await page.evaluate(() => {
        const state = window as any;
        state.__responses.oit = { questions: [], locked: true };
        window.dispatchEvent(new Event("focus"));
      });
      await page.getByText(/no interactive activities are available/i).waitFor();
      expect(await page.locator("body").evaluate(body => body.textContent?.includes("Synthetic Paid question?"))).toBe(false);
    });
  });

  it.each<[string, MockResponse]>([
    ["identity change", identified("Stable", "b".repeat(64))],
    ["working-set change", identified("Changed")],
    ["access downgraded", identified("Stable", "a".repeat(64), 2, true)],
    ["missing identity receipt", response("Stable")],
    ["anonymous identity", identified("Stable", "84983c60f7daadc1cb8698621f802c0d9f9a3c3c295c810748fb048115c186ec")],
  ])("discards answered state on %s", async (_reason, next) => {
    await withCourse("oit", { oit: identified("Stable") }, async page => {
      await page.getByText("Synthetic Stable question?", { exact: false }).first().waitFor();
      await page.getByRole("button", { name: "Yes", exact: true }).click();
      const before = (await calls(page)).length;
      await page.evaluate(nextResponse => {
        const state = window as any;
        state.__responses.oit = nextResponse;
        state.__mode = "hold";
        window.dispatchEvent(new Event("focus"));
      }, next);
      await expect.poll(async () => (await calls(page)).length).toBeGreaterThan(before);
      await page.getByRole("status").filter({ hasText: /loading practice activities/i }).waitFor();
      await page.evaluate(() => {
        const state = window as any;
        state.__mode = "success";
        state.__pending.splice(0).forEach((release: () => void) => release());
      });
      await expect.poll(() => page.getByRole("button", { name: "Yes", exact: true }).isEnabled()).toBe(true);
      expect(await page.getByText("Synthetic Stable explanation.", { exact: false }).count()).toBe(0);
    });
  });

  it.each<[string, MockResponse]>([
    ["missing receipt", response("Guest", true)],
    ["anonymous receipt", identified("Guest", "84983c60f7daadc1cb8698621f802c0d9f9a3c3c295c810748fb048115c186ec", 1, true)],
  ])("does not claim continuity for an unchanged %s", async (_reason, data) => {
    await withCourse("oit", { oit: data }, async page => {
      await page.getByText("Synthetic Guest question?", { exact: false }).first().waitFor();
      await page.getByRole("button", { name: "Yes", exact: true }).click();
      const before = (await calls(page)).length;
      await page.evaluate(() => {
        (window as any).__mode = "hold";
        window.dispatchEvent(new Event("focus"));
      });
      await expect.poll(async () => (await calls(page)).length).toBeGreaterThan(before);
      await page.getByRole("status").filter({ hasText: /loading practice activities/i }).waitFor();
      await page.evaluate(() => {
        const state = window as any;
        state.__mode = "success";
        state.__pending.splice(0).forEach((release: () => void) => release());
      });
      await expect.poll(() => page.getByRole("button", { name: "Yes", exact: true }).isEnabled()).toBe(true);
    });
  });

  it("cancels a pre-identity-change in-flight request and accepts only the later response", async () => {
    await withCourse("oit", { oit: identified("Old") }, async page => {
      await page.getByText("Synthetic Old question?", { exact: false }).first().waitFor();
      const before = (await calls(page)).length;
      await page.evaluate(() => {
        const state = window as any;
        state.__mode = "hold";
        state.__ignoreAbort = true; // Simulate a transport that still resolves after cancellation.
        window.dispatchEvent(new Event("focus"));
      });
      await expect.poll(async () => (await calls(page)).length).toBeGreaterThan(before);
      const mid = (await calls(page)).length;
      await page.evaluate(next => {
        const state = window as any;
        state.__responses.oit = next;
        state.__client.setQueryData([["auth", "me"], { type: "query" }], { id: "different-owner" });
      }, identified("New", "b".repeat(64)));
      await expect.poll(async () => (await calls(page)).length).toBeGreaterThan(mid);
      expect(await page.getByText("Synthetic Old question?", { exact: false }).count()).toBe(0);
      await page.evaluate(() => { (window as any).__pending.shift()(); });
      await page.getByRole("status").filter({ hasText: /loading practice activities/i }).waitFor();
      expect(await page.getByText("Synthetic Old question?", { exact: false }).count()).toBe(0);
      expect(await page.getByText("Synthetic New question?", { exact: false }).count()).toBe(0);
      await page.evaluate(() => {
        const state = window as any;
        state.__mode = "success";
        state.__pending.splice(0).forEach((release: () => void) => release());
      });
      await page.getByText("Synthetic New question?", { exact: false }).first().waitFor();
      expect(await page.getByText("Synthetic Old question?", { exact: false }).count()).toBe(0);
    });
  });

  it("discards answered state on error even if retry returns the same identity and data", async () => {
    await withCourse("oit", { oit: identified("Retry") }, async page => {
      await page.getByText("Synthetic Retry question?", { exact: false }).first().waitFor();
      await page.getByRole("button", { name: "Yes", exact: true }).click();
      await page.evaluate(() => {
        (window as any).__mode = "error";
        window.dispatchEvent(new Event("focus"));
      });
      await page.getByRole("alert").waitFor();
      expect(await page.getByText("Synthetic Retry question?", { exact: false }).count()).toBe(0);
      await page.evaluate(() => { (window as any).__mode = "success"; });
      await page.getByRole("button", { name: "Try again" }).click();
      await expect.poll(() => page.getByRole("button", { name: "Yes", exact: true }).isEnabled()).toBe(true);
    });
  });
});
