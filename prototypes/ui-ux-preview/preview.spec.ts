import { expect, test } from "@playwright/test";
import { course } from "./fixtures";
import { pathToFileURL } from "node:url";

test("real homepage keeps the approved branding and both free OIT entry points on a phone", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#/homepage");
  await expect(page.getByRole("heading",{name:"Pass Your Operator Exam. Advance Your Career."})).toBeVisible();
  await expect.poll(() => page.locator(".echelon-brand img").evaluate((image: HTMLImageElement) => image.naturalWidth > 0)).toBe(true);
  await page.getByRole("button", {name:"Open navigation menu", exact:true}).click();
  await expect(page.locator(".echelon-mobile-links").getByRole("link", {name:"Jobs", exact:true})).toHaveAttribute("href", "/jobs");
  await expect(page.locator(".echelon-mobile-links").getByRole("link", {name:"Blog", exact:true})).toHaveAttribute("href", "/blog");
  await page.getByRole("button", {name:"Close navigation menu", exact:true}).first().click();
  await page.getByRole("button",{name:"Try 15 OIT Questions Free →",exact:true}).click();
  await expect(page.locator("#oit-preview-choice").getByRole("link",{name:/Water OIT Recommended/})).toHaveAttribute("href",/^#?\/quiz$/);
  await expect(page.locator("#oit-preview-choice").getByRole("link",{name:/Wastewater OIT Start free/})).toHaveAttribute("href",/^#?\/oit-ww$/);
  await expect(page.getByRole("link",{name:"Find my course →",exact:true})).toHaveCount(0);
  await expect(page.locator("#find-course").getByRole("heading",{name:"Find your course",exact:true})).toBeVisible();
  await expect(page.locator("#find-course").getByLabel("1. Province")).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:"test-results/ui-workspace/homepage-mobile.png",fullPage:true});
});

