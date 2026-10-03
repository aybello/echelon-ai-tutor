import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: { dashboardAuth: { me: { useQuery: () => ({ data: null }) } } },
}));
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));
vi.mock("wouter", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; href: string }) => createElement("a", props, children),
}));

import SiteNav, { NAV_LINKS } from "../components/SiteNav";

// The existing Vitest configuration uses the classic JSX transform.
beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => vi.unstubAllGlobals());

function desktopLinks(currentPath: string, variant: "marketing" | "learning"): string {
  const html = renderToStaticMarkup(createElement(SiteNav, { currentPath, variant }));
  return html.split('<div class="echelon-desktop-links">')[1].split('<div class="echelon-nav-actions">')[0];
}

for (const { label, href } of [{ label: "Jobs", href: "/jobs" }, { label: "Blog", href: "/blog" }]) {
  describe(`${label} navigation`, () => {
    it(`includes one direct ${label} destination in the mobile navigation list`, () => {
      expect(NAV_LINKS.filter(link => link.href === href)).toEqual([{ label, href }]);
    });

    it(`shows ${label} directly in the public top menu without opening Resources`, () => {
      expect(desktopLinks("/", "marketing")).toContain(`<a href="${href}" class="echelon-nav-link">${label}</a>`);
    });

    it(`retains ${label} alongside My courses in the focused learning top menu`, () => {
      const links = desktopLinks("/class1-water", "learning");
      expect(links).toContain("My courses");
      expect(links).toContain(`<a href="${href}" class="echelon-nav-link">${label}</a>`);
    });

    it(`marks ${label} as current only on its own route family`, () => {
      for (const route of [href, `${href}/sample`, `${href}?page=2`]) {
        expect(desktopLinks(route, "marketing")).toContain(`<a href="${href}" class="echelon-nav-link is-active" aria-current="page">${label}</a>`);
      }
      for (const route of ["/", `${href}-unrelated`]) {
        expect(desktopLinks(route, "marketing")).not.toContain(`href="${href}" class="echelon-nav-link is-active"`);
      }
    });
  });
}
