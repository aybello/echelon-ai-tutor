import safety from "./test-safety.cjs";
import { build } from "esbuild";
import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
safety.assertPreloaded();
const temp = mkdtempSync(join(tmpdir(), "learner-component-"));
const output = process.env.LEARNER_BROWSER_SCREENSHOT;
let browser;
let server;
try {
  await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Component from './client/src/components/AdminLearnerActivity'; createRoot(document.getElementById('root')).render(<Component/>);`, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, outfile: join(temp, "app.js"), jsx: "automatic", define: { "process.env.NODE_ENV": '"test"' }, plugins: [{ name: "mock-rpc-only", setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/trpc$/ }, () => ({ path: "rpc", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ resolveDir: process.cwd(), loader: "js", contents: `import {useState,useEffect} from 'react';
const learner={key:'email:learner@example.test',selection:{email:'learner@example.test'},name:null,email:'learner@example.test'};
window.fixture={search:'ready',activity:'ready'};window.calls=[];
const feed={items:[{key:'login',kind:'signin',label:'Signed in',at:'2026-11-17T12:00:00Z',course:null,detail:'Email OTP'},{key:'mock',kind:'mock',label:'Mock exam',at:'2026-11-16T12:00:00Z',course:'oit',detail:'Canonical saved result; not a certification exam',correct:8,total:10}],lastObservedAt:'2026-11-17T12:00:00Z',recordedStudySeconds:90,partial:false};
function useQuery(kind,input,options){const[,tick]=useState(0);useEffect(()=>{const fn=()=>tick(n=>n+1);window.addEventListener('fixture',fn);return()=>window.removeEventListener('fixture',fn)},[]);useEffect(()=>{if(options.enabled)window.calls.push({kind,input})},[kind,JSON.stringify(input),options.enabled]);const status=window.fixture[kind];const enabled=options.enabled;return{isLoading:enabled&&status==='loading',isError:enabled&&status==='error',isFetching:false,refetch:()=>{window.fixture[kind]='ready';window.dispatchEvent(new Event('fixture'))},data:!enabled||status==='loading'||status==='error'?undefined:kind==='search'?{learners:status==='empty'?[]:[learner],partial:status==='partial'}:{...feed,items:status==='empty'?[]:feed.items,partial:status==='partial'}}}
export const trpc={admin:{learnerSearch:{useQuery:(i,o)=>useQuery('search',i,o)},learnerActivity:{useQuery:(i,o)=>useQuery('activity',i,o)}}};` }));
    builder.onResolve({ filter: /^@shared\// }, args => ({ path: resolve("shared", args.path.slice(8) + ".ts") }));
  } }] });
  server = createServer((req, res) => {
    res.setHeader("Content-Type", req.url === "/app.js" ? "application/javascript" : "text/html");
    res.end(req.url === "/app.js" ? readFileSync(join(temp, "app.js")) : '<!doctype html><html><head><title>Learner activity component test</title></head><body style="font:16px system-ui;color:#0f172a;margin:24px"><main id="root"></main><script src="/app.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
  await page.goto(origin);
  const fixture = async (kind, state) => { await page.evaluate(([kind, state]) => { window.fixture[kind] = state; window.dispatchEvent(new Event("fixture")); }, [kind, state]); };
  const text = async value => { await page.getByText(value, { exact: false }).first().waitFor(); };
  await text("Select a learner");
  await page.getByLabel("Name or email").fill("learner@example.test");
  await fixture("search", "loading");
  await page.getByRole("button", { name: "Search learners" }).click();
  await text("Searching learners");
  await fixture("search", "error"); await text("Learner search could not load");
  await page.getByRole("button", { name: "Retry search" }).click();
  await fixture("search", "empty"); await text("No matching learners");
  await fixture("search", "partial"); await text("Search results are limited");
  await fixture("activity", "loading");
  await page.getByRole("button", { name: /Email-only learner/ }).click(); await text("Loading learner activity");
  await fixture("activity", "error"); await text("Learner activity could not load");
  await page.getByRole("button", { name: "Retry activity" }).click(); await text("Email OTP"); await text("8 / 10 correct");
  await page.getByLabel("History window").selectOption("30");
  assert.equal(await page.evaluate(() => window.calls.some(call => call.kind === "activity" && call.input.days === 30)), true);
  await fixture("activity", "empty"); await text("No supported activity");
  await fixture("activity", "partial"); await text("Partial history");
  await page.setViewportSize({ width: 390, height: 844 });
  await text("Mock exam");
  if (output) await page.screenshot({ path: output, fullPage: true });
  assert.deepEqual(errors, []);
  console.log("PASS: actual Learners component search/select/loading/empty/error/retry/7→30 filter/partial history/mobile; mocked RPC only, external requests blocked.");
} finally {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
  rmSync(temp, { recursive: true, force: true });
}
