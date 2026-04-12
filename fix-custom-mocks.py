"""
Fix TypeScript errors in the 6 custom mock exam pages:
1. .correct → .correctIndex (DB field name)
2. .q → .question (DB field name)
3. .formula → .tip (DB field name)
4. 'type' property in object literal → remove or cast
5. allQuestions at module scope → move inside component
6. getExamQuestions → fix the function reference
7. WQA_FORMULA_LINKS → formulaLinks from hook
8. Question type → DBQuestion
9. implicit any → add type annotations
10. difficulty null check
"""
import re, os

PAGES_DIR = 'client/src/pages'

CUSTOM_MOCKS = [
    'Class1MockExam.tsx',
    'Class1WaterMockExam.tsx',
    'MockExam.tsx',
    'OITMockExam.tsx',
    'OITWastewaterMockExam.tsx',
    'WQAMockExam.tsx',
]

fixed = 0

for filename in CUSTOM_MOCKS:
    filepath = os.path.join(PAGES_DIR, filename)
    if not os.path.exists(filepath):
        continue
    
    with open(filepath) as fh:
        content = fh.read()
    
    original = content
    changes = []
    
    # ── Fix 1: .correct → .correctIndex ──────────────────────────────────────
    # Replace q.correct with (q as any).correctIndex where q is a question object
    # Be careful not to replace results.correct, acc[mod].correct, etc.
    # Pattern: questions[i]?.correct → questions[i]?.correctIndex
    content = content.replace('questions[i]?.correct', '(questions[i] as any)?.correctIndex')
    # Pattern: q.correct → (q as any).correctIndex (when q is a question)
    # But only in specific contexts like q.options[q.correct]
    content = re.sub(r'q\.options\[q\.correct\]', 'q.options[(q as any).correctIndex]', content)
    content = re.sub(r'q\.correct\b(?!\s*[+\-*/])', '(q as any).correctIndex', content)
    # Fix: userAns === q.correct
    content = content.replace('userAns === (q as any).correctIndex', 'userAns === ((q as any).correctIndex ?? (q as any).correct)')
    # Fix double casting
    content = content.replace('((q as any) as any)', '(q as any)')
    
    # ── Fix 2: .q → .question ────────────────────────────────────────────────
    # The OIT questions used 'q' field, DB uses 'question'
    # Pattern: q.q → q.question (but be careful with variable name 'q')
    # This is tricky because the loop variable is also named 'q'
    # Look for specific patterns like currentQ.q or q.q where it's a field access
    content = re.sub(r'currentQ\.q\b', 'currentQ.question', content)
    content = re.sub(r'(?<!\w)q\.q\b(?!u)', '(q as any).question', content)
    
    # ── Fix 3: .formula → handled by tip or cast ────────────────────────────
    content = re.sub(r'\.formula\b', '.tip', content)
    
    # ── Fix 4: 'type' property doesn't exist on DBQuestion ──────────────────
    # This is from OIT questions that have a 'type' field
    # Cast to any where type is accessed
    content = re.sub(r'(?<!\w)q\.type\b', '(q as any).type', content)
    content = re.sub(r'currentQ\.type\b', '(currentQ as any).type', content)
    
    # ── Fix 5: allQuestions at module scope → move inside component ──────────
    # The selectExamQuestions function uses allQuestions at module scope
    # We need to make it accept allQuestions as a parameter
    # Find: function selectExamQuestions(): DBQuestion[] {
    #   const pool = [...allQuestions]...
    # Replace with: function that takes pool as param
    
    # For Class1WaterMockExam: selectExamQuestions uses CLASS1_WATER_QUESTIONS (now allQuestions)
    # which is at module scope but allQuestions is inside the component
    # Solution: make selectExamQuestions a function inside the component
    
    # Check if selectExamQuestions is defined at module scope
    select_fn_match = re.search(r'^function selectExamQuestions\(\)', content, re.MULTILINE)
    if select_fn_match:
        # Move it inside the component by making it take a pool parameter
        content = content.replace(
            'function selectExamQuestions(): DBQuestion[]',
            'function selectExamQuestions(questionPool: DBQuestion[]): DBQuestion[]'
        )
        content = content.replace(
            'const pool = [...allQuestions]',
            'const pool = [...questionPool]'
        )
        # Update call sites: selectExamQuestions() → selectExamQuestions(allQuestions)
        content = re.sub(r'selectExamQuestions\(\)', 'selectExamQuestions(allQuestions)', content)
        changes.append('selectExamQuestions takes pool param')
    
    # For Class1MockExam: getExamQuestions was renamed from getClass1Questions
    # which also uses allQuestions at module scope
    if 'getExamQuestions' in content and 'function getExamQuestions' not in content:
        # getExamQuestions doesn't exist - it was renamed from getClass1Questions
        # but getClass1Questions was imported from the lib file which is now removed
        # We need to define it inline
        content = content.replace('getExamQuestions(', 'selectExamQuestions(allQuestions, ')
        # But selectExamQuestions may not exist either. Let's check.
        if 'function selectExamQuestions' not in content:
            # Need to add a selectExamQuestions function
            # Find the component function
            func_match = re.search(r'export default function \w+\(\) \{', content)
            if func_match:
                # Add before the component
                select_fn = '''
function selectExamQuestions(pool: DBQuestion[], count: number = 100): DBQuestion[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

'''
                content = content[:func_match.start()] + select_fn + content[func_match.start():]
                changes.append('added selectExamQuestions')
    
    # ── Fix 6: WQA_FORMULA_LINKS → formulaLinks ─────────────────────────────
    if 'WQA_FORMULA_LINKS' in content:
        content = content.replace('WQA_FORMULA_LINKS', 'formulaLinks')
        # Make sure formulaLinks is in the hook destructuring
        if 'formulaLinks' not in content.split('useQuestionBank')[0]:
            content = content.replace(
                'moduleTargets: dbModuleTargets,',
                'moduleTargets: dbModuleTargets, formulaLinks,'
            )
        changes.append('WQA_FORMULA_LINKS→formulaLinks')
    
    # ── Fix 7: Question type still referenced ────────────────────────────────
    content = re.sub(r'\bQuestion\b(?!Bank|Pool|s\b)', 'DBQuestion', content)
    # Fix double: DBDBQuestion
    content = content.replace('DBDBQuestion', 'DBQuestion')
    
    # ── Fix 8: implicit any ──────────────────────────────────────────────────
    content = re.sub(r'\.filter\(q =>', '.filter((q: any) =>', content)
    content = re.sub(r'\.map\(q =>', '.map((q: any) =>', content)
    content = re.sub(r'\.filter\(\(q\) =>', '.filter((q: any) =>', content)
    content = re.sub(r'\.map\(\(q\) =>', '.map((q: any) =>', content)
    # Don't double-annotate
    content = content.replace('(q: any: any)', '(q: any)')
    content = content.replace('((q: any): any)', '(q: any)')
    
    # ── Fix 9: difficulty null check ─────────────────────────────────────────
    content = content.replace("currentQ.difficulty", "(currentQ.difficulty ?? 'medium')")
    content = content.replace("((currentQ.difficulty ?? 'medium') ?? 'medium')", "(currentQ.difficulty ?? 'medium')")
    
    # ── Fix 10: number vs string for logAttempt questionId ───────────────────
    # If logAttempt expects string but gets number, cast it
    
    if content != original:
        with open(filepath, 'w') as fh:
            fh.write(content)
        fixed += 1
        print(f'Fixed: {filename} — {", ".join(changes) if changes else "type fixes"}')

print(f'\nFixed {fixed} files')
