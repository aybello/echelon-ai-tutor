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

// Strip the wrapper-injected NODE_OPTIONS only to simulate an incorrectly started
// runner in a fresh, credential-free Node process; all inputs below are synthetic.
function lateNode(code, args = ['-e', code]) {
  return spawnSync('/usr/bin/env', ['-u', 'NODE_OPTIONS', process.execPath, ...args], {
    cwd: root, env: base, encoding: 'utf8', timeout: 10000,
  });
}

test('callback and promisified exec/execFile retain outputs, errors, child and replacement-env guard', async () => {
  const { exec, execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  for (const [fn, args] of [
    [execFile, [process.execPath, ['-e', "process.stdout.write('out');process.stderr.write('err')"]]],
    [exec, [`${JSON.stringify(process.execPath)} -e "process.stdout.write('out');process.stderr.write('err')"`]],
  ]) {
    const options = { env: { LANG: 'C.UTF-8' }, encoding: 'utf8' };
    const callback = await new Promise((resolve, reject) => fn(...args, options, (error, stdout, stderr) => error ? reject(error) : resolve({ stdout, stderr })));
    assert.deepEqual(callback, { stdout: 'out', stderr: 'err' });
    const pending = promisify(fn)(...args, options);
    assert.ok(pending.child && typeof pending.child.pid === 'number');
    assert.deepEqual(await pending, { stdout: 'out', stderr: 'err' });
  }
  for (const [fn, args] of [
    [execFile, [process.execPath, ['-e', "process.stdout.write('out');process.stderr.write('err');process.exit(7)"]]],
    [exec, [`${JSON.stringify(process.execPath)} -e "process.stdout.write('out');process.stderr.write('err');process.exit(7)"`]],
  ]) {
    const options = { env: { LANG: 'C.UTF-8' }, encoding: 'utf8' };
    await assert.rejects(promisify(fn)(...args, options), error => error.code === 7 && error.stdout === 'out' && error.stderr === 'err');
    await new Promise((resolve, reject) => fn(...args, options, (error, stdout, stderr) => {
      try { assert.equal(error.code, 7); assert.equal(stdout, 'out'); assert.equal(stderr, 'err'); resolve(); } catch (e) { reject(e); }
    }));
  }
  for (const [fn, args] of [
    [execFile, [process.execPath, ['-e', "console.log('BAD')"]]],
    [exec, [`${JSON.stringify(process.execPath)} -e "console.log('BAD')"`]],
  ]) {
    await assert.rejects(promisify(fn)(...args, { env: { DATABASE_URL: 'mysql://u:p@remote.invalid/live' } }), error => /\[test safety\]/.test(error.stderr) && !error.stdout.includes('BAD'));
  }
});

test('exec and execFile callbacks and promises support nullish options and argument placeholders', { timeout: 20000 }, async () => {
  const { exec, execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const command = `${JSON.stringify(process.execPath)} -e "process.stdout.write('out')"`;
  const fileArgs = [process.execPath, ['-e', "process.stdout.write('out')"]];
  // A no-argument executable also exercises omitted or nullish argument lists.
  for (const [fn, args, expected] of [
    [exec, [command], 'out'],
    [execFile, fileArgs, 'out'],
    [execFile, ['/bin/echo'], '\n'],
    [execFile, ['/bin/echo', null], '\n'],
    [execFile, ['/bin/echo', undefined], '\n'],
  ]) {
    for (const suffix of [[], [null], [undefined]]) {
      const callback = await new Promise((resolve, reject) => {
        let timer;
        const child = fn(...args, ...suffix, (error, stdout, stderr) => {
          clearTimeout(timer);
          error ? reject(error) : resolve({ stdout, stderr });
        });
        timer = setTimeout(() => { child.kill(); reject(new Error('callback did not settle')); }, 3000);
      });
      assert.deepEqual(callback, { stdout: expected, stderr: '' });
      const pending = promisify(fn)(...args, ...suffix);
      assert.ok(pending.child && typeof pending.child.pid === 'number');
      let timer;
      try {
        const timeout = new Promise((_, reject) => { timer = setTimeout(() => { pending.child.kill(); reject(new Error('promise did not settle')); }, 3000); });
        assert.deepEqual(await Promise.race([pending, timeout]), { stdout: expected, stderr: '' });
      } finally { clearTimeout(timer); }
    }
  }
});

test('nullish exec options retain error outputs and the descendant guard', { timeout: 10000 }, async () => {
  const { exec, execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const script = "process.stdout.write(String(!!globalThis.__echelonTestSafetyInstalled));process.stderr.write('err');process.exit(7)";
  for (const [fn, args] of [
    [exec, [`${JSON.stringify(process.execPath)} -e ${JSON.stringify(script)}`]],
    [execFile, [process.execPath, ['-e', script]]],
  ]) {
    for (const option of [null, undefined]) {
      await new Promise((resolve, reject) => fn(...args, option, (error, stdout, stderr) => {
        try { assert.equal(error.code, 7); assert.equal(stdout, 'true'); assert.equal(stderr, 'err'); resolve(); } catch (e) { reject(e); }
      }));
      await assert.rejects(promisify(fn)(...args, option), error => error.code === 7 && error.stdout === 'true' && error.stderr === 'err');
    }
  }
});

test('spawn, fork and synchronous overloads preserve argument placeholders, guard and stdin', { timeout: 10000 }, async () => {
  const { spawn, spawnSync, fork, execSync, execFileSync } = await import('node:child_process');
  const fs = await import('node:fs');
  const os = await import('node:os');
  for (const placeholder of [null, undefined]) {
    // With no argument list, Node reads its program from stdin.
    const check = spawnSync(process.execPath, placeholder, { input: "process.stdout.write(String(!!globalThis.__echelonTestSafetyInstalled))", encoding: 'utf8', env: {} });
    assert.equal(check.status, 0, check.stderr);
    assert.equal(check.stdout, 'true', check.stderr);
    assert.equal(execFileSync('/bin/cat', placeholder, { input: 'stdin', encoding: 'utf8' }), 'stdin');
    const asyncChild = spawn('/bin/echo', placeholder, { env: {} });
    let output = '';
    asyncChild.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
    const code = await new Promise((resolve, reject) => { asyncChild.once('error', reject); asyncChild.once('close', resolve); });
    assert.equal(code, 0);
    assert.equal(output, '\n');
  }
  const cat = spawn('/bin/cat', { env: {} });
  let catOutput = '';
  cat.stdout.setEncoding('utf8').on('data', chunk => { catOutput += chunk; });
  const catExit = new Promise((resolve, reject) => { cat.once('error', reject); cat.once('close', resolve); });
  cat.stdin.end('streamed stdin');
  assert.equal(await catExit, 0);
  assert.equal(catOutput, 'streamed stdin');
  assert.equal(execSync('/bin/cat', { input: 'stdin', encoding: 'utf8' }), 'stdin');
  assert.equal(execFileSync('/bin/cat', { input: 'stdin', encoding: 'utf8' }), 'stdin');
  assert.throws(() => spawnSync('/bin/echo', [], null), { code: 'ERR_INVALID_ARG_TYPE' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'echelon-safety-fork-'));
  try {
    const fixture = path.join(dir, 'fixture.cjs');
    fs.writeFileSync(fixture, "process.send({guard: !!globalThis.__echelonTestSafetyInstalled, dotenv: process.env.DOTENV_CONFIG_PATH});\n");
    for (const args of [[null, { env: {}, silent: true }], [undefined, { env: {}, silent: true }], [[], null], [[], undefined]]) {
      const child = fork(fixture, ...args);
      const exited = new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(`fork exited ${code}`))); });
      const message = await new Promise((resolve, reject) => { child.once('error', reject); child.once('message', resolve); });
      assert.deepEqual(message, { guard: true, dotenv: '/dev/null' });
      await exited;
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('late guard installation rejects preloaded direct, promise and pool mysql2 classes', () => {
  for (const setup of [
    "const m=require('mysql2'); const f=m.createConnection",
    "const m=require('mysql2/promise'); const f=m.createConnection",
    "const m=require('mysql2'); const p=m.createPool({host:'127.0.0.1',database:'echelon_ci'})",
    "const m=require('mysql2/promise'); const p=m.createPool({host:'127.0.0.1',database:'echelon_ci'})",
    "const C=require('mysql2/lib/base/connection.js')",
  ]) {
    // The last internal path is not exported by mysql2: use its actual filename.
    const statement = setup.replace("require('mysql2/lib/base/connection.js')", "require(require('node:path').join(require.resolve('mysql2').replace(/index\\.js$/, ''),'lib/base/connection.js'))");
    blocked(lateNode(`${statement};require(${JSON.stringify(preload)});console.log('BAD')`));
  }
});

test('ESM import order rejects late installation and a startup preload guards ESM mysql2', () => {
  const late = `import mysql from 'mysql2'; import ${JSON.stringify(preload)}; console.log('BAD')`;
  blocked(lateNode(late, ['--input-type=module', '-e', late]));
  const guarded = `import mysql from 'mysql2'; import promise from 'mysql2/promise'; for(const f of [()=>mysql.createConnection({host:'127.0.0.1',database:'live'}),()=>mysql.createPool({host:'127.0.0.1',database:'live'}).getConnection(()=>{}),()=>promise.createConnection({host:'127.0.0.1',database:'live'}),()=>promise.createPool({host:'127.0.0.1',database:'live'}).getConnection()]) {try {await f();throw Error('not blocked')} catch(e) {if(!e.message.includes('[test safety]'))throw e}}`;
  const result = node(guarded, safe, ['-r', preload, '--input-type=module', '-e', guarded]);
  assert.equal(result.status, 0, result.stderr);
});

test('runner config requires first startup preload rather than late installation', () => {
  const args = [path.join(root, 'node_modules/vitest/vitest.mjs'), 'run', 'server/jobPdfText.test.ts'];
  const result = lateNode('', args);
  blocked(result);
  assert.doesNotMatch(result.stdout, /Test Files\s+1 passed/);
  const preloadedFirst = lateNode('', ['-r', 'mysql2', '-r', preload, '-e', "console.log('BAD')"]);
  blocked(preloadedFirst);
  assert.doesNotMatch(preloadedFirst.stdout, /BAD/);
});

test('dotenv direct and ESM config cannot load synthetic env files', () => {
  const code = `const fs=require('node:fs'),os=require('node:os'),path=require('node:path');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dotenv-synthetic-'));try{process.chdir(dir);fs.writeFileSync('.env','SYNTHETIC_DOTENV_VALUE=loaded\\n');const d=require('dotenv');d.config({quiet:true});d.configDotenv();if(process.env.SYNTHETIC_DOTENV_VALUE)process.exit(1);try{d.config({path:'.env'});process.exit(1)}catch(e){if(!e.message.includes('[test safety]'))throw e}}finally{fs.rmSync(dir,{recursive:true,force:true})}`;
  const result = node(code);
  assert.equal(result.status, 0, result.stderr);
  const esm = `import { config } from 'dotenv';try{config({path:'.env'});process.exit(1)}catch(e){if(!e.message.includes('[test safety]'))throw e}`;
  const esmResult = node(esm, {}, ['-r', preload, '--input-type=module', '-e', esm]);
  assert.equal(esmResult.status, 0, esmResult.stderr);
  blocked(lateNode(`require('dotenv');require(${JSON.stringify(preload)});console.log('BAD')`));
});
