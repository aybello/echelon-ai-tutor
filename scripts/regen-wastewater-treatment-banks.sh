#!/bin/bash
# Regenerate all 4 Ontario wastewater treatment question banks with improved WPI-style prompt
# Deletes existing questions first, then regenerates and reinserts at 500 questions per bank
set -e
cd /home/ubuntu/echelon-ai-tutor
source .env 2>/dev/null || true
LOG=/tmp/regen-wastewater-treatment.log
echo "Starting wastewater treatment regeneration at $(date)" | tee $LOG

# ── Delete existing questions from all 4 wastewater treatment banks ─────────────
echo "Deleting existing questions from 4 Ontario wastewater treatment banks..." | tee -a $LOG
node --input-type=module << 'EOF' >> $LOG 2>&1
import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const db = await createConnection(process.env.DATABASE_URL);
const banks = [
  'class1-wastewater', 'class2-wastewater', 'class3-wastewater', 'class4-wastewater'
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
  echo "  Generating $bankKey / $module (500 questions)..." | tee -a $LOG
  node scripts/generate-bank-questions.mjs "$bankKey" "$module" "$classLevel" 500 1 "$outFile" >> $LOG 2>&1
  echo "  Inserting $bankKey..." | tee -a $LOG
  node scripts/insert-generated-questions.mjs "$outFile" >> $LOG 2>&1
  echo "  Done: $bankKey" | tee -a $LOG
}

generate_and_insert "class1-wastewater" "Wastewater Treatment" "Class 1"
generate_and_insert "class2-wastewater" "Wastewater Treatment" "Class 2"
generate_and_insert "class3-wastewater" "Wastewater Treatment" "Class 3"
generate_and_insert "class4-wastewater" "Wastewater Treatment" "Class 4"

echo "All 4 wastewater treatment banks regenerated at $(date)" | tee -a $LOG
