import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";

let browser: Browser;
let script: string;
let css: string;

// Synthetic content only.
const examples = [
  { id: "sw", mode: "rapid-swipe", prompt: "Synthetic swipe", correctAnswer: true, explanation: "Synthetic." },
  { id: "match", mode: "speed-match", prompt: "Synthetic matching", pairs: [
    { id: "a", left: "Left A", right: "Right A" }, { id: "b", left: "Left B", right: "Right B" }, { id: "c", left: "Left C", right: "Right C" },
  ], explanation: "Done." },
  { id: "odd", mode: "odd-one-out", prompt: "Synthetic odd", options: [{ id: "x", label: "Odd X" }, { id: "y", label: "Odd Y" }], correctOptionId: "y", explanation: "Synthetic." },
  { id: "cause", mode: "cause-effect", prompt: "Synthetic cause", effects: [
    { id: "e1", parameter: "First parameter", direction: "increase", explanation: "Synthetic one." },
    { id: "e2", parameter: "Second parameter", direction: "decrease", explanation: "Synthetic two." },
  ], explanation: "Synthetic." },
  { id: "flaw", mode: "tap-the-flaw", prompt: "Synthetic flaw", options: [{ id: "f1", label: "Flaw one" }, { id: "f2", label: "Flaw two" }], correctOptionId: "f2", explanation: "Synthetic." },
  { id: "order", mode: "before-after", prompt: "Synthetic order", correctAnswer: "before", explanation: "Synthetic." },
];

beforeAll(async () => {
  const result = await build({
    bundle: true, write: false, format: "iife", jsx: "automatic", loader: { ".css": "empty" },
    stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import InteractiveDrill from './client/src/components/InteractiveDrill';
      window.__results = [];
      createRoot(document.getElementById('root')).render(<InteractiveDrill examples={window.__ex} onResult={r => window.__results.push(r)} saveNote={window.__note} />);
    ` },
  });
  script = result.outputFiles[0].text;
  css = await readFile("client/src/components/InteractiveDrill.css", "utf8");
  browser = await chromium.launch({ headless: true });
}, 30000);
afterAll(async () => { await browser?.close(); });

async function withDrill(run: (page: Page) => Promise<void>, note?: string) {
  const page = await browser.newPage();
  await page.route("**/*", route => route.abort());
  try {
    await page.setContent(`<!doctype html><style>${css}</style><div id="root"></div>`);
    await page.evaluate(({ ex, note }) => { (window as any).__ex = ex; (window as any).__note = note; }, { ex: examples, note });
    await page.addScriptTag({ content: script });
    await page.waitForSelector(".interactive-drill");
    await run(page);
  } finally { await page.close(); }
}
const results = (page: Page) => page.evaluate(() => (window as any).__results);
const mode = (page: Page, label: string) => page.locator(".interactive-drill__nav button", { hasText: label }).first().click();

describe("onResult", () => {
  it("reports a rapid swipe once, with the right verdict", async () => {
    await withDrill(async page => {
      await page.getByRole("button", { name: "No", exact: true }).click();
      expect(await results(page)).toEqual([{ exampleId: "sw", mode: "rapid-swipe", correct: false }]);
    });
  });

  it("reports a clean speed match as correct", async () => {
    await withDrill(async page => {
      await mode(page, "Speed-Match");
      for (const key of ["A", "B", "C"]) {
        await page.getByRole("button", { name: new RegExp(`^Left ${key}`) }).click();
        await page.getByRole("button", { name: new RegExp(`^Right ${key}`) }).click();
      }
      expect(await results(page)).toEqual([{ exampleId: "match", mode: "speed-match", correct: true }]);
    });
  });

  it("reports a speed match with a wrong pick as incorrect, only once, when it finishes", async () => {
    await withDrill(async page => {
      await mode(page, "Speed-Match");
      await page.getByRole("button", { name: /^Left A/ }).click();
      await page.getByRole("button", { name: /^Right B/ }).click();
      expect(await results(page)).toEqual([]);
      for (const key of ["A", "B", "C"]) {
        await page.getByRole("button", { name: new RegExp(`^Left ${key}`) }).click();
        await page.getByRole("button", { name: new RegExp(`^Right ${key}`) }).click();
      }
      expect(await results(page)).toEqual([{ exampleId: "match", mode: "speed-match", correct: false }]);
    });
  });

  it("reports odd-one-out, tap-the-flaw and before-after answers", async () => {
    await withDrill(async page => {
      await mode(page, "Odd-One-Out");
      await page.getByRole("button", { name: "Odd Y" }).click();
      await mode(page, "Tap-the-Flaw");
      await page.getByRole("button", { name: "Flaw one" }).click();
      await mode(page, "Before/After");
      await page.getByRole("button", { name: "Before", exact: true }).click();
      expect(await results(page)).toEqual([
        { exampleId: "odd", mode: "odd-one-out", correct: true },
        { exampleId: "flaw", mode: "tap-the-flaw", correct: false },
        { exampleId: "order", mode: "before-after", correct: true },
      ]);
    });
  });

  it("reports cause-effect only on Check answer, and correct only when every direction is right", async () => {
    await withDrill(async page => {
      await mode(page, "Cause Effect");
      const groups = page.getByRole("group", { name: /choose a direction/ });
      await groups.nth(0).getByRole("button", { name: /Increases/ }).click();
      await groups.nth(1).getByRole("button", { name: /Increases/ }).click();
      expect(await results(page)).toEqual([]);
      await page.getByRole("button", { name: "Check answer" }).click();
      expect(await results(page)).toEqual([{ exampleId: "cause", mode: "cause-effect", correct: false }]);
    });
    await withDrill(async page => {
      await mode(page, "Cause Effect");
      const groups = page.getByRole("group", { name: /choose a direction/ });
      await groups.nth(0).getByRole("button", { name: /Increases/ }).click();
      await groups.nth(1).getByRole("button", { name: /Decreases/ }).click();
      await page.getByRole("button", { name: "Check answer" }).click();
      expect(await results(page)).toEqual([{ exampleId: "cause", mode: "cause-effect", correct: true }]);
    });
  });

  it("does not report a skipped activity or a repeat click", async () => {
    await withDrill(async page => {
      await mode(page, "Odd-One-Out");
      await page.getByRole("button", { name: "Odd Y" }).click();
      await page.getByRole("button", { name: "Odd X" }).click({ force: true, timeout: 500 }).catch(() => undefined);
      expect(await results(page)).toHaveLength(1);
    });
    await withDrill(async page => {
      await mode(page, "Tap-the-Flaw");
      expect(await results(page)).toEqual([]);
    });
  });

  it("reports each answer in a timed round", async () => {
    await withDrill(async page => {
      await page.getByRole("button", { name: /Start 30-second round/ }).click();
      await page.getByRole("button", { name: "Yes", exact: true }).click();
      expect(await results(page)).toEqual([{ exampleId: "sw", mode: "rapid-swipe", correct: true }]);
    });
  });
});

describe("saveNote", () => {
  it("replaces the not-saved pill and defaults to it", async () => {
    await withDrill(async page => {
      expect(await page.locator(".interactive-drill__pill").innerText()).toBe("Progress saved");
    }, "Progress saved");
    await withDrill(async page => {
      expect(await page.locator(".interactive-drill__pill").innerText()).toBe("Practice · not saved");
    });
  });
});
