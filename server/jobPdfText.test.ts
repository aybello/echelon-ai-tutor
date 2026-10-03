import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { build } from "esbuild";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJobDocument, parseJobDates, pdfToText, verifyJob } from "./scripts/jobVerification.mjs";
import { postingTransportFixture } from "./jobPostingFixtures";

const ROOT = path.resolve(import.meta.dirname, "..");
const now = new Date("2026-10-03T09:00:00Z");
const job = { title: "Operations Manager", company: "Fixture Water Authority", sourceUrl: "https://employer.example.test/posting.pdf" };
const padding = Buffer.from("28bf4e5e4e758a4164004e56fffa01082e2e00b6d0683e802f0ca9fe6453697a", "hex");
const md5 = (bytes: Uint8Array) => createHash("md5").update(bytes).digest();
function rc4(key: Uint8Array, bytes: Uint8Array) {
  const state = Uint8Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) { j = (j + state[i] + key[i % key.length]) % 256; [state[i], state[j]] = [state[j], state[i]]; }
  let i = 0; j = 0;
  return Buffer.from(bytes.map(byte => { i = (i + 1) % 256; j = (j + state[i]) % 256; [state[i], state[j]] = [state[j], state[i]]; return byte ^ state[(state[i] + state[j]) % 256]; }));
}

