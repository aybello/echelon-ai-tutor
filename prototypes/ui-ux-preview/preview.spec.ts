import { expect, test } from "@playwright/test";
import { course } from "./fixtures";
import { pathToFileURL } from "node:url";

test("real homepage keeps the approved branding and both free OIT entry points on a phone", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#/homepage");
  await expect(page.getByRole("heading",{name:"Confidence starts with understanding."})).toBeVisible();
  await expect.poll(() => page.locator(".echelon-brand img").evaluate((image: HTMLImageElement) => image.naturalWidth > 0)).toBe(true);
  await page.getByRole("button",{name:"Try 15 OIT Questions Free →",exact:true}).click();
  await expect(page.locator("#oit-preview-choice").getByRole("link",{name:/Water OIT Recommended/})).toHaveAttribute("href",/^#?\/quiz$/);
  await expect(page.locator("#oit-preview-choice").getByRole("link",{name:/Wastewater OIT Start free/})).toHaveAttribute("href",/^#?\/oit-ww$/);
  await page.getByRole("link",{name:"Find my course →",exact:true}).click();
  await expect(page.locator("#find-course")).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:"test-results/ui-workspace/homepage-mobile.png",fullPage:true});
});

test("finder keeps province, system and level aligned, and resets dependent choices", async ({page}) => {
  await page.goto("/");
  await page.getByLabel("1. Province").selectOption("mb");
  await page.getByLabel("2. System").selectOption("wastewater-collection");
  await page.getByLabel("3. Level").selectOption("wpi-class4-water-coll");
  await expect(page.getByRole("link",{name:"Try this course"})).toHaveAttribute("href","/wpi-class4-water-coll");
  await page.getByLabel("1. Province").selectOption("on");
  await expect(page.getByLabel("2. System")).toHaveValue("");
  await expect(page.getByLabel("3. Level")).toBeDisabled();
  await page.screenshot({path:"test-results/ui-workspace/course-finder.png",fullPage:true});
});

test("practice accepts an answer without confidence and filters the actual sample pool", async ({page}) => {
  await page.goto("/#/class1-water");
  await expect(page.getByRole("button",{name:"Confirm Answer"})).toBeDisabled();
  const answer=page.getByRole("button").filter({hasText:"Run jar tests using"});
  await expect(page.locator(".qs-question-card")).toBeVisible();
  await page.locator(".practice-options summary").click();
  await page.getByRole("combobox", {name:"Module", exact:true}).selectOption("Coagulation & Flocculation");
  await page.locator(".practice-options summary").click();
  await answer.click();
  await expect(page.getByRole("button",{name:"Confirm Answer"})).toBeEnabled();
  await page.getByRole("button",{name:"Confirm Answer"}).click();
  await expect(page.getByText("Jar tests help compare doses",{exact:false})).toBeVisible();
  await expect(page.getByRole("button",{name:"Read topic notes"})).toBeVisible();
  await page.getByRole("button",{name:"Read topic notes"}).click();
  await expect(page.getByText("Review pH, alkalinity and the plant's response",{exact:false})).toBeVisible();
  await page.screenshot({path:"test-results/ui-workspace/practice-notes.png",fullPage:true});
});

