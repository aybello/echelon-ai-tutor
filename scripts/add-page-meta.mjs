/**
 * Adds usePageMeta to all pages that are missing it.
 * Maps filename patterns to appropriate titles and descriptions.
 */
import fs from "fs";
import path from "path";

const pagesDir = path.resolve("client/src/pages");

// Get all .tsx files in pages dir
const allFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith(".tsx"));

// Find files that already have usePageMeta
const withMeta = allFiles.filter(f => {
  const content = fs.readFileSync(path.join(pagesDir, f), "utf-8");
  return content.includes("usePageMeta");
});

const withoutMeta = allFiles.filter(f => !withMeta.includes(f));

console.log(`Total pages: ${allFiles.length}`);
console.log(`With usePageMeta: ${withMeta.length}`);
console.log(`Without usePageMeta: ${withoutMeta.length}`);

// Map filename to title and description
function getMetaForFile(filename) {
  const name = filename.replace(".tsx", "");
  
  // Skip utility/internal pages
  if (["ComponentShowcase", "PreviewMode"].includes(name)) return null;
  
  // Parse patterns
  // WPI pages
  const wpiMatch = name.match(/^WpiClass(\d)(Water|Wastewater|WaterColl|WaterDist)(Quiz|MockExam|Flashcards)$/);
  if (wpiMatch) {
    const [, level, type, mode] = wpiMatch;
    const typeMap = {
      Water: "Water Treatment",
      Wastewater: "Wastewater Treatment", 
      WaterColl: "Water Collection",
      WaterDist: "Water Distribution"
    };
    const modeMap = { Quiz: "Practice Questions", MockExam: "Mock Exam", Flashcards: "Flashcards" };
    const typeName = typeMap[type];
    const modeName = modeMap[mode];
    return {
      title: `WPI Class ${level} ${typeName} ${modeName}`,
      description: `${modeName} for WPI Class ${level} ${typeName} operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.`,
      path: null // will use window.location.pathname
    };
  }

  // Ontario/OWWCO pages  
  const classMatch = name.match(/^Class(\d)(Water|Wastewater)(Quiz|MockExam|Flashcards)$/);
  if (classMatch) {
    const [, level, type, mode] = classMatch;
    const typeName = type === "Water" ? "Water Treatment" : "Wastewater Treatment";
    const modeMap = { Quiz: "Practice Questions", MockExam: "Mock Exam", Flashcards: "Flashcards" };
    const modeName = modeMap[mode];
    return {
      title: `Class ${level} ${typeName} ${modeName}`,
      description: `${modeName} for Ontario OWWCO Class ${level} ${typeName} operator certification exam. AI-powered exam prep with detailed explanations.`,
      path: null
    };
  }

  // OIT pages
  const oitMatch = name.match(/^OIT(Water|Wastewater)(Flashcards|MockExam|Quiz)$/);
  if (oitMatch) {
    const [, type, mode] = oitMatch;
    const typeName = type === "Water" ? "Water" : "Wastewater";
    const modeMap = { Quiz: "Practice Questions", MockExam: "Mock Exam", Flashcards: "Flashcards" };
    const modeName = modeMap[mode];
    return {
      title: `OIT ${typeName} ${modeName}`,
      description: `${modeName} for Ontario OIT (Operator-in-Training) ${typeName} certification exam. Free access, no account required.`,
      path: null
    };
  }

  // WQA pages
  const wqaMatch = name.match(/^WQA(Quiz|MockExam|Flashcards)$/);
  if (wqaMatch) {
    const [, mode] = wqaMatch;
    const modeMap = { Quiz: "Practice Questions", MockExam: "Mock Exam", Flashcards: "Flashcards" };
    const modeName = modeMap[mode];
    return {
      title: `WQA ${modeName}`,
      description: `${modeName} for Water Quality Analyst (WQA) certification exam. Comprehensive practice with AI-powered explanations.`,
      path: null
    };
  }

  // Formula pages - WPI
  const formulaWpiMatch = name.match(/^FormulasWpiClass(\d)(Ww)?$/);
  if (formulaWpiMatch) {
    const [, level, ww] = formulaWpiMatch;
    const type = ww ? "Wastewater" : "Water";
    return {
      title: `WPI Class ${level} ${type} Formulas`,
      description: `Essential formulas and calculations for WPI Class ${level} ${type} operator certification exam. Quick reference formula sheet.`,
      path: null
    };
  }

  // Formula pages - Ontario Water
  const formulaWaterMatch = name.match(/^FormulasWater(\d)$/);
  if (formulaWaterMatch) {
    const [, level] = formulaWaterMatch;
    return {
      title: `Class ${level} Water Treatment Formulas`,
      description: `Essential formulas for Ontario OWWCO Class ${level} Water Treatment operator certification exam.`,
      path: null
    };
  }

  // Formula pages - Ontario Wastewater
  const formulaWWMatch = name.match(/^FormulasWW(\d)$/);
  if (formulaWWMatch) {
    const [, level] = formulaWWMatch;
    return {
      title: `Class ${level} Wastewater Treatment Formulas`,
      description: `Essential formulas for Ontario OWWCO Class ${level} Wastewater Treatment operator certification exam.`,
      path: null
    };
  }

  // Standalone pages
  const standaloneMap = {
    Admin: { title: "Admin Dashboard", description: "Echelon Institute administration panel." },
    ChemCalc: { title: "Chemical Calculator", description: "Water and wastewater chemical dosage calculator. Calculate chlorine dosing, chemical feed rates, and more." },
    Lab: { title: "Virtual Lab", description: "Interactive virtual laboratory for water and wastewater operator training." },
    MockExam: { title: "Mock Exams", description: "Timed mock exams for Canadian water and wastewater operator certification. Simulate the real exam experience." },
    NotFound: { title: "Page Not Found", description: "The page you're looking for doesn't exist." },
    Process: { title: "Process Diagrams", description: "Interactive water and wastewater treatment process diagrams and flow charts." },
    ProcessControl: { title: "Process Control", description: "Process control concepts for water and wastewater treatment operators." },
    PumpingSystems: { title: "Pumping Systems", description: "Pumping systems training for water and wastewater operators. Learn pump curves, head loss, and system design." },
    PurchaseSuccess: { title: "Purchase Successful", description: "Your purchase was successful. Thank you for choosing Echelon Institute." },
    Wastewater: { title: "Wastewater Treatment", description: "Wastewater treatment operator exam prep. Practice questions, mock exams, and flashcards for all certification levels." },
    WastewaterCollection: { title: "Wastewater Collection", description: "Wastewater collection system operator exam prep. Practice questions and study materials." },
    WaterDistribution: { title: "Water Distribution", description: "Water distribution system operator exam prep. Practice questions and study materials." },
  };

  if (standaloneMap[name]) return standaloneMap[name];

  // Fallback — generate from filename
  const readable = name.replace(/([A-Z])/g, " $1").trim();
  return {
    title: readable,
    description: `${readable} — Echelon Institute water and wastewater operator exam prep.`,
    path: null
  };
}

