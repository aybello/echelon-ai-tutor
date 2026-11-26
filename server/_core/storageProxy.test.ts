import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Express } from "express";
const mocks = vi.hoisted(() => ({
  env: { forgeApiUrl: "https://storage.example.test", forgeApiKey: "fixture" },
  fetch: vi.fn(), json: vi.fn(),
}));
vi.mock("./env", () => ({ ENV: mocks.env }));
vi.mock("./outboundHttp", () => ({ serviceFetch: mocks.fetch, serviceJson: mocks.json }));
import { registerStorageProxy } from "./storageProxy";
function harness(key: string) {
  let handler: any;
  registerStorageProxy({ get: vi.fn((path, callback) => { expect(path).toBe("/manus-storage/*"); handler = callback; }) } as unknown as Express);
  const response = { status: vi.fn().mockReturnThis(), send: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis(), redirect: vi.fn() };
  return { response, run: () => handler({ params: { 0: key } }, response) };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.env.forgeApiKey = "fixture";
});
describe("managed course media proxy", () => {
  it("redirects uploaded media through a fresh no-store signed URL", async () => {
    mocks.fetch.mockResolvedValue({ ok: true });
    mocks.json.mockResolvedValue({ url: "https://cdn.example.test/cover.jpg" });
    const { response, run } = harness("course-cover.jpg");
    await run();
    expect(mocks.fetch.mock.calls[0][0].searchParams.get("path")).toBe("course-cover.jpg");
    expect(response.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(response.redirect).toHaveBeenCalledWith(307, "https://cdn.example.test/cover.jpg");
  });
  it("fails closed when storage is not configured", async () => {
    mocks.env.forgeApiKey = "";
    const { response, run } = harness("course-cover.jpg");
    await run();
    expect(response.status).toHaveBeenCalledWith(500);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("does not redirect when signing fails", async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 503 });
    const { response, run } = harness("course-cover.jpg");
    await run();
    expect(response.status).toHaveBeenCalledWith(502);
    expect(response.redirect).not.toHaveBeenCalled();
  });
});
