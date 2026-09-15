import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseCorrections,requireCompleteRelease,screenQuestion,TARGETS,REVIEW_FILES,CALCULATION_IDS,RECALL_TARGETS,CALCULATION_TARGETS,AREAS} from './lib/collectionReview.mjs';
const texts=await Promise.all(REVIEW_FILES.map(n=>readFile(new URL('../content/wpi-class4-collection/review/'+n,import.meta.url),'utf8')));
const corrections=parseCorrections(texts);
test('authored item identities are unique and every option set has one declared key',()=>{assert.equal(corrections.length,503);assert.equal(new Set(corrections.map(q=>q.questionNum)).size,503);assert.ok(corrections.every(q=>q.correct&&q.wrong.length===3));});
test('duplicate IDs cannot overwrite another repair',()=>assert.throws(()=>parseCorrections([texts[0],texts[0]]),/DUPLICATE/));
test('a checkpoint cannot pass the complete-release gate',()=>assert.throws(()=>requireCompleteRelease({releaseReady:false,counts:{editorial_review_remaining:250}}),/NOT_IMPORTABLE/));
test('even a changed readiness flag cannot hide incomplete historical content',()=>{assert.throws(()=>requireCompleteRelease({releaseReady:true,counts:{editorial_review_remaining:1},newQuestions:Array(250)}));assert.throws(()=>requireCompleteRelease({releaseReady:true,counts:{},newQuestions:[]}));});
test('current Collection blueprint differs from Treatment and sums to 100 scored',()=>assert.deepEqual(Object.values(TARGETS),[23,23,16,20,18]));
test('HGL excludes velocity head',()=>{assert.equal(100+12,112);assert.equal(corrections.find(q=>q.questionNum===51).correct,'112 m');});
test('wet-well cycling optimum is independently derived from fill plus drawdown',()=>{const pump=0.060,V=9;for(let inflow=.001;inflow<pump;inflow+=.001){const seconds=V/inflow+V/(pump-inflow);assert.ok(seconds>=600-1e-8);}assert.equal(V/.030+V/.030,600);assert.equal(corrections.find(q=>q.questionNum===189).correct,'9.0 m³');});
test('Manning slope is independently recalculated with SI dimensions',()=>{const slope=(.60*.013/(.2/4)**(2/3))**2;assert.ok(Math.abs(slope*100-.330)<.001);assert.equal(corrections.find(q=>q.questionNum===228).correct,'0.330%');});
test('circular partial-flow discharge and velocity maxima are not confused',()=>{let maxQ={value:0},maxV={value:0};for(let y=.001;y<1;y+=.0001){const theta=2*Math.acos(1-2*y),A=(theta-Math.sin(theta))/8,P=theta/2,R=A/P,V=R**(2/3),Q=A*V;if(Q>maxQ.value)maxQ={value:Q,y};if(V>maxV.value)maxV={value:V,y};}assert.ok(maxQ.y>.93&&maxQ.y<.95);assert.ok(maxV.y>.80&&maxV.y<.83);assert.equal(corrections.find(q=>q.questionNum===163).correct,'0.94');});
test('screening reports candidates rather than declaring factual truth',()=>{const findings=screenQuestion({options:JSON.stringify(['An unusually elaborate complete answer consisting of many separate asserted components and additional detail','Short one','Short two','Only three']),correctIndex:0,cognitiveLevel:null,explanation:'Text'});assert.ok(findings.includes('long_correct_answer_candidate'));assert.ok(findings.includes('restrictive_distractor_candidate'));});

