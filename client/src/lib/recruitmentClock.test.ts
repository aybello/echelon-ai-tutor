import { describe, expect, it } from "vitest";
import { RecruitmentClock } from "./recruitmentClock";

describe("RecruitmentClock", () => {
  it("charges the full monotonic request duration then advances monotonically", () => {
    const clock = new RecruitmentClock();
    const sample = { serverNowMs: 100000 };
    clock.record(sample, 20000, 25000);
    clock.merge(sample, 25000);
    expect(clock.now(25000)).toBe(105000);
    expect(clock.now(28000)).toBe(108000);
  });

  it("reconsuming a measured DTO never charges its request delay twice", () => {
    const clock = new RecruitmentClock();
    const sample = { serverNowMs: 100000 };
    clock.record(sample, 0, 5000);
    clock.merge(sample, 5000);
    clock.merge(sample, 8000);
    clock.merge(sample, 8000);
    expect(clock.now(8000)).toBe(108000);
  });

  it("an old measured or cloned cache response cannot rewind the display clock", () => {
    const clock = new RecruitmentClock();
    const old = { serverNowMs: 100000 };
    clock.record(old, 0, 5000);
    clock.merge(old, 5000);
    const newer = { serverNowMs: 120000 };
    clock.record(newer, 6000, 7000);
    clock.merge(newer, 7000);
    clock.merge(old, 8000);
    clock.merge({ ...old }, 8000);
    expect(clock.now(8000)).toBe(122000);
  });

  it("a new request uses its own start, not the assessment's elapsed age", () => {
    const clock = new RecruitmentClock();
    const sample = { serverNowMs: 140000 };
    clock.record(sample, 40000, 46000);
    clock.merge(sample, 46000);
    expect(clock.now(46000)).toBe(146000);
  });

  it("clearing a session discards all prior response anchors", () => {
    const clock = new RecruitmentClock();
    const sample = { serverNowMs: 100000 };
    clock.record(sample, 0, 5000);
    clock.merge(sample, 5000);
    clock.clear();
    clock.merge(sample, 6000);
    expect(clock.now(6000)).toBe(0);
  });
});
