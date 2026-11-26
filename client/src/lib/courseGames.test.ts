import { describe, expect, it } from "vitest";
import { catalogHasEnoughGames, GAMES_MIN_ITEMS } from "./courseGames";

const mode = (totalCount: number) => ({ mode: "swipe", totalCount, topics: [], difficulties: [] }) as any;

describe("catalogHasEnoughGames", () => {
  it("is false with no catalog or an unavailable course", () => {
    expect(catalogHasEnoughGames(null)).toBe(false);
    expect(catalogHasEnoughGames({ available: false, modes: [] })).toBe(false);
  });
  it("is false below the minimum and true at it", () => {
    expect(catalogHasEnoughGames({ available: true, modes: [mode(GAMES_MIN_ITEMS - 1)] })).toBe(false);
    expect(catalogHasEnoughGames({ available: true, modes: [mode(GAMES_MIN_ITEMS)] })).toBe(true);
  });
  it("adds up every mode", () => {
    expect(catalogHasEnoughGames({ available: true, modes: [mode(20), mode(20)] })).toBe(true);
  });
});
