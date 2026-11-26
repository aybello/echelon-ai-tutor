import { afterEach, describe, expect, it, vi } from "vitest";
import { IDENTITY_CHANGE_EVENT_KEY, notifyIdentityChange, publishIdentityChange, watchIdentityChanges } from "./identityChange";

const nonce = "01010101010101010101010101010101";
afterEach(() => vi.unstubAllGlobals());

describe("identity change hints", () => {
  it("publishes only a fresh random nonce on both transports", () => {
    let count = 0;
    const setItem = vi.fn();
    const postMessage = vi.fn();
    const close = vi.fn();
    vi.stubGlobal("crypto", { getRandomValues: (bytes: Uint8Array) => bytes.fill(++count) });
    vi.stubGlobal("localStorage", { setItem });
    vi.stubGlobal("BroadcastChannel", class { postMessage = postMessage; close = close; });
    notifyIdentityChange();
    notifyIdentityChange();
    expect(setItem.mock.calls).toEqual([[IDENTITY_CHANGE_EVENT_KEY, nonce], [IDENTITY_CHANGE_EVENT_KEY, "02".repeat(16)]]);
    expect(postMessage.mock.calls).toEqual([[nonce], ["02".repeat(16)]]);
    expect(close).toHaveBeenCalledTimes(2);
  });

  it("continues with broadcast when storage is blocked; never throws when all facilities fail", () => {
    const postMessage = vi.fn();
    vi.stubGlobal("crypto", { getRandomValues: (bytes: Uint8Array) => bytes.fill(1) });
    Object.defineProperty(globalThis, "localStorage", { configurable: true, get: () => { throw Error("blocked"); } });
    vi.stubGlobal("BroadcastChannel", class { postMessage = postMessage; close() {} });
    expect(() => notifyIdentityChange()).not.toThrow();
    expect(postMessage).toHaveBeenCalledWith(nonce);
    vi.stubGlobal("crypto", { getRandomValues: () => { throw Error("unavailable"); } });
    expect(() => notifyIdentityChange()).not.toThrow();
    delete (globalThis as any).localStorage;
  });

  it("accepts storage or broadcast hints once and cleans up", () => {
    const listeners = new Map<string, EventListener>();
    const closed = vi.fn();
    let channel: any;
    vi.stubGlobal("window", {
      addEventListener: (type: string, listener: EventListener) => listeners.set(type, listener),
      removeEventListener: (type: string, listener: EventListener) => { if (listeners.get(type) === listener) listeners.delete(type); },
    });
    vi.stubGlobal("BroadcastChannel", class {
      onmessage: ((e: {data: unknown}) => void) | null = null;
      constructor() { channel = this; }
      close = closed;
    });
    const callback = vi.fn();
    const stop = watchIdentityChanges(callback);
    const event = (key: string | null, newValue: string | null) => listeners.get("storage")?.({ key, newValue } as unknown as Event);
    event("other", nonce);
    event(IDENTITY_CHANGE_EVENT_KEY, "not-a-nonce");
    channel.onmessage({ data: { email: "secret" } });
    expect(callback).not.toHaveBeenCalled();
    event(IDENTITY_CHANGE_EVENT_KEY, nonce);
    channel.onmessage({ data: nonce });
    expect(callback).toHaveBeenCalledTimes(1);
    channel.onmessage({ data: "02".repeat(16) });
    expect(callback).toHaveBeenCalledTimes(2);
    stop();
    expect(listeners.size).toBe(0);
    expect(closed).toHaveBeenCalledOnce();
  });

  it.each(["storage-first", "broadcast-first"])("deduplicates interleaved A/B/A/B from both transports (%s)", order => {
    let storageListener: EventListener;
    let channel: { onmessage: (event: { data: unknown }) => void };
    vi.stubGlobal("window", {
      addEventListener: (_type: string, listener: EventListener) => { storageListener = listener; },
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal("BroadcastChannel", class {
      onmessage = (_event: { data: unknown }) => {};
      constructor() { channel = this; }
      close() {}
    });
    const callback = vi.fn();
    const stop = watchIdentityChanges(callback);
    const storage = (value: string) => storageListener({ key: IDENTITY_CHANGE_EVENT_KEY, newValue: value } as unknown as Event);
    const broadcast = (value: string) => channel.onmessage({ data: value });
    const first = order === "storage-first" ? storage : broadcast;
    const second = order === "storage-first" ? broadcast : storage;
    const a = "01".repeat(16), b = "02".repeat(16), c = "03".repeat(16);
    first(a); first(b); second(a); second(b);
    expect(callback).toHaveBeenCalledTimes(2);
    second(c);
    expect(callback).toHaveBeenCalledTimes(3);
    stop();
  });

  it("evicts the oldest nonce after 128 distinct hints, without refreshing duplicates", () => {
    let storageListener: EventListener;
    let channel: { onmessage: (event: { data: unknown }) => void };
    vi.stubGlobal("window", {
      addEventListener: (_type: string, listener: EventListener) => { storageListener = listener; },
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal("BroadcastChannel", class {
      onmessage = (_event: { data: unknown }) => {};
      constructor() { channel = this; }
      close() {}
    });
    const callback = vi.fn();
    const stop = watchIdentityChanges(callback);
    const value = (n: number) => n.toString(16).padStart(32, "0");
    const storage = (n: number) => storageListener({ key: IDENTITY_CHANGE_EVENT_KEY, newValue: value(n) } as unknown as Event);
    const broadcast = (n: number) => channel.onmessage({ data: value(n) });
    for (let n = 0; n < 128; n++) storage(n);
    broadcast(0); // A duplicate does not refresh FIFO order.
    expect(callback).toHaveBeenCalledTimes(128);
    broadcast(128); // Evicts 0, but 1 remains in the window.
    storage(1);
    expect(callback).toHaveBeenCalledTimes(129);
    storage(0); // A delivery outside the bounded history is new again.
    expect(callback).toHaveBeenCalledTimes(130);
    stop();
  });

  it("ignores queued transport messages after cleanup and starts a fresh history on resubscribe", () => {
    const listeners = new Set<EventListener>();
    const channels: Array<{ onmessage: (event: { data: unknown }) => void; close: ReturnType<typeof vi.fn> }> = [];
    vi.stubGlobal("window", {
      addEventListener: (_type: string, listener: EventListener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: EventListener) => listeners.delete(listener),
    });
    vi.stubGlobal("BroadcastChannel", class {
      onmessage = (_event: { data: unknown }) => {};
      close = vi.fn();
      constructor() { channels.push(this); }
    });
    const callback = vi.fn();
    const stop = watchIdentityChanges(callback);
    const queuedStorage = [...listeners][0];
    const storageEvent = { key: IDENTITY_CHANGE_EVENT_KEY, newValue: nonce } as unknown as Event;
    queuedStorage(storageEvent);
    stop();
    stop();
    queuedStorage({ key: IDENTITY_CHANGE_EVENT_KEY, newValue: "02".repeat(16) } as unknown as Event);
    channels[0].onmessage({ data: "03".repeat(16) });
    expect(callback).toHaveBeenCalledOnce();
    expect(listeners.size).toBe(0);
    expect(channels[0].close).toHaveBeenCalledOnce();
    const stopAgain = watchIdentityChanges(callback);
    channels[1].onmessage({ data: nonce });
    expect(callback).toHaveBeenCalledTimes(2);
    stopAgain();
  });

  it("keeps storage delivery when BroadcastChannel is unavailable", () => {
    const addEventListener = vi.fn();
    vi.stubGlobal("window", { addEventListener, removeEventListener: vi.fn() });
    vi.stubGlobal("BroadcastChannel", class { constructor() { throw Error("blocked"); } });
    const cb = vi.fn();
    const stop = watchIdentityChanges(cb);
    addEventListener.mock.calls[0][1]({ key: IDENTITY_CHANGE_EVENT_KEY, newValue: nonce });
    expect(cb).toHaveBeenCalledOnce();
    expect(stop).not.toThrow();
  });

  it("serializes without closure dependencies for the OAuth callback", () => {
    const fn = (0, eval)(`(${publishIdentityChange.toString()})`) as typeof publishIdentityChange;
    const setItem = vi.fn();
    vi.stubGlobal("crypto", { getRandomValues: (bytes: Uint8Array) => bytes.fill(1) });
    vi.stubGlobal("localStorage", { setItem });
    vi.stubGlobal("BroadcastChannel", class { postMessage() {} close() {} });
    fn(IDENTITY_CHANGE_EVENT_KEY);
    expect(setItem).toHaveBeenCalledWith(IDENTITY_CHANGE_EVENT_KEY, nonce);
  });
});
