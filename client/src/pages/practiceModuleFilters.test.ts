import React from "react";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ModuleConfig } from "@/components/QuizShell";

const mocks = vi.hoisted(() => ({ bank: vi.fn(), session: vi.fn(), select: vi.fn() }));
vi.mock("@/hooks/useQuestionBank", () => ({ useQuestionBank: mocks.bank }));
vi.mock("@/hooks/useQuizSession", () => ({ useQuizSession: mocks.session }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("@/components/QuizShell", () => ({ default: () => null }));
vi.mock("@/components/AITutor", () => ({ default: () => null }));
vi.mock("@/components/QuizGate", () => ({ default: () => null }));
vi.mock("@/components/QuizModeBar", () => ({ default: () => null }));
vi.mock("@/components/QuizSettingsDrawer", () => ({ default: () => null }));
vi.mock("@/components/QuizSkeleton", () => ({ default: () => null }));

import Class1WaterQuiz from "./Class1WaterQuiz";
import Class2WaterQuiz from "./Class2WaterQuiz";
import Class3WaterQuiz from "./Class3WaterQuiz";
import Class4WaterQuiz from "./Class4WaterQuiz";
import Home from "./Home";

// Vitest's Node transform uses classic JSX; production Vite uses automatic JSX.
vi.stubGlobal("React", React);
afterAll(() => vi.unstubAllGlobals());

beforeEach(() => {
  vi.clearAllMocks();
  mocks.bank.mockReturnValue({ questions: [], modules: ["Water Treatment", "Current imported module"],
    totalQuestions: 805, isLoading: false, dbUnavailable: false });
  mocks.session.mockReturnValue({ history: [], quizSettings: {}, initialized: true,
    handleModuleChange: mocks.select, trialUnlocked: true });
});

describe.each([
  ["Class 1 Water", Class1WaterQuiz], ["Class 2 Water", Class2WaterQuiz],
  ["Class 3 Water", Class3WaterQuiz], ["Class 4 Water", Class4WaterQuiz], ["OIT Water", Home],
] as const)("%s module selection", (_label, Page) => {
  it("offers current bank categories instead of obsolete topic buttons", () => {
    const screen = Page();
    expect(screen.props.modules.map((module: ModuleConfig) => module.name))
      .toEqual(["Water Treatment", "Current imported module"]);
    screen.props.onModuleChange(screen.props.modules[0].name);
    expect(mocks.select).toHaveBeenCalledWith("Water Treatment");
  });

  it("does not replace an empty server list with hard-coded categories", () => {
    mocks.bank.mockReturnValue({ questions: [], modules: [], totalQuestions: 0,
      isLoading: false, dbUnavailable: true });
    expect(Page().props.dbUnavailable).toBe(true);
  });
});
