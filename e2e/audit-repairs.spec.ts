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
  await expect(page.locator('body')).toContainText('saved');
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