// Actual synthetic PDF bytes: standard font, page tree, content streams and
// byte-accurate xref. No customer data, downloading, OCR or mocked extraction.
function fixture({ pages = 1, text = "Fixture Water Authority\nOperations Manager\nApplication Deadline: August 3, 2026", encrypted = false, activeContent = false, reuseContent = false, pageWidth = 612 } = {}) {
  const id = Buffer.alloc(16, 1);
  const owner = rc4(md5(Buffer.concat([Buffer.from("owner"), padding]).subarray(0, 32)).subarray(0, 5), Buffer.concat([Buffer.from("secret"), padding]).subarray(0, 32));
  const permission = Buffer.alloc(4); permission.writeInt32LE(-4);
  const fileKey = md5(Buffer.concat([Buffer.concat([Buffer.from("secret"), padding]).subarray(0, 32), owner, permission, id])).subarray(0, 5);
  const encryptObject = (number: number, bytes: Buffer) => {
    const suffix = Buffer.from([number & 255, (number >> 8) & 255, (number >> 16) & 255, 0, 0]);
    return rc4(md5(Buffer.concat([fileKey, suffix])).subarray(0, 10), bytes);
  };
  const encryptRef = 4 + 2 * pages;
  const actionRef = encryptRef + (encrypted ? 1 : 0);
  const objects: Buffer[] = [
    Buffer.from(`<< /Type /Catalog /Pages 2 0 R${activeContent ? ` /OpenAction ${actionRef} 0 R` : ""} >>`),
    Buffer.from(`<< /Type /Pages /Count ${pages} /Kids [${Array.from({ length: pages }, (_, index) => `${4 + index * 2} 0 R`).join(" ")}] >>`),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
  ];
  for (let index = 0; index < pages; index++) {
    const contentRef = 5 + index * 2;
    const escaped = (value: string) => value.replace(/([\\()])/g, "\\$1");
    const content = Buffer.from(text ? `BT /F1 12 Tf 72 720 Td ${text.split("\n").map((line, index) => `${index ? "0 -20 Td " : ""}(${escaped(line)}) Tj`).join("\n")} ET` : "q Q");
    const stream = encrypted ? encryptObject(contentRef, content) : content;
    objects.push(Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${reuseContent ? 5 : contentRef} 0 R >>`));
    objects.push(Buffer.concat([Buffer.from(`<< /Length ${stream.length} >>\nstream\n`), stream, Buffer.from("\nendstream")]));
  }
  if (encrypted) objects.push(Buffer.from(`<< /Filter /Standard /V 1 /R 2 /O <${owner.toString("hex")}> /U <${rc4(fileKey, padding).toString("hex")}> /P -4 >>`));
  if (activeContent) objects.push(Buffer.from("<< /S /JavaScript /JS (throw new Error('must not execute'); fetch('https://127.0.0.1:1/never');) /Next << /S /GoToR /F (https://127.0.0.1:1/remote.pdf) /D [0 /Fit] >> >>"));
  const parts = [Buffer.from("%PDF-1.4\n")];
  const offsets = [0]; let length = parts[0].length;
  objects.forEach((object, index) => {
    offsets.push(length);
    const part = Buffer.concat([Buffer.from(`${index + 1} 0 obj\n`), object, Buffer.from("\nendobj\n")]);
    parts.push(part); length += part.length;
  });
  const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R${encrypted ? ` /Encrypt ${encryptRef} 0 R /ID [<${id.toString("hex")}> <${id.toString("hex")}>]` : ""} >>\nstartxref\n${length}\n%%EOF\n`;
  return Buffer.concat([...parts, Buffer.from(xref)]);
}
const fetchDocument = (bytes: Uint8Array) => (url: string) => fetchJobDocument(url, { ...postingTransportFixture([{ body: bytes }]), pdfToText });
afterEach(() => vi.restoreAllMocks());

describe("portable bounded PDF text extraction", () => {
  it("extracts the role and August 3 deadline from real PDF bytes and expires it", async () => {
    const bytes = fixture();
    const text = await pdfToText(bytes);
    expect(text).toContain("Operations Manager");
    expect(text).toContain("Application Deadline: August 3, 2026");
    expect(parseJobDates(text).closingAt?.toISOString()).toBe("2026-08-03T23:59:59.999Z");
    expect(await verifyJob(job, { now, fetchDocument: fetchDocument(bytes) })).toMatchObject({ status: "expired", closingAt: new Date("2026-08-03T23:59:59.999Z") });
  });
  it("still verifies matching future vacancies after actual PDF extraction", async () => {
    expect((await verifyJob(job, { now, fetchDocument: fetchDocument(fixture({ text: "Fixture Water Authority\nOperations Manager\nApply by: October 18, 2026" })) })).status).toBe("verified");
  });
  it.each([
    ["malformed", () => Buffer.from("%PDF-1.4\ninvalid")],
    ["password-encrypted", () => fixture({ encrypted: true })],
    ["image-only or empty text layer", () => fixture({ text: "" })],
    ["more than 30 pages", () => fixture({ pages: 31 })],
  ])("rejects %s as unavailable, not verified or expired", async (_label, bytes) => {
    await expect(pdfToText(bytes())).rejects.toThrow("PDF text extraction unavailable");
    expect((await verifyJob(job, { now, fetchDocument: fetchDocument(bytes()) })).status).toBe("unavailable");
  });
  it("accepts the inclusive 30-page boundary", async () => {
    const text = await pdfToText(fixture({ pages: 30 }));
    expect(text.match(/Operations Manager/g)).toHaveLength(30);
  });
  it("rejects a real PDF whose extracted text expands beyond the two-megabyte cap", async () => {
    // Reused text stream within the page box, 21 references, >2 MB of text.
    const text = "Operations Manager " + "A".repeat(100_000);
    const bytes = fixture({ pages: 21, text, reuseContent: true, pageWidth: 1_000_000 });
    expect(bytes.length).toBeLessThan(5_000_000);
    await expect(pdfToText(bytes)).rejects.toThrow("PDF text extraction unavailable");
  }, 15_000);
  it("rejects empty and oversized input without starting extraction", async () => {
    await expect(pdfToText(Buffer.alloc(0))).rejects.toThrow("unavailable");
    await expect(pdfToText(Buffer.alloc(5_000_001))).rejects.toThrow("unavailable");
    // The unchanged fetch cap remains in front of the parser as well.
    await expect(fetchDocument(Buffer.alloc(5_000_001))(job.sourceUrl)).rejects.toThrow(/(?:document exceeds verification limit|document limit)/);
  });
  it("ignores document JavaScript and remote-document actions", async () => {
    const text = await pdfToText(fixture({ activeContent: true }));
    expect(text).toContain("Operations Manager");
    expect(text).not.toContain("must not execute");
  });
  it("works from a dist-style external-package bundle and a different cwd", async () => {
    const directory = await mkdtemp(path.join(ROOT, ".pdf-bundle-test-"));
    try {
      const entry = path.join(directory, "entry.mjs");
      const output = path.join(directory, "dist", "index.js");
      const input = path.join(directory, "sample.pdf");
      await mkdir(path.dirname(output), { recursive: true });
      await mkdir(path.join(path.dirname(output), "scripts"));
      await copyFile(path.join(ROOT, "server", "scripts", "jobPdfText.mjs"), path.join(path.dirname(output), "scripts", "jobPdfText.mjs"));
      await writeFile(input, fixture());
      await writeFile(entry, `import { readFileSync } from 'node:fs'; import { pdfToText } from '../server/scripts/jobVerification.mjs'; process.stdout.write(await pdfToText(readFileSync(process.argv[2])));`);
      const result = await build({ entryPoints: [entry], outfile: output, bundle: true, platform: "node", format: "esm", packages: "external", metafile: true, logLevel: "silent" });
      expect(Object.keys(result.metafile!.inputs).some(file => file.includes("pdfjs-dist"))).toBe(false);
      const { stdout } = await promisify(execFile)(process.execPath, [output, input], { cwd: os.tmpdir(), env: { LANG: "C.UTF-8" }, timeout: 10_000, maxBuffer: 2_000_000 });
      expect(stdout).toContain("Application Deadline: August 3, 2026");
    } finally { await rm(directory, { recursive: true, force: true }); }
  }, 15_000);
  it("kills an actual nonresponsive child within its eight-second budget and returns unavailable", async () => {
    const directory = await mkdtemp(path.join(ROOT, ".pdf-timeout-test-"));
    try {
      const entry = path.join(directory, "entry.mjs");
      const output = path.join(directory, "dist", "index.js");
      await mkdir(path.join(path.dirname(output), "scripts"), { recursive: true });
      // Deliberately CPU-bound synthetic helper in an isolated test bundle.
      await writeFile(path.join(path.dirname(output), "scripts", "jobPdfText.mjs"), "process.stdin.resume(); while (true) {}\n");
      await writeFile(entry, `import { pdfToText } from '../server/scripts/jobVerification.mjs'; try { await pdfToText(Buffer.from('%PDF-timeout')); throw new Error('unexpected success'); } catch (error) { process.stdout.write(error.message); }`);
      await build({ entryPoints: [entry], outfile: output, bundle: true, platform: "node", format: "esm", packages: "external", logLevel: "silent" });
      const start = performance.now();
      const { stdout } = await promisify(execFile)(process.execPath, [output], { cwd: os.tmpdir(), env: { LANG: "C.UTF-8" }, timeout: 12_000 });
      expect(stdout).toBe("PDF text extraction unavailable");
      expect(performance.now() - start).toBeLessThan(10_000);
    } finally { await rm(directory, { recursive: true, force: true }); }
  }, 15_000);
});
