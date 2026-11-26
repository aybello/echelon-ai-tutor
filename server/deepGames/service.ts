import { randomInt, randomUUID } from "node:crypto";
import {
  deepCatalogInputSchema, deepCatalogResponseSchema, deepGameModes, deepStartInputSchema,
  type DeepCatalogResponse, type DeepGameMode, type DeepSessionResponse, type DeepStartInput,
} from "../../shared/deepGames";
import { isDeepCourseSupported, loadDeepCourse, type DeepCourseLoader } from "./registry";
import { validateDeepSessionResponse } from "./schema";

const titles: Record<DeepGameMode, string> = {
  "calculation-ladder": "Calculation Ladder",
  "build-process": "Build the Process",
  "find-calculation-error": "Find the Calculation Error",
  "evidence-detective": "Evidence Detective",
  "exam-escape-room": "Exam Escape Room",
};
export class DeepGameUnavailableError extends Error {
  constructor() { super("Deep game content is unavailable."); this.name = "DeepGameUnavailableError"; }
}
export class DeepGameVersionError extends Error {
  constructor() { super("Deep game content changed. Refresh the catalog and try again."); this.name = "DeepGameVersionError"; }
}
const unavailableCatalog = (courseKey: string): DeepCatalogResponse => ({
  courseKey, version: null, available: false, modes: [], authoredTaskCount: 0, missionCount: 0,
});

/** Server-only deterministic seams for private tests; no caller controls loaders, IDs or RNG. */
export function createDeepGameService(options: {
  loadCourse?: DeepCourseLoader;
  randomIndex?: (exclusiveMax: number) => number;
  newSessionId?: () => string;
} = {}) {
  const load = options.loadCourse ?? loadDeepCourse;
  const randomIndex = options.randomIndex ?? ((max: number) => randomInt(max));
  function pickIndex(max: number): number {
    const index = randomIndex(max);
    if (!Number.isInteger(index) || index < 0 || index >= max) throw new DeepGameUnavailableError();
    return index;
  }
  async function getDeepCatalog(courseKey: string): Promise<DeepCatalogResponse> {
    deepCatalogInputSchema.parse({ courseKey });
    if (!isDeepCourseSupported(courseKey)) return unavailableCatalog(courseKey);
    try {
      const data = await load(courseKey);
      if (!data || data.courseKey !== courseKey) return unavailableCatalog(courseKey);
      const modes = deepGameModes.flatMap(mode => {
        const count = mode === "exam-escape-room" ? data.missions.length : data.tasks.filter(task => task.mode === mode).length;
        return count > 0 ? [{ mode, title: titles[mode], count }] : [];
      });
      return deepCatalogResponseSchema.parse({
        courseKey, version: data.version, available: true, modes,
        authoredTaskCount: data.tasks.length, missionCount: data.missions.length,
      });
    } catch { return unavailableCatalog(courseKey); }
  }
  async function startDeepSession(supplied: DeepStartInput): Promise<DeepSessionResponse> {
    const input = deepStartInputSchema.parse(supplied);
    if (!isDeepCourseSupported(input.courseKey)) throw new DeepGameUnavailableError();
    let data;
    try { data = await load(input.courseKey); }
    catch { throw new DeepGameUnavailableError(); }
    if (!data || data.courseKey !== input.courseKey) throw new DeepGameUnavailableError();
    if (input.version !== undefined && input.version !== data.version) throw new DeepGameVersionError();
    const base = { courseKey: data.courseKey, version: data.version, sessionId: (options.newSessionId ?? randomUUID)(), mode: input.mode };
    if (input.mode === "exam-escape-room") {
      if (!data.missions.length) throw new DeepGameUnavailableError();
      const mission = data.missions[pickIndex(data.missions.length)];
      return validateDeepSessionResponse({
        ...base, mission,
        tasks: mission.tasks.map(ref => {
          const task = data.tasks.find(task => task.id === ref.taskId && task.revision === ref.revision);
          if (!task) throw new DeepGameUnavailableError();
          return { id: ref.occurrenceId, sourceId: ref.taskId, task };
        }),
      });
    }
    const pool = data.tasks.filter(task => task.mode === input.mode);
    if (!pool.length) throw new DeepGameUnavailableError();
    const count = Math.min(input.sessionSize, pool.length);
    // Partial Fisher-Yates: sample without replacement; original aliases/cards remain untouched.
    for (let index = 0; index < count; index++) {
      const chosen = index + pickIndex(pool.length - index);
      [pool[index], pool[chosen]] = [pool[chosen], pool[index]];
    }
    return validateDeepSessionResponse({
      ...base,
      tasks: pool.slice(0, count).map((task, index) => ({ id: `item:${index}`, sourceId: task.id, task })),
    });
  }
  return { getDeepCatalog, startDeepSession };
}
const service = createDeepGameService();
export const getDeepCatalog = service.getDeepCatalog;
export const startDeepSession = service.startDeepSession;
