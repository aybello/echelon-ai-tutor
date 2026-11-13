import { execFile } from "node:child_process";
import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({ execFile: vi.fn() }));
type PendingChild = {
  child: EventEmitter;
  options: { signal?: AbortSignal; timeout: number; killSignal: string; maxBuffer: number; env: Record<string, string> };
  callback: (error: Error | null, stdout: string) => void;
  input: ReturnType<typeof vi.fn>;
};
let children: PendingChild[];
let pdfToText: typeof import("./scripts/jobVerification.mjs").pdfToText;
const bytes = Buffer.from("%PDF-1.4 synthetic process-boundary input");
const unavailable = (promise: Promise<string>) => promise.then(() => "unexpected success", error => error.message);
const finish = (index: number, error: Error | null, stdout: string) => {
  const pending = children.at(index)!;
  pending.callback(error, stdout);
  pending.child.emit("close", error ? null : 0, error ? "SIGKILL" : null);
};

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  vi.resetModules();
  children = [];
  vi.mocked(execFile).mockReset();
  vi.mocked(execFile).mockImplementation(((command: string, args: string[], options: PendingChild["options"], callback: PendingChild["callback"]) => {
    const input = vi.fn();
    const child = Object.assign(new EventEmitter(), { stdin: { on: vi.fn(), end: input }, kill: vi.fn() });
    children.push({ options, callback, input, child });
    return child;
  }) as unknown as typeof execFile);
  ({ pdfToText } = await import("./scripts/jobVerification.mjs"));
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("PDF child isolation and resource admission", () => {
  it("uses the current Node binary, finite heap/output/time, no eval/addons, and only package/helper filesystem access", async () => {
    const promise = pdfToText(bytes);
    const [command, args] = vi.mocked(execFile).mock.calls[0] as unknown as [string, string[]];
    expect(command).toBe(process.execPath);
    expect(args).toEqual(expect.arrayContaining(["--max-old-space-size=96", "--max-semi-space-size=4", "--disallow-code-generation-from-strings", "--no-addons", "--permission"]));
    expect(args.filter(arg => arg.startsWith("--allow-fs-read="))).toHaveLength(2);
    expect(args.filter(arg => arg.startsWith("--allow-fs-read="))).not.toContain("--allow-fs-read=*");
    expect(args.at(-2)).toMatch(/\/server\/scripts\/jobPdfText\.mjs$/);
    expect(args.at(-1)).toMatch(/\/pdfjs-dist\/legacy\/build\/pdf\.mjs$/);
    expect(children[0].options).toMatchObject({ killSignal: "SIGKILL", maxBuffer: 2_000_000, env: { LANG: "C.UTF-8" } });
    expect(children[0].options.timeout).toBe(8000);
    expect(Object.keys(children[0].options.env)).toEqual(["LANG"]);
    expect(children[0].input).toHaveBeenCalledWith(bytes);
    finish(0, null, "Operations Manager");
    await expect(promise).resolves.toBe("Operations Manager");
  });
  it("runs only one child and rejects queue overflow without spawning", async () => {
    const promises = Array.from({ length: 9 }, () => pdfToText(bytes));
    expect(execFile).toHaveBeenCalledTimes(1);
    await expect(pdfToText(bytes)).rejects.toThrow("unavailable");
    for (let index = 0; index < promises.length; index++) {
      expect(children).toHaveLength(index + 1);
      finish(index, null, `text ${index}`);
      await expect(promises[index]).resolves.toBe(`text ${index}`);
    }
    expect(execFile).toHaveBeenCalledTimes(9);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("removes a cancelled queued extraction immediately without spawning or retaining its bytes", async () => {
    const first = pdfToText(bytes);
    const controller = new AbortController();
    const queued = unavailable(pdfToText(bytes, { signal: controller.signal }));
    controller.abort(new Error("Refresh budget exhausted"));
    expect(await queued).toBe("PDF text extraction unavailable");
    expect(execFile).toHaveBeenCalledTimes(1);
    finish(0, null, "first");
    await expect(first).resolves.toBe("first");
    expect(execFile).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("holds active cancellation and queued children until close after an early abort callback", async () => {
    const controller = new AbortController();
    let settled = false;
    const active = unavailable(pdfToText(bytes, { signal: controller.signal })).then(result => { settled = true; return result; });
    const second = pdfToText(bytes);
    const third = pdfToText(bytes);
    expect(children[0].options.signal).toBe(controller.signal);
    controller.abort(new Error("Refresh budget exhausted"));
    children[0].callback(Object.assign(new Error("aborted"), { code: "ABORT_ERR" }), "partial output");
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(execFile).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(250);
    expect(settled).toBe(false);
    expect(execFile).toHaveBeenCalledTimes(1);

    children[0].child.emit("close", null, "SIGKILL");
    expect(await active).toBe("PDF text extraction unavailable");
    expect(execFile).toHaveBeenCalledTimes(2);
    expect(children[1].options.timeout).toBe(7750);
    // A duplicate close cannot release the replacement child's admission slot.
    children[0].child.emit("close", null, "SIGKILL");
    expect(execFile).toHaveBeenCalledTimes(2);
    finish(1, null, "second");
    await expect(second).resolves.toBe("second");
    expect(execFile).toHaveBeenCalledTimes(3);
    finish(2, null, "third");
    await expect(third).resolves.toBe("third");
    expect(vi.getTimerCount()).toBe(0);
  });
  it("does not finish a shared cancellation drain before the active child closes", async () => {
    const controller = new AbortController();
    const active = unavailable(pdfToText(bytes, { signal: controller.signal }));
    const queued = unavailable(pdfToText(bytes, { signal: controller.signal }));
    let drained = false;
    const drain = Promise.all([active, queued]).then(results => { drained = true; return results; });
    controller.abort();
    children[0].callback(new Error("ABORT_ERR"), "partial output");
    expect(await queued).toBe("PDF text extraction unavailable");
    await vi.advanceTimersByTimeAsync(250);
    expect(drained).toBe(false);
    expect(execFile).toHaveBeenCalledTimes(1);
    children[0].child.emit("close", null, "SIGKILL");
    expect(await drain).toEqual(["PDF text extraction unavailable", "PDF text extraction unavailable"]);
    expect(execFile).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("drains past a synchronous queued spawn failure without releasing the next child's slot twice", async () => {
    const first = pdfToText(bytes);
    const failed = unavailable(pdfToText(bytes));
    const next = pdfToText(bytes);
    const last = pdfToText(bytes);
    vi.mocked(execFile).mockImplementationOnce(() => { throw new Error("spawn failed"); });
    finish(0, null, "first");
    await expect(first).resolves.toBe("first");
    expect(await failed).toBe("PDF text extraction unavailable");
    expect(execFile).toHaveBeenCalledTimes(3);
    children[0].child.emit("close", 0, null);
    expect(execFile).toHaveBeenCalledTimes(3);
    finish(1, null, "next");
    await expect(next).resolves.toBe("next");
    expect(execFile).toHaveBeenCalledTimes(4);
    finish(2, null, "last");
    await expect(last).resolves.toBe("last");
    expect(vi.getTimerCount()).toBe(0);
  });
  it("counts queue wait against the eight-second extraction budget", async () => {
    const first = pdfToText(bytes);
    const second = pdfToText(bytes);
    await vi.advanceTimersByTimeAsync(7500);
    finish(0, null, "first");
    expect(children[1].options.timeout).toBe(500);
    finish(1, null, "second");
    await expect(first).resolves.toBe("first");
    await expect(second).resolves.toBe("second");
  });
  it("expires queued requests without spawning and retains admission until the timed-out child actually closes", async () => {
    const first = unavailable(pdfToText(bytes));
    const queued = unavailable(pdfToText(bytes));
    await vi.advanceTimersByTimeAsync(8000);
    expect(await queued).toBe("PDF text extraction unavailable");
    expect(execFile).toHaveBeenCalledTimes(1);
    // Simulate execFile's timeout callback after SIGKILL/stdio close, not a
    // parser response: admission must not open early while a child is alive.
    finish(0, new Error("ETIMEDOUT"), "partial Operations Manager");
    expect(await first).toBe("PDF text extraction unavailable");
    const next = pdfToText(bytes);
    expect(execFile).toHaveBeenCalledTimes(2);
    finish(1, null, "next");
    await expect(next).resolves.toBe("next");
  });
  it("discards partial output on parser failure or stdout maxBuffer overflow", async () => {
    for (const message of ["ERR_CHILD_PROCESS_STDIO_MAXBUFFER", "malformed PDF", "password required"]) {
      const result = unavailable(pdfToText(bytes));
      finish(-1, new Error(message), "Operations Manager Application Deadline: October 18, 2026");
      expect(await result).toBe("PDF text extraction unavailable");
    }
  });
  it("recovers admission after a synchronous spawn failure and rejects empty output", async () => {
    vi.mocked(execFile).mockImplementationOnce(() => { throw new Error("spawn failed"); });
    await expect(pdfToText(bytes)).rejects.toThrow("unavailable");
    const result = unavailable(pdfToText(bytes));
    finish(0, null, "  \n ");
    expect(await result).toBe("PDF text extraction unavailable");
    const next = pdfToText(bytes);
    finish(1, null, "recovered");
    await expect(next).resolves.toBe("recovered");
  });
  it("rejects bad input before any child is admitted", async () => {
    for (const input of [Buffer.alloc(0), Buffer.alloc(5_000_001), "https://employer.example.test/remote.pdf" as unknown as Uint8Array]) {
      await expect(pdfToText(input)).rejects.toThrow("unavailable");
    }
    expect(execFile).not.toHaveBeenCalled();
  });
});
