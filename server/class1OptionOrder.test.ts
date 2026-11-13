import { describe, it, expect } from 'vitest';
import { class1OptionOrder, class1DisplayLetter } from '../client/src/lib/class1OptionOrder';
describe('Class 1 display order preserves canonical answers', () => {
 it('preserves every answer index through display, click, save, reload and review', () => {
  for (const bank of ['class1-water','class1-ww','class1-water-dist','class1-wastewater-coll']) for (let id = 1; id <= 800; id++) {
   const options = ['first canonical','second canonical','third canonical','fourth canonical'];
   const order = class1OptionOrder(bank,id,4); expect([...order].sort()).toEqual([0,1,2,3]);
   for (const key of [0,1,2,3]) {
    const display = order.indexOf(key); const selectedIndex = order[display];
    const saved = JSON.parse(JSON.stringify({selectedIndex}));
    expect(saved.selectedIndex).toBe(key); expect(options[saved.selectedIndex]).toBe(options[key]);
    expect(class1OptionOrder(bank,id,4).indexOf(saved.selectedIndex)).toBe(display);
    expect(class1DisplayLetter(bank,id,4,key)).toBe('ABCD'[display]);
   }
  }
 });
 it('normalizes wastewater aliases and leaves other banks and legacy missing ids unchanged', () => {
  expect(class1OptionOrder('class1-ww',120,4)).toEqual(class1OptionOrder('class1-wastewater',120,4));
  for (const args of [['oit',1,4],['class1-water',undefined,4],['class1-water',0,4],['class1-water','1',4],['class1-water',1,3]] as const) {
   expect(class1OptionOrder(args[0],args[1],args[2])).toEqual(Array.from({length:args[2]},(_,i)=>i));
  }
 });
 it('does not concentrate a constant canonical key in one displayed position', () => {
  const counts=[0,0,0,0]; for(let id=1;id<=1000;id++)counts[class1OptionOrder('class1-water',id,4).indexOf(1)]++;
  expect(Math.min(...counts)).toBeGreaterThan(190); expect(Math.max(...counts)).toBeLessThan(310);
 });
});
