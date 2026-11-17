const { chromium } = require('playwright');
const fs = require('fs');
const OUT = '/tmp/claude-0/-home-user-echelon-ai-tutor/0e6dc4c6-dfed-5d26-9c2a-f17854a01d3e/scratchpad/figs';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const d = JSON.parse(fs.readFileSync('/home/user/echelon-ai-tutor/content/ceu-drafts/ceu-basic-hydraulics.json', 'utf8'));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 900 } });
  await p.setContent('<html><body style="font:16px sans-serif;margin:16px"><div id=o></div></body></html>');
  await p.addScriptTag({ content: fs.readFileSync('/home/user/echelon-ai-tutor/node_modules/dompurify/dist/purify.min.js', 'utf8') });
  await p.addScriptTag({ content: fs.readFileSync('/home/user/echelon-ai-tutor/node_modules/marked/lib/marked.umd.js', 'utf8') });
  let n = 0;
  for (const m of d.modules) {
    const raw = (m.lesson.match(/<svg/g) || []).length;
    const res = await p.evaluate(t => {
      const h = DOMPurify.sanitize(marked.parse(t, { async: false }));
      document.getElementById('o').innerHTML = h;
      return { svg: document.querySelectorAll('#o svg').length, fig: document.querySelectorAll('#o figure').length, txt: document.querySelectorAll('#o svg text').length };
    }, m.lesson);
    console.log(m.id, 'raw svg', raw, 'after sanitize', JSON.stringify(res));
    for (const f of await p.$$('#o figure')) { n++; await f.screenshot({ path: `${OUT}/f${n}.png` }); }
  }
  await b.close();
})();
