"""Fix remaining QCompat/CompatQ type references in migrated quiz pages."""
import re, glob

files = glob.glob('client/src/pages/Wpi*Quiz*.tsx')
fixed = 0

for f in files:
    with open(f) as fh:
        content = fh.read()
    
    original = content
    
    # Replace QCompat with DBQuestion
    content = content.replace('QCompat', 'DBQuestion')
    
    # Replace CompatQ type declarations
    # "type CompatQ = Q & { text: string; correct: number };"
    content = re.sub(r'type CompatQ = [^;]+;\n', '', content)
    
    # Replace CompatQ usage with DBQuestion
    content = content.replace('CompatQ', 'DBQuestion')
    
    # Remove the "// toCompat no longer needed" comment
    content = content.replace('// toCompat no longer needed — DB returns unified question format\n', '')
    
    # Fix useState initialization that references toCompat or shuffle of allQuestions at init time
    # These need to be deferred since allQuestions comes from the hook and is empty at first render
    # Pattern: useState<DBQuestion | null>((shuffle([...allQuestions])[0]))
    # Replace with: useState<DBQuestion | null>(null)
    content = re.sub(
        r'useState<DBQuestion \| null>\(\(shuffle\(\[\.\.\.allQuestions\]\)\[0\]\)\)',
        'useState<DBQuestion | null>(null)',
        content
    )
    content = re.sub(
        r'useState<DBQuestion \| null>\(\n\s*\(\) => \(shuffle\(\[\.\.\.allQuestions\]\)\[0\]\)\n\s*\)',
        'useState<DBQuestion | null>(null)',
        content
    )
    # Also handle: useState<QCompat | null>(() => toCompat(shuffle([...wpiClass1WaterQuestions])[0]))
    # which after migration became: useState<DBQuestion | null>(() => (shuffle([...allQuestions])[0]))
    content = re.sub(
        r'useState<DBQuestion \| null>\(\(\) => \(shuffle\(\[\.\.\.allQuestions\]\)\[0\]\)\)',
        'useState<DBQuestion | null>(null)',
        content
    )
    
    # Also fix: useState<DBQuestion | null>(() => (allQuestions[0]))
    content = re.sub(
        r'useState<DBQuestion \| null>\(\(\) => \(allQuestions\[0\]\)\)',
        'useState<DBQuestion | null>(null)',
        content
    )
    
    # Fix remaining old type references in HistoryEntry
    # "questionObj: WpiClass1WaterQuestion" → "questionObj: DBQuestion"
    content = re.sub(r'questionObj:\s*Wpi\w+Question', 'questionObj: DBQuestion', content)
    
    if content != original:
        with open(f, 'w') as fh:
            fh.write(content)
        fixed += 1
        print(f'Fixed: {f}')

print(f'\nFixed {fixed} files')
