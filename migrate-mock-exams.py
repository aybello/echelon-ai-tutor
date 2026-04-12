"""
Migrate all 23 MockExamShell-based mock exam pages to use useQuestionBank hook.

These pages have a simple structure:
1. Import RAW questions from a lib file
2. Map to ExamQuestion[] format (POOL)
3. Define MODULE_TARGETS and MODULE_COLORS
4. Render MockExamShell with questionPool={POOL}

After migration:
1. Import useQuestionBank hook
2. Fetch questions + metadata from DB
3. Map DB questions to ExamQuestion[] format
4. Use moduleTargets from the hook
5. Keep MODULE_COLORS as-is (visual config, not data)
6. Show QuizSkeleton while loading
"""
import re, os, glob

PAGES_DIR = 'client/src/pages'

# Map from question file import to bankKey
FILE_TO_BANK = {
    'class1WastewaterQuestions': 'class1-wastewater',
    'class2WastewaterQuestions': 'class2-wastewater',
    'class2WaterQuestions': 'class2-water',
    'class3WastewaterQuestions': 'class3-wastewater',
    'class3WaterQuestions': 'class3-water',
    'class4WastewaterQuestions': 'class4-wastewater',
    'class4WaterQuestions': 'class4-water',
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

# Get all MockExamShell-based pages
mock_files = sorted(glob.glob(f'{PAGES_DIR}/*MockExam*.tsx'))
mock_files = [f for f in mock_files if 'MockExamShell' not in os.path.basename(f)]

fixed = 0

for filepath in mock_files:
    with open(filepath) as fh:
        content = fh.read()
    
    # Skip pages that don't use MockExamShell
    if 'MockExamShell' not in content:
        continue
    
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
    
    # 2. Add useQuestionBank import after MockExamShell import
    hook_import = 'import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";\nimport QuizSkeleton from "@/components/QuizSkeleton";\n'
    content = content.replace(
        'import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";\n',
        'import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";\n' + hook_import
    )
    
    # 3. Remove the POOL mapping at module scope
    # Pattern: const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({...}));
    content = re.sub(
        r'const POOL: ExamQuestion\[\] = \(RAW as any\[\]\)\.map\(q => \(\{[^}]+\}\)\);\n',
        '',
        content
    )
    
    # 4. Remove MODULE_TARGETS at module scope (will come from DB)
    # Pattern: const MODULE_TARGETS: Record<string, number> = { ... };
    content = re.sub(
        r'const MODULE_TARGETS: Record<string, number> = \{[^}]+\};\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    # 5. Find the component function and add hook + POOL inside it
    func_match = re.search(r'(export default function \w+\(\) \{)\n(\s*return \()', content)
    if func_match:
        func_decl = func_match.group(1)
        return_stmt = func_match.group(2)
        
        hook_code = f'''
  const {{ questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading }} = useQuestionBank("{bank_key}");
  
  const POOL: ExamQuestion[] = (dbQuestions as any[]).map((q: any) => ({{
    id: q.id, module: q.module,
    question: q.question ?? q.text ?? "",
    options: q.options,
    correct: q.correctIndex ?? q.correct ?? q.correctAnswer ?? 0,
    explanation: q.explanation,
  }}));

  if (bankLoading) return <QuizSkeleton />;

'''
        content = content.replace(
            func_decl + '\n' + return_stmt,
            func_decl + hook_code + return_stmt
        )
    
    # 6. Replace moduleTargets={MODULE_TARGETS} with moduleTargets={dbModuleTargets ?? {}}
    content = content.replace(
        'moduleTargets={MODULE_TARGETS}',
        'moduleTargets={dbModuleTargets ?? {}}'
    )
    
    # 7. Update POOL.length references (they still work since POOL is now computed inside component)
    
    if content != original:
        with open(filepath, 'w') as fh:
            fh.write(content)
        fixed += 1
        print(f'Migrated: {bn} → bankKey={bank_key}')

print(f'\nMigrated {fixed} MockExamShell-based pages')
