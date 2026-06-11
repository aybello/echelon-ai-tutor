/**
 * Blog seed script — inserts 5 SEO-targeted posts for Ontario water/wastewater
 * operator certification.
 *
 * Run: node server/scripts/seedBlog.mjs
 */

import "dotenv/config";
import mysql from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DB_URL);

const posts = [
  {
    slug: "how-to-pass-ontario-oit-water-exam",
    title: "How to Pass the Ontario OIT Water Exam: A Complete Study Guide",
    excerpt:
      "The Ontario OIT (Operator-in-Training) Water exam covers disinfection, hydraulics, regulations, math, and health & safety. Here is everything you need to know to pass on your first attempt.",
    author: "Echelon Institute",
    tags: "OIT,Ontario,water treatment,exam prep,certification",
    metaTitle: "How to Pass the Ontario OIT Water Exam | Echelon Institute",
    metaDescription:
      "Step-by-step study guide for the Ontario OIT Water Operator exam. Covers disinfection, hydraulics, regulations, math, and health & safety. Free practice questions included.",
    readingTimeMinutes: 8,
    content: `
<h2>What Is the Ontario OIT Water Exam?</h2>
<p>The Operator-in-Training (OIT) certification is the entry-level credential for anyone working in an Ontario water treatment or distribution facility. Issued by the Ontario Ministry of the Environment, Conservation and Parks (MECP), it is a prerequisite for all higher-level Class 1 through Class 4 water certifications.</p>
<p>The exam consists of 100 multiple-choice questions drawn from six core subject areas. You need a score of at least 70% to pass. Most candidates write the exam after completing an approved operator training program or after accumulating supervised operating experience.</p>

<h2>The Six Exam Modules</h2>
<p>Understanding the weight of each module helps you allocate your study time effectively. The exam draws questions roughly as follows:</p>

<table>
  <thead><tr><th>Module</th><th>Approximate Weight</th><th>Key Topics</th></tr></thead>
  <tbody>
    <tr><td>Disinfection</td><td>20%</td><td>Chlorination, CT values, UV, ozone, residuals</td></tr>
    <tr><td>Hydraulics</td><td>18%</td><td>Flow rates, pressure, head loss, pump curves</td></tr>
    <tr><td>Regulations</td><td>17%</td><td>Safe Drinking Water Act, O. Reg. 170/03, reporting</td></tr>
    <tr><td>Math &amp; Calculations</td><td>20%</td><td>Dosage, flow, volume, unit conversions</td></tr>
    <tr><td>Health &amp; Safety</td><td>13%</td><td>WHMIS, confined space, PPE, OHSA</td></tr>
    <tr><td>Water Quality</td><td>12%</td><td>Turbidity, pH, hardness, coagulation, filtration</td></tr>
  </tbody>
</table>

<h2>Disinfection: The Highest-Value Module</h2>
<p>Disinfection questions are consistently the most challenging for new operators. The exam tests your ability to calculate CT values (concentration multiplied by contact time), understand the difference between primary and secondary disinfection, and identify the correct residual levels required under Ontario Regulation 170/03.</p>
<blockquote>
  <p><strong>Key formula:</strong> CT = C (mg/L) × T (minutes). A CT of 0.2 mg·min/L achieves 99% inactivation of Giardia at 5°C with free chlorine.</p>
</blockquote>
<p>Practice interpreting CT tables for different temperatures and pH values. The exam will give you a scenario and ask you to determine whether the required CT has been achieved.</p>

<h2>Math and Calculations: Do Not Skip These</h2>
<p>Many candidates underestimate the math section. You will need to calculate chlorine dosage, flow rates, tank volumes, and chemical feed rates without a formula sheet. The good news is that the same formulas appear repeatedly, so mastering about 15 core equations covers the vast majority of calculation questions.</p>
<p>The most commonly tested formulas include:</p>
<ul>
  <li>Flow rate: Q = A × V (flow = area × velocity)</li>
  <li>Chlorine dosage: Dose (mg/L) = Demand + Residual</li>
  <li>Volume of a cylinder: V = π × r² × h</li>
  <li>Chemical feed rate: Feed (kg/day) = Flow (ML/day) × Dose (mg/L)</li>
  <li>Percent solution: % = (mass of solute / mass of solution) × 100</li>
</ul>

<h2>Regulations: Know O. Reg. 170/03 Cold</h2>
<p>Ontario Regulation 170/03 governs the sampling, testing, and reporting requirements for all municipal drinking water systems. The exam tests your knowledge of minimum sampling frequencies, required residual levels at the point of consumption (minimum 0.05 mg/L free chlorine), and adverse result reporting timelines (notify the local Medical Officer of Health within 24 hours of an adverse result).</p>
<p>You do not need to memorize every section number, but you do need to understand the intent and key thresholds of the regulation.</p>

<h2>A Realistic Study Plan</h2>
<p>Most candidates who pass on their first attempt spend 40 to 60 hours studying over four to six weeks. A practical approach is to dedicate the first two weeks to reading your course notes and the MECP's Drinking Water Operator Training modules, then spend the remaining time on practice questions. Doing at least 300 to 400 practice questions before the exam is strongly recommended.</p>
<p>Echelon Institute's OIT practice bank contains over 550 questions across all six modules, with detailed explanations for every answer. The first 15 questions on every course are free with no account required.</p>

<h2>On Exam Day</h2>
<p>The exam is administered at approved testing centres across Ontario. You will need government-issued photo ID and your confirmation number. The exam is closed-book, so all formulas must be memorized. Budget roughly 90 seconds per question; most candidates finish with time to spare.</p>
<p>If you encounter a calculation question you cannot solve, mark it and move on. Return to it after completing the rest of the exam. Partial credit is not awarded, so an educated guess is always better than leaving a question blank.</p>

<h2>After You Pass</h2>
<p>Once you pass the OIT exam, you can begin accumulating the supervised operating experience required for Class 1 certification. Ontario requires a minimum of 12 months of full-time operating experience at a Class 1 or higher facility before you can write the Class 1 exam. Keeping a detailed log of your operating hours and the tasks you perform will make the application process much smoother.</p>
    `.trim(),
  },
  {
    slug: "ontario-class-1-vs-class-2-water-operator-differences",
    title: "Ontario Class 1 vs Class 2 Water Operator: What Is the Difference?",
    excerpt:
      "Confused about the difference between Class 1 and Class 2 water operator certification in Ontario? This guide breaks down the exam content, facility requirements, and career implications of each level.",
    author: "Echelon Institute",
    tags: "Class 1,Class 2,Ontario,water operator,certification,career",
    metaTitle: "Ontario Class 1 vs Class 2 Water Operator Certification | Echelon Institute",
    metaDescription:
      "Understand the key differences between Ontario Class 1 and Class 2 water operator certification. Covers exam content, facility classifications, experience requirements, and salary implications.",
    readingTimeMinutes: 7,
    content: `
<h2>The Ontario Water Operator Certification Ladder</h2>
<p>Ontario's water operator certification system has five levels: OIT (Operator-in-Training), Class 1, Class 2, Class 3, and Class 4. Each level corresponds to increasingly complex treatment processes and larger, more critical water systems. Moving up the ladder requires passing a progressively harder exam and accumulating additional supervised operating experience.</p>
<p>Class 1 and Class 2 are the two most common certifications held by working operators in Ontario. Understanding the differences between them is essential for planning your career and knowing which exam to prepare for next.</p>

<h2>Facility Classification: What Each Level Covers</h2>
<p>The Ministry of the Environment classifies water treatment plants and distribution systems on a points-based system. The classification is determined by factors including population served, treatment processes used, and the complexity of the system. A Class 1 operator can be the overall responsible operator (ORO) of a Class 1 facility, a Class 2 operator can be the ORO of a Class 1 or Class 2 facility, and so on.</p>

<table>
  <thead><tr><th>Certification Level</th><th>Typical Facility Size</th><th>Treatment Complexity</th><th>ORO Eligibility</th></tr></thead>
  <tbody>
    <tr><td>OIT</td><td>Any (supervised only)</td><td>Any</td><td>No</td></tr>
    <tr><td>Class 1</td><td>Small communities, &lt;10,000 population</td><td>Basic filtration and disinfection</td><td>Class 1 facilities</td></tr>
    <tr><td>Class 2</td><td>Mid-size communities, 10,000-50,000</td><td>Conventional treatment, softening</td><td>Class 1 and 2 facilities</td></tr>
    <tr><td>Class 3</td><td>Large cities, 50,000-500,000</td><td>Advanced treatment, multiple barriers</td><td>Class 1, 2, and 3 facilities</td></tr>
    <tr><td>Class 4</td><td>Major urban centres, 500,000+</td><td>Full advanced treatment, ozone, membranes</td><td>All facilities</td></tr>
  </tbody>
</table>

<h2>Exam Content Differences</h2>
<p>The Class 1 exam builds directly on the OIT content, adding more depth in hydraulics, treatment processes, and regulatory compliance. The Class 2 exam introduces significantly more advanced topics, including lime softening, iron and manganese removal, membrane filtration, and more complex hydraulic calculations.</p>
<p>Both exams are 100 multiple-choice questions with a 70% passing threshold. The Class 2 exam has a noticeably higher failure rate because the calculation questions are more complex and the treatment process questions require a deeper understanding of the chemistry involved.</p>

<h2>Experience Requirements</h2>
<p>To write the Class 1 exam, you must hold an OIT certificate and have at least 12 months of full-time operating experience at a Class 1 or higher water treatment or distribution facility. For Class 2, you need to hold a Class 1 certificate and have at least 24 additional months of experience, for a total of at least 36 months from the time you received your OIT.</p>
<p>The MECP requires that your experience be documented and verified by your employer. Operators who work at higher-class facilities accumulate qualifying experience faster because they are exposed to more complex processes.</p>

<h2>Salary Implications</h2>
<p>In Ontario, water operator salaries increase meaningfully with each certification level. Class 1 operators at municipal utilities typically earn between $55,000 and $70,000 per year. Class 2 operators generally earn between $70,000 and $90,000, and Class 3 and 4 operators can earn well over $100,000 at large utilities. Many municipalities also offer shift premiums, overtime, and defined-benefit pension plans that significantly increase total compensation.</p>

<h2>Which Exam Should You Write Next?</h2>
<p>If you currently hold an OIT certificate and have completed your 12 months of experience, writing the Class 1 exam is the logical next step. Do not skip directly to Class 2 even if you feel confident, because the Class 2 exam assumes mastery of all Class 1 content. Building a strong foundation at Class 1 makes the Class 2 preparation significantly easier.</p>
<p>Echelon Institute offers dedicated practice banks for both Class 1 Water and Class 2 Water, each with over 500 questions and full explanations. You can start practising for free without creating an account.</p>
    `.trim(),
  },
  {
    slug: "water-treatment-chlorination-guide-ontario-operators",
    title: "Chlorination in Water Treatment: A Practical Guide for Ontario Operators",
    excerpt:
      "Chlorination is the most tested topic on every Ontario water operator exam. This guide covers breakpoint chlorination, CT values, residual requirements, and the most common exam questions on disinfection.",
    author: "Echelon Institute",
    tags: "chlorination,disinfection,water treatment,Ontario,OIT,Class 1,Class 2",
    metaTitle: "Chlorination in Water Treatment: Guide for Ontario Operators | Echelon Institute",
    metaDescription:
      "Master chlorination for the Ontario water operator exam. Covers breakpoint chlorination, CT values, residual requirements, chlorine demand, and common exam scenarios with practice questions.",
    readingTimeMinutes: 9,
    content: `
<h2>Why Chlorination Dominates the Exam</h2>
<p>Chlorination questions appear on every Ontario water operator exam from OIT through Class 4. Disinfection is the single most critical barrier in drinking water treatment, and the MECP expects operators to understand it deeply. On the OIT exam alone, disinfection accounts for approximately 20% of all questions.</p>
<p>The good news is that chlorination follows predictable chemistry. Once you understand the underlying principles, the exam questions become straightforward pattern-matching exercises.</p>

<h2>Forms of Chlorine Used in Water Treatment</h2>
<p>Ontario water systems use several forms of chlorine, each with different strengths and handling requirements:</p>
<ul>
  <li><strong>Chlorine gas (Cl₂):</strong> The most cost-effective form for large plants. Highly toxic and requires strict safety protocols. Stored in pressurized cylinders or ton containers.</li>
  <li><strong>Sodium hypochlorite (NaOCl):</strong> Liquid bleach, typically 5-15% available chlorine. Easier to handle than gas but degrades over time and with UV exposure.</li>
  <li><strong>Calcium hypochlorite (Ca(OCl)₂):</strong> Granular or tablet form, typically 65-70% available chlorine. Used in smaller systems and for emergency disinfection.</li>
</ul>

<h2>Chlorine Chemistry in Water</h2>
<p>When chlorine is added to water, it reacts with water to form hypochlorous acid (HOCl) and hypochlorite ion (OCl⁻). Together, these are called <strong>free chlorine</strong>. HOCl is the more effective disinfectant, and its proportion relative to OCl⁻ is controlled by pH. At lower pH values (below 7.5), HOCl dominates. At higher pH values (above 8.0), OCl⁻ dominates and disinfection efficiency drops significantly.</p>
<blockquote>
  <p><strong>Exam tip:</strong> At pH 7.5, approximately 50% of free chlorine is in the HOCl form. At pH 6.0, roughly 97% is HOCl. At pH 9.0, only about 3% is HOCl. This is why pH control matters for effective disinfection.</p>
</blockquote>

<h2>Breakpoint Chlorination</h2>
<p>When chlorine is added to water containing ammonia or organic nitrogen compounds, it first reacts to form chloramines (combined chlorine). Chloramines are weaker disinfectants than free chlorine. As more chlorine is added, the chloramines are eventually destroyed and free chlorine begins to accumulate. The point at which all chloramines have been destroyed and free chlorine starts to appear is called the <strong>breakpoint</strong>.</p>
<p>To reach breakpoint, you typically need to add chlorine at a ratio of approximately 7.6 mg of chlorine per mg of ammonia nitrogen. The exam will often give you an ammonia concentration and ask you to calculate the chlorine dose required to reach breakpoint.</p>

<h2>CT Values and Inactivation Credits</h2>
<p>The CT concept is the foundation of disinfection credit calculations. CT is the product of the disinfectant concentration (C, in mg/L) and the contact time (T, in minutes). Higher CT values provide greater inactivation of pathogens.</p>
<p>Ontario Regulation 170/03 requires water systems to achieve specific CT values for Giardia and Cryptosporidium inactivation. The required CT depends on the temperature of the water and the pH. At lower temperatures, pathogens are more resistant, so a higher CT is required.</p>

<table>
  <thead><tr><th>Temperature (°C)</th><th>CT for 3-log Giardia (free Cl₂, pH 7.0)</th></tr></thead>
  <tbody>
    <tr><td>0.5</td><td>165 mg·min/L</td></tr>
    <tr><td>5</td><td>119 mg·min/L</td></tr>
    <tr><td>10</td><td>87 mg·min/L</td></tr>
    <tr><td>15</td><td>63 mg·min/L</td></tr>
    <tr><td>20</td><td>48 mg·min/L</td></tr>
    <tr><td>25</td><td>36 mg·min/L</td></tr>
  </tbody>
</table>

<h2>Residual Requirements Under O. Reg. 170/03</h2>
<p>Ontario Regulation 170/03 sets the following minimum free chlorine residual requirements for large municipal residential systems:</p>
<ul>
  <li>At the point of entry to the distribution system: the residual must be sufficient to achieve the required CT</li>
  <li>At the extremities of the distribution system: minimum 0.05 mg/L free chlorine</li>
  <li>Maximum chlorine residual: 4.0 mg/L (Health Canada guideline)</li>
</ul>
<p>Operators must test and record chlorine residuals at the required frequency and report any adverse results to the local Medical Officer of Health within 24 hours.</p>

<h2>Common Exam Calculation: Chlorine Dosage</h2>
<p>The most common calculation question on the exam asks you to determine how much chlorine to add to achieve a target residual, given the chlorine demand of the water.</p>
<p><strong>Formula:</strong> Chlorine Dose (mg/L) = Chlorine Demand (mg/L) + Target Residual (mg/L)</p>
<p><strong>Example:</strong> A water sample has a chlorine demand of 1.8 mg/L. The target residual at the point of entry is 0.5 mg/L. What chlorine dose is required?</p>
<p>Dose = 1.8 + 0.5 = <strong>2.3 mg/L</strong></p>
<p>If the flow rate is 5,000 m³/day, the daily chlorine requirement is: 5,000 m³/day × 2.3 g/m³ = 11,500 g/day = <strong>11.5 kg/day</strong></p>
    `.trim(),
  },
  {
    slug: "eocp-wastewater-operator-certification-ontario-guide",
    title: "EOCP Wastewater Operator Certification in Ontario: Complete Guide",
    excerpt:
      "The Environmental Operators Certification Program (EOCP) governs wastewater operator certification in Ontario. This guide covers the OIT Wastewater exam, Class 1-4 levels, experience requirements, and how to prepare.",
    author: "Echelon Institute",
    tags: "EOCP,wastewater,Ontario,OIT wastewater,Class 1 wastewater,certification",
    metaTitle: "EOCP Wastewater Operator Certification Ontario: Complete Guide | Echelon Institute",
    metaDescription:
      "Everything you need to know about EOCP wastewater operator certification in Ontario. Covers OIT Wastewater, Class 1-4 exams, experience requirements, exam content, and study strategies.",
    readingTimeMinutes: 8,
    content: `
<h2>What Is the EOCP?</h2>
<p>The Environmental Operators Certification Program (EOCP) is the body responsible for certifying wastewater treatment and collection system operators in Ontario. While water treatment certification is administered directly by the MECP, wastewater certification in Ontario is managed by the EOCP, a non-profit organization established in partnership with the province.</p>
<p>EOCP certification is required for anyone who operates a wastewater treatment plant or collection system in Ontario. The program has five levels: OIT (Operator-in-Training), Class 1, Class 2, Class 3, and Class 4, mirroring the structure of the water treatment certification system.</p>

<h2>The OIT Wastewater Exam</h2>
<p>The OIT Wastewater exam is the entry point for the EOCP certification ladder. It covers six core subject areas and consists of 100 multiple-choice questions. The passing score is 70%.</p>

<table>
  <thead><tr><th>Module</th><th>Approximate Weight</th><th>Key Topics</th></tr></thead>
  <tbody>
    <tr><td>Wastewater Treatment Processes</td><td>25%</td><td>Primary, secondary, and tertiary treatment; activated sludge; trickling filters</td></tr>
    <tr><td>Hydraulics</td><td>18%</td><td>Flow rates, pipe sizing, pump selection, head loss</td></tr>
    <tr><td>Regulations</td><td>17%</td><td>Environmental Protection Act, O. Reg. 129/04, effluent limits</td></tr>
    <tr><td>Math &amp; Calculations</td><td>20%</td><td>BOD loading, hydraulic retention time, sludge volume index</td></tr>
    <tr><td>Health &amp; Safety</td><td>10%</td><td>Confined space, H₂S, WHMIS, PPE</td></tr>
    <tr><td>Sludge Management</td><td>10%</td><td>Thickening, digestion, dewatering, biosolids</td></tr>
  </tbody>
</table>

<h2>Key Differences from Water Treatment Exams</h2>
<p>Candidates who have already passed the OIT Water exam often find the OIT Wastewater exam more challenging in the process area. Wastewater treatment involves biological processes (activated sludge, nitrification, denitrification) that are more complex and variable than the chemical processes dominant in water treatment. The math section also introduces different formulas, particularly around biological oxygen demand (BOD), food-to-microorganism (F:M) ratio, and sludge retention time (SRT).</p>
<blockquote>
  <p><strong>Key formula:</strong> Hydraulic Retention Time (HRT) = Volume of Reactor (m³) / Flow Rate (m³/day). A typical activated sludge aeration basin has an HRT of 6-8 hours.</p>
</blockquote>

<h2>The Activated Sludge Process: The Core of Wastewater Treatment</h2>
<p>The activated sludge process is the most widely used secondary treatment method in Ontario and the most heavily tested topic on wastewater operator exams. It uses a mixed culture of microorganisms (the activated sludge) to biologically treat wastewater in an aeration basin. The treated effluent and sludge are then separated in a secondary clarifier, with a portion of the sludge returned to the aeration basin (return activated sludge, or RAS) and the remainder wasted (waste activated sludge, or WAS).</p>
<p>Operators control the process by adjusting the WAS rate, which changes the sludge retention time (SRT) and the F:M ratio. A longer SRT produces a more stable, nitrifying sludge but requires more aeration energy. A shorter SRT produces a younger, more active sludge that is better suited to high-strength wastewater.</p>

<h2>Confined Space Safety: A Critical Topic</h2>
<p>Wastewater facilities have a higher density of confined spaces than most other industrial workplaces. Manholes, wet wells, digesters, and chemical storage tanks all qualify as confined spaces under Ontario's Occupational Health and Safety Act. The exam tests your knowledge of the permit-to-enter system, atmospheric testing requirements (oxygen, flammable gases, H₂S), and rescue procedures.</p>
<p>Hydrogen sulfide (H₂S) is the most dangerous gas encountered in wastewater operations. It is heavier than air, accumulates in low points, and is immediately dangerous to life and health (IDLH) at 100 ppm. Critically, H₂S deadens the sense of smell at concentrations above 100 ppm, so you cannot rely on the characteristic rotten-egg odour as a warning at high concentrations.</p>

<h2>Experience Requirements for EOCP Certification</h2>
<p>The experience requirements for EOCP certification are similar to those for water treatment certification. To write the Class 1 exam, you need an OIT certificate and 12 months of full-time operating experience at a Class 1 or higher wastewater facility. For Class 2, you need a Class 1 certificate and an additional 24 months of experience.</p>
<p>EOCP also accepts experience at collection system facilities, which can be useful for operators who work primarily in the field rather than at a treatment plant.</p>

<h2>How to Prepare for the EOCP Exams</h2>
<p>The EOCP publishes a study guide and a list of reference materials for each certification level. The Ontario Wastewater Treatment Operator Training Manual is the primary reference for OIT and Class 1 preparation. For higher levels, the Metcalf and Eddy textbook "Wastewater Engineering: Treatment and Resource Recovery" is the standard reference.</p>
<p>Practice questions are the most effective preparation tool. Echelon Institute's OIT Wastewater practice bank covers all six modules with detailed explanations. The Class 1 and Class 2 Wastewater banks are also available for operators preparing for higher-level exams.</p>
    `.trim(),
  },
  {
    slug: "ontario-water-operator-exam-math-formulas-cheat-sheet",
    title: "Ontario Water Operator Exam: Essential Math Formulas and Practice Problems",
    excerpt:
      "Math questions account for 20% of every Ontario water operator exam. This guide covers the 15 essential formulas you must memorize, with worked examples for the most common calculation types.",
    author: "Echelon Institute",
    tags: "math,formulas,calculations,Ontario,water operator,OIT,Class 1,Class 2,exam prep",
    metaTitle: "Ontario Water Operator Exam Math Formulas | Echelon Institute",
    metaDescription:
      "Master the math for Ontario water operator exams. Covers 15 essential formulas with worked examples: chlorine dosage, flow rates, tank volumes, pump efficiency, and chemical feed calculations.",
    readingTimeMinutes: 10,
    content: `
<h2>Why Math Is Worth Mastering</h2>
<p>Math and calculation questions account for approximately 20% of every Ontario water operator exam from OIT through Class 4. Unlike process knowledge questions that require memorizing facts, math questions reward practice. Every formula you master is a near-guaranteed correct answer on exam day.</p>
<p>The exam does not provide a formula sheet. You must have the formulas memorized and be able to apply them quickly. The good news is that the same 15 formulas appear repeatedly across all certification levels, with increasing complexity at higher levels.</p>

<h2>Unit Conversions You Must Know</h2>
<p>Before working through the formulas, make sure you have these unit conversions memorized. Conversion errors are the most common source of mistakes on calculation questions.</p>

<table>
  <thead><tr><th>Conversion</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>1 m³</td><td>1,000 litres (L)</td></tr>
    <tr><td>1 ML (megalitre)</td><td>1,000 m³ = 1,000,000 L</td></tr>
    <tr><td>1 mg/L</td><td>1 g/m³ = 1 ppm (in water)</td></tr>
    <tr><td>1 kg/day</td><td>1,000 g/day</td></tr>
    <tr><td>1 L/s</td><td>86.4 m³/day</td></tr>
    <tr><td>1 m³/s</td><td>1,000 L/s = 86,400 m³/day</td></tr>
  </tbody>
</table>

<h2>The 15 Essential Formulas</h2>

<h3>1. Chlorine Dosage</h3>
<p><strong>Dose (mg/L) = Demand (mg/L) + Residual (mg/L)</strong></p>
<p><em>Example:</em> Chlorine demand = 2.1 mg/L, target residual = 0.4 mg/L. Dose = 2.1 + 0.4 = <strong>2.5 mg/L</strong></p>

<h3>2. Chemical Mass Required</h3>
<p><strong>Mass (kg/day) = Flow (m³/day) × Dose (g/m³) ÷ 1,000</strong></p>
<p><em>Example:</em> Flow = 8,000 m³/day, dose = 2.5 mg/L. Mass = 8,000 × 2.5 ÷ 1,000 = <strong>20 kg/day</strong></p>

<h3>3. Volume of a Cylinder</h3>
<p><strong>V = π × r² × h</strong> (where r = radius, h = height)</p>
<p><em>Example:</em> Tank diameter = 10 m, depth = 4 m. r = 5 m. V = 3.14159 × 25 × 4 = <strong>314.2 m³</strong></p>

<h3>4. Volume of a Rectangle</h3>
<p><strong>V = L × W × H</strong></p>
<p><em>Example:</em> Reservoir 20 m × 15 m × 5 m deep. V = 20 × 15 × 5 = <strong>1,500 m³</strong></p>

<h3>5. Flow Rate (Velocity Method)</h3>
<p><strong>Q = A × V</strong> (flow = cross-sectional area × velocity)</p>
<p><em>Example:</em> Pipe diameter = 0.3 m, velocity = 1.5 m/s. A = π × (0.15)² = 0.0707 m². Q = 0.0707 × 1.5 = <strong>0.106 m³/s</strong></p>

<h3>6. Hydraulic Retention Time</h3>
<p><strong>HRT (hours) = Volume (m³) × 24 / Flow (m³/day)</strong></p>
<p><em>Example:</em> Tank volume = 500 m³, flow = 2,000 m³/day. HRT = 500 × 24 / 2,000 = <strong>6 hours</strong></p>

<h3>7. CT Value</h3>
<p><strong>CT = C (mg/L) × T (minutes)</strong></p>
<p><em>Example:</em> Chlorine residual = 0.8 mg/L, contact time = 25 minutes. CT = 0.8 × 25 = <strong>20 mg·min/L</strong></p>

<h3>8. Percent Solution</h3>
<p><strong>% = (mass of solute / mass of solution) × 100</strong></p>
<p><em>Example:</em> 5 kg of alum dissolved in 95 kg of water. % = (5 / 100) × 100 = <strong>5%</strong></p>

<h3>9. Pump Efficiency</h3>
<p><strong>Efficiency (%) = (Water Power / Input Power) × 100</strong></p>
<p>Water power (kW) = Flow (m³/s) × Head (m) × 9.81 kN/m³</p>

<h3>10. Fluoride Dosage</h3>
<p><strong>Volume of fluoride solution = (Target dose × Flow) / (Concentration of solution)</strong></p>
<p>Same structure as chlorine dosage but applied to fluoridation chemicals.</p>

<h3>11. Weir Overflow Rate</h3>
<p><strong>Weir overflow rate (m³/m·day) = Flow (m³/day) / Weir length (m)</strong></p>

<h3>12. Surface Overflow Rate</h3>
<p><strong>SOR (m³/m²·day) = Flow (m³/day) / Surface area (m²)</strong></p>

<h3>13. Sludge Volume Index (SVI)</h3>
<p><strong>SVI = (Settled sludge volume mL/L × 1,000) / MLSS (mg/L)</strong></p>
<p>A healthy activated sludge has an SVI between 80 and 150 mL/g.</p>

<h3>14. Food-to-Microorganism Ratio</h3>
<p><strong>F:M = BOD applied (kg/day) / MLVSS in aeration basin (kg)</strong></p>

<h3>15. Percent Removal</h3>
<p><strong>% Removal = ((Influent - Effluent) / Influent) × 100</strong></p>
<p><em>Example:</em> Influent BOD = 250 mg/L, effluent BOD = 15 mg/L. % Removal = ((250 - 15) / 250) × 100 = <strong>94%</strong></p>

<h2>Practice Problem: Full Calculation Scenario</h2>
<p>A water treatment plant treats 12,000 m³/day. The raw water has a chlorine demand of 1.6 mg/L and the target residual at the point of entry is 0.6 mg/L. The plant uses a 12% sodium hypochlorite solution (specific gravity 1.17). How many litres of hypochlorite solution are required per day?</p>
<p><strong>Step 1:</strong> Calculate the chlorine dose. Dose = 1.6 + 0.6 = 2.2 mg/L</p>
<p><strong>Step 2:</strong> Calculate the mass of chlorine required. Mass = 12,000 m³/day × 2.2 g/m³ ÷ 1,000 = 26.4 kg/day</p>
<p><strong>Step 3:</strong> Calculate the volume of hypochlorite solution. The solution is 12% by weight. Mass of solution = 26.4 kg ÷ 0.12 = 220 kg. Volume = 220 kg ÷ 1.17 kg/L = <strong>188 litres/day</strong></p>
    `.trim(),
  },
];

// Insert posts
let inserted = 0;
for (const post of posts) {
  try {
    await conn.execute(
      `INSERT INTO blog_posts (slug, title, excerpt, content, author, tags, metaTitle, metaDescription, readingTimeMinutes, published, publishedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         excerpt = VALUES(excerpt),
         content = VALUES(content),
         author = VALUES(author),
         tags = VALUES(tags),
         metaTitle = VALUES(metaTitle),
         metaDescription = VALUES(metaDescription),
         readingTimeMinutes = VALUES(readingTimeMinutes),
         updatedAt = NOW()`,
      [
        post.slug,
        post.title,
        post.excerpt,
        post.content,
        post.author,
        post.tags,
        post.metaTitle,
        post.metaDescription,
        post.readingTimeMinutes,
      ]
    );
    console.log(`✓ ${post.slug}`);
    inserted++;
  } catch (err) {
    console.error(`✗ ${post.slug}:`, err.message);
  }
}

console.log(`\nDone. ${inserted}/${posts.length} posts seeded.`);
await conn.end();
