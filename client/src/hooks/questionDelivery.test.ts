import { beforeEach, expect, it, vi } from "vitest";
const queries = vi.hoisted(() => ({ questions: vi.fn(), meta: vi.fn(), notes: vi.fn() }));
vi.mock("react", () => ({ useState: (initial: () => unknown) => [initial()] }));
vi.mock("@/lib/trpc", () => ({ trpc: { quiz: {
  getQuestions: { useQuery: queries.questions }, getBankMeta: { useQuery: queries.meta },
  getModuleOverviews: { useQuery: queries.notes },
} } }));
import { useMockExamMetadata, useQuestionBank } from "./useQuestionBank";
beforeEach(() => {
  vi.clearAllMocks();
  queries.questions.mockReturnValue({ data: { questions: [{ id: 1, question: "Authorized server question" }] }, isSuccess: true });
  queries.meta.mockReturnValue({ data: { modules: ["Treatment"], totalQuestions: 500 }, isSuccess: true });
  queries.notes.mockReturnValue({ data: { Treatment: { title: "Current notes" } } });
});
it("refreshes notes on return independently of question loading", () => {
  const result = useQuestionBank("class1-water", "lazy");
  expect(queries.notes).toHaveBeenCalledWith({ bankKey: "class1-water" }, expect.objectContaining({ staleTime: 0, refetchOnMount: "always" }));
  expect(result.overviews?.Treatment.title).toBe("Current notes");
  expect(result.questions).toEqual([]);
  expect(result.totalQuestions).toBe(500);
});
it("hides old question data after a delivery failure instead of falling back to it", () => {
  queries.questions.mockReturnValue({ data: { questions: [{ id: 1 }] }, error: new Error("offline"), isLoading: false });
  const result = useQuestionBank("class1-water");
  expect(result.questions).toEqual([]);
  expect(result.dbUnavailable).toBe(true);
});
it("returns the authorized set and never persists it in a browser question cache", () => {
  const result = useQuestionBank("class1-water");
  expect(result.questions[0].question).toBe("Authorized server question");
  expect(queries.questions).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ gcTime: 0, refetchOnMount: "always" }));
});

it("keeps a mock landing available when optional metadata is absent but the metadata request succeeds", () => {
  queries.meta.mockReturnValue({ data: null, isSuccess: true, isLoading: false });

  const result = useMockExamMetadata("wpi-class4-wastewater");

  expect(result.dbUnavailable).toBe(false);
  expect(result.moduleTargets).toBeNull();
  expect(result.totalQuestions).toBe(0);
  expect(queries.meta).toHaveBeenCalledWith(
    { bankKey: "wpi-class4-wastewater" },
    expect.objectContaining({ staleTime: 60_000, retry: 2, retryDelay: 1500 }),
  );
  expect(queries.questions).not.toHaveBeenCalled();
});

it("keeps actual metadata failures and known-empty mock banks unavailable", () => {
  queries.meta.mockReturnValue({ data: undefined, isSuccess: false, isLoading: false, error: new Error("offline") });
  expect(useMockExamMetadata("class4-wastewater").dbUnavailable).toBe(true);

  queries.meta.mockReturnValue({ data: { modules: [], totalQuestions: 0 }, isSuccess: true, isLoading: false });
  expect(useMockExamMetadata("class4-wastewater").dbUnavailable).toBe(true);
});
