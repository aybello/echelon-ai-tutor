import { describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
// @ts-expect-error CLI ESM module
import { buildBank, validateBank, calculate, reconcileBank, reconcileDatabase } from '../scripts/lib/class1Networks.mjs';

describe('Class 1 network content package', () => {
  it('keeps generated artifacts identical to validated source', () => {
    expect(() => execFileSync(process.execPath, ['scripts/class1-networks.mjs', 'check'], {stdio:'pipe'})).not.toThrow();
  });
  it.each(['distribution','collection'])('validates complete %s content and schema values', name => {
    const result = validateBank(name,buildBank(name));
    expect(result).toMatchObject({valid:true,count:250,calculations:50,answerPositions:[63,63,62,62]});
  });
  it('detects a wrong numeric answer rather than trusting its key', () => {
    const bank = buildBank('distribution');
    const q = bank.find((q:any)=>q.isCalc==='yes');
    q.correctAnswer = q.options[q.correctIndex] = '123 m³';
    expect(validateBank('distribution',bank).errors.join(' ')).toContain('arithmetic mismatch');
  });
  it('rejects duplicate options and unsupported cognitive metadata', () => {
    const bank = buildBank('collection');
    bank[0].options[1] = bank[0].options[0];
    bank[0].cognitiveLevel = 'understanding';
    const errors = validateBank('collection',bank).errors.join(' ');
    expect(errors).toContain('duplicate/missing options');
    expect(errors).toContain('invalid cognitive level');
  });
  it('keeps positive and negative numeric choices distinct', () => {
    const bank = buildBank('distribution');
    expect(bank.find((q:any)=>q.questionNum===2246).options).toContain('-4.0 %');
    expect(bank.find((q:any)=>q.questionNum===2246).options).toContain('4.0 %');
    expect(validateBank('distribution',bank).valid).toBe(true);
  });
  it.each(['process.exit()','1/0','1/*comment*/+2','Math.random()'])('rejects unsafe or invalid arithmetic %s', expression => {
    expect(()=>calculate(expression)).toThrow();
  });
  it('detects changed content, occupied IDs and duplicates even in rejected rows', () => {
    const q = buildBank('distribution')[0];
    const rows = [{...q,question:'Different existing question'}, {...q,questionNum:15,reviewStatus:'rejected'}];
    const report = reconcileBank('distribution',[q],rows);
    expect(report.conflicts).toEqual([2001]);
    expect(report.duplicateStems).toEqual([{candidate:2001,existing:15}]);
  });
  it('isolates banks and reports stored visibility without asserting publication', () => {
    const q = buildBank('distribution')[0];
    const otherBank = {...q,bankKey:'class1-wastewater-coll'};
    expect(reconcileBank('distribution',[q],[otherBank]).missing).toEqual([2001]);
    const stored = {...q,options:JSON.stringify(q.options),reviewStatus:'in_review'};
    expect(reconcileBank('distribution',[q],[stored]).matching).toEqual([{questionNum:2001,reviewStatus:'in_review'}]);
  });
  it('fails closed on malformed stored answers or changed worked steps', () => {
    const q = buildBank('distribution').find((q:any)=>q.isCalc==='yes');
    for (const row of [{...q,options:'{bad'}, {...q,steps:'[]'}])
      expect(reconcileBank('distribution',[q],[row]).conflicts).toEqual([q.questionNum]);
  });
  it('reconciles complete banks through SELECT only and rolls back', async () => {
    const connection = {beginTransaction:vi.fn(),execute:vi.fn(async()=>[[]]),rollback:vi.fn(),commit:vi.fn()};
    await reconcileDatabase(connection,{distribution:buildBank('distribution'),collection:buildBank('collection')});
    expect(connection.execute.mock.calls).toHaveLength(2);
    for (const call of connection.execute.mock.calls as unknown as [string,string[]][]) {
      expect(call[0]).toBe('SELECT * FROM questions WHERE bankKey = ?');
      expect(call[0]).not.toMatch(/LIMIT|UPDATE|INSERT|DELETE/);
    }
    expect(connection.rollback).toHaveBeenCalledOnce();
    expect(connection.commit).not.toHaveBeenCalled();
  });
  it('rolls back when the database read fails', async () => {
    const connection = {beginTransaction:vi.fn(),execute:vi.fn(async()=>{throw new Error('read failed');}),rollback:vi.fn()};
    await expect(reconcileDatabase(connection,{distribution:[]})).rejects.toThrow('read failed');
    expect(connection.rollback).toHaveBeenCalledOnce();
  });
  it('has no CLI database write mode', () => {
    expect(()=>execFileSync(process.execPath,['scripts/class1-networks.mjs','--apply'],{stdio:'pipe'})).toThrow();
  });
});
