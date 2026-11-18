import new3 from "../../server/ceu/courses/ceu-supervisor-essentials.json" with { type: "json" };
import new2 from "../../server/ceu/courses/ceu-water-distribution-overview.json" with { type: "json" };
import new1 from "../../server/ceu/courses/ceu-basic-instrumentation.json" with { type: "json" };
import new0 from "../../server/ceu/courses/ceu-chlorination-principles.json" with { type: "json" };
import { CEU_COURSES } from "../../shared/ceuCourses";
import { expect, test } from "./mediaFixture";
import math from "../../server/ceu/courses/ceu-basic-math.json" with { type: "json" };
import hydraulics from "../../server/ceu/courses/ceu-basic-hydraulics.json" with { type: "json" };
import safety from "../../server/ceu/courses/ceu-basic-safety.json" with { type: "json" };
import { ceuModuleSlides } from "../../shared/ceuSlides";

for (const course of [math, hydraulics, safety, new0, new1, new2, new3]) {
  test(`${course.key}: actual overview, every lesson slide, diagrams, images and sample quiz`, async ({ page }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/#/continuing-education/${course.key}?previewAnonymous=1`);
    await expect(page.getByRole("heading", { name: course.title, exact: true })).toBeVisible();
    const cover = page.locator(".ceu-overview-cover");
    await expect(cover).toBeVisible();
    await expect.poll(() => cover.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await page.screenshot({ path: `test-results/ui-workspace/${course.key}-overview.png`, fullPage: true });
    await page.getByRole("button", { name: "Open all lessons", exact: true }).click();
    let diagramCount = 0;
    let illustrationCount = 0;
    for (const module of course.modules) {
      await page.locator(".ceu-sidebar-module > button").filter({ hasText: module.title }).click();
      const slides = ceuModuleSlides(module);
      for (let index = 0; index < slides.length; index++) {
        const slide = slides[index];
        await page.locator(".ceu-sidebar-module ol button").nth(index).click();
        await expect(page.locator(".ceu-lesson-card > h1")).toHaveText(slide.title);
        const expectedDiagrams = (slide.body.match(/<svg\b/g) ?? []).length;
        await expect(page.locator(".ceu-reading svg")).toHaveCount(expectedDiagrams);
        diagramCount += expectedDiagrams;
        if (expectedDiagrams) {
          await expect(page.locator(".ceu-reading svg").first()).toBeVisible();
          await expect(page.locator(".ceu-reading svg text").first()).toBeVisible();
          expect(await page.locator(".ceu-reading svg").first().evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThan(20);
          await expect(page.locator(".ceu-reading script, .ceu-reading foreignObject")).toHaveCount(0);
        }
        const lessonImages = page.locator(".ceu-reading img");
        for (const image of await lessonImages.all()) {
          await expect(image).toBeVisible();
          await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
        }
        const pictures = page.locator(".ceu-safety-illustration");
        if (await pictures.count()) {
          illustrationCount++;
          await expect.poll(() => pictures.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
        }
        if (slide.kind === "quick_check") {
          for (const check of module.checks) await expect(page.getByRole("heading", { name: check.prompt, exact: true })).toBeVisible();
        }
      }
      await page.screenshot({ path: `test-results/ui-workspace/${course.key}-${module.id}-lesson.png`, fullPage: true });
    }
    expect(diagramCount).toBe(course.modules.reduce((sum, module) => sum + (module.lesson.match(/<svg\b/g) ?? []).length, 0));
    if (course.key === "ceu-basic-safety") expect(illustrationCount).toBe(4);
    await page.locator(".ceu-sidebar-final").click();
    await expect(page.locator(".ceu-exam-question-card h1")).toBeVisible();
    await expect(page.locator(".ceu-exam-question-card")).toContainText("Read-only inspection");
    await expect(page.locator(".ceu-exam-question-card").getByRole("radio")).toHaveCount(4);
    for (const radio of await page.locator(".ceu-exam-question-card").getByRole("radio").all()) await expect(radio).toBeDisabled();
    await expect(page.locator(".ceu-exam-question-card")).not.toContainText("undefined");
    await page.screenshot({ path: `test-results/ui-workspace/${course.key}-quiz.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test("catalog has all registered courses and working cover images", async ({ page }) => {
  await page.goto("/#/continuing-education");
  await expect(page.getByRole("link", { name: "Open pilot course", exact: true })).toHaveCount(CEU_COURSES.length);
  for (const course of CEU_COURSES) {
    await expect(page.getByRole("heading", { name: course.title, exact: true })).toBeVisible();
  }
  await expect(page.locator(".ceu-course-cover")).toHaveCount(CEU_COURSES.filter(course => course.cover).length);
  for (const image of await page.locator(".ceu-course-cover").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  }
  await page.screenshot({ path: "test-results/ui-workspace/foundation-catalog.png", fullPage: true });
});
