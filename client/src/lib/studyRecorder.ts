export type StudyStatus =
  "ready" | "recording" | "saving" | "retrying" | "unavailable" | "interrupted";
export type StudyWrite = {
  sessionKey: string;
  sequence: number;
  activeSeconds: number;
  unitsCompleted: number;
  topic?: string;
  score?: number;
  total?: number;
};
type Dependencies = {
  start: (
    sessionKey: string,
    startedAt: number,
    closing: boolean
  ) => Promise<unknown>;
  write: (
    payload: StudyWrite,
    complete: boolean,
    closing: boolean
  ) => Promise<{ recorded?: boolean; completed?: boolean; reason?: string }>;
  values: () => Omit<StudyWrite, "sessionKey" | "sequence" | "activeSeconds">;
  status: (status: StudyStatus, unsaved: number) => void;
  now?: () => number;
  key: () => string;
};
/** One serialized queue. Payload and sequence never change until acknowledged. */
export function createStudyRecorder(deps: Dependencies) {
  const now = deps.now ?? Date.now;
  let sessionKey = deps.key(),
    startedAt = 0,
    started = false,
    seconds = 0,
    sequence = 0;
  let busy = false,
    closing = false,
    closed = false,
    lastInteraction = 0;
  let pending: { payload: StudyWrite; complete: boolean } | null = null;
  let interrupted = false,
    blocked = false;
  const report = (status: StudyStatus) =>
    deps.status(
      interrupted ? "interrupted" : status,
      seconds + (pending?.payload.activeSeconds ?? 0)
    );
  async function flush() {
    if (busy || closed || blocked || !startedAt) return;
    busy = true;
    try {
      if (!started) {
        await deps.start(sessionKey, startedAt, closing);
        started = true;
      }
      do {
        if (!pending) {
          if (!seconds && !closing) break;
          const activeSeconds = Math.min(45, seconds);
          seconds -= activeSeconds;
          pending = {
            payload: {
              ...deps.values(),
              sessionKey,
              sequence: ++sequence,
              activeSeconds,
            },
            complete: closing && seconds === 0,
          };
        }
        report("saving");
        const result = await deps.write(
          pending.payload,
          pending.complete,
          closing
        );
        if (
          result.reason &&
          result.reason !== "duplicate" &&
          result.reason !== "completed"
        )
          throw Object.assign(new Error(result.reason), {
            data: { code: "BAD_REQUEST" },
          });
        const complete = pending.complete;
        pending = null;
        if (complete) closed = true;
      } while (closing && !closed);
      report(closed ? "ready" : "recording");
    } catch (error) {
      const code = (error as { data?: { code?: string } }).data?.code;
      if (["UNAUTHORIZED", "FORBIDDEN", "CONFLICT"].includes(code ?? "")) {
        blocked = true;
        report("unavailable");
      } else if (code === "BAD_REQUEST" || code === "NOT_FOUND") {
        // The server expires sessions after five minutes. Never silently claim
        // an expired interval was saved or transfer it to a different session.
        interrupted = true;
        pending = null;
        seconds = 0;
        started = false;
        sessionKey = deps.key();
        sequence = 0;
        startedAt = now();
        report("interrupted");
      } else report("retrying");
    } finally {
      busy = false;
    }
  }
  return {
    interact() {
      if (closing || blocked) return;
      lastInteraction = now();
      if (!startedAt) {
        startedAt = now();
        void flush();
      }
    },
    tick(visible: boolean) {
      if (closing || blocked || !startedAt) return;
      if (visible && now() - lastInteraction <= 60000) {
        if (seconds < 300) seconds++;
        else interrupted = true;
      }
    },
    flush,
    stop() {
      closing = true;
      return flush();
    },
    get finished() {
      return closed || blocked;
    },
  };
}
