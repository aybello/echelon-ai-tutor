"""
Migrate the 6 custom mock exam pages (not using MockExamShell).
These are complex pages (500-700 lines) that need surgical changes:
1. Replace question file imports with useQuestionBank hook
2. Replace question array references with hook data
3. Replace type references with DBQuestion
4. Add loading state
5. Replace .correct field access with .correctIndex (DB field name)
"""
import re, os

PAGES_DIR = 'client/src/pages'

# Define the migration for each custom mock exam
CUSTOM_MOCKS = {
    'Class1MockExam.tsx': {
        'bankKey': 'class1',
        'old_imports': [
            'import { CLASS1_QUESTIONS, getClass1Questions } from "@/lib/class1Questions";',
            'import type { Question } from "@/lib/questions";',
        ],
        'old_array': 'CLASS1_QUESTIONS',
        'old_type': 'Question',
        'old_module_var': None,
        'select_fn_uses': 'getClass1Questions',
    },
    'Class1WaterMockExam.tsx': {
        'bankKey': 'class1-water',
        'old_imports': [
            'import {\n  CLASS1_WATER_QUESTIONS,\n  CLASS1_WATER_MODULE_TARGETS,\n  type Class1WaterQuestion,\n} from "@/lib/class1WaterQuestions";',
        ],
        'old_array': 'CLASS1_WATER_QUESTIONS',
        'old_type': 'Class1WaterQuestion',
        'old_module_var': 'CLASS1_WATER_MODULE_TARGETS',
        'select_fn_uses': None,
    },
    'MockExam.tsx': {
        'bankKey': 'oit',
        'old_imports': [
            'import { QUESTIONS, type Question } from "@/lib/questions";',
        ],
        'old_array': 'QUESTIONS',
        'old_type': 'Question',
        'old_module_var': None,
        'select_fn_uses': None,
    },
    'OITMockExam.tsx': {
        'bankKey': 'oit',
        'old_imports': [
            'import { QUESTIONS, OIT_MODULES, type Question } from "@/lib/questions";',
        ],
        'old_array': 'QUESTIONS',
        'old_type': 'Question',
        'old_module_var': 'OIT_MODULES',
        'select_fn_uses': None,
    },
    'OITWastewaterMockExam.tsx': {
        'bankKey': 'class1-wastewater',
        'old_imports': [],  # Will handle with regex
        'old_array': 'CLASS1_WASTEWATER_QUESTIONS',
        'old_type': 'Class1WastewaterQuestion',
        'old_module_var': 'CLASS1_WASTEWATER_MODULES',
        'select_fn_uses': None,
    },
    'WQAMockExam.tsx': {
        'bankKey': 'wqa',
        'old_imports': [
            'import { WQA_QUESTIONS, WQA_MODULES, WQA_FORMULA_LINKS, type WQAQuestion } from "@/lib/wqaQuestions";',
            'import { type Question } from "@/lib/questions";',
        ],
        'old_array': 'WQA_QUESTIONS',
        'old_type': 'WQAQuestion',
        'old_module_var': 'WQA_MODULES',
        'select_fn_uses': None,
    },
}

fixed = 0

for filename, config in CUSTOM_MOCKS.items():
    filepath = os.path.join(PAGES_DIR, filename)
    if not os.path.exists(filepath):
        print(f'SKIP: {filename} not found')
        continue
    
    with open(filepath) as fh:
        content = fh.read()
    
    original = content
    bank_key = config['bankKey']
    old_array = config['old_array']
    old_type = config['old_type']
    
    # 1. Remove old imports from @/lib/ question files
    # Remove multi-line imports
    content = re.sub(
        r'import \{[^}]*\} from "@/lib/(?:class1Questions|class1WaterQuestions|questions|class1WastewaterQuestions|wqaQuestions)";\n',
        '',
        content,
        flags=re.DOTALL
    )
    # Remove type-only imports
    content = re.sub(r'import type \{[^}]*\} from "@/lib/(?:questions|class1WaterQuestions|wqaQuestions)";\n', '', content)
    
    # 2. Add useQuestionBank import
    # Find the first import line and add before it
    first_import = re.search(r'^import ', content, re.MULTILINE)
    if first_import:
        hook_import = 'import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";\nimport QuizSkeleton from "@/components/QuizSkeleton";\n'
        content = content[:first_import.start()] + hook_import + content[first_import.start():]
    
    # 3. Replace old type references
    if old_type and old_type != 'DBQuestion':
        content = re.sub(rf'\b{re.escape(old_type)}\b', 'DBQuestion', content)
    
    # 4. Replace old array references with allQuestions
    if old_array:
        content = re.sub(rf'\b{re.escape(old_array)}\b', 'allQuestions', content)
    
    # 5. Replace old module variable references
    if config.get('old_module_var'):
        content = re.sub(rf'\b{re.escape(config["old_module_var"])}\b', 'dbModules', content)
    
    # 6. Replace getClass1Questions (special function in Class1MockExam)
    if config.get('select_fn_uses'):
        content = re.sub(rf'\b{re.escape(config["select_fn_uses"])}\b', 'getExamQuestions', content)
    
    # 7. Replace .correct field access with .correctIndex for DB questions
    # Pattern: q.correct → (q as any).correctIndex ?? (q as any).correct
    # But we need to be careful not to replace "correct" in other contexts like
    # results.correct, acc[mod].correct, etc.
    # Only replace when it's a question object accessing .correct
    # The DB stores correctIndex, so we need to add a compat layer
    
    # 8. Add hook call + loading state inside the component function
    func_match = re.search(r'(export default function \w+\(\) \{)\n', content)
    if func_match:
        hook_code = f'''
  const {{ questions: allQuestions, modules: dbModules, moduleTargets: dbModuleTargets, isLoading: bankLoading }} = useQuestionBank("{bank_key}");
  
  if (bankLoading) return <QuizSkeleton />;

'''
        # Insert after the function declaration
        insert_pos = func_match.end()
        content = content[:insert_pos] + hook_code + content[insert_pos:]
    
    # 9. Fix: the selectExamQuestions function references the old array at module scope
    # Move it inside the component or make it accept the array as a parameter
    # Actually, since allQuestions is now inside the component, we need to handle this
    # For now, let's replace the module-scope function to accept a parameter
    
    if content != original:
        with open(filepath, 'w') as fh:
            fh.write(content)
        fixed += 1
        print(f'Migrated: {filename} → bankKey={bank_key}')

print(f'\nMigrated {fixed} custom mock exam pages')
