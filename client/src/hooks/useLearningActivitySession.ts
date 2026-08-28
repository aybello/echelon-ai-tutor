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
 * Records verified active study time in one continuous block. Time accumulates
 * only while the page is visible and the learner has interacted in the last two
 * minutes. Thirty-second flushes are sequenced and idempotent server-side.
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

    const sessionKey = crypto.randomUUID();
    let tracking = false;
    let stopped = false;
    let sequence = 0;
    let pendingSeconds = 0;
    let lastInteractionAt = Date.now();
    let writeChain: Promise<unknown> = Promise.resolve();

    const noteInteraction = () => { lastInteractionAt = Date.now(); };
    const interactionEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "touchstart"];
    interactionEvents.forEach((event) => window.addEventListener(event, noteInteraction, { passive: true }));

    void mutationsRef.current.startMutation.mutateAsync({
      sessionKey,
      courseKey: options.courseKey,
      activityType: options.activityType,
      topic: options.topic?.slice(0, 128) || undefined,
    }).then((result) => {
      if (!stopped) {
        tracking = result.tracking;
        return;
      }
      if (result.tracking) {
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
      // as verified training time.
      tracking = false;
    });

    const activeTimer = window.setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastInteractionAt <= 120_000) {
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
        .catch(() => undefined);
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
