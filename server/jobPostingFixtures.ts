import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { vi } from "vitest";

export type FixtureReply = { status?: number; body?: string | Uint8Array; headers?: Record<string, string> };

/** No socket/DNS is opened: only the Node HTTPS callback/stream contract is exercised. */
export function postingTransportFixture(replies: FixtureReply[] = [{ body: "fixture" }], answers = [{ address: "93.184.216.34", family: 4 }]) {
  const streams: Readable[] = [];
  const lookup = vi.fn().mockResolvedValue(answers);
  const get = vi.fn((url: URL, options: any, callback: (response: any) => void) => {
    const request = new EventEmitter();
    const reply = replies[get.mock.calls.length - 1];
    if (!reply) throw Error("Unexpected fixture request");
    queueMicrotask(() => {
      const incoming = Readable.from(reply.body ? [Buffer.from(reply.body)] : []) as Readable & { statusCode: number; rawHeaders: string[] };
      incoming.statusCode = reply.status ?? 200;
      incoming.rawHeaders = Object.entries(reply.headers ?? {}).flat();
      streams.push(incoming);
      callback(incoming);
    });
    return request;
  });
  return { lookup, get, streams };
}

export type JobDocumentFixture = { missing: boolean; text: string; raw?: string; isPdf?: boolean; contentType?: string; finalUrl?: string };
export function htmlPostingFixture(raw: string, finalUrl = "https://employer.example.test/careers/"): JobDocumentFixture {
  return { missing: false, raw, text: raw.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " "), isPdf: false, contentType: "text/html", finalUrl };
}
export function pdfPostingFixture(text: string): JobDocumentFixture {
  return { missing: false, raw: text, text, isPdf: true, contentType: "application/pdf", finalUrl: "https://employer.example.test/specific-posting.pdf" };
}
export function structuredPostingFixture(records: Record<string, unknown>[], finalUrl?: string): JobDocumentFixture {
  return htmlPostingFixture(`<script type="application/ld+json">${JSON.stringify({ "@graph": records })}</script>`, finalUrl);
}

// The existing adjacent .d.mts is outside this repair's file ownership. These
// types describe the additive metadata/seams explicitly without changing it.
export type FetchDocumentForFixture = (url: string, deps?: {
  lookup?: (...args: any[]) => any; get?: (...args: any[]) => any; pdfToText?: (bytes: Uint8Array) => Promise<string>;
}) => Promise<JobDocumentFixture>;
