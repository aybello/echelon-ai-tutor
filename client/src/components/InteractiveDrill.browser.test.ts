import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";

let browser: Browser;
let script: string;
let css: string;

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
  css = await readFile("client/src/components/InteractiveDrill.css", "utf8");
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
      state.__choiceSnapshots = [];
      new MutationObserver(() => {
        const options = document.querySelector(".interactive-drill__options");
        const labels = options && Array.from(options.querySelectorAll("button"), button => button.textContent);
        if (labels && labels.length >= 2) state.__choiceSnapshots.push(labels);
      }).observe(document.getElementById("root")!, { childList: true, subtree: true });
    }, data);
    await page.addStyleTag({ content: css });
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

  it("does not use a fixed positional matching shortcut across boards", async () => {
    const orders: string[] = [];
    for (let i = 0; i < 8; i++) {
      await withDrill(async page => {
        orders.push((await page.getByRole("group", { name: "Second items" }).getByRole("button").allTextContents()).join("|"));
      }, [{ id: `board-${i}`, mode: "speed-match", prompt: "Synthetic board", pairs: [
        { id: "a", left: "Left A", right: "Right A" },
        { id: "b", left: "Left B", right: "Right B" },
        { id: "c", left: "Left C", right: "Right C" },
        { id: "d", left: "Left D", right: "Right D" },
      ] }]);
    }
    expect(new Set(orders).size).toBeGreaterThan(2);
    expect(orders.some(order => order !== "Right B|Right C|Right D|Right A")).toBe(true);
  });

  it("refuses ambiguous duplicate matching labels rather than scoring arbitrary IDs", async () => {
    for (const side of ["left", "right"] as const) {
      const pairs = [
        { id: "a", left: "Left A", right: "Right A" },
        { id: "b", left: "Left B", right: "Right B" },
      ];
      pairs[1][side] = `  ${pairs[0][side].toUpperCase()}  `;
      await withDrill(async page => {
        await page.getByText("This activity is unavailable because its content is incomplete or ambiguous.").waitFor();
        expect(await page.getByRole("group", { name: "Second items" }).count()).toBe(0);
      }, [{ id: "ambiguous", mode: "speed-match", prompt: "Synthetic ambiguous board", pairs }]);
    }
  });

  it("handles matching selection, mismatch, partial progress, completion, and reset", async () => withDrill(async page => {
    await chooseMode(page, "Speed-Match");
    await expectHeading(page, "Synthetic matching");
    const left = page.getByRole("group", { name: "First items" });
    const right = page.getByRole("group", { name: "Second items" });
    expect((await right.getByRole("button").allTextContents()).sort()).toEqual(["Synthetic right A", "Synthetic right B"]);
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

  for (const mode of ["odd-one-out", "cause-effect", "tap-the-flaw", "before-after"] as const) {
    it(`varies ${mode} positions without changing grading or order after answering`, async () => {
      const labels = mode === "before-after" ? ["Choice Alpha", "Choice Beta"] : ["Choice Alpha", "Choice Beta", "Choice Gamma", "Choice Delta"];
      const data = Array.from({ length: 12 }, (_, index) => ({
        id: `shuffle-${index + 1}`, mode, prompt: `Synthetic card ${index}`, explanation: "Synthetic result.",
        ...(mode === "before-after"
          ? { options: labels, correctAnswer: labels[0] }
          : { options: labels.map((label, i) => ({ id: `option-${i}`, label })), correctOptionId: "option-0" }),
      }));
      await withDrill(async page => {
        const positions = new Set<number>();
        const lastPositions = new Set<number>();
        const group = page.locator(".interactive-drill__options");
        let firstOrder: string[] = [];
        for (let i = 0; i < data.length; i++) {
          await expectHeading(page, `Synthetic card ${i}`);
          const order = await group.getByRole("button").allTextContents();
          expect([...order].sort()).toEqual([...labels].sort());
          positions.add(order.indexOf(labels[0]));
          lastPositions.add(order.indexOf(labels[labels.length - 1]));
          if (i === 0) {
            firstOrder = order;
            // The first observed committed DOM already has the final order.
            expect(order).not.toEqual(labels);
            const snapshots = await page.evaluate(() => (window as any).__choiceSnapshots as string[][]);
            expect(snapshots.length).toBeGreaterThan(0);
            expect(snapshots[0]).toEqual(order);
            await group.getByRole("button").first().focus();
            for (let j = 0; j < order.length; j++) {
              expect(await group.getByRole("button").nth(j).evaluate(el => el === document.activeElement)).toBe(true);
              if (j + 1 < order.length) await page.keyboard.press("Tab");
            }
            await button(page, labels[0]).focus();
            await page.keyboard.press("Enter");
          } else if (i === 1) {
            await button(page, labels[1]).focus();
            await page.keyboard.press("Space");
          } else {
            await button(page, labels[0]).click();
          }
          await expectFeedback(page, i === 1 ? `The correct answer is ${labels[0]}. Synthetic result.` : "Correct");
          expect(await group.getByRole("button").allTextContents()).toEqual(order);
          expect(await group.getByRole("button").evaluateAll(buttons => buttons.every(button => (button as HTMLButtonElement).disabled))).toBe(true);
          expect(await feedback(page).evaluate(el => el === document.activeElement)).toBe(true);
          if (i < data.length - 1) await button(page, "Next activity →").click();
        }
        expect(positions.size).toBe(labels.length);
        expect(lastPositions.size).toBe(labels.length);
        await button(page, "Start again").click();
        await expectHeading(page, "Synthetic card 0");
        expect(await group.getByRole("button").allTextContents()).toEqual(firstOrder);
        expect((await feedback(page).innerText()).trim()).toBe("");
        expect(await button(page, labels[0]).isEnabled()).toBe(true);
        expect(await page.evaluate(() => (window as any).__drillExamples)).toEqual(data);
      }, data);
    });
  }

  it("does not use answer identity or option IDs to choose display order", async () => {
    const labels = ["Choice Alpha", "Choice Beta", "Choice Gamma", "Choice Delta"];
    let originalOrder: string[] = [];
    for (const variant of [0, 1]) {
      const options = labels.map((label, i) => ({ id: `variant-${variant}-option-${i}`, label }));
      await withDrill(async page => {
        const group = page.locator(".interactive-drill__options");
        const order = await group.getByRole("button").allTextContents();
        if (variant === 0) originalOrder = order;
        else expect(order).toEqual(originalOrder);
        await button(page, labels[variant]).click();
        await expectFeedback(page, "Correct");
      }, [{ id: "same-activity", mode: "cause-effect", prompt: "Synthetic identity test", options, correctOptionId: options[variant].id, explanation: "Synthetic result." }]);
    }
  });

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

  it("offers supplied process labels without revealing the answer and grades both positions on mobile", async () => withDrill(async page => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expectHeading(page, "Which step happens first in the synthetic process?");
    const group = page.getByRole("group", { name: "Answer choices" });
    expect((await group.getByRole("button").allTextContents()).sort()).toEqual(["Synthetic filtration", "Synthetic mixing"]);
    expect(await page.getByRole("heading", { level: 2 }).innerText()).not.toContain("Synthetic mixing");
    expect((await feedback(page).innerText()).trim()).toBe("");
    expect(await button(page, "Before").count()).toBe(0);
    for (const label of ["Synthetic filtration", "Synthetic mixing"]) {
      const box = await button(page, label).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await button(page, "Synthetic filtration").focus();
    await page.keyboard.press("Enter");
    await expectFeedback(page, "Not quite");
    await expectFeedback(page, "The correct answer is Synthetic mixing. Synthetic first explanation.");
    expect(await feedback(page).evaluate(el => el === document.activeElement)).toBe(true);
    expect(await button(page, "Synthetic mixing").isDisabled()).toBe(true);
    await button(page, "Next activity →").click();
    await expectHeading(page, "Which step happens later in the synthetic process?");
    await button(page, "Synthetic storage").click();
    await expectFeedback(page, "Correct");
    await expectFeedback(page, "Synthetic later explanation.");
    await button(page, "Previous").click();
    await button(page, "Synthetic mixing").click();
    await expectFeedback(page, "Correct");
    await button(page, "Next activity →").click();
    await button(page, "Synthetic intake").click();
    await expectFeedback(page, "The correct answer is Synthetic storage. Synthetic later explanation.");
  }, [
    { id: "label-first", mode: "before-after", prompt: "Which step happens first in the synthetic process?", options: ["Synthetic filtration", "Synthetic mixing"], correctAnswer: " synthetic MIXING ", explanation: "Synthetic first explanation." },
    { id: "label-second", mode: "before-after", prompt: "Which step happens later in the synthetic process?", options: ["Synthetic storage", "Synthetic intake"], correctAnswer: "Synthetic storage", explanation: "Synthetic later explanation." },
  ]));

  it("rejects ambiguous or incomplete Before/After choices rather than misgrading", async () => withDrill(async page => {
    for (const heading of ["Before/After activity unavailable", "Before/After activity unavailable", "Before/After activity unavailable", "Before/After activity unavailable", "Before/After activity unavailable", "Synthetic invalid legacy"]) {
      await expectHeading(page, heading);
      expect(await page.getByRole("status").filter({ hasText: "This activity is unavailable" }).count()).toBe(1);
      expect(await page.getByRole("group", { name: "Answer choices" }).count()).toBe(0);
      expect(await page.locator(".interactive-drill__content").innerText()).not.toContain("Synthetic A → Synthetic B");
      await button(page, "Next activity →").click();
    }
    await expectHeading(page, "Synthetic valid labels");
    await button(page, "Synthetic A").click();
    await expectFeedback(page, "Correct");
  }, [
    { id: "bad-answer", mode: "before-after", prompt: "Synthetic missing answer", options: ["Synthetic A", "Synthetic B"], correctAnswer: "Synthetic C", explanation: "Synthetic" },
    { id: "duplicate", mode: "before-after", prompt: "Synthetic duplicate labels", options: ["Synthetic A", " synthetic a "], correctAnswer: "Synthetic A", explanation: "Synthetic" },
    { id: "blank", mode: "before-after", prompt: "Synthetic blank label", options: ["Synthetic A", "  "], correctAnswer: "Synthetic A", explanation: "Synthetic" },
    { id: "three", mode: "before-after", prompt: "Synthetic three choices", options: ["Synthetic A", "Synthetic B", "Synthetic C"], correctAnswer: "Synthetic A", explanation: "Synthetic" },
    { id: "reveals", mode: "before-after", prompt: "Synthetic A → Synthetic B: which is first?", options: ["Synthetic A", "Synthetic B"], correctAnswer: "Synthetic A", explanation: "Synthetic" },
    { id: "legacy-invalid", mode: "before-after", prompt: "Synthetic invalid legacy", correctAnswer: "Synthetic A", explanation: "Synthetic" },
    { id: "valid-labels", mode: "before-after", prompt: "Synthetic valid labels", options: ["Synthetic A", "Synthetic B"], correctAnswer: "Synthetic A", explanation: "Synthetic" },
  ]));

  it.each([
    { name: "A and B inside words", prompt: "Which batch comes earlier?", instruction: "Compare both stages.", options: ["A", "B"], valid: true },
    { name: "Unicode word neighbors", prompt: "éA xB2 _A B́", options: ["A", "B"], valid: true },
    { name: "three code points inside words", prompt: "xABCy", options: ["ABC", "XYZ"], valid: true },
    { name: "astral code points counted as characters", prompt: "x𐐀𐐁𐐂y", options: ["𐐀𐐁𐐂", "Z"], valid: true },
    { name: "standalone A in prompt", prompt: "Which is earlier: (A)?", options: ["A", "B"], valid: false },
    { name: "standalone B in instruction", prompt: "Which stage comes earlier?", instruction: "Consider [B].", options: ["A", "B"], valid: false },
    { name: "case and whitespace folding", prompt: "Which stage comes earlier?", instruction: "Consider  X \t Y!", options: ["x y", "Z"], valid: false },
    { name: "NFKC compatibility variant", prompt: "Which stage is Ａ?", options: ["A", "B"], valid: false },
    { name: "plain normalization still detects boundary changed by NFKC", prompt: "AⒷ", options: ["A", "Z"], valid: false },
    { name: "regex metacharacter is literal", prompt: "Choose (+).", options: ["+", "?"], valid: false },
    { name: "long label remains a conservative substring", prompt: "xABCDy", options: ["ABCD", "XYZ"], valid: false },
  ])("uses server visible-label boundaries: $name", async ({ prompt, instruction, options, valid }) => withDrill(async page => {
    if (valid) {
      await expectHeading(page, prompt);
      const group = page.getByRole("group", { name: "Answer choices" });
      expect((await group.getByRole("button").allTextContents()).sort()).toEqual([...options].sort());
      await button(page, options[0]).click();
      await expectFeedback(page, "Correct");
    } else {
      await expectHeading(page, "Before/After activity unavailable");
      expect(await page.getByRole("status").filter({ hasText: "This activity is unavailable" }).count()).toBe(1);
      expect(await page.getByRole("group", { name: "Answer choices" }).count()).toBe(0);
      expect(await page.locator(".interactive-drill__content").innerText()).not.toContain(prompt);
    }
  }, [{ id: "boundary", mode: "before-after", prompt, instruction, options, correctAnswer: options[0], explanation: "Synthetic explanation." }]));

  it("runs a timed swipe round with keyboard, touch, streak reset and answer review", async () => withDrill(async page => {
    await page.clock.install();
    await button(page, "Start 30-second round").click();
    await expectHeading(page, "30-second round");
    expect(await page.getByRole("heading", { name: "30-second round" }).evaluate(el => el === document.activeElement)).toBe(true);
    await page.keyboard.press("ArrowRight");
    await expectFeedback(page, "Synthetic yes explanation.");
    expect(await page.getByText("Time: 30s · Correct: 1/1 · Streak: 1 · Best combo: 1").count()).toBe(1);
    await button(page, "Next →").click();
    const swipe = page.locator(".interactive-drill__swipe");
    const base = { pointerId: 12, isPrimary: true, pointerType: "touch", button: 0 };
    await swipe.dispatchEvent("pointerdown", { ...base, clientX: 100, clientY: 100 });
    await swipe.dispatchEvent("pointerup", { ...base, clientX: 20, clientY: 100 });
    await expectFeedback(page, "Synthetic no explanation.");
    expect(await page.getByText("Time: 30s · Correct: 2/2 · Streak: 2 · Best combo: 2").count()).toBe(1);
    await button(page, "Next →").click();
    await button(page, "No").click();
    await expectFeedback(page, "Correct answer: Yes. Synthetic yes explanation.");
    expect(await page.getByText("Time: 30s · Correct: 2/3 · Streak: 0 · Best combo: 2").count()).toBe(1);
    await button(page, "Next →").click();
    await page.clock.fastForward(30_000);
    await expectHeading(page, "Round complete");
    expect(await page.getByText("Round complete. 2 correct out of 3 answered. Best combo: 2.").count()).toBe(1);
    expect(await page.locator(".interactive-drill__review li").count()).toBe(3);
    expect(await page.locator(".interactive-drill__review").innerText()).toContain("Your answer: No · Correct answer: Yes. Synthetic yes explanation.");
    expect(await page.getByRole("heading", { name: "Round complete" }).evaluate(el => el === document.activeElement)).toBe(true);
    await button(page, "Back to practice").click();
    await expectHeading(page, "Synthetic swipe one");
  }));
  it("locks feedback against duplicate gestures and repeated arrows and offers focused, announced Next", async () => withDrill(async page => {
    await button(page, "Start 30-second round").click();
    const yesBox = await button(page, "Yes").boundingBox();
    if (!yesBox) throw new Error("Answer button has no bounding box");
    await page.mouse.dblclick(yesBox.x + yesBox.width / 2, yesBox.y + yesBox.height / 2);
    await expectFeedback(page, "Synthetic yes explanation.");
    expect(await feedback(page).getAttribute("role")).toBe("status");
    expect(await feedback(page).getAttribute("aria-live")).toBe("polite");
    expect(await button(page, "Yes").isDisabled()).toBe(true);
    await page.keyboard.down("ArrowRight");
    await page.keyboard.down("ArrowRight");
    await page.keyboard.up("ArrowRight");
    await expectFeedback(page, "Synthetic yes explanation.");
    expect(await page.getByText(/Correct: 1\/1/).count()).toBe(1);
    await feedback(page).focus();
    await page.keyboard.press("Tab");
    expect(await button(page, "Next →").evaluate(el => el === document.activeElement)).toBe(true);
    await page.keyboard.press("Enter");
    expect(await page.getByRole("heading", { name: "Synthetic swipe two" }).evaluate(el => el === document.activeElement)).toBe(true);
    await page.keyboard.down("ArrowRight");
    await page.keyboard.down("ArrowRight");
    await page.keyboard.up("ArrowRight");
    await expectFeedback(page, "Synthetic no explanation.");
    expect(await feedback(page).evaluate(el => el === document.activeElement)).toBe(true);
    expect(await page.getByText(/Correct: 1\/2/).count()).toBe(1);
  }));

  it("pauses precise active time for feedback and page visibility, then expires at 30 seconds", async () => withDrill(async page => {
    await page.clock.install();
    await button(page, "Start 30-second round").click();
    await page.clock.fastForward(1250);
    await button(page, "Yes").click();
    await page.clock.fastForward(60_000);
    await expectFeedback(page, "Synthetic yes explanation.");
    expect(await page.getByText(/Time: 29s · Correct: 1\/1/).count()).toBe(1);
    await button(page, "Next →").click();
    // Simulate browser visibility changes, including a backgrounded answer attempt.
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
    await page.clock.fastForward(60_000);
    await page.keyboard.press("ArrowLeft");
    expect(await page.getByText(/Correct: 1\/1/).count()).toBe(1);
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange")); });
    await page.clock.fastForward(27_000);
    expect(await page.getByRole("heading", { name: "Round complete" }).count()).toBe(0);
    await page.clock.fastForward(2_000);
    await expectHeading(page, "Round complete");
    expect(await page.getByText(/Time: 0s · Correct: 1\/1/).count()).toBe(1);
  }));

  it("does not score a repeat keydown or stale pointer after feedback and Next", async () => withDrill(async page => {
    await button(page, "Start 30-second round").click();
    const swipe = page.locator(".interactive-drill__swipe");
    const base = { pointerId: 12, isPrimary: true, pointerType: "touch", button: 0 };
    await swipe.dispatchEvent("pointerdown", { ...base, clientX: 100, clientY: 100 });
    await button(page, "Yes").click();
    await button(page, "Next →").click();
    await swipe.dispatchEvent("pointerup", { ...base, clientX: 20, clientY: 100 });
    await page.locator(".interactive-drill__activity").dispatchEvent("keydown", { key: "ArrowLeft", repeat: true });
    expect(await page.getByText(/Correct: 1\/1/).count()).toBe(1);
    expect((await feedback(page).innerText()).trim()).toBe("");
    await page.keyboard.press("ArrowLeft");
    await expectFeedback(page, "Synthetic no explanation.");
    expect(await page.getByText(/Correct: 2\/2/).count()).toBe(1);
  }));

  it("ends and resets a round when changing modes, without stale timers", async () => withDrill(async page => {
    await page.clock.install();
    await button(page, "Start 30-second round").click();
    await button(page, "Yes").click();
    await chooseMode(page, "Speed-Match");
    await page.clock.fastForward(30_000);
    await expectHeading(page, "Synthetic matching");
    await chooseMode(page, "Rapid Swipe");
    await button(page, "Start 30-second round").click();
    expect(await page.getByText("Time: 30s · Correct: 0/0 · Streak: 0 · Best combo: 0").count()).toBe(1);
    await button(page, "End round").click();
    await expectHeading(page, "Round complete");
    expect(await page.getByText("Round complete. 0 correct out of 0 answered. Best combo: 0.").count()).toBe(1);
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
