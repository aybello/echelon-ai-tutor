# Apply reviewer fixes to the draft tables. Usage: apply.py [--write]
import json, glob, os, sys, re
S="/tmp/claude-0/-home-user-echelon-ai-tutor/0e6dc4c6-dfed-5d26-9c2a-f17854a01d3e/scratchpad"
sys.path.insert(0,S); from tsser import ser
D="/home/user/echelon-ai-tutor/scripts/game-authoring/data/"
units={}
for l in open(f"{S}/review/units.jsonl"):
    u=json.loads(l); units[u["uid"]]=u
canaries={c for v in json.load(open(f"{S}/review/canaries.json")).values() for c in v}
import os as _os
AP=f"{S}/review/applied.json"
applied=set(json.load(open(AP))) if _os.path.exists(AP) else set()
probs=[]; done={}; bad=[]
for p in sorted(glob.glob(f"{S}/review/out/chunk-*.jsonl")):
    for l in open(p):
        l=l.strip()
        if not l: continue
        try: o=json.loads(l)
        except Exception as e: bad.append((p,l[:80])); continue
        if o.get("done"): done[os.path.basename(p)]=o; continue
        o["chunk"]=os.path.basename(p); probs.append(o)
def shape_ok(row,fix):
    if fix is None: return True
    if type(row)!=type(fix): return False
    if isinstance(row,list): return len(row)==len(fix) and all(type(a)==type(b) for a,b in zip(row,fix))
    return set(row)==set(fix) or set(fix)-set(row)<= {"max"}
texts={}; table_changes=0; removed=0; items=[]; shape_bad=[]; real=[c for c in probs if c["uid"] not in canaries and c["uid"] not in applied]
for o in real:
    u=units.get(o["uid"])
    if not u: shape_bad.append((o["uid"],"unknown uid")); continue
    if u["sec"]=="item": items.append({"uid":o["uid"],"itemId":u["row"].get("id"),"sources":u["files"],"courses":u["course"],"verdict":o["verdict"],"note":o["note"],"fix":o.get("fix")}); continue
    fix=o.get("fix")
    if not shape_ok(u["row"],fix): shape_bad.append((o["uid"],"shape")); continue
    old=ser(u["row"])
    for f in u["files"]:
        t=texts.setdefault(f,open(D+f).read())
        if old not in t: shape_bad.append((o["uid"],f"missing in {f}")); continue
        if fix is None:
            t=re.sub(r"[ \t]*"+re.escape(old)+r",?[^\n]*\n","",t,count=1); removed+=1
        else:
            t=t.replace(old,ser(fix),1); table_changes+=1
        texts[f]=t
from collections import Counter
print("chunks done",len(done),"problems",len(real),"canary hits",len([c for c in probs if c["uid"] in canaries]))
print("verdicts",Counter(o["verdict"] for o in real))
print("table row edits",table_changes,"row removals",removed,"files touched",len(texts),"base items",len(items))
print("unparsable",bad[:3],"problems",shape_bad[:10],len(shape_bad))
if "--write" in sys.argv:
    for f,t in texts.items(): open(D+f,"w").write(t)
    ok_uids={o["uid"] for o in real}-{u for u,_ in shape_bad}
    allp=json.load(open(f"{S}/review/all-problems.json")) if _os.path.exists(f"{S}/review/all-problems.json") else []
    allp+= [o for o in real if o["uid"] in ok_uids]
    json.dump(allp,open(f"{S}/review/all-problems.json","w"),indent=1)
    bi=json.load(open(f"{S}/review/base-items.json")) if _os.path.exists(f"{S}/review/base-items.json") else []
    bi+= [i for i in items if i["uid"] not in {x["uid"] for x in bi}]
    json.dump(bi,open(f"{S}/review/base-items.json","w"),indent=1)
    json.dump(sorted(applied|ok_uids),open(AP,"w"))
