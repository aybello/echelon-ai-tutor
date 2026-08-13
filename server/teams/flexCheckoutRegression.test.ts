import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildProvisionalCoursePassOrganization,
  isProvisionalCoursePassOrganization,
} from "./flexCheckoutOrganization";

describe("Course Pass guest checkout organization", () => {
  it("creates an access-free provisional organization with a real lifecycle", () => {
    const organization = buildProvisionalCoursePassOrganization({
      organizationName: "  City of Winnipeg  ",
      managerEmail: "STattersall@Winnipeg.ca ",
      province: "western",
      now: new Date("2026-08-13T12:00:00.000Z"),
    });

    expect(organization).toMatchObject({
      name: "City of Winnipeg",
      managerEmail: "stattersall@winnipeg.ca",
      province: "western",
      tier: "course-pass",
      billingType: "course-pass",
      status: "pending",
      seatsTotal: 0,
    });
    expect(organization.termStart.toISOString()).toBe("2026-08-13T12:00:00.000Z");
    expect(organization.termEnd.toISOString()).toBe("2027-08-13T12:00:00.000Z");
    expect(isProvisionalCoursePassOrganization(organization)).toBe(true);
  });

  it("never writes the historical zero-ID placeholders", () => {
    const routerSource = readFileSync(
      new URL("../routers/teamFlexRouter.ts", import.meta.url),
      "utf8",
    );

    expect(routerSource).not.toContain("organizationId: orgId ?? 0");
    expect(routerSource).not.toContain("purchaserUserId: purchaserUserId ?? 0");
    expect(routerSource).toContain("organizationId: checkoutOrgId");
    expect(routerSource).toContain("purchaserUserId,");
  });

  it("requires an organization name and activates access only in fulfilment", () => {
    const clientSource = readFileSync(
      new URL("../../client/src/components/FlexOrderBuilder.tsx", import.meta.url),
      "utf8",
    );
    const fulfilmentSource = readFileSync(
      new URL("./fulfilFlexOrder.ts", import.meta.url),
      "utf8",
    );

    expect(clientSource).toContain("Organization name");
    expect(clientSource).toContain("organizationName: organizationName.trim()");
    expect(fulfilmentSource).toContain("isProvisionalCoursePassOrganization(organization)");
    expect(fulfilmentSource).toContain('status: "active"');
    expect(fulfilmentSource).toContain('"manager"');
  });
});
