#!/usr/bin/env python3
import json, os, pathlib, hashlib, collections, shutil
root=pathlib.Path('/home/ubuntu/outputs/echelon-six-games-2026-11-12')
src=root/'canada-scoped'; out=root/'release-scoped'; evidence=root/'release-audit-evidence'
# Each ID was selected by reading the actual question and explanation, not by its citation alone.
groups={
 'Ontario watermain procedure: specific regulated limits, conditions, sequences or classifications': '''
class1-water-dist-082 class1-water-dist-order-013 class1-water-dist-order-014 class1-water-dist-order-015
class2-water-dist-023 class2-water-dist-024 class2-water-dist-061 class2-water-dist-062 class2-water-dist-079 class2-water-dist-080 class2-water-dist-081 class2-water-dist-082 class2-water-dist-top-009 class2-water-dist-top-010 class2-water-dist-order-001 class2-water-dist-order-002 class2-water-dist-order-004 class2-water-dist-order-005 class2-water-dist-order-006 class2-water-dist-order-007 class2-water-dist-order-008 class2-water-dist-order-009 class2-water-dist-order-021 class2-water-dist-order-022
class3-water-dist-077 class3-water-dist-078 class3-water-dist-079 class3-water-dist-080 class3-water-dist-order-001 class3-water-dist-order-002 class3-water-dist-order-003 class3-water-dist-order-004 class3-water-dist-order-006 class3-water-dist-order-007 class3-water-dist-order-008
class4-water-dist-030 class4-water-dist-top-017 class4-water-dist-top-018 class4-water-dist-top-019 class4-water-dist-top-020 class4-water-dist-top-021 class4-water-dist-order-001 class4-water-dist-order-002 class4-water-dist-order-003 class4-water-dist-order-004 class4-water-dist-order-005
''',
 'Ontario construction, confined-space, or well-construction duty and sequence': '''
class2-water-dist-order-015 class2-water-dist-order-016 class2-water-dist-order-017 class3-wastewater-coll-order-019 class4-wastewater-coll-order-013 class4-wastewater-coll-order-014 class3-water-dist-order-015 class4-water-dist-order-016 class4-water-dist-order-017
''',
 'Ontario drinking-water procedure or compliance claim: mandatory CT, sampling or laboratory rule': '''
class3-water-082 class3-water-top-025 class3-water-top-028 class3-water-top-031 wqa-017 wqa-018 wqa-088 wqa-order-005
''',
 'US federal OSHA construction requirements': '''
us-class1-water-dist-020 us-class1-water-dist-066 us-class1-water-dist-order-001 us-class1-water-dist-order-002 us-class1-water-dist-order-003
''',
 'OSHA general-industry or permit-space sequence expressed as a rule or required duty': '''
wpi-class2-wastewater-order-021 wpi-class2-wastewater-order-022 wpi-class2-water-dist-order-011 wpi-class2-water-dist-order-013 wpi-class2-water-dist-order-015
'''
}
reasons={}
for reason,s in groups.items():
 for i in s.split():
  assert i not in reasons, i
  reasons[i]=reason
assert not out.exists(), f'{out} already exists: refusing overwrite'
out.mkdir(); removed=[]; manifest=[]; allids=set(); total=0; post=0; modes=('rapid-swipe','speed-match','odd-one-out','cause-effect','tap-the-flaw','before-after')
sha=lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
for p in sorted(src.glob('*.json')):
 data=json.loads(p.read_text()); assert isinstance(data,list)
 total+=len(data); kept=[]
 for x in data:
  i=x['id']; assert i not in allids, i; allids.add(i)
  if i in reasons: removed.append({'course_file':p.name,'reason':reasons[i],'item':x})
  else: kept.append(x)
 post+=len(kept); q=out/p.name
 if len(data)==len(kept): shutil.copyfile(p,q)
 else: q.write_text(json.dumps(kept,ensure_ascii=False,indent=2)+'\n')
 assert json.loads(q.read_text()) == [x for x in data if x['id'] not in reasons]
 c=collections.Counter(x['mode'] for x in kept)
 manifest.append((p.name,len(data),len(kept),[c[m] for m in modes],sha(p),sha(q)))
