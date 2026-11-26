import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatChangelogTimestamp,
  latestChangelogTimestamp,
  nextChangelogSortOrder,
} from "../shared/changelog";
import { PLATFORM_RELEASES } from "../shared/platformReleases";
import { router } from "./_core/trpc";
import { changelogRouter } from "./routers/changelogRouter";

const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));
// No application router, credentials, network or real database is loaded.
vi.mock("./db", () => ({ getDb }));

const changelogApi = router(changelogRouter);
const caller = (role: "admin" | "user" | null = null) => changelogApi.createCaller({
  user: role ? { id: 1, role } : null,
} as Parameters<typeof changelogApi.createCaller>[0]);

const databaseEntry = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  date: "November 19, 2026",
  badge: "New",
  badgeColor: "#2563EB",
  title: "Admin announcement",
  body: "An editable announcement.",
  sortOrder: -20_000,
  visible: true,
  createdAt: new Date("2026-11-19T12:00:00.000Z"),
  updatedAt: new Date("2026-11-19T12:00:00.000Z"),
  ...overrides,
});

function readDatabase(rows: ReturnType<typeof databaseEntry>[]) {
  const orderBy = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ orderBy });
  const from = vi.fn().mockReturnValue({ where, orderBy });
  const db = { select: vi.fn().mockReturnValue({ from }) };
  getDb.mockResolvedValue(db);
  return { db, where, orderBy };
}

