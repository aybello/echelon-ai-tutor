// Invoked only by pdfToText in a memory/time-limited Node child, never imported
// into the web server. PDF.js is kept as an external runtime package.
import { once } from "node:events";
import { pathToFileURL } from "node:url";

const MAX_INPUT_BYTES = 5_000_000;
const MAX_OUTPUT_BYTES = 2_000_000;
const MAX_PAGES = 30;

// PDF.js may warn about its optional native canvas. Text-only extraction needs
// neither canvas nor DOM polyfills; --no-addons also forbids native loading.
// Keep parser diagnostics and any document content out of logs/stdout.
console.log = console.info = console.warn = console.error = () => {};
globalThis.fetch = async () => { throw new Error("PDF network access disabled"); };

class NoAssets {
  async fetch() { throw new Error("PDF external assets disabled"); }
}
class NoCanvas {
  create() { throw new Error("PDF rendering disabled"); }
}

let loadingTask;
try {
  const chunks = [];
  let inputBytes = 0;
  for await (const chunk of process.stdin) {
    inputBytes += chunk.length;
    if (inputBytes > MAX_INPUT_BYTES) throw new Error("PDF input limit");
    chunks.push(chunk);
  }
  if (!inputBytes) throw new Error("Empty PDF");
  const data = new Uint8Array(Buffer.concat(chunks));
  chunks.length = 0;
  const { getDocument } = await import(pathToFileURL(process.argv[2]).href);
  loadingTask = getDocument({
    data, // Never supply a URL, base URL, or document-controlled asset path.
    verbosity: 0,
    stopAtErrors: true,
    isEvalSupported: false, // Older PDF.js switch; Node also forbids string eval.
    enableXfa: false,
    disableFontFace: true,
    useSystemFonts: false,
    fontExtraProperties: false,
    useWorkerFetch: false,
    disableAutoFetch: true,
    disableRange: true,
    disableStream: true,
    useWasm: false,
    isOffscreenCanvasSupported: false,
    isImageDecoderSupported: false,
    maxImageSize: 0,
    canvasMaxAreaInBytes: 0,
    CanvasFactory: NoCanvas,
    BinaryDataFactory: NoAssets,
  });
  // PDF.js automatically uses an in-process "fake worker" in Node: no extra
  // worker thread/process and no rendering, annotation, or JS-action execution.
  const document = await loadingTask.promise;
  if (document.numPages > MAX_PAGES) throw new Error("PDF page limit");
  let outputBytes = 0;
  let hasText = false;
  for (let number = 1; number <= document.numPages; number++) {
    const page = await document.getPage(number);
    try {
      // Stream items rather than retaining the entire page/text/style tree.
      for await (const { items } of page.streamTextContent()) {
        for (const item of items) {
          if (typeof item.str !== "string" || !item.str) continue;
          const text = `${item.str}${item.hasEOL ? "\n" : " "}`;
          outputBytes += Buffer.byteLength(text);
          if (outputBytes > MAX_OUTPUT_BYTES) throw new Error("PDF output limit");
          hasText ||= Boolean(item.str.trim());
          if (!process.stdout.write(text)) await once(process.stdout, "drain");
        }
      }
      outputBytes += 1;
      if (outputBytes > MAX_OUTPUT_BYTES) throw new Error("PDF output limit");
      if (!process.stdout.write("\n")) await once(process.stdout, "drain");
    } finally {
      page.cleanup();
    }
  }
  // An image-only/scanned PDF is unavailable, not evidence of an open vacancy.
  if (!hasText) throw new Error("PDF has no text layer");
} catch {
  process.stderr.write("PDF text extraction unavailable\n");
  process.exitCode = 1;
} finally {
  await loadingTask?.destroy();
}
