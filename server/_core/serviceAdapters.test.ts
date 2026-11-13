import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("./env", () => ({
  ENV: { forgeApiKey: "test-only-key", forgeApiUrl: "https://services.test" },
}));
import { storageGet, storagePut } from "../storage";
import { notifyOwner } from "./notification";
import { transcribeAudio } from "./voiceTranscription";
import { makeRequest } from "./map";
import { createHeartbeatJob } from "./heartbeat";
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
it("does not turn a failed storage response into an apparently successful URL", async () => {
  fetchMock.mockResolvedValue(
    new Response('{"url":"https://private.test"}', { status: 403 })
  );
  await expect(storageGet("key")).rejects.toThrow("storage request http (403)");
});
it("does not retry an ambiguous upload and strips provider diagnostics", async () => {
  fetchMock.mockRejectedValue(new Error("PRIVATE storage key"));
  await expect(storagePut("key", "test data")).rejects.toThrow(
    "storage request network"
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("bounds owner notification latency and reports failure to its caller", async () => {
  vi.useFakeTimers();
  fetchMock.mockImplementation(() => new Promise(() => {}));
  const promise = notifyOwner({ title: "Test", content: "Synthetic" });
  await vi.advanceTimersByTimeAsync(8000);
  expect(await promise).toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("stops oversized audio before posting to the transcription service", async () => {
  fetchMock.mockResolvedValue(
    new Response("audio", {
      headers: { "content-length": String(16 * 1024 * 1024 + 1) },
    })
  );
  expect(
    await transcribeAudio({ audioUrl: "https://audio.test/sample" })
  ).toMatchObject({ code: "FILE_TOO_LARGE" });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("keeps successful audio transcription compatible and does not expose error bodies", async () => {
  fetchMock
    .mockResolvedValueOnce(
      new Response("audio", { headers: { "content-type": "audio/wav" } })
    )
    .mockResolvedValueOnce(new Response('{"text":"Synthetic transcript"}'));
  expect(
    await transcribeAudio({ audioUrl: "https://audio.test/sample" })
  ).toMatchObject({ text: "Synthetic transcript" });
  expect(fetchMock.mock.calls[1][1].method).toBe("POST");
  fetchMock
    .mockResolvedValueOnce(new Response("audio"))
    .mockResolvedValueOnce(
      new Response("PRIVATE provider detail", { status: 500 })
    );
  const failure = await transcribeAudio({
    audioUrl: "https://audio.test/sample",
  });
  expect(failure).toMatchObject({
    code: "TRANSCRIPTION_FAILED",
    details: "Upstream status 500",
  });
});
it("uses bounded safe retries for maps reads while keeping writes single-attempt", async () => {
  vi.useFakeTimers();
  fetchMock
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(new Response('{"status":"OK"}'));
  const promise = makeRequest("/maps/api/geocode/json", {
    address: "Synthetic location",
  });
  await vi.advanceTimersByTimeAsync(250);
  expect(await promise).toEqual({ status: "OK" });
  fetchMock.mockResolvedValue(new Response("PRIVATE", { status: 503 }));
  await expect(
    makeRequest("/maps/api/example", {}, { method: "POST", body: {} })
  ).rejects.toThrow("maps request http (503)");
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
it("does not duplicate a scheduler creation after a network failure", async () => {
  fetchMock.mockRejectedValue(new Error("PRIVATE"));
  await expect(
    createHeartbeatJob(
      { name: "Synthetic", cron: "0 0 3 * * *", path: "/api/scheduled/test" },
      "test-session"
    )
  ).rejects.toThrow("heartbeat request network");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
