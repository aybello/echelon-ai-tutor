import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

export type LearningActivityType = "quiz" | "mock_exam" | "flashcards" | "process_guide" | "ai_tutor";
type Options = { courseKey: string; activityType: LearningActivityType; enabled: boolean; topic?: string | null; unitsCompleted?: number; score?: number; total?: number };

/** Records only visible, recently-interacted study time. The server also caps elapsed time and rejects stale or duplicate heartbeats. */
export function useLearningActivitySession(options: Options): void {
  const startMutation = trpc.training.start.useMutation();
  const heartbeatMutation = trpc.training.heartbeat.useMutation();
  const completeMutation = trpc.training.complete.useMutation();
  const valuesRef = useRef(options);
  const mutationsRef = useRef({ startMutation, heartbeatMutation, completeMutation });
  valuesRef.current = options;
  mutationsRef.current = { startMutation, heartbeatMutation, completeMutation };

  useEffect(() => {
    if (!options.enabled || !options.courseKey) return;
    let sessionKey = crypto.randomUUID(), startRequested = false, tracking = false, stopped = false, sequence = 0, pendingSeconds = 0;
    let lastInteractionAt: number | null = null;
    let writeChain: Promise<unknown> = Promise.resolve();
    const recover = (error: unknown) => {
      const code = (error as { data?: { code?: string } })?.data?.code;
      if (code !== "BAD_REQUEST" && code !== "NOT_FOUND") return;
      tracking = false; startRequested = false; sessionKey = crypto.randomUUID(); sequence = 0; pendingSeconds = 0;
    };
    const begin = () => {
      if (startRequested) return;
      startRequested = true;
      void mutationsRef.current.startMutation.mutateAsync({ sessionKey, courseKey: options.courseKey, activityType: options.activityType, topic: options.topic?.slice(0, 128) || undefined })
        .then((result) => { tracking = result.tracking; })
        .catch(() => { tracking = false; });
    };
    const interact = () => { lastInteractionAt = Date.now(); begin(); };
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, interact, { passive: true }));
    const activeTimer = window.setInterval(() => {
      if (tracking && lastInteractionAt && document.visibilityState === "visible" && Date.now() - lastInteractionAt <= 60_000) pendingSeconds = Math.min(45, pendingSeconds + 1);
    }, 1_000);
    const flush = () => {
      if (!tracking || pendingSeconds <= 0) return;
      const activeSeconds = pendingSeconds; pendingSeconds = 0; sequence += 1;
      const current = valuesRef.current;
      writeChain = writeChain.then(() => mutationsRef.current.heartbeatMutation.mutateAsync({ sessionKey, sequence, activeSeconds, unitsCompleted: Math.max(0, current.unitsCompleted ?? 0), topic: current.topic?.slice(0, 128) || undefined, score: current.score, total: current.total }))
        .catch((error) => { recover(error); if (!stopped && lastInteractionAt && Date.now() - lastInteractionAt <= 60_000) begin(); });
    };
    const flushTimer = window.setInterval(flush, 30_000);
    return () => {
      stopped = true; window.clearInterval(activeTimer); window.clearInterval(flushTimer); events.forEach((event) => window.removeEventListener(event, interact));
      if (!tracking) return;
      sequence += 1; const current = valuesRef.current;
      writeChain = writeChain.then(() => mutationsRef.current.completeMutation.mutateAsync({ sessionKey, sequence, activeSeconds: pendingSeconds, unitsCompleted: Math.max(0, current.unitsCompleted ?? 0), topic: current.topic?.slice(0, 128) || undefined, score: current.score, total: current.total })).catch(() => undefined);
    };
  }, [options.activityType, options.courseKey, options.enabled]);
}
