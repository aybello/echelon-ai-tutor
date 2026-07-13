import { readFileSync, writeFileSync } from 'fs';

const files = [
  { path: '/tmp/c1-wd-new.json', bank: 'class1-water-dist' },
  { path: '/tmp/c2-wd-new.json', bank: 'class2-water-dist' },
  { path: '/tmp/c1-wc-new.json', bank: 'class1-wastewater-coll' },
  { path: '/tmp/c2-wc-new.json', bank: 'class2-wastewater-coll' },
];

for (const { path, bank } of files) {
  const qs = JSON.parse(readFileSync(path, 'utf8'));
  const bad = qs.filter(q => !q.question || !q.options || q.correctIndex === undefined || !q.explanation);
  console.log(`${bank}: ${bad.length} bad / ${qs.length} total`);
  if (bad.length > 0) {
    bad.slice(0, 3).forEach(q => {
      console.log(`  Q${q.questionNum}: missing=${Object.entries({question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation}).filter(([k,v]) => v === undefined || v === null || v === '').map(([k]) => k).join(',')}`);
    });
    // Filter out bad questions and save
    const good = qs.filter(q => q.question && q.options && q.correctIndex !== undefined && q.explanation);
    console.log(`  Keeping ${good.length} good questions`);
    writeFileSync(path, JSON.stringify(good, null, 2));
  }
}
