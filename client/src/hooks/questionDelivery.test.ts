import { beforeEach, expect, it, vi } from "vitest";
const queries = vi.hoisted(() => ({ questions: vi.fn(), meta: vi.fn(), notes: vi.fn() }));
vi.mock("react", () => ({ useState: (initial: () => unknown) => [initial()] }));
vi.mock("@/lib/trpc", () => ({ trpc: { quiz: {
  getQuestions: { useQuery: queries.questions }, getBankMeta: { useQuery: queries.meta },
  getModuleOverviews: { useQuery: queries.notes },
} } }));
import { useQuestionBank } from "./useQuestionBank";
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
