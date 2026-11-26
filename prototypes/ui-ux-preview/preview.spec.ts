import { expect, test } from "./mediaFixture";
import { course } from "./fixtures";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

test("homepage managed organization logos all load offline on phone, tablet and desktop", async ({page}) => {
  const organizations = JSON.parse(await readFile(new URL("../../client/src/lib/trustedOrganizations.json", import.meta.url), "utf8"));
  for (const width of [320, 390, 820, 1440]) {
    await page.setViewportSize({width, height:844});
    await page.goto("/#/homepage");
    const originals = page.locator('.trusted-organizations-list:not([aria-hidden])');
    const clone = page.locator('.trusted-organizations-list[aria-hidden="true"]');
    await expect(originals.locator("li")).toHaveCount(4);
    await expect(originals.locator("img")).toHaveCount(4);
    await expect(page.locator(".trusted-organizations").getByRole("img")).toHaveCount(4);
    await expect(clone).toHaveAttribute("role", "presentation");
    await expect(clone.locator("li")).toHaveCount(4);
    await expect(clone.locator("a, button, [tabindex]")).toHaveCount(0);
    await expect(clone).toBeHidden();
    for (const organization of organizations) {
      expect(organization.logoDisplayAllowed).toBe(true);
      const image = page.getByRole("img", {name:`${organization.name} logo`, exact:true});
      await expect(image).toHaveAttribute("src", organization.runtimeUrl);
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("customer logo motion is seamless, pausable and static for reduced motion with BEA absent", async ({page}) => {
  test.setTimeout(60000);
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.setViewportSize({width:1440, height:844});
  await page.goto("/#/homepage");
  const customers = page.locator(".trusted-organizations-customers");
  const original = page.locator('.trusted-organizations-list:not([aria-hidden])');
  const clone = page.locator('.trusted-organizations-list[aria-hidden="true"]');
  const pause = page.getByRole("button", {name:"Pause logo animation", exact:true});
  await expect(pause).toBeVisible();
  await expect(page.locator(".trusted-organizations img")).toHaveCount(8);
  await expect(page.locator(".trusted-organizations").getByRole("img")).toHaveCount(4);
  await expect(page.locator(".trusted-organizations-supporter")).toHaveCount(0);
  await expect(page.locator('.trusted-organizations img[alt*="Black Entrepreneurship Alliance"], .trusted-organizations img[src*="bea_560997bf"]')).toHaveCount(0);
  await expect(clone).toHaveAttribute("role", "presentation");
  await expect(clone.locator("a, button, [tabindex]")).toHaveCount(0);
  await page.mouse.move(0, 0);
  const position = () => original.evaluate(element => element.getBoundingClientRect().left);
  const initial = await position();
  await expect.poll(position).toBeLessThan(initial - 1);

  await customers.hover();
  await expect(original).toHaveCSS("animation-play-state", "paused");
  await page.mouse.move(0, 0);
  await expect(original).toHaveCSS("animation-play-state", "running");
  await pause.focus();
  await expect(pause).toBeFocused();
  await expect(pause).toHaveCSS("outline-style", "solid");
  await expect(original).toHaveCSS("animation-play-state", "paused");
  await page.keyboard.press("Enter");
  const resume = page.getByRole("button", {name:"Resume logo animation", exact:true});
  await expect(resume).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Tab");
  await expect(original).toHaveCSS("animation-play-state", "paused");
  const stopped = await position();
  await page.waitForTimeout(100);
  expect(await position()).toBeCloseTo(stopped, 2);
  await resume.focus();
  await page.keyboard.press("Space");
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  // Focus pauses even after Resume; leaving the customer group resumes motion.
  await expect(original).toHaveCSS("animation-play-state", "paused");
  await page.keyboard.press("Tab");
  await expect(original).toHaveCSS("animation-play-state", "running");
  const resumed = await position();
  await expect.poll(position).toBeLessThan(resumed - 1);
  await pause.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");

  for (const width of [320, 390, 820, 1440]) {
    await page.setViewportSize({width, height:844});
    const geometry = await customers.evaluate(element => {
      const viewport = element.querySelector(".trusted-organizations-viewport")!.getBoundingClientRect();
      const groups = [...element.querySelectorAll(".trusted-organizations-list")];
      const animations = groups.map(group => group.getAnimations()[0]);
      if (animations.some(animation => !animation)) throw new Error("Both customer groups must animate");
      const samples = [0, 6000, 12000, 18000, 23999, 24000].map(time => {
        animations.forEach(animation => { animation.currentTime = time; });
        const [first, second] = groups.map(group => group.getBoundingClientRect());
        const firstTile = groups[0].firstElementChild!.getBoundingClientRect();
        const cloneTile = groups[1].firstElementChild!.getBoundingClientRect();
        return {time, firstLeft:first.left, firstWidth:first.width, secondWidth:second.width,
          seam:second.left - first.right, leftCoverage:viewport.left - first.left,
          rightCoverage:second.right - viewport.right, firstTile:firstTile.left, cloneTile:cloneTile.left};
      });
      return {viewportWidth:viewport.width, samples, timings:animations.map(animation => animation.effect!.getTiming())};
    });
    for (const timing of geometry.timings) {
      expect(timing.duration).toBe(24000);
      expect(timing.easing).toBe("linear");
      expect(timing.iterations).toBe(Infinity);
    }
    for (const sample of geometry.samples) {
      expect(sample.firstWidth).toBeGreaterThanOrEqual(geometry.viewportWidth);
      expect(sample.secondWidth).toBeCloseTo(sample.firstWidth, 2);
      expect(Math.abs(sample.seam)).toBeLessThan(0.1);
      expect(sample.leftCoverage).toBeGreaterThanOrEqual(-0.1);
      expect(sample.rightCoverage).toBeGreaterThanOrEqual(-0.1);
    }
    expect(geometry.samples[1].firstLeft).toBeLessThan(geometry.samples[0].firstLeft);
    expect(Math.abs(geometry.samples[4].cloneTile - geometry.samples[0].firstTile)).toBeLessThan(1);
    expect(geometry.samples[5].firstTile).toBeCloseTo(geometry.samples[0].firstTile, 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  await page.emulateMedia({reducedMotion:"reduce"});
  for (const width of [320, 390, 820, 1440]) {
    await page.setViewportSize({width, height:844});
    await expect(clone).toBeHidden();
    await expect(page.locator(".trusted-organizations-pause")).toBeHidden();
    await expect(original).toHaveCSS("animation-name", "none");
    await expect(original).toHaveCSS("transform", "none");
    expect(await original.evaluate(element => {
      const viewport = element.closest(".trusted-organizations-viewport")!.getBoundingClientRect();
      return [...element.children].every(child => {
        const rect = child.getBoundingClientRect();
        return rect.left >= viewport.left - 0.1 && rect.right <= viewport.right + 0.1;
      });
    })).toBe(true);
    await expect(page.locator(".trusted-organizations").getByRole("img")).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("offline preview embeds and loads the approved Echelon font families without remote font URLs", async ({page}) => {
  const fonts = await readFile(new URL("./restoration-fonts.css", import.meta.url), "utf8");
  expect(fonts).toContain('font-family: "Manrope"');
  expect(fonts).toContain('font-family: "Source Sans 3"');
  expect(fonts).toContain("data:font/woff2;base64,");
  expect(fonts).toContain("Copyright 2018 The Manrope Project Authors");
  expect(fonts).toContain("Copyright 2010-2020 Adobe");
  expect(fonts).toContain("SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007");
  expect(fonts).not.toContain("Sora");
  expect(fonts).not.toMatch(/src:\s*url\(https?:\/\//);

  await page.goto("/#/homepage");
  await expect.poll(() => page.evaluate(async () => {
    await document.fonts.ready;
    return Array.from(document.fonts)
      .filter(font => font.status === "loaded")
      .map(font => font.family.replaceAll('"', ""));
  })).toEqual(expect.arrayContaining(["Manrope", "Source Sans 3"]));
});

test("real homepage keeps the approved light technical design and both free OIT entry points on a phone", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#/homepage");
  const heroTitle = page.getByRole("heading", {name:"Learn the material. Build skills that last.", level:1, exact:true});
  await expect(heroTitle).toBeVisible();
  await expect(heroTitle).toHaveCSS("font-family", /Manrope/);
  await expect.poll(() => page.locator(".echelon-brand img").evaluate((image: HTMLImageElement) => image.naturalWidth > 0)).toBe(true);
  await page.getByRole("button", {name:"Open navigation menu", exact:true}).click();
  await expect(page.locator(".echelon-mobile-links").getByRole("link", {name:"Continuing education", exact:true})).toHaveAttribute("href", "/continuing-education");
  await expect(page.locator(".echelon-mobile-resources").getByRole("link", {name:"Blog", exact:true})).toHaveAttribute("href", /^#?\/blog$/);
  await page.getByRole("button", {name:"Close navigation menu", exact:true}).first().click();
  const previewTrigger = page.getByRole("button",{name:"New to the field? Try a free OIT preview",exact:true});
  await expect(previewTrigger).toHaveAttribute("aria-expanded", "false");
  await expect(previewTrigger).toHaveAttribute("aria-controls", "oit-preview-choice");
  await previewTrigger.click();
  await expect(previewTrigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#oit-preview-choice")).toBeVisible();
  await expect(page.locator("#oit-preview-choice").getByRole("link",{name:/Water OIT.*Start with 15 free questions/})).toHaveAttribute("href",/^#?\/quiz$/);
  await expect(page.locator("#oit-preview-choice").getByRole("link",{name:/Wastewater OIT.*Start with 15 free questions/})).toHaveAttribute("href",/^#?\/oit-ww$/);
  await page.getByRole("button", {name:"Close practice preview options", exact:true}).click();
  await expect(page.locator("#oit-preview-choice")).toHaveCount(0);
  await expect(previewTrigger).toHaveAttribute("aria-expanded", "false");
  await expect(previewTrigger).toBeFocused();
  await expect(page.locator(".homepage-hero").getByRole("link",{name:"Find your course",exact:true})).toHaveAttribute("href", "#find-course");
  await expect(page.locator("#courses").getByRole("heading",{name:"Find your course",exact:true})).toBeVisible();
  await expect(page.locator("#courses").getByLabel("1. Province")).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:"test-results/ui-workspace/homepage-mobile.png",fullPage:true});
});

test("Jobs and Blog are reachable from the homepage and learning desktop navigation", async ({page}) => {
  await page.setViewportSize({width:1280,height:844});
  await page.goto("/#/homepage");
  const jobs = page.locator(".homepage-footer").getByRole("link", {name:"Jobs", exact:true});
  await expect(jobs).toBeVisible();
  await expect(jobs).toHaveAttribute("href", /^#?\/jobs$/);
  await page.getByRole("button", {name:"Resources", exact:true}).click();
  const blog = page.locator("#echelon-resources-menu").getByRole("link", {name:/^Blog\b/});
  await expect(blog).toBeVisible();
  await expect(blog).toHaveAttribute("href", /^#?\/blog$/);
  await page.goto("/#/class1-water");
  for (const {label, href} of [{label:"Jobs", href:/^#?\/jobs$/}, {label:"Blog", href:/^#?\/blog$/}]) {
    const link = page.locator(".echelon-desktop-links").getByRole("link", {name:label, exact:true});
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", href);
  }
});

test("restored navigation keeps account controls on screen on a narrow laptop", async ({page}) => {
  await page.setViewportSize({width:1100,height:844});
  await page.goto("/#/homepage");
  const trigger = page.getByRole("button", {name:"Open navigation menu", exact:true});
  await expect(trigger).toBeVisible();
  expect(await page.locator(".echelon-nav-actions").evaluate(element => element.getBoundingClientRect().right <= window.innerWidth)).toBe(true);
  await trigger.click();
  await expect(page.locator(".echelon-mobile-links").getByRole("link", {name:"Continuing education", exact:true})).toBeVisible();
  await expect(page.locator(".echelon-mobile-resources").getByRole("link", {name:"Blog", exact:true})).toBeVisible();
  await expect(page.locator(".echelon-mobile-actions").getByRole("link", {name:/My account|Sign in/})).toBeVisible();
});

test("finder keeps province, system and level aligned, and resets dependent choices", async ({page}) => {
  await page.goto("/");
  await page.getByLabel("1. Province").selectOption("mb");
  await page.getByLabel("2. System").selectOption("wastewater-collection");
  await page.getByLabel("3. Level").selectOption("wpi-class4-water-coll");
  await expect(page.getByRole("link",{name:"Try this course"})).toHaveAttribute("href","/wpi-class4-water-coll?province=MB");
  await page.getByLabel("1. Province").selectOption("on");
  await expect(page.getByLabel("2. System")).toHaveValue("");
  await expect(page.getByLabel("3. Level")).toBeDisabled();
  await expect(page.getByLabel("2. System").locator('option[value="water-distribution"]')).toHaveText("Water distribution and supply");
  await page.getByLabel("2. System").selectOption("water-distribution");
  await page.getByLabel("3. Level").selectOption("class3-water-dist");
  await expect(page.locator(".course-finder-result")).toContainText("Class 3 Water Distribution and Supply");
  await expect(page.getByRole("link", {name:"Try this course"})).toHaveAttribute("href", "/class3-water-dist?province=ON");
  await page.getByLabel("1. Province").selectOption("mb");
  await expect(page.getByLabel("2. System").locator('option[value="water-distribution"]')).toHaveText("Water distribution");
  await page.screenshot({path:"test-results/ui-workspace/course-finder.png",fullPage:true});
});

test("practice accepts an answer without confidence and filters the actual sample pool", async ({page}) => {
  await page.goto("/#/class1-water");
  await expect(page.getByRole("button",{name:"Choose an answer",exact:true})).toBeDisabled();
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

for (const width of [320, 390, 720, 820]) {
  for (const tutorOpen of [false, true]) {
    test(`practice navigation fits and retains history at ${width}px with tutor ${tutorOpen ? "open" : "closed"}`, async ({page}) => {
      await page.setViewportSize({width, height:844});
      await page.goto("/#/class1-water");
      const question = page.getByTestId("practice-question");
      await expect(question).toBeVisible();
      const firstQuestion = await question.innerText();
      const confirm = page.getByRole("button", {name:"Confirm Answer", exact:true});
      const chooseAnswer = page.getByRole("button", {name:"Choose an answer", exact:true});
      await expect(chooseAnswer).toBeDisabled();
      await expect(page.getByRole("button", {name:"← Back to previous answer", exact:true})).toHaveCount(0);
      await page.locator('.qs-question-card button[aria-pressed]').first().click();
      await expect(confirm).toBeEnabled();
      await confirm.click();
      await page.getByRole("button", {name:"Next Question →", exact:true}).click();
      await expect(question).not.toHaveText(firstQuestion);
      const secondQuestion = await question.innerText();
      await expect(chooseAnswer).toBeDisabled();
      await expect(page.getByRole("button", {name:"← Back to previous answer", exact:true})).toBeVisible();
      expect(await chooseAnswer.evaluate(el => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= innerWidth)).toBe(true);
      await page.locator('.qs-question-card button[aria-pressed]').first().click();
      await expect(confirm).toBeEnabled();
      expect(await confirm.evaluate(el => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= innerWidth)).toBe(true);
      await confirm.click();
      if (tutorOpen) {
        await page.getByRole("button", {name:"Ask the Tutor about this question", exact:true}).click();
        await expect(page.getByRole("dialog", {name:"AI Tutor"})).toBeVisible();
      }
      const back = page.getByRole("button", {name:"← Back to previous answer", exact:true});
      const next = page.getByRole("button", {name:"Next Question →", exact:true});
      for (const button of [back, next]) {
        await expect(button).toBeVisible();
        expect(await button.evaluate(el => {
          const rect = el.getBoundingClientRect();
          const card = el.closest(".qs-question-card")!.getBoundingClientRect();
          return rect.left >= card.left && rect.right <= card.right && rect.left >= 0 && rect.right <= innerWidth && el.scrollWidth <= el.clientWidth;
        })).toBe(true);
      }
      if (width === 320) {
        expect(await next.evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(await back.evaluate(el => el.getBoundingClientRect().top));
      }
      await back.click();
      await expect(question).toHaveText(firstQuestion);
      await page.getByRole("button", {name:"Next Question →", exact:true}).click();
      await expect(question).toHaveText(secondQuestion);
      if (tutorOpen) await expect(page.getByRole("dialog", {name:"AI Tutor"})).toBeVisible();
    });
  }
}

test("learner gets one primary step with charts in Progress", async ({page}) => {
  await page.goto("/#/dashboard");
  await expect(page.getByRole("region",{name:"Your next study step"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Continue studying"})).toHaveAttribute("href",/class1-water/);
  await expect(page.getByRole("region",{name:"Study activity and history"})).toHaveCount(0);
  await page.screenshot({path:"test-results/ui-workspace/learner-dashboard.png",fullPage:true});
  await page.getByRole("button",{name:"Quiz progress and tutor history",exact:true}).click();
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
  // Starting during the fixture's guest-to-user change intentionally discards
  // the old actor's response. Wait for auth.me, not dashboardAuth.me navigation.
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem("manus-runtime-user-info") ?? "null")?.id === 1
  );
  await page.getByRole("button",{name:/Start Exam/}).click();
  await expect(page.locator(".mes-active-grid")).toBeVisible({timeout:30000});
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

test("formula and account screens retain their original functions and approved readable type", async ({page}) => {
  await page.goto("/#/formulas-water1");
  await expect(page.getByRole("heading", {name:/Class 1 Water Treatment/})).toBeVisible();
  await page.getByPlaceholder("Search formulas, variables, or topics…").fill("CT Value");
  await expect(page.getByText("CT (mg·min/L) = C (mg/L) × T (min)", {exact:false})).toBeVisible();
  await expect(page.getByText("Turbidity Removal Efficiency", {exact:true})).toHaveCount(0);
  await page.getByRole("button", {name:"Account",exact:true}).first().click();
  await expect(page.getByRole("heading", {name:"My Account",exact:true})).toBeVisible();
  await expect(page.locator(".account-page")).toHaveCSS("font-family", /Source Sans 3/);
  await expect(page.locator(".account-page")).toHaveCSS("color", "rgb(0, 0, 0)");
});

test("admin keeps all sixteen destinations in five native navigation sections", async ({page}) => {
  await page.setViewportSize({width:1280,height:844});
  await page.goto("/#/admin");
  const navigation = page.getByRole("navigation", {name:"Admin sections"});
  await expect(page.getByRole("heading", {name:"Overview", exact:true})).toBeVisible();
  await expect(navigation.locator(":scope > .admin-sidebar-group")).toHaveCount(5);
  await expect(navigation.locator("details")).toHaveCount(4);
  await expect(navigation.locator("details[open]")).toHaveCount(0);
  await expect(navigation.locator(".admin-sidebar-button")).toHaveCount(16);
  const groups = [
    ["Customers", ["Organizations", "Captured leads", "Trial signups", "Waitlist"]],
    ["Sales", ["Sales & purchases", "Subscriptions"]],
    ["Learning", ["Learners", "Question review", "Score history", "Feedback"]],
    ["More tools", ["System health", "Error reports", "Recovery review", "Data explorer", "Changelog"]],
  ] as const;
  for (const [group, destinations] of groups) {
    const disclosure = navigation.locator("details").filter({has:page.locator("summary", {hasText:new RegExp(`^${group}$`)})});
    await disclosure.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(disclosure).toHaveAttribute("open", "");
    for (const label of destinations) {
      const destination = navigation.getByRole("button", {name:label, exact:true});
      await destination.click();
      await expect(destination).toHaveAttribute("aria-current", "page");
      await expect(destination).toBeFocused();
      await expect(page.getByRole("heading", {name:label, exact:true}).first()).toBeVisible();
      // Wait for the synthetic transport too, not only the synchronous header.
      await page.waitForTimeout(180);
      await expect(page.locator(".admin-portal")).toBeVisible();
      await expect(disclosure).toHaveAttribute("open", "");
    }
    await disclosure.locator("summary").focus();
    await page.keyboard.press("Space");
    await expect(disclosure).not.toHaveAttribute("open", "");
  }
  await navigation.getByRole("button", {name:"Business overview",exact:true}).click();
  await expect(page.getByRole("heading", {name:"Overview",exact:true})).toBeVisible();
});

test("admin overview is compact with unchanged summary values and closed reports", async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/#/admin");
  const summary = page.getByRole("region", {name:"Business summary"});
  await expect(summary).toContainText("CA$1980.00");
  await expect(summary).toContainText("CA$400.00");
  await expect(summary).toContainText("1 · CA$179.00");
  await expect(summary).toContainText("66.7%");
  await expect(summary).toContainText("60%");
  await expect(page.locator(".admin-report-details")).toHaveCount(4);
  await expect(page.locator(".admin-report-details[open], .admin-metric-definition[open]")).toHaveCount(0);
  await expect(page.locator(".admin-priority-item")).toHaveCount(3);
  await expect(page.locator("#admin-founder-title")).toHaveCSS("font-family", /Manrope/);
  await expect(page.locator(".admin-portal")).toHaveCSS("font-family", /Source Sans 3/);
  // The fixture review toolbar is outside the real application workspace.
  expect(await page.locator(".admin-report-details").last().evaluate(element => element.getBoundingClientRect().bottom - element.closest(".admin-portal")!.getBoundingClientRect().top)).toBeLessThan(900);
  const games = page.getByRole("region", {name:"Games activity", exact:true});
  await expect(games.getByRole("status")).toContainText("No tracked course-game answers in this period.");
  expect(await games.evaluate(element => element.previousElementSibling?.matches("details.admin-report-details"))).toBe(true);
  await expect(games.getByRole("combobox", {name:"Period"})).toHaveValue("30");
  await games.getByRole("combobox", {name:"Period"}).selectOption("7");
  await expect(games.getByRole("status")).toContainText("No tracked course-game answers in this period.");
  await expect(games.getByRole("combobox", {name:"Period"})).toHaveValue("7");
  await games.getByRole("combobox", {name:"Period"}).selectOption("30");
  await expect(games.getByRole("status")).toContainText("No tracked course-game answers in this period.");
  await page.screenshot({path:"test-results/ui-workspace/overview-desktop.png",fullPage:true});
  await summary.locator("article").first().locator("summary").click();
  await expect(summary).toContainText("Not net of refunds, disputes or fees.");
  const teamSummary = summary.locator("article").nth(1);
  await teamSummary.locator("summary").click();
  await expect(teamSummary).toContainText("2 paid team orders covering 5 licences");
  const teamReport = page.locator(".admin-report-details").filter({has:page.locator(":scope > summary", {hasText:"Team orders and revenue"})});
  await teamReport.locator(":scope > summary").click();
  await expect(page.locator('.admin-ledger-table-wrap[aria-label="Team orders"]')).toBeVisible();
  await teamReport.locator(":scope > summary").click();
  await page.getByRole("button", {name:/01 Inspect paid conversion/}).click();
  await expect(page.getByRole("heading", {name:"Sales & purchases",exact:true})).toBeVisible();
  const sales = page.locator(".admin-sidebar-group").filter({has:page.locator("summary", {hasText:/^Sales$/})});
  await expect(sales).toHaveAttribute("open", "");
  await expect(page.locator(".admin-priority-item")).toHaveCount(0);
});

test("compact overview shortcut opens Learners and uses isolated search and activity fixtures", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#/admin");
  const shortcut = page.locator(".admin-priority-card .admin-panel-heading").getByRole("button", {name:"View learner activity →", exact:true});
  await expect(shortcut).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await shortcut.click();
  await expect(page.getByRole("heading", {name:"Learners", exact:true}).first()).toBeVisible();
  await page.getByRole("textbox", {name:"Name or email"}).fill("jordan");
  await page.getByRole("button", {name:"Search learners", exact:true}).click();
  await page.getByRole("button", {name:"Jordan Mercer · jordan@example.test · Account #1", exact:true}).click();
  await expect(page.getByText("No supported timeline activity recorded in this window. Check observed assessment sessions separately below.", {exact:true})).toBeVisible();
  await expect(page.getByLabel("History window")).toHaveValue("7");
  await page.getByLabel("History window").selectOption("30");
  await expect(page.getByText("No supported timeline activity recorded in this window. Check observed assessment sessions separately below.", {exact:true})).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", {name:"Open navigation", exact:true}).click();
  const learning = page.getByRole("navigation", {name:"Admin sections"}).locator("details").filter({has:page.locator("summary", {hasText:/^Learning$/})});
  await expect(learning).toHaveAttribute("open", "");
  await expect(learning.getByRole("button", {name:"Learners", exact:true})).toHaveAttribute("aria-current", "page");
});

test("admin mobile drawer preserves focus containment, disclosures and selected destination", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#/admin");
  await expect(page.locator("#admin-founder-title")).toBeVisible();
  const trigger=page.getByRole("button", {name:"Open navigation",exact:true});
  await trigger.click();
  const drawer=page.getByRole("dialog", {name:"Echelon administration navigation"});
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("button", {name:"Close navigation",exact:true})).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(drawer.getByRole("link", {name:"Back to website"})).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(drawer.getByRole("button", {name:"Close navigation",exact:true})).toBeFocused();
  const customers=drawer.locator("summary", {hasText:/^Customers$/});
  await customers.focus();
  await page.keyboard.press("Enter");
  await expect(drawer.getByRole("button", {name:"Captured leads",exact:true})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await drawer.locator("summary", {hasText:/^Learning$/}).click();
  await drawer.getByRole("button", {name:"Feedback",exact:true}).click();
  await expect(page.getByRole("heading", {name:"Feedback",exact:true})).toBeVisible();
  await expect(page.locator(".admin-sidebar")).toHaveAttribute("inert", "");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(drawer.getByRole("button", {name:"Feedback",exact:true})).toHaveAttribute("aria-current", "page");
  await expect(drawer.getByRole("button", {name:"Feedback",exact:true})).toBeVisible();
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:"test-results/ui-workspace/feedback-mobile.png",fullPage:true});
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
