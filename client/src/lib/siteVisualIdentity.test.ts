import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("Echelon technical visual identity", () => {
  it("loads the approved full-site type system without retired serif faces", () => {
    const html = read("client/index.html");
    const system = read("client/src/styles/FullSiteRedesign.css");
    const study = read("client/src/styles/StudyDesign.css");
    const admin = read("client/src/pages/admin.css");

    expect(html).toContain("family=Manrope");
    expect(html).toContain("family=Source+Sans+3");
    expect(html).toContain("family=IBM+Plex+Mono");
    for (const source of [html, system, study, admin]) {
      expect(source).not.toMatch(/DM[ +]Serif|Fraunces|Georgia/);
    }
    expect(system).toContain('font-family: Manrope');
    expect(system).toContain('font-family: "Source Sans 3"');
    expect(system).toContain('font-family: "IBM Plex Mono"');
  });

  it("shares the technical canvas, surface, and accent tokens with administration", () => {
    const admin = read("client/src/pages/admin.css");
    const system = read("client/src/styles/FullSiteRedesign.css");
    for (const [role, token] of [
      ["canvas", "canvas"], ["surface", "surface"], ["ink", "ink"],
      ["border", "line"], ["sidebar", "navy"], ["mint", "teal"],
    ]) {
      expect(admin).toContain(`--admin-${role}: var(--echelon-${token})`);
    }
    expect(system).toContain("--echelon-navy: #000000");
    expect(system).toContain("--echelon-teal: #087f78");
    expect(admin).not.toMatch(/#f5f3ed|#fffefa|#f4e1d6/i);
  });

  it("uses the approved high-contrast black text hierarchy on light surfaces", () => {
    const system = read("client/src/styles/FullSiteRedesign.css");
    const homepage = read("client/src/pages/Landing.css");
    const publicCss = read("client/src/styles/PublicRedesign.css");
    const learning = read("client/src/styles/LearningRedesign.css");
    const learner = read("client/src/styles/LearnerRedesign.css");
    const teams = read("client/src/styles/TeamsRedesign.css");
    const operations = read("client/src/styles/OperationsRedesign.css");

    expect(system).toContain("--echelon-ink: #000000");
    expect(system).toContain("--echelon-muted: #000000");
    expect(homepage).toContain("--home-ink: #000000");
    expect(homepage).toContain("--home-muted: #000000");
    expect(publicCss).toContain("--public-muted: #000000");
    expect(publicCss).toContain(".public-redesign-blog :is(.text-slate-500, .text-slate-600, .text-slate-700)");
    expect(learning).toContain("--lr-muted: #000000");
    expect(learner).toContain("--learner-muted: #000000");
    expect(teams).toContain("--teams-muted: #000000");
    expect(operations).toContain("--ops-muted: #000000");
  });

  it("applies the shared type system to regional pages without removing regional content", () => {
    const sharedLayout = read("client/src/components/USPageLayout.tsx");
    const sharedCss = read("client/src/components/USPageLayout.css");
    const publicCss = read("client/src/styles/PublicRedesign.css");
    const globalCss = read("client/src/index.css");

    expect(sharedLayout).toContain('import "./USPageLayout.css"');
    expect(globalCss).toContain('@import "./styles/PublicRedesign.css"');
    expect(sharedCss).toMatch(/font-family:\s*(?:Manrope|"Source Sans 3")/);
    expect(publicCss).toContain('font-family: Manrope');
    expect(sharedLayout).toContain('href="/us/courses"');
    for (const name of ["USCourses", "USLanding", "USStatePage", "USStates"]) {
      const page = read(`client/src/pages/${name}.tsx`);
      if (name !== "USLanding") expect(page).toContain('from "@/components/USPageLayout"');
      expect(page).toContain("usePageMeta");
      expect(page).toContain("/us/");
    }
  });

  it("keeps the Partnerships proof point aligned with the verified learner-visible question count", () => {
    const partnerships = read("client/src/pages/Partnerships.tsx");
    expect(partnerships).toContain('stat: "24,100+"');
    expect(partnerships).not.toContain('stat: "18,000+"');
    expect(partnerships).toContain("authoritative learner-visible bank count on 2026-10-30");
  });

  it("uses a professional study-guidance mark instead of a robot mascot for the Tutor", () => {
    const tutorMark = read("client/src/components/TutorGuideMark.tsx");
    const tutorSurfaces = [
      "client/src/components/AITutor.tsx",
      "client/src/components/MockExamShell.tsx",
      "client/src/components/ReviewAITutor.tsx",
      "client/src/pages/USLanding.tsx",
      "client/src/pages/Pricing.tsx",
      "client/src/pages/StudentDashboard.tsx",
    ].map(read);

    expect(tutorMark).toContain("BookOpenCheck");
    expect(tutorMark).toContain("BrainCircuit");
    for (const source of tutorSurfaces) {
      expect(source).toContain("TutorGuideMark");
      expect(source).not.toContain("🤖");
    }
  });
});
