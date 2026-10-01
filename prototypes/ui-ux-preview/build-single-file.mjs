import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { build } from "vite";
const repo = path.resolve(import.meta.dirname,"../..");
await build({ configFile:path.join(import.meta.dirname,"vite.config.ts") });
const output=path.resolve(process.argv[2] ?? path.join(repo,".ui-preview-build/echelon-ui-preview.html"));
let html=await readFile(path.join(repo,".ui-preview-build/index.html"),"utf8");
for (const match of [...html.matchAll(/<script[^>]*src="\.\/([^\"]+)"[^>]*><\/script>/g)]) {
  const js=await readFile(path.join(repo,".ui-preview-build",match[1]),"utf8");
  html=html.replace(match[0],()=>`<script type="module">${js.replace(/<\/script/gi,"<\\/script")}</script>`);
}
for(const match of [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="\.\/([^\"]+)"[^>]*>/g)]) {
  const css=await readFile(path.join(repo,".ui-preview-build",match[1]),"utf8");
  html=html.replace(match[0],()=>`<style>${css}</style>`);
}
await mkdir(path.dirname(output),{recursive:true});
await writeFile(output,html);
console.log(`Standalone preview: ${output}`);