test("Jobs and Blog stay directly accessible in public and learning desktop navigation", async ({page}) => {
  await page.setViewportSize({width:1280,height:844});
  for (const route of ["/homepage", "/class1-water"]) {
    await page.goto(`/#${route}`);
    for (const {label, href} of [{label:"Jobs", href:/^#?\/jobs$/}, {label:"Blog", href:/^#?\/blog$/}]) {
      const link = page.locator(".echelon-desktop-links").getByRole("link", {name:label, exact:true});
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
    }
  }
});

test("restored navigation keeps account controls on screen on a narrow laptop", async ({page}) => {
  await page.setViewportSize({width:1100,height:844});
  await page.goto("/#/homepage");
  const trigger = page.getByRole("button", {name:"Open navigation menu", exact:true});
  await expect(trigger).toBeVisible();
  expect(await page.locator(".echelon-nav-actions").evaluate(element => element.getBoundingClientRect().right <= window.innerWidth)).toBe(true);
  await trigger.click();
  for (const name of ["Jobs", "Blog"]) {
    await expect(page.locator(".echelon-mobile-links").getByRole("link", {name, exact:true})).toBeVisible();
  }
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
  await expect(page.getByLabel("2. System").locator('option[value="water-distribution"]')).toHaveText("Water distribution and supply");
  await page.getByLabel("2. System").selectOption("water-distribution");
  await page.getByLabel("3. Level").selectOption("class3-water-dist");
  await expect(page.locator(".course-finder-result")).toContainText("Class 3 Water Distribution and Supply");
  await expect(page.getByRole("link", {name:"Try this course"})).toHaveAttribute("href", "/class3-water-dist");
  await page.getByLabel("1. Province").selectOption("mb");
  await expect(page.getByLabel("2. System").locator('option[value="water-distribution"]')).toHaveText("Water distribution");
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
  const coursePassProgress=page.getByRole("table",{name:"Course Pass study progress"});
  await expect(coursePassProgress).toBeVisible();
  await expect(coursePassProgress.getByRole("row").filter({hasText:"taylor@example.test"})).toContainText("100");
  await expect(coursePassProgress.getByRole("row").filter({hasText:"taylor@example.test"})).toContainText("73%");
  await expect(page.getByRole("heading",{name:"Your operators"})).toHaveCount(0);
  await page.getByRole("button",{name:"Operators and access",exact:true}).click();
  await expect(coursePassProgress).toBeHidden();
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

for (const width of [390, 720, 760, 1280]) {
  test(`CEU rendered headers leave lesson controls accessible at ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height:844});
    await page.goto(`/#/continuing-education/${course.key}`);
    // Remove only the fixture review toolbar, not application shell elements.
    await page.addStyleTag({content:".preview-review-bar, .preview-ceu-tools { display:none; }"});
    const context = page.getByRole("region", {name:"Continuing education course workspace"});
    const siteHeader = page.locator(".ceu-screen > .echelon-site-header");
    await expect(siteHeader).toBeVisible();
    await expect.poll(async () => context.evaluate(element => {
      const header = element.parentElement!.querySelector(".echelon-site-header")!;
      return Math.abs(element.getBoundingClientRect().top - header.getBoundingClientRect().bottom) < 1;
    })).toBe(true);

    await page.getByRole("button", {name:"Continue learning"}).click();
    await expect(siteHeader).toHaveCount(0);
    await expect.poll(() => context.evaluate(element => element.getBoundingClientRect().top)).toBe(0);
    if (width <= 760) {
      const trigger = page.getByRole("button", {name:"Course modules", exact:true});
      await expect(trigger).toBeVisible();
      expect(await trigger.evaluate(element => {
        const rect = element.getBoundingClientRect();
        const header = document.querySelector(".ceu-course-context")!.getBoundingClientRect();
        return rect.top >= header.bottom && element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
      })).toBe(true);
      await trigger.click();
      const drawer = page.getByRole("complementary", {name:"Course progress"});
      await expect(drawer).toHaveClass(/is-open/);
      await expect.poll(() => drawer.evaluate(element => {
        const header = document.querySelector(".ceu-course-context")!.getBoundingClientRect();
        return Math.abs(element.getBoundingClientRect().top - header.bottom) < 1;
      })).toBe(true);
      // Resize the real context to exercise wrapped text/status clearance.
      await context.locator(".ceu-course-context-inner").evaluate(element => {
        (element as HTMLElement).style.paddingBlock = "24px";
      });
      await expect.poll(() => drawer.evaluate(element => {
        const header = document.querySelector(".ceu-course-context")!.getBoundingClientRect();
        return Math.abs(element.getBoundingClientRect().top - header.bottom) < 1;
      })).toBe(true);
      await drawer.locator(".ceu-sidebar-module > button").first().click();
      await expect(drawer).not.toHaveClass(/is-open/);
    }
    await page.evaluate(() => window.scrollTo(0, 320));
    await expect.poll(() => context.evaluate(element => element.getBoundingClientRect().top)).toBe(0);
    await page.getByRole("button", {name:"Course overview", exact:true}).click();
    await expect(siteHeader).toBeVisible();
    await expect.poll(async () => context.evaluate(element => {
      const header = element.parentElement!.querySelector(".echelon-site-header")!;
      return element.getBoundingClientRect().top >= header.getBoundingClientRect().bottom - 1;
    })).toBe(true);
  });
}

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

test("flashcard options retain module filters, shuffle and learning decisions", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#/flashcards");
  const options=page.locator(".fc-options");
  await expect(page.getByTestId("flashcard-study-card")).toBeVisible();
  await expect(options).not.toHaveAttribute("open", "");
  await options.locator("summary").click();
  await page.getByRole("button", {name:"Sedimentation",exact:true}).click();
  await expect(page.getByTestId("flashcard-prompt")).toContainText("clarifier");
  await page.getByRole("button", {name:"Shuffle",exact:true}).click();
  await expect(page.getByTestId("flashcard-prompt")).toContainText("clarifier");
  await options.locator("summary").click();
  await page.getByRole("button", {name:"Reveal answer",exact:true}).click();
  await expect(page.getByRole("button", {name:"Still Learning",exact:true})).toBeVisible();
  await expect(page.getByRole("button", {name:"Got It!",exact:true})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:"test-results/ui-workspace/flashcards-mobile.png",fullPage:true});
});

test("formula and account screens retain their original functions and shared type", async ({page}) => {
  await page.goto("/#/formulas-water1");
  await expect(page.getByRole("heading", {name:/Class 1 Water Treatment/})).toBeVisible();
  await page.getByPlaceholder("Search formulas, variables, or topics…").fill("CT Value");
  await expect(page.getByText("CT (mg·min/L) = C (mg/L) × T (min)", {exact:false})).toBeVisible();
  await expect(page.getByText("Turbidity Removal Efficiency", {exact:true})).toHaveCount(0);
  await page.getByRole("button", {name:"Account",exact:true}).first().click();
  await expect(page.getByRole("heading", {name:"My Account",exact:true})).toBeVisible();
  await expect(page.locator(".account-page")).toHaveCSS("font-family", /Sora/);
});

test("admin keeps all fourteen sections and a keyboard-accessible mobile drawer", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#/admin");
  await expect(page.locator("#admin-founder-title")).toBeVisible();
  await expect(page.locator("#admin-founder-title")).toHaveCSS("font-family", /Sora/);
  await expect(page.locator(".admin-portal")).toHaveCSS("background-color", "rgb(244, 247, 251)");
  await expect(page.locator(".admin-ledger-table")).toContainText("CA$1980.00");
  const trigger=page.getByRole("button", {name:"Open navigation",exact:true});
  await trigger.click();
  const drawer=page.getByRole("dialog", {name:"Echelon administration navigation"});
  await expect(drawer).toBeVisible();
  await expect(drawer.locator(".admin-sidebar-button")).toHaveCount(14);
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator(".admin-sidebar-button").filter({hasText:"Feedback"}).click();
  await expect(page.getByRole("heading", {name:"Feedback",exact:true})).toBeVisible();
  await expect(page.locator(".admin-sidebar")).toHaveAttribute("inert", "");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:"test-results/ui-workspace/admin-mobile.png",fullPage:true});
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
