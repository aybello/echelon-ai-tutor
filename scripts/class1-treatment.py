#!/usr/bin/env python3
"""Build/check original Treatment candidates; never reads credentials or writes a database."""
import ast, hashlib, json, operator, random, re, sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PKG=ROOT/'content/class1-treatment'
BANKS={'water':'class1-water','wastewater':'class1-wastewater'}
SOURCES={
 'WATER':('US EPA: Surface Water Treatment Rules — supporting treatment resources','https://www.epa.gov/dwreginfo/surface-water-treatment-rules'),
 'WW':('US EPA: Municipal Wastewater — supporting treatment resources','https://www.epa.gov/npdes/municipal-wastewater'),
 'LAB':('WPI: operator examination references — laboratory and treatment study resources','https://gowpi.org/services/abc-testing/exam-references/'),
 'SAFE':('CCOHS: hazard-control resources','https://www.ccohs.ca/oshanswers/'),
 'OPS':('WPI: Class I treatment competency scope','https://gowpi.org/services/2025-need-to-know-criteria/'),
 'MATH':('WPI: formula/conversion tables','https://gowpi.org/services/abc-testing/formula-conversion-tables/'),
}
def norm(s): return re.sub(r'[^a-z0-9]+',' ',s.lower()).strip()
def digest(b): return hashlib.sha256(b).hexdigest()
def dump(d):return (json.dumps(d,ensure_ascii=False,indent=2)+'\n').encode()
def calc(s):
 ops={ast.Add:operator.add,ast.Sub:operator.sub,ast.Mult:operator.mul,ast.Div:operator.truediv}
 def walk(n):
  if isinstance(n,ast.Constant) and type(n.value) in (int,float):return Decimal(str(n.value))
  if isinstance(n,ast.BinOp) and type(n.op) in ops:return ops[type(n.op)](walk(n.left),walk(n.right))
  raise ValueError('Arithmetic literals and + - * / only')
 return walk(ast.parse(s,mode='eval').body)
def rounded(v,places):return v.quantize(Decimal(1).scaleb(-places),rounding=ROUND_HALF_UP)
def build(name):
 rows=[]
 for f in sorted((PKG/'source').glob(name+'-0*.txt')):
  topic=source=None
  for line in f.read_text().splitlines():
   if not line:continue
   if line.startswith('@'):topic,source=line[1:].split('|');continue
   fields=line.split('|');assert len(fields)==6,(f,line)
   question,key,a,b,c,explanation=fields
   rows.append(dict(topic=topic,source=source,question=question,correctAnswer=key,wrong=[a,b,c],explanation=explanation,isCalc='no'))
 assert len(rows)==200,(name,len(rows))
 for line in (PKG/'source'/f'{name}-math.txt').read_text().splitlines():
  topic,q,formula,expression,expected,unit,dp=line.split('|');places=int(dp)
  value=rounded(calc(expression),places);assert value==Decimal(expected),(topic,value,expected)
  # Choose distinct numerical alternatives; signs and physical bounds remain valid.
  factors=[Decimal('0.5'),Decimal('1.5'),Decimal('0.8'),Decimal('1.2'),Decimal('2'),Decimal('0.1')]
  random.Random(topic).shuffle(factors);wrong=[]
  for fac in factors:
   v=rounded(value*fac,places)
   if v<=0 or v==value or v in wrong or (unit=='%' and v>100):continue
   wrong.append(v)
   if len(wrong)==3:break
  assert len(wrong)==3
  answer=f'{value:.{places}f} {unit}'
  sub=expression.replace('*',' × ').replace('/',' ÷ ')
  rows.append(dict(topic=topic,source='MATH',question=q,correctAnswer=answer,wrong=[f'{v:.{places}f} {unit}' for v in wrong],isCalc='yes',formula=formula,expression=expression,expected=expected,decimalPlaces=places,unit=unit,
   explanation=f'{formula}. Substitution: {sub} = {answer}. Use the supplied units and assumptions, and round only the final result. This calculation does not establish a field operating limit.',
   steps=json.dumps([{'l':'Relationship','c':formula},{'l':'Substitution','c':sub},{'l':'Result','c':answer}]),tip='Check dimensional consistency and round only the final result.'))
 positions=[i%4 for i in range(250)];random.Random(BANKS[name]).shuffle(positions)
 for i,r in enumerate(rows):
  source=r.pop('source');wrong=r.pop('wrong');random.Random(f'{name}-{i}').shuffle(wrong)
  options=wrong[:];options.insert(positions[i],r['correctAnswer'])
  r.update(bankKey=BANKS[name],questionNum=2001+i,itemId=f'{name.upper()}-TREATMENT-L1-{i+1:03}',module='Water Treatment' if name=='water' else 'Wastewater Treatment',options=options,correctIndex=positions[i],reviewStatus='unreviewed',difficulty='medium',cognitiveLevel='application',sourceTitle=SOURCES[source][0],sourceUrl=SOURCES[source][1],sourceReference=f'Supporting resource category: {r["topic"]}. See SOURCES.md: these are not claim-level verification citations.',blueprintObjective=r['topic'],evidenceStatus='original-candidate-topic-reference-not-independent-SME-certification')
  r.update({f'option{"ABCD"[j]}':v for j,v in enumerate(options)})
 return rows

