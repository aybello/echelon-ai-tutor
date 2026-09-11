import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { analyseOitAnswerCues } from '../scripts/lib/oitAnswerCues.mjs';
const root = 'content/class1-treatment/';
const manifest=JSON.parse(readFileSync(root+'manifest.json','utf8'));
const banks=['water','wastewater'].map(n=>JSON.parse(readFileSync(root+`questions/${n}-250.json`,'utf8')));
describe('Class 1 Treatment expansion package',()=>{
 it('reproduces every generated file from its authored sources',()=>{
  expect(()=>execFileSync('python3',['scripts/class1-treatment.py','check'],{stdio:'pipe'})).not.toThrow();
 });
 for(const [i,name] of ['water','wastewater'].entries()){
  const rows=banks[i];
  it(`${name}: binds 250 unique candidate identities to the correct bank`,()=>{
   expect(rows).toHaveLength(250);
   expect(new Set(rows.map((q:any)=>q.questionNum)).size).toBe(250);
   expect(rows.every((q:any)=>q.bankKey===(i===0?'class1-water':'class1-wastewater'))).toBe(true);
   expect(rows.filter((q:any)=>q.isCalc==='yes')).toHaveLength(50);
  });
  it(`${name}: retains canonical keys after option ordering`,()=>{
   for(const q of rows){expect(q.options[q.correctIndex]).toBe(q.correctAnswer);expect(new Set(q.options).size).toBe(4);for(let j=0;j<4;j++)expect(q[`option${'ABCD'[j]}`]).toBe(q.options[j]);}
   expect([0,1,2,3].map(j=>rows.filter((q:any)=>q.correctIndex===j).length).sort()).toEqual([62,62,63,63]);
  });
  it(`${name}: rejects obvious answer-length and qualifier shortcuts`,()=>{
   const c=analyseOitAnswerCues(rows);
   expect(c.longTells).toEqual([]);expect(c.shortTells).toEqual([]);expect(c.qualifierTells).toEqual([]);
   expect(c.longestRate).toBeLessThan(.4);expect(c.shortestRate).toBeLessThan(.5);
  });
  it(`${name}: independently recalculates numerical keys in JavaScript`,()=>{
   for(const q of rows.filter((q:any)=>q.isCalc==='yes')){
    expect(q.expression).toMatch(/^[\d\s.()+*/-]+$/);
    const v=Function(`"use strict";return (${q.expression})`)();
    expect(Number.isFinite(v)).toBe(true);
    const scale=10**q.decimalPlaces;
    expect(Math.round((v+1e-10)*scale)/scale).toBe(Number(q.expected));
    expect(parseFloat(q.correctAnswer)).toBe(Number(q.expected));
    expect(JSON.parse(q.steps)).toHaveLength(3);
    if(q.unit==='%')for(const o of q.options)expect(parseFloat(o)).toBeLessThanOrEqual(100);
   }
  });
  it(`${name}: verifies the release content checksum`,()=>{
   const m=manifest.banks[i];expect(createHash('sha256').update(readFileSync(root+m.file)).digest('hex')).toBe(m.sha256);
  });
 }
 it('keeps CT arithmetic separate from organism-specific treatment adequacy',()=>{
  const q=banks[0].find((q:any)=>q.topic==='CT arithmetic');
  expect(q.question).toContain('does not establish organism-specific adequacy');expect(parseFloat(q.correctAnswer)).toBe(21);
 });
 it('includes effluent solids losses in the complete retention example',()=>{
  const q=banks[1].find((q:any)=>q.topic==='Total-loss retention');expect(q.expression).toBe('2880/(260+28)');expect(parseFloat(q.correctAnswer)).toBe(10);
 });
 it('does not create a mandatory individual-approval workflow or an import side effect',()=>{
  expect(manifest.individualApprovalRequired).toBe(false);expect(manifest.productionWrites).toBe(false);
  for(const rows of banks)expect(rows.every((q:any)=>q.reviewStatus==='unreviewed')).toBe(true);
 });
});
