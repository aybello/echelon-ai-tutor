import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { learnerActivityPreference } from "@/lib/learnerActivityPreference";
import type { AssessmentActivityCapability, AssessmentActivityEvent } from "@shared/assessmentActivity";
import {
  acknowledgeAssessmentActivityOutbox, assessmentActivityCapabilitySchema,
  clearAssessmentActivityActor, loadAssessmentActivityOutbox, pendingAssessmentActivityEventSchema,
  saveAssessmentActivityOutbox, sequenceAssessmentActivityOutbox,
  type AssessmentActivityOutbox, type AssessmentActivityStorage,
} from "@/lib/assessmentActivityOutbox";

export type ActivityObservation = Pick<AssessmentActivityEvent, "action"> & Partial<Pick<AssessmentActivityEvent, "itemId" | "stepId" | "chosenAnswer" | "observedCorrect">>;
type State = {
  outbox: AssessmentActivityOutbox; sequence: number; hydrated: boolean;
  inFlight: boolean; requested: boolean; stopped: boolean; storageFailed: boolean;
};
function sessionStore(): AssessmentActivityStorage | null {
  try { return window.sessionStorage; } catch { return null; }
}
/** Supplemental browser-only observations, not canonical results or cross-device resume.
 * Headers and the server-issued capability alone authorize delivery. Failed delivery
 * never blocks answering; no completion or observed resume is invented by lifecycle hooks.
 */
