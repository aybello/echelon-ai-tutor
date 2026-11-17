import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { questions } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { US_STATE_PRACTICE_BANKS } from "../shared/pennsylvaniaBanks";
import { resolveUSStudyContext } from "./usStudyContextServer";
import { issueSubscriptionToken } from "./_core/subscriptionToken";
vi.mock("./db", async original => ({ ...await original<typeof import("./db")>(), getDb: vi.fn() }));
// Preserve resolveAccessForRequest and its verified identity/token recheck logic.
// Only the authoritative entitlement lookup is synthetic; no production PA SKU exists.
vi.mock("./_core/access", async original => {
  const actual = await original<typeof import("./_core/access")>();
  return { ...actual, resolveAccessByEmail: vi.fn(async (_email: string, key: string) => ({ hasAccess: owned.has(key) })),
    resolveAccess: vi.fn(async (_user: unknown, key: string) => ({ hasAccess: owned.has(key), isOwner: false })) };
});
vi.mock("./teams/attemptAttribution", () => ({ resolveAttemptAttribution: vi.fn(async () => ({ orgId:null, organizationMemberId:null, flexLicenceId:null })), validateIssuedAttribution: vi.fn() }));
const owned = new Set<string>();
const dialect = new MySqlDialect();
const fixtures = US_STATE_PRACTICE_BANKS.flatMap((bank, index) => Array.from({length:bank.count},(_,i)=>({
  id:index*1000+i+1,questionNum:i+1,bankKey:bank.courseKey,module:i%2?'Safety':'Operations',question:`${bank.courseKey} synthetic fixture ${i+1}`,
  options:'["A","B","C","D"]',correctIndex:0,explanation:'Synthetic explanation',steps:null,tip:null,isCalc:'no',difficulty:'easy',topic:'Fixture',cognitiveLevel:'recall',
})));
function caller(email: string | null = null) {
  return appRouter.createCaller({user:null,studentEmail:email,req:{headers:{},cookies:{}},res:{setHeader:vi.fn()}} as any);
}
beforeEach(()=>{
  owned.clear();ENV.cookieSecret='test-only-pennsylvania-secret';
  vi.mocked(getDb).mockResolvedValue({ select:()=>{
    let selected: any[]=[];const chain:any={
      from(table:unknown){selected=table===questions?fixtures:[];return chain;},
      where(condition:any){const {params}=dialect.sqlToQuery(condition);const key=params.find(p=>US_STATE_PRACTICE_BANKS.some(b=>b.courseKey===p));selected=selected.filter(r=>r.bankKey===key);return chain;},
      orderBy(){return chain;},limit(n:number){return Promise.resolve(selected.slice(0,n));},
      then(resolve:any,reject:any){return Promise.resolve(selected).then(resolve,reject);},
    };return chain;
  }} as any);
});
describe('Independent state practice protected quiz and mock boundaries',()=>{
  it.each(US_STATE_PRACTICE_BANKS)('bounds anonymous $courseKey practice and flashcards to 15, without mock access',async bank=>{
    for(const previewSurface of ['practice','flashcards'] as const){
      const result=await caller().quiz.getQuestions({bankKey:bank.courseKey,previewSurface});
      expect(result).toMatchObject({locked:true,total:bank.count,trialLimit:15});expect(result.questions).toHaveLength(15);
      expect(result.questions.every(q=>q.question.startsWith(bank.courseKey))).toBe(true);
    }
    await expect(caller().exam.startMock({courseKey:bank.courseKey})).rejects.toMatchObject({code:'FORBIDDEN'});
  });
  it.each(US_STATE_PRACTICE_BANKS)('does not unlock $courseKey with Canadian, Texas, other state or all-access ownership',async bank=>{
    for(const key of ['class1-water','wpi-class1-water','us-class1-water','us-texas-class-d-water','all-access',...US_STATE_PRACTICE_BANKS.filter(b=>b.courseKey!==bank.courseKey).map(b=>b.courseKey)]){
      owned.clear();owned.add(key);const result=await caller('learner@example.test').quiz.getQuestions({bankKey:bank.courseKey});expect(result.locked).toBe(true);expect(result.questions).toHaveLength(15);
      await expect(caller('learner@example.test').exam.startMock({courseKey:bank.courseKey})).rejects.toMatchObject({code:'FORBIDDEN'});
    }
    expect(resolveUSStudyContext(bank.courseKey,'TX','US')).toBeNull();expect(resolveUSStudyContext(bank.courseKey,'PA','CA')).toBeNull();
  });
  it.each(US_STATE_PRACTICE_BANKS)('allows a hypothetical exact owned $courseKey bounded working set only from its own bank',async bank=>{
    owned.add(bank.courseKey);const result=await caller('learner@example.test').quiz.getQuestions({bankKey:bank.courseKey});
    expect(result.locked).toBe(false);expect(result.questions).toHaveLength(Math.min(200,bank.count));expect(result.questions.every(q=>q.question.startsWith(bank.courseKey))).toBe(true);
    const issued=await caller('learner@example.test').exam.startMock({courseKey:bank.courseKey});expect(issued.questions).toHaveLength(100);expect(issued.token).toBeTruthy();
    expect(issued.questions.every(q=>q.question.startsWith(bank.courseKey)&&!('correctIndex' in q)&&!('explanation' in q))).toBe(true);
  });
  it.each(US_STATE_PRACTICE_BANKS)('rechecks revoked signed $courseKey access and returns only the bounded preview',async bank=>{
    const accessToken=await issueSubscriptionToken({email:'learner@example.test',examTypes:[bank.courseKey]});
    owned.add(bank.courseKey);expect((await caller().quiz.getQuestions({bankKey:bank.courseKey,accessToken})).locked).toBe(false);
    owned.clear();const result=await caller().quiz.getQuestions({bankKey:bank.courseKey,accessToken});expect(result.locked).toBe(true);expect(result.questions).toHaveLength(15);
    await expect(caller().exam.startMock({courseKey:bank.courseKey,accessToken})).rejects.toMatchObject({code:'FORBIDDEN'});
  });
  it('keeps unknown keys closed and the separate electrician route restriction intact',async()=>{
    await expect(caller().quiz.getQuestions({bankKey:'pa-unknown'})).rejects.toThrow();
    await expect(caller().quiz.getInteractiveQuestions({bankKey:'electrician-309a'})).rejects.toThrow();
  });
});
