import { expect, test } from "@playwright/test";

for (const scenario of ["retired", "canonical", "empty-valid"] as const) {
  test(`practice topic recovery: ${scenario}`, async ({ page }) => {
    const requestedTopics: Array<string | undefined> = [];
    const topic = scenario === "retired" ? "Retired topic" : "Canonical diagnostic topic";
    await page.route("**/api/trpc/**", async route => {
      const url = new URL(route.request().url());
      const paths = decodeURIComponent(url.pathname.split("/api/trpc/")[1]).split(",");
      const input = JSON.parse(url.searchParams.get("input") ?? "{}");
      const results = paths.map((path, index) => {
        let value: unknown = { success: true };
        if (path === "auth.me" || path === "dashboardAuth.me") value = null;
        else if (path === "stripe.checkAccess") value = { hasAccess: true };
        else if (path === "quiz.getBankMeta") value = { modules: ["Current chapter"], totalQuestions: 1 };
        else if (path === "quiz.getModuleOverviews") value = {};
        else if (path === "quiz.getMissedQuestions") value = { questions: [], total: 0 };
        else if (path === "quiz.getRandomQuestions") {
          const selection = (url.searchParams.has("batch") ? input[index]?.json : input.json) ?? {};
          requestedTopics.push(selection.topic);
          const unavailable = selection.topic === "Retired topic";
          const empty = unavailable || scenario === "empty-valid";
          value = { questions: empty ? [] : [{ id: 991, module: "Current chapter", topic: "Canonical diagnostic topic", difficulty: "medium", question: "Canonical topic practice question", options: ["A", "B", "C", "D"], correctIndex: 0, explanation: "Reviewed answer", isCalc: false }], total: empty ? 0 : 1, hasMore: false, locked: false, topicUnavailable: unavailable };
        }
        return { result: { data: { json: value } } };
      });
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(url.searchParams.has("batch") ? results : results[0]) });
    });
    await page.goto(`/class3-water-dist?topic=${encodeURIComponent(topic)}${scenario === "empty-valid" ? "&calcOnly=true" : ""}`);
    if (scenario === "empty-valid") {
      await expect(page.getByRole("status").filter({ hasText: "No questions are available" })).toBeVisible();
      expect(requestedTopics).toEqual([topic]);
    } else {
      await expect(page.getByTestId("practice-question")).toHaveAttribute("data-question-id", "991");
      expect(requestedTopics).toEqual(scenario === "retired" ? [topic, undefined] : [topic]);
    }
  });
}
