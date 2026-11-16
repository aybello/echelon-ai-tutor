import { compileOverlays, type ContentOverlay, type CourseOverlay } from "./overlay";
import { overlayDescriptors, overlayStamp, readOverlayDocument, resolveOverlayRoot, type OverlayDescriptor } from "./overlayFiles";
export const OVERLAY_CACHE_LIMITS = Object.freeze({ courses: 2, decodedBytes: 48 * 1024 * 1024, decodedMultiplier: 8 });
type Entry = { overlay: CourseOverlay; version: string; cost: number; stamps: string[]; context: string };
/** No raw documents, parsed bank, or all-course compilation retained. */
export class CourseOverlayStore {
  private cache = new Map<string, Entry>();
  private cost = 0;
  private reads = 0;
  constructor(private readonly root = resolveOverlayRoot(), private readonly descriptors: readonly OverlayDescriptor[] = overlayDescriptors) {}
  diagnostics() { return { overlayDiskReads: this.reads, overlayCachedCourses: this.cache.size, overlayCachedBytes: this.cost }; }
  get(courseKey: string, version: (documents: ContentOverlay[]) => string, context = ""): Entry {
    const descriptors = this.descriptors.filter(d => d.courses.includes(courseKey));
    const stamps = descriptors.map(d => overlayStamp(this.root, d));
    const previous = this.cache.get(courseKey);
    if (previous && previous.context === context && JSON.stringify(previous.stamps) === JSON.stringify(stamps)) {
      this.cache.delete(courseKey); this.cache.set(courseKey, previous); return previous;
    }
    if (previous) { this.cost -= previous.cost; this.cache.delete(courseKey); }
    const cost = descriptors.reduce((sum, d) => sum + d.bytes * OVERLAY_CACHE_LIMITS.decodedMultiplier, 0);
    // Evict BEFORE reading/parsing a different course, not after allocating it.
    while (this.cache.size && (this.cache.size >= OVERLAY_CACHE_LIMITS.courses || this.cost + cost > OVERLAY_CACHE_LIMITS.decodedBytes)) {
      const oldest = this.cache.keys().next().value!;
      this.cost -= this.cache.get(oldest)!.cost; this.cache.delete(oldest);
    }
    const documents: ContentOverlay[] = [];
    const self = this;
    function* source() {
      for (const descriptor of descriptors) { self.reads++; yield readOverlayDocument(self.root, descriptor); }
    }
    const compiled = compileOverlays(source(), courseKey, doc => {
      // Receipt validation happens on the WHOLE document before projection.
      // These entries share their example objects with the compiled course view.
      documents.push({ ...doc, additions: doc.additions.filter(e => e.courseKey === courseKey), replacements: doc.replacements.filter(e => e.courseKey === courseKey), receipt: undefined });
    });
    const overlay = compiled.get(courseKey) ?? { additions: [], replacements: new Map() };
    const entry = { overlay, version: version(documents), cost, stamps, context };
    if (cost <= OVERLAY_CACHE_LIMITS.decodedBytes) { this.cache.set(courseKey, entry); this.cost += cost; }
    return entry;
  }
}
