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
              const procedure = path => ({_def:()=>({path})});
              const questions = procedure(['quiz','getQuestions']);
              questions.useQuery = (input, options) => useQuery({
                ...options, retry:false,
                queryKey:getQueryKey(questions,input,'query'),
                queryFn:({signal})=>window.__query(input,signal),
              });
              export const trpc = {
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
) {
  const page = await browser.newPage();
  const requests: string[] = [];
  const sockets: string[] = [];
  page.on("request", request => requests.push(request.url()));
  page.on("websocket", socket => sockets.push(socket.url()));
  await page.route("**/*", route => route.abort("blockedbyclient"));
  try {
    await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>');
    await page.evaluate(({ course, search, responses, startOffline }) => {
      const state = window as any;
      state.__route = { course, search };
      state.__startOffline = startOffline;
      state.__responses = responses;
      state.__calls = [];
      state.__mode = "success";
      state.__pending = [];
      const originalInterval = window.setInterval.bind(window);
      window.setInterval = ((callback: TimerHandler, delay?: number, ...args: any[]) => {
        if (delay === 5 * 60_000 && typeof callback === "function") state.__periodic = callback;
        return originalInterval(callback, delay, ...args);
      }) as typeof window.setInterval;
      const values: Record<string, string> = {};
      const storage = {
        get length() { return Object.keys(values).length; },
        key: (i: number) => Object.keys(values)[i] ?? null,
        getItem: (key: string) => values[key] ?? null,
        setItem: (key: string, value: string) => { values[key] = String(value); },
        removeItem: (key: string) => { delete values[key]; },
        clear: () => { for (const key of Object.keys(values)) delete values[key]; },
      };
      Object.defineProperty(window, "localStorage", { configurable: true, get: () => storage });
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
    }, { course, search, responses, startOffline });
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
const heading = (page: Page, text: string) => page.getByRole("heading", { name: text, exact: true });

// These expectations exercise client routing and the server-supplied working set;
// a mock cannot establish that the real server enforces entitlements.
describe("CourseInteractiveLearning isolated browser", () => {
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
      expect(await page.getByRole("link", { name: "← Home" }).getAttribute("href")).toBe("/");
    });
  });

  it("does not query the bank for the 309A beta", async () => {
    await withCourse("electrician-309a", {}, async page => {
      await heading(page, "Ontario 309A Construction Electrician").waitFor();
      await page.getByText(/interactive practice is not available for the 309A beta/i).waitFor();
      expect(await calls(page)).toEqual([]);
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
