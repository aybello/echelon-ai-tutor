import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

export type LearningActivityType = "quiz" | "mock_exam" | "flashcards" | "process_guide" | "ai_tutor";

interface LearningActivityOptions {
  courseKey: string;
  activityType: LearningActivityType;
  enabled: boolean;
  topic?: string | null;
  unitsCompleted?: number;
  score?: number;
  total?: number;
}

/**
 * Records platform study time in one continuous block. A session does not begin
 * until the learner deliberately interacts with the study surface. Time then
 * accumulates only while the page is visible and interaction has occurred in
 * the last minute. Thirty-second flushes are sequenced and idempotent server-side.
 */
export function useLearningActivitySession(options: LearningActivityOptions): void {
  const startMutation = trpc.training.start.useMutation();
  const heartbeatMutation = trpc.training.heartbeat.useMutation();
  const completeMutation = trpc.training.complete.useMutation();
  const valuesRef = useRef(options);
  const mutationsRef = useRef({ startMutation, heartbeatMutation, completeMutation });
  valuesRef.current = options;
  mutationsRef.current = { startMutation, heartbeatMutation, completeMutation };

  useEffect(() => {
    if (!options.enabled || !options.courseKey) return;

    let sessionKey = crypto.randomUUID();
    let startRequested = false;
    let tracking = false;
    let stopped = false;
    let sequence = 0;
    let pendingSeconds = 0;
    let lastInteractionAt: number | null = null;
    let writeChain: Promise<unknown> = Promise.resolve();

    const recoverExpiredSession = (error: unknown) => {
      const code = (error as { data?: { code?: string } })?.data?.code;
      if (code !== "BAD_REQUEST" && code !== "NOT_FOUND") return;
      tracking = false;
      startRequested = false;
      sessionKey = crypto.randomUUID();
      sequence = 0;
      pendingSeconds = 0;
    };

    const beginTracking = () => {
      if (startRequested) return;
      startRequested = true;
      void mutationsRef.current.startMutation.mutateAsync({
        sessionKey,
        courseKey: options.courseKey,
        activityType: options.activityType,
        topic: options.topic?.slice(0, 128) || undefined,
      }).then((result) => {
        tracking = result.tracking;
        if (stopped && result.tracking) {
          mutationsRef.current.completeMutation.mutate({
            sessionKey,
            sequence: 1,
            activeSeconds: pendingSeconds,
            unitsCompleted: Math.max(0, valuesRef.current.unitsCompleted ?? 0),
            topic: valuesRef.current.topic?.slice(0, 128) || undefined,
            score: valuesRef.current.score,
            total: valuesRef.current.total,
          });
        }
      }).catch(() => {
        // Anonymous preview use remains available; it simply is not represented
        // in the operator's platform study record.
        tracking = false;
      });
    };
    const noteInteraction = () => {
      lastInteractionAt = Date.now();
      beginTracking();
    };
    const interactionEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "touchstart"];
    interactionEvents.forEach((event) => window.addEventListener(event, noteInteraction, { passive: true }));

    const activeTimer = window.setInterval(() => {
      if (tracking && lastInteractionAt != null && document.visibilityState === "visible" && Date.now() - lastInteractionAt <= 60_000) {
        pendingSeconds = Math.min(45, pendingSeconds + 1);
      }
    }, 1_000);

    const flush = () => {
      if (!tracking || pendingSeconds <= 0) return;
      const activeSeconds = pendingSeconds;
      pendingSeconds = 0;
      sequence += 1;
      const current = valuesRef.current;
      const payload = {
        sessionKey,
        sequence,
        activeSeconds,
        unitsCompleted: Math.max(0, current.unitsCompleted ?? 0),
        topic: current.topic?.slice(0, 128) || undefined,
        score: current.score,
        total: current.total,
      };
      // Keep writes in order. If a later sequence reached the server first, the
      // idempotency guard would correctly reject the older one but lose valid
      // time; serialization avoids that race on slow mobile connections.
      writeChain = writeChain
        .then(() => mutationsRef.current.heartbeatMutation.mutateAsync(payload))
        .catch((error) => {
          recoverExpiredSession(error);
          if (!stopped && lastInteractionAt != null && Date.now() - lastInteractionAt <= 60_000) beginTracking();
        });
    };
    const flushTimer = window.setInterval(flush, 30_000);

    return () => {
      stopped = true;
      window.clearInterval(activeTimer);
      window.clearInterval(flushTimer);
      interactionEvents.forEach((event) => window.removeEventListener(event, noteInteraction));
      if (!tracking) return;
      sequence += 1;
      const current = valuesRef.current;
      const payload = {
        sessionKey,
        sequence,
        activeSeconds: pendingSeconds,
        unitsCompleted: Math.max(0, current.unitsCompleted ?? 0),
        topic: current.topic?.slice(0, 128) || undefined,
        score: current.score,
        total: current.total,
      };
      writeChain = writeChain
        .then(() => mutationsRef.current.completeMutation.mutateAsync(payload))
        .catch(() => undefined);
    };
  // A topic or counter update belongs to the same continuous session and is read
  // from valuesRef. Only a course, activity, or enabled-state change starts a row.
  }, [options.activityType, options.courseKey, options.enabled]);
}
