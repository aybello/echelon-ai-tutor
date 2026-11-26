import { readFileSync } from 'fs';

const q = JSON.parse(readFileSync('/tmp/class1-water-topup.json', 'utf8'));
const first = q[0];
console.log('Keys:', Object.keys(first));
console.log('correctIndex:', first.correctIndex, typeof first.correctIndex);
console.log('options length:', first.options?.length);
console.log('explanation:', !!first.explanation);
console.log('Sample question:');
console.log(JSON.stringify(first, null, 2));
