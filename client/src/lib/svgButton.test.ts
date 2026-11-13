import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { svgButtonProps } from "./svgButton";
import { IntakeDiagram, LabelDot } from "../components/ProcessDiagrams";
import { ScreeningDiagram } from "../components/WastewaterDiagrams";
import { PumpingStationDiagram } from "../components/DistributionDiagrams";
import { SourcesDiagram } from "../components/CollectionDiagrams";
import ProcessMap from "../components/ProcessMap";
describe("Process Guide keyboard controls", () => {
  it.each(["Enter", " "])("activates on %s and prevents scrolling", key => {
    const action = vi.fn(); const preventDefault = vi.fn(); const props = svgButtonProps("Water Source", false, action);
    expect(props).toMatchObject({ role: "button", tabIndex: 0, "aria-label": "Water Source", "aria-pressed": false });
    props.onKeyDown({ key, preventDefault } as any); expect(action).toHaveBeenCalledOnce(); expect(preventDefault).toHaveBeenCalledOnce();
    props.onKeyDown({ key, repeat: true, preventDefault } as any); expect(action).toHaveBeenCalledOnce();
    props.onKeyDown({ key: "Escape", preventDefault } as any); expect(action).toHaveBeenCalledOnce();
  });
  it("same label toggles to deselected state by keyboard or pointer", () => {
    const action = vi.fn();
    const element = LabelDot({ x: 0, y: 0, id: "source", text: "Water Source", active: "source", color: "blue", onClick: action });
    const hit: any = React.Children.toArray(element.props.children).find((child: any) => child.props.role === "button");
    expect(hit.props["aria-pressed"]).toBe(true);
    hit.props.onKeyDown({ key: " ", preventDefault: vi.fn() }); expect(action).toHaveBeenLastCalledWith(null);
    hit.props.onClick(); expect(action).toHaveBeenLastCalledWith(null);
  });
  it.each([IntakeDiagram, ScreeningDiagram, PumpingStationDiagram, SourcesDiagram])("renders named focusable hit targets: %s", Component => {
    const html = renderToStaticMarkup(createElement(Component, { active: null, onClick: vi.fn(), color: "blue" }));
    expect(html).toContain('role="button"'); expect(html).toContain('tabindex="0"'); expect(html).toContain('aria-label='); expect(html).toContain('class="process-label-button"');
  });
  it("Process Map cards expose the same named keyboard contract", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(createElement(ProcessMap, { onStepClick: vi.fn() }));
    expect(html).toContain('role="button"'); expect(html).toContain('tabindex="0"'); expect(html).toContain(":focus-visible");
  });
});
