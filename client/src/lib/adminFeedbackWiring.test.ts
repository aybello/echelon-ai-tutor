import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// These are source-contract checks, not browser/component interaction coverage.
// Backend paging and filtering are exercised separately through the real router.
const source = readFileSync(new URL("../pages/Admin.tsx", import.meta.url), "utf8");
const feedback = source.slice(source.indexOf("{/* -- FEEDBACK TAB -- */}"), source.indexOf("{/* -- QUESTION GOVERNANCE TAB -- */}"));

describe("feedback UI source contract (not browser coverage)", () => {
  it("sends feedback page and rating state to the feedback query only", () => {
    expect(source).toContain('const [feedbackPage, setFeedbackPage] = useState(1)');
    expect(source).toContain('const [feedbackRating, setFeedbackRating] = useState<"all" | "low">("all")');
    expect(source).toContain('trpc.admin.getFeedback.useQuery({ limit: 200, page: feedbackPage, rating: feedbackRating }');
  });
  it("labels the rating select and resets paging when the filter changes", () => {
    expect(feedback).toContain('<label htmlFor="feedback-rating">Ratings</label>');
    expect(feedback).toMatch(/<select id="feedback-rating"[\s\S]*?setFeedbackRating\([\s\S]*?setFeedbackPage\(1\)/);
    expect(feedback).toContain('Low ratings (2 or below)');
  });
  it("labels navigation and declares loading, boundary and error guards", () => {
    expect(feedback).toContain('aria-label="Feedback pagination"');
    expect(feedback).toContain('disabled={feedbackPage === 1 || feedbackQ.isFetching}');
    expect(feedback).toContain('Math.max(1, page - 1)');
    expect(feedback).toContain('feedbackQ.data?.length !== 200');
    expect(feedback).toContain('!!feedbackQ.error');
    expect(feedback).toContain('setFeedbackPage(page => page + 1)');
    expect(feedback).toContain('aria-live="polite"');
  });
  it("calls the CSV a page export and distinguishes errors from an empty page", () => {
    expect(feedback).toContain('Export page CSV');
    expect(feedback).toContain('entries on this page');
    expect(feedback).toContain('downloadCSV(feedbackQ.data!.map');
    expect(feedback).toContain('Feedback could not be loaded. Use Refresh to try again.');
    expect(feedback).toContain('No feedback on this page for the selected ratings.');
    expect(feedback).not.toContain('No feedback yet.');
  });
});
