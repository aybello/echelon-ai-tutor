import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { serviceFetch, requireServiceSuccess } from "./outboundHttp";
const policy = {
  service: "storage" as const,
  timeoutMs: 1000,
  maxResponseBytes: 100,
  retryRead: true,
};
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("bounded outbound transport", () => {
  it("returns a fully read response with status and content type preserved", async () => {
    fetchMock.mockResolvedValue(
      new Response('{"ok":true}', {
        status: 201,
        headers: { "content-type": "application/json" },
      })
    );
    const response = await serviceFetch("https://storage.test", {}, policy);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("content-type")).toBe("application/json");
  });
  it("aborts a request even if the transport never returns headers", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const promise = serviceFetch("https://storage.test", {}, policy);
    const assertion = expect(promise).rejects.toMatchObject({
      kind: "timeout",
    });
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("keeps the deadline active while a response body stalls", async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    fetchMock.mockResolvedValue(
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(new Uint8Array([1]));
          },
          cancel,
        })
      )
    );
    const assertion = expect(
      serviceFetch("https://storage.test", {}, policy)
    ).rejects.toMatchObject({ kind: "timeout" });
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(cancel).toHaveBeenCalled();
  });
  it("rejects both declared and streamed oversized content and cancels reading", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("too big", { headers: { "content-length": "101" } })
    );
    await expect(
      serviceFetch("https://storage.test", {}, policy)
    ).rejects.toMatchObject({ kind: "too_large" });
    const cancel = vi.fn();
    fetchMock.mockResolvedValueOnce(
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(new Uint8Array(101));
          },
          cancel,
        })
      )
    );
    await expect(
      serviceFetch("https://storage.test", {}, policy)
    ).rejects.toMatchObject({ kind: "too_large" });
    expect(cancel).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("retries a safe read once inside the original deadline", async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response("recovered"));
    const promise = serviceFetch("https://storage.test", {}, policy);
    await vi.advanceTimersByTimeAsync(250);
    expect(await (await promise).text()).toBe("recovered");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("does not extend the deadline for a slow second attempt", async () => {
    vi.useFakeTimers();
    fetchMock.mockRejectedValueOnce(new Error("network"));
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const assertion = expect(
      serviceFetch("https://storage.test", {}, policy)
    ).rejects.toMatchObject({ kind: "timeout" });
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("never retries a write after an ambiguous network failure or HTTP 503", async () => {
    fetchMock.mockRejectedValueOnce(new Error("accepted but disconnected"));
    await expect(
      serviceFetch("https://storage.test", { method: "POST" }, policy)
    ).rejects.toMatchObject({ kind: "network" });
    fetchMock.mockResolvedValueOnce(
      new Response("private error", { status: 503 })
    );
    const response = await serviceFetch(
      "https://storage.test",
      { method: "POST" },
      policy
    );
    expect(() => requireServiceSuccess(response, "storage")).toThrow(
      "storage request http (503)"
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("does not retry denied requests or an excessive Retry-After", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    expect(
      (await serviceFetch("https://storage.test", {}, policy)).status
    ).toBe(401);
    fetchMock.mockResolvedValueOnce(
      new Response(null, { status: 429, headers: { "retry-after": "60" } })
    );
    await expect(
      serviceFetch("https://storage.test", {}, policy)
    ).rejects.toMatchObject({ kind: "http", status: 429 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("honors caller cancellation before and during a request without retry", async () => {
    const prior = AbortSignal.abort();
    await expect(
      serviceFetch("https://storage.test", { signal: prior }, policy)
    ).rejects.toMatchObject({ kind: "cancelled" });
    expect(fetchMock).not.toHaveBeenCalled();
    const controller = new AbortController();
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const assertion = expect(
      serviceFetch(
        "https://storage.test",
        { signal: controller.signal },
        policy
      )
    ).rejects.toMatchObject({ kind: "cancelled" });
    controller.abort();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("redacts transport errors and telemetry instead of printing request secrets", async () => {
    fetchMock.mockRejectedValue(
      new Error("https://secret.test?api_key=PRIVATE buyer@example.com")
    );
    await expect(
      serviceFetch(
        "https://secret.test?api_key=PRIVATE",
        { method: "POST", headers: { Authorization: "PRIVATE" } },
        policy
      )
    ).rejects.toThrow("storage request network");
    const logs = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logs).toContain('"service":"storage"');
    expect(logs).not.toMatch(/PRIVATE|buyer|secret.test/);
  });
});
