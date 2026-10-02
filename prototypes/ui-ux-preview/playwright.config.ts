import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: import.meta.dirname, testMatch: "preview.spec.ts", workers:1, timeout:30000,
  outputDir:"../../test-results/ui-workspace", reporter:"list",
  use:{baseURL:"http://127.0.0.1:4178",...devices["Desktop Chrome"],reducedMotion:"reduce",screenshot:"only-on-failure",trace:"retain-on-failure",launchOptions:process.env.UI_TEST_CHROMIUM_PATH ? {executablePath:process.env.UI_TEST_CHROMIUM_PATH,args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--no-zygote","--disable-software-rasterizer","--font-render-hinting=none"]} : undefined},
  webServer:{command:"node_modules/.bin/vite --config prototypes/ui-ux-preview/vite.config.ts",url:"http://127.0.0.1:4178",reuseExistingServer:!process.env.CI,cwd:"../..",timeout:30000},
});
