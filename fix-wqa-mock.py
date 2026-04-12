"""Fix WQAMockExam.tsx specific issues:
1. toQ function returns object with 'type' field not in DBQuestion → cast as any
2. selectExamQuestions parameter needs type annotation
3. dbModules used at module scope → move selectExamQuestions inside component
4. formulaLinks possibly null → add null check
5. idMap.has(q.id) expects string but q.id is number → fix
"""
with open('client/src/pages/WQAMockExam.tsx') as f:
    content = f.read()

# Fix 1: toQ return type - cast to any to allow extra fields
content = content.replace(
    'function toQ(q: DBQuestion): DBQuestion {',
    'function toQ(q: any): any {'
)

# Fix 2: idMap uses string keys but q.id may be number - use String()
content = content.replace('if (!idMap.has(q.id))', 'if (!idMap.has(String(q.id)))')
content = content.replace('idMap.set(q.id,', 'idMap.set(String(q.id),')
content = content.replace('reverseIdMap.set(_idCounter, q.id)', 'reverseIdMap.set(_idCounter, String(q.id))')
content = content.replace('id: idMap.get(q.id)!,', 'id: idMap.get(String(q.id))!,')

# Fix 3: selectExamQuestions parameter type
content = content.replace(
    'function selectExamQuestions(allQuestions): DBQuestion[] {',
    'function selectExamQuestions(allQuestions: any[], dbMods: string[]): any[] {'
)

# Fix 4: dbModules used inside selectExamQuestions at module scope
content = content.replace(
    '  for (const mod of dbModules) {',
    '  for (const mod of dbMods) {'
)

# Fix 5: Update call to selectExamQuestions to pass dbModules
content = content.replace(
    'selectExamQuestions(allQuestions)',
    'selectExamQuestions(allQuestions, dbModules)'
)

# Fix 6: formulaLinks possibly null
content = content.replace(
    'formulaLinks[',
    '(formulaLinks ?? {})[' 
)

# Fix 7: q.q → q.question in toQ (the field mapping)
content = content.replace(
    '    q: q.question,',
    '    question: q.question,'
)

with open('client/src/pages/WQAMockExam.tsx', 'w') as f:
    f.write(content)
print('Fixed WQAMockExam.tsx')
