import { afterEach, describe, expect, it, vi } from "vitest";
import { observeCeuShellLayout } from "./ceuShellLayout";

function fixture(siteHeight: number | null, initialContextHeight = 58) {
  let contextHeight = initialContextHeight;
  let headerHeight = siteHeight;
  let resizeCallback: (() => void) | undefined;
  const observe = vi.fn();
  const disconnect = vi.fn();
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();
  const setProperty = vi.fn();
  vi.stubGlobal("window", { addEventListener, removeEventListener });
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resizeCallback = callback; }
    observe = observe;
    disconnect = disconnect;
  });
  const header = { getBoundingClientRect: () => ({ height: headerHeight }) };
  const root = {
    querySelector: vi.fn(() => siteHeight === null ? null : header),
    style: { setProperty },
  } as unknown as HTMLElement;
  const context = {
    getBoundingClientRect: () => ({ height: contextHeight }),
  } as HTMLElement;
  return {
    root, context, header, observe, disconnect, addEventListener, removeEventListener, setProperty,
    resize: (nextContextHeight: number, nextHeaderHeight = headerHeight) => {
      contextHeight = nextContextHeight;
      headerHeight = nextHeaderHeight;
      resizeCallback?.();
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("CEU rendered shell geometry", () => {
  it("does not reserve a missing site header in focused learning views", () => {
    const f = fixture(null);
    const cleanup = observeCeuShellLayout(f.root, f.context);
    expect(f.setProperty).toHaveBeenCalledWith("--ceu-site-header-height", "0px");
    expect(f.setProperty).toHaveBeenCalledWith("--ceu-shell-offset", "58px");
    expect(f.observe).toHaveBeenCalledTimes(1);
    expect(f.observe).toHaveBeenCalledWith(f.context);
    cleanup();
  });

  it("uses the actual overview header height, not the retired 64px constant", () => {
    const f = fixture(80);
    observeCeuShellLayout(f.root, f.context);
    expect(f.setProperty).toHaveBeenCalledWith("--ceu-site-header-height", "80px");
    expect(f.setProperty).toHaveBeenCalledWith("--ceu-shell-offset", "138px");
    expect(f.observe).toHaveBeenCalledWith(f.header);
    f.resize(108, 67);
    expect(f.setProperty).toHaveBeenLastCalledWith("--ceu-shell-offset", "175px");
  });

  it("updates drawer clearance when mobile controls or saved-status text wrap", () => {
    const f = fixture(null, 108);
    observeCeuShellLayout(f.root, f.context);
    f.resize(144);
    expect(f.setProperty).toHaveBeenLastCalledWith("--ceu-shell-offset", "144px");
  });

  it("cleans up both listeners when switching between views", () => {
    const f = fixture(80);
    const cleanup = observeCeuShellLayout(f.root, f.context);
    const callback = f.addEventListener.mock.calls[0][1];
    cleanup();
    expect(f.disconnect).toHaveBeenCalledOnce();
    expect(f.removeEventListener).toHaveBeenCalledWith("resize", callback);
  });

  it("still measures on initial render and window resize without ResizeObserver", () => {
    const f = fixture(null);
    vi.stubGlobal("ResizeObserver", undefined);
    observeCeuShellLayout(f.root, f.context);
    expect(f.setProperty).toHaveBeenCalledWith("--ceu-shell-offset", "58px");
    expect(f.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    f.resize(108);
    f.addEventListener.mock.calls[0][1]();
    expect(f.setProperty).toHaveBeenLastCalledWith("--ceu-shell-offset", "108px");
    expect(f.observe).not.toHaveBeenCalled();
  });
});
