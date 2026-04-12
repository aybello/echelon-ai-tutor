"""
Migrate all 27 flashcard pages from static imports to useQuestionBank hook.

All flashcard pages follow the same pattern:
1. Import questions + modules from @/lib/
2. Pass to FlashcardShell as props
3. Wrap in PurchaseGate and/or FlashcardErrorBoundary

After migration:
1. Import useQuestionBank hook
2. Fetch questions + modules from DB
3. Pass DB data to FlashcardShell
4. Show QuizSkeleton while loading
"""
import re, os, glob

PAGES_DIR = 'client/src/pages'

# Map from question file import to bankKey
FILE_TO_BANK = {
    'class1WastewaterQuestions': 'class1-wastewater',
    'class1WaterQuestions': 'class1-water',
    'class2WastewaterQuestions': 'class2-wastewater',
    'class2WaterQuestions': 'class2-water',
    'class3WastewaterQuestions': 'class3-wastewater',
    'class3WaterQuestions': 'class3-water',
    'class4WastewaterQuestions': 'class4-wastewater',
    'class4WaterQuestions': 'class4-water',
    'questions': 'oit',
    'wqaQuestions': 'wqa',
    'wpiClass1WastewaterQuestions': 'wpi-class1-wastewater',
    'wpiClass1WastewaterCollQuestions': 'wpi-class1-wastewater-coll',
    'wpiClass1WaterDistQuestions': 'wpi-class1-water-dist',
    'wpiClass1WaterQuestions': 'wpi-class1-water',
    'wpiClass2WastewaterQuestions': 'wpi-class2-wastewater',
    'wpiClass2WastewaterCollQuestions': 'wpi-class2-wastewater-coll',
    'wpiClass2WaterDistQuestions': 'wpi-class2-water-dist',
    'wpiClass2WaterQuestions': 'wpi-class2-water',
    'wpiClass3WastewaterQuestions': 'wpi-class3-wastewater',
    'wpiClass3WastewaterCollQuestions': 'wpi-class3-wastewater-coll',
    'wpiClass3WaterDistQuestions': 'wpi-class3-water-dist',
    'wpiClass3WaterQuestions': 'wpi-class3-water',
    'wpiClass4WastewaterQuestions': 'wpi-class4-wastewater',
    'wpiClass4WastewaterCollQuestions': 'wpi-class4-wastewater-coll',
    'wpiClass4WaterDistQuestions': 'wpi-class4-water-dist',
    'wpiClass4WaterQuestions': 'wpi-class4-water',
}

flashcard_files = sorted(glob.glob(f'{PAGES_DIR}/*Flashcard*.tsx'))
fixed = 0

for filepath in flashcard_files:
    with open(filepath) as fh:
        content = fh.read()
    
    original = content
    bn = os.path.basename(filepath)
    
    # Find the import from @/lib/
    lib_match = re.search(r'import \{[^}]+\} from "@/lib/(\w+)"', content)
    if not lib_match:
        print(f'SKIP: {bn} — no @/lib import found')
        continue
    
    lib_file = lib_match.group(1)
    bank_key = FILE_TO_BANK.get(lib_file)
    if not bank_key:
        print(f'SKIP: {bn} — unknown lib file: {lib_file}')
        continue
    
    # 1. Remove the old import line
    content = re.sub(r'import \{[^}]+\} from "@/lib/\w+";\n', '', content)
    
    # 2. Add useQuestionBank import
    hook_import = 'import { useQuestionBank } from "@/hooks/useQuestionBank";\nimport QuizSkeleton from "@/components/QuizSkeleton";\n'
    # Add after the first import
    first_import = re.search(r'^import ', content, re.MULTILINE)
    if first_import:
        content = content[:first_import.start()] + hook_import + content[first_import.start():]
    
    # 3. Find the component function and add hook + loading state
    func_match = re.search(r'(export default function \w+\(\) \{)\n', content)
    if func_match:
        hook_code = f'''
  const {{ questions, modules, isLoading }} = useQuestionBank("{bank_key}");
  if (isLoading) return <QuizSkeleton />;

'''
        insert_pos = func_match.end()
        content = content[:insert_pos] + hook_code + content[insert_pos:]
    
    # 4. Replace question array references with 'questions'
    # Find the original variable name used in questions={...}
    q_prop_match = re.search(r'questions=\{(\w+)', content)
    if q_prop_match:
        old_var = q_prop_match.group(1)
        # Replace in the questions prop
        content = content.replace(
            f'questions={{{old_var} as unknown as FlashcardQuestion[]}}',
            'questions={questions as unknown as FlashcardQuestion[]}'
        )
    
    # 5. Replace modules array references with 'modules'
    m_prop_match = re.search(r'modules=\{(\w+)', content)
    if m_prop_match:
        old_mod_var = m_prop_match.group(1)
        # Replace in the modules prop
        content = content.replace(
            f'modules={{{old_mod_var} as unknown as string[]}}',
            'modules={modules as unknown as string[]}'
        )
    
    if content != original:
        with open(filepath, 'w') as fh:
            fh.write(content)
        fixed += 1
        print(f'Migrated: {bn} → bankKey={bank_key}')

print(f'\nMigrated {fixed} flashcard pages')
