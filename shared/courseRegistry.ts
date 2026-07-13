/**
 * Echelon Institute — Canonical Course Registry
 *
 * This is the SINGLE SOURCE OF TRUTH for all course definitions.
 * It replaces the scattered mappings in products.ts, subscriptionProducts.ts,
 * and access.ts. All province, tier, route, and team-assignability data lives here.
 *
 * Rules:
 * - Unknown course keys MUST fail closed (return undefined / throw).
 * - Ontario and Western/WPI course families MUST NOT accidentally mix.
 * - Legacy aliases resolve to canonical keys explicitly — never implicitly.
 * - Adding a new province requires only adding entries here.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExamFamily = "ontario" | "western";
export type TrackType =
  | "water-treatment"
  | "wastewater-treatment"
  | "water-distribution"
  | "wastewater-collection"
  | "water-quality"
  | "oit";

export interface CourseEntry {
  /** Canonical course key — used in DB, URLs, and product keys */
  courseKey: string;
  /** Human-readable display name */
  displayName: string;
  /** Short display name for compact UIs */
  shortName: string;
  /** Province / regulatory family */
  provinceOrRegion: ExamFamily;
  /** Regulatory exam family */
  examFamily: ExamFamily;
  /** Track within the exam family */
  track: TrackType;
  /** Numeric class level (1–4, or 0 for OIT) */
  classLevel: 0 | 1 | 2 | 3 | 4;
  /** Frontend quiz route (e.g. "/class1-water") */
  quizPath: string;
  /** Frontend mock exam route */
  mockExamPath: string;
  /** Frontend flashcard route (null if not available) */
  flashcardPath: string | null;
  /** Frontend formula sheet route (null if not available) */
  formulaPath: string | null;
  /** Individual product key in products.ts */
  productKey: string;
  /** Subscription tier this course belongs to */
  subscriptionTier: "class1" | "class2" | "class3" | "class4" | "all-access";
  /** Question bank key used in the DB */
  questionBankKey: string;
  /** Whether this course can be assigned to team seats */
  teamAssignable: boolean;
  /**
   * Legacy aliases that resolve to this canonical key.
   * These are accepted as input but normalized to courseKey.
   */
  aliases: string[];
  /** Whether this course is actively sold / accessible */
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const REGISTRY: CourseEntry[] = [
  // ── Ontario OIT ──────────────────────────────────────────────────────────
  {
    courseKey: "oit",
    displayName: "OIT — Water Treatment",
    shortName: "OIT Water",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "oit",
    classLevel: 0,
    quizPath: "/quiz",
    mockExamPath: "/oit-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "oit",
    subscriptionTier: "class1",
    questionBankKey: "oit",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "oit-ww",
    displayName: "OIT — Wastewater",
    shortName: "OIT Wastewater",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "oit",
    classLevel: 0,
    quizPath: "/oit-ww",
    mockExamPath: "/oit-ww-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "oit-ww",
    subscriptionTier: "class1",
    questionBankKey: "oit-ww",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  // ── Ontario Water Treatment ───────────────────────────────────────────────
  {
    courseKey: "class1-water",
    displayName: "Class 1 Water Treatment",
    shortName: "Class 1 Water",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "water-treatment",
    classLevel: 1,
    quizPath: "/class1-water",
    mockExamPath: "/class1-water-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class1-water",
    subscriptionTier: "class1",
    questionBankKey: "class1-water",
    teamAssignable: true,
    aliases: ["class1"],
    isActive: true,
  },
  {
    courseKey: "class2-water",
    displayName: "Class 2 Water Treatment",
    shortName: "Class 2 Water",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "water-treatment",
    classLevel: 2,
    quizPath: "/class2-water",
    mockExamPath: "/class2-water-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class2-water",
    subscriptionTier: "class2",
    questionBankKey: "class2-water",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "class3-water",
    displayName: "Class 3 Water Treatment",
    shortName: "Class 3 Water",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "water-treatment",
    classLevel: 3,
    quizPath: "/class3-water",
    mockExamPath: "/class3-water-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class3-water",
    subscriptionTier: "class3",
    questionBankKey: "class3-water",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "class4-water",
    displayName: "Class 4 Water Treatment",
    shortName: "Class 4 Water",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "water-treatment",
    classLevel: 4,
    quizPath: "/class4-water",
    mockExamPath: "/class4-water-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class4-water",
    subscriptionTier: "class4",
    questionBankKey: "class4-water",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  // ── Ontario Wastewater Treatment ──────────────────────────────────────────
  {
    courseKey: "class1-ww",
    displayName: "Class 1 Wastewater Treatment",
    shortName: "Class 1 Wastewater",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "wastewater-treatment",
    classLevel: 1,
    quizPath: "/class1-ww",
    mockExamPath: "/class1-ww-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class1-ww",
    subscriptionTier: "class1",
    questionBankKey: "class1-ww",
    teamAssignable: true,
    aliases: ["class1-wastewater"],
    isActive: true,
  },
  {
    courseKey: "class2-ww",
    displayName: "Class 2 Wastewater Treatment",
    shortName: "Class 2 Wastewater",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "wastewater-treatment",
    classLevel: 2,
    quizPath: "/class2-ww",
    mockExamPath: "/class2-ww-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class2-ww",
    subscriptionTier: "class2",
    questionBankKey: "class2-ww",
    teamAssignable: true,
    aliases: ["class2-wastewater"],
    isActive: true,
  },
  {
    courseKey: "class3-ww",
    displayName: "Class 3 Wastewater Treatment",
    shortName: "Class 3 Wastewater",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "wastewater-treatment",
    classLevel: 3,
    quizPath: "/class3-ww",
    mockExamPath: "/class3-ww-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class3-ww",
    subscriptionTier: "class3",
    questionBankKey: "class3-ww",
    teamAssignable: true,
    aliases: ["class3-wastewater"],
    isActive: true,
  },
  {
    courseKey: "class4-ww",
    displayName: "Class 4 Wastewater Treatment",
    shortName: "Class 4 Wastewater",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "wastewater-treatment",
    classLevel: 4,
    quizPath: "/class4-ww",
    mockExamPath: "/class4-ww-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class4-ww",
    subscriptionTier: "class4",
    questionBankKey: "class4-ww",
    teamAssignable: true,
    aliases: ["class4-wastewater"],
    isActive: true,
  },
  // ── Ontario Water Quality Analyst ─────────────────────────────────────────
  {
    courseKey: "wqa",
    displayName: "Water Quality Analyst (WQA)",
    shortName: "WQA",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "water-quality",
    classLevel: 4,
    quizPath: "/wqa",
    mockExamPath: "/wqa-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wqa",
    subscriptionTier: "class4",
    questionBankKey: "wqa",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  // ── Ontario Water Distribution ────────────────────────────────────────────
  {
    courseKey: "class1-water-dist",
    displayName: "Class 1 Water Distribution",
    shortName: "Class 1 Distribution",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "water-distribution",
    classLevel: 1,
    quizPath: "/class1-water-dist",
    mockExamPath: "/class1-water-dist-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class1-water-dist",
    subscriptionTier: "class1",
    questionBankKey: "class1-water-dist",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "class2-water-dist",
    displayName: "Class 2 Water Distribution",
    shortName: "Class 2 Distribution",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "water-distribution",
    classLevel: 2,
    quizPath: "/class2-water-dist",
    mockExamPath: "/class2-water-dist-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class2-water-dist",
    subscriptionTier: "class2",
    questionBankKey: "class2-water-dist",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "class3-water-dist",
    displayName: "Class 3 Water Distribution",
    shortName: "Class 3 Distribution",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "water-distribution",
    classLevel: 3,
    quizPath: "/class3-water-dist",
    mockExamPath: "/class3-water-dist-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class3-water-dist",
    subscriptionTier: "class3",
    questionBankKey: "class3-water-dist",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "class4-water-dist",
    displayName: "Class 4 Water Distribution",
    shortName: "Class 4 Distribution",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "water-distribution",
    classLevel: 4,
    quizPath: "/class4-water-dist",
    mockExamPath: "/class4-water-dist-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class4-water-dist",
    subscriptionTier: "class4",
    questionBankKey: "class4-water-dist",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  // ── Ontario Wastewater Collection ─────────────────────────────────────────
  {
    courseKey: "class1-wastewater-coll",
    displayName: "Class 1 Wastewater Collection",
    shortName: "Class 1 Collection",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "wastewater-collection",
    classLevel: 1,
    quizPath: "/class1-wastewater-coll",
    mockExamPath: "/class1-wastewater-coll-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class1-wastewater-coll",
    subscriptionTier: "class1",
    questionBankKey: "class1-wastewater-coll",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "class2-wastewater-coll",
    displayName: "Class 2 Wastewater Collection",
    shortName: "Class 2 Collection",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "wastewater-collection",
    classLevel: 2,
    quizPath: "/class2-wastewater-coll",
    mockExamPath: "/class2-wastewater-coll-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class2-wastewater-coll",
    subscriptionTier: "class2",
    questionBankKey: "class2-wastewater-coll",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "class3-wastewater-coll",
    displayName: "Class 3 Wastewater Collection",
    shortName: "Class 3 Collection",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "wastewater-collection",
    classLevel: 3,
    quizPath: "/class3-wastewater-coll",
    mockExamPath: "/class3-wastewater-coll-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class3-wastewater-coll",
    subscriptionTier: "class3",
    questionBankKey: "class3-wastewater-coll",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "class4-wastewater-coll",
    displayName: "Class 4 Wastewater Collection",
    shortName: "Class 4 Collection",
    provinceOrRegion: "ontario",
    examFamily: "ontario",
    track: "wastewater-collection",
    classLevel: 4,
    quizPath: "/class4-wastewater-coll",
    mockExamPath: "/class4-wastewater-coll-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "class4-wastewater-coll",
    subscriptionTier: "class4",
    questionBankKey: "class4-wastewater-coll",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  // ── Western Canada (WPI) Water Treatment ─────────────────────────────────
  {
    courseKey: "wpi-class1-water",
    displayName: "WPI Class I Water Treatment",
    shortName: "WPI Class I Water",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "water-treatment",
    classLevel: 1,
    quizPath: "/wpi-class1-water",
    mockExamPath: "/wpi-class1-water-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class1-water",
    subscriptionTier: "class1",
    questionBankKey: "wpi-class1-water",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "wpi-class2-water",
    displayName: "WPI Class II Water Treatment",
    shortName: "WPI Class II Water",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "water-treatment",
    classLevel: 2,
    quizPath: "/wpi-class2-water",
    mockExamPath: "/wpi-class2-water-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class2-water",
    subscriptionTier: "class2",
    questionBankKey: "wpi-class2-water",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "wpi-class3-water",
    displayName: "WPI Class III Water Treatment",
    shortName: "WPI Class III Water",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "water-treatment",
    classLevel: 3,
    quizPath: "/wpi-class3-water",
    mockExamPath: "/wpi-class3-water-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class3-water",
    subscriptionTier: "class3",
    questionBankKey: "wpi-class3-water",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "wpi-class4-water",
    displayName: "WPI Class IV Water Treatment",
    shortName: "WPI Class IV Water",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "water-treatment",
    classLevel: 4,
    quizPath: "/wpi-class4-water",
    mockExamPath: "/wpi-class4-water-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class4-water",
    subscriptionTier: "class4",
    questionBankKey: "wpi-class4-water",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  // ── Western Canada (WPI) Wastewater Treatment ─────────────────────────────
  {
    courseKey: "wpi-class1-wastewater",
    displayName: "WPI Class I Wastewater Treatment",
    shortName: "WPI Class I Wastewater",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "wastewater-treatment",
    classLevel: 1,
    quizPath: "/wpi-class1-wastewater",
    mockExamPath: "/wpi-class1-wastewater-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class1-wastewater",
    subscriptionTier: "class1",
    questionBankKey: "wpi-class1-wastewater",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "wpi-class2-wastewater",
    displayName: "WPI Class II Wastewater Treatment",
    shortName: "WPI Class II Wastewater",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "wastewater-treatment",
    classLevel: 2,
    quizPath: "/wpi-class2-wastewater",
    mockExamPath: "/wpi-class2-wastewater-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class2-wastewater",
    subscriptionTier: "class2",
    questionBankKey: "wpi-class2-wastewater",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "wpi-class3-wastewater",
    displayName: "WPI Class III Wastewater Treatment",
    shortName: "WPI Class III Wastewater",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "wastewater-treatment",
    classLevel: 3,
    quizPath: "/wpi-class3-wastewater",
    mockExamPath: "/wpi-class3-wastewater-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class3-wastewater",
    subscriptionTier: "class3",
    questionBankKey: "wpi-class3-wastewater",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "wpi-class4-wastewater",
    displayName: "WPI Class IV Wastewater Treatment",
    shortName: "WPI Class IV Wastewater",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "wastewater-treatment",
    classLevel: 4,
    quizPath: "/wpi-class4-wastewater",
    mockExamPath: "/wpi-class4-wastewater-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class4-wastewater",
    subscriptionTier: "class4",
    questionBankKey: "wpi-class4-wastewater",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  // ── Western Canada (WPI) Water Distribution ───────────────────────────────
  {
    courseKey: "wpi-class1-water-dist",
    displayName: "WPI Class I Water Distribution",
    shortName: "WPI Class I Distribution",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "water-distribution",
    classLevel: 1,
    quizPath: "/wpi-class1-water-dist",
    mockExamPath: "/wpi-class1-water-dist-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class1-water-dist",
    subscriptionTier: "class1",
    questionBankKey: "wpi-class1-water-dist",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "wpi-class2-water-dist",
    displayName: "WPI Class II Water Distribution",
    shortName: "WPI Class II Distribution",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "water-distribution",
    classLevel: 2,
    quizPath: "/wpi-class2-water-dist",
    mockExamPath: "/wpi-class2-water-dist-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class2-water-dist",
    subscriptionTier: "class2",
    questionBankKey: "wpi-class2-water-dist",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "wpi-class3-water-dist",
    displayName: "WPI Class III Water Distribution",
    shortName: "WPI Class III Distribution",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "water-distribution",
    classLevel: 3,
    quizPath: "/wpi-class3-water-dist",
    mockExamPath: "/wpi-class3-water-dist-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class3-water-dist",
    subscriptionTier: "class3",
    questionBankKey: "wpi-class3-water-dist",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  {
    courseKey: "wpi-class4-water-dist",
    displayName: "WPI Class IV Water Distribution",
    shortName: "WPI Class IV Distribution",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "water-distribution",
    classLevel: 4,
    quizPath: "/wpi-class4-water-dist",
    mockExamPath: "/wpi-class4-water-dist-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class4-water-dist",
    subscriptionTier: "class4",
    questionBankKey: "wpi-class4-water-dist",
    teamAssignable: true,
    aliases: [],
    isActive: true,
  },
  // ── Western Canada (WPI) Wastewater Collection ────────────────────────────
  {
    courseKey: "wpi-class1-water-coll",
    displayName: "WPI Class I Wastewater Collection",
    shortName: "WPI Class I Collection",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "wastewater-collection",
    classLevel: 1,
    quizPath: "/wpi-class1-water-coll",
    mockExamPath: "/wpi-class1-water-coll-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class1-water-coll",
    subscriptionTier: "class1",
    questionBankKey: "wpi-class1-water-coll",
    teamAssignable: true,
    aliases: ["wpi-class1-wastewater-coll"],
    isActive: true,
  },
  {
    courseKey: "wpi-class2-water-coll",
    displayName: "WPI Class II Wastewater Collection",
    shortName: "WPI Class II Collection",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "wastewater-collection",
    classLevel: 2,
    quizPath: "/wpi-class2-water-coll",
    mockExamPath: "/wpi-class2-water-coll-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class2-water-coll",
    subscriptionTier: "class2",
    questionBankKey: "wpi-class2-water-coll",
    teamAssignable: true,
    aliases: ["wpi-class2-wastewater-coll"],
    isActive: true,
  },
  {
    courseKey: "wpi-class3-water-coll",
    displayName: "WPI Class III Wastewater Collection",
    shortName: "WPI Class III Collection",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "wastewater-collection",
    classLevel: 3,
    quizPath: "/wpi-class3-water-coll",
    mockExamPath: "/wpi-class3-water-coll-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class3-water-coll",
    subscriptionTier: "class3",
    questionBankKey: "wpi-class3-water-coll",
    teamAssignable: true,
    aliases: ["wpi-class3-wastewater-coll"],
    isActive: true,
  },
  {
    courseKey: "wpi-class4-water-coll",
    displayName: "WPI Class IV Wastewater Collection",
    shortName: "WPI Class IV Collection",
    provinceOrRegion: "western",
    examFamily: "western",
    track: "wastewater-collection",
    classLevel: 4,
    quizPath: "/wpi-class4-water-coll",
    mockExamPath: "/wpi-class4-water-coll-mock",
    flashcardPath: null,
    formulaPath: null,
    productKey: "wpi-class4-water-coll",
    subscriptionTier: "class4",
    questionBankKey: "wpi-class4-water-coll",
    teamAssignable: true,
    aliases: ["wpi-class4-wastewater-coll"],
    isActive: true,
  },
];

// ---------------------------------------------------------------------------
// Internal index — built once at module load time
// ---------------------------------------------------------------------------

/** Primary index: canonical courseKey → entry */
const BY_KEY = new Map<string, CourseEntry>();
/** Alias index: alias → canonical entry */
const BY_ALIAS = new Map<string, CourseEntry>();

for (const entry of REGISTRY) {
  BY_KEY.set(entry.courseKey, entry);
  for (const alias of entry.aliases) {
    BY_ALIAS.set(alias, entry);
  }
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Look up a course by its canonical key.
 * Returns undefined for unknown keys — callers must handle this (fail closed).
 */
export function getCourseByKey(key: string): CourseEntry | undefined {
  return BY_KEY.get(key);
}

/**
 * Look up a course by a legacy alias.
 * Returns undefined if the alias is not registered.
 */
export function getCourseByAlias(alias: string): CourseEntry | undefined {
  return BY_ALIAS.get(alias);
}

/**
 * Resolve a key that may be either canonical or an alias.
 * Returns the canonical CourseEntry, or undefined if not found.
 * Use this at input boundaries (e.g. team seat assignment, quiz route).
 */
export function resolveCourseKey(key: string): CourseEntry | undefined {
  return BY_KEY.get(key) ?? BY_ALIAS.get(key);
}

/**
 * Check whether a key is a valid canonical course key for the given exam family.
 * FAIL CLOSED: returns false for unknown keys or cross-family keys.
 */
export function isValidCourseKeyForFamily(
  key: string,
  family: ExamFamily,
): boolean {
  const entry = BY_KEY.get(key);
  return entry !== undefined && entry.examFamily === family && entry.isActive;
}

/**
 * Return all active courses for a given exam family.
 */
export function getCoursesForFamily(family: ExamFamily): CourseEntry[] {
  return REGISTRY.filter((e) => e.examFamily === family && e.isActive);
}

/**
 * Return all active courses for a given subscription tier and exam family.
 */
export function getCoursesForSubscriptionTier(
  tier: CourseEntry["subscriptionTier"],
  family: ExamFamily,
): CourseEntry[] {
  return REGISTRY.filter(
    (e) => e.subscriptionTier === tier && e.examFamily === family && e.isActive,
  );
}

/**
 * Return all team-assignable courses for a given exam family.
 */
export function getTeamAssignableCourses(family: ExamFamily): CourseEntry[] {
  return REGISTRY.filter(
    (e) => e.examFamily === family && e.teamAssignable && e.isActive,
  );
}

/**
 * Given a canonical course key and exam family, return the subscription tier.
 * FAIL CLOSED: returns null for unknown or cross-family keys.
 */
export function courseKeyToTierStrict(
  key: string,
  family: ExamFamily,
): CourseEntry["subscriptionTier"] | null {
  const entry = BY_KEY.get(key);
  if (!entry || entry.examFamily !== family || !entry.isActive) return null;
  return entry.subscriptionTier;
}

/**
 * Return the quiz and mock exam routes for a course key.
 * Returns null if the key is unknown.
 */
export function getRouteForCourse(
  key: string,
): { quizPath: string; mockExamPath: string } | null {
  const entry = BY_KEY.get(key);
  if (!entry) return null;
  return { quizPath: entry.quizPath, mockExamPath: entry.mockExamPath };
}

/**
 * Return all active course keys as a flat array.
 * Useful for validation schemas.
 */
export function getAllActiveCourseKeys(): string[] {
  return REGISTRY.filter((e) => e.isActive).map((e) => e.courseKey);
}

/**
 * Return all active course keys for a given exam family as a flat array.
 */
export function getAllActiveCourseKeysForFamily(family: ExamFamily): string[] {
  return REGISTRY.filter((e) => e.examFamily === family && e.isActive).map(
    (e) => e.courseKey,
  );
}

/**
 * Return the full registry (read-only view).
 * Prefer the typed helpers above for most use cases.
 */
export function getAllCourses(): readonly CourseEntry[] {
  return REGISTRY;
}

/**
 * Returns the exam type(s) for a given courseKey.
 * For most courses this is a single-element array [questionBankKey].
 * Returns [] for unknown keys (fail closed).
 */
export function getExamTypesForCourseKey(courseKey: string): string[] {
  const entry = resolveCourseKey(courseKey);
  if (!entry) return [];
  return [entry.questionBankKey];
}

/**
 * Returns a human-readable label for a courseKey.
 * Equivalent to the legacy courseKeyToLabel from products.ts.
 * Falls back to the courseKey itself if not found.
 * The province parameter is accepted for API compatibility but not used
 * (province is encoded in the courseKey itself via the registry).
 */
export function courseKeyToLabel(courseKey: string, _province?: string): string {
  const entry = resolveCourseKey(courseKey);
  return entry?.displayName ?? courseKey;
}

/**
 * Returns team-assignable courses for a province as { key, label } pairs.
 * Drop-in replacement for the legacy getTeamCourseOptions from products.ts.
 * Province values: "ontario" | "western" (or any string — unknown maps to ontario).
 */
export function getTeamCourseOptions(
  province: string,
): { key: string; label: string }[] {
  const family: ExamFamily = province === "western" ? "western" : "ontario";
  return getTeamAssignableCourses(family).map((e) => ({
    key: e.courseKey,
    label: e.displayName,
  }));
}
