import { getCourseByKey } from "../../shared/courseRegistry";
import {
  deepContentCourseKeys,
  type DeepCoursePackage,
} from "../../shared/deepGames";
import { deepPayloadSha256, validateDeepCoursePackage } from "./schema";

export type DeepCourseKey = DeepCoursePackage["courseKey"];
type NativeImporter = (url: string) => Promise<{ default?: unknown }>;
export type DeepCourseLoader = (courseKey: string) => Promise<DeepCoursePackage | null>;

const isAlias = (courseKey: string): courseKey is "oit-ww" => courseKey === "oit-ww";
const sourceKey = (courseKey: DeepCourseKey): DeepCourseKey => isAlias(courseKey) ? "oit" : courseKey;

export function isDeepCourseSupported(courseKey: string): courseKey is DeepCourseKey {
  if (!deepContentCourseKeys.includes(courseKey as (typeof deepContentCourseKeys)[number])) return false;
  const course = getCourseByKey(courseKey);
  return !!course?.isActive && course.courseKey === courseKey
    && (course.provinceOrRegion === "ontario" || course.provinceOrRegion === "western")
    && (course.examFamily === "ontario" || course.examFamily === "western");
}

function moduleMap(moduleUrl: string): Readonly<Record<DeepCourseKey, string>> {
  const location = new URL(moduleUrl);
  if (location.protocol !== "file:") throw new Error("Deep content runtime unavailable");
  const suffix = location.pathname.endsWith("/server/deepGames/registry.ts")
    ? "./content/"
    : location.pathname.endsWith("/index.js")
      ? "./deep-game-content/"
      : null;
  if (!suffix) throw new Error("Deep content runtime unavailable");
  const entries = Object.fromEntries(deepContentCourseKeys.map((key) => [
    key,
    new URL(`${suffix}${key}.${suffix === "./content/" ? "ts" : "js"}`, location).href,
  ])) as Record<DeepCourseKey, string>;
  entries["oit-ww"] = entries.oit;
  return Object.freeze(entries);
}

export function deepContentModuleUrls(moduleUrl = import.meta.url): Readonly<Record<DeepCourseKey, string>> {
  return moduleMap(moduleUrl);
}

const nativeImport: NativeImporter = async url => import(/* @vite-ignore */ url);

function aliasPackage(data: DeepCoursePackage, courseKey: DeepCourseKey): DeepCoursePackage {
  if (!isAlias(courseKey)) return data;
  const core = { courseKey, version: data.version, tasks: data.tasks, missions: data.missions };
  return validateDeepCoursePackage({
    ...data,
    ...core,
    publication: { ...data.publication, packageSha256: deepPayloadSha256(core) },
  }, courseKey);
}

export function createDeepCourseRegistry(options: { importModule?: NativeImporter; moduleUrl?: string } = {}): { loadDeepCourse: DeepCourseLoader } {
  const cache = new Map<DeepCourseKey, DeepCoursePackage>();
  const loading = new Map<DeepCourseKey, Promise<DeepCoursePackage>>();
  const importer = options.importModule ?? nativeImport;
  const loadDeepCourse: DeepCourseLoader = async requestedKey => {
    if (!isDeepCourseSupported(requestedKey)) return null;
    const courseKey = requestedKey;
    const cached = cache.get(courseKey);
    if (cached) return cached;
    const pending = loading.get(courseKey);
    if (pending) return pending;
    const promise = (async () => {
      try {
        const url = deepContentModuleUrls(options.moduleUrl)[sourceKey(courseKey)];
        const loaded = await importer(url);
        const validated = validateDeepCoursePackage(loaded.default, sourceKey(courseKey));
        const result = aliasPackage(validated, courseKey);
        cache.set(courseKey, result);
        return result;
      } catch {
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
