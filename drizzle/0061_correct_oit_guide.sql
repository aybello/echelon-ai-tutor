-- Correct unsafe claims in the already-published Ontario OIT guide.
-- The replacements are deliberately idempotent: rerunning the migration does
-- nothing after the outdated source text has been removed.

UPDATE `blog_posts`
SET
  `excerpt` = 'A source-grounded guide to Ontario''s modular Operator-in-Training exam, including official study resources, water-treatment topics, calculations, and a practical preparation plan.',
  `metaDescription` = 'Prepare for Ontario''s modular OIT exam with official OWWCO resources, water-treatment topics, calculation practice, and free sample questions.',
  `content` = REPLACE(
    `content`,
    '<p>The Operator-in-Training (OIT) certification is the entry-level credential for anyone working in an Ontario water treatment or distribution facility. Issued by the Ontario Ministry of the Environment, Conservation and Parks (MECP), it is a prerequisite for all higher-level Class 1 through Class 4 water certifications.</p>\n<p>The exam consists of 100 multiple-choice questions drawn from six core subject areas. You need a score of at least 70% to pass. Most candidates write the exam after completing an approved operator training program or after accumulating supervised operating experience.</p>\n\n<h2>The Six Exam Modules</h2>\n<p>Understanding the weight of each module helps you allocate your study time effectively. The exam draws questions roughly as follows:</p>\n\n<table>\n  <thead><tr><th>Module</th><th>Approximate Weight</th><th>Key Topics</th></tr></thead>\n  <tbody>\n    <tr><td>Disinfection</td><td>20%</td><td>Chlorination, CT values, UV, ozone, residuals</td></tr>\n    <tr><td>Hydraulics</td><td>18%</td><td>Flow rates, pressure, head loss, pump curves</td></tr>\n    <tr><td>Regulations</td><td>17%</td><td>Safe Drinking Water Act, O. Reg. 170/03, reporting</td></tr>\n    <tr><td>Math &amp; Calculations</td><td>20%</td><td>Dosage, flow, volume, unit conversions</td></tr>\n    <tr><td>Health &amp; Safety</td><td>13%</td><td>WHMIS, confined space, PPE, OHSA</td></tr>\n    <tr><td>Water Quality</td><td>12%</td><td>Turbidity, pH, hardness, coagulation, filtration</td></tr>\n  </tbody>\n</table>',
    '<p>The Operator-in-Training (OIT) exam is the entry point for people pursuing Ontario drinking-water and wastewater operator certification. The Ontario Water Wastewater Certification Office (OWWCO) describes it as a modular exam. A candidate may request one area or any combination of up to four areas: water treatment, water distribution and supply, wastewater treatment, and wastewater collection.</p>\n<p>All Ontario operator exams require a mark of 70% to pass. Confirm the modules, registration requirements, current exam format, and permitted reference material for your own sitting directly with <a href="https://owwco.ca/preparing-for-your-exam/">OWWCO</a>; those details can change.</p>\n\n<h2>How to Scope Your Preparation</h2>\n<p>Study the area or areas you selected rather than relying on an unofficial percentage split. For the water-treatment area, build competence across treatment processes, disinfection, basic hydraulics, water quality, safety, regulations, and the calculations that connect those subjects. OWWCO recommends its OIT Examination Study Guide and Mathematics for Water and Wastewater Operators guide for this exam.</p>'
  )
WHERE `slug` = 'how-to-pass-ontario-oit-water-exam';
--> statement-breakpoint

UPDATE `blog_posts`
SET `content` = REPLACE(
  `content`,
  '<p>Disinfection questions are consistently the most challenging for new operators. The exam tests your ability to calculate CT values (concentration multiplied by contact time), understand the difference between primary and secondary disinfection, and identify the correct residual levels required under Ontario Regulation 170/03.</p>\n<blockquote>\n  <p><strong>Key formula:</strong> CT = C (mg/L) × T (minutes). A CT of 0.2 mg·min/L achieves 99% inactivation of Giardia at 5°C with free chlorine.</p>\n</blockquote>\n<p>Practice interpreting CT tables for different temperatures and pH values. The exam will give you a scenario and ask you to determine whether the required CT has been achieved.</p>',
  '<p>Disinfection study should include CT calculations (disinfectant residual multiplied by effective contact time), primary versus secondary disinfection, monitoring, and the operational factors that change pathogen inactivation.</p>\n<blockquote>\n  <p><strong>Key formula:</strong> CT = C (mg/L) × T (minutes). A required CT is not one universal number: it depends on the disinfectant, organism, target log inactivation, temperature, pH, and residual. Use the CT table supplied by the applicable authority instead of memorizing a single value.</p>\n</blockquote>\n<p>For context, <a href="https://www.canada.ca/en/health-canada/services/publications/healthy-living/guidelines-canadian-drinking-water-quality-guideline-technical-document-enteric-protozoa-giardia-cryptosporidium/page-11-guidelines-canadian-drinking-water-quality-guideline-technical-document-enteric-protozoa-giardia-cryptosporidium.html">Health Canada''s free-chlorine table</a> for 3-log Giardia inactivation at 5°C shows values from 97 to 389 mg·min/L across the listed residual and pH conditions. That range demonstrates why a fixed claim such as 0.2 mg·min/L is unsafe. Practise reading the row and column conditions before comparing achieved CT with required CT.</p>'
)
WHERE `slug` = 'how-to-pass-ontario-oit-water-exam';
--> statement-breakpoint

