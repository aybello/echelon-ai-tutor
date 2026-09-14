import {build} from 'esbuild';
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const directory = new URL('./', import.meta.url);
const result = await build({
  entryPoints: [fileURLToPath(new URL('explorer.js', directory))],
  bundle: true, minify: true, write: false, format: 'iife',
});
const shell = await readFile(new URL('shell.html', directory), 'utf8');
const output = shell + result.outputFiles[0].text + '\n</script>\n</div>\n';
if (Buffer.byteLength(output) >= 1_000_000) throw new Error('Inline preview exceeds its size limit');
const target = process.argv[2] || '/workspace/water-process-batch-one.html';
await writeFile(target, output);
console.log(`Built ${Buffer.byteLength(output)} bytes: ${target}`);
