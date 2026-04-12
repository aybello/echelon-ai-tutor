/**
 * migrate-quiz-pages.mjs
 * Automated migration of quiz pages from static imports to useQuestionBank hook.
 * 
 * Strategy:
 * 1. Remove static question/module/overview imports from @/lib/*Questions* and @/lib/moduleOverviews
 * 2. Add useQuestionBank hook import and QuizSkeleton import
 * 3. Add the hook call at the top of the component
 * 4. Replace references to the old variables with hook-provided ones
 * 5. Add loading guard with QuizSkeleton
 * 6. Handle the OIT 'q' field → 'question' field mapping
 */
import fs from 'fs';
import path from 'path';

// ─── Quiz page configurations ───────────────────────────────────────────────
// Each entry maps a quiz page file to its bankKey and the variable names used
const QUIZ_PAGES = [
  {
    file: 'Class1WaterQuiz.tsx',
    bankKey: 'class1-water',
    questionsVar: 'CLASS1_WATER_QUESTIONS',
    modulesVar: 'CLASS1_WATER_MODULES',
    overviewsVar: 'CLASS1_WATER_OVERVIEWS',
    questionImportFile: 'class1WaterQuestions',
    typeImport: 'Class1WaterQuestion',
    moduleConfigInline: true, // has MODULE_CONFIG inline
    formulaLinksVar: null,
  },
  {
    file: 'Class1WastewaterQuiz.tsx',
    bankKey: 'class1-wastewater',
    questionsVar: 'CLASS1_WASTEWATER_QUESTIONS',
    modulesVar: 'CLASS1_WASTEWATER_MODULES',
    overviewsVar: 'CLASS1_WASTEWATER_OVERVIEWS',
    questionImportFile: 'class1WastewaterQuestions',
    typeImport: 'Class1WastewaterQuestion',
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'Class2WaterQuiz.tsx',
    bankKey: 'class2-water',
    questionsVar: 'QUESTIONS',
    questionsAlias: 'CLASS2_WATER_QUESTIONS',
    modulesVar: 'CLASS2_WATER_MODULES',
    overviewsVar: 'CLASS2_WATER_OVERVIEWS',
    questionImportFile: 'class2WaterQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'Class2WastewaterQuiz.tsx',
    bankKey: 'class2-wastewater',
    questionsVar: 'CLASS2_WW_QUESTIONS',
    modulesVar: 'CLASS2_WASTEWATER_MODULES',
    overviewsVar: 'CLASS2_WASTEWATER_OVERVIEWS',
    questionImportFile: 'class2WastewaterQuestions',
    typeImport: 'C2WWQuestion',
    moduleConfigInline: true,
    formulaLinksVar: 'CLASS2_WW_FORMULA_LINKS',
  },
  {
    file: 'Class3WaterQuiz.tsx',
    bankKey: 'class3-water',
    questionsVar: 'QUESTIONS',
    questionsAlias: 'CLASS3_WATER_QUESTIONS',
    modulesVar: 'CLASS3_WATER_MODULES',
    overviewsVar: 'CLASS3_WATER_OVERVIEWS',
    questionImportFile: 'class3WaterQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'Class3WastewaterQuiz.tsx',
    bankKey: 'class3-wastewater',
    questionsVar: 'CLASS3_WW_QUESTIONS',
    modulesVar: 'CLASS3_WASTEWATER_MODULES',
    overviewsVar: 'CLASS3_WASTEWATER_OVERVIEWS',
    questionImportFile: 'class3WastewaterQuestions',
    typeImport: 'C3WWQuestion',
    moduleConfigInline: true,
    formulaLinksVar: 'CLASS3_WW_FORMULA_LINKS',
  },
  {
    file: 'Class4WaterQuiz.tsx',
    bankKey: 'class4-water',
    questionsVar: 'QUESTIONS',
    questionsAlias: 'CLASS4_WATER_QUESTIONS',
    modulesVar: 'CLASS4_WATER_MODULES',
    overviewsVar: 'CLASS4_WATER_OVERVIEWS',
    questionImportFile: 'class4WaterQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'Class4WastewaterQuiz.tsx',
    bankKey: 'class4-wastewater',
    questionsVar: 'CLASS4_WW_QUESTIONS',
    modulesVar: 'CLASS4_WASTEWATER_MODULES',
    overviewsVar: 'CLASS4_WASTEWATER_OVERVIEWS',
    questionImportFile: 'class4WastewaterQuestions',
    typeImport: 'C4WWQuestion',
    moduleConfigInline: true,
    formulaLinksVar: 'CLASS4_WW_FORMULA_LINKS',
  },
  {
    file: 'OITWastewaterQuiz.tsx',
    bankKey: 'class1-wastewater',
    questionsVar: 'CLASS1_WASTEWATER_QUESTIONS',
    modulesVar: 'CLASS1_WASTEWATER_MODULES',
    overviewsVar: 'CLASS1_WASTEWATER_OVERVIEWS',
    questionImportFile: 'class1WastewaterQuestions',
    typeImport: 'Class1WastewaterQuestion',
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'WQAQuiz.tsx',
    bankKey: 'wqa',
    questionsVar: 'WQA_QUESTIONS',
    modulesVar: 'WQA_MODULES',
    overviewsVar: 'WQA_OVERVIEWS',
    questionImportFile: 'wqaQuestions',
    typeImport: 'WQAQuestion',
    moduleConfigInline: true,
    formulaLinksVar: 'WQA_FORMULA_LINKS',
  },
  // WPI Water Treatment quizzes
  {
    file: 'WpiClass1WaterQuiz.tsx',
    bankKey: 'wpi-class1-water',
    questionsVar: 'wpiClass1WaterQuestions',
    modulesVar: 'WPI_CLASS1_WATER_MODULES',
    overviewsVar: 'WPI_CLASS1_WATER_OVERVIEWS',
    questionImportFile: 'wpiClass1WaterQuestions',
    typeImport: 'WpiClass1WaterQuestion',
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'WpiClass2WaterQuiz.tsx',
    bankKey: 'wpi-class2-water',
    questionsVar: 'wpiClass2WaterQuestions',
    modulesVar: 'WPI_CLASS2_WATER_MODULES',
    overviewsVar: 'WPI_CLASS2_WATER_OVERVIEWS',
    questionImportFile: 'wpiClass2WaterQuestions',
    typeImport: 'WpiClass2WaterQuestion',
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'WpiClass3WaterQuiz.tsx',
    bankKey: 'wpi-class3-water',
    questionsVar: 'wpiClass3WaterQuestions',
    modulesVar: 'WPI_CLASS3_WATER_MODULES',
    overviewsVar: 'WPI_CLASS3_WATER_OVERVIEWS',
    questionImportFile: 'wpiClass3WaterQuestions',
    typeImport: 'WpiClass3WaterQuestion',
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'WpiClass4WaterQuiz.tsx',
    bankKey: 'wpi-class4-water',
    questionsVar: 'wpiClass4WaterQuestions',
    modulesVar: 'WPI_CLASS4_WATER_MODULES',
    overviewsVar: 'WPI_CLASS4_WATER_OVERVIEWS',
    questionImportFile: 'wpiClass4WaterQuestions',
    typeImport: 'WpiClass4WaterQuestion',
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  // WPI Wastewater Treatment quizzes
  {
    file: 'WpiClass1WastewaterQuiz.tsx',
    bankKey: 'wpi-class1-wastewater',
    questionsVar: 'WPI_CLASS1_WASTEWATER_QUESTIONS',
    modulesVar: 'WPI_CLASS1_WASTEWATER_MODULES',
    overviewsVar: 'WPI_CLASS1_WASTEWATER_OVERVIEWS',
    questionImportFile: 'wpiClass1WastewaterQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'WpiClass2WastewaterQuiz.tsx',
    bankKey: 'wpi-class2-wastewater',
    questionsVar: 'WPI_CLASS2_WASTEWATER_QUESTIONS',
    modulesVar: 'WPI_CLASS2_WASTEWATER_MODULES',
    overviewsVar: 'WPI_CLASS2_WASTEWATER_OVERVIEWS',
    questionImportFile: 'wpiClass2WastewaterQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'WpiClass3WastewaterQuiz.tsx',
    bankKey: 'wpi-class3-wastewater',
    questionsVar: 'wpiClass3WastewaterQuestions',
    modulesVar: 'WPI_CLASS3_WASTEWATER_MODULES',
    overviewsVar: 'WPI_CLASS3_WASTEWATER_OVERVIEWS',
    questionImportFile: 'wpiClass3WastewaterQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'WpiClass4WastewaterQuiz.tsx',
    bankKey: 'wpi-class4-wastewater',
    questionsVar: 'wpiClass4WastewaterQuestions',
    modulesVar: 'WPI_CLASS4_WASTEWATER_MODULES',
    overviewsVar: 'WPI_CLASS4_WASTEWATER_OVERVIEWS',
    questionImportFile: 'wpiClass4WastewaterQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  // WPI Water Distribution quizzes
  {
    file: 'WpiClass1WaterDistQuiz.tsx',
    bankKey: 'wpi-class1-water-dist',
    questionsVar: 'wpiClass1WaterDistQuestions',
    modulesVar: 'WPI_CLASS1_WATER_DIST_MODULES',
    overviewsVar: 'WPI_CLASS1_WATER_DIST_OVERVIEWS',
    questionImportFile: 'wpiClass1WaterDistQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'WpiClass2WaterDistQuiz.tsx',
    bankKey: 'wpi-class2-water-dist',
    questionsVar: 'wpiClass2WaterDistQuestions',
    modulesVar: null, // no modules import
    overviewsVar: 'WPI_CLASS2_WATER_DIST_OVERVIEWS',
    questionImportFile: 'wpiClass2WaterDistQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'WpiClass3WaterDistQuiz.tsx',
    bankKey: 'wpi-class3-water-dist',
    questionsVar: 'wpiClass3WaterDistQuestions',
    modulesVar: 'WPI_CLASS3_WATER_DIST_MODULES',
    overviewsVar: 'WPI_CLASS3_WATER_DIST_OVERVIEWS',
    questionImportFile: 'wpiClass3WaterDistQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'WpiClass4WaterDistQuiz.tsx',
    bankKey: 'wpi-class4-water-dist',
    questionsVar: 'wpiClass4WaterDistQuestions',
    modulesVar: 'WPI_CLASS4_WATER_DIST_MODULES',
    overviewsVar: 'WPI_CLASS4_WATER_DIST_OVERVIEWS',
    questionImportFile: 'wpiClass4WaterDistQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  // WPI Wastewater Collection quizzes
  {
    file: 'WpiClass1WaterCollQuiz.tsx',
    bankKey: 'wpi-class1-wastewater-coll',
    questionsVar: 'wpiClass1WastewaterCollQuestions',
    modulesVar: 'WPI_CLASS1_WASTEWATER_COLL_MODULES',
    overviewsVar: 'WPI_CLASS1_WASTEWATER_COLL_OVERVIEWS',
    questionImportFile: 'wpiClass1WastewaterCollQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'WpiClass2WaterCollQuiz.tsx',
    bankKey: 'wpi-class2-wastewater-coll',
    questionsVar: 'wpiClass2WastewaterCollQuestions',
    modulesVar: 'WPI_CLASS2_WASTEWATER_COLL_MODULES',
    overviewsVar: 'WPI_CLASS2_WASTEWATER_COLL_OVERVIEWS',
    questionImportFile: 'wpiClass2WastewaterCollQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'WpiClass3WaterCollQuiz.tsx',
    bankKey: 'wpi-class3-wastewater-coll',
    questionsVar: 'wpiClass3WastewaterCollQuestions',
    modulesVar: 'WPI_CLASS3_WASTEWATER_COLL_MODULES',
    overviewsVar: 'WPI_CLASS3_WASTEWATER_COLL_OVERVIEWS',
    questionImportFile: 'wpiClass3WastewaterCollQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
  {
    file: 'WpiClass4WaterCollQuiz.tsx',
    bankKey: 'wpi-class4-wastewater-coll',
    questionsVar: 'wpiClass4WastewaterCollQuestions',
    modulesVar: 'WPI_CLASS4_WASTEWATER_COLL_MODULES',
    overviewsVar: 'WPI_CLASS4_WASTEWATER_COLL_OVERVIEWS',
    questionImportFile: 'wpiClass4WastewaterCollQuestions',
    typeImport: null,
    moduleConfigInline: true,
    formulaLinksVar: null,
  },
];

const PAGES_DIR = path.join(process.cwd(), 'client/src/pages');

let successCount = 0;
let errorCount = 0;

for (const config of QUIZ_PAGES) {
  const filePath = path.join(PAGES_DIR, config.file);
  if (!fs.existsSync(filePath)) {
    console.error(`MISSING: ${config.file}`);
    errorCount++;
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  
  console.log(`Processing: ${config.file} → bankKey: ${config.bankKey}`);
  
  // 1. Remove the question data import line(s)
  // Match: import { ... } from '@/lib/xxxQuestions';
  const questionImportRegex = new RegExp(
    `import\\s*\\{[^}]*\\}\\s*from\\s*['"]@/lib/${config.questionImportFile}['"];?\\n?`,
    'g'
  );
  content = content.replace(questionImportRegex, '');
  
  // 2. Remove the moduleOverviews import line
  const overviewImportRegex = new RegExp(
    `import\\s*\\{\\s*${config.overviewsVar}\\s*\\}\\s*from\\s*['"]@/lib/moduleOverviews['"];?\\n?`,
    'g'
  );
  content = content.replace(overviewImportRegex, '');
  
  // 3. Add useQuestionBank and QuizSkeleton imports after the first import block
  const hookImport = `import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";\nimport QuizSkeleton from "@/components/QuizSkeleton";`;
  
  // Insert after the last import statement
  if (!content.includes('useQuestionBank')) {
    // Find the last import line
    const importLines = content.match(/^import .+$/gm);
    if (importLines && importLines.length > 0) {
      const lastImport = importLines[importLines.length - 1];
      const lastImportIdx = content.lastIndexOf(lastImport);
      const insertPos = lastImportIdx + lastImport.length;
      content = content.slice(0, insertPos) + '\n' + hookImport + content.slice(insertPos);
    }
  }
  
  // 4. Add the hook call at the top of the component function
  // Find the component function declaration
  const funcMatch = content.match(/export default function \w+\(\)\s*\{/);
  if (funcMatch) {
    const funcIdx = content.indexOf(funcMatch[0]);
    const insertAfter = funcIdx + funcMatch[0].length;
    
    const hookCall = `
  // ── Load questions from database ──────────────────────────────────────────
  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, isLoading: bankLoading } = useQuestionBank("${config.bankKey}");
  const allQuestions = dbQuestions as any[];
`;
    
    // Only add if not already present
    if (!content.includes('useQuestionBank(')) {
      content = content.slice(0, insertAfter) + hookCall + content.slice(insertAfter);
    }
  }
  
  // 5. Add loading guard - wrap the return statement
  // Find the main return ( and add a loading check before it
  if (!content.includes('bankLoading')) {
    // Already added in the hook call above, now add the guard
    const returnMatch = content.match(/(\n\s*return\s*\(\s*\n\s*<QuizShell)/);
    if (returnMatch) {
      const returnIdx = content.indexOf(returnMatch[0]);
      const loadingGuard = `\n  if (bankLoading || allQuestions.length === 0) return <QuizSkeleton />;\n`;
      content = content.slice(0, returnIdx) + loadingGuard + content.slice(returnIdx);
    }
  }
  
  // 6. Replace references to the old questions variable
  const qVar = config.questionsVar;
  const qAlias = config.questionsAlias;
  
  // Replace the old variable references with allQuestions
  // Handle "const allQuestions = XXXX as Type[];" line
  const allQAssignRegex = new RegExp(
    `const allQuestions\\s*=\\s*${qVar}\\s*(as\\s+\\w+\\[\\])?;`,
    'g'
  );
  content = content.replace(allQAssignRegex, '// allQuestions provided by useQuestionBank hook');
  
  // Also handle aliased imports like "QUESTIONS as CLASS2_WATER_QUESTIONS"
  if (qAlias) {
    content = content.replaceAll(qAlias, 'allQuestions');
  }
  
  // Replace direct references to the questions variable
  // Be careful not to replace inside import statements (already removed)
  content = content.replaceAll(new RegExp(`\\b${qVar}\\b`, 'g'), 'allQuestions');
  
  // 7. Replace overview references
  if (config.overviewsVar) {
    content = content.replaceAll(config.overviewsVar, 'dbOverviews');
  }
  
  // 8. Remove type imports that are no longer needed
  if (config.typeImport) {
    // Remove "type TypeName" from any remaining import
    const typeRegex = new RegExp(`,?\\s*type\\s+${config.typeImport}`, 'g');
    content = content.replace(typeRegex, '');
  }
  
  // 9. Replace type references in the component
  if (config.typeImport) {
    content = content.replaceAll(new RegExp(`\\b${config.typeImport}\\b`, 'g'), 'DBQuestion');
  }
  
  // 10. Fix the HistoryEntry type to use DBQuestion
  content = content.replace(
    /type HistoryEntry = \{[\s\S]*?q:\s*\w+;/,
    (match) => match.replace(/q:\s*\w+/, 'q: DBQuestion')
  );
  
  // 11. Handle the toCompat wrapper for WPI pages
  // Replace toCompat function if it exists
  content = content.replace(
    /type QCompat = \w+ & \{ q: string \};\nfunction toCompat\(q: \w+\): QCompat \{\n  return \{ \.\.\.q, q: q\.question \};\n\}/,
    '// toCompat no longer needed — DB returns unified question format'
  );
  // Remove toCompat calls
  content = content.replaceAll('toCompat(', '(');
  
  // Write the modified file
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✓ Migrated successfully`);
    successCount++;
  } else {
    console.log(`  ⚠ No changes made`);
  }
}

console.log(`\n=== Migration complete: ${successCount} migrated, ${errorCount} errors ===`);
