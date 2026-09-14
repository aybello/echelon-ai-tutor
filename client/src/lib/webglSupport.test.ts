import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("supportsWebGL2", () => {
  it("reuses a successful disposable probe across route mounts", async () => {
    const loseContext = vi.fn();
    const getExtension = vi.fn(() => ({ loseContext }));
    const getContext = vi.fn(() => ({ getExtension }));
    const createElement = vi.fn(() => ({ getContext }));
    vi.stubGlobal("document", { createElement });

    const { supportsWebGL2 } = await import("./webglSupport");
    expect(supportsWebGL2()).toBe(true);
    expect(supportsWebGL2()).toBe(true);

    expect(createElement).toHaveBeenCalledTimes(1);
    expect(getContext).toHaveBeenCalledWith("webgl2");
    expect(loseContext).toHaveBeenCalledTimes(1);
  });
});
