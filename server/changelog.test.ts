import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatChangelogTimestamp,
  latestChangelogTimestamp,
  nextChangelogSortOrder,
} from "../shared/changelog";
import { PLATFORM_RELEASES } from "../shared/platformReleases";

describe("platform changelog", () => {
  it("places each automatically ordered entry ahead of the current first entry", () => {
    expect(nextChangelogSortOrder(null)).toBe(0);
    expect(nextChangelogSortOrder(0)).toBe(-1);
    expect(nextChangelogSortOrder(-7)).toBe(-8);
  });

  it("derives the public last-updated label from live entries", () => {
    const latest = latestChangelogTimestamp([
      { updatedAt: "2026-08-12T12:00:00.000Z" },
      { updatedAt: "2026-08-16T12:00:00.000Z" },
    ]);
    expect(latest?.toISOString()).toBe("2026-08-16T12:00:00.000Z");
    expect(formatChangelogTimestamp(null)).toBe("Updates load live");
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
    expect(router).toContain("nextChangelogSortOrder(orderRow?.minimum)");
    expect(router).toContain("desc(changelog.createdAt)");
    expect(router).toContain("PLATFORM_RELEASES");
    expect(PLATFORM_RELEASES[0].title).toBe("A complete free OIT preview");
  });
});