export function useAssessmentActivity(tracking: AssessmentActivityCapability | null | undefined, actorKey = "") {
  const mutation = trpc.assessmentActivity.record.useMutation();
  const resume = trpc.assessmentActivity.resume.useMutation();
  const send = useRef(mutation.mutateAsync);
  const hydrate = useRef(resume.mutateAsync);
  send.current = mutation.mutateAsync;
  hydrate.current = resume.mutateAsync;
  // Only refs change during render; state creation/storage/retirement happen in callbacks or effects.
  const config = useRef({ tracking, actorKey });
  config.current = { tracking, actorKey };
  const actor = useRef(actorKey);
  const retiredCapabilities = useRef(new Set<string>());
  const actorCapabilities = useRef(new Set<string>());
  const current = useRef<State | null>(null);
  const lifecycle = useRef(0);
  const mounted = useRef(true);
  const [saveError, setSaveError] = useState(false);
  const report = useCallback((error: boolean) => { if (mounted.current) setSaveError(error); }, []);
  const persist = useCallback((state: State) => {
    state.storageFailed = !saveAssessmentActivityOutbox(sessionStore(), state.outbox);
    return !state.storageFailed;
  }, []);
  const ownState = useCallback((): State | null => {
    const { tracking: supplied, actorKey: activeActor } = config.current;
    const old = current.current;
    if (actor.current !== activeActor) {
      for (const cap of actorCapabilities.current) retiredCapabilities.current.add(cap);
      actorCapabilities.current.clear();
      if (old) {
        retiredCapabilities.current.add(old.outbox.capability.capability);
        old.stopped = true; old.outbox.queue = [];
      }
      clearAssessmentActivityActor(sessionStore(), actor.current);
      actor.current = activeActor;
      current.current = null;
    }
    const parsed = assessmentActivityCapabilitySchema.safeParse(supplied);
    if (!parsed.success || retiredCapabilities.current.has(parsed.data.capability) || learnerActivityPreference() !== "allowed") {
      const stale = current.current;
      if (stale) {
        stale.stopped = true;
        // Capability changes preserve same-actor pending records for an explicitly owned resume.
        // A revoked preference, unlike an absent capability, discards local observations.
        if (learnerActivityPreference() !== "allowed") {
          stale.outbox.queue = [];
          clearAssessmentActivityActor(sessionStore(), activeActor);
        }
      }
      current.current = null;
      return null;
    }
    const cap = parsed.data;
    const existing = current.current;
    if (existing && existing.outbox.actorKey === activeActor && existing.outbox.capability.capability === cap.capability && existing.outbox.capability.sessionId === cap.sessionId) return existing;
    if (existing) existing.stopped = true;
    actorCapabilities.current.add(cap.capability);
    const scope = { actorKey: activeActor, capability: cap };
    const loaded = loadAssessmentActivityOutbox(sessionStore(), scope);
    const next: State = {
      outbox: loaded.value ?? { version: 1, ...scope, queue: [] }, sequence: cap.nextSequence,
      hydrated: false, inFlight: false, requested: false,
      stopped: loaded.problem === "invalid", storageFailed: loaded.problem === "unavailable",
    };
    current.current = next;
    report(Boolean(loaded.problem));
    return next;
  }, [report]);
  const flush = useCallback(async () => {
    const state = ownState();
    if (!state || state.stopped) return;
    if (state.inFlight) { state.requested = true; return; }
    state.inFlight = true;
    let failed = false;
    const active = () => mounted.current && current.current === state && !state.stopped &&
      config.current.actorKey === state.outbox.actorKey &&
      config.current.tracking?.capability === state.outbox.capability.capability &&
      config.current.tracking?.sessionId === state.outbox.capability.sessionId;
    try {
      if (!state.hydrated) {
        const result = await hydrate.current({ capability: state.outbox.capability.capability });
        if (!active()) return;
        if (!result.tracking || result.sessionId !== state.outbox.capability.sessionId || result.capability !== state.outbox.capability.capability) {
          state.stopped = true; report(true); return;
        }
        // Never discard assigned records just because the server advanced: the lost ACK is ambiguous.
        state.outbox = sequenceAssessmentActivityOutbox(state.outbox, result.nextSequence);
        state.sequence = Math.max(result.nextSequence, ...state.outbox.queue.map(event => (event.sequence ?? 1) + 1));
        state.hydrated = true;
        persist(state);
      }
      while (active() && state.outbox.queue.length) {
        if (learnerActivityPreference() !== "allowed") {
          state.outbox.queue = []; state.stopped = true;
          clearAssessmentActivityActor(sessionStore(), state.outbox.actorKey); return;
        }
        state.outbox = sequenceAssessmentActivityOutbox(state.outbox, state.sequence);
        state.sequence = Math.max(state.sequence, ...state.outbox.queue.map(event => (event.sequence ?? 1) + 1));
        persist(state); // Before the very first send, including assigned sequences.
        const events = state.outbox.queue.slice(0, 25) as AssessmentActivityEvent[];
        const result = await send.current({ capability: state.outbox.capability.capability, events });
        if (!active()) return;
        if (!result.tracking || !result.recorded) { failed = true; report(true); return; }
        state.outbox = acknowledgeAssessmentActivityOutbox(state.outbox, events);
        state.sequence = Math.max(state.sequence, result.nextSequence);
        persist(state);
        report(state.storageFailed);
      }
    } catch { failed = true; if (active()) report(true); }
    finally {
      state.inFlight = false;
      const requested = state.requested;
      state.requested = false;
      // A request arriving as a flush settles must not strand new observations.
      if (requested && !failed && active() && state.outbox.queue.length) void flush();
    }
  }, [ownState, persist, report]);
  const observe = useCallback((event: ActivityObservation) => {
    const state = ownState();
    if (!state || state.stopped) return;
    try {
      if (state.outbox.queue.length >= 250) throw Error("Observation queue full");
      const pending = pendingAssessmentActivityEventSchema.parse({ ...event, eventId: crypto.randomUUID() });
      state.outbox.queue.push(pending);
      if (!persist(state)) report(true);
      void flush();
    } catch { state.stopped = true; report(true); }
  }, [ownState, flush, persist, report]);
  const key = tracking?.capability;
  const sessionId = tracking?.sessionId;
  useEffect(() => {
    mounted.current = true;
    const generation = ++lifecycle.current;
    ownState();
    void flush();
    return () => {
      // StrictMode immediately runs setup again. Keep its initial observations and in-flight request.
      queueMicrotask(() => {
        if (lifecycle.current !== generation) return;
        mounted.current = false;
        if (current.current) current.current.stopped = true;
      });
    };
  }, [key, sessionId, actorKey, ownState, flush]);
  useEffect(() => {
    const retry = () => { void flush(); };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [flush]);
  return { observe, retry: flush, saveError, trackingAvailable: assessmentActivityCapabilitySchema.safeParse(tracking).success };
}
