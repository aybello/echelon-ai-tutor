#!/usr/bin/env python3
"""Build two review chunks of the Florida bank with planted errors (one wrong key + one altered explanation per half)."""
import json, random, re, os
S = '/tmp/claude-0/-home-user-echelon-ai-tutor/0e6dc4c6-dfed-5d26-9c2a-f17854a01d3e/scratchpad/fl-review'
os.makedirs(S, exist_ok=True)
bank = json.load(open('/home/user/echelon-ai-tutor/content/us-banks/fl-water-distribution-l3/questions/bank-150.json'))
random.seed(11)
L = 'ABCD'
SWAPS = [('increases', 'decreases'), ('decreases', 'increases'), ('higher', 'lower'), ('lower', 'higher'), ('more', 'less'), ('less', 'more'),
         ('before', 'after'), ('after', 'before'), ('open', 'closed'), ('upstream', 'downstream'), ('faster', 'slower'), ('larger', 'smaller')]

def alter(expl):
    nums = [m for m in re.finditer(r'\b\d+(?:\.\d+)?\b', expl) if float(m.group()) > 1]
    if nums:
        m = nums[-1]
        new = str(round(float(m.group()) * 1.5 + 2, 2)).rstrip('0').rstrip('.')
        out = expl[:m.start()] + new + expl[m.end():]
        if out != expl:
            return out, f'number {m.group()} -> {new}'
    for a, b in SWAPS:
        m = re.search(r'\b' + a + r'\b', expl)
        if m:
            out = expl[:m.start()] + b + expl[m.end():]
            return out, f'word {a} -> {b}'
    return None, None

def fmt(q, key, expl):
    opts = '\n'.join(f'{L[i]}) {o}' for i, o in enumerate(q['options']))
    return (f"{q['itemId']} | {q['module']} | {q['topic']}\nQ: {q['question']}\n{opts}\nKEY: {key}\nEXPL: {expl}\n")

plants = {}
halves = [bank[:75], bank[75:]]
for h, half in enumerate(halves, 1):
    wk, ae = random.sample(range(len(half)), 2)
    # make sure the altered-explanation question can actually be altered
    while True:
        new, desc = alter(half[ae]['explanation'])
        if new:
            break
        ae = random.randrange(len(half))
        if ae == wk:
            continue
    blocks = []
    for i, q in enumerate(half):
        correct = q['options'].index(q['correctAnswer'])
        key, expl = L[correct], q['explanation']
        if i == wk:
            wrong = [k for k in range(4) if k != correct]
            key = L[random.choice(wrong)]
            plants['wrongKey_half%d' % h] = {'id': q['itemId'], 'planted': key, 'real': L[correct]}
        if i == ae:
            expl = new
            plants['altered_half%d' % h] = {'id': q['itemId'], 'change': desc}
        blocks.append(fmt(q, key, expl))
    open(f'{S}/chunk{h}.txt', 'w').write('\n'.join(blocks))
json.dump(plants, open(f'{S}/plants.json', 'w'), indent=1)
print(json.dumps(plants, indent=1))
