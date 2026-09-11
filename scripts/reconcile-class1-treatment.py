#!/usr/bin/env python3
"""Read a user-supplied question export; no database/network access and no apply mode."""
import hashlib,json,re,sys
from pathlib import Path
from difflib import SequenceMatcher
ROOT=Path(__file__).resolve().parents[1]
def norm(s):return re.sub(r'[^a-z0-9]+',' ',s.lower()).strip()
def reconcile(path):
 raw=Path(path).read_bytes();d=json.loads(raw);old=d['questions']
 assert isinstance(old,list)
 output={'baselineSha256':hashlib.sha256(raw).hexdigest(),'mode':'offline-read-only','banks':[],'limitations':'Snapshot comparison only; not current production verification or exhaustive semantic deduplication.'}
 for name,key in [('water','class1-water'),('wastewater','class1-wastewater')]:
  new=json.loads((ROOT/f'content/class1-treatment/questions/{name}-250.json').read_text());prior=[q for q in old if q['bankKey']==key]
  assert prior,f'Missing bank: {key}'
  nums={int(q['questionNum']):q for q in prior};stems={norm(q['question']):q for q in prior}
  b={'bankKey':key,'existingCount':len(prior),'candidateCount':len(new),'occupiedIds':[],'exactStemMatches':[],'lexicalNearMatches':[]}
  for q in new:
   n=q['questionNum'];stem=norm(q['question'])
   if n in nums:b['occupiedIds'].append(n)
   if stem in stems:b['exactStemMatches'].append({'candidate':n,'existing':stems[stem]['questionNum']})
   for o in prior:
    other=norm(o['question']);matcher=SequenceMatcher(None,stem,other)
    if matcher.quick_ratio()<.82:continue
    score=matcher.ratio()
    if score>=.82:b['lexicalNearMatches'].append({'candidate':n,'existing':o['questionNum'],'similarity':round(score,4)})
  output['banks'].append(b)
 return output
if __name__=='__main__':
 if len(sys.argv)!=2:raise SystemExit('Usage: python3 scripts/reconcile-class1-treatment.py EXPORTED_QUESTIONS_JSON')
 print(json.dumps(reconcile(sys.argv[1]),indent=2))
