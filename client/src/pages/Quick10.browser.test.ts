import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser } from "@playwright/test";
import { build } from "esbuild";
let browser: Browser;
let script: string;
beforeAll(async () => {
  const result = await build({ bundle: true, write: false, format: "iife", jsx: "automatic",
    loader: { ".css": "empty" },
    alias: { "@": `${process.cwd()}/client/src`, "@shared": `${process.cwd()}/shared` },
    stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
      import React from 'react'; import {createRoot} from 'react-dom/client';
      import Quick10 from './client/src/pages/Quick10';
      import Quick10Button from './client/src/components/Quick10Button';
      import NextStepCard from './client/src/components/NextStepCard';
      createRoot(document.getElementById('root')).render(window.fixture==='cta'
        ? <><Quick10Button enabled={true} preferredCourseKey="electrician-309a"/><NextStepCard courseKey="electrician-309a"/></>
        : <Quick10/>);
    ` },
    plugins: [{ name: "synthetic-quick10", setup(builder) {
      builder.onResolve({filter:/^wouter$|^@\/lib\/trpc$|^@\/hooks\/usePageMeta$|^@\/components\/(QuizGate|SiteNav|PracticeSaveStatus)$|^@\/hooks\/useAssessmentActivity$/}, args=>({path:args.path,namespace:"fixture"}));
      builder.onLoad({filter:/.*/,namespace:"fixture"}, args=>({loader:"tsx",resolveDir:process.cwd(),contents: args.path==='wouter' ? `
        import React,{useState,useEffect} from 'react';
        const go=href=>{history.pushState({},'',href);dispatchEvent(new Event('popstate'))};
        export const Link=({href,children,...props})=><a href={href} {...props} onClick={e=>{e.preventDefault();go(href)}}>{children}</a>;
        export function useSearch(){const [s,set]=useState(location.search);useEffect(()=>{const fn=()=>set(location.search);addEventListener('popstate',fn);return()=>removeEventListener('popstate',fn)},[]);return s}
        export const useLocation=()=>[location.pathname,go];
      ` : args.path==='@/lib/trpc' ? `
        window.saves=[];window.starts=[];window.nextQueries=[];
        const courses=[{courseKey:'class1-water',shortName:'Water',displayName:'Water'},{courseKey:'class2-water',shortName:'Water II',displayName:'Water II'}];
        export const trpc={quick10:{courses:{useQuery:()=>({data:{courses:window.noCourses?[]:courses,currentCourseKey:window.noCourses?'electrician-309a':'class1-water'}})},
          start:{useMutation:()=>({mutateAsync:async input=>{window.starts.push(input);return {courseKey:input.courseKey||'class1-water',courseName:'Synthetic water',locked:false,attemptToken:'synthetic-receipt',questions:Array.from({length:10},(_,i)=>({id:i+1,module:'Safety',isCalc:false,question:'Synthetic question '+(i+1),options:['Synthetic correct','Synthetic wrong']}))}}})},
          answer:{useMutation:()=>({mutateAsync:async input=>{window.saves.push(input);if(window.failFirstAnswer&&window.saves.length===1)throw Error('Synthetic offline');return {saved:true,correct:input.selectedIndex===0,correctIndex:0,explanation:'Synthetic saved explanation',steps:[{l:'Given',c:'Synthetic worked step'}]}}})}},
          dashboard:{nextStep:{useQuery:(input,options)=>{window.nextQueries.push({input,options});return {data:{step:{message:'Continue with missed questions',buttonLabel:'Retry mistakes',action:{type:'missed-questions'}}}}}}}};
      ` : args.path==='@/components/QuizGate' ? 'export default function Gate(){return null}'
        : args.path==='@/components/SiteNav' ? 'import React from "react"; export default function SiteNav(){return <header className="echelon-site-header"><nav aria-label="Echelon navigation">Course navigation</nav></header>}'
        : args.path==='@/components/PracticeSaveStatus' ? 'export const useVerifiedPracticeSaveScope=()=>({identity:"synthetic-learner",courseKey:"class1-water"});'
        : args.path==='@/hooks/useAssessmentActivity' ? 'export const useAssessmentActivity=()=>({observe:()=>{},retry:async()=>{},saveError:null});'
        : 'export const usePageMeta=()=>{};' }));
    }}],
  });
  script=result.outputFiles[0].text;
  browser=await chromium.launch({headless:true});
},30000);
afterAll(async()=>{await browser?.close()});
async function setup(width:number, fixture="quiz", noCourses=false, failFirstAnswer=false){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('**/*',route=>route.request().url().startsWith('https://synthetic.echelon.test/')?route.fulfill({contentType:'text/html',body:'<div id="root"></div>'}):route.abort());
  await page.goto('https://synthetic.echelon.test/quick-10?course=class1-water');
  await page.evaluate(({fixture,noCourses,failFirstAnswer})=>Object.assign(window,{fixture,noCourses,failFirstAnswer}),{fixture,noCourses,failFirstAnswer});
  await page.addScriptTag({content:script});return page;
}
describe('Quick 10 synthetic browser interactions',()=>{
  for(const width of [390,1440]) it(`chooses a course, saves ten answers and follows the next step at ${width}px`,async()=>{
    const page=await setup(width);
    try{
      await page.getByText('Synthetic question 1',{exact:true}).waitFor();
      expect(await page.locator('.practice-page.practice-screen.learning-redesign > .echelon-site-header').count()).toBe(1);
      expect(await page.locator('.practice-screen-main .practice-header .practice-header-inner').count()).toBe(1);
      expect(await page.locator('.practice-content .qs-question-card .qs-option').count()).toBe(2);
      expect(await page.getByRole('navigation',{name:'Echelon navigation'}).count()).toBe(1);
      await page.getByRole('combobox').selectOption('class2-water');
      await expect.poll(()=>page.evaluate(()=>(window as any).starts.at(-1).courseKey)).toBe('class2-water');
      for(let i=0;i<10;i++){
        await page.getByText(`Synthetic question ${i+1}`,{exact:true}).waitFor();
        await page.getByRole('button',{name:/Synthetic correct/}).focus();
        await page.keyboard.press('Enter');
        await page.getByText('Synthetic saved explanation',{exact:true}).waitFor();
        const next=page.getByRole('button',{name:i===9?'See my result':'Next question'});
        await expect.poll(()=>next.evaluate(el=>el===document.activeElement)).toBe(true);
        await page.keyboard.press('Enter');
      }
      await page.getByText('10 of 10',{exact:true}).waitFor();
      expect(await page.evaluate(()=>(window as any).saves.length)).toBe(10);
      await page.getByRole('link',{name:/Retry mistakes/}).click();
      expect(new URL(page.url()).pathname).toBe('/class2-water');
      expect(new URL(page.url()).searchParams.get('mode')).toBe('missed');
    }finally{await page.close()}
  },30000);
  it('retains the original answer and operation through a failed save in the shared workspace',async()=>{
    const page=await setup(390,'quiz',false,true);
    try{
      await page.getByRole('button',{name:/Synthetic wrong/}).click();
      const retry=page.getByRole('button',{name:'Retry original answer B'});
      await retry.waitFor();
      expect(await page.getByRole('button',{name:/Synthetic correct/}).isDisabled()).toBe(true);
      await retry.click();
      await page.getByText('Synthetic saved explanation',{exact:true}).waitFor();
      expect(await page.evaluate(()=>JSON.stringify((window as any).saves[0])===JSON.stringify((window as any).saves[1]))).toBe(true);
      expect(await page.getByRole('region',{name:'Step-by-step solution'}).count()).toBe(1);
      expect(await page.getByText('Synthetic worked step',{exact:true}).count()).toBe(1);
      expect(await page.getByRole('button',{name:'Next question'}).count()).toBe(1);
    }finally{await page.close()}
  },30000);
  it('falls back from selected 309A and suppresses its unsupported next-step flow',async()=>{
    const page=await setup(390,'cta');
    try{
      await page.getByRole('link',{name:/Quick 10/}).waitFor();
      expect(await page.getByRole('link',{name:/Quick 10/}).getAttribute('href')).toContain('course=class1-water');
      expect(await page.getByRole('region',{name:'What next'}).count()).toBe(0);
      expect(await page.evaluate(()=>(window as any).nextQueries.every((q:any)=>q.options.enabled===false))).toBe(true);
    }finally{await page.close()}
    const empty=await setup(390,'cta',true);
    try{await empty.waitForTimeout(50);expect(await empty.getByRole('link',{name:/Quick 10/}).count()).toBe(0)}finally{await empty.close()}
  });
});
