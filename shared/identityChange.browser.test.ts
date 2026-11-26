import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser } from "@playwright/test";
import { build } from "esbuild";

let browser: Browser;
let script: string;
beforeAll(async () => {
  const result = await build({
    bundle: true, write: false, format: "iife",
    stdin: { resolveDir: process.cwd(), loader: "ts", contents: `
      import { notifyIdentityChange, watchIdentityChanges } from './shared/identityChange';
      window.notify = notifyIdentityChange;
      window.events = 0;
      window.stop = watchIdentityChanges(() => window.events++);
    ` },
  });
  script = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); });

describe("cross-tab identity hint", () => {
  it("delivers repeated non-identifying hints exactly once to a second same-origin tab", async () => {
    const context = await browser.newContext();
    await context.route("**/*", route => route.request().url() === "https://fixture.invalid/"
      ? route.fulfill({ contentType: "text/html", body: "<!doctype html><title>fixture</title>" })
      : route.abort("blockedbyclient"));
    try {
      const a = await context.newPage();
      const b = await context.newPage();
      await a.goto("https://fixture.invalid/");
      await b.goto("https://fixture.invalid/");
      await a.addScriptTag({ content: script });
      await b.addScriptTag({ content: script });
      await a.evaluate(() => (window as any).notify());
      await expect.poll(() => b.evaluate(() => (window as any).events)).toBe(1);
      const first = await a.evaluate(() => localStorage.getItem("echelon.identity-change.event"));
      expect(first).toMatch(/^[0-9a-f]{32}$/);
      await a.evaluate(() => (window as any).notify());
      await expect.poll(() => b.evaluate(() => (window as any).events)).toBe(2);
      expect(await a.evaluate(() => localStorage.getItem("echelon.identity-change.event"))).not.toBe(first);
      await b.evaluate(() => (window as any).stop());
      await a.evaluate(() => (window as any).notify());
      await b.waitForTimeout(100);
      expect(await b.evaluate(() => (window as any).events)).toBe(2);
    } finally { await context.close(); }
  });
});
