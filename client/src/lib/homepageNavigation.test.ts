import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: null as { role: string } | null,
  isAuthenticated: false,
  email: null as string | null,
  search: "",
  openMenus: false,
}));

// Server-render open menus to inspect their contents without a browser or services.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: <S,>(initial: S | (() => S)) => actual.useState(state.openMenus ? true as S : initial),
  };
});
vi.mock("@/lib/trpc", () => ({
  trpc: { dashboardAuth: { me: { useQuery: () => ({ data: { email: state.email } }) } } },
}));
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
}));
vi.mock("wouter", () => ({
  useSearch: () => state.search,
  Link: ({ children, ...props }: { children: React.ReactNode; href: string }) => createElement("a", props, children),
}));

import SiteNav, { COURSE_LINKS, NAV_LINKS, RESOURCE_LINKS } from "../components/SiteNav";

beforeEach(() => {
  vi.stubGlobal("React", React);
  state.user = null;
  state.isAuthenticated = false;
  state.email = null;
  state.search = "";
  state.openMenus = false;
});
afterEach(() => vi.unstubAllGlobals());

type NavProps = React.ComponentProps<typeof SiteNav>;
function render(currentPath = "/", props: Partial<NavProps> = {}) {
  return renderToStaticMarkup(createElement(SiteNav, { currentPath, ...props }));
}
function desktop(html: string) {
  return html.split('<div class="echelon-desktop-links">')[1].split('<div class="echelon-nav-actions">')[0];
}
function mobile(html: string) {
  return html.split('<div class="echelon-mobile-menu"')[1];
}
function labelsInOrder(html: string, labels: string[]) {
  let index = -1;
  for (const label of labels) {
    const next = html.indexOf(`>${label}`, index + 1);
    expect(next, `${label} should follow the previous navigation item`).toBeGreaterThan(index);
    index = next;
  }
}

const homeLabels = ["Courses", "Continuing education", "Teams", "US", "Resources"];
const otherLabels = ["Courses", "Teams", "Partnerships", "Jobs", "Blog", "US", "Resources"];

describe("homepage-only reduced navigation", () => {
  it.each(["/", "/?source=homepage"])("uses the approved desktop hierarchy on %s", (path) => {
    const links = desktop(render(path));
    labelsInOrder(links, homeLabels);
    expect(links).toContain('href="/continuing-education" class="echelon-nav-link">Continuing education</a>');
    for (const href of ["/partnerships", "/jobs", "/blog"]) expect(links).not.toContain(`href="${href}"`);
  });

  it("keeps the full existing header on other public and employer pages", () => {
    for (const path of ["/about", "/teams", "/jobs", "/partnerships", "/blog", "/us", "/continuing-education"]) {
      labelsInOrder(desktop(render(path)), otherLabels);
    }
    expect(render("/teams")).not.toContain('href="/pricing"');
  });

  it("does not reduce an explicitly requested learning header even at the root", () => {
    const links = desktop(render("/", { variant: "learning" }));
    labelsInOrder(links, ["My courses", ...otherLabels.slice(1)]);
    expect(links).not.toContain('href="/continuing-education"');
  });

  it("retains Courses and Resources destinations and groups Blog only on the homepage", () => {
    state.openMenus = true;
    const home = desktop(render());
    for (const item of [...COURSE_LINKS, ...RESOURCE_LINKS]) expect(home).toContain(`href="${item.href}"`);
    const homeResources = home.split('aria-label="Resource options">')[1];
    expect(homeResources).toContain('href="/blog" class="echelon-resource-link"');
    const otherResources = desktop(render("/about")).split('aria-label="Resource options">')[1];
    expect(otherResources).not.toContain('href="/blog"');
  });

  it("keeps exported global links unchanged for existing pages and consumers", () => {
    expect(NAV_LINKS.map(({ label, href }) => [label, href])).toEqual([
      ["Courses", "/#courses"], ["Teams", "/teams"], ["Partnerships", "/partnerships"],
      ["Jobs", "/jobs"], ["Blog", "/blog"], ["US", "/us"],
    ]);
    expect(RESOURCE_LINKS.map(({ href }) => href)).toEqual([
      "/continuing-education", "/guides", "/equipment-lab", "/formulas", "/career", "/command", "/about",
    ]);
    expect(COURSE_LINKS.map(({ href }) => href)).toEqual(["/#courses", "/wpi", "/electrician-309a"]);
  });

  it("keeps mobile Continuing education prominent and Blog in Resources", () => {
    state.openMenus = true;
    const menu = mobile(render());
    const primary = menu.split('<div class="echelon-mobile-links">')[1].split('<div class="echelon-mobile-resources">')[0];
    labelsInOrder(primary, homeLabels.slice(0, -1));
    expect(primary).toContain('href="/continuing-education"');
    for (const href of ["/partnerships", "/jobs", "/blog"]) expect(primary).not.toContain(`href="${href}"`);
    const resources = menu.split("<span>Resources</span>")[1].split('<div class="echelon-mobile-actions">')[0];
    for (const item of RESOURCE_LINKS) expect(resources).toContain(`href="${item.href}"`);
    expect(resources).toContain('href="/blog"');
    for (const item of COURSE_LINKS) expect(menu).toContain(`href="${item.href}"`);
  });

  it("preserves the full mobile primary navigation away from home", () => {
    state.openMenus = true;
    const primary = mobile(render("/about")).split('<div class="echelon-mobile-links">')[1].split('<div class="echelon-mobile-resources">')[0];
    labelsInOrder(primary, otherLabels.slice(0, -1));
    expect(primary).not.toContain('href="/continuing-education"');
  });
});

describe("homepage account presentation without identity changes", () => {
  it("offers signed-out users Sign in and real Pricing without a redundant Dashboard", () => {
    state.openMenus = true;
    const html = render();
    expect(html).toContain('href="/account?next=%2F"');
    expect(html).toContain('aria-label="Sign in"');
    expect(html).toContain('href="/pricing" class="echelon-pricing-link"');
    expect(html).not.toContain('href="/dashboard"');
    expect(html).not.toContain('href="/admin"');
  });

  it.each(["auth", "dashboardEmail", "override"])("preserves signed-in Dashboard and My account via %s", (identity) => {
    state.openMenus = true;
    state.isAuthenticated = identity === "auth";
    state.email = identity === "dashboardEmail" ? "learner@example.test" : null;
    const html = render("/", identity === "override" ? { authenticatedOverride: true } : {});
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/account" class="echelon-account-link" aria-label="My account"');
    expect(mobile(html)).toContain("My account</a>");
    expect(html).not.toContain('aria-label="Sign in"');
    expect(html).not.toContain('href="/admin"');
  });

  it("retains the verified admin shortcut", () => {
    state.user = { role: "admin" };
    state.isAuthenticated = true;
    expect(render()).toContain('href="/admin" class="echelon-dashboard-link echelon-admin-link" aria-label="Admin dashboard"');
  });

  it("preserves signed-out dashboard actions and return destinations on other pages", () => {
    state.openMenus = true;
    state.search = "tab=overview";
    const html = render("/about");
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/account?next=%2Fabout%3Ftab%3Doverview"');
  });

  it("leaves the caller's Get started action intact", () => {
    expect(render("/", { rightSlot: createElement("a", { href: "#find-course" }, "Get started") })).toContain('<a href="#find-course">Get started</a>');
  });
});
