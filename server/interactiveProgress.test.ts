import { describe, expect, it } from "vitest";
import { BOX_DAYS, acceptLocalDate, isValidLocalDate, learnerKeyFrom, nextProgress, streakDays } from "./interactiveProgress";

const now = new Date("2026-11-15T12:00:00Z");
const day = 24 * 60 * 60 * 1000;

describe("learnerKeyFrom", () => {
  it("prefers the account and falls back to a verified email, lowercased", () => {
    expect(learnerKeyFrom({ user: { id: 7 }, studentEmail: "A@B.CA" })).toBe("user:7");
    expect(learnerKeyFrom({ user: null, studentEmail: "  Learner@Example.CA " })).toBe("email:learner@example.ca");
  });
  it("returns null for anonymous play so nothing is stored", () => {
    expect(learnerKeyFrom({ user: null, studentEmail: null })).toBeNull();
    expect(learnerKeyFrom({})).toBeNull();
    expect(learnerKeyFrom({ user: null, studentEmail: "   " })).toBeNull();
  });
});

describe("nextProgress", () => {
  it("sends a first miss to box 0, due now", () => {
    const next = nextProgress(null, false, now);
    expect(next).toMatchObject({ attempts: 1, correctCount: 0, box: 0, lastCorrect: false });
    expect(next.dueAt.getTime()).toBe(now.getTime());
  });
  it("moves a correct answer up one box with a later review", () => {
    const first = nextProgress(null, true, now);
    expect(first.box).toBe(1);
    expect(first.dueAt.getTime()).toBe(now.getTime() + BOX_DAYS[1] * day);
    const second = nextProgress(first, true, now);
    expect(second.box).toBe(2);
    expect(second.dueAt.getTime()).toBe(now.getTime() + BOX_DAYS[2] * day);
    expect(second).toMatchObject({ attempts: 2, correctCount: 2 });
  });
  it("caps at the top box", () => {
    let state = nextProgress(null, true, now);
    for (let i = 0; i < 10; i++) state = nextProgress(state, true, now);
    expect(state.box).toBe(4);
    expect(state.dueAt.getTime()).toBe(now.getTime() + 14 * day);
  });
  it("sends any miss back to box 0, even from the top", () => {
    let state = nextProgress(null, true, now);
    for (let i = 0; i < 6; i++) state = nextProgress(state, true, now);
    const missed = nextProgress(state, false, now);
    expect(missed.box).toBe(0);
    expect(missed.lastCorrect).toBe(false);
    expect(missed.attempts).toBe(state.attempts + 1);
    expect(missed.correctCount).toBe(state.correctCount);
    expect(missed.dueAt.getTime()).toBe(now.getTime());
  });
});

describe("local dates", () => {
  it("validates real calendar dates only", () => {
    expect(isValidLocalDate("2026-11-15")).toBe(true);
    expect(isValidLocalDate("2026-02-30")).toBe(false);
    expect(isValidLocalDate("15-11-2026")).toBe(false);
    expect(isValidLocalDate("2026-11-15T00:00:00Z")).toBe(false);
  });
  it("accepts a claimed date within one day of UTC and rejects anything else", () => {
    expect(acceptLocalDate("2026-11-14", now)).toBe("2026-11-14");
    expect(acceptLocalDate("2026-11-16", now)).toBe("2026-11-16");
    expect(acceptLocalDate("2026-11-20", now)).toBe("2026-11-15");
    expect(acceptLocalDate("2020-01-01", now)).toBe("2026-11-15");
    expect(acceptLocalDate("nonsense", now)).toBe("2026-11-15");
    expect(acceptLocalDate(undefined, now)).toBe("2026-11-15");
  });
});

describe("streakDays", () => {
  it("counts consecutive days ending today", () => {
    expect(streakDays(["2026-11-15", "2026-11-14", "2026-11-13"], "2026-11-15")).toBe(3);
  });
  it("keeps the streak alive until the end of today if yesterday was active", () => {
    expect(streakDays(["2026-11-14", "2026-11-13"], "2026-11-15")).toBe(2);
  });
  it("breaks on a gap and resets to zero after a missed day", () => {
    expect(streakDays(["2026-11-15", "2026-11-13"], "2026-11-15")).toBe(1);
    expect(streakDays(["2026-11-12", "2026-11-11"], "2026-11-15")).toBe(0);
    expect(streakDays([], "2026-11-15")).toBe(0);
  });
  it("crosses month and year boundaries", () => {
    expect(streakDays(["2027-01-01", "2026-12-31", "2026-12-30"], "2027-01-01")).toBe(3);
  });
});
