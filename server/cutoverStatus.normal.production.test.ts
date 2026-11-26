import { describe, expect, it } from "vitest";

const statusUrl = process.env.ECHELON_CUTOVER_STATUS_URL;
const suite = statusUrl ? describe : describe.skip;

suite("production post-cutover status", () => {
  it("confirms the write freeze has been released", async () => {
    const challenge = crypto.randomUUID();
    const response = await fetch(`${statusUrl}?challenge=${challenge}`, {
      cache: "no-store",
      redirect: "error",
    });

    expect(response.ok).toBe(true);
    expect(response.headers.get("cache-control")).toContain("no-store");
    await expect(response.json()).resolves.toEqual({
      writesFrozen: false,
      mode: "normal",
      challenge,
    });
  }, 20_000);
});
