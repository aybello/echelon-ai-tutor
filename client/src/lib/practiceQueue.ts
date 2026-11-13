/** A bounded working set. Fetching another page never retains the whole bank. */
export class PracticeQueue<T extends { id: number }> {
  private buffer: T[] = [];
  private pending: Promise<void> | null = null;
  exhausted = false;
  total = 0;
  constructor(
    private fetchPage: (excludeIds: number[]) => Promise<{ questions: T[]; total: number; hasMore?: boolean }>,
    private seen = new Set<number>(),
  ) {}
  get size() { return this.buffer.length; }
  private async fill() {
    if (this.pending) return this.pending;
    if (this.exhausted) return;
    this.pending = (async () => {
      const excluded = new Set([...this.seen, ...this.buffer.map(q => q.id)]);
      const page = await this.fetchPage([...excluded]);
      this.total = page.total;
      const fresh = page.questions.filter(q => !excluded.has(q.id));
      this.buffer.push(...fresh);
      this.exhausted = !(page.hasMore ?? page.questions.length === 50) || fresh.length === 0;
    })();
    try { await this.pending; } finally { this.pending = null; }
  }
  async take(choose: (pool: T[]) => T | null): Promise<T | null> {
    if (!this.buffer.length) await this.fill();
    const next = choose(this.buffer);
    if (!next) return null;
    this.buffer = this.buffer.filter(q => q.id !== next.id);
    this.seen.add(next.id);
    if (this.buffer.length < 10) void this.fill().catch(() => { /* Retry on next demand. */ });
    return next;
  }
}
