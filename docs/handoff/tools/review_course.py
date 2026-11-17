#!/usr/bin/env python3
"""Review a CE course draft with GPT-6.1 Sol and Gemini hydrogen. Plants errors in a review copy.
usage: review_course.py <course.json> <outdir>"""
import json, sys, re, random, os, urllib.request, concurrent.futures as cf

src, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
d = json.load(open(src))
random.seed(7)

def strip_svg(s):
    return re.sub(r'<svg.*?</svg>', '[diagram]', s, flags=re.S)

# build review units: one per module (lesson + checks) and one for each final set
units = []
plants = []
for m in d['modules']:
    units.append(('module:' + m['id'], strip_svg(m['lesson']), m['checks']))
units.append(('final', '', d['finalAssessment']))
units.append(('final-alt', '', d.get('alternateFinalAssessment', [])))

def plant(unit):
    name, lesson, qs = unit
    qs = json.loads(json.dumps(qs))
    done = []
    if qs:
        i = random.randrange(len(qs))
        q = qs[i]
        wrong = [k for k in range(4) if k != q['correctIndex']]
        q['correctIndex'] = random.choice(wrong)
        done.append({'unit': name, 'kind': 'wrong key', 'id': q['id']})
        j = random.choice([k for k in range(len(qs)) if k != i])
        e = qs[j]['explanation']
        nums = [n for n in re.findall(r'\d+(?:\.\d+)?', e) if float(n) > 1]
        if nums:
            n = nums[-1]
            new = str(round(float(n) * 1.5 + 2, 2)).rstrip('0').rstrip('.')
            qs[j]['explanation'] = e[::-1].replace(n[::-1], new[::-1], 1)[::-1]
            if qs[j]['explanation'] != e:
                done.append({'unit': name, 'kind': 'altered explanation number', 'id': qs[j]['id']})
    if lesson:
        nums = [(m.start(), m.group()) for m in re.finditer(r'\b\d+(?:\.\d+)?\b', lesson) if float(m.group()) > 1]
        if nums:
            pos, n = nums[len(nums) // 2]
            new = str(round(float(n) * 2 + 3, 2)).rstrip('0').rstrip('.')
            ctx = lesson[max(0, pos - 40): pos + 40].replace('\n', ' ')
            lesson = lesson[:pos] + new + lesson[pos + len(n):]
            done.append({'unit': name, 'kind': 'altered lesson number', 'was': n, 'now': new, 'context': ctx})
    return (name, lesson, qs), done

review_units = []
for u in units:
    ru, p = plant(u)
    review_units.append(ru)
    plants += p
json.dump(plants, open(f'{outdir}/plants.json', 'w'), indent=1)

PROMPT = """You are a licensed water and wastewater operator trainer reviewing a draft training course on {topic}.
Check every statement of fact, formula, constant, unit, worked-example calculation, and every quiz question's marked correct answer and explanation.
List ONLY real problems. For each: where it is (unit / question id / quote), what is wrong, and the fix. Recompute every number yourself.
If something is merely debatable or stylistic, label it NIT. Say 'No problems found' for a unit with none.
Questions are shown with choices (A-D); correctIndex is 0-based (0=A).

UNIT: {name}
LESSON TEXT:
{lesson}

QUESTIONS (JSON):
{qs}
"""

def call(model, prompt):
    if model.startswith('gemini'):
        url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
        body = {'model': model, 'messages': [{'role': 'user', 'content': prompt}], 'max_tokens': 32000}
    else:
        url = 'https://api.openai.com/v1/chat/completions'
        body = {'model': model, 'messages': [{'role': 'user', 'content': prompt}], 'max_completion_tokens': 32000}
    req = urllib.request.Request(url, json.dumps(body).encode(), {'Content-Type': 'application/json', 'Authorization': 'Bearer placeholder'})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.load(r)['choices'][0]['message']['content']

def job(args):
    model, (name, lesson, qs) = args
    p = PROMPT.format(topic=d['title'], name=name, lesson=lesson or '(none)', qs=json.dumps(qs, indent=1))
    try:
        out = call(model, p)
    except Exception as e:
        out = 'ERROR ' + repr(e)
    fn = f"{outdir}/{model}--{name.replace(':', '_')}.txt"
    open(fn, 'w').write(out)
    return fn

jobs = [(m, u) for m in ('gpt-6.1-sol', 'gemini-4-hydrogen') for u in review_units]
with cf.ThreadPoolExecutor(6) as ex:
    for fn in ex.map(job, jobs):
        print('done', fn)
