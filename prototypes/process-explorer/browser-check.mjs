// Run against a wrapped preview: node browser-check.mjs /path/to/preview.html
// Optional CHROMIUM_EXECUTABLE and CHROMIUM_ARGS_JSON support portable Chromium.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const input = process.argv[2];
if (!input) throw new Error('Supply a wrapped preview HTML path');
const output = process.env.PREVIEW_EVIDENCE_DIR || '/tmp/process-explorer-evidence';
await mkdir(output, {recursive: true});
const document = await readFile(input);
const server = createServer((_request, response) => {
  response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(document);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE ? {executablePath: process.env.CHROMIUM_EXECUTABLE} : {}),
  args: JSON.parse(process.env.CHROMIUM_ARGS_JSON || '[]'),
});
const url = `http://127.0.0.1:${server.address().port}`;
const results = [], errors = [];
const check = name => { results.push(name); console.log('PASS', name); };
const hash = data => createHash('sha256').update(data).digest('hex');
async function open(options = {}, setup) {
  const page = await browser.newPage({viewport: {width: 780, height: 1200}, ...options});
  page.on('pageerror', error => errors.push(error.message));
  // Rendering and interaction must work without any network dependency.
  await page.route('https://**/*', route => route.abort());
  if (setup) await setup(page);
  await page.goto(url);
  return {page, frame: page.frameLocator('iframe')};
}
async function waitRender(frame) {
  await frame.locator('canvas[data-rendered="true"]').waitFor();
}
async function scrub(frame, value) {
  await frame.locator('#pe-progress').evaluate((element, next) => {
    element.value = String(next); element.dispatchEvent(new Event('input', {bubbles: true}));
  }, value);
}
try {
  const {page, frame} = await open({reducedMotion: 'reduce'});
  await waitRender(frame);
  const canvas = frame.locator('canvas');
  await page.waitForTimeout(150);
  assert.equal(await canvas.getAttribute('data-progress'), '0.00000');
  check('Reduced motion: starts paused, with a rendered model');
  const initialMemory = Number(await canvas.getAttribute('data-geometries'));
  for (const [index, name] of ['intake', 'coagulation', 'flocculation', 'sedimentation'].entries()) {
    await frame.locator(`[data-model="${index}"]`).click();
    await waitRender(frame);
    assert.equal(await canvas.getAttribute('data-model'), name);
    assert.equal(await frame.locator('#pe-inspect option').count(), 6);
    const still = hash(await canvas.screenshot());
    await frame.locator('#pe-play').click();
    await page.waitForTimeout(650);
    await frame.locator('#pe-play').click();
    assert(Number(await canvas.getAttribute('data-progress')) > 0);
    const stopped = await canvas.getAttribute('data-process-time');
    await page.waitForTimeout(150);
    assert.equal(await canvas.getAttribute('data-process-time'), stopped);
    assert.notEqual(hash(await canvas.screenshot()), still, `${name} must change actual pixels`);
    check(`${name}: animated pixels, progress and pause`);
    await scrub(frame, 650);
    const cutaway = hash(await canvas.screenshot());
    await frame.locator('#pe-cutaway').click();
    assert.notEqual(hash(await canvas.screenshot()), cutaway, `${name} cutaway changes geometry`);
    await frame.locator('#pe-cutaway').click();
    const overview = await frame.locator('#pe-detail').textContent();
    for (let part = 0; part < 5; part++) {
      await frame.locator('#pe-inspect').selectOption(String(part));
      assert.notEqual(await frame.locator('#pe-detail').textContent(), overview);
      assert.equal(await frame.locator('.pe-marker[aria-pressed="true"]').count(), 1);
    }
    await frame.locator('#pe-home').click();
    if (index) {
      await frame.locator('#pe-explode').click();
      assert(await frame.locator('#pe-play').isDisabled());
      assert(await frame.locator('#pe-progress').isDisabled());
      assert.equal(await frame.locator('#pe-explode').getAttribute('aria-pressed'), 'true');
      await page.screenshot({path: join(output, `${name}-exploded.png`), fullPage: true});
      await frame.locator('#pe-explode').click();
    }
    check(`${name}: cutaway, five inspection targets and assembly controls`);
    await scrub(frame, 1000);
    assert.equal(await frame.locator('#pe-play').textContent(), 'Replay process');
    await frame.locator('#pe-play').click();
    assert(Number(await canvas.getAttribute('data-progress')) < .1);
    await frame.locator('#pe-play').click();
    await scrub(frame, 370);
    await page.screenshot({path: join(output, `${name}-desktop.png`), fullPage: true});
  }
  check('All four journeys scrub, complete and replay');
  // Repeated switches must dispose old geometry instead of accumulating it.
  for (let cycle = 0; cycle < 3; cycle++) {
    for (let i = 0; i < 4; i++) await frame.locator(`[data-model="${i}"]`).click();
  }
  await frame.locator('[data-model="0"]').click();
  assert(Number(await canvas.getAttribute('data-geometries')) <= initialMemory + 1);
  check('Repeated process switches do not accumulate GPU geometry');
  const beforeOrbit = hash(await canvas.screenshot()), box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width * .7, box.y + box.height * .7);
  await page.mouse.down(); await page.mouse.move(box.x + box.width * .5, box.y + box.height * .6, {steps: 8}); await page.mouse.up();
  assert.notEqual(hash(await canvas.screenshot()), beforeOrbit);
  check('Pointer drag rotates actual geometry');
  await canvas.evaluate(element => {
    window.testContextExtension = element.getContext('webgl2').getExtension('WEBGL_lose_context');
    if (!window.testContextExtension) throw new Error('Context-loss simulation unavailable');
    window.testContextExtension.loseContext();
  });
  await frame.locator('#pe-error').waitFor({state: 'visible'});
  assert(await frame.locator('#pe-play').isDisabled());
  assert.equal(await frame.locator('#pe-status').textContent(), 'Restoring graphics');
  await page.waitForTimeout(100);
  await canvas.evaluate(() => window.testContextExtension.restoreContext());
  await waitRender(frame);
  await frame.locator('#pe-error').waitFor({state: 'hidden'});
  assert(!(await frame.locator('#pe-play').isDisabled()));
  check('WebGL context loss shows recovery and restores the working model');

  for (const width of [390, 320]) {
    const {page: mobile, frame: mobileFrame} = await open({viewport: {width, height: 1100}, isMobile: true, hasTouch: true, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce'});
    await waitRender(mobileFrame);
    for (let i = 0; i < 4; i++) {
      await mobileFrame.locator(`[data-model="${i}"]`).click();
      const layout = await mobileFrame.locator('#echelon-process-batch-one').evaluate(element => ({
        width: element.clientWidth, scroll: element.scrollWidth,
        document: document.documentElement.scrollWidth, viewport: innerWidth,
        controls: [...element.querySelectorAll('.pe-tools button:not([hidden]),.pe-models button')].map(button => button.getBoundingClientRect().height),
      }));
      assert(layout.scroll <= layout.width + 1 && layout.document <= layout.viewport + 1, JSON.stringify(layout));
      assert(layout.controls.every(height => height >= 44));
      await mobileFrame.locator('#pe-inspect').selectOption('2');
      await mobileFrame.locator('#pe-home').click();
    }
    await mobile.screenshot({path: join(output, `mobile-${width}-dark.png`), fullPage: true});
    check(`${width}px touch/dark layout: all four processes, inspection, no overflow, 44px controls`);
  }
  const {page: unavailable, frame: unavailableFrame} = await open({}, async page => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return String(type).startsWith('webgl') ? null : original.call(this, type, ...args);
      };
    });
  });
  await unavailableFrame.getByText('3D graphics are unavailable in this browser.', {exact: false}).waitFor();
  assert(await unavailableFrame.locator('#pe-play').isDisabled());
  assert.equal(await unavailableFrame.locator('#pe-status').textContent(), 'Unavailable');
  assert((await unavailableFrame.locator('#pe-view').boundingBox()).height < 200);
  await unavailable.screenshot({path: join(output, 'graphics-unavailable.png'), fullPage: true});
  check('Unavailable WebGL shows an explicit message instead of a blank panel');
  assert.deepEqual(errors, [], 'No uncaught browser exceptions');
  check('No uncaught exceptions with HTTPS requests blocked');
  await writeFile(join(output, 'results.json'), JSON.stringify({checks: results, errors}, null, 2));
} finally {
  await browser.close(); await new Promise(resolve => server.close(resolve));
}