describe("platform changelog", () => {
  beforeEach(() => {
    getDb.mockReset();
    getDb.mockResolvedValue(null);
  });

  it("places each automatically ordered entry ahead of the current first entry", () => {
    expect(nextChangelogSortOrder(null)).toBe(0);
    expect(nextChangelogSortOrder(0)).toBe(-1);
    expect(nextChangelogSortOrder(-7)).toBe(-8);
  });

  it("places new database releases before bundled platform releases", () => {
    const minBundled = Math.min(...PLATFORM_RELEASES.map(release => release.sortOrder));
    const nextOrder = nextChangelogSortOrder(Math.min(0, minBundled));
    expect(nextOrder).toBeLessThan(minBundled);
  });

  it("derives the public last-updated label from live entries", () => {
    const latest = latestChangelogTimestamp([
      { updatedAt: "2026-08-12T12:00:00.000Z" },
      { updatedAt: "2026-08-16T12:00:00.000Z" },
    ]);
    expect(latest?.toISOString()).toBe("2026-08-16T12:00:00.000Z");
    expect(formatChangelogTimestamp(null)).toBe("Updates load live");
  });

  it("bundles the verified November backfill with unique negative IDs and chronological dates", () => {
    expect(PLATFORM_RELEASES[0].date).toBe("November 19, 2026");
    expect(new Set(PLATFORM_RELEASES.map(entry => entry.id)).size).toBe(PLATFORM_RELEASES.length);
    expect(new Set(PLATFORM_RELEASES.map(entry => entry.title)).size).toBe(PLATFORM_RELEASES.length);
    for (const [index, entry] of PLATFORM_RELEASES.entries()) {
      expect(entry.id).toBeLessThan(0);
      expect(entry.visible).toBe(true);
      expect(Number.isFinite(entry.createdAt.getTime())).toBe(true);
      if (entry.date.startsWith("November")) {
        expect(entry.date).toMatch(/^November \d{1,2}, 2026$/);
        expect(entry.updatedAt.getTime()).toBeLessThanOrEqual(Date.parse("2026-11-19T08:10:17Z"));
      }
      if (index > 0) {
        expect(entry.sortOrder).toBeGreaterThan(PLATFORM_RELEASES[index - 1].sortOrder);
        expect(entry.createdAt.getTime()).toBeLessThanOrEqual(PLATFORM_RELEASES[index - 1].createdAt.getTime());
      }
    }
    expect(latestChangelogTimestamp([...PLATFORM_RELEASES])?.toISOString()).toBe("2026-11-19T08:10:17.000Z");
  });

  it("records the five-game release as two water pilots, not all-course coverage", () => {
    const pilot = PLATFORM_RELEASES.find(entry => entry.id === -2026111903)!;
    expect(pilot.body).toContain("OIT Water and Ontario Class I Water Treatment");
    for (const title of ["Calculation Ladder", "Build the Process", "Find the Calculation Error", "Evidence Detective", "Exam Escape Room"]) {
      expect(pilot.body).toContain(title);
    }
    expect(pilot.body).toContain("Other courses are not included");
    expect(pilot.body).toContain("reuse the pilot tasks");
  });

  it("keeps content and tracking claims bounded to shipped behavior", () => {
    const november = PLATFORM_RELEASES.filter(entry => entry.date.startsWith("November"));
    const copy = november.map(entry => `${entry.title} ${entry.body}`).join("\n");
    expect(copy).not.toMatch(/300|100 per|all courses|human.reviewed|guaranteed|pass.rate|@|https?:|customer.*(?:email|payment)/i);
    expect(copy).toContain("AI-reviewed");
    expect(copy).toContain("recording preferences");
    expect(copy).toContain("separately from server-verified results");
    expect(copy).toContain("missing history and active study time are not inferred");
    expect(copy).toContain("Construction Electrician (309A) is not included");
    expect(copy).toContain("Rapid Swipe, Speed Match, Odd One Out, Cause and Effect, Tap the Flaw, and Before and After");
    expect(copy).not.toMatch(/passwordless account recovery|account access recovery|new brand launch/i);
  });

  it("returns the complete bundled history when the database is unavailable", async () => {
    const entries = await caller().list();
    expect(entries).toEqual([...PLATFORM_RELEASES]);
    expect(entries[0].date).toBe("November 19, 2026");
  });

  it("merges every visible database row without limiting the public history", async () => {
    // More entries than a typical 10/20/50-row UI limit; none may disappear.
    const rows = Array.from({ length: 60 }, (_, index) => databaseEntry({
      id: index + 1,
      sortOrder: index,
      title: `Historical announcement ${index}`,
    }));
    const { where } = readDatabase(rows);
    const entries = await caller().list();
    expect(where).toHaveBeenCalledTimes(1);
    expect(entries).toHaveLength(PLATFORM_RELEASES.length + rows.length);
    expect(entries[0]).toEqual(PLATFORM_RELEASES[0]);
    expect(entries.at(-1)?.id).toBe(60);
  });

  it("preserves explicit admin sort-order overrides over calendar ordering", async () => {
    const priority = databaseEntry({ date: "August 2026", createdAt: new Date("2026-08-01T00:00:00Z") });
    readDatabase([priority]);
    const entries = await caller().list();
    expect(entries[0]).toEqual(priority);
    expect(entries[1]).toEqual(PLATFORM_RELEASES[0]);
  });

  it("does not silently discard an editable announcement with the same title as a bundled release", async () => {
    // Existing merge is additive, not a title-based database replacement API.
    const editable = databaseEntry({ title: PLATFORM_RELEASES[0].title });
    readDatabase([editable]);
    const matching = (await caller().list()).filter(entry => entry.title === editable.title);
    expect(matching.map(entry => entry.id)).toEqual([editable.id, PLATFORM_RELEASES[0].id]);
  });

  it("uses descending creation time then ID to break sort-order ties", async () => {
    const older = databaseEntry({ id: 5, createdAt: new Date("2026-11-18T00:00:00Z") });
    const newer = databaseEntry({ id: 2 });
    const sameTime = databaseEntry({ id: 3 });
    readDatabase([older, newer, sameTime]);
    expect((await caller().list()).slice(0, 3).map(entry => entry.id)).toEqual([3, 2, 5]);
  });

  it("reads the database again on subsequent public calls rather than caching an old list", async () => {
    readDatabase([]);
    const before = await caller().list();
    readDatabase([databaseEntry()]);
    const after = await caller().list();
    expect(getDb).toHaveBeenCalledTimes(2);
    expect(after).toHaveLength(before.length + 1);
    expect(after[0].title).toBe("Admin announcement");
  });

  it("shows hidden editable database rows only in the administrator history", async () => {
    const hidden = databaseEntry({ visible: false });
    const { where } = readDatabase([hidden]);
    const entries = await caller("admin").adminList();
    expect(where).not.toHaveBeenCalled();
    expect(entries.find(entry => entry.id === hidden.id)).toMatchObject({ visible: false, origin: "database" });
    expect(entries.find(entry => entry.id === PLATFORM_RELEASES[0].id)?.origin).toBe("bundled");
  });

  it("defaults a new admin announcement ahead of both database and bundled releases", async () => {
    const values = vi.fn().mockResolvedValue([{ insertId: 42 }]);
    getDb.mockResolvedValue({
      select: vi.fn().mockReturnValue({ from: vi.fn().mockResolvedValue([{ minimum: 0 }]) }),
      insert: vi.fn().mockReturnValue({ values }),
    });
    await expect(caller("admin").create({ date: "November 19, 2026", title: "A new release", body: "Published by an admin." })).resolves.toEqual({ id: 42 });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      sortOrder: nextChangelogSortOrder(Math.min(...PLATFORM_RELEASES.map(entry => entry.sortOrder))),
    }));
  });

  it("preserves an explicitly chosen admin order when creating a release", async () => {
    const values = vi.fn().mockResolvedValue([{ insertId: 43 }]);
    getDb.mockResolvedValue({
      select: vi.fn().mockReturnValue({ from: vi.fn().mockResolvedValue([{ minimum: -30_000 }]) }),
      insert: vi.fn().mockReturnValue({ values }),
    });
    await caller("admin").create({ date: "November 19, 2026", title: "An ordered release", body: "Admin-selected order.", sortOrder: 7 });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ sortOrder: 7 }));
  });

  it("keeps bundled negative IDs outside the editable database mutation API", async () => {
    await expect(caller("admin").update({ id: PLATFORM_RELEASES[0].id, body: "Not editable here." })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller("admin").delete({ id: PLATFORM_RELEASES[0].id })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("requires administrator authorization before reading hidden history or writing announcements", async () => {
    await expect(caller("user").adminList()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller("user").create({ date: "November 19, 2026", title: "Not allowed", body: "Not published." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("keeps the public page live and provides the missing admin editor", () => {
    const about = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/pages/About.tsx"),
      "utf8",
    );
    const admin = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/pages/Admin.tsx"),
      "utf8",
    );
    const manager = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/components/ChangelogManager.tsx"),
      "utf8",
    );
    const router = fs.readFileSync(
      path.resolve(process.cwd(), "server/routers/changelogRouter.ts"),
      "utf8",
    );

    expect(about).not.toContain("Last updated: Aug 12, 2026");
    expect(about).toContain("latestChangelogTimestamp");
    expect(admin).toContain('id: "changelog"');
    expect(admin).toContain("<ChangelogManager />");
    expect(manager).toContain("utils.changelog.list.invalidate()");
    expect(router).toContain("Math.min(orderRow?.minimum ?? 0");
    expect(router).toContain('origin: "bundled" as const');
    expect(router).toContain('origin: "database" as const');
    expect(manager).toContain('entry.origin === "database"');
    expect(router).toContain("desc(changelog.createdAt)");
    expect(router).toContain("PLATFORM_RELEASES");
    expect(PLATFORM_RELEASES.some(release => release.title === "A complete free OIT preview")).toBe(true);
    expect(PLATFORM_RELEASES[0].date).toBe("November 19, 2026");
  });
});
