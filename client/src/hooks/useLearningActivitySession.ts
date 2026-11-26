import { useEffect, useRef, useState } from "react";
import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";
import { createStudyRecorder, type StudyStatus } from "@/lib/studyRecorder";

export type LearningActivityType =
  "quiz" | "mock_exam" | "flashcards" | "process_guide" | "ai_tutor";
type Options = {
  courseKey: string;
  activityType: LearningActivityType;
  enabled: boolean;
  identityKey?: string;
  topic?: string | null;
  unitsCompleted?: number;
  score?: number;
  total?: number;
};
// A separate non-batched transport keeps each final request small and permits it
// to finish during a page close. The normal verified cookies remain authoritative.
const delivery = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch: (input, init) =>
        fetch(input, { ...init, credentials: "include", keepalive: true }),
    }),
  ],
});
export function useLearningActivitySession(options: Options) {
  const [state, setState] = useState<{
    status: StudyStatus;
    unsavedSeconds: number;
  }>({ status: "ready", unsavedSeconds: 0 });
  const values = useRef(options);
  values.current = options;
  const retryRef = useRef(() => {});
  useEffect(() => {
    if (!options.enabled || !options.courseKey) {
      setState({ status: "ready", unsavedSeconds: 0 });
      return;
    }
    let disposed = false;
    const recorder = createStudyRecorder({
      key: () => crypto.randomUUID(),
      start: (sessionKey, startedAt) =>
        delivery.training.start.mutate({
          sessionKey,
          startedAt,
          courseKey: options.courseKey,
          activityType: options.activityType,
          topic: values.current.topic?.slice(0, 128) || undefined,
        }),
      write: (payload, complete) =>
        complete
          ? delivery.training.complete.mutate(payload)
          : delivery.training.heartbeat.mutate(payload),
      values: () => ({
        unitsCompleted: Math.max(0, values.current.unitsCompleted ?? 0),
        topic: values.current.topic?.slice(0, 128) || undefined,
        score: values.current.score,
        total: values.current.total,
      }),
      status: (status, unsavedSeconds) => {
        if (!disposed) setState({ status, unsavedSeconds });
      },
    });
    retryRef.current = () => void recorder.flush();
    const interact = () => recorder.interact();
    const flush = () => void recorder.flush();
    const pagehide = (event: PageTransitionEvent) => {
      if (event.persisted) flush();
      else void recorder.stop();
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach(event =>
      window.addEventListener(event, interact, { passive: true })
    );
    window.addEventListener("online", flush);
    window.addEventListener("pagehide", pagehide);
    document.addEventListener("visibilitychange", visibility);
    const tick = window.setInterval(
      () => recorder.tick(document.visibilityState === "visible"),
      1000
    );
    const timer = window.setInterval(flush, 5000);
    return () => {
      disposed = true;
      window.clearInterval(tick);
      window.clearInterval(timer);
      events.forEach(event => window.removeEventListener(event, interact));
      window.removeEventListener("online", flush);
      window.removeEventListener("pagehide", pagehide);
      document.removeEventListener("visibilitychange", visibility);
      void recorder.stop();
      // SPA navigation may race a response. Drain the same immutable queue for
      // a bounded period rather than abandoning the outstanding final interval.
      const drain = window.setInterval(() => {
        if (recorder.finished) window.clearInterval(drain);
        else void recorder.stop();
      }, 5000);
      window.setTimeout(() => window.clearInterval(drain), 60000);
    };
  }, [
    options.courseKey,
    options.activityType,
    options.enabled,
    options.identityKey,
  ]);
  return { ...state, retry: () => retryRef.current() };
}
