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
test('HGL excludes velocity head',()=>{assert.equal(100+12,112);assert.equal(corrections.find(q=>q.questionNum===51).correct,'367.4 ft (112 m)');});
test('wet-well cycling optimum is independently derived from fill plus drawdown',()=>{const pump=0.060,V=9;for(let inflow=.001;inflow<pump;inflow+=.001){const seconds=V/inflow+V/(pump-inflow);assert.ok(seconds>=600-1e-8);}assert.equal(V/.030+V/.030,600);assert.equal(corrections.find(q=>q.questionNum===189).correct,'2,400 US gal (9.0 m³)');});
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
 [51,100+12,112,'367.4 ft (112 m)'],
 [154,.60/4,.15,'0.50 ft (0.15 m)'],
 [166,.25*.8*1000,200,'7.02 ft³/s (200 L/s)'],
 [172,50*1440/1200,60,'960 US gal/min (60 L/s)'],
 [173,20*(1200/1000)**2,28.8,'94.5 ft (28.8 m)'],
 [174,10*(1200/1000)**3,17.28,'23.16 hp (17.28 kW)'],
 [178,12/(.060-.020),300,'300 s'],
 [179,90/.050/60,30,'30 minutes'],
 [189,.060*(3600/6)/4,9,'2,400 US gal (9.0 m³)'],
 [190,1000*9.81*.050*20/20000*100,49.05,'49.1%'],
 [227,20*3+10,70,'1,120 US gal/min (70 L/s)'],
 [228,(.60*.013/(.2/4)**(2/3))**2*100,.3303,'0.330%'],
 [242,5*10/100,.5,'0.5% by volume'],
 [281,18/24*100,75,'75%'],
 [282,.10*200000,20000,'A, at C$20,000/year'],
 [283,55000+4000*5,75000,'B at C$75,000'],
 [301,(80-30)*20*60/1000,60,'16,000 US gal (60 m³)'],
 [304,12/150*100,8,'8'],
 [305,900000-640000-90000,170000,'C$170,000'],
 [309,4*6,24,'24 hours'],
 [316,1*.20/1e-6,200000,'200,000'],
 [317,((50-40)*600+(90-40)*600)/1000,36,'9,600 US gal (36 m³)'],
 [350,3*4*45+280+180,1000,'$1,000'],
 [351,8/200*100,4,'A: 4; B: 6'],
 [366,(102.4-101.8)/150*100,.4,'0.40%'],
 [373,10*9.81-75,23.1,'5,170 lbf upward (23.1 kN upward)'],
 [392,34/40*100,85,'85%'],
 [416,(120000+8000*10)-(150000+4000*10),10000,'B, by $10,000'],
 [423,900000/3000,300,'$300'],
 [435,68/80*100,85,'85%'],
 [461,75+15,90,'3.6 in (90 mm)'],
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