assert len(manifest)==38 and len(removed)==len(reasons) and total==4057 and total-post==len(reasons)
(evidence/'excluded-items.json').write_text(json.dumps(removed,ensure_ascii=False,indent=2)+'\n')
(evidence/'manifest.tsv').write_text('course\tbefore\tafter\tRS\tSM\tOO\tCE\tTF\tBA\tsource_sha256\tscoped_sha256\n'+''.join(f'{f}\t{b}\t{a}\t'+ '\t'.join(map(str,counts))+f'\t{h1}\t{h2}\n' for f,b,a,counts,h1,h2 in manifest))
report=[]
report+=['# Release scope report','', '## Scope and decision','', f'Input: `{src}`. Output: `{out}`. All 38 input JSON arrays were screened; {total:,} items in, {len(removed):,} excluded, {post:,} retained. This is a conservative offline scoping draft, **not** a legal opinion, independent human technical review, production approval, or release authorization. It does not establish that surviving content is correct, safe, current, applicable, or actually free of all legal claims.', '', 'The release gate at `/home/ubuntu/echelon-ai-tutor/docs/production-release-gate.md`, content authority section, requires jurisdiction, source URL, exact section or schedule where applicable, review date and technical reviewer for a legal/regulatory requirement. Items have URLs but no reviewer, review-date, jurisdiction or exact-section fields. Existing accompanying review files identify themselves as AI reviews and expressly disclaim independent human technical approval. No exact auditable human technical reviewer was found for excluded claims. No unsupported statement was rewritten, no attribution was invented, and no removed item was used to top up a mode.', '', 'A broad case-insensitive candidate scan examined prompt, options, answer, pairs and explanation for must, shall, required, law, regulation, OSHA, CFR, EPA, TCEQ, permit, standards, compliance, jurisdictional names and related terms. It produced 885 candidates; a focused review and regulated-source cross-check supplemented it. Text was judged by its actual teaching claim and context, not by citation or keyword alone. Source-focused screening is a discovery aid only: for example a scientific UV/CT item sourced to a provincial procedure, and an OSHA-cited hazard description or explicitly illustrative tutorial, are not automatically legal claims. Named procedural obligations, applicable sequences and exceptions were conservatively excluded even when phrased as descriptions rather than “must”. The same test applies to the three dedicated US packs.', '', 'Retained arrays preserve each original item object, exact IDs, order, answer, explanation and source URLs; unchanged packs are byte-copied, modified packs are JSON-reserialized. A programmatic equality assertion checks each output against its input minus logged IDs. SHA-256 hashes and per-course counts are in [manifest.tsv](../release-audit-evidence/manifest.tsv). [Full original excluded items](../release-audit-evidence/excluded-items.json) preserve question, answer, explanation and source evidence. [Candidate inventory](../release-audit-evidence/) and the generation script document the offline process.', '', '## Exclusions','', 'Every excluded item lacked an exact auditable named human technical reviewer tied to the claim; other authority fields were not exhaustively verified. Reason classes describe what the actual question and/or explanation tests. Exclusion does not mean a statement is false.','']
for reason in groups:
 report+=['### '+reason,'']
 for r in removed:
  if r['reason']!=reason: continue
  x=r['item']; report += [f"- `{r['course_file']}` / `{x['id']}` ({x['mode']}): **Question:** {x['prompt']} **Answer:** {x['answer']} **Explanation:** {x['explanation']}"]
 report+=['']
report+=['## Course coverage','', 'Counts after exclusion. RS = rapid-swipe; SM = speed-match; OO = odd-one-out; CE = cause-effect; TF = tap-the-flaw; BA = before-after. Each course is checked against the requested minimum of two in each mode.','', '| Course | Before | After | RS | SM | OO | CE | TF | BA | ≥2 each |','|---|---:|---:|---:|---:|---:|---:|---:|---:|---|']
for f,b,a,c,_,_ in manifest:report.append('| '+f+' | '+str(b)+' | '+str(a)+' | '+' | '.join(map(str,c))+' | '+('Yes' if min(c)>=2 else '**NO**')+' |')
fail=[f for f,b,a,c,_,_ in manifest if min(c)<2]
report+=['', f"Minimum-mode result: {'all 38 courses meet the two-per-mode threshold.' if not fail else 'NOT MET: '+', '.join(fail)+'.'}", '', '## Converter and validation', '', 'The offline validator/converter output and converted artifacts are recorded separately in [converter-output](../release-audit-evidence/converter-output/) and [converter-validation.json](../release-audit-evidence/converter-validation.json). The command uses a separate existing output directory, not the source or repository. Conversion is structural only; output omits original source URLs by design, so the retained source arrays and exclusion evidence are the authority record. Conversion does not approve any question.', '', '## Limitations', '', 'This is a keyword-assisted, context-sensitive review rather than an exhaustive legal determination. Ambiguous, indirect or unrecognized requirements may remain; instructional examples citing U.S. OSHA can still be unsuitable for Canadian audiences and need qualified jurisdiction-specific review. Guidance versus binding status may depend on incorporation, current site permits, exemptions and facts not checked offline. Neither sources nor law were retrieved or validated live. Technical accuracy, answer keys, source support and currency, local applicability, instructional suitability, safety, rendering and production integration remain unverified. User-specified two-per-mode counts do not prove content coverage or readiness. Existing AI reports are not evidence of a human reviewer. No repository files, database, network, Notion or git operations were used.','']
(out/'release-scope-report.md').write_text('\n'.join(report))
print('courses',len(manifest),'before',total,'excluded',len(removed),'after',post,'mode failures',fail)
print('reason counts',collections.Counter(r['reason'] for r in removed))
