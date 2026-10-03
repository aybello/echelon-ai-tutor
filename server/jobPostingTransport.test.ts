import { describe, expect, it, vi } from "vitest";
import { fetchPostingResponse, isPublicPostingAddress, postingDestination } from "./scripts/jobPostingTransport.mjs";
import { fetchJobDocument, verifyJob } from "./scripts/jobVerification.mjs";
import { postingTransportFixture, type FetchDocumentForFixture } from "./jobPostingFixtures";

const retrieveDocument = fetchJobDocument as FetchDocumentForFixture;
const publicHost = "https://employer.example.test/posting.pdf";

describe("public posting destination policy", () => {
  it.each([
    "0.0.0.0", "0.1.2.3", "10.0.0.1", "100.64.0.1", "100.127.255.254", "127.1.2.3",
    "169.254.169.254", "172.16.0.1", "172.31.255.254", "192.0.0.1", "192.0.2.1",
    "192.88.99.1", "192.168.1.1", "198.18.0.1", "198.19.255.254", "198.51.100.1",
    "203.0.113.1", "224.0.0.1", "239.255.255.255", "240.0.0.1", "255.255.255.255",
    "::", "::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:93.184.216.34", "::127.0.0.1",
    "64:ff9b::7f00:1", "64:ff9b:1::a00:1", "100::1", "2001::1", "2001:2::1", "2001:10::1",
    "2001:20::1", "2001:db8::1", "2002:7f00:1::", "3ffe::1", "3fff::1", "fc00::1",
    "fd00::1", "fe80::1", "fe80::1%eth0", "fec0::1", "ff02::1", "4000::1", "not-an-ip",
  ])("rejects non-public/reserved address %s", address => expect(isPublicPostingAddress(address)).toBe(false));
  it.each([
    "8.8.8.8", "93.184.216.34", "142.250.72.14", "100.63.255.254", "100.128.0.1", "172.15.255.254", "172.32.0.1", "192.169.0.1",
    "2001:4860:4860::8888", "2606:4700:4700::1111", "2a00:1450:4001:81b::200e", "2606:4700:4700:0:0:0:0:1111",
  ])("permits ordinary public address %s", address => expect(isPublicPostingAddress(address)).toBe(true));
  it.each([
    "http://employer.example.test/job", "https://employer.example.test:8443/job", "https://employer.example.test:444/job",
    "https://user:pass@employer.example.test/job", "https://user@employer.example.test/job", "https://localhost/job",
    "https://@employer.example.test/job", "https://:@employer.example.test/job",
    "https://localhost./job", "https://office.local/job", "https://office.internal/job", "https://office.localdomain/job",
    "https://127.0.0.1/job", "https://2130706433/job", "https://0x7f000001/job", "https://[::1]/job", "https://[::ffff:127.0.0.1]/job",
  ])("rejects URL-level destination bypass %s", url => expect(() => postingDestination(url)).toThrow("Unapproved"));
  it("preserves normal HTTPS employer links, explicit 443 and the existing Drive PDF conversion", () => {
    expect(postingDestination("https://careers.example.test:443/jobs/123#apply")).toBe("https://careers.example.test/jobs/123");
    expect(postingDestination("https://drive.google.com/file/d/Actual_Source_Id-123/view")).toBe("https://drive.google.com/uc?export=download&id=Actual_Source_Id-123");
  });
});

