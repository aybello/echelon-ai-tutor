// Extract all math/calculation questions from the question bank for auditing
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '../client/src/lib/questions.ts'), 'utf8');

// Strip TypeScript exports/interfaces to make it parseable
// We'll use regex to extract question objects
const questionsMatch = src.match(/export const QUESTIONS: Question\[\] = \[([\s\S]*)\];[\s\n]*export function/);
if (!questionsMatch) {
  console.error('Could not find QUESTIONS array');
  process.exit(1);
}

// Use a simpler approach: find all question blocks by id
const questionBlocks = [];
const idRegex = /\{\s*id:\s*(\d+),\s*module:\s*`([^`]+)`[^}]*?type:\s*"([^"]+)"[^}]*?difficulty:\s*"([^"]+)"[^}]*?q:\s*`([^`]+)`/gs;

// Better: parse the whole file as a module
// Write a temp file that exports the array as JSON-compatible
const tempContent = src
  .replace(/export interface[\s\S]*?(?=export const)/g, '')
  .replace(/export type[\s\S]*?(?=export const)/g, '')
  .replace(/export function[\s\S]*/g, '')
  .replace(/^export const OIT_MODULES[\s\S]*?(?=export const QUESTIONS)/m, '')
  .replace('export const QUESTIONS: Question[] = ', 'const QUESTIONS = ')
  .replace(/`/g, '"')
  .replace(/formula\?: string;/g, '')
  .replace(/steps\?: Step\[\];/g, '');

// Write as a simple evaluatable file
writeFileSync('/tmp/questions_raw.js', `
${tempContent}
module.exports = QUESTIONS;
`);

console.log('Extraction script prepared');
