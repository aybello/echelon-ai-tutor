import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, openSync, closeSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
const output = process.argv[2];
if (!output) throw new Error('Usage: interactiveMemoryAcceptance.mjs absolute-output-directory');
const cgroup = '/sys/fs/cgroup' + readFileSync('/proc/self/cgroup', 'utf8').trim().split(':').at(-1);
const metric = name => readFileSync(`${cgroup}/${name}`, 'utf8').trim();
if (metric('memory.max') !== '536870912' || metric('memory.swap.max') !== '0') throw new Error('Requires actual 512MiB cgroup, swap disabled');
const log = openSync(resolve(output, 'full-server.log'), 'w');
const server = spawn(process.execPath, ['--require', './scripts/interactiveMemoryOffline.cjs', 'dist/index.js'], { env: { PATH: process.env.PATH, HOME: '/tmp', NODE_ENV: 'production', PORT: '32415', INTERACTIVE_SAVED_PROGRESS_ENABLED: 'false' }, stdio: ['ignore', log, log] });
let peakRss = 0, startupRss = 0, requests = 0, failed = false;
const rss = () => { try { const kb = Number(readFileSync(`/proc/${server.pid}/status`, 'utf8').match(/^VmRSS:\s+(\d+)/m)?.[1] ?? 0); peakRss = Math.max(peakRss, kb * 1024); return kb * 1024; } catch { return 0; } };
const monitor = setInterval(rss, 20);
const base = 'http://127.0.0.1:32415';
async function rpc(method, input) {
  const response = await fetch(`${base}/api/trpc/interactive.${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ json: input }), signal: AbortSignal.timeout(30000) });
  if (response.status === 429) throw new Error('Harness rate budget exceeded');
  const data = await response.json(); requests++;
  if (!response.ok || data.error) throw new Error(`HTTP ${response.status} ${method}: ${JSON.stringify(data).slice(0, 400)}`);
  return data.result.data.json;
}
try {
  let ready = false;
  for (let i = 0; i < 180; i++) {
    if (server.exitCode !== null) throw new Error(`Full server exited ${server.exitCode}`);
    try { const response = await fetch(base + '/api/health'); if (response.ok) { ready = true; break; } } catch {}
    await sleep(250);
  }
  if (!ready) throw new Error('Full server did not become healthy');
  startupRss = rss(); console.log('Full built server ready', { startupRss, cgroupCurrent: metric('memory.current') });
  const registry = JSON.parse(readFileSync('dist/interactive-content/registry.json', 'utf8'));
  const courses = Object.keys(registry.courses); if (courses.length !== 38) throw new Error('Expected 38 courses');
  const modes = ['rapid-swipe', 'speed-match', 'odd-one-out', 'before-after', 'cause-effect', 'tap-the-flaw'];
  let windowStart = Date.now(), windowRequests = 0;
  async function budget(count) {
    if (windowRequests + count > 88) { const wait = Math.max(0, 62000 - (Date.now() - windowStart)); console.log(`Rate-limit cooldown ${wait}ms; requests=${requests}; peakRss=${peakRss}`); await sleep(wait); windowStart = Date.now(); windowRequests = 0; }
    windowRequests += count;
  }
  for (let pass = 0; pass < 2; pass++) {
    const order = pass ? [...courses].reverse() : courses;
    for (const [index, courseKey] of order.entries()) {
      await budget(8);
      const catalog = await rpc('getCatalog', { courseKey });
      if (!catalog.available || catalog.locked || catalog.modes.length !== 6) throw new Error('Invalid public catalog');
      const sessions = await Promise.all(modes.map(mode => rpc('startSession', { courseKey, mode, sessionSize: 50 })));
      for (const session of sessions) {
        const count = catalog.modes.find(mode => mode.mode === session.mode).totalCount;
        if (!session.available || session.locked || session.version !== catalog.version || session.totalAvailableCount !== count || session.examples.length > 50 || !session.examples.length) throw new Error('Invalid public session');
        if (new Set(session.examples.map(e => e.id)).size !== session.examples.length) throw new Error('Duplicate session IDs');
      }
      const progress = await rpc('getProgress', { courseKey }); if (progress.stored !== false) throw new Error('Progress must remain OFF');
      console.log(`pass=${pass + 1} course=${index + 1}/38 ${courseKey} requests=${requests} rss=${rss()} cgroup=${metric('memory.current')}`);
    }
  }
  await sleep(5000);
  const result = { status: 'passed', courses: courses.length, modes: modes.length, passes: 2, concurrency: 6, sessionSize: 50, requests, startupRss, peakRss, finalRss: rss(), cgroupMemoryMax: metric('memory.max'), cgroupSwapMax: metric('memory.swap.max'), cgroupMemoryPeak: metric('memory.peak'), cgroupEvents: metric('memory.events'), limitations: ['Test-only preload bypasses only missing-credentials validateEnv process.exit once; no database, JWT, payment, email, or provider credentials supplied.', 'All real HTTP router and engine code remains unmocked. External connections blocked by OS unit and test preload.', 'Cgroup peak includes harness process, server, private file page cache and concurrent responses.'] };
  if (/oom_kill [1-9]|oom [1-9]/.test(result.cgroupEvents)) throw new Error('Cgroup recorded OOM');
  writeFileSync(resolve(output, 'memory-result.json'), JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify(result));
} catch (error) { failed = true; console.error(error); writeFileSync(resolve(output, 'memory-failure.json'), JSON.stringify({ error: String(error), peakRss, memoryPeak: metric('memory.peak'), events: metric('memory.events') }, null, 2)); }
finally { clearInterval(monitor); server.kill('SIGTERM'); await Promise.race([new Promise(r => server.once('exit', r)), sleep(5000)]); if (server.exitCode === null) server.kill('SIGKILL'); closeSync(log); }
if (failed) process.exitCode = 1;
