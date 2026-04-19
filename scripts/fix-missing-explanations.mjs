import mysql from 'mysql2/promise';

async function invokeLLM(messages) {
  const url = process.env.BUILT_IN_FORGE_API_URL;
  const key = process.env.BUILT_IN_FORGE_API_KEY;
  const resp = await fetch(`${url}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ messages, response_format: { type: 'json_schema', json_schema: {
      name: 'explanation',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          explanation: { type: 'string', description: 'Detailed explanation of why the correct answer is right, 2-4 sentences' },
          steps: { type: 'array', items: { type: 'object', properties: { l: { type: 'string' }, c: { type: 'string' } }, required: ['l', 'c'], additionalProperties: false }, description: 'Step-by-step breakdown if applicable' }
        },
        required: ['explanation', 'steps'],
        additionalProperties: false
      }
    }}})
  });
  const data = await resp.json();
  return JSON.parse(data.choices[0].message.content);
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get all questions with broken explanations (< 20 chars)
  const [rows] = await conn.execute(
    'SELECT id, bankKey, questionNum, question, options, correctIndex, explanation FROM questions WHERE LENGTH(explanation) < 20'
  );
  
  console.log(`Found ${rows.length} questions with broken explanations`);
  
  let fixed = 0;
  for (const r of rows) {
    const opts = JSON.parse(r.options);
    const correctAnswer = opts[r.correctIndex];
    
    console.log(`\nFixing ${r.bankKey} Q${r.questionNum} (ID:${r.id})...`);
    console.log(`  Q: ${r.question.substring(0, 100)}`);
    console.log(`  Correct: ${correctAnswer}`);
    
    try {
      const result = await invokeLLM([
        { role: 'system', content: `You are an expert Canadian water and wastewater operator certification instructor. Generate a detailed explanation for why the correct answer is right. This is for the ${r.bankKey} certification level. Include practical context that helps operators understand the concept. If it's a calculation, show the math step by step.` },
        { role: 'user', content: `Question: ${r.question}\n\nOptions:\nA) ${opts[0]}\nB) ${opts[1]}\nC) ${opts[2]}\nD) ${opts[3]}\n\nCorrect Answer: ${correctAnswer}\n\nProvide a detailed explanation (2-4 sentences) and step-by-step breakdown.` }
      ]);
      
      await conn.execute(
        'UPDATE questions SET explanation = ?, steps = ? WHERE id = ?',
        [result.explanation, JSON.stringify(result.steps), r.id]
      );
      
      console.log(`  ✓ Fixed: ${result.explanation.substring(0, 100)}...`);
      fixed++;
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
    }
  }
  
  console.log(`\nDone. Fixed ${fixed}/${rows.length} explanations.`);
  await conn.end();
}

main().catch(console.error);
