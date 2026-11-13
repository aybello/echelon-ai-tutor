import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { PROVINCE_LIST } from "../hooks/useProvince";

describe("Nova Scotia saved province", () => {
  it("accepts every visible province at the authenticated preference endpoint", () => {
    const source = readFileSync(new URL("../../../server/routers.ts", import.meta.url), "utf8");
    const declaration = source.split("updateProvince: protectedProcedure")[1].match(/province: z.enum\((\[[^\]]+\])\)/)?.[1];
    expect(declaration).toBeDefined();
    const schema = z.enum(JSON.parse(declaration!) as [string, ...string[]]);
    for (const province of PROVINCE_LIST) expect(schema.safeParse(province.id).success).toBe(true);
    expect(schema.safeParse("unsupported").success).toBe(false);
  });
  it("selects the WPI family and scoped finder from either province banner", () => {
    expect(PROVINCE_LIST.find(item => item.id === "ns")?.track).toBe("wpi");
    const landing = readFileSync(new URL("../pages/Landing.tsx", import.meta.url), "utf8");
    expect(landing).toContain("const handleProvinceSelect = (id: ProvinceId)");
    expect(landing).toContain("setProvince(id)");
    expect(landing).toContain("<CourseFinder initialProvince={province}");
    expect(landing).toContain('id="find-course"');
    const wpi = readFileSync(new URL("../pages/WpiLanding.tsx", import.meta.url), "utf8");
    expect(wpi).toContain('if (id === "ns") navigate("/?province=NS#find-course")');
  });
});
