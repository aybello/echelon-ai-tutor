import { describe, expect, it } from "vitest";
import { summariseByModule } from "./PracticeSessionRail";

describe("summariseByModule", () => {
  it("counts answers and correct answers per module, busiest first", () => {
    const rows = summariseByModule([
      { module: "Pumps", correct: true }, { module: "Pumps", correct: false },
      { module: "Valves", correct: true }, { module: "Pumps", correct: true },
    ]);
    expect(rows).toEqual([{ module: "Pumps", total: 3, correct: 2 }, { module: "Valves", total: 1, correct: 1 }]);
  });
  it("ignores answers with no module and handles an empty history", () => {
    expect(summariseByModule([{ correct: true }, { module: " ", correct: true }])).toEqual([]);
    expect(summariseByModule([])).toEqual([]);
  });
});
