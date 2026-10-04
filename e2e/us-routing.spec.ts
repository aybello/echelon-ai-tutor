import { test, expect, type Page } from "@playwright/test";
import { matchedUSCourses, sharedUSCourses, US_STATE_CONFIGS } from "../shared/usExamRouting";

async function mockServices(page: Page) {
  await page.route("https://analytics.example.test/**", route => route.fulfill({body:""}));
  await page.route("**/api/trpc/**", async route => {
    const url = new URL(route.request().url());
    const paths = decodeURIComponent(url.pathname.split("/api/trpc/")[1]).split(",");
    const responses = paths.map(path => {
      let data: unknown = {success:true};
      if (["auth.me","dashboardAuth.me"].includes(path)) data = null;
      else if (path === "stripe.checkAccess") data = {hasAccess:true,unlockedExamTypes:sharedUSCourses().map(course=>course.courseKey)};
      else if (path === "quiz.getBankMeta") data = {modules:["Math & Calculations"],totalQuestions:20};
      else if (path === "quiz.getModuleOverviews") data = {};
      else if (["quiz.getRandomQuestions","quiz.getQuestions"].includes(path)) data = {questions:Array.from({length:20},(_,i)=>({id:i+1,module:"Math & Calculations",difficulty:"medium",question:"A pump delivers 120 L/min. How much water is delivered in one hour?",options:["7200 L","120 L","2 L","1200 L"],correctAnswer:0,correctIndex:0,explanation:"120 L/min multiplied by 60 min is 7200 L.",isCalc:true})),total:20,hasMore:false,locked:false};
      else if (path === "quiz.getMissedQuestions") data = {questions:[],total:0};
      else if (path === "blog.listPosts" || path === "feedback.publicReviews") data=[];
      return {result:{data:{json:data}}};
    });
    await route.fulfill({contentType:"application/json",body:JSON.stringify(url.searchParams.has("batch")?responses:responses[0])});
  });
}

test("shared US catalogue uses all 16 canonical courses and never old shorthand routes", async ({page}) => {
  await mockServices(page);
  await page.goto("/us/courses");
  await expect(page.locator(".us-card[data-course-key]")).toHaveCount(16);
  for (const course of sharedUSCourses()) {
    const card=page.locator(`[data-course-key="${course.courseKey}"]`);
    await expect(card.getByRole("link",{name:"Practice Quiz",exact:true})).toHaveAttribute("href",`${course.quizPath}?country=US`);
    await expect(card.getByRole("link",{name:"Mock Exam",exact:true})).toHaveAttribute("href",`${course.mockExamPath}?country=US`);
    await expect(card.getByRole("link",{name:"Flashcards",exact:true})).toHaveAttribute("href",`${course.flashcardPath}?country=US`);
  }
});

test("state and stream selections survive reload and Back and expose only confirmed classes", async ({page}) => {
  const state=Object.values(US_STATE_CONFIGS).find(item=>matchedUSCourses(item).length>0)!;
  expect(state).toBeDefined();
  await mockServices(page);
  await page.goto(`/us/courses?state=${state.code}`);
  await expect(page.getByRole("combobox",{name:"State",exact:true})).toHaveValue(state.code);
  await expect(page.locator(".us-card[data-course-key]")).toHaveCount(matchedUSCourses(state).length);
  const course=matchedUSCourses(state)[0];
  await page.getByRole("combobox",{name:"Certification stream",exact:true}).selectOption(course.track);
  await expect(page).toHaveURL(new RegExp(`state=${state.code}.*stream=${course.track}`));
  await page.reload();
  await expect(page.getByRole("combobox",{name:"Certification stream",exact:true})).toHaveValue(course.track);
  await expect(page.locator(".us-card[data-course-key]")).toHaveCount(matchedUSCourses(state,course.track).length);
  await page.goBack();
  await expect(page.getByRole("combobox",{name:"Certification stream",exact:true})).toHaveValue("");
});

test("unrecognized states do not silently show a full matching catalogue", async ({page}) => {
  await mockServices(page);
  await page.goto("/us/courses?state=XX");
  await expect(page.locator(".us-card[data-course-key]")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("not recognized");
  const response=await page.goto("/us/states/not-a-state");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading",{name:"State Not Found"})).toBeVisible();
});

test("state-specific and customized streams have no misleading shared-course buttons", async ({page}) => {
  const state=Object.values(US_STATE_CONFIGS).find(item=>item.programs.some(program=>["wpi-customized","state-specific"].includes(program.examSystem)))!;
  expect(state).toBeDefined();
  await mockServices(page);
  await page.goto(`/us/states/${state.slug}`);
  for (const program of state.programs.filter(program=>["wpi-customized","state-specific"].includes(program.examSystem))) {
    const section=page.locator(`[data-program="${program.stream}"]`);
    await expect(section).toContainText("No state-matched course");
    await expect(section.locator("[data-course-key]")).toHaveCount(0);
  }
});

test("shared practice keeps US state through tools and does not display Western Canada", async ({page}) => {
  const state=Object.values(US_STATE_CONFIGS).find(item=>matchedUSCourses(item).some(course=>course.track==="water-treatment"))!;
  const course=matchedUSCourses(state,"water-treatment")[0];
  await mockServices(page);
  await page.goto(`${course.quizPath}?country=US&state=${state.code}`);
  await expect(page.getByTestId("practice-question")).toBeVisible();
  await expect(page.locator(".echelon-course-identity small")).toHaveText(`${state.name} / Shared WPI`);
  await expect(page.locator(".practice-header")).toContainText("Shared WPI preparation");
  await expect(page.locator(".practice-header")).not.toContainText("EOCP");
  await expect(page.locator(".echelon-course-identity")).not.toContainText("Western Canada");
  const tabs=page.locator(".echelon-course-tabs-desktop a");
  for(const href of await tabs.evaluateAll(links=>links.map(link=>link.getAttribute("href")!))) {
    const url=new URL(href,"https://echelon.test");
    expect(url.searchParams.get("country")).toBe("US");
    expect(url.searchParams.get("state")).toBe(state.code);
    expect(url.searchParams.has("province")).toBe(false);
  }
});

test("all 50 states remain searchable with no mobile horizontal clipping", async ({page},testInfo) => {
  await page.setViewportSize({width:390,height:844});
  await mockServices(page);
  await page.goto("/us/states");
  await expect(page.locator(".us-state-card")).toHaveCount(50);
  await page.getByLabel("Search states or authorities").fill("Alabama");
  await expect(page.locator(".us-state-card")).toHaveCount(1);
  await page.locator(".us-state-card").click();
  await expect(page.getByRole("heading",{level:1})).toContainText("Alabama");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({path:testInfo.outputPath("us-state-mobile.png"),fullPage:false});
});

test("US landing stays in bounds on phones and opens US pricing context", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await mockServices(page);
  await page.goto("/us");
  await expect(page.getByRole("heading",{level:1})).toContainText("Operator Exam");
  const pricing=page.locator('nav').getByRole("link",{name:"Pricing",exact:true});
  await expect(pricing).toHaveAttribute("href","/pricing?country=US");
  await expect(pricing).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({path:testInfo.outputPath("us-landing-mobile.png"),fullPage:false});
});
