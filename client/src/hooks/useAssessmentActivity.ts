import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { learnerActivityPreference } from "@/lib/learnerActivityPreference";
import { readAccessToken } from "@/lib/readAccessToken";
import type { AssessmentActivityCapability, AssessmentActivityEvent } from "@shared/assessmentActivity";
import {
  acknowledgeAssessmentActivityOutbox, assessmentActivityCapabilitySchema, assessmentActivityOutboxKey,
  ASSESSMENT_ACTIVITY_PENDING_CAPABILITY_LIMIT, ASSESSMENT_ACTIVITY_QUEUE_LIMIT,
  clearAssessmentActivityActor, loadAssessmentActivityOutbox, pendingAssessmentActivityEventSchema,
  pendingAssessmentActivityOutboxes, saveAssessmentActivityOutbox, sequenceAssessmentActivityOutbox,
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
function worker(outbox: AssessmentActivityOutbox, problem: "unavailable" | "invalid" | null = null): State {
  return { outbox, sequence: outbox.capability.nextSequence, hydrated: false, inFlight: false,
    requested: false, stopped: problem === "invalid", storageFailed: problem === "unavailable" };
}
/** Supplemental browser-only observations, not canonical results or cross-device resume.
 * Headers and the original server-issued capability alone authorize each delivery.
 * No completion or observed resume is invented by lifecycle hooks.
 */
export function useAssessmentActivity(tracking: AssessmentActivityCapability | null | undefined, actorKey = "") {
  const mutation = trpc.assessmentActivity.record.useMutation();
  const resume = trpc.assessmentActivity.resume.useMutation();
  const send = useRef(mutation.mutateAsync);
  const hydrate = useRef(resume.mutateAsync);
  send.current = mutation.mutateAsync;
  hydrate.current = resume.mutateAsync;
  const config = useRef({ tracking, actorKey });
  config.current = { tracking, actorKey };
  const actor = useRef(actorKey);
  const retiredCapabilities = useRef(new Set<string>());
  const actorCapabilities = useRef(new Set<string>());
  const workers = useRef(new Map<string, State>());
  const current = useRef<State | null>(null);
  const lifecycle = useRef(0);
  const mounted = useRef(true);
  const [saveError, setSaveError] = useState(false);
  const report = useCallback((error: boolean) => { if (mounted.current) setSaveError(error); }, []);
  const persist = useCallback((state: State) => {
    state.storageFailed = !saveAssessmentActivityOutbox(sessionStore(), state.outbox);
    return !state.storageFailed;
  }, []);
  const discardActor = useCallback(() => {
    for (const state of workers.current.values()) { state.stopped = true; state.outbox.queue = []; }
    workers.current.clear(); current.current = null;
    clearAssessmentActivityActor(sessionStore(), actor.current);
  }, []);
  const ownState = useCallback((supplied = config.current.tracking, makeCurrent = true): State | null => {
    const { actorKey: activeActor } = config.current;
    if (actor.current !== activeActor) {
      for (const cap of actorCapabilities.current) retiredCapabilities.current.add(cap);
      actorCapabilities.current.clear();
      discardActor();
      actor.current = activeActor;
    }
    if (learnerActivityPreference() !== "allowed") { discardActor(); return null; }
    const parsed = assessmentActivityCapabilitySchema.safeParse(supplied);
    if (!parsed.success || retiredCapabilities.current.has(parsed.data.capability)) { if (makeCurrent) current.current = null; return null; }
    const cap = parsed.data;
    const scope = { actorKey: activeActor, capability: cap };
    const key = assessmentActivityOutboxKey(scope);
    const existing = workers.current.get(key);
    if (existing) { if (makeCurrent) current.current = existing; return existing; }
    // Empty inactive workers need not occupy the bounded pending-capability pool.
    for (const [key, state] of workers.current) if (!state.inFlight && !state.outbox.queue.length) workers.current.delete(key);
    if (workers.current.size >= ASSESSMENT_ACTIVITY_PENDING_CAPABILITY_LIMIT) { current.current = null; report(true); return null; }
    actorCapabilities.current.add(cap.capability);
    const loaded = loadAssessmentActivityOutbox(sessionStore(), scope);
    const next = worker(loaded.value ?? { version: 1, ...scope, queue: [] }, loaded.problem);
    workers.current.set(key, next); if (makeCurrent) current.current = next;
    if (loaded.problem) report(true);
    return next;
  }, [discardActor, report]);
  const flushState = useCallback(async (state: State): Promise<boolean> => {
    if (state.stopped) return false;
    if (state.inFlight) { state.requested = true; return true; }
    state.inFlight = true;
    let failed = false;
    // A pending worker owns its ORIGINAL scope, not the currently displayed capability.
    const active = () => {
      if (learnerActivityPreference() !== "allowed") { discardActor(); return false; }
      return mounted.current && !state.stopped && config.current.actorKey === state.outbox.actorKey;
    };
    try {
      if (!active()) return false;
      if (!state.hydrated) {
        const result = await hydrate.current({ capability: state.outbox.capability.capability, accessToken: readAccessToken() });
        if (!active()) return false;
        // tracking:false also means transient storage/rate-limit failure. Preserve the queue
        // and allow an honest retry; invalid capabilities remain rejected by the server.
        if (!result.tracking || result.sessionId !== state.outbox.capability.sessionId || result.capability !== state.outbox.capability.capability) {
          failed = true; return false;
        }
        state.outbox = sequenceAssessmentActivityOutbox(state.outbox, result.nextSequence);
        state.sequence = Math.max(result.nextSequence, ...state.outbox.queue.map(event => (event.sequence ?? 1) + 1));
        state.hydrated = true;
        persist(state);
      }
      while (active() && state.outbox.queue.length) {
        state.outbox = sequenceAssessmentActivityOutbox(state.outbox, state.sequence);
        state.sequence = Math.max(state.sequence, ...state.outbox.queue.map(event => (event.sequence ?? 1) + 1));
        persist(state); // Before the very first send, including assigned sequences.
        const events = state.outbox.queue.slice(0, 25) as AssessmentActivityEvent[];
        const result = await send.current({ capability: state.outbox.capability.capability, events, accessToken: readAccessToken() });
        if (!active()) return false;
        if (!result.tracking || !result.recorded) { failed = true; return false; }
        state.outbox = acknowledgeAssessmentActivityOutbox(state.outbox, events);
        state.sequence = Math.max(state.sequence, result.nextSequence);
        persist(state);
      }
      return !state.storageFailed;
    } catch { failed = true; return false; }
    finally {
      state.inFlight = false;
      const requested = state.requested;
      state.requested = false;
      if (failed && active()) report(true);
      // A request arriving as a flush settles must not strand new observations.
      if (requested && !failed && active() && state.outbox.queue.length) void flushState(state);
    }
  }, [discardActor, persist, report]);
  const flush = useCallback(async () => {
    ownState();
    if (learnerActivityPreference() !== "allowed") return;
    const activeActor = config.current.actorKey;
    const pending = pendingAssessmentActivityOutboxes(sessionStore(), activeActor);
    for (const outbox of pending.values) {
      const key = assessmentActivityOutboxKey(outbox);
      if (workers.current.has(key) || retiredCapabilities.current.has(outbox.capability.capability)) continue;
      for (const [key, state] of workers.current) if (state !== current.current && !state.inFlight && !state.outbox.queue.length) workers.current.delete(key);
      if (workers.current.size >= ASSESSMENT_ACTIVITY_PENDING_CAPABILITY_LIMIT) { pending.problem = "limit"; break; }
      actorCapabilities.current.add(outbox.capability.capability);
      workers.current.set(key, worker(outbox));
    }
    const results = await Promise.all([...workers.current.values()].map(flushState));
    if (mounted.current && config.current.actorKey === activeActor && learnerActivityPreference() === "allowed") {
      report(Boolean(pending.problem) || results.some(result => !result));
    }
  }, [ownState, flushState, report]);
  const observeFor = useCallback((capability: AssessmentActivityCapability | null | undefined, event: ActivityObservation) => {
    // A retained callback from a different actor must never adopt a late capability.
    if (actorKey !== config.current.actorKey) return;
    const state = ownState(capability, false);
    if (!state || state.stopped) return;
    try {
      if (state.outbox.queue.length >= ASSESSMENT_ACTIVITY_QUEUE_LIMIT) throw Error("Observation queue full");
      const pending = pendingAssessmentActivityEventSchema.parse({ ...event, eventId: crypto.randomUUID() });
      state.outbox.queue.push(pending);
      if (!persist(state)) report(true);
      void flush();
    } catch { state.stopped = true; report(true); }
  }, [actorKey, ownState, flush, persist, report]);
  const observe = useCallback((event: ActivityObservation) => observeFor(tracking, event), [observeFor, tracking]);
  const key = tracking?.capability;
  const sessionId = tracking?.sessionId;
  useEffect(() => {
    mounted.current = true;
    const generation = ++lifecycle.current;
    void flush();
    return () => {
      // StrictMode immediately runs setup again. Keep initial observations/in-flight requests.
      queueMicrotask(() => {
        if (lifecycle.current !== generation) return;
        mounted.current = false;
        for (const state of workers.current.values()) state.stopped = true;
      });
    };
  }, [key, sessionId, actorKey, flush]);
  useEffect(() => {
    const retry = () => { void flush(); };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [flush]);
  return { observe, observeFor, retry: flush, saveError, trackingAvailable: assessmentActivityCapabilitySchema.safeParse(tracking).success };
}
