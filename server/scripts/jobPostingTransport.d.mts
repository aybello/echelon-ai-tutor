import type { IncomingMessage } from "node:http";
import type { RequestOptions } from "node:https";

export function isPublicPostingAddress(address: string): boolean;
export function postingDestination(raw: string): string;
export function fetchPostingResponse(raw: string, deps?: {
  signal?: AbortSignal;
  lookup?: (hostname: string, options: { all: true; verbatim: true }) => Promise<{ address: string; family: number }[]>;
  get?: (url: URL, options: RequestOptions, callback: (incoming: IncomingMessage) => void) => { once(event: string, listener: (...args: any[]) => void): unknown };
}): Promise<Response>;
