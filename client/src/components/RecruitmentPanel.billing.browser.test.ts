import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";

let browser: Browser;
let script: string;
const orgId = 7;
const status = {
  active: false, owner: true, state: null, termId: null, basis: null,
  used: 0, quota: 0, remaining: 0, startsAtMs: null, endsAtMs: null,
  sourceSubscriptionId: null, canCancelRenewal: false, canPurchase: true,
  billingOrderId: "synthetic-paid-order", billingSubscriptionId: "sub_synthetic_paid",
};

beforeAll(async () => {
  const result = await build({
    bundle: true, write: false, format: "iife", jsx: "automatic",
    alias: { "@": `${process.cwd()}/client/src`, "@shared": `${process.cwd()}/shared` },
    loader: { ".css": "empty" },
    stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
      import {observable} from '@trpc/server/observable';
      import {TRPCClientError} from '@trpc/client';
      import RecruitmentPanel, {HiringManagerPanel} from './client/src/components/RecruitmentPanel';
      import OrgDashboard from './client/src/pages/OrgDashboard';
      import {trpc} from './client/src/lib/trpc';
      const fixture = window.__fixture;
      window.__calls = [];
      window.__held = [];
      window.__client = new QueryClient({defaultOptions:{queries:{retry:false,gcTime:Infinity},mutations:{retry:false}}});
      window.__statusKey = [['hiring','status'],{input:{orgId:7},type:'query'}];
      window.__rpc = async op => {
        window.__calls.push({path:op.path, input:op.input, type:op.type});
        if (fixture.holdStatus && op.path === 'hiring.status') await new Promise(resolve => window.__held.push(resolve));
        if (fixture.holdMutation && op.type === 'mutation') await new Promise(resolve => window.__held.push(resolve));
        const failure = fixture.failures?.[op.path];
        if (failure) throw TRPCClientError.from({error:{message:failure.message, code:-32003, data:{code:failure.code || 'INTERNAL_SERVER_ERROR'}}});
        if (op.path === 'org.listManagedOrganizations') return [{id:7,name:'Synthetic lapsed organization',status:'cancelled'}];
        if (op.path === 'org.getOrgOverview') throw TRPCClientError.from({error:{message:'This team has no current contract, activation, or reporting window. Manage team billing to renew; learner access is unchanged.',code:-32003,data:{code:'FORBIDDEN'}}});
        if (op.path === 'hiring.status') return fixture.status;
        if (op.path === 'hiring.cancelAtPeriodEnd') {
          if (op.input.expectedBillingOrderId !== fixture.status.billingOrderId || op.input.expectedBillingSubscriptionId !== fixture.status.billingSubscriptionId) {
            throw TRPCClientError.from({error:{message:'Hiring billing changed. Refresh Hiring status and confirm cancellation again.',code:-32009,data:{code:'CONFLICT'}}});
          }
          fixture.status = {...fixture.status,canCancelRenewal:false};
          return {endsAtMs:1900000000000};
        }
        if (op.path === 'hiring.createCheckout') return {url:null,orderId:'synthetic-order'};
        if (op.path === 'recruitment.list') return fixture.assessment ? [fixture.assessment] : [];
        if (op.path === 'recruitment.catalog') return fixture.catalog || {courses:[],candidates:[]};
        if (op.path === 'recruitment.results') return {assessment:fixture.assessment,results:[]};
        if (op.path === 'recruitment.invite') {
          if (op.input.candidateEmail) fixture.status = {...fixture.status,used:fixture.status.used+1,remaining:fixture.status.remaining-1};
          return {assignmentId:'11111111-1111-4111-8111-111111111111'};
        }
        throw new Error('Unexpected synthetic RPC: '+op.path);
      };
      const rpc = trpc.createClient({links:[() => ({op}) => observable(observer => {
        let live = true;
        window.__rpc(op).then(data => {if(live){observer.next({result:{data}});observer.complete();}},error => {if(live)observer.error(error);});
        return () => {live=false;};
      })]});
      const root = createRoot(document.getElementById('root'));
      window.__unmount = () => root.unmount();
      root.render(<trpc.Provider client={rpc} queryClient={window.__client}><QueryClientProvider client={window.__client}>
        {fixture.dashboard ? <OrgDashboard/> : fixture.billingOnly ? <HiringManagerPanel orgId={7}/> : <RecruitmentPanel orgId={7}/>}
      </QueryClientProvider></trpc.Provider>);
    ` },
  });
  script = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);
afterAll(async () => { await browser?.close(); });

type Fixture = {
  status?: Record<string, unknown>;
  billingOnly?: boolean;
  dashboard?: boolean;
  holdStatus?: boolean;
  holdMutation?: boolean;
  failures?: Record<string, { message: string; code?: string }>;
  assessment?: Record<string, unknown>;
  catalog?: Record<string, unknown>;
};
async function withPanel(fixture: Fixture, run: (page: Page) => Promise<void>) {
  const page = await browser.newPage();
  const network: string[] = [];
  page.on("request", request => network.push(request.url()));
  await page.route("**/*", route => route.abort("blockedbyclient"));
  page.on("dialog", dialog => dialog.accept());
  try {
    await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>');
    await page.evaluate(value => { (window as any).__fixture = value; }, { ...fixture, status: { ...status, ...fixture.status } });
    await page.addScriptTag({ content: script });
    await page.getByRole("heading", { name: "Hiring allowance and billing" }).waitFor();
    await run(page);
    expect(network).toEqual([]);
  } finally { await page.close(); }
}
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const calls = (page: Page, path: string) => page.evaluate(path => (window as any).__calls.filter((call: any) => call.path === path), path);
const cancelCalls = (page: Page) => calls(page, "hiring.cancelAtPeriodEnd");
const purchaseCalls = (page: Page) => calls(page, "hiring.createCheckout");

// Real React DOM, tRPC hooks/providers, QueryClient, useQuery/useMutation and
// privacy lifecycle. Only the final RPC link is synthetic; no server/DB/Stripe.
describe("independent organization Hiring billing (actual React/QueryClient)", () => {
  it.each([
    { billingOrderId: null }, { billingSubscriptionId: null }, { billingOrderId: "" }, { billingSubscriptionId: "" },
  ])("fails closed on cancellation without the displayed exact billing identity: %j", async missing => {
    await withPanel({ status: { canCancelRenewal: true, ...missing } }, async page => {
      await page.getByText("No assessments yet", { exact: true }).waitFor();
      expect(await button(page, "Cancel Hiring renewal").count()).toBe(0);
      expect(await cancelCalls(page)).toEqual([]);
    });
  });

  it("requires a fresh confirmation after server-side bill replacement without any cache invalidation", async () => {
    await withPanel({ holdMutation: true, status: { canCancelRenewal: true, canPurchase: false } }, async page => {
      let confirmations = 0;
      page.on("dialog", () => { confirmations++; });
      await button(page, "Cancel Hiring renewal").click();
      await expect.poll(() => cancelCalls(page)).toEqual([{ path: "hiring.cancelAtPeriodEnd", input: { orgId, expectedBillingOrderId: "synthetic-paid-order", expectedBillingSubscriptionId: "sub_synthetic_paid" }, type: "mutation" }]);
      await page.evaluate(() => {
        const w = window as any;
        // Only server state changes: the displayed QueryClient read remains the
        // old bill until the mutation rejects and the component refetches it.
        w.__fixture.status = { ...w.__fixture.status, billingOrderId: "replacement-order", billingSubscriptionId: "sub_replacement" };
        w.__fixture.holdMutation = false;
        w.__held.splice(0).forEach((resolve: () => void) => resolve());
      });
      await page.getByRole("alert").filter({ hasText: "confirm cancellation again" }).waitFor();
      await button(page, "Cancel Hiring renewal").waitFor();
      expect(await cancelCalls(page)).toHaveLength(1);
      expect(confirmations).toBe(1);
      expect(await page.getByText("Hiring renewal is cancelled. Normal Teams training is unchanged.", { exact: true }).count()).toBe(0);
      await button(page, "Cancel Hiring renewal").click();
      await expect.poll(() => cancelCalls(page)).toHaveLength(2);
      expect((await cancelCalls(page))[1].input).toEqual({ orgId, expectedBillingOrderId: "replacement-order", expectedBillingSubscriptionId: "sub_replacement" });
      await page.getByText("Hiring renewal is cancelled. Normal Teams training is unchanged.", { exact: true }).waitFor();
      expect(confirmations).toBe(2);
    });
  });

  it.each(["active", "cancel_at_period_end"])("dispatches cancellation with a complimentary %s allowance plus a separate paid renewable order", async state => {
    await withPanel({ status: { active: true, owner: true, basis: "pilot", state, quota: 100, remaining: 93, endsAtMs: 1900000000000, canCancelRenewal: true } }, async page => {
      await page.getByText("No assessments yet", { exact: true }).waitFor();
      await button(page, "Cancel Hiring renewal").click();
      await expect.poll(() => cancelCalls(page)).toEqual([{path:"hiring.cancelAtPeriodEnd",input:{orgId,expectedBillingOrderId:"synthetic-paid-order",expectedBillingSubscriptionId:"sub_synthetic_paid"},type:"mutation"}]);
      await page.getByText("Hiring renewal is cancelled. Normal Teams training is unchanged.", { exact: true }).waitFor();
      expect(await purchaseCalls(page)).toEqual([]);
    });
  });

  it("dispatches cancellation for a paid order with no term and no assessments", async () => {
    await withPanel({ status: { basis: "stripe", canCancelRenewal: true } }, async page => {
      await page.getByText("No assessments yet", { exact: true }).waitFor();
      await button(page, "Cancel Hiring renewal").click();
      await expect.poll(() => cancelCalls(page)).toEqual([{path:"hiring.cancelAtPeriodEnd",input:{orgId,expectedBillingOrderId:"synthetic-paid-order",expectedBillingSubscriptionId:"sub_synthetic_paid"},type:"mutation"}]);
    });
  });

  it.each(["FORBIDDEN", "INTERNAL_SERVER_ERROR"])("keeps billing cancellation independent of suspended access and catalog/reporting %s", async code => {
    await withPanel({ status: { state: "suspended", basis: "stripe", canCancelRenewal: true }, failures: {
      "recruitment.catalog": {message:"Current Annual access unavailable",code},
      "recruitment.list": {message:"Reporting unavailable",code},
    } }, async page => {
      await page.getByText("Recruitment access could not be verified. Your session may have changed.", { exact: true }).waitFor();
      await button(page, "Cancel Hiring renewal").click();
      await expect.poll(() => cancelCalls(page)).toHaveLength(1);
    });
  });

  it("allows a lapsed owner to cancel on the billing-only recovery surface without any assessment read", async () => {
    await withPanel({ billingOnly: true, status: { active: false, basis: "stripe", canCancelRenewal: true, canPurchase: false } }, async page => {
      await button(page, "Cancel Hiring renewal").click();
      await expect.poll(() => cancelCalls(page)).toEqual([{path:"hiring.cancelAtPeriodEnd",input:{orgId,expectedBillingOrderId:"synthetic-paid-order",expectedBillingSubscriptionId:"sub_synthetic_paid"},type:"mutation"}]);
      expect(await calls(page, "recruitment.list")).toEqual([]);
      expect(await calls(page, "recruitment.catalog")).toEqual([]);
      expect(await button(page, "Add Hiring allowance").count()).toBe(0);
    });
  });

  it("mounts billing-only cancellation on the actual lapsed-owner dashboard despite overview denial", async () => {
    await withPanel({dashboard:true,status:{canCancelRenewal:true,hasBillingSubscription:true,billingOrderId:"synthetic-paid-order"}},async page=>{
      await page.getByRole("heading",{name:"Manager Dashboard",exact:true}).waitFor();
      await button(page,"Cancel Hiring renewal").click();
      await expect.poll(()=>cancelCalls(page)).toEqual([{path:"hiring.cancelAtPeriodEnd",input:{orgId,expectedBillingOrderId:"synthetic-paid-order",expectedBillingSubscriptionId:"sub_synthetic_paid"},type:"mutation"}]);
      expect(await calls(page,"recruitment.list")).toEqual([]);
      expect(await calls(page,"recruitment.catalog")).toEqual([]);
    });
  });

  it("does not offer another purchase when a cancelled paid billing subscription remains connected to a free allowance",async()=>{
    await withPanel({status:{active:true,basis:"pilot",state:"active",hasBillingSubscription:true,billingOrderId:"synthetic-paid-order",billingRenewalCancelled:true,canPurchase:false}},async page=>{
      await page.getByText("Paid Hiring renewal is cancelled. This does not restore unavailable allowance or team access.",{exact:true}).waitFor();
      expect(await button(page,"Add Hiring allowance").count()).toBe(0);
      expect(await button(page,"Cancel Hiring renewal").count()).toBe(0);
      expect(await page.locator("#root").innerText()).not.toMatch(/pilot|renews annually/i);
    });
  });

  it("does not describe a free-only allowance as automatically renewing or display internal naming", async () => {
    await withPanel({ status: {active:true,basis:"pilot",state:"active",quota:100,remaining:100,endsAtMs:1900000000000,canPurchase:false,billingOrderId:null,billingSubscriptionId:null} }, async page => {
      await page.getByText("This complimentary allowance ends on its stated date and does not itself renew or create a charge.", { exact: true }).waitFor();
      const text = await page.locator("#root").innerText();
      expect(text).not.toMatch(/pilot|renews annually|candidates need a current team seat/i);
      expect(text).toContain("Applicants invited through the Hiring allowance do not need a paid training seat.");
      expect(text).toContain("legacy team-seat workflow");
      expect(await button(page, "Cancel Hiring renewal").count()).toBe(0);
      expect(await button(page, "Add Hiring allowance").count()).toBe(0);
      expect(await purchaseCalls(page)).toEqual([]);
      expect(await page.locator('a[href*="pricing"],a[href*="billing=personal"]').count()).toBe(0);
    });
  });

  it.each([
    ["PRECONDITION_FAILED", "Hiring checkout is not configured yet."],
    ["CONFLICT", "A Hiring subscription already exists."],
    ["INTERNAL_SERVER_ERROR", "Network connection interrupted."],
  ])("shows the owner's actual %s checkout failure instead of falsely blaming ownership", async (code, message) => {
    await withPanel({ failures: {"hiring.createCheckout": {code,message}} }, async page => {
      await button(page, "Add Hiring allowance").click();
      await page.getByRole("alert").filter({hasText:message}).waitFor();
      expect(await purchaseCalls(page)).toEqual([{path:"hiring.createCheckout",input:{orgId},type:"mutation"}]);
      expect(await page.locator("#root").innerText()).not.toContain("Only the verified organization owner can purchase Hiring.");
    });
  });

  it("shows a real cancellation failure without reporting success", async () => {
    await withPanel({status:{canCancelRenewal:true},failures:{"hiring.cancelAtPeriodEnd":{message:"Billing connection unavailable."}}}, async page => {
      await button(page,"Cancel Hiring renewal").click();
      await page.getByRole("alert").filter({hasText:"Billing connection unavailable."}).waitFor();
      expect(await cancelCalls(page)).toHaveLength(1);
      expect(await page.getByText("Hiring renewal is cancelled. Normal Teams training is unchanged.",{exact:true}).count()).toBe(0);
    });
  });

  it.each([false, true])("never offers or dispatches purchase/cancel to a nonowner (server canCancel=%s)", async canCancelRenewal => {
    await withPanel({status:{owner:false,canCancelRenewal}}, async page => {
      await page.getByText("Only the verified organization owner can purchase Hiring or cancel its renewal.",{exact:true}).waitFor();
      expect(await button(page,"Add Hiring allowance").count()).toBe(0);
      expect(await button(page,"Cancel Hiring renewal").count()).toBe(0);
      expect(await purchaseCalls(page)).toEqual([]);
      expect(await cancelCalls(page)).toEqual([]);
    });
  });

  it("does not offer purchase while status is loading or failed and displays the status error", async () => {
    await withPanel({holdStatus:true,failures:{"hiring.status":{message:"Status network failure."}}}, async page => {
      await page.getByText("Verifying Hiring status and billing permissions…",{exact:true}).waitFor();
      expect(await button(page,"Add Hiring allowance").count()).toBe(0);
      await page.evaluate(() => { (window as any).__held.splice(0).forEach((resolve:()=>void)=>resolve()); });
      await page.getByRole("alert").filter({hasText:"Status network failure."}).waitFor();
      expect(await button(page,"Add Hiring allowance").count()).toBe(0);
      expect(await purchaseCalls(page)).toEqual([]);
    });
  });

  it.each([
    ["purchase","invalidation"], ["cancel","invalidation"],
    ["purchase","manual cache write"], ["cancel","manual cache write"],
    ["purchase","privacy reset"], ["cancel","privacy reset"],
    ["purchase","refetch"], ["cancel","refetch"],
  ])("fences retained %s handlers synchronously on %s before React rerenders", async (action,boundary) => {
    await withPanel({status:{canCancelRenewal:action==="cancel"}}, async page => {
      const name = action === "cancel" ? "Cancel Hiring renewal" : "Add Hiring allowance";
      await button(page,name).waitFor();
      await button(page,name).evaluate((element, boundary) => {
        const w=window as any;
        const propsKey=Object.keys(element).find(key=>key.startsWith('__reactProps$'))!;
        const handler=(element as any)[propsKey].onClick;
        // Call the original React closure in the same JS turn, before rendering.
        if(boundary==='invalidation') w.__client.getQueryCache().find({queryKey:w.__statusKey,exact:true}).invalidate();
        if(boundary==='manual cache write') w.__client.setQueryData(w.__statusKey,{...w.__fixture.status,owner:false});
        if(boundary==='privacy reset') window.dispatchEvent(new Event('focus'));
        if(boundary==='refetch') {w.__fixture.holdStatus=true; void w.__client.refetchQueries({queryKey:w.__statusKey,exact:true});}
        handler();
      },boundary);
      expect(await purchaseCalls(page)).toEqual([]);
      expect(await cancelCalls(page)).toEqual([]);
    });
  });

  it("suppresses a late cancellation failure after privacy reset",async()=>{
    await withPanel({holdMutation:true,status:{canCancelRenewal:true},failures:{"hiring.cancelAtPeriodEnd":{message:"Old session billing failure."}}},async page=>{
      await button(page,"Cancel Hiring renewal").click();
      await expect.poll(()=>cancelCalls(page)).toHaveLength(1);
      await page.evaluate(()=>{
        const w=window as any;
        window.dispatchEvent(new Event('focus'));
        w.__held.splice(0).forEach((resolve:()=>void)=>resolve());
      });
      await page.getByRole("heading",{name:"Hiring allowance and billing"}).waitFor();
      expect(await page.locator("#root").innerText()).not.toContain("Old session billing failure.");
      expect(await page.locator("#root").innerText()).not.toContain("Hiring renewal is cancelled.");
      expect(await cancelCalls(page)).toHaveLength(1);
    });
  });

  it("does not borrow fresh authorization for an old owner handler after an actual status refetch", async () => {
    await withPanel({},async page=>{
      await button(page,"Add Hiring allowance").evaluate(element=>{
        const propsKey=Object.keys(element).find(key=>key.startsWith('__reactProps$'))!;
        (window as any).__oldPurchase=(element as any)[propsKey].onClick;
        (window as any).__fixture.status.owner=false;
      });
      await button(page,"Refresh Hiring status").click();
      await page.getByText("Only the verified organization owner can purchase Hiring or cancel its renewal.",{exact:true}).waitFor();
      await page.evaluate(()=>(window as any).__oldPurchase());
      expect(await purchaseCalls(page)).toEqual([]);
    });
  });
});

describe("authoritative repurchase and invitation quota visibility", () => {
  it("honors explicit server repurchase permission even when immutable historical billing IDs remain in the response", async () => {
    await withPanel({ status: { active: false, state: "subscription_suspended", hasBillingSubscription: true, billingOrderId: "historical-order", billingSubscriptionId: "historical-subscription", billingRenewalCancelled: true, canPurchase: true } }, async page => {
      await button(page, "Add Hiring allowance").click();
      await expect.poll(() => purchaseCalls(page)).toEqual([{ path: "hiring.createCheckout", input: { orgId }, type: "mutation" }]);
      expect(await cancelCalls(page)).toEqual([]);
      expect(await page.locator('a[href*="pricing"],a[href*="billing=personal"]').count()).toBe(0);
      expect(await page.locator("#root").innerText()).not.toMatch(/pilot/i);
    });
  });

  it.each([false, null, undefined])("never infers purchase authority when the server canPurchase decision is %s", async canPurchase => {
    await withPanel({ status: { active: false, canCancelRenewal: false, canPurchase } }, async page => {
      await page.getByText("No assessments yet", { exact: true }).waitFor();
      expect(await button(page, "Add Hiring allowance").count()).toBe(0);
      expect(await purchaseCalls(page)).toEqual([]);
    });
  });

  it("refetches the independent Hiring quota badge immediately after a successful applicant invitation", async () => {
    const assessmentId = "22222222-2222-4222-8222-222222222222";
    await withPanel({
      status: { active: true, basis: "stripe", state: "active", quota: 100, used: 9, remaining: 91, canPurchase: false, canCancelRenewal: true },
      assessment: { id: assessmentId, title: "Synthetic applicant assessment", courseKey: "class2-water", courseLabel: "Class 2 Water", modules: ["Treatment"], questionCount: 5, timeLimitMinutes: null, difficultyMode: "mixed", passingScore: 70, createdAtMs: 1000, expiresAtMs: 4102444800000, candidates: 0, completed: 0 },
      catalog: { courses: [{ courseKey: "class2-water", label: "Class 2 Water", count: 5, modules: [{ name: "Treatment", count: 5 }] }], candidates: [] },
    }, async page => {
      const badge = page.getByRole("region", { name: "Hiring allowance and billing" });
      await expect.poll(() => badge.innerText()).toContain("91 of 100 remaining");
      await page.getByRole("button", { name: /Synthetic applicant assessment/ }).click();
      await button(page, "Applicant add-on").click();
      await page.getByLabel("Applicant name", { exact: true }).fill("Synthetic applicant");
      await page.getByLabel("Applicant email", { exact: true }).fill("applicant@example.test");
      const readsBefore = (await calls(page, "hiring.status")).length;
      await button(page, "Create invitation link").click();
      await expect.poll(() => calls(page, "recruitment.invite")).toEqual([{ path: "recruitment.invite", input: { orgId, assessmentId, candidateEmail: "applicant@example.test", candidateName: "Synthetic applicant" }, type: "mutation" }]);
      await expect.poll(async () => (await calls(page, "hiring.status")).length).toBeGreaterThan(readsBefore);
      await expect.poll(() => badge.innerText()).toContain("90 of 100 remaining");
      expect(await purchaseCalls(page)).toEqual([]);
      expect(await page.locator('a[href*="pricing"]').count()).toBe(0);
    });
  });
});
