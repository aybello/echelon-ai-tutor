#!/bin/bash
# Regenerate all 8 Ontario dist/coll banks with the improved AWWA-style prompt
# Deletes existing questions first, then regenerates and reinserts

set -e
cd /home/ubuntu/echelon-ai-tutor
source .env 2>/dev/null || true

LOG=/tmp/regen-dist-coll.log
echo "Starting regeneration at $(date)" | tee $LOG

# ── Delete existing questions from all 8 banks ────────────────────────────────
echo "Deleting existing questions from 8 Ontario dist/coll banks..." | tee -a $LOG
node --input-type=module << 'EOF' >> $LOG 2>&1
import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const db = await createConnection(process.env.DATABASE_URL);
const banks = [
  'class1-water-dist','class2-water-dist','class3-water-dist','class4-water-dist',
  'class1-wastewater-coll','class2-wastewater-coll','class3-wastewater-coll','class4-wastewater-coll'
];
for (const b of banks) {
  const [r] = await db.execute('DELETE FROM questions WHERE bankKey = ?', [b]);
  console.log(`Deleted ${r.affectedRows} rows from ${b}`);
}
await db.end();
EOF

echo "Deletion complete. Starting generation..." | tee -a $LOG

# ── Generate and insert each bank ─────────────────────────────────────────────

generate_and_insert() {
  local bankKey=$1
  local module=$2
  local classLevel=$3
  local outFile="/tmp/${bankKey}-new.json"
  
  echo "  Generating $bankKey / $module..." | tee -a $LOG
  node scripts/generate-bank-questions.mjs "$bankKey" "$module" "$classLevel" 300 1 "$outFile" >> $LOG 2>&1
  echo "  Inserting $bankKey..." | tee -a $LOG
  node scripts/insert-generated-questions.mjs "$outFile" >> $LOG 2>&1
  echo "  ✅ $bankKey done" | tee -a $LOG
}

generate_and_insert "class1-water-dist"       "Water Distribution"       "Class 1"
generate_and_insert "class2-water-dist"       "Water Distribution"       "Class 2"
generate_and_insert "class3-water-dist"       "Water Distribution"       "Class 3"
generate_and_insert "class4-water-dist"       "Water Distribution"       "Class 4"
generate_and_insert "class1-wastewater-coll"  "Wastewater Collection"    "Class 1"
generate_and_insert "class2-wastewater-coll"  "Collection Systems"       "Class 2"
generate_and_insert "class3-wastewater-coll"  "Wastewater Collection"    "Class 3"
generate_and_insert "class4-wastewater-coll"  "Wastewater Collection"    "Class 4"

echo "All 8 banks regenerated at $(date)" | tee -a $LOG
