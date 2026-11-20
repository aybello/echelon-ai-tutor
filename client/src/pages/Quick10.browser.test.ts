import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser } from "@playwright/test";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";
let browser: Browser;
let script: string;
let workspaceCss: string;
beforeAll(async () => {
  workspaceCss = (await Promise.all([
    "components/StudyWorkspace.css", "components/PracticeWorkspace.css", "components/QuizPage.css",
    "components/AITutor.css", "pages/Quick10.css",
  ].map(path => readFile(`${process.cwd()}/client/src/${path}`, "utf8")))).join("\n");
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
      builder.onResolve({filter:/^wouter$|^@\/lib\/trpc$|^@\/hooks\/usePageMeta$|^@\/components\/(AITutor|QuizGate|SiteNav|PracticeSaveStatus)$|^@\/hooks\/useAssessmentActivity$/}, args=>({path:args.path,namespace:"fixture"}));
      builder.onLoad({filter:/.*/,namespace:"fixture"}, args=>({loader:"tsx",resolveDir:process.cwd(),contents: args.path==='wouter' ? `
        import React,{useState,useEffect} from 'react';
        const go=href=>{history.pushState({},'',href);dispatchEvent(new Event('popstate'))};
        export const Link=({href,children,...props})=><a href={href} {...props} onClick={e=>{e.preventDefault();go(href)}}>{children}</a>;
        export function useSearch(){const [s,set]=useState(location.search);useEffect(()=>{const fn=()=>set(location.search);addEventListener('popstate',fn);return()=>removeEventListener('popstate',fn)},[]);return s}
        export const useLocation=()=>[location.pathname,go];
      ` : args.path==='@/lib/trpc' ? `
        window.saves=[];window.starts=[];window.nextQueries=[];window.tutorRenders=[];window.tutorMounts=0;
        window.feedbackSaves=[];
        const courses=[{courseKey:'class1-water',shortName:'Water',displayName:'Water'},{courseKey:'class2-water',shortName:'Water II',displayName:'Water II'}];
        export const trpc={quick10:{courses:{useQuery:()=>({data:{courses:window.noCourses?[]:courses,currentCourseKey:window.noCourses?'electrician-309a':'class1-water'}})},
          start:{useMutation:()=>({mutateAsync:async input=>{window.starts.push(input);return {courseKey:input.courseKey||'class1-water',courseName:'Synthetic water',locked:false,attemptToken:'synthetic-receipt',questions:Array.from({length:input.questionCount},(_,i)=>({id:i+1,module:'Safety',isCalc:false,question:'Synthetic question '+(i+1),options:['Synthetic correct','Synthetic wrong']}))}}})},
          answer:{useMutation:()=>({mutateAsync:async input=>{window.saves.push(input);if(window.holdAnswer)await new Promise(resolve=>{window.releaseAnswer=resolve});if(window.failFirstAnswer&&window.saves.length===1)throw Error('Synthetic offline');return {saved:!window.unsavedAnswer,correct:input.selectedIndex===0,correctIndex:0,explanation:'Synthetic saved explanation',steps:[{l:'Given',c:'Synthetic worked step'}],tip:'Synthetic saved tip'}}})}},
          feedback:{submit:{useMutation:options=>({isPending:false,mutate:input=>{window.feedbackSaves.push(input);if(window.failFeedback)options.onError();else options.onSuccess({success:true})}})}},
          dashboard:{nextStep:{useQuery:(input,options)=>{window.nextQueries.push({input,options});return {data:{step:{message:'Continue with missed questions',buttonLabel:'Retry mistakes',action:{type:'missed-questions'}}}}}}}};
      ` : args.path==='@/components/AITutor' ? `
        import React,{useContext,useState} from 'react';
        import {TutorPanelPlacement} from '@/components/TutorPanelPlacement';
        export default function Tutor({onClose,...props}){
          const placement=useContext(TutorPanelPlacement);
          const [mount]=useState(()=>++window.tutorMounts);
          const [greeting]=useState(()=>props.examType+':'+props.question.id);
          const [draft,setDraft]=useState('');
          const context={...props,placement};window.tutorRenders.push(context);
          return <aside aria-label="AI Tutor" className={'ai-tutor-panel ai-tutor-panel--'+placement}>
            <div><button type="button" onClick={onClose}>Close AI Tutor</button></div>
            <output data-testid="tutor-context">{JSON.stringify(context)}</output>
            <p data-testid="tutor-mount">{mount+':'+greeting}</p>
            <input aria-label="Synthetic tutor draft" value={draft} onChange={e=>setDraft(e.target.value)}/>
          </aside>
        }
      ` : args.path==='@/components/QuizGate' ? 'export default function Gate(){return null}'
        : args.path==='@/components/SiteNav' ? 'import React from "react"; export default function SiteNav(){return <header className="echelon-site-header"><nav aria-label="Echelon navigation">Course navigation</nav></header>}'
        : args.path==='@/components/PracticeSaveStatus' ? `
          import {useState,useEffect} from 'react';
          export function useVerifiedPracticeSaveScope(courseKey){
            const [identity,setIdentity]=useState(window.actor||'synthetic-learner');
            useEffect(()=>{const update=()=>setIdentity(window.actor);addEventListener('synthetic-actor',update);return()=>removeEventListener('synthetic-actor',update)},[]);
            return {identity,courseKey};
          }
        `
        : args.path==='@/hooks/useAssessmentActivity' ? 'export const useAssessmentActivity=()=>({observe:()=>{},retry:async()=>{},saveError:null});'
        : 'export const usePageMeta=()=>{};' }));
    }}],
  });
  script=result.outputFiles[0].text;
  browser=await chromium.launch({headless:true});
},30000);
afterAll(async()=>{await browser?.close()});
async function setup(width:number, fixture="quiz", noCourses=false, failFirstAnswer=false, search="?course=class1-water"){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('**/*',route=>route.request().url().startsWith('https://synthetic.echelon.test/')?route.fulfill({contentType:'text/html',body:'<div id="root"></div>'}):route.abort());
  await page.goto('https://synthetic.echelon.test/quick-10'+search);
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
      expect(await page.getByRole('button',{name:'Leave a review'}).count()).toBe(0);
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
      await page.getByRole('button',{name:'Leave a review'}).click();
      await page.getByRole('dialog',{name:'Share your experience'}).waitFor();
      const google=page.getByRole('link',{name:/Write a Google review/});
      expect(await google.getAttribute('href')).toBe('https://g.page/r/CWsjBbkUlS8rEBM/review');
      await page.getByRole('button',{name:'1 star: Poor',exact:true}).click();
      expect(await google.count()).toBe(1);
      await page.getByRole('textbox',{name:/Tell us more/}).fill('Synthetic review, never sent to production');
      await page.evaluate(()=>{(window as any).failFeedback=true});
      await page.getByRole('button',{name:'Send private feedback'}).click();
      await page.getByRole('alert').waitFor();
      expect(await page.getByRole('textbox',{name:/Tell us more/}).inputValue()).toBe('Synthetic review, never sent to production');
      await page.evaluate(()=>{(window as any).failFeedback=false});
      await page.getByRole('button',{name:'Retry saving feedback'}).click();
      await page.getByText(/Your feedback has been saved privately/).waitFor();
      expect(await page.evaluate(()=>(window as any).feedbackSaves.at(-1))).toMatchObject({examType:'class2-water',feedbackType:'quick10',rating:1});
      await page.getByRole('button',{name:'Done',exact:true}).click();
      expect(await page.getByRole('dialog').count()).toBe(0);
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
  for(const width of [390,1440]) it(`opens the tutor in place with only the current unanswered question at ${width}px`,async()=>{
    const page=await setup(width);
    try{
      await page.addStyleTag({content:'*,*::before,*::after{box-sizing:border-box}body{margin:0}'+workspaceCss});
      await page.getByText('Synthetic question 1',{exact:true}).waitFor();
      const url=page.url();
      const trigger=page.getByRole('button',{name:'Ask AI Tutor'});
      expect(await trigger.getAttribute('aria-expanded')).toBe('false');
      await trigger.click();
      await page.getByRole('complementary',{name:'AI Tutor'}).waitFor();
      expect(await trigger.getAttribute('aria-expanded')).toBe('true');
      const context=JSON.parse(await page.getByTestId('tutor-context').innerText());
      expect(context).toEqual({question:{id:1,module:'Safety',q:'Synthetic question 1',options:['Synthetic correct','Synthetic wrong'],isCalc:false},
        examType:'class1-water',userAnswer:null,history:[],patternMode:false,placement:'workspace'});
      expect(await page.locator('.practice-screen.has-tutor > .practice-tutor-slot .ai-tutor-panel--workspace').count()).toBe(1);
      const question=await page.locator('.practice-screen-main').boundingBox();
      const tutor=await page.locator('.practice-tutor-slot').boundingBox();
      expect(question).not.toBeNull();expect(tutor).not.toBeNull();
      if(width>720){expect(tutor!.x).toBeGreaterThanOrEqual(question!.x+question!.width-1)}
      else{expect(tutor!.y).toBeGreaterThanOrEqual(question!.y+question!.height-1)}
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      expect(page.url()).toBe(url);
      expect(await page.evaluate(()=>(window as any).saves)).toEqual([]);
      expect(await page.evaluate(()=>(window as any).starts.length)).toBe(1);
      await page.getByRole('textbox',{name:'Synthetic tutor draft'}).fill('Old conversation');
      const mount=await page.getByTestId('tutor-mount').innerText();
      await page.getByRole('button',{name:'Close AI Tutor'}).click();
      expect(await page.getByRole('complementary',{name:'AI Tutor'}).count()).toBe(0);
      expect(await trigger.getAttribute('aria-expanded')).toBe('false');
      await trigger.click();
      expect(await page.getByRole('textbox',{name:'Synthetic tutor draft'}).inputValue()).toBe('');
      expect(await page.getByTestId('tutor-mount').innerText()).not.toBe(mount);
      expect(page.url()).toBe(url);
    }finally{await page.close()}
  },30000);
  it('passes the actual selection while checking, then adds only successfully revealed answer data',async()=>{
    const page=await setup(1440);
    try{
      await page.getByRole('button',{name:'Ask AI Tutor'}).click();
      await page.evaluate(()=>{(window as any).holdAnswer=true});
      await page.getByRole('button',{name:/Synthetic wrong/}).click();
      await page.getByText('Checking your answer…',{exact:true}).waitFor();
      const checking=JSON.parse(await page.getByTestId('tutor-context').innerText());
      expect(checking.userAnswer).toBe(1);
      for(const field of ['correct','correctIndex','correctAnswer','explanation','steps','tip','wrongExp']) expect(checking.question).not.toHaveProperty(field);
      await page.evaluate(()=>(window as any).releaseAnswer());
      await page.getByText('Synthetic saved explanation',{exact:true}).waitFor();
      const revealed=JSON.parse(await page.getByTestId('tutor-context').innerText());
      expect(revealed).toMatchObject({userAnswer:1,examType:'class1-water',question:{id:1,correct:0,explanation:'Synthetic saved explanation',steps:[{l:'Given',c:'Synthetic worked step'}],tip:'Synthetic saved tip'}});
      await page.getByRole('button',{name:'Close AI Tutor'}).click();
      await page.getByRole('button',{name:'Ask AI Tutor'}).click();
      expect(JSON.parse(await page.getByTestId('tutor-context').innerText())).toEqual(revealed);
      expect(await page.evaluate(()=>(window as any).saves.length)).toBe(1);
      expect(new URL(page.url()).pathname).toBe('/quick-10');
    }finally{await page.close()}
  },30000);
  for(const failure of ['offline','unconfirmed']) it(`does not expose answer fields after an ${failure} save and preserves the original retry`,async()=>{
    const page=await setup(390,'quiz',false,failure==='offline');
    try{
      if(failure==='unconfirmed')await page.evaluate(()=>{(window as any).unsavedAnswer=true});
      await page.getByRole('button',{name:'Ask AI Tutor'}).click();
      await page.getByRole('button',{name:/Synthetic wrong/}).click();
      const retry=page.getByRole('button',{name:'Retry original answer B'});
      await retry.waitFor();
      const context=JSON.parse(await page.getByTestId('tutor-context').innerText());
      expect(context.userAnswer).toBe(1);
      for(const field of ['correct','correctIndex','correctAnswer','explanation','steps','tip','wrongExp']) expect(context.question).not.toHaveProperty(field);
      expect(await page.getByText('Synthetic saved explanation',{exact:true}).count()).toBe(0);
      await page.evaluate(()=>{(window as any).unsavedAnswer=false});
      await retry.click();
      await page.getByText('Synthetic saved explanation',{exact:true}).waitFor();
      expect(await page.evaluate(()=>JSON.stringify((window as any).saves[0])===JSON.stringify((window as any).saves[1]))).toBe(true);
      expect(JSON.parse(await page.getByTestId('tutor-context').innerText())).toMatchObject({userAnswer:1,question:{correct:0}});
    }finally{await page.close()}
  },30000);
  it('closes and remounts without stale answers or conversation on next question, course, and actor transitions',async()=>{
    const page=await setup(1440);
    try{
      await page.getByRole('button',{name:/Synthetic wrong/}).click();
      await page.getByText('Synthetic saved explanation',{exact:true}).waitFor();
      const trigger=page.getByRole('button',{name:'Ask AI Tutor'});
      await trigger.click();
      await page.getByRole('textbox',{name:'Synthetic tutor draft'}).fill('Previous question');
      const firstMount=await page.getByTestId('tutor-mount').innerText();
      await page.getByRole('button',{name:'Next question'}).click();
      await page.getByText('Synthetic question 2',{exact:true}).waitFor();
      expect(await page.getByRole('complementary',{name:'AI Tutor'}).count()).toBe(0);
      await trigger.click();
      let context=JSON.parse(await page.getByTestId('tutor-context').innerText());
      expect(context).toMatchObject({userAnswer:null,examType:'class1-water',question:{id:2,q:'Synthetic question 2'}});
      expect(context.question).not.toHaveProperty('correct');
      expect(await page.getByTestId('tutor-mount').innerText()).not.toBe(firstMount);
      expect(await page.getByRole('textbox',{name:'Synthetic tutor draft'}).inputValue()).toBe('');
      await page.getByRole('textbox',{name:'Synthetic tutor draft'}).fill('Previous course');
      await page.getByRole('combobox').selectOption('class2-water');
      await page.getByText('Synthetic question 1',{exact:true}).waitFor();
      expect(await page.getByRole('complementary',{name:'AI Tutor'}).count()).toBe(0);
      await trigger.click();
      context=JSON.parse(await page.getByTestId('tutor-context').innerText());
      expect(context).toMatchObject({userAnswer:null,examType:'class2-water',question:{id:1}});
      expect(context.question).not.toHaveProperty('correct');
      expect(await page.getByTestId('tutor-mount').innerText()).toContain('class2-water:1');
      expect(await page.getByRole('textbox',{name:'Synthetic tutor draft'}).inputValue()).toBe('');
      await page.getByRole('textbox',{name:'Synthetic tutor draft'}).fill('Previous learner');
      await page.evaluate(()=>{(window as any).actor='another-synthetic-learner';dispatchEvent(new Event('synthetic-actor'))});
      await expect.poll(()=>page.evaluate(()=>(window as any).starts.length)).toBe(3);
      await page.getByText('Synthetic question 1',{exact:true}).waitFor();
      expect(await page.getByRole('complementary',{name:'AI Tutor'}).count()).toBe(0);
      await trigger.click();
      expect(await page.getByRole('textbox',{name:'Synthetic tutor draft'}).inputValue()).toBe('');
      expect(JSON.parse(await page.getByTestId('tutor-context').innerText())).toMatchObject({userAnswer:null,examType:'class2-water',question:{id:1}});
      expect(new URL(page.url()).pathname).toBe('/quick-10');
    }finally{await page.close()}
  },30000);
  it('supports the tutor entry deep link once, removes it on close, and resets for a new session',async()=>{
    const page=await setup(390,'quiz',false,false,'?course=class1-water&questions=1&panel=tutor');
    try{
      await page.getByRole('complementary',{name:'AI Tutor'}).waitFor();
      expect(JSON.parse(await page.getByTestId('tutor-context').innerText()).userAnswer).toBe(null);
      await page.getByRole('button',{name:'Close AI Tutor'}).click();
      expect(new URL(page.url()).searchParams.has('panel')).toBe(false);
      expect(new URL(page.url()).searchParams.get('course')).toBe('class1-water');
      expect(new URL(page.url()).searchParams.get('questions')).toBe('1');
      await page.getByRole('button',{name:/Synthetic correct/}).click();
      await page.getByText('Synthetic saved explanation',{exact:true}).waitFor();
      expect(await page.getByRole('complementary',{name:'AI Tutor'}).count()).toBe(0);
      await page.getByRole('button',{name:'Ask AI Tutor'}).click();
      await page.getByRole('textbox',{name:'Synthetic tutor draft'}).fill('Previous session');
      const mount=await page.getByTestId('tutor-mount').innerText();
      await page.getByRole('button',{name:'See my result'}).click();
      await page.getByText('1 of 1',{exact:true}).waitFor();
      expect(await page.getByRole('complementary',{name:'AI Tutor'}).count()).toBe(0);
      await page.getByRole('button',{name:'Another Quick 10'}).click();
      await expect.poll(()=>page.evaluate(()=>(window as any).starts.length)).toBe(2);
      await page.getByText('Synthetic question 1',{exact:true}).waitFor();
      expect(await page.getByRole('complementary',{name:'AI Tutor'}).count()).toBe(0);
      await page.getByRole('button',{name:'Ask AI Tutor'}).click();
      expect(await page.getByTestId('tutor-mount').innerText()).not.toBe(mount);
      expect(await page.getByRole('textbox',{name:'Synthetic tutor draft'}).inputValue()).toBe('');
      const context=JSON.parse(await page.getByTestId('tutor-context').innerText());
      expect(context.userAnswer).toBe(null);expect(context.question).not.toHaveProperty('correct');
      expect(new URL(page.url()).pathname).toBe('/quick-10');
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
