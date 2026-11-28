import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";

let browser: Browser;
let script: string;
const ASSIGNMENT = "11111111-1111-4111-8111-111111111111";
const APPLICANT = "applicant-a@example.test";
const oldLearnerState = {
  echelon_access_token: "synthetic-old-learner-b-token",
  echelon_subscription_email: "learner-b@example.test",
  echelon_trial_email: "learner-b@example.test",
  echelon_trial_unlocked: "true",
  echelon_subscription_exam_types: '["class1-water"]',
  echelon_purchased_products: '["class1-water"]',
  "echelon.question-cache": "synthetic-private-b-content",
  "manus-runtime-user-info": '{"email":"learner-b@example.test"}',
  theme: "dark",
};

beforeAll(async () => {
  const result = await build({
    bundle: true, write: false, format: "iife", jsx: "automatic",
    stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
      import React, { useState } from 'react';
      import { createRoot } from 'react-dom/client';
      import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
      import OtpLogin from './client/src/pages/OtpLogin';
      import { useQuestionBank } from './client/src/hooks/useQuestionBank';
      const client = new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});
      window.__client = client;
      client.setQueryData(['synthetic-learner-b-private'], {email:'learner-b@example.test'});
      function Probe() { useQuestionBank('class1-water'); return <p>Study probe mounted</p>; }
      function App() {
        const [probe,setProbe] = useState(false);
        window.__setProbe = setProbe;
        return <><OtpLogin />{probe && <Probe />}</>;
      }
      createRoot(document.getElementById('root')).render(<QueryClientProvider client={client}><App /></QueryClientProvider>);
    ` },
    alias: { "@": `${process.cwd()}/client/src`, "@shared": `${process.cwd()}/shared` },
    plugins: [{ name: "isolated-otp-transport", setup(builder) {
      builder.onResolve({ filter: /^(?:@\/lib\/trpc|@\/components\/LandingNav)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "js", resolveDir: process.cwd(), contents:
        args.path === "@/components/LandingNav" ? "export default () => null;" : `
          import { useMutation } from '@tanstack/react-query';
          export const trpc = {
            emailOtp: {
              requestOtp:{useMutation: options => useMutation({...options, mutationFn:async input => {
                window.__requestInputs.push(input); return {sent:true};
              }})},
              verifyOtp:{useMutation: options => useMutation({...options, mutationFn:async input => {
                window.__verifyInputs.push(input); return window.__otpResult;
              }})},
            },
            quiz: {
              getQuestions:{useQuery: input => {window.__questionInputs.push(input); return {data:{questions:[],locked:true},isSuccess:true};}},
              getBankMeta:{useQuery: () => ({data:{modules:[],totalQuestions:0},isSuccess:true})},
              getModuleOverviews:{useQuery: () => ({data:{},isSuccess:true})},
            },
          };
        ` }));
    } }],
  });
  script = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);
afterAll(async () => { await browser?.close(); });

type Result = { valid: boolean; sessionKind?: string; email?: string; examTypes?: string[]; accessToken?: string; isManager?: boolean; reason?: string; attemptsRemaining?: number };
function applicant(): Result {
  return { valid: true, sessionKind: "assessment-only", email: APPLICANT, examTypes: [], accessToken: "", isManager: false };
}
async function fixture(result: Result, run: (page: Page) => Promise<void>, shared = true, next = `/recruitment/${ASSIGNMENT}`) {
  const page = await browser.newPage(); page.setDefaultTimeout(5000);
  // No live HTTP server, application endpoint, email, DB, image or external call.
  await page.route("**/*", route => {
    if (route.request().isNavigationRequest() && new URL(route.request().url()).hostname === "otp.fixture.invalid") {
      return route.fulfill({ status: 200, contentType: "text/html", body: '<!doctype html><html><body><div id="root"></div></body></html>' });
    }
    return route.abort("blockedbyclient");
  });
  try {
    await page.goto(`https://otp.fixture.invalid/login/otp?email=${APPLICANT}&next=${encodeURIComponent(next)}`);
    await page.evaluate(({ result, initial }) => {
      const state = window as any;
      for (const [key,value] of Object.entries(initial)) localStorage.setItem(key,String(value));
      sessionStorage.setItem("echelon.practice.draft", "learner-b-private-draft");
      sessionStorage.setItem("echelon_purchased_products", '["class1-water"]');
      sessionStorage.setItem("theme", "light");
      state.__otpResult = result; state.__requestInputs = []; state.__verifyInputs = []; state.__questionInputs = [];
      const timeout = window.setTimeout.bind(window);
      window.setTimeout = ((fn: TimerHandler, delay?: number, ...args: unknown[]) => {
        if (delay === 2500) { state.__redirectPending = true; return 0; }
        return timeout(fn,delay,...args);
      }) as typeof window.setTimeout;
    }, { result, initial: shared ? oldLearnerState : {} });
    await page.addScriptTag({ content: script });
    await run(page);
  } finally { await page.close(); }
}
async function verify(page: Page) {
  await page.getByRole("button", { name: "Send Code" }).click();
  await page.getByRole("heading", { name: "Check Your Email" }).waitFor();
  // Real input events and auto-submit, not direct invocation of onSuccess.
  const digits = page.locator('input[inputmode="numeric"]');
  for (let i=0; i<6; i++) await digits.nth(i).fill("314159"[i]);
}
async function snapshot(page: Page) {
  return page.evaluate(() => ({
    local: Object.fromEntries(Object.entries(localStorage)), session: Object.fromEntries(Object.entries(sessionStorage)),
    privateQuery: (window as any).__client.getQueryData(['synthetic-learner-b-private']) ?? null,
    requests: (window as any).__requestInputs, verifications: (window as any).__verifyInputs,
  }));
}