UPDATE `blog_posts`
SET `content` = REPLACE(
  `content`,
  '<h2>Disinfection: The Highest-Value Module</h2>',
  '<h2>Disinfection and CT Calculations</h2>'
)
WHERE `slug` = 'how-to-pass-ontario-oit-water-exam';
--> statement-breakpoint

UPDATE `blog_posts`
SET `content` = REPLACE(
  `content`,
  '<p>Many candidates underestimate the math section. You will need to calculate chlorine dosage, flow rates, tank volumes, and chemical feed rates without a formula sheet. The good news is that the same formulas appear repeatedly, so mastering about 15 core equations covers the vast majority of calculation questions.</p>',
  '<p>Calculation practice should include chlorine dosage, flow rates, tank volumes, detention time, and chemical feed rates. OWWCO currently directs candidates to WPI''s formula/conversion tables and sample questions. Check the instructions for your specific exam sitting, then practise choosing the right equation, keeping units consistent, and checking whether the result is reasonable.</p>'
)
WHERE `slug` = 'how-to-pass-ontario-oit-water-exam';
--> statement-breakpoint

UPDATE `blog_posts`
SET `content` = REPLACE(
  `content`,
  '<h2>Regulations: Know O. Reg. 170/03 Cold</h2>\n<p>Ontario Regulation 170/03 governs the sampling, testing, and reporting requirements for all municipal drinking water systems. The exam tests your knowledge of minimum sampling frequencies, required residual levels at the point of consumption (minimum 0.05 mg/L free chlorine), and adverse result reporting timelines (notify the local Medical Officer of Health within 24 hours of an adverse result).</p>\n<p>You do not need to memorize every section number, but you do need to understand the intent and key thresholds of the regulation.</p>',
  '<h2>Regulations: Use Current Official Material</h2>\n<p>Know the purpose of Ontario''s Safe Drinking Water Act and the operational, sampling, testing, reporting, and corrective-action duties that apply to drinking-water systems. Do not rely on an old study article for a regulatory threshold or deadline. Read the current official material linked by OWWCO and pay attention to the exact system type, sampling location, disinfectant, and circumstance in each question.</p>'
)
WHERE `slug` = 'how-to-pass-ontario-oit-water-exam';
--> statement-breakpoint

UPDATE `blog_posts`
SET `content` = REPLACE(
  `content`,
  '<p>Most candidates who pass on their first attempt spend 40 to 60 hours studying over four to six weeks. A practical approach is to dedicate the first two weeks to reading your course notes and the MECP''s Drinking Water Operator Training modules, then spend the remaining time on practice questions. Doing at least 300 to 400 practice questions before the exam is strongly recommended.</p>\n<p>Echelon Institute''s OIT practice bank contains over 550 questions across all six modules, with detailed explanations for every answer. The first 15 questions on every course are free with no account required.</p>',
  '<p>Build a schedule around your exam date and your diagnostic results. Start with the official study guide, practise calculations by hand, and use question explanations to repair weak topics. Take a timed mock only after you have covered the material, then return to the areas where the result shows gaps.</p>\n<p>Echelon provides separate Ontario OIT Water and OIT Wastewater preparation experiences with practice questions, explanations, flashcards, process guides, and mock exams. The free preview lets you evaluate the question experience before purchasing. Echelon is an independent exam-preparation provider and is not affiliated with or endorsed by OWWCO or MECP.</p>'
)
WHERE `slug` = 'how-to-pass-ontario-oit-water-exam';
--> statement-breakpoint

UPDATE `blog_posts`
SET `content` = REPLACE(
  `content`,
  '<p>The exam is administered at approved testing centres across Ontario. You will need government-issued photo ID and your confirmation number. The exam is closed-book, so all formulas must be memorized. Budget roughly 90 seconds per question; most candidates finish with time to spare.</p>\n<p>If you encounter a calculation question you cannot solve, mark it and move on. Return to it after completing the rest of the exam. Partial credit is not awarded, so an educated guess is always better than leaving a question blank.</p>',
  '<p>Follow the confirmation and candidate instructions issued for your exam date. Verify identification, arrival, calculator, reference-table, timing, and rescheduling rules with the official administrator rather than assuming that an older candidate''s experience still applies.</p>\n<p>During the exam, read units and qualifiers carefully. If the exam interface permits review, mark a difficult item, continue, and return after completing the questions you can answer confidently.</p>'
)
WHERE `slug` = 'how-to-pass-ontario-oit-water-exam';
--> statement-breakpoint

UPDATE `blog_posts`
SET `content` = REPLACE(
  `content`,
  '<p>Once you pass the OIT exam, you can begin accumulating the supervised operating experience required for Class 1 certification. Ontario requires a minimum of 12 months of full-time operating experience at a Class 1 or higher facility before you can write the Class 1 exam. Keeping a detailed log of your operating hours and the tasks you perform will make the application process much smoother.</p>',
  '<p>Passing an exam is only one part of certification. OWWCO and MECP determine the current education, experience, training, and application requirements for each certificate or licence. Keep records of your operating experience and training, and confirm the requirements for your next application directly with OWWCO.</p>'
)
WHERE `slug` = 'how-to-pass-ontario-oit-water-exam';