def validate(rows):
 assert len(rows)==250
 assert sum(r['isCalc']=='yes' for r in rows)==50
 assert len({r['questionNum'] for r in rows})==250
 assert len({norm(r['question']) for r in rows})==250
 for r in rows:
  assert len(r['options'])==4 and len({norm(s) for s in r['options']})==4,r['itemId']
  assert r['options'][r['correctIndex']]==r['correctAnswer']
  for k,limit in {'module':128,'topic':128,'sourceTitle':255,'sourceReference':512,'sourceUrl':1024,'blueprintObjective':255}.items():assert 0<len(r[k])<=limit,(r['itemId'],k)
  assert r['explanation'] and r['reviewStatus']=='unreviewed'
 counts=[sum(r['correctIndex']==i for r in rows) for i in range(4)]
 assert sorted(counts)==[62,62,63,63]
 return {'count':250,'conceptual':200,'calculations':50,'canonicalAnswerPositions':counts}

def main():
 mode=sys.argv[1] if len(sys.argv)>1 else 'check';assert mode in ['build','check']
 manifest={'version':'2026-09-11-v1','status':'candidate-not-imported','individualApprovalRequired':False,'productionWrites':False,'banks':[]}
 review=['# Class 1 Treatment — 500 original practice candidates','', 'These supplement the existing banks. They are not official exam questions or an official weighted exam. Correct answers are shown for review. No production import is performed.','']
 outputs={}
 for name in BANKS:
  rows=build(name);report=validate(rows);data=dump(rows);outputs[PKG/'questions'/f'{name}-250.json']=data
  manifest['banks'].append(dict(bankKey=BANKS[name],file=f'questions/{name}-250.json',sha256=digest(data),**report))
  review.extend([f'## {name.title()} Treatment',''])
  for r in rows:
   review.extend([f'### {r["questionNum"]} — {r["topic"]}',r['question'],'',*[f'{"ABCD"[j]}. {v}' for j,v in enumerate(r['options'])],'',f'Answer: {"ABCD"[r["correctIndex"]]}. {r["correctAnswer"]}',r['explanation'],''])
 outputs[PKG/'manifest.json']=dump(manifest);outputs[PKG/'REVIEW.md']=('\n'.join(review)+'\n').encode()
 for p,b in outputs.items():
  if mode=='build':p.write_bytes(b)
  else:assert p.read_bytes()==b,f'Stale generated output: {p}'
 print(json.dumps(manifest,indent=2))
if __name__=='__main__':main()
