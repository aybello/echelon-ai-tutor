import { expect, test, type Page } from "@playwright/test";

const origin = "https://echeloninstitute.ca";
test.beforeEach(async ({ page, baseURL }) => {
  // Use the production hostname without a production request. Local assets
  // exercise the hostname boundary unchanged; application APIs are mocked below.
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
    // No synthetic conversion can reach Google's live collection endpoints.
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
  test(`small in-flow notice allows browsing and rejects without Google at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const google = await setup(page);
    await page.goto(`${origin}/?email=private%40example.test&token=synthetic-only#private`);
    const notice = page.getByRole("region", { name: "Optional advertising measurement" });
    await expect(notice).toBeVisible();
    const box = await notice.boundingBox(); expect(box?.width).toBeLessThanOrEqual(width); expect(box!.height).toBeLessThan(240);
    expect(await notice.evaluate(e => getComputedStyle(e).position)).not.toBe("fixed");
    expect(google).toEqual([]); expect(await calls(page)).toEqual([]);
    await page.getByRole("button", { name: "Continue without tracking", exact: true }).click();
    await expect(notice).toHaveCount(0); await page.reload();
    await expect(notice).toHaveCount(0); expect(google).toEqual([]);
  });
}

test("allows the single base tag with scrubbed context and offers effective privacy revocation", async ({ page }) => {
  const google = await setup(page);
  await page.goto(`${origin}/?email=private%40example.test&token=secret&gclid=Synthetic_Click-123#private`);
  await page.getByRole("button", { name: "Allow ad measurement", exact: true }).click();
  await expect.poll(() => google.length).toBe(1);
  const commands = await calls(page);
  expect(commands.filter((x: any) => x[0] === "config")).toHaveLength(1);
  const text = JSON.stringify(commands); expect(text).not.toMatch(/private|secret|email=|token=/);
  expect(text).toContain("gclid=Synthetic_Click-123");
  await page.goto(`${origin}/privacy`);
  await expect(page.locator("#advertising-measurement")).toContainText("measurement is on");
  await page.context().addCookies([{ name: "_gcl_aw", value: "synthetic", domain: "echeloninstitute.ca", path: "/", secure: true }]);
  await page.getByRole("button", { name: "Turn ad measurement off" }).click();
  await expect(page.locator("#advertising-measurement")).toContainText("measurement is off");
  expect(await page.locator("#echelon-google-ads").count()).toBe(0);
  expect((await page.context().cookies()).some(c => c.name === "_gcl_aw")).toBe(false);
});

test("unverified success URL and denied verified payment never send a conversion", async ({ page }) => {
  const google = await setup(page);
  await page.addInitScript(key => localStorage.setItem(key, "allowed"), choiceKey);
  await page.goto(`${origin}/purchase-success?session_id=cs_test_fake&email=buyer%40example.test`);
  await expect(page.getByRole("heading", { name: "We couldn't confirm this purchase" })).toBeVisible();
  expect(google).toEqual([]); expect(await calls(page)).toEqual([]);
});

test("verified paid payload waits for choice, excludes contact/session data and survives reload without a duplicate", async ({ page }) => {
  const google = await setup(page, verified);
  await page.goto(`${origin}/purchase-success?session_id=cs_test_private&email=buyer%40example.test`);
  await expect(page.getByRole("heading", { name: "Payment Successful!" })).toBeVisible();
  expect(google).toEqual([]);
  await page.getByRole("button", { name: "Allow ad measurement", exact: true }).click();
  await expect.poll(async () => (await calls(page)).filter((x: any) => x[0] === "event" && x[1] === "conversion").length).toBe(1);
  const commands = await calls(page);
  const conversion = commands.find((x: any) => x[1] === "conversion");
  expect(conversion[2]).toMatchObject({ value: 39.2, currency: "CAD", transaction_id: order, page_location: "https://echeloninstitute.ca/purchase-success", page_referrer: "" });
  expect(JSON.stringify(commands)).not.toMatch(/buyer|cs_test_private|email=|session_id=/);
  await page.reload(); await expect(page.getByRole("heading", { name: "Payment Successful!" })).toBeVisible();
  expect((await calls(page)).filter((x: any) => x[1] === "conversion")).toHaveLength(0);
});

test("browser privacy opt-out overrides a previous allow choice", async ({ page }) => {
  const google = await setup(page);
  await page.addInitScript(key => {
    localStorage.setItem(key, "allowed"); Object.defineProperty(navigator, "globalPrivacyControl", { value: true });
  }, choiceKey);
  await page.goto(`${origin}/privacy`);
  await expect(page.locator("#advertising-measurement")).toContainText("privacy opt-out signal");
  expect(google).toEqual([]); expect(await calls(page)).toEqual([]);
});
