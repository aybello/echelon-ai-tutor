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
  it("persists validated homepage selections and routes Nova Scotia through the scoped WPI finder", () => {
    expect(PROVINCE_LIST.find(item => item.id === "ns")?.track).toBe("wpi");
    const landing = readFileSync(new URL("../pages/Landing.tsx", import.meta.url), "utf8");
    expect(landing).toContain("const handleProvinceSelect = (value: string)");
    expect(landing).toContain('if (value !== "on" && value !== "bc" && value !== "ab" && value !== "sk" && value !== "mb" && value !== "ns") return;');
    expect(landing).toContain("setProvince(value)");
    expect(landing).toContain("if (isAuthenticated) updateProvinceMutation.mutate({ province: value })");
    expect(landing).toContain('new URLSearchParams(search).get("province")?.toLowerCase()');
    expect(landing).toContain('routeProvince === "ns" ? routeProvince : storedProvince');
    expect(landing).toContain("<HomepageCourseDiscovery initialProvince={province} onProvinceSelected={handleProvinceSelect}");
    expect(landing).toContain('id="find-course"');
    const discovery = readFileSync(new URL("../components/HomepageCourseDiscovery.tsx", import.meta.url), "utf8");
    expect(discovery).toContain("<CourseFinder initialProvince={initialProvince} onProvinceSelected={onProvinceSelected}");
    const wpi = readFileSync(new URL("../pages/WpiLanding.tsx", import.meta.url), "utf8");
    expect(wpi).toContain("setProvince(id)");
    expect(wpi).toContain('if (id === "ns") navigate("/?province=NS#find-course")');
  });
});
