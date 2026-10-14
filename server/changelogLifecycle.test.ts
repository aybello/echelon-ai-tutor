import { beforeEach, describe, expect, it, vi } from "vitest";
import { router } from "./_core/trpc";
import type { TrpcContext } from "./_core/context";
import { changelogRouter } from "./routers/changelogRouter";
import { getDb } from "./db";
import { PLATFORM_RELEASES } from "../shared/platformReleases";

vi.mock("./db", () => ({ getDb: vi.fn() }));
const routes = router(changelogRouter);
const caller = (role?: "admin" | "user") => routes.createCaller({ user: role ? { id: 1, role } : null } as TrpcContext);
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getDb).mockResolvedValue(null); });

describe("changelog authorization and failure semantics", () => {
  it("keeps bundled public history available without pretending admin loaded successfully", async () => {
    expect(await caller().list()).toEqual([...PLATFORM_RELEASES]);
    await expect(caller("admin").adminList()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
  it("blocks anonymous and non-admin editing before database access", async () => {
    await expect(caller().adminList()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller("user").adminList()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller("user").create({ date: "October 2026", title: "Synthetic", body: "Synthetic" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getDb).not.toHaveBeenCalled();
  });
  it("rejects attempts to edit or delete bundled IDs before database access", async () => {
    for (const release of PLATFORM_RELEASES) {
      await expect(caller("admin").update({ id: release.id, title: "Synthetic" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(caller("admin").delete({ id: release.id })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(getDb).not.toHaveBeenCalled();
  });
});
