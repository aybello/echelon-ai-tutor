import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser } from "@playwright/test";
import { build } from "esbuild";
let browser: Browser;
let script: string;
beforeAll(async () => {
  const result = await build({ bundle: true, write: false, format: "iife", jsx: "automatic", stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
    import React, { useState } from 'react';
    import { createRoot } from 'react-dom/client';
    import Status from './client/src/components/PracticeSaveStatus';
    import { useAttemptLogger } from './client/src/components/QuizModeBar';
    function App() {
      const [, refresh] = useState(0);
      const log = useAttemptLogger('oit');
      return <><button id="answer" onClick={() => log({questionId: 4, selectedIndex: 2, attemptToken: window.receipt})}>Answer</button>
        <button id="switch" onClick={() => {window.identity = 18; refresh(x=>x+1)}}>Switch</button><Status courseKey="oit" /></>;
    }
    window.identity = 17;
    window.receipt = 'e30.' + btoa(JSON.stringify({exp: Math.floor(Date.now()/1000)+3600})) + '.signature';
    createRoot(document.getElementById('root')).render(<App/>);
  ` }, plugins: [{ name: "isolated-trpc", setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/trpc$|^sonner$/ }, args => ({ path: args.path, namespace: "mock" }));
    builder.onLoad({ filter: /.*/, namespace: "mock" }, args => ({ contents: args.path === "sonner" ? "export const toast = {error() {}}" : `
      export const trpc = {
        auth: { me: { useQuery: () => ({data:{id:window.identity}, isLoading:false}) } },
        dashboardAuth: { me: { useQuery: () => ({data:null, isLoading:false}) } },
        quiz: { logAttempt: { useMutation: () => ({mutateAsync: async input => {
          const response = await fetch('https://practice.invalid/attempt', {method:'POST',body:JSON.stringify(input)});
          return response.json();
        }}) } }
      };
    ` }));
  } }], alias: { "@": `${process.cwd()}/client/src`, "@shared": `${process.cwd()}/shared` } });
  script = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);
afterAll(async () => { await browser?.close(); });
async function setup(loseAck = false) {
  const page = await browser.newPage();
  const calls: Record<string, unknown>[] = [];
  await page.route("**/*", async route => {
    const url = route.request().url();
    if (url === "https://practice.invalid/") return route.fulfill({ contentType: "text/html", body: '<div id="root"></div>' });
    if (url === "https://practice.invalid/attempt") {
      calls.push(JSON.parse(route.request().postData()!));
      if (loseAck && calls.length === 1) return route.abort("failed");
      return route.fulfill({ contentType: "application/json", body: '{"success":true,"correct":true}' });
    }
    return route.abort("blockedbyclient");
  });
  await page.goto("https://practice.invalid/");
  await page.addScriptTag({ content: script });
  return { page, calls };
}
describe("practice recovery component in an offline intercepted browser", () => {
  it("initial HTTP and explicit retry use the exact same UUID/input after lost ack", async () => {
    const { page, calls } = await setup(true);
    await page.locator("#answer").click();
    await page.getByText(/Save not confirmed/).first().waitFor();
    expect(calls).toHaveLength(1);
    await page.getByRole("button", {name:"Retry pending answer", exact:true}).click();
    await page.getByText("Answer confirmed saved to your course history.", {exact:true}).waitFor();
    expect(calls).toHaveLength(2); expect(calls[1]).toEqual(calls[0]);
    expect(calls[0].operationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("echelon:practice-save-outbox:v1")!))).toEqual([]);
    await page.close();
  });
  it("expired receipt is unrecoverable without another call; dismiss never saves", async () => {
    const { page, calls } = await setup(true);
    await page.evaluate(() => { (window as any).receipt = `e30.${btoa('{"exp":1}')}.sig`; });
    await page.locator("#answer").click(); await page.getByText(/receipt has expired/).waitFor();
    expect(await page.getByRole("button", {name:"Retry pending answer",exact:true}).isDisabled()).toBe(true);
    await page.getByRole("button", {name:/Dismiss local warning/}).click();
    await page.getByText(/did not save an answer or delete any server history/).waitFor();
    expect(calls).toHaveLength(1); await page.close();
  });
  it("scope switch hides the old learner's pending recovery and never sends", async () => {
    const { page, calls } = await setup(true); await page.locator("#answer").click();
    await page.getByText(/Save not confirmed/).first().waitFor(); await page.locator("#switch").click();
    expect(await page.getByRole("button", {name:"Retry pending answer",exact:true}).count()).toBe(0);
    expect(calls).toHaveLength(1); await page.close();
  });
  it("an undurable failed answer warning survives another answer succeeding", async () => {
    const { page, calls } = await setup(true);
    await page.evaluate(() => { const set = Storage.prototype.setItem; (window as any).restore = () => {Storage.prototype.setItem = set}; Storage.prototype.setItem = () => {throw Error('quota')}; });
    await page.locator("#answer").click(); await page.getByText(/no durable recovery record/).waitFor();
    await page.evaluate(() => (window as any).restore()); await page.locator("#answer").click();
    await page.getByText("Answer saved to your course history.", {exact:true}).waitFor();
    expect(await page.getByText(/no durable recovery record/).count()).toBe(1);
    expect(calls).toHaveLength(2); await page.close();
  });
});
