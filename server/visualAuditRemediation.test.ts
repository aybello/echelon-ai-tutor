import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("live visual-audit remediation", () => {
  it("keeps the free 309A course public and discoverable while the bank develops", () => {
    const app = source("client/src/App.tsx");
    const nav = source("client/src/components/SiteNav.tsx");
    const practice = source("client/src/pages/Electrician309APractice.tsx");
    const mock = source("client/src/pages/Electrician309AMockExam.tsx");
    const flashcards = source("client/src/pages/Electrician309AFlashcards.tsx");
    const server = source("server/_core/index.ts");

    expect(app).toContain('<Route path={"/electrician-309a"}');
    const pageSsr = source("server/pageSsr.ts");

    expect(nav).toContain('{ label: "309A Electrician"');
    expect(practice).not.toContain("noindex: true");
    expect(mock).not.toContain("noindex");
    expect(flashcards).not.toContain("noindex: true");
    expect(server).not.toContain('"X-Robots-Tag", "noindex, nofollow"');
    expect(pageSsr).toContain('path: "/electrician-309a"');
  });

  it("uses accurate public trust and free-preview copy", () => {
    const landing = source("client/src/pages/Landing.tsx");
    const about = source("client/src/pages/About.tsx");
    const us = source("client/src/pages/USLanding.tsx");

    expect(landing).toContain('certBody: "EOCP"');
    expect(landing).toContain("{passPriceLabel}");
    expect(about).toContain("15 practice questions, 50 flashcards, 30 mock-exam questions, and three AI Tutor messages");
    expect(about).not.toContain("FDEP exam in Florida");
    expect(about).not.toContain("Master's student");
    expect(us).toContain("value={132400}");
    expect(us).toContain("value={10700}");
    expect(us).not.toContain("const TESTIMONIALS");
  });

  it("explains graduated team pricing as blended pricing", () => {
    const pricing = source("client/src/pages/Pricing.tsx");
    const teams = source("client/src/pages/Teams.tsx");

    for (const page of [pricing, teams]) {
      expect(page).toContain("Graduated discounts apply only to seats inside each volume band");
      expect(page).toMatch(/Average [Pp]er [Oo]perator/);
    }
    expect(teams).toContain("Blended order discount:");
    expect(pricing).toContain("off those seats");
  });

  it("does not nest buttons inside links on audited public surfaces", () => {
    const auditedFiles = [
      "client/src/pages/Landing.tsx",
      "client/src/pages/Pricing.tsx",
      "client/src/pages/USLanding.tsx",
      "client/src/pages/About.tsx",
      "client/src/pages/Teams.tsx",
      "client/src/components/QuizShell.tsx",
      "client/src/components/FlashcardShell.tsx",
    ];

    for (const file of auditedFiles) {
      expect(source(file), file).not.toMatch(/<(?:Link|a)\b[^>]*>\s*<button\b/s);
    }
  });

  it("loads the homepage without an extra lazy-route round trip", () => {
    const app = source("client/src/App.tsx");
    expect(app).toContain('import Landing from "./pages/Landing";');
    expect(app).not.toContain('const Landing = lazy(() => import("./pages/Landing"))');
  });

  it("shows the Google review request only after course access is restored", () => {
    const account = source("client/src/pages/Account.tsx");
    expect(account).toContain("{hasPurchases && <div");
    expect(account).toContain("Rate Echelon on Google");
  });
});
