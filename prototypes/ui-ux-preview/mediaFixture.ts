import { test as base } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

/** Optional local mirror of HTTP-verified uploads; never part of the app build. */
export const test = base.extend<{ managedMedia: void }>({
  managedMedia: [async ({ page }, use) => {
    const manifestPath = process.env.UI_PREVIEW_MEDIA_MANIFEST;
    if (manifestPath) {
      const assets: { storagePath: string; original: string }[] = JSON.parse(await readFile(resolve(manifestPath), "utf8"));
      const files = new Map(assets.map(asset => [asset.storagePath, asset.original]));
      await page.route("**/manus-storage/**", async route => {
        const original = files.get(new URL(route.request().url()).pathname);
        if (!original) throw new Error("Unregistered preview media path");
        const contentType = original.endsWith(".svg") ? "image/svg+xml" : original.endsWith(".png") ? "image/png" : "image/jpeg";
        await route.fulfill({ status: 200, contentType, body: await readFile(original) });
      });
    }
    await use();
  }, { auto: true }],
});
export { expect } from "@playwright/test";