let updated = 0;
let skipped = 0;

for (const file of withoutMeta) {
  const meta = getMetaForFile(file);
  if (!meta) {
    console.log(`SKIP: ${file} (internal/utility page)`);
    skipped++;
    continue;
  }

  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, "utf-8");

  // Check if usePageMeta is already imported
  if (content.includes("usePageMeta")) {
    console.log(`SKIP: ${file} (already has usePageMeta)`);
    skipped++;
    continue;
  }

  // Add import
  const importLine = `import { usePageMeta } from "@/hooks/usePageMeta";\n`;
  
  // Find the last import line
  const lines = content.split("\n");
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("import ") || lines[i].startsWith("} from ")) {
      lastImportIdx = i;
    }
  }

  if (lastImportIdx === -1) {
    // No imports found, add at top
    content = importLine + content;
  } else {
    lines.splice(lastImportIdx + 1, 0, importLine.trimEnd());
    content = lines.join("\n");
  }

  // Find the function body and add usePageMeta call after the first {
  // Look for: export default function ... { or function ... { or () => {
  const funcBodyMatch = content.match(/(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{)/);
  if (funcBodyMatch) {
    const insertPoint = content.indexOf(funcBodyMatch[0]) + funcBodyMatch[0].length;
    const metaCall = `\n  usePageMeta({\n    title: "${meta.title}",\n    description: "${meta.description}",\n  });\n`;
    content = content.slice(0, insertPoint) + metaCall + content.slice(insertPoint);
  } else {
    // Try arrow function pattern
    const arrowMatch = content.match(/(export\s+default\s+function\s*\([^)]*\)\s*\{)|(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)/);
    if (arrowMatch) {
      const match = arrowMatch[0];
      const insertPoint = content.indexOf(match) + match.length;
      const metaCall = `\n  usePageMeta({\n    title: "${meta.title}",\n    description: "${meta.description}",\n  });\n`;
      content = content.slice(0, insertPoint) + metaCall + content.slice(insertPoint);
    } else {
      console.log(`WARN: ${file} — could not find function body, skipping`);
      skipped++;
      continue;
    }
  }

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`UPDATED: ${file} — "${meta.title}"`);
  updated++;
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
