import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DRILL_MODES, InteractiveDrill, type InteractiveDrillProps } from "./InteractiveDrill";

beforeAll(() => vi.stubGlobal("React", React));
afterAll(() => vi.unstubAllGlobals());
const examples = [{ id: "synthetic-swipe", mode: "rapid-swipe" as const, prompt: "Synthetic statement", correctAnswer: true, explanation: "Synthetic explanation" }];
const render = (props: Partial<InteractiveDrillProps> = {}) => renderToStaticMarkup(createElement(InteractiveDrill, { examples, ...props }));

describe("controlled drill session API", () => {
  it("keeps the default introductory navigation and 30-second timer", () => {
    const html = render();
    expect(html).toContain("Start 30-second round");
    expect(html).toContain("Rapid Swipe");
    expect(html).not.toContain("Speed-Match");
    expect(html).toContain("Practice · not saved");
  });

  it("can advertise all six modes with a single-mode working set", () => {
    const html = render({ selectedMode: "rapid-swipe", availableModes: DRILL_MODES.map(mode => mode.id), onModeChange: () => {} });
    for (const mode of DRILL_MODES) expect(html).toContain(mode.label);
    expect((html.match(/aria-current="true"/g) ?? []).length).toBe(1);
    expect(html).toContain("Synthetic statement");
  });

  it("does not silently substitute swipe examples for a selected empty mode", () => {
    const html = render({ selectedMode: "before-after", availableModes: DRILL_MODES.map(mode => mode.id) });
    for (const mode of DRILL_MODES) expect(html).toContain(mode.label);
    expect(html).not.toContain("Synthetic statement");
    expect(html).toContain("No practice activities are available yet.");
  });

  it("allows the parent to own mode navigation without changing the activity", () => {
    const html = render({ selectedMode: "rapid-swipe", hideModeNavigation: true });
    expect(html).not.toContain("Choose a practice mode");
    expect(html).toContain("interactive-drill__layout--activity-only");
    expect(html).toContain("Synthetic statement");
  });

  it.each([60, 90] as const)("offers a %s-second swipe round when configured", timerSeconds => {
    expect(render({ timerSeconds })).toContain(`Start ${timerSeconds}-second round`);
    expect(render({ timerSeconds })).not.toContain("Start 30-second round");
  });

  it("keeps ordinary swipe answers available when the timer is off", () => {
    const html = render({ timerSeconds: null });
    expect(html).not.toContain("-second round");
    expect(html).toContain(">No</button>");
    expect(html).toContain(">Yes</button>");
  });
});
