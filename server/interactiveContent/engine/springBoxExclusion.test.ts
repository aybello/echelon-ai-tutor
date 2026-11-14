import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { InteractiveContentEngine } from "./loader";
import { committedReleaseExclusions, isReleaseExcluded } from "./modeFit";
import { committedOverlayDocuments, type ContentOverlay } from "./overlay";
import { interactiveModes } from "../../../shared/interactiveSessions";

const held = [107,108,110,112].map(n => `og-oit-b12-odd-one-out-${String(n).padStart(4, "0")}`);
const baseline = {
  oit: { counts: [831,274,641,343,335,418], version: "effective-2c43e39d492880ef3be22c9910508d892b4dcc00fdc3fc1b90b0916b6938da2f" },
  "oit-ww": { counts: [567,171,399,260,221,304], version: "effective-cb5268ddf59919fec3577c4004734a9cfaaa139592aa676d7c2a5c54f729f0f2" },
}; // Captured from unchanged parent 8ebc7b2 before this exclusion edit.
describe("narrow reversible spring-box classification hold", () => {
  it("preserves all original exclusion bytes and adds only the four exact IDs", () => {
    const doc = committedReleaseExclusions();
    const previous = { ...doc, groups: doc.groups.slice(0, -1) };
    expect(createHash("sha256").update(JSON.stringify(previous, null, 2) + "\n").digest("hex")).toBe("d1feb9454ed4324c516abf8ec0900cbccecf29397adfc27a72e499895fa9b5f5");
    expect(previous.groups.flatMap(g => g.ids)).toHaveLength(125);
    expect(doc.groups.at(-1)).toMatchObject({ courseKey: "oit", mode: "odd-one-out", ids: held });
    expect(new Set(doc.groups.flatMap(g => g.ids)).size).toBe(129);
    for (const id of held) {
      expect(isReleaseExcluded("oit", "odd-one-out", id)).toBe(true);
      expect(isReleaseExcluded("oit-ww", "odd-one-out", id)).toBe(false);
      expect(isReleaseExcluded("oit", "rapid-swipe", id)).toBe(false);
    }
    const batch = (committedOverlayDocuments() as ContentOverlay[]).find(d => d.overlayId === "og-oit-12")!;
    expect(batch.additions.filter(a => held.includes(a.example.id))).toHaveLength(4);
    expect(batch.receipt).toBeDefined(); // Kept in the stored, receipt-validated overlay, not rewritten.
  });
  it.each(["oit", "oit-ww"] as const)("%s changes only the intended effective count and cache identity", course => {
    const engine = new InteractiveContentEngine();
    const catalog = engine.getCatalog(course, true);
    if (course === "oit") expect(catalog.version).not.toBe(baseline[course].version);
    else expect(catalog.version).toBe(baseline[course].version);
    for (const [index, mode] of interactiveModes.entries()) {
      const expected = baseline[course].counts[index] - (course === "oit" && mode === "odd-one-out" ? 4 : 0);
      expect(catalog.modes.find(m => m.mode === mode)!.totalCount).toBe(expected);
      for (const access of [true, false]) {
        const session = engine.startSession({ courseKey: course, mode, sessionSize: 50 }, access);
        expect(session.examples.some(e => held.includes(e.id))).toBe(false);
        if (access) expect(session.totalAvailableCount).toBe(expected);
        expect(session.version).toBe(catalog.version);
        expect(engine.getLegacyContent(course, access).examples.some(e => held.includes(e.id))).toBe(false);
      }
    }
    const view = engine as unknown as { manifest(c: string): any; pool(c: string, m: any): { id: string }[] };
    expect(view.pool(course, view.manifest(course)).some(e => held.includes(e.id))).toBe(false);
  });
});
