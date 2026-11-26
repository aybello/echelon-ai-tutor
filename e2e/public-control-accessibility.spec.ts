import { test, expect, type Locator } from "@playwright/test";

// Keep this test independent of the backend, checkout, and all external services.
test.use({ serviceWorkers: "block", reducedMotion: "reduce" });
test.beforeEach(async ({ context, page }, testInfo) => {
  const localOrigin = new URL(testInfo.project.use.baseURL!).origin;
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.origin !== localOrigin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/__manus__/")) return route.abort();
    return route.continue();
  });
  await page.addInitScript(() => localStorage.setItem("echelon_province_dismissed", "true"));
});

async function style(locator: Locator) {
  return locator.evaluate(el => {
    const s = getComputedStyle(el);
    return { border: s.borderTopColor, width: s.borderTopWidth, background: s.backgroundColor, outline: s.outlineStyle, outlineWidth: s.outlineWidth, shadow: s.boxShadow };
  });
}
async function surroundingSurface(locator: Locator) {
  return locator.evaluate(el => {
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      const color = getComputedStyle(parent).backgroundColor;
      if (color !== "rgba(0, 0, 0, 0)" && color !== "transparent") return color;
    }
    throw new Error("No opaque surrounding surface found");
  });
}
function contrast(a: string, b: string) {
  const luminance = (color: string) => {
    const values = color.match(/\d+(?:\.\d+)?/g)!.slice(0, 3).map(Number).map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

test("homepage contact has 3:1 idle boundaries and retains error and keyboard focus states", async ({ page }) => {
  await page.goto("/?province=ON#contact");
  const card = page.locator(".homepage-contact-card");
  const fields = card.locator("input, select, textarea");
  await expect(fields).toHaveCount(4);
  const cardBackground = await card.evaluate(el => getComputedStyle(el).backgroundColor);
  for (const field of await fields.all()) {
    const idle = await style(field);
    expect(parseFloat(idle.width)).toBeGreaterThan(0);
    expect(contrast(idle.border, idle.background)).toBeGreaterThanOrEqual(3);
    expect(contrast(idle.border, cardBackground)).toBeGreaterThanOrEqual(3);
  }
  const name = fields.first();
  await name.focus();
  await expect(name).toHaveCSS("border-top-color", "rgb(23, 87, 184)");
  expect(parseFloat((await style(name)).outlineWidth)).toBeGreaterThan(0);
  await card.getByRole("button", { name: /send message/i }).click(); // empty form: client-side validation only
  for (const field of await fields.all()) {
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toHaveCSS("border-top-color", "rgb(179, 73, 73)");
  }
  await name.focus();
  await expect(name).toHaveCSS("border-top-color", "rgb(179, 73, 73)");
  expect(parseFloat((await style(name)).outlineWidth)).toBeGreaterThan(0);
  await name.fill("Test");
  await expect(name).toHaveAttribute("aria-invalid", "false");
  await expect(name).toHaveCSS("border-top-color", "rgb(23, 87, 184)");
});

test("public input boundaries meet contrast and do not suppress focus or an explicit invalid border", async ({ page }) => {
  await page.goto("/partnerships");
  const form = page.locator(".public-redesign-partnerships form");
  const fields = form.locator('input:not([name="website"]), select, textarea');
  await expect(fields).toHaveCount(5);
  for (const field of await fields.all()) {
    const idle = await style(field);
    expect(parseFloat(idle.width)).toBeGreaterThan(0);
    expect(contrast(idle.border, idle.background)).toBeGreaterThanOrEqual(3);
    expect(contrast(idle.border, await surroundingSurface(field))).toBeGreaterThanOrEqual(3);
  }
  const input = fields.first();
  await input.focus();
  await expect(input).toHaveCSS("border-top-color", "rgb(23, 87, 184)");
  expect(parseFloat((await style(input)).outlineWidth)).toBeGreaterThan(0);
  await input.blur();
  // Synthetic invalid state checks that the idle reset does not mask a component's own error border.
  await input.evaluate(el => { el.setAttribute("aria-invalid", "true"); (el as HTMLElement).style.borderColor = "rgb(185, 28, 28)"; });
  await expect(input).toHaveCSS("border-top-color", "rgb(185, 28, 28)");
  const checked = await form.evaluate(el => {
    const control = document.createElement("input");
    const rule = document.createElement("style");
    rule.textContent = ".selected-control-check { border: 1px solid rgb(20, 83, 45); }";
    document.head.append(rule);
    control.type = "checkbox";
    control.checked = true;
    control.className = "selected-control-check";
    control.style.setProperty("transition", "none", "important");
    control.style.appearance = "none";
    el.append(control);
    const color = getComputedStyle(control).borderTopColor;
    control.remove();
    rule.remove();
    return color;
  });
  expect(checked).toBe("rgb(20, 83, 45)");
});

test("pricing announces province selection, updates it by keyboard, and preserves visual state and navigation", async ({ page }) => {
  await page.goto("/pricing?province=ON");
  const pills = page.locator(".province-pill");
  const ontario = pills.filter({ hasText: "Ontario" });
  const bc = pills.filter({ hasText: "British Columbia" });
  await expect(ontario).toHaveAttribute("aria-pressed", "true");
  await expect(bc).toHaveAttribute("aria-pressed", "false");
  await expect(pills.locator('xpath=self::*[@aria-pressed="true"]')).toHaveCount(1);
  await expect(ontario).toHaveCSS("border-top-color", "rgb(23, 87, 184)");
  await expect(ontario).toHaveCSS("background-color", "rgb(227, 239, 253)");
  await bc.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/province=BC/);
  await expect(bc).toHaveAttribute("aria-pressed", "true");
  await expect(ontario).toHaveAttribute("aria-pressed", "false");
  await expect(bc).toHaveCSS("border-top-color", "rgb(23, 87, 184)");
  await expect(bc).toHaveCSS("background-color", "rgb(227, 239, 253)");
  const picker = page.locator("#individual-course-picker");
  const idle = await style(picker);
  expect(contrast(idle.border, idle.background)).toBeGreaterThanOrEqual(3);
  expect(contrast(idle.border, await surroundingSurface(picker))).toBeGreaterThanOrEqual(3);
  await picker.focus();
  await expect(picker).toHaveCSS("border-top-color", "rgb(23, 87, 184)");
  await page.reload();
  await expect(bc).toHaveAttribute("aria-pressed", "true");
  await page.goBack();
  await expect(ontario).toHaveAttribute("aria-pressed", "true");
  await expect(bc).toHaveAttribute("aria-pressed", "false");
});
