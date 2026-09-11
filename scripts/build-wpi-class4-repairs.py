"""Offline evidence and candidate repairs; never connects to or writes a database."""
import ast, copy, hashlib, json
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'content/wpi-class4-wastewater/audit'
original=json.loads((BASE/'baseline.json').read_text())
rows=original['questions']
assert len(rows)==original['total']==657
assert len({q['id'] for q in rows})==len({q['questionNum'] for q in rows})==657
canonical=lambda x: json.dumps(x,ensure_ascii=False,separators=(',',':'))
assert hashlib.sha256(canonical(rows).encode()).hexdigest()==original['questionRowsSha256']

def calc(s):
 def run(n):
  if isinstance(n,ast.Constant) and type(n.value) in (int,float):return Decimal(str(n.value))
  if isinstance(n,ast.BinOp):
   a,b=run(n.left),run(n.right)
   if isinstance(n.op,ast.Add):return a+b
   if isinstance(n.op,ast.Sub):return a-b
   if isinstance(n.op,ast.Mult):return a*b
   if isinstance(n.op,ast.Div):return a/b
  raise ValueError('Unsupported arithmetic')
 return run(ast.parse(s,mode='eval').body)

changes=json.loads((BASE/'clarifications.json').read_text())
patches=[]
for old in rows:
 n=old['questionNum'];new=copy.deepcopy(old);reason=[]
 if str(n) in changes:
  entry=changes[str(n)];new.update(entry['fields']);reason.append(entry['reason'])
 for line in (BASE/'math-review.txt').read_text().splitlines():
  num,expression,expected,unit,dp=line.split('|')
  if int(num)!=n:continue
  dp=int(dp); quantum=Decimal(1).scaleb(-dp);value=calc(expression)
  rounded=value.quantize(quantum,rounding=ROUND_HALF_UP)
  assert rounded==Decimal(expected),(n,value,expected)
  f=lambda x:f'{x.quantize(quantum,rounding=ROUND_HALF_UP):.{dp}f} {unit}'
  options=[f(value*Decimal(x)) for x in ['0.5','0.8','1.25']]
  assert len(set(options+[f(value)]))==4
  options.insert(old['correctIndex'],f(value))
  new['options']=canonical(options);new['isCalc']='yes'
  context=new.get('explanation','') if str(n) in changes else ''
  new['explanation']=f'Substitute the stated values with consistent units: {expression} = {value:.8g}. Rounded to {dp} decimal places, the result is {f(value)}.'+((' '+context) if context else '')
  new['steps']=canonical([{'l':'Calculation using the stated quantities','c':expression},{'l':'Result','c':f(value)}])
  new['tip']='Keep mass, volume and time units consistent; round only the final result.'
  reason.append('Recomputed numerical result; four distinct options in matching units; removed stale repair commentary and answer-letter references.')
 if reason:
  assert (new['id'],new['questionNum'],new['bankKey'],new['correctIndex'])==(old['id'],old['questionNum'],old['bankKey'],old['correctIndex'])
  opts=json.loads(new['options']);assert len(opts)==len(set(opts))==4
  patches.append({'id':old['id'],'questionNum':n,'bankKey':old['bankKey'],'reason':reason,'before':old,'after':new,'changedFields':[k for k in old if old[k]!=new[k]],'historyWarning':'Do not regrade saved attempts or mutate issued exam snapshots. Existing IDs/key positions retained, but text and correct answer meaning may change.'})
by_num={p['questionNum']:p['after'] for p in patches}
(BASE/'repair-candidates.json').write_text(json.dumps({'baselineRowsSha256':original['questionRowsSha256'],'status':'partial-priority-repair-not-full-bank-release','count':len(patches),'patches':patches},ensure_ascii=False,indent=2)+'\n')
ledger=[]
for old in rows:
 q=by_num.get(old['questionNum'],old);opts=json.loads(q['options']);lengths=[len(x.split()) for x in opts];correct=lengths[q['correctIndex']];wrong=[v for i,v in enumerate(lengths) if i!=q['correctIndex']]
 flags=[]
 if correct>=2*max(wrong) and correct>=12:flags.append('correct_option_at_least_twice_longest_distractor')
 if len(set(x.lower().strip() for x in opts))<4:flags.append('duplicate_options')
 if any('\\u' in x for x in opts):flags.append('literal_unicode_escape')
 if any(w in (q['question']+' '+q['explanation']).lower() for w in ['regulat','permit','class a','class b','osha','ccme','ministry','moe','iso ']):flags.append('jurisdiction_or_standard_source_check')
 ledger.append({'questionNum':q['questionNum'],'id':q['id'],'status':'priority_repair_written_full_editorial_review_pending' if q['questionNum'] in by_num else 'full_editorial_review_pending','screenFlags':flags})
(BASE/'review-ledger.json').write_text(json.dumps(ledger,indent=2)+'\n')
print(json.dumps({'baselineRows':len(rows),'candidateRepairs':len(patches),'numericalCases':len((BASE/'math-review.txt').read_text().splitlines()),'remainingFullEditorialReview':657,'newQuestionsWritten':0}))
