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
      expect(source).toContain("Utilities Kingston and the City of Winnipeg");
      expect(source).not.toMatch(/endorsed by (?:Utilities Kingston|the City of Winnipeg)/i);
    }
  );
});
