import {test,expect} from '@playwright/test';
import fs from 'node:fs';

test.beforeEach(async ({page})=>{
  await page.route('https://analytics.example.test/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
});

test('unknown routes are real 404s and WPI identity matches initial HTML',async({page,request})=>{
  const missing=await request.get('/not-a-real-audit-page');
  expect(missing.status()).toBe(404);expect(await missing.text()).toContain('noindex');
  expect(await missing.text()).not.toContain('rel="canonical" href="https://echeloninstitute.ca/"');
  const wpi=await request.get('/wpi');expect(wpi.status()).toBe(200);expect(await wpi.text()).toContain('Water Professionals International');
  await page.goto('/wpi');await expect(page.locator('body')).toContainText('Water Professionals International');
  await expect(page.locator('body')).not.toContainText('Western Provinces Institute');
});

test('finder and pricing retain product and province after reload and Back',async({page})=>{
  await page.goto('/');
  const finder=page.locator('.course-finder');
  await finder.locator('select').nth(0).selectOption('on');
  await finder.locator('select').nth(1).selectOption('wastewater-treatment');
  await finder.locator('select').nth(2).selectOption('class1-ww');
  await expect(page).toHaveURL(/product=class1-ww/);
  await page.reload();await expect(finder.locator('select').nth(2)).toHaveValue('class1-ww');
  await finder.getByRole('link',{name:'View access plans'}).click();
  await expect(page).toHaveURL(/pricing\?product=class1-ww&province=ON/);
  await page.reload();await expect(page).toHaveURL(/product=class1-ww/);
  await page.goBack();await expect(finder.locator('select').nth(2)).toHaveValue('class1-ww');
});

test('corrected sludge volume is visible on the formula page',async({page})=>{
  await page.goto('/formulas-ww1');
  await expect(page.locator('body')).toContainText('18.75');
  await expect(page.locator('body')).toContainText('0.001');
});

test('partnership errors retain fields and retries reuse a receipt key',async({page})=>{
  const inputs:any[]=[];let fail=true;
  await page.route('**/api/trpc/contact.partnership*',async route=>{
    const j=route.request().postDataJSON();inputs.push(j);
    if(fail){fail=false;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify([{error:{json:{message:'Inquiry could not be saved. Please retry.',code:-32603,data:{code:'SERVICE_UNAVAILABLE',httpStatus:503,path:'contact.partnership'}}}}])});return;}
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{result:{data:{json:{success:true,receiptId:1}}}}])});
  });
  await page.goto('/partnerships');
  await page.getByPlaceholder('Jane Smith').fill('Synthetic Inquiry');
  await page.getByPlaceholder('Kingston Utilities').fill('Synthetic Utility');
  await page.locator('input[type="email"]').fill('inquiry@example.test');
  await page.locator('select').selectOption({index:1});
  await page.locator('textarea').fill('A synthetic browser inquiry to test saved retry behavior.');
  await page.getByRole('button',{name:'Send Partnership Inquiry'}).click();
  await expect(page.getByRole('button',{name:'Retry inquiry'})).toBeVisible();
  await expect(page.getByPlaceholder('Jane Smith')).toHaveValue('Synthetic Inquiry');
  await page.getByRole('button',{name:'Retry inquiry'}).click();
  await expect.poll(()=>inputs.length).toBe(2);
  await expect(page.getByText('Inquiry received',{exact:true})).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  const key=(x:any)=>x?.['0']?.json?.requestKey??x?.json?.requestKey??x?.requestKey;
  expect(inputs).toHaveLength(2);expect(key(inputs[0])).toBeTruthy();expect(key(inputs[1])).toBe(key(inputs[0]));
});

