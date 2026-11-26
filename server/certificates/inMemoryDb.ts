/**
 * In-memory test double for the Drizzle database handle, used only by the
 * certificate service and alert job tests (production code never imports
 * this). It implements the small chainable surface those modules use —
 * select/from/where/orderBy/limit, insert/values/$returningId,
 * update/set/where, delete/where — over plain row arrays.
 *
 * Where-conditions are interpreted by walking the Drizzle SQL chunk tree and
 * applying `column = value` equality filters. Other operators (for example
 * the alert job's expiry window) are intentionally not interpreted: callers
 * that need precision filter in memory, exactly as the job does.
 */
import { Column, Param, SQL, StringChunk } from "drizzle-orm";
import {
  certificateAlerts,
  certificateAuditLog,
  certificateEvidence,
  certificates,
  organizationMembers,
  organizations,
  users,
} from "../../drizzle/schema";

type Row = Record<string, unknown> & { id?: number };

interface EqFilter {
  column: string;
  value: unknown;
}

function extractEqFilters(condition: unknown): EqFilter[] {
  const filters: EqFilter[] = [];
  let pendingColumn: string | null = null;
  let pendingOp: string | null = null;

  const walk = (node: unknown): void => {
    if (node == null) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (node instanceof SQL) {
      for (const chunk of node.queryChunks) walk(chunk);
      return;
    }
    if (node instanceof Column) {
      pendingColumn = node.name;
      pendingOp = null;
      return;
    }
    if (node instanceof StringChunk) {
      const text = node.value.join("");
      if (/[<>=]/.test(text)) pendingOp = text.trim();
      return;
    }
    if (node instanceof Param) {
      if (pendingColumn && (pendingOp === "=" || pendingOp === null)) {
        filters.push({ column: pendingColumn, value: node.value });
      }
      pendingColumn = null;
      pendingOp = null;
      return;
    }
    if (
      typeof node === "object" &&
      "queryChunks" in (node as Record<string, unknown>)
    ) {
      for (const chunk of (node as SQL).queryChunks) walk(chunk);
    }
  };

  walk(condition);
  return filters;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a instanceof Date || b instanceof Date) {
    const timeA =
      a instanceof Date ? a.getTime() : new Date(a as string).getTime();
    const timeB =
      b instanceof Date ? b.getTime() : new Date(b as string).getTime();
    return timeA === timeB;
  }
  return a === b;
}

function matches(row: Row, filters: EqFilter[]): boolean {
  const valuesByColumn = new Map<string, unknown>();
  for (const filter of filters) {
    const previous = valuesByColumn.get(filter.column);
    if (
      valuesByColumn.has(filter.column) &&
      !valuesEqual(previous, filter.value)
    ) {
      return false;
    }
    valuesByColumn.set(filter.column, filter.value);
  }
  return filters.every(f => valuesEqual(row[f.column], f.value));
}

class SelectQuery implements PromiseLike<Row[]> {
  private filters: EqFilter[] = [];
  private ordered = false;
  private limitCount: number | null = null;

  constructor(private readonly rowsRef: () => Row[]) {}

  where(condition?: unknown): this {
    if (condition !== undefined) this.filters = extractEqFilters(condition);
    return this;
  }

