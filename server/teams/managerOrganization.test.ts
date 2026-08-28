import { describe, expect, it } from "vitest";
import { selectCurrentManagerOrganization } from "./managerOrganization";

const NOW = new Date("2026-08-28T20:00:00.000Z");

function candidate(
  id: number,
  status: string,
  createdAt: string,
  termEnd = "2027-08-28T20:00:00.000Z",
) {
  return {
    id,
    status,
    createdAt: new Date(createdAt),
    termEnd: new Date(termEnd),
  };
}

describe("selectCurrentManagerOrganization", () => {
  it("ignores an older pending checkout and selects the paid active organization", () => {
    const pending = candidate(41, "pending", "2026-08-28T18:00:00.000Z");
    const active = candidate(42, "active", "2026-08-28T19:00:00.000Z");

    expect(selectCurrentManagerOrganization([pending, active], NOW)).toEqual(active);
  });

  it("selects the newest eligible organization deterministically", () => {
    const older = candidate(50, "active", "2026-08-27T19:00:00.000Z");
    const newer = candidate(51, "past_due", "2026-08-28T19:00:00.000Z");

    expect(selectCurrentManagerOrganization([newer, older], NOW)).toEqual(newer);
    expect(selectCurrentManagerOrganization([older, newer], NOW)).toEqual(newer);
  });

  it("rejects cancelled, pending, and expired organizations", () => {
    const rows = [
      candidate(60, "pending", "2026-08-28T19:00:00.000Z"),
      candidate(61, "cancelled", "2026-08-28T19:01:00.000Z"),
      candidate(
        62,
        "active",
        "2026-08-28T19:02:00.000Z",
        "2026-08-28T19:59:59.000Z",
      ),
    ];

    expect(selectCurrentManagerOrganization(rows, NOW)).toBeNull();
  });
});