test("learner gets one primary step with charts in Progress", async ({page}) => {
  await page.goto("/#/dashboard");
  await expect(page.getByRole("region",{name:"Your next study step"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Continue studying"})).toHaveAttribute("href",/class1-water/);
  await expect(page.getByRole("region",{name:"Study activity and history"})).toHaveCount(0);
  await page.screenshot({path:"test-results/ui-workspace/learner-dashboard.png",fullPage:true});
  await page.getByRole("button",{name:"Progress and history",exact:true}).click();
  await expect(page.getByRole("region",{name:"Study activity and history"})).toBeVisible();
});

test("manager can find a learner and inspect study details without a second active table", async ({page}) => {
  await page.goto("/#/team");
  await expect(page.getByRole("heading",{name:"Your operators"})).toBeVisible();
  expect(await page.locator(".manager-workspace main > .grid").first().evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(4);
  await expect(page.locator(".manager-roster").getByText("Assigned · not started",{exact:true})).toBeVisible();
  await page.getByLabel("Find an operator").fill("Lee");
  await expect(page.locator(".manager-roster tbody tr")).toHaveCount(1);
  await expect(page.locator(".manager-roster tbody")).toContainText("Lee Morgan");
  await page.getByLabel("Find an operator").fill("");
  await page.locator(".manager-roster tbody tr").filter({hasText:"Jordan Mercer"}).locator("summary").click();
  await expect(page.getByText("Recent mocks: 73%",{exact:false})).toBeVisible();
  await page.screenshot({path:"test-results/ui-workspace/manager-dashboard.png",fullPage:true});
  await page.getByRole("button",{name:"Reports and outcomes",exact:true}).click();
  await expect(page.locator(".team-outcomes-report")).toBeVisible();
  await expect(page.getByRole("heading",{name:"Your operators"})).toHaveCount(0);
});

test("CEU remains a self-paced lesson, final exam and certificate flow", async ({page}) => {
  await page.goto(`/#/continuing-education/${course.key}`);
  await expect(page.getByRole("button",{name:"Continue learning"})).toBeVisible();
  await page.screenshot({path:"test-results/ui-workspace/ceu-overview.png",fullPage:true});
  await page.getByRole("button",{name:"Continue learning"}).click();
  await expect(page.getByText("Slide 1 of",{exact:false})).toBeVisible();
  await page.getByRole("button",{name:"Next",exact:true}).click();
  await expect(page.getByText("Slide 2 of",{exact:false})).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Progress saved");
  await page.getByRole("button",{name:"Course overview",exact:true}).click();
  await page.getByRole("button",{name:"Continue learning"}).click();
  await expect(page.getByText("Slide 2 of",{exact:false})).toBeVisible();
  await page.screenshot({path:"test-results/ui-workspace/ceu-lesson.png",fullPage:true});
});

test("active mock fits a phone and question navigation is available", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#/mock");
  await page.getByRole("button",{name:/Start Exam/}).click();
  await expect(page.locator(".mes-active-grid")).toBeVisible();
  await expect(page.locator(".mes-navigator")).not.toHaveAttribute("open","");
  await page.locator(".mes-navigator summary").click();
  await page.getByRole("button",{name:"Question 5, unanswered",exact:true}).click();
  await expect(page.locator(".mes-navigator")).not.toHaveAttribute("open","");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:"test-results/ui-workspace/mock-mobile.png",fullPage:true});
});

test("mobile manager and practice have no horizontal overflow", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#/team");
  await expect(page.locator(".manager-roster tbody tr")).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:"test-results/ui-workspace/manager-mobile.png",fullPage:true});
  await page.getByRole("button",{name:"Practice",exact:true}).first().click();
  await expect(page.locator(".qs-question-card")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:"test-results/ui-workspace/practice-mobile.png",fullPage:true});
});

test("quiz settings contain keyboard focus and return it on Escape", async ({page}) => {
  await page.goto("/#/class1-water");
  await page.locator(".practice-options summary").click();
  const opener = page.getByRole("button", {name:"Quiz Settings"});
  await opener.click();
  const dialog = page.getByRole("dialog", {name:"Quiz Settings"});
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", {name:"Close Quiz Settings"})).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", {name:"Close Quiz Settings"})).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("CEU final saves answers, shows results and presents the certificate", async ({page}) => {
  await page.goto(`/#/continuing-education/${course.key}`);
  await page.getByRole("button", {name:"Preview final exam with completed sample modules"}).click();
  await expect(page.getByText(`${course.modules.length} of ${course.modules.length} modules done`, {exact:true})).toBeVisible();
  await page.getByRole("button", {name:"Final exam", exact:true}).click();
  for (const [index, question] of course.finalAssessment.entries()) {
    await page.getByRole("radio", {name:question.choices[question.correctIndex], exact:true}).check();
    await expect(page.getByRole("status")).toContainText("Answers saved");
    if (index < course.finalAssessment.length - 1) await page.getByRole("button", {name:"Next question", exact:true}).click();
  }
  await page.screenshot({path:"test-results/ui-workspace/ceu-exam.png",fullPage:true});
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", {name:"Submit exam",exact:true}).click();
  await expect(page.getByRole("heading", {name:"You have completed the course."})).toBeVisible();
  await page.screenshot({path:"test-results/ui-workspace/ceu-results.png",fullPage:true});
  await page.getByRole("button", {name:"View certificate",exact:true}).click();
  await expect(page.locator("#ceu-certificate")).toContainText("Jordan Mercer");
  await expect(page.locator("#ceu-certificate")).toContainText("does not award CEUs");
  await page.screenshot({path:"test-results/ui-workspace/ceu-certificate.png",fullPage:true});
});

test("downloaded HTML works offline with the same styled screens", async ({page,context}) => {
  test.skip(!process.env.UI_PREVIEW_HTML, "Build the single-file review artifact first.");
  await context.setOffline(true);
  await page.goto(pathToFileURL(process.env.UI_PREVIEW_HTML!).href);
  await expect(page.getByRole("heading", {name:"Find your course"})).toBeVisible();
  await page.getByRole("button", {name:"Manager dashboard",exact:true}).click();
  await expect(page.getByRole("heading", {name:"Your operators"})).toBeVisible();
  expect(await page.locator(".manager-workspace main > .grid").first().evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(4);
  await page.getByRole("button", {name:"Practice",exact:true}).first().click();
  await expect(page.locator(".qs-question-card")).toBeVisible();
});
