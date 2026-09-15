import { describe, expect, it, vi } from "vitest";
import { createStudyRecorder, type StudyWrite } from "./studyRecorder";
async function settle() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}
function fixture() {
  let now = 1000,
    total = 0,
    lastSequence = 0;
  const start = vi.fn(async () => ({}));
  const write = vi.fn(async (p: StudyWrite, complete: boolean) => {
    if (p.sequence <= lastSequence)
      return { recorded: false, reason: "duplicate" };
    total += p.activeSeconds;
    lastSequence = p.sequence;
    return complete ? { completed: true } : { recorded: true };
  });
  const status = vi.fn();
  const recorder = createStudyRecorder({
    start,
    write,
    status,
    key: () => "session",
    now: () => now,
    values: () => ({ unitsCompleted: 0 }),
  });
  const tick = (n: number, visible = true) => {
    for (let i = 0; i < n; i++) {
      now += 1000;
      recorder.tick(visible);
    }
  };
  return { recorder, start, write, status, tick, total: () => total };
}
describe("study recording delivery", () => {
  it("retries an initial failure with the same session and original interaction time", async () => {
    const f = fixture();
    f.start.mockRejectedValueOnce(new Error("offline"));
    f.recorder.interact();
    await settle();
    f.tick(30);
    await f.recorder.flush();
    expect(f.start.mock.calls[0]).toEqual(f.start.mock.calls[1]);
    expect(f.total()).toBe(30);
  });
  it("retries a lost acknowledgement without double counting or changing its sequence", async () => {
    const f = fixture();
    f.recorder.interact();
    await settle();
    f.tick(20);
    const original = f.write.getMockImplementation()!;
    f.write.mockImplementationOnce(async (...args) => {
      await original(...args);
      throw new Error("response lost");
    });
    await f.recorder.flush();
    f.tick(10);
    await f.recorder.flush();
    await f.recorder.stop();
    expect(f.write.mock.calls[0][0]).toEqual(f.write.mock.calls[1][0]);
    expect(f.total()).toBe(30);
  });
  it("drains retained batches and the final interval, all within the server bound", async () => {
    const f = fixture();
    f.recorder.interact();
    await settle();
    f.tick(40);
    f.recorder.interact();
    f.tick(40);
    await f.recorder.stop();
    expect(f.total()).toBe(80);
    expect(f.recorder.finished).toBe(true);
    expect(f.write.mock.calls.every(([p]) => p.activeSeconds <= 45)).toBe(true);
  });
  it("does not count hidden or idle time", async () => {
    const f = fixture();
    f.recorder.interact();
    await settle();
    f.tick(30, false);
    f.tick(60);
    await f.recorder.stop();
    expect(f.total()).toBe(30);
  });
  it("surfaces expiry rather than pretending all time was saved", async () => {
    const f = fixture();
    f.recorder.interact();
    await settle();
    f.tick(20);
    f.write.mockResolvedValueOnce({ recorded: false, reason: "expired" });
    await f.recorder.flush();
    expect(f.status.mock.calls.at(-1)?.[0]).toBe("interrupted");
  });
});
