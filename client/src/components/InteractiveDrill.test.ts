import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { InteractiveDrill, type SpeedMatchExample } from "./InteractiveDrill";

// Vitest uses the classic JSX transform; production Vite uses automatic JSX.
beforeAll(() => vi.stubGlobal("React", React));
afterAll(() => vi.unstubAllGlobals());

const pairs = ["A", "B", "C", "D"].map(id => ({ id, left: `Left ${id}`, right: `Right ${id}` }));
const render = (id: string, values = pairs) => renderToStaticMarkup(createElement(InteractiveDrill, {
  examples: [{ id, mode: "speed-match", prompt: "Synthetic matching board", pairs: values } satisfies SpeedMatchExample],
}));
const rightOrder = (html: string) => Array.from(html.matchAll(/>(Right [A-D])</g), match => match[1]);

describe("matching presentation", () => {
  it("varies order by board instead of applying one fixed rotation", () => {
    const orders = Array.from({ length: 12 }, (_, i) => rightOrder(render(`board-${i}`)));
    expect(new Set(orders.map(order => order.join("|"))).size).toBeGreaterThan(2);
    for (const order of orders) expect([...order].sort()).toEqual(["Right A", "Right B", "Right C", "Right D"]);
  });

  it("keeps a board stable through re-renders and does not mutate input", () => {
    const snapshot = JSON.stringify(pairs);
    expect(rightOrder(render("stable"))).toEqual(rightOrder(render("stable")));
    expect(JSON.stringify(pairs)).toBe(snapshot);
  });

  it.each(["left", "right"] as const)("rejects indistinguishable %s labels", side => {
    const ambiguous = pairs.map(pair => ({ ...pair }));
    ambiguous[1][side] = `  ${ambiguous[0][side].toUpperCase()} `;
    const html = render("ambiguous", ambiguous);
    expect(html).toContain("content is incomplete or ambiguous");
    expect(html).not.toContain('aria-label="Second items"');
  });

  it("rejects blank labels", () => {
    expect(render("blank", [{ id: "a", left: " ", right: "A" }, { id: "b", left: "B", right: "B" }])).toContain("content is incomplete or ambiguous");
  });
});