// Each pair is checked against the printed stem, then solved separately. US
// quantities are rounded exercise counterparts, not a unit-conversion puzzle.
const pairedCalculations = [
 {n:51,terms:[['328 ft','100 m'],['39.4 ft','12 m']],solve:v=>v[0]+v[1],decimals:[1,0]},
 {n:154,terms:[['2.00 ft','0.60 m']],solve:v=>v[0]/4,decimals:[2,2]},
 {n:166,terms:[['2.70 ft²','0.25 m²'],['2.60 ft/s','0.80 m/s']],solve:(v,si)=>v[0]*v[1]*(si?1000:1),decimals:[2,0]},
 {n:172,terms:[['800 US gal/min','50 L/s']],solve:v=>v[0]*1440/1200,decimals:[0,0],same:['1,200 rpm','1,440 rpm']},
 {n:173,terms:[['65.6 ft','20.0 m']],solve:v=>v[0]*(1200/1000)**2,decimals:[1,1],same:['1,000 rpm','1,200 rpm']},
 {n:174,terms:[['13.4 hp','10.0 kW']],solve:v=>v[0]*(1200/1000)**3,decimals:[2,2],same:['1,000 rpm','1,200 rpm']},
 {n:178,terms:[['3,200 US gal','12 m³'],['320 US gal/min','20 L/s'],['960 US gal/min','60 L/s']],solve:(v,si)=>v[0]/(v[2]-v[1])*(si?1000:60),decimals:[0,0]},
 {n:179,terms:[['24,000 US gal','90 m³'],['800 US gal/min','50 L/s']],solve:(v,si)=>v[0]/v[1]*(si?1000/60:1),decimals:[0,0]},
 {n:189,terms:[['960 US gal/min','60 L/s']],solve:(v,si)=>v[0]*(si?600/1000:10)/4,decimals:[0,1],same:['six per hour']},
 {n:190,terms:[['800 US gal/min','0.050 m³/s'],['65.6 ft','20 m'],['27.0 hp','20.0 kW']],solve:(v,si)=>(si?1000*9.81*v[0]*v[1]/(v[2]*1000):v[0]*v[1]/3960/v[2])*100,decimals:[1,1],same:['3,960','1,000 kg/m³','9.81 m/s²']},
 {n:227,terms:[['320 US gal/min','20 L/s'],['160 US gal/min','10 L/s']],solve:v=>v[0]*3+v[1],decimals:[0,0],same:['factor of 3']},
 {n:228,terms:[['0.656 ft','0.200 m'],['1.968 ft/s','0.600 m/s']],solve:(v,si)=>(v[1]*.013/((si?1:1.486)*(v[0]/4)**(2/3)))**2*100,decimals:[3,3],same:['n = 0.013','1.486']},
 {n:301,terms:[['1,280 US gal/min','80 L/s'],['480 US gal/min','30 L/s']],solve:(v,si)=>(v[0]-v[1])*20*(si?60/1000:1),decimals:[0,0],same:['20 minutes']},
 {n:304,terms:[['93.2 miles','150 km'],['62.1 miles','100 km']],solve:v=>12/v[0]*v[1],decimals:[0,0],same:['12 overflows']},
 {n:316,terms:[['3.28 ft/s','1.00 m/s'],['0.656 ft','0.200 m'],['0.0000107584 ft²/s','0.00000100 m²/s']],solve:v=>v[0]*v[1]/v[2],decimals:[0,0]},
 {n:317,terms:[['800 US gal/min','50 L/s'],['1,440 US gal/min','90 L/s'],['640 US gal/min','40 L/s']],solve:(v,si)=>(v[0]+v[1]-2*v[2])*10*(si?60/1000:1),decimals:[0,0],same:['10 minutes']},
 {n:351,terms:[['124.2 miles','200 km'],['62.1 miles','100 km']],solve:v=>8/v[0]*v[1],decimals:[0,0],same:['eight blockages','six in']},
 {n:366,terms:[['336.0 ft','102.4 m'],['334.0 ft','101.8 m'],['500 ft','150 m']],solve:v=>(v[0]-v[1])/v[2]*100,decimals:[2,2]},
 {n:373,terms:[['353 ft³','10 m³'],['16,860 lbf','75 kN'],['62.4 lbf/ft³','9.81 kN/m³']],solve:v=>v[0]*v[2]-v[1],decimals:[-1,1]},
 {n:461,terms:[['3.0 in','75 mm'],['0.6 in','15 mm']],solve:v=>v[0]+v[1],decimals:[1,0]},
];
const printedNumber = text => Number(text.match(/[\d,]+(?:\.\d+)?/)[0].replaceAll(',',''));
for (const fixture of pairedCalculations) test(`question ${fixture.n}: independently solvable printed US and metric versions`, () => {
 const q=corrections.find(q=>q.questionNum===fixture.n);
 for(const text of fixture.same??[]) assert.ok(q.question.includes(text),`missing shared input ${text}`);
 for(const pair of fixture.terms) {
  assert.ok(q.question.includes(`${pair[0]} (${pair[1]})`),`missing printed pair ${pair}`);
 }
 const parts=q.correct.split(' (');
 for(const si of [false,true]) {
  const values=fixture.terms.map(pair=>printedNumber(pair[Number(si)]));
  const computed=fixture.solve(values,si),precision=10**fixture.decimals[Number(si)];
  const rounded=Math.round((computed+Number.EPSILON)*precision)/precision;
  const label=fixture.n===351?'4':parts[Number(si)]??parts[0];
  assert.equal(rounded,printedNumber(label),`${fixture.n} ${si?'metric':'US'} calculation`);
 }
});
test('dimensional calculation coverage is explicit; currency, counts and percentages need no artificial conversion',()=>{
 const nonDimensional=[242,281,282,283,305,309,350,392,416,423,435];
 assert.deepEqual([...pairedCalculations.map(x=>x.n),...nonDimensional].sort((a,b)=>a-b),[...CALCULATION_IDS].sort((a,b)=>a-b));
});
test('every item has an explicit task-family mapping consistent with its area',async()=>{
 const {TASK_MAP}=await import('./lib/collectionReview.mjs');
 const assigned=TASK_MAP.groups.flatMap(g=>g.questionNums.map(n=>({n,g})));
 assert.deepEqual(assigned.map(x=>x.n).sort((a,b)=>a-b),corrections.map(q=>q.questionNum));
 for(const {n,g} of assigned){
  assert.equal(g.area,corrections.find(q=>q.questionNum===n).area);
  assert.ok(g.task.length>10&&g.guidePages.every(p=>p>=6&&p<=12));
  assert.ok(`${g.key}: ${g.task} (guide pp. ${g.guidePages.join(', ')})`.length<=255);
 }
});
