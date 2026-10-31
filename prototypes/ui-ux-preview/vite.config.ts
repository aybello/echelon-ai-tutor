import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
const repo = path.resolve(import.meta.dirname, "../..");
const port = Number(process.env.UI_PREVIEW_PORT || 4178);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("UI_PREVIEW_PORT must be an integer between 1 and 65535.");
}
export default defineConfig({
  root: import.meta.dirname, base: "./", define: { "import.meta.env.VITE_OAUTH_PORTAL_URL": JSON.stringify("https://preview.example.test"), "import.meta.env.VITE_APP_ID": JSON.stringify("ui-preview") }, plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.join(repo,"client/src"), "@shared": path.join(repo,"shared"), "@assets": path.join(repo,"attached_assets") } },
  server: { host: "127.0.0.1", port, strictPort: true, fs: { allow: [repo] } },
  build: { outDir: path.join(repo,".ui-preview-build"), emptyOutDir: true },
});
