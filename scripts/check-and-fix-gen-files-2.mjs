import { readFileSync, writeFileSync } from 'fs';

const files = [
  { path: '/tmp/c3-wd-new.json', bank: 'class3-water-dist' },
  { path: '/tmp/c4-wd-new.json', bank: 'class4-water-dist' },
  { path: '/tmp/c3-wc-new.json', bank: 'class3-wastewater-coll' },
  { path: '/tmp/c4-wc-new.json', bank: 'class4-wastewater-coll' },
];

for (const { path, bank } of files) {
  const qs = JSON.parse(readFileSync(path, 'utf8'));
  const bad = qs.filter(q => !q.question || !q.options || q.correctIndex === undefined || !q.explanation);
  const good = qs.filter(q => q.question && q.options && q.correctIndex !== undefined && q.explanation);
  console.log(`${bank}: ${bad.length} bad / ${qs.length} total, keeping ${good.length}`);
  if (bad.length > 0) {
    bad.slice(0, 2).forEach(q => console.log(`  Q${q.questionNum}: missing fields`));
    writeFileSync(path, JSON.stringify(good, null, 2));
  }
}
console.log('Done checking all files.');
