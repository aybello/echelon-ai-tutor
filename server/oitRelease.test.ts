import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error CLI ESM module
import { planOitRelease, releaseOitPackage } from '../scripts/lib/oitRelease.mjs';

const q = { bankKey: 'oit', questionNum: 1001, module: 'Water', difficulty: 'easy', question: 'Which sample?', options: ['A','B','C','D'], correctIndex: 0, explanation: 'Explanation', isCalc: 'no' };
const payloads = [{ bankKey: 'oit', questions: [q] }];
const stored = (extra = {}) => ({ ...q, reviewStatus: 'in_review', ...extra });

describe('exact OIT batch release', () => {
  it('publishes only matching staged package rows and preserves unrelated drafts', () => {
    const plan = planOitRelease(payloads, [stored(), stored({ questionNum: 77, question: 'Other draft' }), stored({ questionNum: 2, question: 'Existing', reviewStatus: 'approved' })]);
    expect(plan.ready).toBe(true);
    expect(plan.changes).toEqual([{ bankKey: 'oit', questionNum: 1001 }]);
    expect(plan.banks[0].expectedVisibleAfter).toBe(2);
  });
  it.each(['approved', 'unreviewed'])('does not republish or withdraw %s rows', reviewStatus => {
    expect(planOitRelease(payloads, [stored({reviewStatus})]).changes).toEqual([]);
  });
  it.each([
    [], [stored(), stored()], [stored({ explanation: 'Changed' })],
    [stored({ reviewStatus: 'rejected' })], [stored({ options: '{bad' })],
    [stored(), stored({ questionNum: 8 })], [stored({reviewStatus:'unknown'})],
  ].map(rows => ({rows})))('blocks incomplete or unsafe database state %#', ({rows}) => {
    expect(planOitRelease(payloads, rows).ready).toBe(false);
  });
  it('never writes during rollback-only reconciliation', async () => {
    const connection = {beginTransaction:vi.fn(),query:vi.fn(),rollback:vi.fn(),execute:vi.fn(async (sql:string) => sql.includes('question_bank_meta') ? [[{bankKey:'oit'}]] : [[stored()]])};
    const plan = await releaseOitPackage(connection, payloads);
    expect(plan.ready).toBe(true);
    expect(connection.beginTransaction).toHaveBeenCalledOnce();
    expect(connection.query).not.toHaveBeenCalled();
    expect(connection.execute.mock.calls.every(([sql]) => sql.startsWith('SELECT'))).toBe(true);
    expect(connection.rollback).toHaveBeenCalledOnce();
  });
  it('rolls back instead of committing after an update failure', async () => {
    const connection = {beginTransaction:vi.fn(),rollback:vi.fn(),commit:vi.fn(),execute:vi.fn(async (sql:string) => {
      if (sql.startsWith('UPDATE')) throw new Error('write failed');
      return sql.includes('question_bank_meta') ? [[{bankKey:'oit'}]] : [[stored()]];
    })};
    await expect(releaseOitPackage(connection, payloads, true)).rejects.toThrow('write failed');
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.commit).not.toHaveBeenCalled();
  });
  it('checks both banks before making any update', async () => {
    const connection = {beginTransaction:vi.fn(),rollback:vi.fn(),commit:vi.fn(),execute:vi.fn(async (sql:string, values:string[]) => {
      if (sql.includes('question_bank_meta')) return [[{bankKey:values[0]}]];
      return [values[0] === 'oit' ? [stored()] : []];
    })};
    await expect(releaseOitPackage(connection, [...payloads, {bankKey:'oit-ww', questions:[{...q,bankKey:'oit-ww'}]}], true)).rejects.toThrow('missing');
    expect(connection.execute.mock.calls.every(([sql]) => sql.startsWith('SELECT'))).toBe(true);
    expect(connection.commit).not.toHaveBeenCalled();
  });
  it('commits exact visible totals and publishes without fabricating human approval', async () => {
    const connection = {beginTransaction:vi.fn(),rollback:vi.fn(),commit:vi.fn(),execute:vi.fn(async (sql:string) => {
      if (sql.startsWith('UPDATE')) return [{affectedRows:1}];
      if (sql.includes('COUNT(*)')) return [[{total:1}]];
      return sql.includes('question_bank_meta') ? [[{bankKey:'oit'}]] : [[stored()]];
    })};
    const result = await releaseOitPackage(connection, payloads, true);
    expect(result.applied).toBe(true);
    expect(connection.commit).toHaveBeenCalledOnce();
    expect(connection.execute.mock.calls.some(([sql]) => sql.includes("reviewStatus = 'unreviewed'"))).toBe(true);
  });
});
