import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

// Test the actual dependency Express resolves, not a separate direct copy.
const require = createRequire(import.meta.url);
const expressRequire = createRequire(require.resolve("express"));
const proxyaddr = expressRequire("proxy-addr");
const request = (remoteAddress: string, forwarded: string) => ({
  socket: { remoteAddress }, connection: { remoteAddress },
  headers: { "x-forwarded-for": forwarded },
});

describe("patched Express proxy-address trust", () => {
  it("resolves the security-patched version used by Express", () => {
    expect(expressRequire("proxy-addr/package.json").version).toBe("2.0.8");
  });
  it.each(["::ffff:10.0.0.0/8", "::/1"])("does not trust an arbitrary IPv4 client for malformed mapped subnet %s", subnet => {
    const trust = proxyaddr.compile(subnet);
    expect(trust("198.51.100.23")).toBe(false);
    expect(proxyaddr(request("198.51.100.23", "127.0.0.1"), trust)).toBe("198.51.100.23");
  });
  it.each(["10.0.0.0/8", "::ffff:10.0.0.0/104"])("preserves a correctly configured trusted proxy chain for %s", subnet => {
    const trust = proxyaddr.compile(subnet);
    expect(trust("10.2.3.4")).toBe(true);
    expect(trust("198.51.100.23")).toBe(false);
    expect(proxyaddr(request("10.2.3.4", "198.51.100.23"), trust)).toBe("198.51.100.23");
  });
});
