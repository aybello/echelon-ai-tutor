const { chromium } = require('playwright');
const { spawn } = require('child_process');
const OUT = '/tmp/claude-0/-home-user-echelon-ai-tutor/0e6dc4c6-dfed-5d26-9c2a-f17854a01d3e/scratchpad/ce-shots';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5188', '--host', '127.0.0.1'], {
    cwd: '/home/user/cepr',
    env: { ...process.env, VITE_OAUTH_PORTAL_URL: 'https://auth.example.com', VITE_APP_ID: 'demo' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let up = false;
  srv.stdout.on('data', d => { if (String(d).includes('5188')) up = true; });
  srv.stderr.on('data', d => process.stderr.write(String(d).slice(0, 200)));
  for (let i = 0; i < 90 && !up; i++) await new Promise(r => setTimeout(r, 1000));
  const b = await chromium.launch();
  for (const [name, w, h] of [['desktop', 1280, 900], ['phone', 390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.route('**/api/trpc/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ result: { data: { json: null } } }]) }));
    p.on('pageerror', e => console.log(name, 'pageerror', String(e).slice(0, 200)));
    await p.goto('http://127.0.0.1:5188/continuing-education', { waitUntil: 'networkidle', timeout: 90000 }).catch(e => console.log('goto', String(e).slice(0, 150)));
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${OUT}/${name}-top.png` });
    const el = await p.$('#ceu-group-foundations');
    if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/${name}-foundations.png` }); }
    const info = await p.evaluate(() => ({ groups: [...document.querySelectorAll('.ceu-group-title')].map(e => e.textContent), cards: document.querySelectorAll('.ceu-course-card').length, covers: [...document.querySelectorAll('.ceu-course-cover')].map(i => i.naturalWidth), h1: document.querySelector('h1')?.textContent, hscroll: document.documentElement.scrollWidth > innerWidth }));
    console.log(name, JSON.stringify(info));
    await ctx.close();
  }
  await b.close(); srv.kill();
})();
