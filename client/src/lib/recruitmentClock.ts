type ServerSample = { serverNowMs: number };
type Anchor = { serverNowMs: number; monotonicMs: number };

/** Display estimate only; the server remains authoritative for deadlines. */
export class RecruitmentClock {
  private samples = new WeakMap<ServerSample, Anchor>();
  private anchor: Anchor | null = null;

  record(sample: ServerSample, requestStartedMs: number, receivedMs: number) {
    // The server samples before persistence/commit. Charging the whole request
    // is deliberately conservative, not an estimate of one-way network latency.
    this.samples.set(sample, {
      serverNowMs:
        sample.serverNowMs + Math.max(0, receivedMs - requestStartedMs),
      monotonicMs: receivedMs,
    });
  }

  merge(sample: ServerSample, monotonicMs: number) {
    const measured = this.samples.get(sample);
    if (!measured) return;
    const estimated =
      measured.serverNowMs + Math.max(0, monotonicMs - measured.monotonicMs);
    this.anchor = {
      serverNowMs: Math.max(this.now(monotonicMs), estimated),
      monotonicMs,
    };
  }

  now(monotonicMs: number) {
    return this.anchor
      ? this.anchor.serverNowMs +
          Math.max(0, monotonicMs - this.anchor.monotonicMs)
      : 0;
  }

  clear() {
    this.samples = new WeakMap();
    this.anchor = null;
  }
}