describe("DNS-validated pinned HTTPS transport", () => {
  it("refuses the legacy fake-fetch seam explicitly rather than falling through to real DNS", async () => {
    const fetch = vi.fn();
    const fixture = postingTransportFixture([]);
    await expect(fetchJobDocument(publicHost, { fetch: fetch as typeof globalThis.fetch, pdfToText: async () => "" } as any)).rejects.toThrow("Legacy fetch injection unavailable");
    expect(fetch).not.toHaveBeenCalled();
    expect(fixture.lookup).not.toHaveBeenCalled();
  });
  it.each([
    [{ address: "127.0.0.1", family: 4 }],
    [{ address: "10.1.2.3", family: 4 }],
    [{ address: "::1", family: 6 }],
    [{ address: "::ffff:10.0.0.1", family: 6 }],
    [{ address: "93.184.216.34", family: 4 }, { address: "192.168.1.1", family: 4 }],
    [{ address: "2606:4700:4700::1111", family: 6 }, { address: "fe80::1", family: 6 }],
    [{ address: "93.184.216.34", family: 6 }],
    [],
  ])("refuses private/mixed/invalid DNS answers before HTTPS", async (...answers) => {
    const fixture = postingTransportFixture([], answers as any);
    await expect(fetchPostingResponse(publicHost, fixture)).rejects.toThrow("Unapproved");
    expect(fixture.lookup).toHaveBeenCalledWith("employer.example.test", { all: true, verbatim: true });
    expect(fixture.get).not.toHaveBeenCalled();
  });
  it("pins the approved address despite a second resolver answer changing to private (rebinding)", async () => {
    const fixture = postingTransportFixture([{ body: "test" }]);
    fixture.lookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]).mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
    const response = await fetchPostingResponse(publicHost, fixture);
    expect(await response.text()).toBe("test");
    const [url, options] = fixture.get.mock.calls[0];
    expect(url.hostname).toBe("employer.example.test");
    expect(options).toMatchObject({ agent: false, family: 4, autoSelectFamily: false, servername: "employer.example.test", rejectUnauthorized: true });
    for (let attempt = 0; attempt < 2; attempt++) {
      const callback = vi.fn();
      options.lookup(url.hostname, {}, callback);
      expect(callback).toHaveBeenCalledWith(null, "93.184.216.34", 4);
    }
    const all = vi.fn();
    options.lookup(url.hostname, { all: true }, all);
    expect(all).toHaveBeenCalledWith(null, [{ address: "93.184.216.34", family: 4 }]);
    const wrongHost = vi.fn();
    options.lookup("other.example.test", {}, wrongHost);
    expect(wrongHost.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(fixture.lookup).toHaveBeenCalledOnce();
  });
  it("pins IPv6 without changing hostname-based TLS identity", async () => {
    const fixture = postingTransportFixture([{ body: "test" }], [{ address: "2606:4700:4700::1111", family: 6 }]);
    const response = await fetchPostingResponse(publicHost, fixture);
    await response.body?.cancel();
    const [url, options] = fixture.get.mock.calls[0];
    const callback = vi.fn();
    options.lookup(url.hostname, {}, callback);
    expect(callback).toHaveBeenCalledWith(null, "2606:4700:4700::1111", 6);
    expect(options.servername).toBe("employer.example.test");
  });
  it("times out an unresolved DNS operation without starting a connection", async () => {
    const fixture = postingTransportFixture([]);
    fixture.lookup.mockImplementation(() => new Promise(() => {}));
    const controller = new AbortController();
    const pending = fetchPostingResponse(publicHost, { ...fixture, signal: controller.signal });
    controller.abort(new Error("fixture timeout"));
    await expect(pending).rejects.toThrow("fixture timeout");
    expect(fixture.get).not.toHaveBeenCalled();
  });
  it.each([
    "https://127.0.0.1/internal", "https://[::1]/internal", "http://employer.example.test/internal",
    "https://user@employer.example.test/job", "https://employer.example.test:8443/internal",
    "https://@employer.example.test/job", "//:@employer.example.test/job",
  ])("revalidates redirect URL policy for %s", async location => {
    const fixture = postingTransportFixture([{ status: 302, headers: { location } }]);
    await expect(retrieveDocument(publicHost, fixture)).rejects.toThrow("Unapproved");
    expect(fixture.get).toHaveBeenCalledOnce();
  });
  it.each(["same-host", "other-host"])("revalidates DNS after every %s redirect", async kind => {
    const location = kind === "same-host" ? "/other-posting" : "https://redirect.example.test/posting";
    const fixture = postingTransportFixture([{ status: 302, headers: { location } }]);
    fixture.lookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]).mockResolvedValueOnce([{ address: "10.0.0.1", family: 4 }]);
    await expect(retrieveDocument(publicHost, fixture)).rejects.toThrow("Unapproved");
    expect(fixture.lookup).toHaveBeenCalledTimes(2);
    expect(fixture.get).toHaveBeenCalledOnce();
  });
  it("retains final URL, raw HTML and content type after a safe public redirect", async () => {
    const raw = "<article><h2>Water Operator</h2><p>Fixture Water Authority</p></article>";
    const fixture = postingTransportFixture([{ status: 302, headers: { location: "https://careers.example.test/jobs/actual-source-id" } }, { body: raw, headers: { "content-type": "text/html; charset=utf-8" } }]);
    const document = await retrieveDocument(publicHost, fixture);
    expect(document).toMatchObject({ raw, finalUrl: "https://careers.example.test/jobs/actual-source-id", contentType: "text/html; charset=utf-8", isPdf: false });
    expect(fixture.lookup).toHaveBeenCalledTimes(2);
    expect(fixture.get.mock.calls.map(call => call[1].servername)).toEqual(["employer.example.test", "careers.example.test"]);
  });
  it("bounds redirect loops, body size and definite missing responses", async () => {
    const loop = postingTransportFixture(Array.from({ length: 4 }, () => ({ status: 302, headers: { location: "/again" } })));
    await expect(retrieveDocument(publicHost, loop)).rejects.toThrow("redirect unavailable");
    expect(loop.get).toHaveBeenCalledTimes(4);
    const large = postingTransportFixture([{ body: "x".repeat(5_000_001) }]);
    await expect(retrieveDocument(publicHost, large)).rejects.toThrow("exceeds verification limit");
    for (const status of [404, 410]) {
      const fixture = postingTransportFixture([{ status }]);
      expect(await retrieveDocument(publicHost, fixture)).toMatchObject({ missing: true, finalUrl: publicHost });
    }
  });
  it("classifies DNS failures as unavailable, never missing", async () => {
    const fixture = postingTransportFixture([]);
    fixture.lookup.mockRejectedValue(new Error("EAI_AGAIN"));
    const result = await verifyJob({ title: "Water Operator", sourceUrl: publicHost }, { fetchDocument: url => retrieveDocument(url, fixture) });
    expect(result.status).toBe("unavailable");
    expect(fixture.get).not.toHaveBeenCalled();
  });
});
