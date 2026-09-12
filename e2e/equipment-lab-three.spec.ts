import { expect, test } from "@playwright/test";

test("public Equipment Lab provides a controllable 3D clarifier with an accessible diagram alternative", async ({ page }) => {
  await page.goto("/equipment-lab");

  await expect(page.getByRole("heading", { name: "Inside a circular clarifier", exact: true })).toBeVisible();
  const aboutModel = page.getByRole("button", { name: "About this model", exact: true });
  await expect(aboutModel).toHaveAttribute("aria-expanded", "false");
  await aboutModel.click();
  await expect(page.getByText(/generalized learning illustration, not manufacturer CAD/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "3D model", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Clarification stages", exact: true })).toBeVisible();
  await expect(page.getByText("Distribute influent", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Exploded", exact: true }).click();
  await expect(page.getByRole("button", { name: "Exploded", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("canvas")).toBeVisible();

  const scraperButton = page.getByRole("button", { name: /Scraper Arms/ });
  await scraperButton.focus();
  await scraperButton.press("Enter");
  await expect(page.getByRole("heading", { name: "Scraper Arms", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Water shown", exact: true }).click();
  await expect(page.getByRole("button", { name: "Water hidden", exact: true })).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("button", { name: "Diagram view", exact: true }).click();
  await expect(page.getByRole("button", { name: "Diagram view", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator("svg").filter({ has: page.getByText("Clarification stages") })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Surface Skimmer/ })).toBeVisible();
});

test("public Equipment Lab honors reduced-motion preference without sign-in or learner activity", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/equipment-lab");

  await expect(page.getByRole("button", { name: "Motion reduced", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Motion reduced", exact: true })).toHaveAttribute("aria-pressed", "true");
});
