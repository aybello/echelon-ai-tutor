import mysql from 'mysql2/promise';
import fs from 'fs';

const failedIds = [36467,36459,36702,36171,39485,39508,40250,40459,43980,90067,90110,42623,90593,90611,90746,90754,90755,90774,45781,45784,45785,45820,45846];

async function invokeLLM(messages) {
  const url = process.env.BUILT_IN_FORGE_API_URL;
  const key = process.env.BUILT_IN_FORGE_API_KEY;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(`${url}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          messages,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'question_fix',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  correct_answer_index: { type: 'integer', description: '0-3' },
                  options: { type: 'array', items: { type: 'string' }, description: 'Exactly 4 options' },
                  explanation: { type: 'string', description: 'Concise explanation (2-3 sentences max). For calcs, show key formula and final answer only.' },
                  steps: { type: 'array', items: { type: 'object', properties: { l: { type: 'string' }, c: { type: 'string' } }, required: ['l', 'c'], additionalProperties: false }, description: 'Max 4 steps. Keep each step under 80 chars.' }
                },
                required: ['correct_answer_index', 'options', 'explanation', 'steps'],
                additionalProperties: false
              }
            }
          }
        })
      });
      const data = await resp.json();
      if (!data.choices?.[0]?.message?.content) throw new Error('Empty response');
      return JSON.parse(data.choices[0].message.content);
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const results = { fixed: [], failed: [] };

  for (const id of failedIds) {
    const [rows] = await conn.execute('SELECT * FROM questions WHERE id = ?', [id]);
    if (!rows.length) { results.failed.push({ id, error: 'Not found' }); continue; }
    const q = rows[0];
    const opts = JSON.parse(q.options);

    try {
      const fix = await invokeLLM([
        {
          role: 'system',
          content: `You are a Canadian water/wastewater certification expert. Fix this question. Be VERY CONCISE — max 2-3 sentences for explanation, max 4 short steps. Bank: ${q.bankKey}`
        },
        {
          role: 'user',
          content: `Q: ${q.question}\nA) ${opts[0]}\nB) ${opts[1]}\nC) ${opts[2]}\nD) ${opts[3]}\nMarked correct: ${['A','B','C','D'][q.correctIndex]}\nIs calc: ${q.isCalc ? 'YES' : 'NO'}\n\nVerify and fix. Return correct index, options, short explanation, and max 4 brief steps.`
        }
      ]);

      if (fix.correct_answer_index < 0 || fix.correct_answer_index > 3) throw new Error('Bad index');
      if (!fix.options || fix.options.length !== 4) throw new Error('Bad options');

      await conn.execute(
        'UPDATE questions SET options = ?, correctIndex = ?, explanation = ?, steps = ? WHERE id = ?',
        [JSON.stringify(fix.options), fix.correct_answer_index, fix.explanation, JSON.stringify(fix.steps), id]
      );
      results.fixed.push({ id, bankKey: q.bankKey });
      console.log(`Fixed ID:${id}`);
    } catch (err) {
      results.failed.push({ id, bankKey: q.bankKey, error: err.message });
      console.log(`Failed ID:${id}: ${err.message}`);
    }
  }

  console.log(`\nDone: Fixed ${results.fixed.length}, Failed ${results.failed.length}`);
  fs.writeFileSync('/home/ubuntu/retry-results.json', JSON.stringify(results, null, 2));
  await conn.end();
}

main().catch(console.error);