test('actual vendor script emits only rebuilt public events and no sensitive URLs',async({page})=>{
  const script=fs.readFileSync(new URL('./fixtures/analytics-vendor.js', import.meta.url),'utf8');
  const sends:string[]=[];
  await page.route('https://analytics.example.test/**',route=>{
    if(route.request().url().endsWith('/umami'))return route.fulfill({status:200,contentType:'application/javascript',body:script});
    sends.push(route.request().postData()??'');return route.fulfill({status:200,contentType:'application/json',body:'{}'});
  });
  await page.goto('/pricing?email=synthetic-secret@example.test&token=synthetic-secret#private');
  await expect.poll(()=>sends.length).toBeGreaterThan(0);
  for(const x of sends){expect(x).not.toContain('synthetic-secret');expect(x).not.toContain('?email');expect(x).not.toContain('#private');}
  const prior=sends.length;
  await page.evaluate(()=>{history.pushState({},'', '/account?token=synthetic-sensitive');(window as any).umami?.track('private_test',{email:'synthetic-sensitive@example.test'});});
  await page.waitForTimeout(200);expect(sends).toHaveLength(prior);
  await page.evaluate(()=>history.pushState({},'','/blog/private-slug?token=synthetic-private#secret'));
  await expect.poll(()=>sends.length).toBeGreaterThan(prior);
  expect(sends.at(-1)).toContain('/blog/:slug');expect(sends.at(-1)).not.toContain('private-slug');expect(sends.at(-1)).not.toContain('synthetic-private');
});

const class2LiveCountFixtures = [
  { path: '/class2-water', bankKey: 'class2-water', total: 753, module: 'Treatment Process' },
  { path: '/class2-water-dist', bankKey: 'class2-water-dist', total: 785, module: 'General' },
  { path: '/class2-ww', bankKey: 'class2-wastewater', total: 796, module: 'Treatment Process Evaluation & Adjustment' },
  { path: '/class2-wastewater-coll', bankKey: 'class2-wastewater-coll', total: 810, module: 'Collection System Components' },
];

test('Class II quiz headers use current bank metadata rather than static inventory claims', async ({ page }) => {
  let active = class2LiveCountFixtures[0];
  await page.route(/https:\/\/.*(?:google|doubleclick|googlesyndication).*\//, route => route.abort());
  await page.route('**/api/trpc/**', async route => {
    const names = decodeURIComponent(new URL(route.request().url()).pathname.split('/api/trpc/')[1]).split(',');
    const question = { id: 3001, module: active.module, difficulty: 'medium', question: 'Synthetic Class II header-count question.', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'Synthetic test only.', isCalc: false };
    const results = names.map(name => {
      const data = name === 'auth.me' || name === 'dashboardAuth.me' ? null
        : name === 'stripe.checkAccess' ? { hasAccess: true, unlockedExamTypes: [active.bankKey] }
        : name === 'quiz.getBankMeta' ? { bankKey: active.bankKey, modules: [active.module], totalQuestions: active.total, contentVersion: 99 }
        : name === 'quiz.getModuleOverviews' ? {}
        : name === 'quiz.getMissedQuestions' ? { questionIds: [], total: 0 }
        : name === 'quiz.getAttemptStats' ? { seenIds: [], missedIds: [] }
        : name === 'quiz.getRandomQuestions' || name === 'quiz.getQuestions' ? { questions: [question], total: 1, hasMore: false, locked: false }
        : { success: true };
      return { result: { data: { json: data } } };
    });
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(new URL(route.request().url()).searchParams.has('batch') ? results : results[0]) });
  });
  for (const fixture of class2LiveCountFixtures) {
    active = fixture;
    await page.goto(fixture.path);
    await expect(page.getByTestId('practice-question')).toBeVisible();
    await expect(page.getByText(`${fixture.total} questions`, { exact: false })).toBeVisible();
    await expect(page.getByText('500 questions', { exact: false })).toHaveCount(0);
  }
});

