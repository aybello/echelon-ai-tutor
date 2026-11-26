import { MySqlDialect } from "drizzle-orm/mysql-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { organizations, questions, teamFlexLicences } from "../../drizzle/schema";
import { getAllCourses, resolveCourseKey } from "../../shared/courseRegistry";

const { getDb, trackEvent, sendEmail } = vi.hoisted(() => ({
  getDb: vi.fn(), trackEvent: vi.fn(), sendEmail: vi.fn(),
}));
vi.mock("../db", () => ({ getDb }));
vi.mock("../analytics", () => ({ trackEvent }));
vi.mock("../email", () => ({ sendCoursePassInvitationEmail: sendEmail }));
import { changeFlexLicenceCourse } from "./flexLicenceService";

const dialect = new MySqlDialect();
type Row = Record<string, unknown>;

// Evaluate the actual compiled Drizzle conjunction, not a mocked eq/and helper.
// Unknown SQL fails the test rather than silently accepting a weakened predicate.
function matches(condition: Parameters<MySqlDialect["sqlToQuery"]>[0], row: Row) {
  const query = dialect.sqlToQuery(condition);
  let index = 0;
  const terms = query.sql.replace(/[()]/g, "").split(/\s+and\s+/i);
  const values = terms.map(term => {
    const equality = /^`[^`]+`\.`([^`]+)` = \?$/.exec(term.trim());
    if (equality) return row[equality[1]] === query.params[index++];
    const nullable = /^`[^`]+`\.`([^`]+)` is null$/i.exec(term.trim());
    if (nullable) return row[nullable[1]] === null;
    throw new Error(`Unsupported predicate in synthetic storage: ${term}`);
  });
  expect(index).toBe(query.params.length);
  return values.every(Boolean);
}

function storage(options: {
  courseKey?: string; status?: string; activatedAt?: Date | null;
  province?: string; missingOrg?: boolean;
  race?: Row; result?: unknown; lowBank?: string;
} = {}) {
  const row: Row = {
    id: 4201, organizationId: 7001, courseKey: "wpi-class4-water",
    status: "assigned", activatedAt: null, operatorUserId: 1001,
    invitedEmail: "operator@echelon.test", termMonths: 3,
    ...Object.fromEntries(Object.entries(options).filter(([key]) => ["courseKey", "status", "activatedAt"].includes(key))),
  };
  const org = { id: 7001, province: options.province ?? "nova-scotia", tier: "stream-water", managerEmail: "manager@echelon.test" };
  const writes: Array<ReturnType<MySqlDialect["sqlToQuery"]>> = [];
  const patches: Row[] = [];
  const reads: Array<{ table: unknown; query: ReturnType<MySqlDialect["sqlToQuery"]> }> = [];
  const db = {
    select: vi.fn(() => ({
      from: (table: unknown) => ({
        where: (condition: Parameters<MySqlDialect["sqlToQuery"]>[0]) => {
          reads.push({ table, query: dialect.sqlToQuery(condition) });
          return {
            limit: async () => {
              if (table === teamFlexLicences) return matches(condition, row) ? [{ ...row }] : [];
              if (table === organizations) return !options.missingOrg && matches(condition, org) ? [{ ...org }] : [];
              throw new Error("Unexpected table read");
            },
            groupBy: async () => {
              expect(table).toBe(questions);
              return getAllCourses().map(course => ({ bankKey: course.questionBankKey, questionCount: course.questionBankKey === options.lowBank ? 99 : 150 }));
            },
          };
        },
      }),
    })),
    update: vi.fn((table: unknown) => {
      expect(table).toBe(teamFlexLicences);
      return { set: (patch: Row) => ({ where: async (condition: Parameters<MySqlDialect["sqlToQuery"]>[0]) => {
        patches.push(patch);
        writes.push(dialect.sqlToQuery(condition));
        Object.assign(row, options.race);
        const matched = matches(condition, row);
        if (matched) Object.assign(row, patch);
        // mysql2 defaults to FOUND_ROWS: matched no-op rows still count as one.
        return options.result ?? [{ affectedRows: matched ? 1 : 0, changedRows: 0 }];
      } }) };
    }),
  };
  getDb.mockResolvedValue(db);
  return { db, row, writes, patches, reads };
}

async function change(target = "wpi-class4-wastewater") {
  return changeFlexLicenceCourse(4201, target, 7001);
}

afterEach(() => {
  expect(trackEvent).not.toHaveBeenCalled();
  expect(sendEmail).not.toHaveBeenCalled();
  vi.clearAllMocks();
});

describe("Flex course-change regional availability", () => {
  it.each(["wpi-class4-water-dist", "wpi-class4-water-coll", "wpi-class4-wastewater-coll"])("rejects NS treatment -> excluded %s, including aliases", async target => {
    const { db, row } = storage();
    await expect(change(target)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.update).not.toHaveBeenCalled();
    expect(row.courseKey).toBe("wpi-class4-water");
  });

  it("preserves NS Class IV treatment availability independently of the Annual stream tier", async () => {
    const { row, patches, reads } = storage();
    await expect(change()).resolves.toBeUndefined();
    expect(row.courseKey).toBe("wpi-class4-wastewater");
    expect(patches).toEqual([{ courseKey: "wpi-class4-wastewater" }]);
    const orgRead = reads.find(read => read.table === organizations);
    expect(orgRead?.query.params).toEqual([7001]);
    expect(orgRead?.query.sql).toBe("`organizations`.`id` = ?");
  });

  it.each(["wpi-class3-water-dist", "wpi-class3-water-coll"])("preserves certified NS %s", async target => {
    const { row } = storage({ courseKey: "wpi-class3-water" });
    await expect(change(target)).resolves.toBeUndefined();
    expect(row.courseKey).toBe(target);
  });

  it.each(["wpi-class4-water-dist", "wpi-class4-water-coll"])("keeps Western Class IV %s available", async target => {
    const { row } = storage({ province: "western" });
    await expect(change(target)).resolves.toBeUndefined();
    expect(row.courseKey).toBe(target);
  });

  it("keeps Ontario same-band courses available", async () => {
    const { row } = storage({ province: "ontario", courseKey: "class4-water" });
    await expect(change("class4-ww")).resolves.toBeUndefined();
    expect(row.courseKey).toBe("class4-ww");
  });

  it.each(["ontario", "unrecognized-region"])("fails closed for organization region %s with a WPI pass", async province => {
    const { db } = storage({ province });
    await expect(change()).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("fails closed when the organization is missing", async () => {
    const { db } = storage({ missingOrg: true });
    await expect(change()).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects a same-band target below the existing commercial bank minimum", async () => {
    const { db } = storage({ lowBank: "wpi-class4-wastewater" });
    await expect(change()).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.update).not.toHaveBeenCalled();
  });

  it.each(["wpi-class3-water", "class4-water", "unknown-course"])("preserves unknown/cross-band rejection for %s", async target => {
    const { db } = storage();
    await expect(change(target)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.update).not.toHaveBeenCalled();
  });
});

describe("Flex course-change compare-and-swap", () => {
  it.each(["unused", "invited", "assigned"])("writes with the exact observed %s state and all CAS guards", async status => {
    const { writes } = storage({ status });
    await expect(change()).resolves.toBeUndefined();
    expect(writes.map(({ sql, params }) => ({ sql, params }))).toEqual([{
      sql: "(`team_flex_licences`.`id` = ? and `team_flex_licences`.`organizationId` = ? and `team_flex_licences`.`status` = ? and `team_flex_licences`.`activatedAt` is null and `team_flex_licences`.`courseKey` = ?)",
      params: [4201, 7001, status, "wpi-class4-water"],
    }]);
  });

  it("uses the exact stored prior alias in CAS, but writes a canonical target", async () => {
    const prior = "wpi-class4-wastewater-coll";
    expect(resolveCourseKey(prior)?.courseKey).toBe("wpi-class4-water-coll");
    const { writes, row } = storage({ province: "western", courseKey: prior });
    await expect(change("wpi-class4-water")).resolves.toBeUndefined();
    expect(writes[0].params).toEqual([4201, 7001, "assigned", prior]);
    expect(row.courseKey).toBe("wpi-class4-water");
  });

  it.each([
    ["activation", { status: "active", activatedAt: new Date("2026-11-26T00:00:00Z") }],
    ["activation timestamp alone", { activatedAt: new Date("2026-11-26T00:00:00Z") }],
    ["cancellation", { status: "unused" }],
    ["revocation", { status: "revoked" }],
    ["another pending state", { status: "invited" }],
    ["another course change", { courseKey: "wpi-class4-water-coll" }],
    ["organization change", { organizationId: 7002 }],
  ] as const)("returns CONFLICT and preserves the winner of %s", async (_name, race) => {
    const { row } = storage({ race });
    await expect(change()).rejects.toMatchObject({ code: "CONFLICT" });
    expect(row).toMatchObject(race);
    expect(row.courseKey).toBe((race as Row).courseKey ?? "wpi-class4-water");
  });

  it("accepts a matching same-course no-op with affectedRows=1, changedRows=0", async () => {
    const { writes, row } = storage({ result: [{ affectedRows: 1, changedRows: 0 }] });
    await expect(change("wpi-class4-water")).resolves.toBeUndefined();
    expect(writes).toHaveLength(1);
    expect(row.courseKey).toBe("wpi-class4-water");
  });

  it("does not skip the CAS for a same-course request that loses to activation", async () => {
    storage({ race: { status: "active", activatedAt: new Date("2026-11-26T00:00:00Z") } });
    await expect(change("wpi-class4-water")).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it.each([0, 2])("requires exactly one affected row, rejecting %i even for a no-op", async affectedRows => {
    storage({ result: [{ affectedRows }] });
    await expect(change("wpi-class4-water")).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("also accepts the existing direct affectedRows result shape", async () => {
    storage({ result: { affectedRows: 1 } });
    await expect(change()).resolves.toBeUndefined();
  });

  it.each([
    { status: "active", activatedAt: new Date("2026-11-26T00:00:00Z") },
    { status: "revoked" },
    { status: "assigned", activatedAt: new Date("2026-11-26T00:00:00Z") },
  ])("preserves initial pre-activation rejection for %j", async prior => {
    const { db } = storage(prior);
    await expect(change()).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.update).not.toHaveBeenCalled();
  });
});
