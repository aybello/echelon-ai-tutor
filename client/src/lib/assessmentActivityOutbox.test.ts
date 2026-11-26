import { describe, expect, it } from "vitest";
import {
  acknowledgeAssessmentActivityOutbox, assessmentActivityOutboxKey, assessmentActivityOutboxSchema,
  clearAssessmentActivityActor, loadAssessmentActivityOutbox, pendingAssessmentActivityOutboxes, saveAssessmentActivityOutbox,
  sequenceAssessmentActivityOutbox, type AssessmentActivityOutbox, type AssessmentActivityStorage,
} from "./assessmentActivityOutbox";
import type { AssessmentActivityEvent } from "@shared/assessmentActivity";
const event = (n = 1, sequence?: number) => ({ eventId: `550e8400-e29b-41d4-a716-${String(n).padStart(12, "0")}`, action: "answer_submitted" as const, itemId: "q1", chosenAnswer: "2", ...(sequence === undefined ? {} : { sequence }) });
const box = (): AssessmentActivityOutbox => ({ version: 1, actorKey: "user:7", capability: { tracking: true, sessionId: "550e8400-e29b-41d4-a716-446655440000", capability: "opaque-server-capability", nextSequence: 2, expiresAt: "2027-01-01T00:00:00.000Z", source: "observed" }, queue: [event()] });
function storage(): AssessmentActivityStorage {
  const data = new Map<string, string>();
  return { get length() { return data.size; }, key: i => [...data.keys()][i] ?? null, getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); }, removeItem: k => { data.delete(k); } };
}
describe("browser assessment observation outbox", () => {
  it("persists before delivery and reloads the exact original UUID/sequence/choice", () => {
    const s = storage(); const value = sequenceAssessmentActivityOutbox(box(), 2);
    expect(saveAssessmentActivityOutbox(s, value)).toBe(true);
    expect(loadAssessmentActivityOutbox(s, value)).toEqual({ value, problem: null });
    expect(sequenceAssessmentActivityOutbox(loadAssessmentActivityOutbox(s, value).value!, 9).queue).toEqual(value.queue);
  });
  it("never renumbers an ambiguous replay and sequences new observations after server and pending", () => {
    const value = box(); value.queue = [event(1, 8), event(2)];
    expect(sequenceAssessmentActivityOutbox(value, 8).queue.map(e => e.sequence)).toEqual([8, 9]);
    expect(sequenceAssessmentActivityOutbox(value, 15).queue.map(e => e.sequence)).toEqual([8, 15]);
  });
  it("persists acknowledgement removal, retaining observations appended during delivery", () => {
    const s = storage(); const value = sequenceAssessmentActivityOutbox(box(), 2);
    const sent = [...value.queue] as AssessmentActivityEvent[];
    value.queue.push(event(2));
    const acked = acknowledgeAssessmentActivityOutbox(value, sent);
    expect(acked.queue).toEqual([event(2)]);
    expect(saveAssessmentActivityOutbox(s, acked)).toBe(true);
    expect(loadAssessmentActivityOutbox(s, acked).value?.queue).toEqual([event(2)]);
    const empty = { ...acked, queue: [] };
    expect(saveAssessmentActivityOutbox(s, empty)).toBe(true);
    expect(loadAssessmentActivityOutbox(s, empty).value).toBeNull();
  });
  it("rejects conflicting UUID, sequence or answer acknowledgements", () => {
    const value = sequenceAssessmentActivityOutbox(box(), 2);
    for (const change of [{ chosenAnswer: "1" }, { sequence: 3 }, { eventId: event(9).eventId }]) {
      expect(() => acknowledgeAssessmentActivityOutbox(value, [{ ...value.queue[0], ...change } as AssessmentActivityEvent])).toThrow();
    }
  });
  it("isolates exact actor, server session and capability and clears all retired actor scopes", () => {
    const s = storage(); const a = box(); const b = { ...box(), actorKey: "anonymous" };
    const c = { ...box(), capability: { ...box().capability, sessionId: "550e8400-e29b-41d4-a716-446655440001" } };
    [a, b, c].forEach(v => expect(saveAssessmentActivityOutbox(s, v)).toBe(true));
    expect(loadAssessmentActivityOutbox(s, { ...a, capability: { ...a.capability, capability: "different" } }).value).toBeNull();
    expect(clearAssessmentActivityActor(s, a.actorKey)).toBe(true);
    expect(loadAssessmentActivityOutbox(s, a).value).toBeNull();
    expect(loadAssessmentActivityOutbox(s, c).value).toBeNull();
    expect(loadAssessmentActivityOutbox(s, b).value).toEqual(b);
    s.setItem(assessmentActivityOutboxKey(a), JSON.stringify(b));
    expect(loadAssessmentActivityOutbox(s, a).problem).toBe("invalid");
  });
  it("rejects corrupt JSON, foreign fields and duplicate or disordered replay", () => {
    const s = storage(); const value = box();
    for (const raw of ["{", JSON.stringify({ ...value, name: "not allowed" }), JSON.stringify({ ...value, capability: { ...value.capability, name: "not allowed" } }), JSON.stringify({ ...value, queue: [{ ...event(), questionText: "not allowed" }] }), JSON.stringify({ ...value, queue: [event(), event()] }), JSON.stringify({ ...value, queue: [event(), event(2, 2)] })]) {
      s.setItem(assessmentActivityOutboxKey(value), raw);
      expect(loadAssessmentActivityOutbox(s, value).problem).toBe("invalid");
    }
  });
  it("enforces queue and sequence bounds without truncating observations or filling gaps", () => {
    const value = box();
    value.queue = Array.from({ length: 250 }, (_, i) => event(i + 1));
    expect(assessmentActivityOutboxSchema.safeParse(value).success).toBe(true);
    expect(saveAssessmentActivityOutbox(storage(), { ...value, queue: [...value.queue, event(251)] })).toBe(false);
    expect(() => sequenceAssessmentActivityOutbox({ ...box(), queue: [event(1, 4)] }, 2)).toThrow();
    expect(() => sequenceAssessmentActivityOutbox(box(), 3001)).toThrow();
    expect(() => sequenceAssessmentActivityOutbox({ ...box(), queue: [event(1, 3001)] }, 2)).toThrow();
  });
  it("reports blocked storage honestly while preserving the in-memory observations", () => {
    const s = storage(); const bad = { ...s, getItem: () => { throw Error("blocked"); }, setItem: () => { throw Error("blocked"); }, removeItem: () => { throw Error("blocked"); } };
    const value = box();
    expect(loadAssessmentActivityOutbox(bad, value).problem).toBe("unavailable");
    expect(saveAssessmentActivityOutbox(bad, value)).toBe(false);
    expect(saveAssessmentActivityOutbox(null, value)).toBe(false);
    expect(value.queue).toEqual([event()]);
    expect(clearAssessmentActivityActor(null, value.actorKey)).toBe(false);
  });
  it("discovers only exact actor pending capabilities, bounded to ten without deleting overflow", () => {
    const s = storage();
    const boxes = Array.from({ length: 11 }, (_, i) => ({ ...box(), capability: { ...box().capability, capability: `cap-${i}` } }));
    boxes.forEach(value => saveAssessmentActivityOutbox(s, value));
    saveAssessmentActivityOutbox(s, { ...box(), actorKey: "anonymous" });
    const pending = pendingAssessmentActivityOutboxes(s, "user:7");
    expect(pending.values).toHaveLength(10); expect(pending.problem).toBe("limit");
    expect(pending.values.every(value => value.actorKey === "user:7")).toBe(true);
    expect(s.length).toBe(12);
    expect(pendingAssessmentActivityOutboxes(s, "user:8").values).toEqual([]);
  });
  it("never salvages corrupt, oversized, or mismatched historical queues", () => {
    const s = storage(); const value = box(); const key = assessmentActivityOutboxKey(value);
    for (const raw of ["{", "x".repeat(256001), JSON.stringify({ ...value, actorKey: "anonymous" }), JSON.stringify({ ...value, queue: [...Array(251)].map((_, i) => event(i + 1)) })]) {
      s.setItem(key, raw);
      expect(pendingAssessmentActivityOutboxes(s, value.actorKey)).toEqual({ values: [], problem: "invalid" });
    }
    expect(pendingAssessmentActivityOutboxes(null, value.actorKey).problem).toBe("unavailable");
  });
  it("bounds storage-key enumeration even for unrelated hostile storage", () => {
    const s = storage(); for (let i = 0; i < 1100; i++) s.setItem(`unrelated-${i}`, "x");
    let reads = 0; const bounded = { ...s, get length() { return s.length; }, key: (i: number) => { reads++; return s.key(i); } };
    expect(pendingAssessmentActivityOutboxes(bounded, "user:7")).toEqual({ values: [], problem: "limit" });
    expect(reads).toBe(1000);
  });

});
