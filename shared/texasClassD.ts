/**
 * Governed learner-facing scope for the dormant Texas Class D Water course.
 *
 * These values must remain consistent with the reviewed package and governed
 * mock blueprint. They do not make the course sellable or publicly routable.
 */
export const TEXAS_CLASS_D_WATER_COURSE_KEY = "us-texas-class-d-water";
export const TEXAS_CLASS_D_WATER_TOTAL_QUESTIONS = 120;

/** Exact governed allocation for a scored Texas Class D mock exam. */
export const TEXAS_CLASS_D_WATER_MOCK_BLUEPRINT = [
  { module: "Rules, licensing and records", total: 8, recall: 3, calculations: 0 },
  { module: "Safety and operator responsibilities", total: 7, recall: 1, calculations: 0 },
  { module: "Source water and general water quality", total: 8, recall: 3, calculations: 0 },
  { module: "Groundwater systems", total: 7, recall: 2, calculations: 0 },
  { module: "Surface water treatment", total: 8, recall: 3, calculations: 0 },
  { module: "Storage and distribution", total: 7, recall: 2, calculations: 0 },
  { module: "Disinfection", total: 7, recall: 2, calculations: 0 },
  { module: "Water utility math", total: 8, recall: 0, calculations: 8 },
] as const;

/** Derived from the governed blueprint, never maintained as a second source. */
export const TEXAS_CLASS_D_WATER_MOCK_QUESTIONS = TEXAS_CLASS_D_WATER_MOCK_BLUEPRINT
  .reduce((total, area) => total + area.total, 0);
export const TEXAS_CLASS_D_WATER_MATH_QUESTIONS_PER_MOCK = TEXAS_CLASS_D_WATER_MOCK_BLUEPRINT
  .reduce((total, area) => total + area.calculations, 0);
export const TEXAS_CLASS_D_WATER_MOCK_DURATION_SECONDS = 2 * 60 * 60;
