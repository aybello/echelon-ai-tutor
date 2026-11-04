import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("customer proof on public pages", () => {
  it.each(["client/src/pages/Landing.tsx", "client/src/pages/Teams.tsx"])(
    "names the two customer organizations without implying an endorsement in %s",
    file => {
      const source = read(file);
      expect(source).toContain("Used by operators at");
      expect(source).toContain("<strong>Utilities Kingston</strong>");
      expect(source).toContain("<strong>City of Winnipeg</strong>");
      expect(source).not.toMatch(/endorsed by (?:Utilities Kingston|the City of Winnipeg)/i);
    }
  );

  it("shows the named proof in the homepage hero before the primary actions", () => {
    const source = read("client/src/pages/Landing.tsx");
    expect(source.indexOf('className="homepage-customer-proof"')).toBeLessThan(
      source.indexOf('className="homepage-hero-actions"')
    );
  });

  it("keeps the Teams proof label dark against its white background", () => {
    const source = read("client/src/pages/Teams.tsx");
    const styles = read("client/src/styles/TeamsRedesign.css");
    expect(source).toContain("teams-customer-proof-label");
    expect(styles).toMatch(/p\.teams-customer-proof-label\s*\{\s*color:\s*#075e59\s*!important/i);
  });
});
