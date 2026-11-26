import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { customers } from "../lib/trustedOrganizations";
const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");
describe("customer proof on public pages", () => {
  it.each(["client/src/pages/Landing.tsx", "client/src/pages/Teams.tsx"])(
    "uses the approved customer strip without implying endorsement in %s", file => {
      const source = read(file);
      expect(source.match(/<TrustedOrganizations \/>/g)).toHaveLength(1);
      expect(source).not.toMatch(/endorsed by (?:Utilities Kingston|the City of Winnipeg)/i);
      expect(source).not.toContain("Black Entrepreneurship Alliance");
    }
  );
  it("uses the three remaining approved marks with a bounded relationship label", () => {
    const strip = read("client/src/components/TrustedOrganizations.tsx");
    expect(strip).toContain("Used by operators and teams at");
    expect(customers.map(item => item.name)).toEqual(["Utilities Kingston", "City of Winnipeg", "City of Quinte West"]);
    expect(strip).not.toMatch(/paying customers|endorsed by/i);
  });
  it("places proof once after the interactive hero and course discovery before tools", () => {
    const source = read("client/src/pages/Landing.tsx");
    expect(source).toMatch(/<HomepageProductDemo \/>[\s\S]*?<\/section>\s*<TrustedOrganizations \/>\s*<section id="courses"/);
    expect(source.indexOf('id="courses"')).toBeLessThan(source.indexOf('id="tools"'));
    expect(source).not.toContain('className="homepage-customer-proof"');
  });
  it("preserves the accessible shared strip rather than a second Teams-specific list", () => {
    const strip = read("client/src/components/TrustedOrganizations.tsx");
    expect(strip).toContain("Pause logo animation");
    expect(strip).toContain("Resume logo animation");
    expect(strip).toContain('aria-pressed={paused}');
  });
});