  orderBy(): this {
    this.ordered = true;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  for(_lock: "update"): this {
    return this;
  }

  private execute(): Row[] {
    let rows = this.rowsRef().filter(row => matches(row, this.filters));
    if (this.ordered) {
      rows = [...rows].sort((a, b) => {
        const timeA = a.expiresAt instanceof Date ? a.expiresAt.getTime() : 0;
        const timeB = b.expiresAt instanceof Date ? b.expiresAt.getTime() : 0;
        return timeA - timeB;
      });
    }
    if (this.limitCount != null) rows = rows.slice(0, this.limitCount);
    return rows.map(row => ({ ...row }));
  }

  then<TResult1 = Row[], TResult2 = never>(
    onFulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve()
      .then(() => this.execute())
      .then(onFulfilled, onRejected);
  }

  catch<TResult = never>(
    onRejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ): Promise<Row[] | TResult> {
    return this.then(undefined, onRejected ?? undefined);
  }
}

export interface InMemoryDb {
  db: unknown;
  rows: {
    users: Row[];
    organizations: Row[];
    organizationMembers: Row[];
    certificates: Row[];
    certificateAlerts: Row[];
    certificateAuditLog: Row[];
    certificateEvidence: Row[];
  };
}

export function createInMemoryDb(
  seed: Partial<InMemoryDb["rows"]> = {}
): InMemoryDb {
  const rows: InMemoryDb["rows"] = {
    users: [...(seed.users ?? [])],
    organizations: [...(seed.organizations ?? [])],
    organizationMembers: [...(seed.organizationMembers ?? [])],
    certificates: [...(seed.certificates ?? [])],
    certificateAlerts: [...(seed.certificateAlerts ?? [])],
    certificateAuditLog: [...(seed.certificateAuditLog ?? [])],
    certificateEvidence: [...(seed.certificateEvidence ?? [])],
  };

  const storeFor = (table: unknown): Row[] => {
    if (table === users) return rows.users;
    if (table === organizations) return rows.organizations;
    if (table === organizationMembers) return rows.organizationMembers;
    if (table === certificates) return rows.certificates;
    if (table === certificateAlerts) return rows.certificateAlerts;
    if (table === certificateAuditLog) return rows.certificateAuditLog;
    if (table === certificateEvidence) return rows.certificateEvidence;
    throw new Error("In-memory DB: unknown table");
  };

  const nextId = (store: Row[]): number =>
    store.reduce(
      (max, row) => Math.max(max, typeof row.id === "number" ? row.id : 0),
      0
    ) + 1;

  const db = {
    select: () => ({
      from: (table: unknown) => new SelectQuery(() => storeFor(table)),
    }),
    insert: (table: unknown) => ({
      values: (values: Row) => {
        const store = storeFor(table);
        const now = new Date();
        if (table === certificateAlerts) {
          const duplicate = store.find(
            existing =>
              existing.certificateId === values.certificateId &&
              existing.thresholdDays === values.thresholdDays &&
              valuesEqual(existing.expiresAt, values.expiresAt) &&
              existing.recipientEmail === values.recipientEmail
          );
          if (duplicate)
            throw Object.assign(
              new Error(
                "Duplicate entry for key 'certificate_alerts_unique_idx'"
              ),
              { code: "ER_DUP_ENTRY", errno: 1062 }
            );
        }
        const row: Row = {
          ...values,
          id: nextId(store),
          createdAt: values.createdAt ?? now,
          updatedAt: values.updatedAt ?? now,
          ...(table === certificateAlerts && values.sentAt === undefined
            ? { sentAt: null }
            : {}),
          ...(table === certificateAlerts && values.status === undefined
            ? { status: "pending" }
            : {}),
          ...(table === certificateAlerts && values.attemptCount === undefined
            ? { attemptCount: 0 }
            : {}),
        };
        store.push(row);
        const result = Promise.resolve([
          { insertId: row.id, affectedRows: 1 },
        ]) as Promise<Array<{ insertId: number; affectedRows: number }>> & {
          $returningId: () => Promise<Array<{ id: number }>>;
        };
        result.$returningId = async () => [{ id: row.id as number }];
        return result;
      },
    }),
    update: (table: unknown) => ({
      set: (patch: Row) => ({
        where: (condition: unknown) => {
          const filters = extractEqFilters(condition);
          let affected = 0;
          for (const row of storeFor(table)) {
            if (matches(row, filters)) {
              Object.assign(row, patch);
              affected += 1;
            }
          }
          return Promise.resolve([{ affectedRows: affected }]);
        },
      }),
    }),
    transaction: async <T>(
      callback: (tx: unknown) => Promise<T>
    ): Promise<T> => {
      const snapshot = Object.fromEntries(
        Object.entries(rows).map(([key, value]) => [
          key,
          (value as Row[]).map(row =>
            Object.fromEntries(
              Object.entries(row).map(([field, item]) => [
                field,
                item instanceof Date ? new Date(item.getTime()) : item,
              ])
            )
          ),
        ])
      ) as InMemoryDb["rows"];
      try {
        return await callback(db);
      } catch (error) {
        for (const [key, value] of Object.entries(snapshot)) {
          const target = rows[key as keyof InMemoryDb["rows"]] as Row[];
          target.splice(0, target.length, ...(value as Row[]));
        }
        throw error;
      }
    },
    delete: (table: unknown) => ({
      where: (condition: unknown) => {
        const filters = extractEqFilters(condition);
        const store = storeFor(table);
        let affected = 0;
        for (let i = store.length - 1; i >= 0; i -= 1) {
          if (matches(store[i], filters)) {
            store.splice(i, 1);
            affected += 1;
          }
        }
        return Promise.resolve([{ affectedRows: affected }]);
      },
    }),
  };

  return { db, rows };
}
