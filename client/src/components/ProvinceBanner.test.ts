import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import ProvinceBanner from "./ProvinceBanner";
import { PROVINCE_LIST } from "@/hooks/useProvince";

beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => vi.unstubAllGlobals());

describe("province prompt visual cleanup", () => {
  it("keeps every existing province as a labelled selection button", () => {
    const html = renderToStaticMarkup(createElement(ProvinceBanner, { onSelect: vi.fn(), onDismiss: vi.fn() }));
    expect(html).toContain('role="group" aria-label="Choose your province"');
    for (const province of PROVINCE_LIST) {
      expect(html).toContain(`aria-label="${province.name}"`);
      expect(html).toContain(`>${province.abbr}</span>`);
    }
    expect(html).toContain('aria-label="Dismiss province selection"');
  });
  it("uses the clean blue presentation without the old dark panel or flag decorations", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/ProvinceBanner.tsx"), "utf8");
    const css = readFileSync(resolve(process.cwd(), "client/src/components/ProvinceBanner.css"), "utf8");
    expect(source).not.toContain("rgba(15,23,42");
    expect(source).not.toContain("{p.flag}");
    expect(source).toContain("onSelect(p.id)");
    expect(source).toContain("onClick={onDismiss}");
    expect(css).toContain("background: #eaf2fc");
    expect(css).toContain("color: #000");
    expect(css).toContain("min-height: 44px");
    expect(css).toContain("overflow-x: auto");
  });
});
