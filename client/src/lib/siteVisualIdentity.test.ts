import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("original Echelon visual identity", () => {
  it("uses the original display font without loading the retired serif face", () => {
    const html = read("client/index.html");
    const study = read("client/src/styles/StudyDesign.css");
    const admin = read("client/src/pages/admin.css");
    expect(html).toContain("family=Sora");
    for (const source of [html, study, admin]) {
      expect(source).not.toMatch(/DM[ +]Serif|Fraunces|Georgia/);
    }
    expect(study).toContain("font-family: 'Sora', sans-serif");
    expect(admin).toContain("font-family: 'Sora', sans-serif");
  });

  it("shares the original canvas, card and accent tokens with administration", () => {
    const admin = read("client/src/pages/admin.css");
    for (const [role, token] of [
      ["canvas", "canvas"], ["surface", "surface"], ["ink", "ink"],
      ["border", "line"], ["sidebar", "navy"], ["mint", "teal"],
    ]) {
      expect(admin).toContain(`--admin-${role}: var(--echelon-${token})`);
    }
    expect(admin).not.toMatch(/#f5f3ed|#fffefa|#f4e1d6/i);
  });

  it("uses the same type in regional pages without removing regional content", () => {
    for (const name of ["USCourses", "USLanding", "USStatePage", "USStates"]) {
      const page = read(`client/src/pages/${name}.tsx`);
      expect(page).toContain(`fontFamily: "'Sora', sans-serif"`);
      expect(page).not.toContain('fontFamily: "system-ui, sans-serif"');
      expect(page).toContain("usePageMeta");
      expect(page).toContain("/pricing");
    }
  });
});
