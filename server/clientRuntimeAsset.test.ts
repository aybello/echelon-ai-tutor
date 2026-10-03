import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { deferredClientRuntime } from "./clientRuntimeAsset";
import viteConfig from "../vite.config";

describe("bounded client runtime loading", () => {
  it("emits the unchanged platform runtime as a deferred external asset", () => {
    const plugin = deferredClientRuntime(); const emitFile = vi.fn(() => "runtime-ref");
    (plugin.buildStart as Function).call({ emitFile });
    const require = createRequire(import.meta.url);
    const source = readFileSync(resolve(dirname(require.resolve("vite-plugin-manus-runtime")), "../runtime_dist/manus-runtime.js"), "utf8");
    expect(emitFile).toHaveBeenCalledWith({ type: "asset", name: "manus-runtime.js", source: `window.__MANUS_HOST_DEV__ = false;\n${source}` });
    const generation = plugin.generateBundle as { order: string; handler: Function };
    const getFileName = vi.fn(() => "assets/manus-runtime-hash.js");
    expect(generation.order).toBe("pre");
    generation.handler.call({ getFileName });
    expect(getFileName).toHaveBeenCalledWith("runtime-ref");
    const tags = (plugin.transformIndexHtml as { handler: Function }).handler.call({});
    expect(tags).toEqual([{ tag: "script", attrs: { id: "manus-runtime", src: "/assets/manus-runtime-hash.js", defer: true }, injectTo: "body" }]);
    expect(tags[0]).not.toHaveProperty("children");
  });
  it("does not reuse an unresolved or previous build's asset URL", () => {
    const plugin = deferredClientRuntime();
    const transform = () => (plugin.transformIndexHtml as { handler: Function }).handler.call({});
    expect(transform).toThrow("Platform runtime asset was not generated");
    (plugin.buildStart as Function).call({ emitFile: () => "runtime-ref" });
    (plugin.generateBundle as { handler: Function }).handler.call({ getFileName: () => "assets/manus-runtime-hash.js" });
    expect(transform()).toHaveLength(1);
    (plugin.buildStart as Function).call({ emitFile: () => "next-runtime-ref" });
    expect(transform).toThrow("Platform runtime asset was not generated");
  });
  it("keeps live platform tooling in development but excludes source-location debug overhead from builds", async () => {
    const config = viteConfig as Function;
    const build = await config({ command: "build", mode: "production" });
    const dev = await config({ command: "serve", mode: "development" });
    const names = (plugins: any[]): string[] => plugins.flat(Infinity).map(plugin => plugin.name);
    expect(names(build.plugins)).toContain("echelon-deferred-platform-runtime");
    expect(names(build.plugins)).not.toContain("vite-plugin-manus-runtime");
    expect(names(dev.plugins)).toContain("vite-plugin-manus-runtime");
    expect(names(dev.plugins)).toContain("manus-debug-collector");
    expect(names(dev.plugins)).not.toContain("echelon-deferred-platform-runtime");
  });
});
