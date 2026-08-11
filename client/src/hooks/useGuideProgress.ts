import { useCallback, useEffect, useMemo, useState } from "react";
import type { GuideId, GuideJurisdiction, GuideLevel } from "@/lib/guideRegistry";

const STORAGE_KEY = "echelon_process_guides_v1";
const CHANGE_EVENT = "echelon:guide-progress";

export interface GuideProgressRecord {
  viewedStepIds: string[];
  completedStepIds: string[];
  bookmarkedStepIds: string[];
  lastStepId: string | null;
  lastVisitedAt: string | null;
}

interface GuideProgressStore {
  version: 1;
  preferences: {
    jurisdiction: GuideJurisdiction;
    level: GuideLevel;
  };
  guides: Partial<Record<GuideId, GuideProgressRecord>>;
}

const EMPTY_RECORD: GuideProgressRecord = {
  viewedStepIds: [],
  completedStepIds: [],
  bookmarkedStepIds: [],
  lastStepId: null,
  lastVisitedAt: null,
};

const DEFAULT_STORE: GuideProgressStore = {
  version: 1,
  preferences: { jurisdiction: "ontario", level: "1" },
  guides: {},
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function normalizeRecord(value: Partial<GuideProgressRecord> | undefined): GuideProgressRecord {
  return {
    viewedStepIds: unique(value?.viewedStepIds ?? []),
    completedStepIds: unique(value?.completedStepIds ?? []),
    bookmarkedStepIds: unique(value?.bookmarkedStepIds ?? []),
    lastStepId: value?.lastStepId ?? null,
    lastVisitedAt: value?.lastVisitedAt ?? null,
  };
}

export function readGuideProgressStore(): GuideProgressStore {
  if (typeof window === "undefined") return DEFAULT_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORE;
    const parsed = JSON.parse(raw) as Partial<GuideProgressStore>;
    return {
      version: 1,
      preferences: {
        jurisdiction: parsed.preferences?.jurisdiction === "wpi" ? "wpi" : "ontario",
        level: ["oit", "1", "2", "3", "4"].includes(parsed.preferences?.level ?? "")
          ? parsed.preferences!.level
          : "1",
      },
      guides: parsed.guides ?? {},
    };
  } catch {
    return DEFAULT_STORE;
  }
}

function writeGuideProgressStore(store: GuideProgressStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // Progress is an enhancement. The guide remains usable when storage is blocked.
  }
}

export function getGuideResumeStep(guideId: GuideId, validStepIds: string[]): string | null {
  const lastStepId = readGuideProgressStore().guides[guideId]?.lastStepId;
  return lastStepId && validStepIds.includes(lastStepId) ? lastStepId : null;
}

export function shouldResumeGuide(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("resume") === "1";
}

export function useGuideOverview() {
  const [store, setStore] = useState<GuideProgressStore>(() => readGuideProgressStore());

  useEffect(() => {
    const refresh = () => setStore(readGuideProgressStore());
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return store;
}

export function useGuideProgress(guideId: GuideId, totalSteps: number, currentStepId?: string) {
  const [store, setStore] = useState<GuideProgressStore>(() => readGuideProgressStore());

  const persist = useCallback((next: GuideProgressStore) => {
    setStore(next);
    writeGuideProgressStore(next);
  }, []);

  useEffect(() => {
    if (!currentStepId) return;
    const latest = readGuideProgressStore();
    const current = normalizeRecord(latest.guides[guideId]);
    const nextRecord: GuideProgressRecord = {
      ...current,
      viewedStepIds: unique([...current.viewedStepIds, currentStepId]),
      lastStepId: currentStepId,
      lastVisitedAt: new Date().toISOString(),
    };
    const changed = current.lastStepId !== currentStepId || !current.viewedStepIds.includes(currentStepId);
    if (changed) persist({ ...latest, guides: { ...latest.guides, [guideId]: nextRecord } });
  }, [currentStepId, guideId, persist]);

  useEffect(() => {
    const refresh = () => setStore(readGuideProgressStore());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const record = normalizeRecord(store.guides[guideId]);
  const progressPercent = totalSteps > 0
    ? Math.round((record.completedStepIds.length / totalSteps) * 100)
    : 0;

  const updateRecord = useCallback((updater: (record: GuideProgressRecord) => GuideProgressRecord) => {
    const latest = readGuideProgressStore();
    const current = normalizeRecord(latest.guides[guideId]);
    persist({ ...latest, guides: { ...latest.guides, [guideId]: updater(current) } });
  }, [guideId, persist]);

  const toggleComplete = useCallback((stepId: string) => {
    updateRecord((current) => ({
      ...current,
      completedStepIds: current.completedStepIds.includes(stepId)
        ? current.completedStepIds.filter((id) => id !== stepId)
        : unique([...current.completedStepIds, stepId]),
    }));
  }, [updateRecord]);

  const toggleBookmark = useCallback((stepId: string) => {
    updateRecord((current) => ({
      ...current,
      bookmarkedStepIds: current.bookmarkedStepIds.includes(stepId)
        ? current.bookmarkedStepIds.filter((id) => id !== stepId)
        : unique([...current.bookmarkedStepIds, stepId]),
    }));
  }, [updateRecord]);

  const setJurisdiction = useCallback((jurisdiction: GuideJurisdiction) => {
    const latest = readGuideProgressStore();
    const level = jurisdiction === "wpi" && latest.preferences.level === "oit"
      ? "1"
      : latest.preferences.level;
    persist({ ...latest, preferences: { jurisdiction, level } });
  }, [persist]);

  const setLevel = useCallback((level: GuideLevel) => {
    const latest = readGuideProgressStore();
    persist({ ...latest, preferences: { ...latest.preferences, level } });
  }, [persist]);

  return useMemo(() => ({
    record,
    progressPercent,
    preferences: store.preferences,
    isCurrentComplete: currentStepId ? record.completedStepIds.includes(currentStepId) : false,
    isCurrentBookmarked: currentStepId ? record.bookmarkedStepIds.includes(currentStepId) : false,
    toggleComplete,
    toggleBookmark,
    setJurisdiction,
    setLevel,
  }), [
    currentStepId,
    progressPercent,
    record,
    setJurisdiction,
    setLevel,
    store.preferences,
    toggleBookmark,
    toggleComplete,
  ]);
}
