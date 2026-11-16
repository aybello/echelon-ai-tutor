import json, random, glob, os
S="/tmp/claude-0/-home-user-echelon-ai-tutor/0e6dc4c6-dfed-5d26-9c2a-f17854a01d3e/scratchpad/review"
C=[
 ("facts",["m","Free chlorine is a weaker disinfectant than monochloramine.",True,"Monochloramine reacts faster with microorganisms."]),
 ("relations",["m","Chlorine gas is fed into water with little alkalinity.","the pH of the water","increase","Chlorine gas adds hydroxide to the water."]),
 ("boards",{"d":"m","prompt":"Match each disinfectant to its trait.","pairs":[["Ozone","Leaves a long-lasting residual in the mains"],["Chloramine","Lasts long in the distribution system"],["Free chlorine","Strong oxidant that forms byproducts"],["UV light","Leaves no residual"],["Chlorine dioxide","Can form chlorite"],["Sodium hypochlorite","Liquid form of chlorine"]]}),
 ("flaws",{"d":"m","prompt":"Which statement about hydrogen sulfide is wrong?","flawed":"It is heavier than air","goods":["It deadens the sense of smell at high levels","It smells like rotten eggs at low levels","It is lighter than air and rises out of manholes"],"explanation":"Hydrogen sulfide rises out of manholes."}),
 ("sequences",{"d":"m","process":"backwashing a gravity filter","steps":["Open the backwash valve","Lower the water level","Close the influent valve","Return the filter to service"],"why":"The backwash starts before the filter is isolated."}),
 ("oddSets",{"d":"m","rule":"a pathogenic protozoan","members":["Giardia","Cryptosporidium","E. coli"],"intruders":["Turbidity"],"why":"{odd} is not a protozoan."}),
 ("facts",["m","A typical home service delivers water at about 60 psi.",True,"Most systems hold 50 to 70 psi at the tap."]),
 ("facts",["h","CT is the disinfectant concentration multiplied by the flow rate.",True,"CT combines dose and flow to rate disinfection."]),
]
rng=random.Random(7); log={}
for p in sorted(glob.glob(f"{S}/in/chunk-*.jsonl")):
    n=int(os.path.basename(p)[6:9])
    if n<10: continue
    L=[json.loads(l) for l in open(p)]
    course=L[0]["course"].split(",")[0]
    picks=rng.sample(range(len(C)),2); ids=[]
    for j,i in enumerate(picks):
        uid=f"U9{n:02d}{j}"; sec,row=C[i]
        L.insert(rng.randrange(len(L)),{"sec":sec,"row":row,"files":["table:?"],"course":course,"uid":uid}); ids.append(uid)
    open(p,"w").write("".join(json.dumps(u)+"\n" for u in L)); log[os.path.basename(p)]=ids
json.dump(log,open(f"{S}/canaries.json","w")); print(len(log),"chunks seeded")
