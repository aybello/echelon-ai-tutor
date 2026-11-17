#!/usr/bin/env python3
"""Send both Florida review chunks to GPT-6.1 Sol and Gemini hydrogen."""
import json, urllib.request, concurrent.futures as cf
S = '/tmp/claude-0/-home-user-echelon-ai-tutor/0e6dc4c6-dfed-5d26-9c2a-f17854a01d3e/scratchpad/fl-review'
PROMPT = """You are an independent expert reviewer of exam practice questions for the Florida DEP Water Distribution System Operator Level 3 examination (entry level, US customary units). Review EVERY question below (75 questions). The set may contain a few deliberately inserted errors (a wrong answer key, a wrong number or word in an explanation); treat each question as if it might. Check each: (1) the KEY letter is correct; (2) no wrong option could also be defended as correct by a practising operator; (3) the explanation is true and agrees with the key; (4) for calculations, redo the arithmetic from the constants stated in the question; (5) unambiguous wording; (6) the correct answer cannot be identified from wording style alone (the only specific or longest option, a word repeated from the stem, filler padding on wrong options, silly wrong options); (7) entry-level recognition only: no exact regulatory limits, no specific rule numbers, reporting deadlines or sample counts, no step-by-step safety or emergency procedures, no Level 1, 2 or 4 content, no treatment-plant or wastewater content.

Reply with ONLY a list of real problems, one per line: ID | KEY wrong / explanation wrong / calc wrong / ambiguous / giveaway / out of scope / other | what is wrong | suggested fix. Do not mention questions that are fine. Finish with one line: 'READ: <number>'.

QUESTIONS:
"""
G = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
O = 'https://api.openai.com/v1/chat/completions'

def call(job):
    name, url, model, tok, chunk = job
    text = open(f'{S}/chunk{chunk}.txt').read()
    body = json.dumps({'model': model, 'messages': [{'role': 'user', 'content': PROMPT + text}], tok: 32000}).encode()
    req = urllib.request.Request(url, body, {'Authorization': 'Bearer placeholder', 'Content-Type': 'application/json'})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=900))
        r = r[0] if isinstance(r, list) else r
        out = r['choices'][0]['message'].get('content') or json.dumps(r)[:400]
    except Exception as e:
        out = 'ERROR ' + repr(e)[:300] + (e.read()[:300].decode('utf8', 'ignore') if hasattr(e, 'read') else '')
    open(f'{S}/out-{name}-chunk{chunk}.txt', 'w').write(out)
    return name, chunk, len(out)

jobs = [(m, u, mod, tok, c) for c in (1, 2) for (m, u, mod, tok) in
        (('gemini-4-hydrogen', G, 'gemini-4-hydrogen', 'max_tokens'), ('gpt-6.1-sol', O, 'gpt-6.1-sol', 'max_completion_tokens'))]
with cf.ThreadPoolExecutor(4) as ex:
    for r in ex.map(call, jobs):
        print(r, flush=True)
