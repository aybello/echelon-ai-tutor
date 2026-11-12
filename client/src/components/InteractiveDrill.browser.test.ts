import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";

let browser: Browser;
let script: string;

// All content is synthetic, including IDs, labels, prompts, and explanations.
const examples = [
  { id: "swipe-yes", mode: "rapid-swipe", prompt: "Synthetic swipe one", instruction: "Synthetic swipe directions", correctAnswer: true, explanation: "Synthetic yes explanation." },
  { id: "swipe-no", mode: "rapid-swipe", prompt: "Synthetic swipe two", correctAnswer: false, explanation: "Synthetic no explanation." },
  { id: "match", mode: "speed-match", prompt: "Synthetic matching", pairs: [
    { id: "pair-a", left: "Synthetic left A", right: "Synthetic right A" },
    { id: "pair-b", left: "Synthetic left B", right: "Synthetic right B" },
  ], explanation: "Synthetic matching complete." },
  { id: "odd", mode: "odd-one-out", prompt: "Synthetic odd", options: [
    { id: "odd-a", label: "Synthetic odd A" }, { id: "odd-b", label: "Synthetic odd B" },
  ], correctOptionId: "odd-b", explanation: "Synthetic odd explanation." },
  { id: "cause", mode: "cause-effect", prompt: "Synthetic cause", options: [
    { id: "cause-a", label: "Synthetic cause A" }, { id: "cause-b", label: "Synthetic cause B" },
  ], correctOptionId: "cause-a", explanation: "Synthetic cause explanation." },
  { id: "flaw", mode: "tap-the-flaw", prompt: "Synthetic flaw", options: [
    { id: "flaw-a", label: "Synthetic flaw A" }, { id: "flaw-b", label: "Synthetic flaw B" },
  ], correctOptionId: "flaw-b", explanation: "Synthetic flaw explanation." },
  { id: "order-before", mode: "before-after", prompt: "Synthetic order one", correctAnswer: "before", explanation: "Synthetic before explanation." },
  { id: "order-after", mode: "before-after", prompt: "Synthetic order two", correctAnswer: "after", explanation: "Synthetic after explanation." },
];

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
        import InteractiveDrill from './client/src/components/InteractiveDrill';
        createRoot(document.getElementById('root')).render(<InteractiveDrill examples={window.__drillExamples} />);
      `,
    },
    loader: { ".css": "empty" },
  });
  script = result.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);

afterAll(async () => { await browser?.close(); });

async function withDrill(run: (page: Page) => Promise<void>, data: unknown[] = examples) {
  const page = await browser.newPage();
  const requests: string[] = [];
  const sockets: string[] = [];
  page.on("request", request => requests.push(request.url()));
  page.on("websocket", socket => sockets.push(socket.url()));
  // No origin is loaded: every routable request is aborted, including any accidental fetch.
  await page.route("**/*", route => route.abort("blockedbyclient"));
  try {
    await page.setContent('<!doctype html><html><body><button id="outside">Outside drill</button><div id="root"></div></body></html>');
    await page.locator("#outside").focus();
    await page.evaluate(input => {
      const state = window as any;
      state.__drillExamples = input;
      state.__storageWrites = [];
      // about:blank has an opaque origin. Replace localStorage before React loads so both
      // method calls and property-style writes are observable rather than silently missed.
      const values: Record<string, string> = {};
      const storage = new Proxy({
        get length() { return Object.keys(values).length; },
        key: (index: number) => Object.keys(values)[index] ?? null,
        getItem: (key: string) => values[key] ?? null,
        setItem: (key: string, value: string) => { state.__storageWrites.push(["setItem", key, value]); values[key] = String(value); },
        removeItem: (key: string) => { state.__storageWrites.push(["removeItem", key]); delete values[key]; },
        clear: () => { state.__storageWrites.push(["clear"]); for (const key of Object.keys(values)) delete values[key]; },
      }, {
        set: (_target, key, value) => { state.__storageWrites.push(["property set", String(key), value]); values[String(key)] = String(value); return true; },
        deleteProperty: (_target, key) => { state.__storageWrites.push(["property delete", String(key)]); delete values[String(key)]; return true; },
      });
      Object.defineProperty(window, "localStorage", { configurable: true, get: () => storage });
    }, data);
    await page.addScriptTag({ content: script });
    await run(page);
  } finally {
    try {
      expect(await page.evaluate(() => (window as any).__storageWrites)).toEqual([]);
      expect(requests).toEqual([]);
      expect(sockets).toEqual([]);
    } finally { await page.close(); }
  }
}

const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const feedback = (page: Page) => page.locator(".interactive-drill__feedback-region");
async function expectFeedback(page: Page, text: string) {
  await expect.poll(() => feedback(page).innerText()).toContain(text);
}
async function chooseMode(page: Page, name: string) {
  await page.getByRole("navigation", { name: "Choose a practice mode" })
    .getByRole("button", { name: new RegExp(`^${name}`) }).click();
}
async function expectHeading(page: Page, title: string) {
  await page.getByRole("heading", { name: title, exact: true }).waitFor();
}

describe("InteractiveDrill in an isolated browser", () => {
  it("exposes named mode buttons, an accessible activity and live feedback", async () => withDrill(async page => {
    await expectHeading(page, "Synthetic swipe one");
    const nav = page.getByRole("navigation", { name: "Choose a practice mode" });
    expect(await nav.getByRole("button").count()).toBe(6);
    expect(await nav.getByRole("button", { name: /^Rapid Swipe/ }).getAttribute("aria-current")).toBe("true");
    expect(await page.getByRole("region", { name: "Synthetic swipe one" }).count()).toBe(1);
    expect(await feedback(page).getAttribute("role")).toBe("status");
    expect(await feedback(page).getAttribute("aria-live")).toBe("polite");
    expect(await feedback(page).getAttribute("aria-atomic")).toBe("true");
    expect(await button(page, "Previous").isDisabled()).toBe(true);
    expect(await button(page, "Next activity →").isDisabled()).toBe(true);
    expect(await page.getByText("Practice · not saved").count()).toBe(1);
    await button(page, "Yes").focus();
    await page.keyboard.press("Enter");
    await expectFeedback(page, "Correct");
    await expectFeedback(page, "Synthetic yes explanation.");
    expect(await button(page, "Yes").isDisabled()).toBe(true);
    expect(await button(page, "No").isDisabled()).toBe(true);
    expect(await button(page, "Next activity →").isDisabled()).toBe(false);
  }));

  it("keeps initial focus and moves keyboard focus through answers and navigation", async () => withDrill(async page => {
    await expectHeading(page, "Synthetic swipe one");
    expect(await page.locator("#outside").evaluate(el => el === document.activeElement)).toBe(true);
    await button(page, "Yes").focus();
    await page.keyboard.press("Enter");
    await expectFeedback(page, "Synthetic yes explanation.");
    expect(await feedback(page).evaluate(el => el === document.activeElement)).toBe(true);
    await page.keyboard.press("Tab");
    expect(await button(page, "Next activity →").evaluate(el => el === document.activeElement)).toBe(true);
    await page.keyboard.press("Enter");
    const second = page.getByRole("heading", { name: "Synthetic swipe two", exact: true });
    await expectHeading(page, "Synthetic swipe two");
    expect(await second.evaluate(el => el === document.activeElement)).toBe(true);
    await button(page, "Previous").focus();
    await page.keyboard.press("Enter");
    expect(await page.getByRole("heading", { name: "Synthetic swipe one", exact: true }).evaluate(el => el === document.activeElement)).toBe(true);
    await chooseMode(page, "Odd-One-Out");
    expect(await page.getByRole("heading", { name: "Synthetic odd", exact: true }).evaluate(el => el === document.activeElement)).toBe(true);
    await button(page, "Synthetic odd A").focus();
    await page.keyboard.press("Space");
    await expectFeedback(page, "Not quite");
    expect(await feedback(page).evaluate(el => el === document.activeElement)).toBe(true);
    await page.keyboard.press("Tab");
    expect(await button(page, "Start again").evaluate(el => el === document.activeElement)).toBe(true);
    await page.keyboard.press("Enter");
    expect(await page.getByRole("heading", { name: "Synthetic odd", exact: true }).evaluate(el => el === document.activeElement)).toBe(true);
  }));

  it("moves focus from disabled matching buttons on partial and completed pairs", async () => withDrill(async page => {
    await chooseMode(page, "Speed-Match");
    await button(page, "Synthetic left A").focus();
    await page.keyboard.press("Enter");
    await button(page, "Synthetic right A").focus();
    await page.keyboard.press("Enter");
    await expectFeedback(page, "Pair matched. Keep going.");
    expect(await feedback(page).evaluate(el => el === document.activeElement)).toBe(true);
    await button(page, "Synthetic left B").focus();
    await page.keyboard.press("Enter");
    await button(page, "Synthetic right B").focus();
    await page.keyboard.press("Enter");
    await expectFeedback(page, "Synthetic matching complete.");
    expect(await feedback(page).evaluate(el => el === document.activeElement)).toBe(true);
  }));

  it("grades both rapid-swipe answers correctly across retries and next/previous cards", async () => withDrill(async page => {
    await expectHeading(page, "Synthetic swipe one");
    await button(page, "No").click();
    await expectFeedback(page, "Not quite");
    await expectFeedback(page, "The correct answer is Yes. Synthetic yes explanation.");
    await chooseMode(page, "Rapid Swipe");
    expect((await feedback(page).innerText()).trim()).toBe("");
    expect(await button(page, "Yes").isDisabled()).toBe(false);
    await button(page, "Yes").click();
    await expectFeedback(page, "Correct");
    await button(page, "Next activity →").click();
    await expectHeading(page, "Synthetic swipe two");
    expect((await feedback(page).innerText()).trim()).toBe("");
    await button(page, "Yes").click();
    await expectFeedback(page, "Not quite");
    await expectFeedback(page, "The correct answer is No. Synthetic no explanation.");
    await button(page, "Start again").click();
    await expectHeading(page, "Synthetic swipe one");
    await button(page, "Yes").click();
    await button(page, "Next activity →").click();
    await button(page, "No").click();
    await expectFeedback(page, "Correct");
    await expectFeedback(page, "Synthetic no explanation.");
    await button(page, "Previous").click();
    await expectHeading(page, "Synthetic swipe one");
    expect((await feedback(page).innerText()).trim()).toBe("");
    expect(await button(page, "Yes").isDisabled()).toBe(false);
  }));

  it("accepts deliberate touch swipes but ignores short, vertical, cancelled, and mouse gestures", async () => withDrill(async page => {
    await expectHeading(page, "Synthetic swipe one");
    const swipe = page.locator(".interactive-drill__swipe");
    const gesture = async (endX: number, endY: number, pointerType = "touch", cancel = false) => {
      const base = { pointerId: 12, isPrimary: true, pointerType };
      await swipe.dispatchEvent("pointerdown", { ...base, clientX: 100, clientY: 100 });
      if (cancel) await swipe.dispatchEvent("pointercancel", base);
      await swipe.dispatchEvent("pointerup", { ...base, clientX: endX, clientY: endY });
    };
    await gesture(130, 100);
    await gesture(160, 180);
    await gesture(180, 100, "touch", true);
    await gesture(180, 100, "mouse");
    expect((await feedback(page).innerText()).trim()).toBe("");
    expect(await button(page, "Next activity →").isDisabled()).toBe(true);
    await gesture(180, 100);
    await expectFeedback(page, "Correct");
    await button(page, "Next activity →").click();
    await expectHeading(page, "Synthetic swipe two");
    await gesture(20, 100);
    await expectFeedback(page, "Correct");
    await expectFeedback(page, "Synthetic no explanation.");
  }));

  it("captures a native pen so an outside release answers once", async () => withDrill(async page => {
    await expectHeading(page, "Synthetic swipe one");
    const swipe = page.locator(".interactive-drill__swipe");
    const box = await swipe.boundingBox();
    if (!box) throw new Error("Swipe target has no bounding box");
    await swipe.evaluate(element => {
      (window as any).__penEvents = [];
      for (const type of ["pointerdown", "gotpointercapture", "pointerup"]) {
        element.addEventListener(type, event => {
          const pointer = event as globalThis.PointerEvent;
          (window as any).__penEvents.push([type, pointer.pointerType, pointer.pointerId]);
        });
      }
    });
    const cdp = await page.context().newCDPSession(page);
    const x = box.x + 10;
    const y = box.y + box.height - 2;
    try {
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, pointerType: "pen" });
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1, pointerType: "pen" });
      const events = await page.evaluate(() => (window as any).__penEvents as [string, string, number][]);
      const down = events.find(event => event[0] === "pointerdown" && event[1] === "pen");
      expect(down).toBeDefined();
      expect(await swipe.evaluate((element, id) => element.hasPointerCapture(id), down![2])).toBe(true);
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x + 100, y: y + 5, button: "left", buttons: 1, pointerType: "pen" });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: x + 100, y: y + 5, button: "left", buttons: 0, clickCount: 1, pointerType: "pen" });
      await expectFeedback(page, "Synthetic yes explanation.");
      const finalEvents = await page.evaluate(() => (window as any).__penEvents as [string, string, number][]);
      expect(finalEvents.some(event => event[0] === "gotpointercapture" && event[2] === down![2])).toBe(true);
      expect(finalEvents.filter(event => event[0] === "pointerup" && event[2] === down![2])).toHaveLength(1);
    } finally {
      await cdp.detach();
    }
  }));

  it("does not answer from cancelled, lost, unrelated or already-answered pointer sequences", async () => withDrill(async page => {
    await expectHeading(page, "Synthetic swipe one");
    const swipe = page.locator(".interactive-drill__swipe");
    const base = { pointerId: 12, isPrimary: true, pointerType: "touch", button: 0 };
    await swipe.dispatchEvent("pointerdown", { ...base, clientX: 100, clientY: 100 });
    await swipe.dispatchEvent("pointerup", { ...base, pointerId: 13, clientX: 180, clientY: 100 });
    await swipe.dispatchEvent("lostpointercapture", base);
    await swipe.dispatchEvent("pointerup", { ...base, clientX: 180, clientY: 100 });
    await swipe.dispatchEvent("pointerdown", { ...base, pointerType: "pen", button: 2, clientX: 100, clientY: 100 });
    await swipe.dispatchEvent("pointerup", { ...base, pointerType: "pen", clientX: 180, clientY: 100 });
    expect((await feedback(page).innerText()).trim()).toBe("");
    await swipe.dispatchEvent("pointerdown", { ...base, clientX: 100, clientY: 100 });
    await swipe.dispatchEvent("pointerup", { ...base, pointerId: 13, clientX: 180, clientY: 100 });
    expect((await feedback(page).innerText()).trim()).toBe("");
    await swipe.dispatchEvent("pointerup", { ...base, clientX: 180, clientY: 100 });
    await expectFeedback(page, "Synthetic yes explanation.");
    await chooseMode(page, "Rapid Swipe");
    await swipe.dispatchEvent("pointerdown", { ...base, clientX: 100, clientY: 100 });
    await button(page, "No").click();
    await expectFeedback(page, "The correct answer is Yes.");
    await swipe.dispatchEvent("pointerup", { ...base, clientX: 180, clientY: 100 });
    await expectFeedback(page, "The correct answer is Yes.");
  }));

  it("handles matching selection, mismatch, partial progress, completion, and reset", async () => withDrill(async page => {
    await chooseMode(page, "Speed-Match");
    await expectHeading(page, "Synthetic matching");
    const left = page.getByRole("group", { name: "First items" });
    const right = page.getByRole("group", { name: "Second items" });
    expect(await right.getByRole("button").allTextContents()).toEqual(["Synthetic right B", "Synthetic right A"]);
    const leftA = left.getByRole("button", { name: "Synthetic left A", exact: true });
    await leftA.click();
    expect(await leftA.getAttribute("aria-pressed")).toBe("true");
    await leftA.click();
    expect(await leftA.getAttribute("aria-pressed")).toBe("false");
    await leftA.click();
    await right.getByRole("button", { name: "Synthetic right B", exact: true }).click();
    await expectFeedback(page, "Not quite");
    await expectFeedback(page, "Those do not match. Try another pair.");
    expect(await leftA.getAttribute("aria-pressed")).toBe("false");
    expect(await leftA.isDisabled()).toBe(false);
    // Select in reverse column order on the first successful pair.
    await right.getByRole("button", { name: "Synthetic right A", exact: true }).click();
    await leftA.click();
    await expectFeedback(page, "Pair matched. Keep going.");
    expect(await left.getByRole("button", { name: "Synthetic left A · Matched" }).isDisabled()).toBe(true);
    expect(await right.getByRole("button", { name: "Synthetic right A · Matched" }).isDisabled()).toBe(true);
    await left.getByRole("button", { name: "Synthetic left B", exact: true }).click();
    await right.getByRole("button", { name: "Synthetic right B", exact: true }).click();
    await expectFeedback(page, "Correct");
    await expectFeedback(page, "Synthetic matching complete.");
    expect(await left.getByRole("button", { name: "Synthetic left B · Matched" }).isDisabled()).toBe(true);
    await button(page, "Start again").click();
    await expectHeading(page, "Synthetic matching");
    expect((await feedback(page).innerText()).trim()).toBe("");
    expect(await left.getByRole("button", { name: "Synthetic left A", exact: true }).isDisabled()).toBe(false);
    expect(await left.getByRole("button", { name: "Synthetic left A", exact: true }).getAttribute("aria-pressed")).toBe("false");
  }));

  const choices = [
    { mode: "Odd-One-Out", prompt: "Synthetic odd", wrong: "Synthetic odd A", correct: "Synthetic odd B", explanation: "Synthetic odd explanation." },
    { mode: "Cause Effect", prompt: "Synthetic cause", wrong: "Synthetic cause B", correct: "Synthetic cause A", explanation: "Synthetic cause explanation." },
    { mode: "Tap-the-Flaw", prompt: "Synthetic flaw", wrong: "Synthetic flaw A", correct: "Synthetic flaw B", explanation: "Synthetic flaw explanation." },
  ];
  for (const choice of choices) {
    it(`grades wrong and correct answers on repeated ${choice.mode} attempts`, async () => withDrill(async page => {
      await chooseMode(page, choice.mode);
      await expectHeading(page, choice.prompt);
      await button(page, choice.wrong).click();
      await expectFeedback(page, "Not quite");
      await expectFeedback(page, `The correct answer is ${choice.correct}. ${choice.explanation}`);
      expect(await button(page, choice.correct).isDisabled()).toBe(true);
      expect(await button(page, choice.wrong).isDisabled()).toBe(true);
      await button(page, "Start again").click();
      expect((await feedback(page).innerText()).trim()).toBe("");
      expect(await button(page, choice.correct).isDisabled()).toBe(false);
      await button(page, choice.correct).click();
      await expectFeedback(page, "Correct");
      await expectFeedback(page, choice.explanation);
      expect(await feedback(page).innerText()).not.toContain("The correct answer is");
      await chooseMode(page, "Rapid Swipe");
      await chooseMode(page, choice.mode);
      await expectHeading(page, choice.prompt);
      expect((await feedback(page).innerText()).trim()).toBe("");
      await button(page, choice.correct).click();
      await expectFeedback(page, "Correct");
    }));
  }

  it("grades Before/After in both directions and resets when switching modes", async () => withDrill(async page => {
    await chooseMode(page, "Before/After");
    await expectHeading(page, "Synthetic order one");
    await button(page, "After").click();
    await expectFeedback(page, "The correct answer is Before. Synthetic before explanation.");
    await chooseMode(page, "Speed-Match");
    await chooseMode(page, "Before/After");
    await expectHeading(page, "Synthetic order one");
    expect((await feedback(page).innerText()).trim()).toBe("");
    await button(page, "Before").click();
    await expectFeedback(page, "Correct");
    await button(page, "Next activity →").click();
    await expectHeading(page, "Synthetic order two");
    await button(page, "Before").click();
    await expectFeedback(page, "The correct answer is After. Synthetic after explanation.");
    await button(page, "Previous").click();
    await button(page, "Before").click();
    await button(page, "Next activity →").click();
    await button(page, "After").click();
    await expectFeedback(page, "Correct");
    await expectFeedback(page, "Synthetic after explanation.");
    await button(page, "Start again").click();
    await expectHeading(page, "Synthetic order one");
    expect(await button(page, "Before").isDisabled()).toBe(false);
  }));

  it("shows an empty state when no examples are supplied", async () => withDrill(async page => {
    await page.getByText("No practice activities are available yet.").waitFor();
    expect(await page.getByRole("navigation", { name: "Choose a practice mode" }).count()).toBe(0);
  }, []));

  it("reports invalid choices and lets the user advance to a valid card", async () => withDrill(async page => {
    await expectHeading(page, "Synthetic invalid choice");
    expect(await page.getByRole("status").filter({ hasText: "This activity is unavailable" }).count()).toBe(1);
    expect(await button(page, "Next activity →").isDisabled()).toBe(false);
    await button(page, "Next activity →").click();
    await expectHeading(page, "Synthetic valid choice");
    await button(page, "Synthetic valid A").click();
    await expectFeedback(page, "Correct");
  }, [
    { id: "invalid", mode: "odd-one-out", prompt: "Synthetic invalid choice", options: [{ id: "only", label: "Synthetic only" }], correctOptionId: "only", explanation: "Synthetic invalid explanation." },
    { id: "valid", mode: "odd-one-out", prompt: "Synthetic valid choice", options: [{ id: "a", label: "Synthetic valid A" }, { id: "b", label: "Synthetic valid B" }], correctOptionId: "a", explanation: "Synthetic valid explanation." },
  ]));
});
