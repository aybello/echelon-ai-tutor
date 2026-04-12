"""
Final fix for remaining TypeScript errors:
1. Remove local 'type DBQuestion = Q & {...}' that conflicts with imported DBQuestion
2. Fix dbModules used at module scope (before component) → move inside component
3. Fix Coll/Dist pages that still have Q type reference
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
    
    # ── Fix 1: Remove "type DBQuestion = Q & { text: string; correct: number };" ──
    content = re.sub(r'type DBQuestion = Q & \{[^}]+\};\n', '', content)
    if content != original:
        changes.append('removed local DBQuestion type')
    
    # ── Fix 2: Fix dbModules used at module scope ────────────────────────────
    # Pattern: "const MODULES: ModuleConfig[] = dbModules.map(..."
    # This is at module scope but dbModules comes from a hook inside the component.
    # Solution: Replace with a static array or move inside the component.
    # Better: Replace "dbModules.map(...)" at module scope with a static MODULE_CONFIG
    # that doesn't depend on the hook.
    # Actually, the WPI wastewater quiz pages had their own MODULE_COLORS/MODULE_CONFIG
    # that was already inline. The migration script replaced the module variable name
    # but it was used at module scope. We need to revert to using a static array.
    
    # Check if there's a "const MODULES" or similar at module scope using dbModules
    func_match = re.search(r'export default function \w+\(\)', content)
    if func_match:
        before_func = content[:func_match.start()]
        if 'dbModules' in before_func:
            # Replace dbModules with a static reference
            # These pages already have MODULE_COLORS or MODULE_CONFIG defined
            # The dbModules.map() was converting module names to ModuleConfig objects
            # Since the hook returns string[], we need to build the MODULES array inside the component
            
            # Find the line with dbModules and move it inside the component
            lines = content.split('\n')
            module_lines = []
            other_lines = []
            inside_modules_block = False
            
            for i, line in enumerate(lines):
                if 'dbModules' in line and i < content[:func_match.start()].count('\n'):
                    module_lines.append(line)
                    # Check if this is a multi-line expression
                    if line.rstrip().endswith('{'):
                        inside_modules_block = True
                elif inside_modules_block:
                    module_lines.append(line)
                    if ']);' in line or line.strip().startswith('}));'):
                        inside_modules_block = False
                else:
                    other_lines.append(line)
            
            if module_lines:
                # Reconstruct: put module_lines right after the hook call inside the component
                content = '\n'.join(other_lines)
                # Find the hook call and insert after it
                hook_pattern = r'(const allQuestions = dbQuestions as any\[\];)'
                hook_match = re.search(hook_pattern, content)
                if hook_match:
                    insert_pos = hook_match.end()
                    indent = '  '
                    module_code = '\n' + '\n'.join(indent + l.strip() for l in module_lines)
                    content = content[:insert_pos] + module_code + content[insert_pos:]
                    changes.append('moved dbModules usage inside component')
    
    if content != original:
        with open(filepath, 'w') as fh:
            fh.write(content)
        fixed += 1
        print(f'Fixed: {bn} — {", ".join(changes)}')

print(f'\nFixed {fixed} files')