const scoreFixtures = [
  { id: 1, learnerName: "Example Learner With A Long Name", learnerEmail: "long.learner.address@example.test", sessionId: "synthetic-score-1", examType: "oit", stream: "water", score: 72, total: 100, passed: "yes", timeTakenSeconds: 1800, createdAt: "2026-10-06T07:00:09.000Z", moduleBreakdown: null },
  { id: 2, learnerName: null, learnerEmail: "email.only@example.test", sessionId: "synthetic-score-2", examType: "class1-water", stream: "water", score: 6, total: 10, passed: "no", timeTakenSeconds: 0, createdAt: "2026-10-06T06:00:00.000Z", moduleBreakdown: null },
  { id: 3, learnerName: null, learnerEmail: null, sessionId: "synthetic-score-3", examType: "oit", stream: "water", score: 8, total: 10, passed: "yes", timeTakenSeconds: null, createdAt: "2026-10-05T06:00:00.000Z", moduleBreakdown: null },
];
async function mockAdminHistory(page: import('@playwright/test').Page, role = 'admin', historyError = false) {
  const calls: string[] = [];
  await page.route(/https:\/\/.*(?:google|doubleclick|googlesyndication).*\//, route => route.abort());
  await page.route('**/api/trpc/**', async route => {
    const names = new URL(route.request().url()).pathname.split('/api/trpc/')[1].split(',');
    calls.push(...names);
    const results = names.map(name => {
      if (name === 'admin.getScoreHistory' && historyError) return { error: { json: { message: 'Synthetic unavailable history', code: -32603, data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500, path: name } } } };
      const data = name === 'auth.me' ? { id: 99, role, name: 'Synthetic Admin', email: 'admin@example.test', phone: '+14165550100' }
        : name === 'admin.getScoreHistory' ? scoreFixtures
        : name === 'admin.stats' ? { trialCount: 0, waitlistCount: 0, errorCount: 0, scoreCount: 3, purchaseCount: 0, subscriptionCount: 0, totalRevenueCAD: 0, feedbackCount: 0, avgRating: 0, triggerCount: 0 }
        : null;
      return { result: { data: { json: data } } };
    });
    await route.fulfill({ json: results });
  });
  return calls;
}
for (const width of [1280, 390]) {
  test(`admin history shows who and when, retaining CSV and internal scrolling at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await mockAdminHistory(page);
    await page.goto('/admin');
    if (width < 1024) await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    await page.getByRole('button', { name: 'Score history', exact: true }).click();
    const history = page.getByRole('region', { name: 'Exam score history', exact: true });
    await expect(history).toBeVisible();
    await expect(history.getByRole('columnheader', { name: 'Learner', exact: true })).toBeVisible();
    await expect(history.getByText('Example Learner With A Long Name', { exact: true })).toBeVisible();
    await expect(history.getByText('long.learner.address@example.test', { exact: true })).toBeVisible();
    await expect(history).toContainText('Email-only learner');
    await expect(history).toContainText('Unidentified learner');
    await expect(history).toContainText('No email recorded');
    await expect(history).toContainText('0m 0s');
    const timestamp = history.locator('time').first();
    await expect(timestamp).toHaveAttribute('datetime', scoreFixtures[0].createdAt);
    await expect(timestamp).toContainText('2026');
    await expect(timestamp).toContainText(/\d+:\d+:\d+/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    if (width === 390) {
      expect(await history.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
      await history.evaluate(el => { el.scrollLeft = el.scrollWidth; });
    }
    await expect(history.getByRole('columnheader', { name: 'Saved at', exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`admin-score-history-${width}.png`), fullPage: true });
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download CSV/ }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
    const csv = Buffer.concat(chunks).toString('utf8');
    expect(csv).toContain('learner_name,learner_email');
    expect(csv).toContain('saved_at_utc');
    expect(csv).toContain('long.learner.address@example.test');
    expect(csv).toContain(scoreFixtures[0].createdAt);
  });
}
test('admin history reports a load error instead of an empty result', async ({ page }) => {
  await mockAdminHistory(page, 'admin', true);
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Score history', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Score history could not be loaded');
  await expect(page.getByText('No exam results yet.', { exact: true })).toHaveCount(0);
});
test('admin history stays inaccessible to a normal learner and never requests its identity rows', async ({ page }) => {
  const calls = await mockAdminHistory(page, 'user');
  await page.goto('/admin');
  await expect(page.getByText('Admin access only', { exact: true })).toBeVisible();
  expect(calls).not.toContain('admin.getScoreHistory');
  await expect(page.getByText('long.learner.address@example.test', { exact: true })).toHaveCount(0);
});
