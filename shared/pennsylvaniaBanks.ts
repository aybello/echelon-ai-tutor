/** Pennsylvania original practice banks. No official exam weighting or commercial grant. */
export const PENNSYLVANIA_BANKS = [
  { courseKey: "pa-class-e-water-distribution", label: "Pennsylvania Class E Water Distribution", track: "water-distribution", count: 500, conceptualCount: 380 },
  { courseKey: "pa-wastewater-collection-e4", label: "Pennsylvania Wastewater Collection (Class E, Subclass 4)", track: "wastewater-collection", count: 250, conceptualCount: 178 },
] as const;
export type PennsylvaniaCourseKey = typeof PENNSYLVANIA_BANKS[number]["courseKey"];
export function pennsylvaniaBank(key: string) { return PENNSYLVANIA_BANKS.find(bank => bank.courseKey === key); }
/** Echelon practice-session settings, NOT Pennsylvania exam length, time or passing requirements. */
export const PA_PRACTICE_MOCK = { count: 100, duration: 3 * 60 * 60, passThreshold: 0.7 } as const;

/** Independent state practice packages; registration is not a commercial grant. */
export const US_STATE_PRACTICE_BANKS = [
  ...PENNSYLVANIA_BANKS.map(bank => ({ ...bank, stateCode: "PA", stateName: "Pennsylvania" } as const)),
  { courseKey: "fl-water-distribution-l3", label: "Florida Water Distribution Level 3", track: "water-distribution", count: 150, conceptualCount: 114, stateCode: "FL", stateName: "Florida" },
] as const;
export type StatePracticeCourseKey = typeof US_STATE_PRACTICE_BANKS[number]["courseKey"];
export function statePracticeBank(key: string) { return US_STATE_PRACTICE_BANKS.find(bank => bank.courseKey === key); }
