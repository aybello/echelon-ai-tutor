import { describe, expect, it } from "vitest";
import { fetchJobDocument, pdfToText, verifyJob } from "./scripts/jobVerification.mjs";
import { postingTransportFixture, type FetchDocumentForFixture } from "./jobPostingFixtures";

const retrieveDocument = fetchJobDocument as FetchDocumentForFixture;
const now = new Date("2026-10-03T09:00:00Z");
const job = { title: "Operations Manager", company: "Fixture Water Authority", sourceUrl: "https://employer.example.test/posting.pdf" };

// Minimal actual PDF with byte-accurate xref, a standard font and a text layer.
// All content is synthetic; PDF.js runs the existing restricted local child.
function syntheticPdf(text: string) {
  const escaped = text.replace(/([\\()])/g, "\\$1");
  const stream = `BT /F1 12 Tf 72 720 Td (${escaped}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 2000 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  const parts = [Buffer.from("%PDF-1.4\n")];
  const offsets = [0];
  let length = parts[0].length;
  for (const [index, object] of objects.entries()) {
    offsets.push(length);
    const part = Buffer.from(`${index + 1} 0 obj\n${object}\nendobj\n`);
    parts.push(part);
    length += part.length;
  }
  const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`;
  return Buffer.concat([...parts, Buffer.from(xref)]);
}
const retrievePdf = (bytes: Uint8Array) => (url: string) => retrieveDocument(url, { ...postingTransportFixture([{ body: bytes }]), pdfToText });

describe("specific PDF evidence with real bounded extraction", () => {
  it("verifies role-plus-employer after actual PDF extraction", async () => {
    const bytes = syntheticPdf(`${job.company} ${job.title} Apply by: October 18, 2026`);
    const document = await retrievePdf(bytes)(job.sourceUrl);
    expect(document).toMatchObject({ isPdf: true, finalUrl: job.sourceUrl, contentType: "application/pdf" });
    expect(document.text).toContain(job.company);
    expect(await verifyJob(job, { now, fetchDocument: async () => document })).toMatchObject({ status: "verified", closingAt: new Date("2026-10-18T23:59:59.999Z") });
  });
  it("expires the specific August deadline rather than its future start date", async () => {
    const bytes = syntheticPdf(`${job.company} ${job.title} Application Deadline: August 3, 2026 Start Date: November 18, 2026`);
    expect(await verifyJob(job, { now, fetchDocument: retrievePdf(bytes) })).toMatchObject({ status: "expired", closingAt: new Date("2026-08-03T23:59:59.999Z") });
  });
  it("does not grandfather employer-free or malformed PDFs as verified/missing", async () => {
    for (const bytes of [syntheticPdf(`${job.title} Apply by: October 18, 2026`), Buffer.from("%PDF-1.4 malformed")]) {
      expect((await verifyJob(job, { now, fetchDocument: retrievePdf(bytes) })).status).toBe("unavailable");
    }
  });
});
