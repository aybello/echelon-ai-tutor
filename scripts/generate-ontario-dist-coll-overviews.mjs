/**
 * Generate module study notes (overviews) for all 8 Ontario dist/coll banks.
 * Structure mirrors the WPI dist/coll overviews: { title, intro, keyPoints[], formulas[], examTips[] }
 */
import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await createConnection(process.env.DATABASE_URL);

// Use the correct Forge API URL with /v1/chat/completions
const FORGE_URL = (process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.im').replace(/\/$/, '') + '/v1/chat/completions';
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// ─── Bank definitions ──────────────────────────────────────────────────────────
const BANKS = [
  {
    bankKey: 'class1-water-dist',
    label: 'Ontario Class 1 Water Distribution',
    certLevel: 'Class 1 (entry-level operator)',
    regulation: 'O. Reg. 170/03, Safe Drinking Water Act, 2002',
    modules: [
      'Distribution System Components',
      'Water Quality Monitoring & Sampling',
      'Valve & Hydrant Operation',
      'Service Connections & Meters',
      'Safety & Emergency Response',
    ],
  },
  {
    bankKey: 'class2-water-dist',
    label: 'Ontario Class 2 Water Distribution',
    certLevel: 'Class 2 (intermediate operator)',
    regulation: 'O. Reg. 170/03, O. Reg. 128/04, Safe Drinking Water Act, 2002',
    modules: [
      'Distribution System Hydraulics',
      'Pipe Materials, Installation & Repair',
      'Water Quality & Disinfection Residuals',
      'Pressure Management & Leak Detection',
      'Regulatory Compliance & Reporting',
    ],
  },
  {
    bankKey: 'class3-water-dist',
    label: 'Ontario Class 3 Water Distribution',
    certLevel: 'Class 3 (senior operator)',
    regulation: 'O. Reg. 170/03, O. Reg. 128/04, DWQMS, Safe Drinking Water Act, 2002',
    modules: [
      'Advanced Hydraulic Modelling',
      'Asset Management & Rehabilitation',
      'Cross-Connection Control & Backflow Prevention',
      'SCADA & Instrumentation',
      'Water Loss Management & NRW',
    ],
  },
  {
    bankKey: 'class4-water-dist',
    label: 'Ontario Class 4 Water Distribution',
    certLevel: 'Class 4 (management/chief operator)',
    regulation: 'O. Reg. 170/03, O. Reg. 128/04, DWQMS, ISO 55000, Safe Drinking Water Act, 2002',
    modules: [
      'System Planning & Capital Investment',
      'Risk-Based Asset Management (ISO 55000)',
      'Regulatory Leadership & DWQMS',
      'Emergency Management & Business Continuity',
      'Performance Management & KPIs',
    ],
  },
  {
    bankKey: 'class1-wastewater-coll',
    label: 'Ontario Class 1 Wastewater Collection',
    certLevel: 'Class 1 (entry-level operator)',
    regulation: 'O. Reg. 129/04, Environmental Protection Act, Ontario Water Resources Act',
    modules: [
      'Collection System Components',
      'Sewer Types & Pipe Materials',
      'Inflow & Infiltration (I/I) Identification',
      'Safety in Collection System Work',
      'Basic Maintenance & Inspection',
    ],
  },
  {
    bankKey: 'class2-wastewater-coll',
    label: 'Ontario Class 2 Wastewater Collection',
    certLevel: 'Class 2 (intermediate operator)',
    regulation: 'O. Reg. 129/04, Environmental Protection Act, Ontario Water Resources Act',
    modules: [
      'Hydraulics of Gravity Sewers',
      'Lift Station Operation & Maintenance',
      'CCTV Inspection & Condition Assessment',
      'Sewer Cleaning & Rehabilitation',
      'Regulatory Reporting & Spill Response',
    ],
  },
  {
    bankKey: 'class3-wastewater-coll',
    label: 'Ontario Class 3 Wastewater Collection',
    certLevel: 'Class 3 (senior operator)',
    regulation: 'O. Reg. 129/04, Environmental Protection Act, Ontario Water Resources Act',
    modules: [
      'Force Main Design & Transient Analysis',
      'Advanced Lift Station Management',
      'Combined Sewer Overflow (CSO) Control',
      'Asset Management & Rehabilitation Planning',
      'Collection System Modelling',
    ],
  },
  {
    bankKey: 'class4-wastewater-coll',
    label: 'Ontario Class 4 Wastewater Collection',
    certLevel: 'Class 4 (management/chief operator)',
    regulation: 'O. Reg. 129/04, Environmental Protection Act, Ontario Water Resources Act, MECP guidelines',
    modules: [
      'Long-Term Control Plans (LTCP) for CSOs',
      'Risk-Based Asset Management',
      'Regulatory Leadership & Environmental Compliance',
      'Emergency Management & Spill Response Plans',
      'Performance Management & Capital Planning',
    ],
  },
];

// ─── LLM call ─────────────────────────────────────────────────────────────────
async function generateOverview(bank, moduleName) {
  const prompt = `You are an expert Ontario water/wastewater operator exam content writer.

Generate a comprehensive study notes overview for the following module:

Bank: ${bank.label}
Certification Level: ${bank.certLevel}
Governing Regulation: ${bank.regulation}
Module: ${moduleName}

Return ONLY valid JSON in this exact structure (no markdown, no code fences):
{
  "title": "${moduleName}",
  "intro": "2-3 sentence introduction to this module at the ${bank.certLevel} level",
  "keyPoints": [
    { "heading": "Topic Name", "body": "2-4 sentence explanation with specific Ontario standards, values, and regulatory references" },
    { "heading": "Topic Name", "body": "..." },
    { "heading": "Topic Name", "body": "..." },
    { "heading": "Topic Name", "body": "..." },
    { "heading": "Topic Name", "body": "..." }
  ],
  "formulas": [
    { "name": "Formula Name", "formula": "formula expression", "description": "when and how to use it" }
  ],
  "examTips": [
    "Specific exam tip relevant to ${bank.certLevel} Ontario certification",
    "Another specific exam tip",
    "Another specific exam tip"
  ]
}

Requirements:
- Content must be specific to Ontario regulations (${bank.regulation})
- Difficulty must match ${bank.certLevel}
- Include 5 keyPoints, 1-3 formulas (or empty array if no math), and 3 examTips
- Reference specific Ontario standards, values, and regulatory sections where applicable
- Do NOT include any text outside the JSON object`;

  const response = await fetch(FORGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  // Strip code fences if present
  const cleaned = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
for (const bank of BANKS) {
  console.log(`\n📚 Generating overviews for ${bank.bankKey}...`);
  
  // Check if already exists
  const [existing] = await db.execute(
    'SELECT id FROM module_overviews WHERE bankKey = ?',
    [bank.bankKey]
  );
  if (existing.length > 0) {
    console.log(`  ⏭️  Already exists, skipping`);
    continue;
  }

  const overviews = {};
  
  for (const moduleName of bank.modules) {
    console.log(`  ⏳ ${moduleName}...`);
    try {
      const overview = await generateOverview(bank, moduleName);
      overviews[moduleName] = overview;
      console.log(`  ✅ ${moduleName}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${moduleName}:`, err.message);
      // Use a placeholder so the bank still gets saved
      overviews[moduleName] = {
        title: moduleName,
        intro: `This module covers ${moduleName} as required for ${bank.certLevel} certification under ${bank.regulation}.`,
        keyPoints: [
          { heading: 'Overview', body: `Study notes for ${moduleName} are being generated. Please check back shortly.` }
        ],
        formulas: [],
        examTips: [`Review ${moduleName} in the context of ${bank.regulation}.`]
      };
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  // Insert into DB
  await db.execute(
    'INSERT INTO module_overviews (bankKey, overviewsJson) VALUES (?, ?)',
    [bank.bankKey, JSON.stringify(overviews)]
  );
  console.log(`  💾 Saved ${bank.bankKey} to DB`);
}

console.log('\n✅ All Ontario dist/coll overviews generated!');
await db.end();
process.exit(0);
