import { getCourseByKey } from "../../shared/courseRegistry";
import { deepCourseLevels, type DeepCoursePackage } from "../../shared/deepGames";
import { validateDeepCoursePackage } from "./schema";

type PilotKey = DeepCoursePackage["courseKey"];
type NativeImporter = (url: string) => Promise<{ default?: unknown }>;
export type DeepCourseLoader = (courseKey: string) => Promise<DeepCoursePackage | null>;

/** Courses whose content module has shipped. Add a key here only together with its content file. */
export const DEEP_CONTENT_COURSES = ["oit", "class1-water"] as const satisfies readonly PilotKey[];
export function isDeepCourseSupported(courseKey: string): courseKey is PilotKey {
  if (!(DEEP_CONTENT_COURSES as readonly string[]).includes(courseKey) || !(courseKey in deepCourseLevels)) return false;
  const course = getCourseByKey(courseKey);
  return !!course?.isActive && course.courseKey === courseKey
    && (course.provinceOrRegion === "ontario" || course.provinceOrRegion === "western")
    && (course.examFamily === "ontario" || course.examFamily === "western");
}

/** Only trusted module location affects this fixed map; never caller input or cwd.
 * esbuild's single server bundle keeps import.meta.url at dist/index.js. Content
 * is separately compiled by the parent build, outside the public static tree.
 */
export function deepContentModuleUrls(moduleUrl = import.meta.url): Readonly<Record<PilotKey, string>> {
  const location = new URL(moduleUrl);
  if (location.protocol !== "file:") throw new Error("Deep content runtime unavailable");
  if (location.pathname.endsWith("/server/deepGames/registry.ts")) {
    return Object.freeze(Object.fromEntries(DEEP_CONTENT_COURSES.map(key => [key, new URL(`./content/${key}.ts`, location).href])) as Record<PilotKey, string>);
  }
  if (location.pathname.endsWith("/index.js")) {
    return Object.freeze(Object.fromEntries(DEEP_CONTENT_COURSES.map(key => [key, new URL(`./deep-game-content/${key}.js`, location).href])) as Record<PilotKey, string>);
  }
  throw new Error("Deep content runtime unavailable");
}

/** Import remains a native variable boundary: no content bank enters the main bundle. */
const nativeImport: NativeImporter = async url => import(/* @vite-ignore */ url);

/** Dependency injection is for private tests; no request can supply an importer or URL. */
export function createDeepCourseRegistry(options: { importModule?: NativeImporter; moduleUrl?: string } = {}): { loadDeepCourse: DeepCourseLoader } {
  const cache = new Map<PilotKey, DeepCoursePackage>();
  const loading = new Map<PilotKey, Promise<DeepCoursePackage>>();
  const importer = options.importModule ?? nativeImport;
  const loadDeepCourse: DeepCourseLoader = async courseKey => {
    if (!isDeepCourseSupported(courseKey)) return null;
    const cached = cache.get(courseKey);
    if (cached) return cached;
    const pending = loading.get(courseKey);
    if (pending) return pending;
    const promise = (async () => {
      try {
        const url = deepContentModuleUrls(options.moduleUrl)[courseKey];
        const loaded = await importer(url);
        const validated = validateDeepCoursePackage(loaded.default, courseKey);
        // Bounded by the fixed allowlist of shipped courses.
        if (cache.size >= DEEP_CONTENT_COURSES.length && !cache.has(courseKey)) throw new Error("Deep cache limit");
        cache.set(courseKey, validated);
        return validated;
      } catch {
        // Do not expose private paths, authored content, or receipt validation details.
        throw new Error("Deep course content is unavailable");
      }
    })();
    loading.set(courseKey, promise);
    try { return await promise; }
    finally { if (loading.get(courseKey) === promise) loading.delete(courseKey); }
  };
  return { loadDeepCourse };
}

const registry = createDeepCourseRegistry();
export const loadDeepCourse = registry.loadDeepCourse;
