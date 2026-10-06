import { expect, test, type Page } from "@playwright/test";

const origin = "https://echeloninstitute.ca";
test.beforeEach(async ({ page, baseURL }) => {
  // Preserve the real hostname boundary, but serve only isolated local assets.
  if (!baseURL || baseURL === origin) throw new Error("This suite requires an isolated local built server");
  await page.route(`${origin}/**`, async route => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `${baseURL}${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });
});

const choiceKey = "echelon:ads-choice:v1";
const order = `echelon_${"a".repeat(64)}`;
const verified = {
  paid: true, email: "buyer@example.test", productKey: "oit", requiresSignIn: true,
  unlockedExamTypes: [], accessToken: null, accessExpiresAt: null, fulfillmentPending: false,
  adsConversion: { sendTo: "AW-18491909141/SyntheticPurchase_123", value: 39.2, currency: "CAD", transactionId: order },
};
async function setup(page: Page, response: object = { ...verified, paid: false, adsConversion: null }) {
  const google: string[] = [];
  await page.route(/https:\/\/.*(?:google|doubleclick|googlesyndication).*\//, async route => {
    // Never transmit synthetic sales or visits to Google's collection endpoints.
    if (route.request().resourceType() === "script" && route.request().url().includes("/gtag/js")) {
      google.push(route.request().url());
      return route.fulfill({ contentType: "application/javascript", body: "window.__syntheticGoogleLoaded=true;" });
    }
    return route.abort();
  });
  await page.route("**/api/trpc/**", async route => {
    const names = new URL(route.request().url()).pathname.split("/api/trpc/")[1].split(",");
    const results = names.map(name => ({ result: { data: { json:
      name === "stripe.verifySession" ? response
      : name === "dashboardAuth.me" ? { email: null }
      : name === "access.auditMyEntitlements" ? { isManager: false, unlockedExamTypes: [], purchasedProductKeys: [], courses: [] }
      : name === "stripe.getProducts" || name === "blog.listPosts" ? []
      : name === "stripe.getCommercialAvailability" ? { products: [] }
      : null,
    } } }));
    await route.fulfill({ json: results });
  });
  return google;
}
async function calls(page: Page) {
  return page.evaluate(() => ((window as any).dataLayer ?? []).map((x: any) => Array.from(x)));
}
for (const width of [1280, 390]) {
  test(`measurement starts automatically without a notice or permission click at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const google = await setup(page);
    await page.goto(`${origin}/?email=private%40example.test&token=synthetic-only#private`);
    await expect.poll(() => google.length).toBe(1);
    await expect(page.getByRole("region", { name: "Optional advertising measurement" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Allow ad measurement", exact: true })).toHaveCount(0);
    expect(await page.evaluate(key => localStorage.getItem(key), choiceKey)).toBeNull();
    const commands = await calls(page);
    expect(commands.filter((x: any) => x[0] === "config")).toHaveLength(1);
    expect(commands.filter((x: any) => x[0] === "event" && x[1] === "page_view")).toHaveLength(1);
    expect(JSON.stringify(commands)).not.toMatch(/private|synthetic-only|email=|token=/);
  });
}

test("uses denied global and Quebec defaults, regional Canada/US measurement and no consent update override", async ({ page }) => {
  const google = await setup(page);
  await page.goto(`${origin}/?gclid=Synthetic_Click-123`);
  await expect.poll(() => google.length).toBe(1);
  const commands = await calls(page);
  expect(commands.slice(0, 3)).toEqual([
    ["consent", "default", { ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }],
    ["consent", "default", { region: ["CA", "US"], ad_storage: "granted", ad_user_data: "granted", analytics_storage: "denied", ad_personalization: "denied" }],
    ["consent", "default", { region: ["CA-QC"], ad_storage: "denied", ad_user_data: "denied", analytics_storage: "denied", ad_personalization: "denied" }],
  ]);
  expect(commands.filter((x: any) => x[0] === "consent" && x[1] === "update")).toHaveLength(0);
  expect(JSON.stringify(commands)).toContain("gclid=Synthetic_Click-123");
});

test("privacy off stops automatically loaded Google and clears first-party attribution cookies", async ({ page }) => {
  const google = await setup(page);
  await page.goto(`${origin}/privacy`);
  await expect.poll(() => google.length).toBe(1);
  await expect(page.locator("#advertising-measurement")).toContainText("enabled with regional cookie limits");
  await page.context().addCookies([{ name: "_gcl_aw", value: "synthetic", domain: "echeloninstitute.ca", path: "/", secure: true }]);
  await page.getByRole("button", { name: "Turn ad measurement off" }).click();
  await expect(page.locator("#advertising-measurement")).toContainText("measurement is off");
  expect(await page.locator("#echelon-google-ads").count()).toBe(0);
  expect((await page.context().cookies()).some(c => c.name === "_gcl_aw")).toBe(false);
  expect(await page.evaluate(key => localStorage.getItem(key), choiceKey)).toBe("denied");
  await page.reload();
  await expect(page.locator("#advertising-measurement")).toContainText("measurement is off");
  expect(google).toHaveLength(1);
  await page.getByRole("button", { name: "Turn ad measurement on" }).click();
  await expect.poll(() => google.length).toBe(2);
  expect((await calls(page)).some((x: any) => x[0] === "consent" && x[1] === "update")).toBe(false);
});

test("preserves an existing refusal and never sends its verified paid conversion", async ({ page }) => {
  const google = await setup(page, verified);
  await page.addInitScript(key => localStorage.setItem(key, "denied"), choiceKey);
  await page.goto(`${origin}/purchase-success?session_id=cs_test_private`);
  await expect(page.getByRole("heading", { name: "Payment Successful!" })).toBeVisible();
  expect(google).toEqual([]); expect(await calls(page)).toEqual([]);
  await expect(page.getByRole("button", { name: "Allow ad measurement", exact: true })).toHaveCount(0);
});

test("an unverified success URL never loads the purchase tag or counts a sale", async ({ page }) => {
  const google = await setup(page);
  await page.goto(`${origin}/purchase-success?session_id=cs_test_fake&email=buyer%40example.test`);
  await expect(page.getByRole("heading", { name: "We couldn't confirm this purchase" })).toBeVisible();
  expect(google).toEqual([]); expect(await calls(page)).toEqual([]);
});

test("verified paid payload sends automatically, excludes contact/session data and does not duplicate after reload", async ({ page }) => {
  const google = await setup(page, verified);
  await page.goto(`${origin}/purchase-success?session_id=cs_test_private&email=buyer%40example.test`);
  await expect(page.getByRole("heading", { name: "Payment Successful!" })).toBeVisible();
  await expect.poll(async () => (await calls(page)).filter((x: any) => x[0] === "event" && x[1] === "conversion").length).toBe(1);
  expect(google).toHaveLength(1);
  const commands = await calls(page);
  const conversion = commands.find((x: any) => x[1] === "conversion");
  expect(conversion[2]).toMatchObject({ value: 39.2, currency: "CAD", transaction_id: order, page_location: "https://echeloninstitute.ca/purchase-success", page_referrer: "" });
  expect(JSON.stringify(commands)).not.toMatch(/buyer|cs_test_private|email=|session_id=/);
  expect(await page.evaluate(key => localStorage.getItem(key), choiceKey)).toBeNull();
  await page.reload(); await expect(page.getByRole("heading", { name: "Payment Successful!" })).toBeVisible();
  expect((await calls(page)).filter((x: any) => x[1] === "conversion")).toHaveLength(0);
});

test("browser privacy opt-out overrides the automatic default and a previous allow preference", async ({ page }) => {
  const google = await setup(page);
  await page.addInitScript(key => {
    localStorage.setItem(key, "allowed"); Object.defineProperty(navigator, "globalPrivacyControl", { value: true });
  }, choiceKey);
  await page.goto(`${origin}/privacy`);
  await expect(page.locator("#advertising-measurement")).toContainText("privacy opt-out signal");
  await expect(page.getByRole("button", { name: "Turn ad measurement on" })).toBeDisabled();
  expect(google).toEqual([]); expect(await calls(page)).toEqual([]);
});

test("storage refusal from another tab stops a vendor already loaded automatically", async ({ page }) => {
  const google = await setup(page);
  await page.goto(`${origin}/privacy`);
  await expect.poll(() => google.length).toBe(1);
  await page.evaluate(key => {
    localStorage.setItem(key, "denied");
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: "denied" }));
  }, choiceKey);
  await expect(page.locator("#advertising-measurement")).toContainText("measurement is off");
  expect(await page.locator("#echelon-google-ads").count()).toBe(0);
  expect(google).toHaveLength(1);
});