describe("OTP browser session-kind isolation", () => {
  it.each([false,true])("applicant success never writes learner identity or unlock flags (shared browser: %s)", async shared => {
    await fixture(applicant(), async page => {
      await verify(page);
      await page.getByRole("heading", { name: "You're signed in!" }).waitFor();
      const state = await snapshot(page);
      for (const key of Object.keys(oldLearnerState).filter(key => key !== "theme")) expect(state.local[key]).toBeUndefined();
      expect(state.session["echelon.practice.draft"]).toBeUndefined();
      expect(state.session.echelon_purchased_products).toBeUndefined();
      expect(state.session.theme).toBe("light"); expect(state.privateQuery).toBeNull();
      if (shared) expect(state.local.theme).toBe("dark");
      expect(state.requests).toEqual([{email:APPLICANT,assignmentId:ASSIGNMENT}]);
      expect(state.verifications).toEqual([{email:APPLICANT,code:"314159",assignmentId:ASSIGNMENT}]);
      expect(await page.getByRole("link", { name: "Continue" }).getAttribute("href")).toBe(`/recruitment/${ASSIGNMENT}`);
      // The real useQuestionBank reads the newly cleared browser storage.
      await page.evaluate(() => (window as any).__setProbe(true));
      await page.getByText("Study probe mounted").waitFor();
      expect(await page.evaluate(() => (window as any).__questionInputs.at(-1))).toEqual({bankKey:"class1-water"});
    }, shared);
  });

  it("proves the real question hook forwarded B's stored token before applicant login and no token after", async () => {
    await fixture(applicant(), async page => {
      await page.evaluate(() => (window as any).__setProbe(true));
      await page.getByText("Study probe mounted").waitFor();
      expect(await page.evaluate(() => (window as any).__questionInputs.at(-1).accessToken)).toBe(oldLearnerState.echelon_access_token);
      await page.evaluate(() => (window as any).__setProbe(false));
      await page.getByText("Study probe mounted").waitFor({state:"detached"});
      await verify(page); await page.getByRole("heading", { name: "You're signed in!" }).waitFor();
      await page.evaluate(() => (window as any).__setProbe(true));
      await page.getByText("Study probe mounted").waitFor();
      expect(await page.evaluate(() => (window as any).__questionInputs.at(-1).accessToken ?? null)).toBeNull();
    });
  });

  it("replaces a previous learner's token and products for an ordinary learner login", async () => {
    await fixture({valid:true,sessionKind:"verified-email",email:"learner-c@example.test",accessToken:"synthetic-c-token",examTypes:["oit"],isManager:false}, async page => {
      await verify(page); await page.getByRole("heading", { name: "You're signed in!" }).waitFor();
      const {local} = await snapshot(page);
      expect(local.echelon_access_token).toBe("synthetic-c-token"); expect(local.echelon_trial_email).toBe("learner-c@example.test");
      expect(local.echelon_subscription_email).toBe("learner-c@example.test"); expect(local.echelon_trial_unlocked).toBe("true");
      expect(JSON.parse(local.echelon_subscription_exam_types)).toEqual(["oit"]); expect(JSON.parse(local.echelon_purchased_products)).toEqual(["oit"]);
      expect(await page.getByRole("link", {name:"Go to My Account"}).getAttribute("href")).toBe("/account");
    }, true, "");
  });

  it("keeps ordinary manager/billing recovery identity but removes a previous learner's access", async () => {
    await fixture({valid:true,sessionKind:"verified-email",email:"manager@example.test",accessToken:"",examTypes:[],isManager:true}, async page => {
      await verify(page); await page.getByRole("heading", { name: "You're signed in!" }).waitFor();
      const {local} = await snapshot(page);
      expect(local.echelon_access_token).toBeUndefined(); expect(local.echelon_trial_email).toBe("manager@example.test");
      expect(JSON.parse(local.echelon_subscription_exam_types)).toEqual([]); expect(JSON.parse(local.echelon_purchased_products)).toEqual([]);
      expect(await page.getByRole("link", {name:"Go to Team Dashboard"}).getAttribute("href")).toBe("/team/billing");
    }, true, "/team/billing");
  });

  it("still clears learner storage and completes applicant login if query-cache cleanup fails", async () => {
    await fixture(applicant(), async page => {
      await page.evaluate(() => {
        const client = (window as any).__client;
        client.cancelQueries = async () => { throw new Error("Synthetic cancellation failure"); };
        client.clear = () => { throw new Error("Synthetic cache failure"); };
      });
      await verify(page); await page.getByRole("heading", { name: "You're signed in!" }).waitFor();
      const {local,session} = await snapshot(page);
      expect(local.echelon_access_token).toBeUndefined(); expect(local.echelon_trial_email).toBeUndefined();
      expect(session["echelon.practice.draft"]).toBeUndefined();
    });
  });

  it("does not replace browser identity when verification fails", async () => {
    await fixture({valid:false,reason:"wrong_code",attemptsRemaining:4}, async page => {
      await verify(page); await page.getByText("Incorrect code. 4 attempts remaining.").waitFor();
      const {local} = await snapshot(page);
      expect(local.echelon_access_token).toBe(oldLearnerState.echelon_access_token);
      expect(local.echelon_trial_email).toBe("learner-b@example.test");
    });
  });
});
