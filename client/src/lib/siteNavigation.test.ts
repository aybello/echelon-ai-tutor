import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: null as { role: string } | null,
  isAuthenticated: false,
  email: null as string | null,
  useAuth: vi.fn(),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: { dashboardAuth: { me: { useQuery: () => ({ data: { email: authState.email } }) } } },
}));
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: (options?: unknown) => {
    authState.useAuth(options);
    return { user: authState.user, isAuthenticated: authState.isAuthenticated };
  },
}));
vi.mock("wouter", () => ({
  useSearch: () => "",
  Link: ({ children, ...props }: { children: React.ReactNode; href: string }) =>
    createElement("a", props, children),
}));

import SiteNav, { COURSE_LINKS, NAV_LINKS, RESOURCE_LINKS } from "../components/SiteNav";

const PRIMARY_LABELS = [
  "Courses",
  "Teams",
  "Partnerships",
  "Jobs",
  "Blog",
  "US",
  "Resources",
];

// The existing Vitest configuration uses the classic JSX transform.
beforeEach(() => {
  vi.stubGlobal("React", React);
  authState.user = null;
  authState.isAuthenticated = false;
  authState.email = null;
  authState.useAuth.mockClear();
});
afterEach(() => vi.unstubAllGlobals());

function renderNavigation(
  currentPath: string,
  variant: "marketing" | "learning" = "marketing"
): string {
  return renderToStaticMarkup(createElement(SiteNav, { currentPath, variant }));
}

function desktopLinks(
  currentPath: string,
  variant: "marketing" | "learning"
): string {
  const html = renderNavigation(currentPath, variant);
  return html
    .split('<div class="echelon-desktop-links">')[1]
    .split('<div class="echelon-nav-actions">')[0];
}

function expectLabelsInOrder(html: string, labels: string[]) {
  let previousIndex = -1;
  for (const label of labels) {
    const index = html.indexOf(`>${label}`, previousIndex + 1);
    expect(
      index,
      `Expected ${label} after the previous primary item`
    ).toBeGreaterThan(previousIndex);
    previousIndex = index;
  }
}

describe("primary navigation hierarchy", () => {
  it("uses the approved mobile priority order without duplicating regional course links", () => {
    expect(NAV_LINKS).toEqual([
      { label: "Courses", href: "/#courses" },
      { label: "Teams", href: "/teams" },
      { label: "Partnerships", href: "/partnerships" },
      { label: "Jobs", href: "/jobs" },
      { label: "Blog", href: "/blog" },
      { label: "US", href: "/us" },
    ]);
  });

  it("keeps all grouped course destinations available to mobile navigation", () => {
    expect(COURSE_LINKS).toEqual([
      { label: "Ontario courses", href: "/#courses", description: "Operator certification preparation" },
      { label: "Western Canada", href: "/wpi", description: "WPI and provincial preparation" },
      { label: "309A Electrician", href: "/electrician-309a", description: "Ontario Certificate of Qualification preparation" },
    ]);
  });

  it("does not duplicate Partnerships inside Resources", () => {
    expect(RESOURCE_LINKS.some((link) => link.href === "/partnerships")).toBe(false);
  });

  it("keeps the approved public primary order before the account actions", () => {
    expectLabelsInOrder(desktopLinks("/", "marketing"), PRIMARY_LABELS);
  });

  it("keeps the same public destinations available alongside My courses in learning mode", () => {
    const links = desktopLinks("/class1-water", "learning");
    expect(links).toContain("My courses");
    expectLabelsInOrder(links, ["My courses", ...PRIMARY_LABELS.slice(1)]);
  });

  it("keeps Partnerships as a direct primary route and never hides it inside Resources", () => {
    const links = desktopLinks("/", "marketing");
    expect(links).toContain(
      '<a href="/partnerships" class="echelon-nav-link">Partnerships</a>'
    );
    expect(links).not.toContain(
      'href="/partnerships" class="echelon-resource-link"'
    );
  });
});

describe("Pricing funnel protection", () => {
  it("shows individual Pricing as a right-side conversion action for learner routes", () => {
    const html = renderNavigation("/");
    expect(html).toContain(
      '<a href="/pricing" class="echelon-pricing-link">Pricing</a>'
    );
  });

  it("marks learner Pricing as current only on its own route", () => {
    expect(renderNavigation("/pricing")).toContain(
      '<a href="/pricing" class="echelon-pricing-link is-active" aria-current="page">Pricing</a>'
    );
    expect(renderNavigation("/pricing-other")).not.toContain(
      'href="/pricing" class="echelon-pricing-link is-active"'
    );
  });

  it("does not advertise or link individual Pricing on employer routes", () => {
    for (const route of ["/teams", "/teams/renewal", "/teams?tab=annual", "/team", "/team/training-hours", "/team?tab=reporting"]) {
      expect(renderNavigation(route)).not.toContain('href="/pricing"');
    }
    expect(renderNavigation("/teams-unrelated")).toContain('href="/pricing"');
  });
});

describe("admin navigation visibility", () => {
  it("shows a direct, labelled admin shortcut for a verified admin", () => {
    authState.user = { role: "admin" };
    authState.isAuthenticated = true;
    const html = renderNavigation("/");
    expect(html).toContain('href="/admin" class="echelon-dashboard-link echelon-admin-link" aria-label="Admin dashboard"');
    expect(html).toContain("<span>Admin</span>");
    expect(renderNavigation("/admin")).toContain('aria-label="Admin dashboard" aria-current="page"');
  });
  it("does not grant the shortcut to learners, anonymous users or email-only sessions", () => {
    for (const user of [null, { role: "user" }]) {
      authState.user = user;
      authState.email = "learner@example.com";
      expect(renderNavigation("/")).not.toContain('href="/admin"');
      expect(renderNavigation("/")).toContain("<span>Dashboard</span>");
    }
  });
  it("resolves the role on a fresh page instead of relying on a prior learner-page cache", () => {
    renderNavigation("/");
    expect(authState.useAuth).toHaveBeenCalledWith(undefined);
  });
  it("keeps an admin on the employer funnel without linking individual pricing", () => {
    authState.user = { role: "admin" };
    authState.isAuthenticated = true;
    const html = renderNavigation("/teams");
    expect(html).toContain('href="/admin"');
    expect(html).not.toContain('href="/pricing"');
  });
});

describe("primary navigation active state", () => {
  for (const { label, href } of [
    { label: "Teams", href: "/teams" },
    { label: "Partnerships", href: "/partnerships" },
    { label: "Jobs", href: "/jobs" },
    { label: "Blog", href: "/blog" },
    { label: "US", href: "/us" },
  ]) {
    it(`marks ${label} as current only on its own route family`, () => {
      for (const route of [href, `${href}/sample`, `${href}?page=2`]) {
        expect(desktopLinks(route, "marketing")).toContain(
          `<a href="${href}" class="echelon-nav-link is-active" aria-current="page">${label}</a>`
        );
      }
      for (const route of ["/", `${href}-unrelated`]) {
        expect(desktopLinks(route, "marketing")).not.toContain(
          `href="${href}" class="echelon-nav-link is-active"`
        );
      }
    });
  }
});
