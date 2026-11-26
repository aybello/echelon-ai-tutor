import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import type { Plugin } from "vite";

/** Same platform runtime, deferred external asset. Development keeps its live runtime plugin. */
export function deferredClientRuntime(): Plugin {
  let reference: string;
  let fileName: string | undefined;
  return {
    name: "echelon-deferred-platform-runtime",
    apply: "build",
    buildStart() {
      fileName = undefined;
      const require = createRequire(import.meta.url);
      const entry = require.resolve("vite-plugin-manus-runtime");
      const source = readFileSync(resolve(dirname(entry), "../runtime_dist/manus-runtime.js"), "utf8");
      reference = this.emitFile({ type: "asset", name: "manus-runtime.js", source: `window.__MANUS_HOST_DEV__ = false;\n${source}` });
    },
    generateBundle: {
      // Vite runs its post HTML transforms in generateBundle. Resolve the hashed
      // asset first, while Rollup's full plugin context is available.
      order: "pre",
      handler() {
        fileName = this.getFileName(reference);
      },
    },
    transformIndexHtml: {
      order: "post",
      handler() {
        if (!fileName) throw new Error("Platform runtime asset was not generated");
        return [{ tag: "script", attrs: { id: "manus-runtime", src: `/${fileName}`, defer: true }, injectTo: "body" }];
      },
    },
  };
}
