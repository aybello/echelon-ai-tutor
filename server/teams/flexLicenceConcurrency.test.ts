import { MySqlDialect } from "drizzle-orm/mysql-core";
import { afterEach, describe, expect, it, vi } from "vitest";

const { getDb, trackEvent } = vi.hoisted(() => ({
  getDb: vi.fn(),
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../db", () => ({ getDb }));
vi.mock("../analytics", () => ({ trackEvent }));
vi.mock("../email", () => ({ sendCoursePassInvitationEmail: vi.fn() }));

import { assignFlexLicence, claimFlexLicence } from "./flexLicenceService";

const TOKEN = "a".repeat(64);
const TOKEN_HASH = "ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb";

function invitationFixture() {
  return {
    id: 42,
    organizationId: 7,
    courseKey: "class4-ww",
    status: "invited",
    invitedEmail: "operator@example.test",
    invitationToken: TOKEN_HASH,
    activationDeadline: new Date("2027-10-02T00:00:00Z"),
  };
}

function competingWriterDatabase(overrides: Record<string, unknown> = {}) {
  const row = { ...invitationFixture(), ...overrides };
  const where = vi.fn().mockResolvedValue([{ affectedRows: 0 }]);
  const set = vi.fn(() => ({ where }));
  const db = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([row]) })),
      })),
    })),
    update: vi.fn(() => ({ set })),
  };
  getDb.mockResolvedValue(db);
  return { db, row, where };
}

const dialect = new MySqlDialect();

afterEach(() => {
  vi.clearAllMocks();
});

describe("Team Flex competing assignment transitions", () => {
  it("rejects an invitation claim that lost to another assignment before it can emit a success event", async () => {
    const { where } = competingWriterDatabase();

    await expect(claimFlexLicence(TOKEN, "operator@example.test", 101))
      .rejects.toMatchObject({ code: "CONFLICT" });

    const predicate = dialect.sqlToQuery(where.mock.calls[0][0]);
    expect(predicate.sql).toContain("`team_flex_licences`.`id` = ?");
    expect(predicate.sql).toContain("`team_flex_licences`.`status` = ?");
    expect(predicate.sql).toContain("`team_flex_licences`.`invitationToken` = ?");
    expect(predicate.params).toEqual([42, "invited", TOKEN_HASH]);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("rejects a manager assignment that lost to another assignment instead of reporting false success", async () => {
    const { where } = competingWriterDatabase();

    await expect(assignFlexLicence(42, 202, 7))
      .rejects.toMatchObject({ code: "CONFLICT" });

    const predicate = dialect.sqlToQuery(where.mock.calls[0][0]);
    expect(predicate.sql).toContain("`team_flex_licences`.`organizationId` = ?");
    expect(predicate.sql).toContain("`team_flex_licences`.`status` = ?");
    expect(predicate.sql).toContain("`team_flex_licences`.`invitationToken` = ?");
    expect(predicate.params).toEqual([42, 7, "invited", TOKEN_HASH]);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("keeps the unused manager assignment scoped to its pre-read organization and status", async () => {
    const { where } = competingWriterDatabase({
      status: "unused",
      invitedEmail: null,
      invitationToken: null,
    });

    await expect(assignFlexLicence(42, 202, 7))
      .rejects.toMatchObject({ code: "CONFLICT" });

    const predicate = dialect.sqlToQuery(where.mock.calls[0][0]);
    expect(predicate.sql).toContain("`team_flex_licences`.`organizationId` = ?");
    expect(predicate.sql).toContain("`team_flex_licences`.`status` = ?");
    expect(predicate.sql).not.toContain("`team_flex_licences`.`invitationToken` = ?");
    expect(predicate.params).toEqual([42, 7, "unused"]);
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
