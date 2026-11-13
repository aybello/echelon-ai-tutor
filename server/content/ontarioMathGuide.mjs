// Canonical seed and targeted published-article correction. No database side effects.
export const ontarioMathGuide = {
    slug: "ontario-water-operator-exam-math-formulas-cheat-sheet",
    title: "Ontario Water Operator Exam: Essential Math Formulas and Practice Problems",
    excerpt:
      "Practice operator calculations with explicit units and worked examples. Check the current resources for your certification area and exam level, including available formula/conversion tables.",
    author: "Echelon Institute",
    tags: "math,formulas,calculations,Ontario,water operator,OIT,Class 1,Class 2,exam prep",
    metaTitle: "Ontario Water Operator Exam Math Formulas | Echelon Institute",
    metaDescription:
      "Practise math for Ontario water operator exams. Includes current reference guidance and formulas with worked examples: chlorine dosage, flow rates, tank volumes, pump efficiency, and chemical feed calculations.",
    readingTimeMinutes: 10,
    content: `
<p><em>Guidance reviewed September 13, 2026.</em></p>
<h2>Prepare for Your Specific Exam</h2>
<p>Calculation content varies by certification area and level. Use the current need-to-know document for your exam; this practice guide does not define an exam weighting or an exhaustive formula list.</p>
<p><a href="https://owwco.ca/preparing-for-your-exam/">OWWCO’s exam preparation guidance</a> links formula/conversion tables and identifies the exams using WPI content. OIT exams continue to use Ontario content. Confirm the permitted resources for your specific exam with OWWCO before your sitting.</p>
<p>Practise selecting the right relationship, tracking units and checking whether the result makes sense. Having a reference table does not replace understanding how to use it.</p>
<h2>Useful Unit Conversions</h2>
<p>Use consistent units throughout a calculation. Check the applicable reference table and show each conversion.</p>

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

<h2>15 Worked Formula Examples</h2>

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

<p>This CT example is arithmetic only. Required disinfection CT depends on the target organism, log reduction, disinfectant, temperature and pH. Use the approved effective contact time and applicable CT tables; nominal tank detention time is not automatically effective contact time.</p>

<h3>8. Percent Solution</h3>
<p><strong>% = (mass of solute / mass of solution) × 100</strong></p>
<p><em>Example:</em> 5 kg of alum dissolved in 95 kg of water. % = (5 / 100) × 100 = <strong>5%</strong></p>

<h3>9. Pump Efficiency</h3>
<p><strong>Efficiency (%) = (Water Power / Input Power) × 100</strong></p>
<p>Water power (kW) = Flow (m³/s) × Head (m) × 9.81 kN/m³</p>

<h3>10. Fluoride Dosage</h3>
<p><strong>Solution feed (L/day) = Active ingredient required (kg/day) ÷ Active ingredient concentration (kg/L)</strong></p>
<p>For example, 10 kg/day of required active ingredient from a solution containing 0.20 kg active ingredient per litre requires 10 ÷ 0.20 = 50 L/day. For fluoride, express the dose and solution concentration on the same fluoride basis.</p>

<h3>11. Weir Overflow Rate</h3>
<p><strong>Weir overflow rate (m³/m·day) = Flow (m³/day) / Weir length (m)</strong></p>

<h3>12. Surface Overflow Rate</h3>
<p><strong>SOR (m³/m²·day) = Flow (m³/day) / Surface area (m²)</strong></p>

<h3>13. Sludge Volume Index (SVI)</h3>
<p><strong>SVI = (Settled sludge volume mL/L × 1,000) / MLSS (mg/L)</strong></p>
<p>SVI uses the 30-minute settled volume and is reported in mL/g. Interpret it alongside plant trends, solids concentration and clarifier performance; one range does not establish process health.</p>

<h3>14. Food-to-Microorganism Ratio</h3>
<p><strong>F:M = BOD applied (kg/day) / MLVSS in aeration basin (kg)</strong></p>

<h3>15. Percent Removal</h3>
<p><strong>% Removal = ((Influent - Effluent) / Influent) × 100</strong></p>
<p><em>Example:</em> Influent BOD = 250 mg/L, effluent BOD = 15 mg/L. % Removal = ((250 - 15) / 250) × 100 = <strong>94%</strong></p>

<h2>Practice Problem: Full Calculation Scenario</h2>
<p>A water treatment plant treats 12,000 m³/day. The raw water has a chlorine demand of 1.6 mg/L and the target residual at the point of entry is 0.6 mg/L. The plant uses a sodium hypochlorite solution containing 12% available chlorine by mass (density 1.17 kg/L). How many litres of hypochlorite solution are required per day?</p>
<p><strong>Step 1:</strong> Calculate the chlorine dose. Dose = 1.6 + 0.6 = 2.2 mg/L</p>
<p><strong>Step 2:</strong> Calculate the mass of chlorine required. Mass = 12,000 m³/day × 2.2 g/m³ ÷ 1,000 = 26.4 kg/day</p>
<p><strong>Step 3:</strong> Calculate the volume of hypochlorite solution. The available chlorine concentration is 12% by mass. Mass of solution = 26.4 kg ÷ 0.12 = 220 kg. Volume = 220 kg ÷ 1.17 kg/L = <strong>188 litres/day</strong></p>
    `.trim(),
  };
