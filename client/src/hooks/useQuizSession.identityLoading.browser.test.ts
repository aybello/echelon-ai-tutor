import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";

let browser: Browser;
let script: string;
const origin = "https://identity.practice.test";

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
      import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
      import { getQueryKey } from '@trpc/react-query';
      import { observable } from '@trpc/server/observable';
      import { trpc } from '@/lib/trpc';
      import { useQuizSession } from './client/src/hooks/useQuizSession';
      import PracticeSaveStatus, { useVerifiedPracticeSaveScope } from './client/src/components/PracticeSaveStatus';
      Math.random=()=>0;
      Object.defineProperty(navigator,'doNotTrack',{value:'1',configurable:true});
      window.attempts=[]; window.scopes=[]; window.mounts=0; window.unmounts=0;
      window.activityCalls=[]; window.renders=[];
      const client = new QueryClient({defaultOptions:{queries:{retry:false,refetchOnWindowFocus:false,gcTime:Infinity}}});
      const authKey=getQueryKey(trpc.auth.me,undefined,'query');
      const emailKey=getQueryKey(trpc.dashboardAuth.me,undefined,'query');
      const accessKey=getQueryKey(trpc.stripe.checkAccess,{examType:'oit',email:undefined,accessToken:undefined},'query');
      window.identityQueries=()=>({auth:client.getQueryState(authKey),email:client.getQueryState(emailKey),access:client.getQueryState(accessKey)});
      client.setQueryData(authKey,{id:101});
      client.setQueryData(emailKey,null);
      const rpc=trpc.createClient({links:[()=>({op})=>observable(observer=>{
        let active=true;
        fetch('/fixture/'+op.path,{method:'POST',body:JSON.stringify(op.input??null)})
          .then(async response=>{if(!response.ok)throw new Error('Synthetic auth failure');return response.json()})
          .then(data=>{if(active){observer.next({result:{data}});observer.complete()}},error=>{if(active)observer.error(error)});
        return ()=>{active=false};
      })]});
      window.refetchAuth=()=>client.refetchQueries({queryKey:authKey,exact:true});
      function NavigationObserver(){
        // SiteNav mounts only inside QuizShell's current-question branch. Its
        // stale observer is the remount/refetch trigger from the real failure.
        const auth=trpc.auth.me.useQuery(undefined,{retry:false});
        useEffect(()=>{window.navigationAuth={status:auth.status,fetchStatus:auth.fetchStatus,dataUpdatedAt:auth.dataUpdatedAt,isFetchedAfterMount:auth.isFetchedAfterMount}},[auth.status,auth.fetchStatus,auth.dataUpdatedAt,auth.isFetchedAfterMount]);
        useEffect(()=>{window.mounts++;return()=>{window.unmounts++}},[]);
        return <nav>Synthetic navigation</nav>;
      }
      const emptyBank=[];
      function App(){
        const session=useQuizSession({examType:'oit',allQuestions:emptyBank});
        const scope=useVerifiedPracticeSaveScope('oit');
        window.session=session; window.strictScope=scope;
        window.renders.push({current:session.current?.id??null,scope,actor:window.actor});
        useEffect(()=>{window.committedSession=session;window.committedScope=scope});
        // Mirror QuizShell's early return: status/navigation disappear without current.
        if(!session.current)return <p data-testid="loading">Loading synthetic question</p>;
        return <main><NavigationObserver/><PracticeSaveStatus courseKey="oit"/>
          <p data-testid="question">{session.current.question}</p></main>;
      }
      createRoot(document.getElementById('root')).render(
        <trpc.Provider client={rpc} queryClient={client}><QueryClientProvider client={client}><App/></QueryClientProvider></trpc.Provider>
      );
    `,
    },
    alias: {
      "@": `${process.cwd()}/client/src`,
      "@shared": `${process.cwd()}/shared`,
    },
    plugins: [
      {
        name: "synthetic-quiz-dependencies",
        setup(builder) {
          builder.onResolve(
            {
              filter:
                /^@\/lib\/trpc$|^wouter$|^sonner$|^@\/components\/(QuizGate|QuizModeBar|QuizSettingsDrawer)$|^@\/hooks\/useLearningActivitySession$/,
            },
            args => ({ path: args.path, namespace: "fixture" })
          );
          builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({
            contents: (
              {
                "@/lib/trpc": `import {createTRPCReact} from '@trpc/react-query'; export const trpc=createTRPCReact();`,
                wouter: `const navigate=()=>{};export const useSearch=()=>'';export const useLocation=()=>['/',navigate];`,
                sonner: `export const toast=Object.assign(()=>{},{error(){},warning(){}});`,
                "@/components/QuizGate": `export const setTrialUnlocked=()=>{};`,
                "@/components/QuizSettingsDrawer": `export const DEFAULT_QUIZ_SETTINGS={sessionSize:15,difficulty:'all',timedMode:false,timedSeconds:60};`,
                "@/components/QuizModeBar": `const log=input=>{window.attempts.push(input);return Promise.resolve(false)};export const useAttemptLogger=(_course,_mode,scope)=>{window.actor=JSON.parse(scope).actorKey;window.scopes.push(scope);return log};`,
                "@/hooks/useLearningActivitySession": `export const useLearningActivitySession=()=>{};`,
              } as Record<string, string>
            )[args.path],
            resolveDir: process.cwd(),
          }));
        },
      },
    ],
  });
  script = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);
afterAll(async () => {
  await browser?.close();
});

type Fixture = {
  user: { id: number } | null;
  error: boolean;
  auth: number;
  questions: number;
  held: boolean;
  release?: () => void;
  activity: string[];
};
async function setup() {
  const context = await browser.newContext();
  const page = await context.newPage();
  const fixture: Fixture = {
    user: { id: 101 },
    error: false,
    auth: 0,
    questions: 0,
    held: false,
    activity: [],
  };
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort("blockedbyclient");
    if (url.pathname === "/")
      return route.fulfill({
        contentType: "text/html",
        body: '<div id="root"></div>',
      });
    const name = url.pathname.replace("/fixture/", "");
    let data: unknown = null;
    if (name === "auth.me") {
      fixture.auth++;
      if (fixture.held)
        await new Promise<void>(resolve => {
          fixture.release = resolve;
        });
      else await new Promise(resolve => setTimeout(resolve, 35));
      if (fixture.error)
        return route.fulfill({ status: 500, body: "Synthetic auth failure" });
      data = fixture.user;
    } else if (name === "dashboardAuth.me") data = null;
    else if (name === "stripe.checkAccess") data = { hasAccess: true };
    else if (name === "quiz.getRandomQuestions") {
      fixture.questions++;
      data = {
        questions: Array.from({ length: 15 }, (_, i) => ({
          id: fixture.questions * 100 + i,
          module: "Synthetic module",
          topic: "Synthetic topic",
          difficulty: "medium",
          question: "Synthetic question " + fixture.questions + "-" + i,
          options: ["A", "B", "C", "D"],
          correctIndex: 2,
          explanation: "Synthetic explanation",
          isCalc: false,
        })),
        total: 1000,
        locked: false,
        hasMore: false,
      };
    } else if (name === "quiz.getMissedQuestions")
      data = { total: 0, questionIds: [] };
    else if (
      name === "dashboard.bookmarkedQuestions" ||
      name === "dashboard.lowConfidenceQuestions"
    )
      data = [];
    else if (name === "assessmentActivity.record") {
      fixture.activity.push(name);
      data = { tracking: false, recorded: false };
    } else if (name === "assessmentActivity.resume") {
      fixture.activity.push(name);
      data = { tracking: false };
    } else if (name === "funnelAnalytics.track" || name === "quiz.logAttempt")
      data = { success: true };
    else throw new Error("Unexpected synthetic procedure: " + name);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  await page.goto(origin);
  await page.addScriptTag({ content: script });
  return { page, fixture };
}
async function state(page: Page) {
  return page.evaluate(() => {
    const w = window as any;
    return {
      id: w.session?.current?.id ?? null,
      actor: w.actor,
      scope: w.strictScope,
      history: w.session?.history.length,
      selected: w.session?.selected,
      confirmed: w.session?.confirmed,
      mounts: w.mounts,
      unmounts: w.unmounts,
    };
  });
}
async function settled(page: Page) {
  const ready = () => page.evaluate(() => {
    const w = window as any;
    const queries = w.identityQueries();
    const authoritativeIdle = Object.values(queries).every((query: any) =>
      query?.status === "success" && query.fetchStatus === "idle"
    );
    const navigation = w.navigationAuth;
    return Boolean(
      authoritativeIdle && queries.auth.data?.id === 101 && queries.access.data?.hasAccess === true &&
      navigation?.isFetchedAfterMount && navigation.status === "success" && navigation.fetchStatus === "idle" &&
      navigation.dataUpdatedAt === queries.auth.dataUpdatedAt &&
      w.session?.current?.id && w.session.questionStatus === undefined && w.strictScope?.identity === "user:101" &&
      w.committedSession === w.session && w.committedScope === w.strictScope
    );
  });
  // A current question and verified scope can coexist for one render before
  // the settled actor's queue-reset effect and SiteNav's mount refetch finish.
  // Start actions only after authoritative idle queries and their committed
  // render survive the subsequent effect/render turn, not that transient state.
  await expect
    .poll(
      async () => {
        if (!await ready()) return false;
        await page.evaluate(() => new Promise<void>(resolve =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        ));
        return ready();
      },
      { timeout: 2000 }
    )
    .toBe(true);
}
async function answer(page: Page) {
  await page.evaluate(() => (window as any).session.setSelected(2));
  await expect.poll(async () => (await state(page)).selected).toBe(2);
  await page.evaluate(() => (window as any).session.handleConfirm());
  await expect.poll(async () => (await state(page)).history).toBe(1);
}

describe("quiz actor identity versus strict save verification", () => {
  it("settles logged-in QuizShell despite mounting a stale navigation auth observer", async () => {
    const { page, fixture } = await setup();
    try {
      await settled(page);
      const before = await state(page);
      const requests = fixture.questions;
      const auth = fixture.auth;
      expect(before.actor).toContain("user:101");
      await page.waitForTimeout(180);
      expect((await state(page)).id).toBe(before.id);
      expect((await state(page)).unmounts).toBe(before.unmounts);
      expect(fixture.questions).toBe(requests);
      expect(fixture.auth - auth).toBeLessThanOrEqual(1);
      expect(fixture.questions).toBeLessThanOrEqual(3);
      expect(fixture.auth).toBeLessThanOrEqual(3);
      expect(fixture.activity).toEqual([]);
    } finally {
      fixture.release?.();
      await page.context().close();
    }
  });
  it("keeps question, answer and actor during same-account background fetch while saves fail closed", async () => {
    const { page, fixture } = await setup();
    try {
      await settled(page);
      await answer(page);
      const before = await state(page);
      const requests = fixture.questions;
      const auth = fixture.auth;
      fixture.held = true;
      await page.evaluate(() => {
        void (window as any).refetchAuth();
      });
      await expect.poll(() => fixture.auth).toBe(auth + 1);
      await expect.poll(async () => (await state(page)).scope).toBeNull();
      await expect
        .poll(() => page.getByRole("status").textContent())
        .toContain("Local session score only");
      await page.waitForTimeout(80);
      expect(await state(page)).toMatchObject({
        id: before.id,
        actor: before.actor,
        history: 1,
        selected: 2,
        confirmed: true,
        unmounts: before.unmounts,
      });
      expect(fixture.questions).toBe(requests);
      fixture.held = false;
      fixture.release?.();
      await settled(page);
      expect(await state(page)).toMatchObject({
        id: before.id,
        actor: before.actor,
        history: 1,
      });
      expect(fixture.questions).toBe(requests);
    } finally {
      fixture.release?.();
      await page.context().close();
    }
  });
  it("replaces the queue and clears local history for a new account and logout", async () => {
    const { page, fixture } = await setup();
    try {
      await settled(page);
      await answer(page);
      const before = await state(page);
      const requests = fixture.questions;
      fixture.user = { id: 202 };
      await page.evaluate(() => {
        void (window as any).refetchAuth();
      });
      await expect
        .poll(async () => (await state(page)).actor)
        .toContain("user:202");
      await expect
        .poll(async () => {
          const s = await state(page);
          return Boolean(s.id && s.id !== before.id && s.history === 0);
        })
        .toBe(true);
      expect(fixture.questions).toBeGreaterThan(requests);
      await answer(page);
      const second = await state(page);
      const secondRequests = fixture.questions;
      fixture.user = null;
      await page.evaluate(() => {
        void (window as any).refetchAuth();
      });
      await expect
        .poll(async () => (await state(page)).actor)
        .not.toBe(second.actor);
      await expect
        .poll(async () => {
          const s = await state(page);
          return Boolean(
            s.id && s.id !== second.id && s.history === 0 && s.scope === null
          );
        })
        .toBe(true);
      expect(fixture.questions).toBeGreaterThan(secondRequests);
    } finally {
      fixture.release?.();
      await page.context().close();
    }
  });
  it("fails closed after an auth error instead of trusting cached save identity", async () => {
    const { page, fixture } = await setup();
    try {
      await settled(page);
      await answer(page);
      const before = await state(page);
      fixture.error = true;
      await page.evaluate(() => {
        void (window as any).refetchAuth();
      });
      await expect.poll(async () => (await state(page)).scope).toBeNull();
      await expect
        .poll(async () => (await state(page)).actor)
        .not.toBe(before.actor);
      await expect.poll(async () => (await state(page)).history).toBe(0);
      await expect
        .poll(() => page.getByRole("status").textContent())
        .toContain("Local session score only");
      expect(fixture.activity).toEqual([]);
    } finally {
      fixture.release?.();
      await page.context().close();
    }
  });
});
