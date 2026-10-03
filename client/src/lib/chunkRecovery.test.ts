import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { CHUNK_RETRY_COOLDOWN_MS, CHUNK_RETRY_KEY, createChunkRecovery, isChunkLoadError } from "./chunkRecovery";

function fixture() {
  const data = new Map<string, string>();
  const browser = {
    navigator: { onLine: true },
    sessionStorage: {
      getItem: vi.fn((key: string) => data.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => { data.set(key, value); }),
    },
    location: { reload: vi.fn() },
  };
  return { browser, data };
}
const missing = (name = "Class2WaterQuiz") => new TypeError(`Failed to fetch dynamically imported module: https://echeloninstitute.ca/assets/${name}-old123.js`);

describe("shared module recovery", () => {
  it("recognizes failed module downloads across every current lazy page without a course allowlist", () => {
    const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
    const pages = [...app.matchAll(/lazy\(\(\) => import\("\.\/pages\/([^"]+)"\)\)/g)].map(match => match[1]);
    expect(pages.length).toBeGreaterThan(100);
    for (const page of pages) {
      const { browser } = fixture();
      expect(createChunkRecovery(browser, () => 1_000_000)(missing(page)), page).toBe(true);
      expect(browser.location.reload, page).toHaveBeenCalledTimes(1);
    }
  });
  it.each([
    "Importing a module script failed.",
    "error loading dynamically imported module: https://example.test/assets/page-old.js",
    "Loading chunk 123 failed.",
    "Unable to preload CSS for /assets/page-old.css",
  ])("handles browser/preload message: %s", message => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true);
  });
  it.each([new Error("Cannot read properties of undefined"), new Error("Failed to fetch"), "Failed to fetch dynamically imported module", null])("does not reload for unrelated errors", error => {
    const { browser } = fixture();
    expect(createChunkRecovery(browser)(error)).toBe(false);
    expect(browser.location.reload).not.toHaveBeenCalled();
  });
  it("stores the attempt before reload and suppresses the same Vite/React failure", () => {
    const { browser, data } = fixture();
    browser.location.reload.mockImplementation(() => expect(data.get(CHUNK_RETRY_KEY)).toBe("1000000"));
    const recover = createChunkRecovery(browser, () => 1_000_000);
    expect(recover(missing())).toBe(true);
    expect(recover(missing())).toBe(false);
    expect(browser.location.reload).toHaveBeenCalledTimes(1);
  });
  it("does not loop after reload or navigation to a different course", () => {
    const { browser } = fixture();
    expect(createChunkRecovery(browser, () => 1_000_000)(missing())).toBe(true);
    expect(createChunkRecovery(browser, () => 1_000_100)(missing("WpiClass4WaterQuiz"))).toBe(false);
    expect(browser.location.reload).toHaveBeenCalledTimes(1);
  });
  it("permits a later retry after the full cooldown, with no timer-triggered reload", () => {
    const { browser } = fixture();
    expect(createChunkRecovery(browser, () => 1_000_000)(missing())).toBe(true);
    expect(createChunkRecovery(browser, () => 1_000_000 + CHUNK_RETRY_COOLDOWN_MS)(missing())).toBe(true);
    expect(browser.location.reload).toHaveBeenCalledTimes(2);
  });
  it("does not reload or store retry state offline", () => {
    const { browser } = fixture();
    browser.navigator.onLine = false;
    expect(createChunkRecovery(browser)(missing())).toBe(false);
    expect(browser.location.reload).not.toHaveBeenCalled();
    expect(browser.sessionStorage.setItem).not.toHaveBeenCalled();
  });
  it.each(["getItem", "setItem"] as const)("fails safely when storage %s is blocked", method => {
    const { browser } = fixture();
    browser.sessionStorage[method].mockImplementation(() => { throw new Error("Storage disabled"); });
    expect(createChunkRecovery(browser)(missing())).toBe(false);
    expect(browser.location.reload).not.toHaveBeenCalled();
  });
  it("treats malformed storage as an old attempt but protects against clock rollback", () => {
    const { browser, data } = fixture();
    data.set(CHUNK_RETRY_KEY, "bad-value");
    expect(createChunkRecovery(browser, () => 1_000_000)(missing())).toBe(true);
    expect(createChunkRecovery(browser, () => 900_000)(missing())).toBe(false);
  });
});
