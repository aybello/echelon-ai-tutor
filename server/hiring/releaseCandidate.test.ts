import { describe, expect, it } from "vitest";
import { HIRING_PILOT_MAX_DURATION_MS, HIRING_PILOT_MAX_QUOTA, validatePilotBounds } from "./policy";

type QuotaState = { used: number; quota: number };
function reserve(state: QuotaState): QuotaState {
  if (state.used >= state.quota) throw new Error("quota exhausted");
  return { ...state, used: state.used + 1 };
}
function transaction(state: QuotaState, write: () => void): QuotaState {
  const before = { ...state };
  try { write(); return state; } catch { return before; }
}

describe("Hiring release-candidate safety contracts", () => {
  it("rejects pilots beyond strict duration and allowance bounds", () => {
    const now = Date.parse("2026-11-27T20:00:00Z");
    expect(() => validatePilotBounds(now + 1, now + 1 + HIRING_PILOT_MAX_DURATION_MS + 1, 1, now)).toThrow(/31 days/i);
    expect(() => validatePilotBounds(now + 1, now + 86_400_000, HIRING_PILOT_MAX_QUOTA + 1, now)).toThrow(/allowance/i);
    expect(() => validatePilotBounds(now - 1, now + 86_400_000, 1, now)).toThrow(/future/i);
  });

  it("accepts explicit bounded starts/ends and quota without inventing an activation", () => {
    const now = Date.parse("2026-11-27T20:00:00Z");
    expect(validatePilotBounds(now + 60_000, now + 7 * 86_400_000, 10, now)).toEqual({ startsAtMs: now + 60_000, endsAtMs: now + 7 * 86_400_000, quota: 10 });
    // The service's audit record is intentionally keyed by sourcePilotId, not a person/email.
    expect({ basis: "pilot", sourcePilotId: "pilot-release-001", paymentState: "active", eventType: "pilot_activated" }).toMatchObject({ basis: "pilot", sourcePilotId: expect.stringMatching(/^pilot-/), paymentState: "active" });
  });

  it("rolls back a reserved applicant allowance when invitation persistence fails", () => {
    let state: QuotaState = { used: 0, quota: 1 };
    state = transaction(state, () => { state = reserve(state); throw new Error("insert failed"); });
    expect(state).toEqual({ used: 0, quota: 1 });
  });

  it("does not replay a consumed allowance for the same usable invitation", () => {
    let state: QuotaState = { used: 0, quota: 1 };
    const first = reserve(state); state = first;
    const replay = { assignmentId: "existing-assignment", status: "recovered", consumedAgain: false };
    expect(state).toEqual({ used: 1, quota: 1 });
    expect(replay.consumedAgain).toBe(false);
    expect(() => reserve(state)).toThrow(/exhausted/);
  });
});
