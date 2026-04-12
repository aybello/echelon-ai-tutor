"""
Fix remaining errors in Coll/Dist quiz pages and other files:
1. Remove local 'type DBQuestion = ...' that conflicts with imported DBQuestion
2. Remove 'type Q = typeof allQuestions[0]' that references allQuestions before it exists
3. Fix 'correctAnswer' property access on DBQuestion
4. Fix dbModules references where the hook destructuring doesn't include modules
5. Fix formulaLinks null→undefined
"""
import re, glob, os

PAGES_DIR = 'client/src/pages'
quiz_files = sorted(glob.glob(f'{PAGES_DIR}/*Quiz*.tsx'))
quiz_files = [f for f in quiz_files if 'Mock' not in f and 'Flashcard' not in f]

fixed = 0

for filepath in quiz_files:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath) as fh:
        content = fh.read()
    
    original = content
    bn = os.path.basename(filepath)
    changes = []
    
    # ── Fix 1: Remove local type DBQuestion that conflicts with import ───────
    # Pattern: "type DBQuestion = Q & { text: string; correct: number };"
    content = re.sub(r'type DBQuestion = [^;]+;\n', '', content)
    
    # ── Fix 2: Remove "type Q = typeof allQuestions[0];" ─────────────────────
    content = re.sub(r'type Q = typeof allQuestions\[0\];\n', '', content)
    
    # ── Fix 3: Fix correctAnswer access ──────────────────────────────────────
    # Replace .correctAnswer with .correctIndex where it's directly accessed
    # But keep the fallback chain pattern: (current as any).correctAnswer ?? (current as any).correct ?? (current as any).correctIndex
    # The issue is when it's accessed without 'as any' cast
    # Pattern: current.correctAnswer → (current as any).correctIndex
    content = re.sub(
        r'current\.correctAnswer\b',
        '(current as any).correctIndex',
        content
    )
    # Also fix: (current as any).correctAnswer → (current as any).correctIndex  
    # in the fallback chain, simplify to just use correctIndex
    content = re.sub(
        r'\(current as any\)\.correctAnswer\s*\?\?\s*\(current as any\)\.correct\s*\?\?\s*\(current as any\)\.correctIndex\s*\?\?\s*0',
        '(current as any).correctIndex ?? 0',
        content
    )
    
    # ── Fix 4: Ensure hook destructuring includes modules ────────────────────
    # Check if dbModules is used but not in the destructuring
    if 'dbModules' in content:
        if 'modules: dbModules' not in content:
            # Add modules: dbModules to the hook destructuring
            content = content.replace(
                'const { questions: dbQuestions,',
                'const { questions: dbQuestions, modules: dbModules,'
            )
            # Remove duplicate if it creates one
            content = content.replace('modules: dbModules, modules: dbModules,', 'modules: dbModules,')
            changes.append('added dbModules to destructuring')
    
    # ── Fix 5: Fix formulaLinks null→undefined ───────────────────────────────
    if 'formulaLinks={formulaLinks}' in content:
        content = content.replace(
            'formulaLinks={formulaLinks}',
            'formulaLinks={formulaLinks ?? undefined}'
        )
        changes.append('formulaLinks null→undefined')
    
    # ── Fix 6: Fix allQuestions reference in Coll/Dist pages ─────────────────
    # These pages have a local shuffle function and use allQuestions at module scope
    # We need to make sure allQuestions is only used inside the component
    # Check if there's a reference to allQuestions before the component function
    func_match = re.search(r'export default function \w+\(\)', content)
    if func_match:
        before_func = content[:func_match.start()]
        if 'allQuestions' in before_func:
            # Remove any allQuestions reference before the function
            before_func = re.sub(r'.*allQuestions.*\n', '', before_func)
            content = before_func + content[func_match.start():]
            changes.append('removed allQuestions before component')
    
    if content != original:
        with open(filepath, 'w') as fh:
            fh.write(content)
        fixed += 1
        print(f'Fixed: {bn} — {", ".join(changes) if changes else "type fixes"}')

print(f'\nFixed {fixed} files')
