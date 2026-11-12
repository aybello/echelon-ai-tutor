import './test-safety.cjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { OPT_IN } = require('./test-safety.cjs');
const root = path.resolve(import.meta.dirname, '..');
const preload = path.join(root, 'scripts/test-safety.cjs');
const base = { PATH: process.env.PATH, HOME: '/tmp' };
function node(code, env = {}, args = ['-r', preload, '-e', code]) {
  return spawnSync(process.execPath, args, { cwd: root, env: { ...base, ...env }, encoding: 'utf8', timeout: 10000 });
}
const safe = { ECHELON_TEST_DATABASE: OPT_IN };
const blocked = result => { assert.notEqual(result.status, 0, result.stderr); assert.match(result.stderr, /\[test safety\]/); };

test('preflight rejects both inherited URLs, cutover selectors and credentials before imports', () => {
  for (const env of [
    { DATABASE_URL: 'mysql://user:pw@production.invalid/live' },
    { DATABASE_URL: 'mysql://u:p@127.0.0.1/echelon_ci' },
    { ...safe, DATABASE_URL: 'mysql://u:p@127.0.0.1/live' },
    { ...safe, EXTERNAL_DATABASE_URL: 'mysql://u:p@production.invalid/echelon_ci' },
    { ...safe, DATABASE_URL: 'mysql://u:p@127.0.0.1/echelon_ci?database=production' },
    { ...safe, DATABASE_CUTOVER_USE_EXTERNAL_TARGET: 'true' },
    { ...safe, DATABASE_CUTOVER_TARGET_DATABASE: 'production' },
    { ANTHROPIC_API_KEY: 'fake-inherited-key' },
  ]) blocked(node("throw Error('module evaluated')", env));
  assert.equal(node("console.log('ok')", { ...safe, DATABASE_URL: 'mysql://root:root@127.0.0.1:3306/echelon_ci' }).status, 0);
});

test('Vitest rejects a synthetic inherited target during config startup', () => {
  const result = spawnSync('/usr/bin/env', ['-u', 'NODE_OPTIONS', process.execPath, path.join(root, 'node_modules/vitest/vitest.mjs'), 'run', 'server/db.cutover.test.ts'], { cwd: root, env: { ...base, DATABASE_URL: 'mysql://u:p@production.invalid/live' }, encoding: 'utf8', timeout: 10000 });
  blocked(result);
  assert.doesNotMatch(result.stdout, /Test Files\s+1 passed/);
});

test('real mysql2 promise, callback, pools and option overrides fail before connecting', () => {
  const code = `const p=require('mysql2/promise'), m=require('mysql2'); (async()=>{
    for (const f of [() => p.createConnection('mysql://u:p@remote.invalid/live'),
      () => m.createConnection({host:'127.0.0.1',database:'production'}),
      () => p.createConnection({uri:'mysql://u:p@127.0.0.1/echelon_ci',database:'production'}),
      () => m.createPool({host:'remote.invalid',database:'echelon_ci'}).getConnection(()=>{}),
      () => p.createPool({host:'127.0.0.1',database:'production'}).getConnection(),
      () => m.createConnection({host:'127.0.0.1',database:'echelon_ci',stream:()=>{throw Error('stream reached')}})]) {
       try { await f(); throw Error('not blocked'); } catch(e) { if (!e.message.includes('[test safety]')) throw e; }
    }})().catch(e=>{console.error(e);process.exit(1)})`;
  const result = node(code, safe); assert.equal(result.status, 0, result.stderr);
});

test('Node descendants inherit the guard even with a changed DATABASE_URL', () => {
  const code = `const {spawnSync}=require('node:child_process');const r=spawnSync(process.execPath,['-e','console.log("BAD")'],{env:{...process.env,DATABASE_URL:'mysql://u:p@remote.invalid/live'},encoding:'utf8'}); if(r.status===0||!r.stderr.includes('[test safety]')||r.stdout.includes('BAD')) process.exit(1);`;
  const result = node(code, safe); assert.equal(result.status, 0, result.stderr);
});

test('Node descendants remain guarded with an explicitly replaced environment', () => {
  const code = `const {spawnSync}=require('node:child_process');const r=spawnSync(process.execPath,['-e','console.log("BAD")'],{env:{DATABASE_URL:'mysql://u:p@remote.invalid/live'},encoding:'utf8'});if(r.status===0||!r.stderr.includes('[test safety]'))process.exit(1)`;
  const result = node(code, safe); assert.equal(result.status, 0, result.stderr);
});

test('remote sockets and arbitrary direct database sockets are blocked before connect', () => {
  const code = `const net=require('node:net'); for (const fn of [()=>net.connect(443,'192.0.2.1'),()=>net.connect(3306,'127.0.0.1'),()=>net.connect('/tmp/mysql.sock')]) {try{fn();throw Error('not blocked')}catch(e){if(!e.message.includes('[test safety]'))throw e}}`;
  const result = node(code, safe); assert.equal(result.status, 0, result.stderr);
});

test('local MySQL may only be attempted with explicit opt-in and approved selected schema', () => {
  const code = `const {validDatabase}=require(${JSON.stringify(preload)});const base={host:'127.0.0.1',port:3306,database:'echelon_ci'};if(!validDatabase(base)||validDatabase({...base,database:'production'})||validDatabase({...base,host:'localhost'})||validDatabase({...base,stream:{}}))process.exit(1)`;
  const result = node(code, safe); assert.equal(result.status, 0, result.stderr);
});

test('the actual mysql2 selected config is checked before socket creation', () => {
  const code = `const net=require('node:net');net.Socket.prototype.connect=function(){throw Error('validated connect reached')};const m=require('mysql2');
    try{m.createConnection({uri:'mysql://u:p@127.0.0.1/echelon_ci',database:'production'});process.exit(1)}catch(e){if(!e.message.includes('[test safety]'))throw e}
    try{m.createConnection({uri:'mysql://u:p@127.0.0.1/echelon_ci'});process.exit(1)}catch(e){if(!e.message.includes('validated connect reached'))throw e}`;
  const result = node(code, safe); assert.equal(result.status, 0, result.stderr);
});