test('all 503 historical numbers have exactly one repair and no new numbers',()=>{
 assert.deepEqual(corrections.map(q=>q.questionNum),Array.from({length:503},(_,i)=>i+1));
 assert.equal(new Set(corrections.map(q=>q.question.toLowerCase().replace(/\W/g,''))).size,503);
});
test('field widths fit the deployed source and classification columns',()=>{
 for(const q of corrections){assert.ok(AREAS[q.area].length<=128);assert.ok(q.question.length<65000);assert.ok(q.explanation.length<65000);}
});
test('the bank has sufficient disjoint recall, application and calculation supply in each Collection area',()=>{
 for(const area of Object.keys(AREAS)){
  const rows=corrections.filter(q=>q.area===area);
  assert.ok(rows.filter(q=>q.cognitiveLevel==='recall'&&!CALCULATION_IDS.has(q.questionNum)).length>=RECALL_TARGETS[area],area+' recall');
  assert.ok(rows.filter(q=>q.cognitiveLevel==='application'&&CALCULATION_IDS.has(q.questionNum)).length>=CALCULATION_TARGETS[area],area+' calculation');
  assert.ok(rows.filter(q=>q.cognitiveLevel==='application'&&!CALCULATION_IDS.has(q.questionNum)).length>=TARGETS[area]-RECALL_TARGETS[area]-CALCULATION_TARGETS[area],area+' application');
 }
});
// Independent arithmetic fixtures cover every numerical calculation, not merely
// the three initially repaired questions. Explicit labels also check rounding.
const calculations=[
 [51,100+12,112,'112 m'],
 [154,.60/4,.15,'0.15 m'],
 [166,.25*.8*1000,200,'200 L/s'],
 [172,50*1440/1200,60,'60 L/s'],
 [173,20*(1200/1000)**2,28.8,'28.8 m'],
 [174,10*(1200/1000)**3,17.28,'17.28 kW'],
 [178,12/(.060-.020),300,'300 s'],
 [179,90/.050/60,30,'30 minutes'],
 [189,.060*(3600/6)/4,9,'9.0 m³'],
 [190,1000*9.81*.050*20/20000*100,49.05,'49.1%'],
 [227,20*3+10,70,'70 L/s'],
 [228,(.60*.013/(.2/4)**(2/3))**2*100,.3303,'0.330%'],
 [242,5*10/100,.5,'0.5% by volume'],
 [281,18/24*100,75,'75%'],
 [282,.10*200000,20000,'A, at C$20,000/year'],
 [283,55000+4000*5,75000,'B at C$75,000'],
 [301,(80-30)*20*60/1000,60,'60 m³'],
 [304,12/150*100,8,'8'],
 [305,900000-640000-90000,170000,'C$170,000'],
 [309,4*6,24,'24 hours'],
 [316,1*.20/1e-6,200000,'200,000'],
 [317,((50-40)*600+(90-40)*600)/1000,36,'36 m³'],
 [350,3*4*45+280+180,1000,'$1,000'],
 [351,8/200*100,4,'A: 4; B: 6'],
 [366,(102.4-101.8)/150*100,.4,'0.40%'],
 [373,10*9.81-75,23.1,'23.1 kN upward'],
 [392,34/40*100,85,'85%'],
 [416,(120000+8000*10)-(150000+4000*10),10000,'B, by $10,000'],
 [423,900000/3000,300,'$300'],
 [435,68/80*100,85,'85%'],
 [461,75+15,90,'90 mm'],
];
for(const [number,computed,expected,label] of calculations)test(`question ${number}: independent arithmetic and keyed answer`,()=>{
 assert.ok(Math.abs(computed-expected)<Math.max(.0001,Math.abs(expected)*.0001));
 const q=corrections.find(q=>q.questionNum===number);
 assert.equal(q.correct,label);assert.equal(q.cognitiveLevel,'application');assert.equal(q.source,'math');
});
test('numerical fixtures cover every calculation flag without omissions',()=>assert.deepEqual([...CALCULATION_IDS].sort((a,b)=>a-b),calculations.map(q=>q[0]).sort((a,b)=>a-b)));
test('comparison calculations verify both alternatives and normalized rates',()=>{
 assert.ok(.10*200000>.02*600000);assert.ok(55000+4000*5<40000+8000*5);assert.equal(6/100*100,6);
});
test('no combined-answer options or conspicuous length/only cues remain',()=>{
 for(const q of corrections){const findings=screenQuestion({options:JSON.stringify([q.correct,...q.wrong]),correctIndex:0,cognitiveLevel:q.cognitiveLevel,explanation:q.explanation});assert.deepEqual(findings,[],`question ${q.questionNum}`);}
});
