import { expect, test } from "@playwright/test";

test("OTP email control is reachable by its accessible name without requesting a code", async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL ?? "http://127.0.0.1:3000").origin;
  const authWrites: string[] = [];
  await context.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET") {
      if (url.pathname.startsWith("/api/trpc/")) authWrites.push(url.pathname);
      return route.abort("blockedbyclient");
    }
    if (url.origin !== origin) return route.abort("blockedbyclient");
    if (url.pathname.startsWith("/api/trpc/")) {
      const procedures = decodeURIComponent(url.pathname.split("/api/trpc/")[1]).split(",");
      return route.fulfill({ json: procedures.map(() => ({ result: { data: { json: null } } })) });
    }
    if (url.pathname.startsWith("/api/")) return route.fulfill({ json: {} });
    return route.continue();
  });
  await page.goto("/login/otp?next=%2Faccount");
  const email = page.getByRole("textbox", { name: "Email address", exact: true });
  await expect(email).toBeVisible({ timeout: 5_000 });
  await email.fill("synthetic@example.test");
  await expect(email).toHaveValue("synthetic@example.test");
  await expect(page.getByRole("button", { name: /Send Code/i })).toBeEnabled();
  // Deliberately never submit: this guards the stale selector independently of
  // Mailpit, account identity, a database, or the real OTP mutation.
  expect(authWrites).toEqual([]);
});
