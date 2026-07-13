/**
 * Append internal links and course CTAs to all blog posts.
 * Run: node server/scripts/addInternalLinks.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

/**
 * Map of slug -> { relatedSlugs, courseLink, courseName }
 * relatedSlugs: up to 3 other posts to link to
 * courseLink: the most relevant practice course on Echelon
 * courseName: human-readable course name
 */
const linkMap = {
  // Ontario posts
  "how-to-pass-ontario-oit-water-exam": {
    related: [
      { slug: "ontario-class-1-vs-class-2-water-operator-differences", title: "Ontario Class 1 vs Class 2 Water Operator: What Is the Difference?" },
      { slug: "water-treatment-chlorination-guide-ontario-operators", title: "Chlorination in Water Treatment: A Practical Guide for Ontario Operators" },
      { slug: "ontario-water-operator-exam-math-formulas-cheat-sheet", title: "Ontario Water Operator Exam: Essential Math Formulas and Practice Problems" },
    ],
    courseLink: "/quiz",
    courseName: "OIT Practice (free, 500+ questions)",
  },
  "ontario-class-1-vs-class-2-water-operator-differences": {
    related: [
      { slug: "how-to-pass-ontario-oit-water-exam", title: "How to Pass the Ontario OIT Water Exam: A Complete Study Guide" },
      { slug: "ontario-water-operator-exam-math-formulas-cheat-sheet", title: "Ontario Water Operator Exam: Essential Math Formulas and Practice Problems" },
      { slug: "canadian-water-operator-certification-by-province", title: "Canadian Water Operator Certification by Province: Complete Comparison" },
    ],
    courseLink: "/class1-water",
    courseName: "Class 1 Water Treatment Practice",
  },
  "water-treatment-chlorination-guide-ontario-operators": {
    related: [
      { slug: "how-to-pass-ontario-oit-water-exam", title: "How to Pass the Ontario OIT Water Exam: A Complete Study Guide" },
      { slug: "ontario-water-operator-exam-math-formulas-cheat-sheet", title: "Ontario Water Operator Exam: Essential Math Formulas and Practice Problems" },
      { slug: "eocp-wastewater-operator-certification-ontario-guide", title: "EOCP Wastewater Operator Certification in Ontario: Complete Guide" },
    ],
    courseLink: "/quiz",
    courseName: "OIT Practice (free, 500+ questions)",
  },
  "eocp-wastewater-operator-certification-ontario-guide": {
    related: [
      { slug: "ontario-class-1-vs-class-2-water-operator-differences", title: "Ontario Class 1 vs Class 2 Water Operator: What Is the Difference?" },
      { slug: "water-treatment-chlorination-guide-ontario-operators", title: "Chlorination in Water Treatment: A Practical Guide for Ontario Operators" },
      { slug: "canadian-water-operator-certification-by-province", title: "Canadian Water Operator Certification by Province: Complete Comparison" },
    ],
    courseLink: "/class1-ww",
    courseName: "Class 1 Wastewater Practice",
  },
  "ontario-water-operator-exam-math-formulas-cheat-sheet": {
    related: [
      { slug: "how-to-pass-ontario-oit-water-exam", title: "How to Pass the Ontario OIT Water Exam: A Complete Study Guide" },
      { slug: "water-treatment-chlorination-guide-ontario-operators", title: "Chlorination in Water Treatment: A Practical Guide for Ontario Operators" },
      { slug: "ontario-class-1-vs-class-2-water-operator-differences", title: "Ontario Class 1 vs Class 2 Water Operator: What Is the Difference?" },
    ],
    courseLink: "/formulas",
    courseName: "Ontario Operator Formula Sheet",
  },
  // BC posts
  "bc-water-operator-certification-guide": {
    related: [
      { slug: "eocp-exam-study-tips-bc", title: "How to Pass the EOCP Exam in BC: Study Tips for Water Operators" },
      { slug: "canadian-water-operator-certification-by-province", title: "Canadian Water Operator Certification by Province: Complete Comparison" },
      { slug: "water-treatment-chlorination-guide-ontario-operators", title: "Chlorination in Water Treatment: A Practical Guide for Ontario Operators" },
    ],
    courseLink: "/wpi",
    courseName: "WPI Practice (Water & Process Industry)",
  },
  "eocp-exam-study-tips-bc": {
    related: [
      { slug: "bc-water-operator-certification-guide", title: "BC Water Operator Certification: A Complete Guide (EOCP Classes D-A)" },
      { slug: "ontario-water-operator-exam-math-formulas-cheat-sheet", title: "Ontario Water Operator Exam: Essential Math Formulas and Practice Problems" },
      { slug: "canadian-water-operator-certification-by-province", title: "Canadian Water Operator Certification by Province: Complete Comparison" },
    ],
    courseLink: "/wpi",
    courseName: "WPI Practice (Water & Process Industry)",
  },
  // Alberta posts
  "alberta-water-operator-certification-guide": {
    related: [
      { slug: "awwoa-level-1-exam-prep-alberta", title: "AWWOA Level 1 Exam Prep: Alberta Water Operator Study Guide" },
      { slug: "canadian-water-operator-certification-by-province", title: "Canadian Water Operator Certification by Province: Complete Comparison" },
      { slug: "bc-water-operator-certification-guide", title: "BC Water Operator Certification: A Complete Guide (EOCP Classes D-A)" },
    ],
    courseLink: "/wpi",
    courseName: "WPI Practice (Water & Process Industry)",
  },
  "awwoa-level-1-exam-prep-alberta": {
    related: [
      { slug: "alberta-water-operator-certification-guide", title: "Alberta Water Operator Certification: Levels 1-4 Complete Guide" },
      { slug: "ontario-water-operator-exam-math-formulas-cheat-sheet", title: "Ontario Water Operator Exam: Essential Math Formulas and Practice Problems" },
      { slug: "canadian-water-operator-certification-by-province", title: "Canadian Water Operator Certification by Province: Complete Comparison" },
    ],
    courseLink: "/wpi",
    courseName: "WPI Practice (Water & Process Industry)",
  },
  // Saskatchewan
  "saskatchewan-water-operator-certification-guide": {
    related: [
      { slug: "canadian-water-operator-certification-by-province", title: "Canadian Water Operator Certification by Province: Complete Comparison" },
      { slug: "alberta-water-operator-certification-guide", title: "Alberta Water Operator Certification: Levels 1-4 Complete Guide" },
      { slug: "manitoba-water-operator-certification-guide", title: "Manitoba Water Operator Certification: ABC Exam Guide" },
    ],
    courseLink: "/wpi",
    courseName: "WPI Practice (Water & Process Industry)",
  },
  // Manitoba
  "manitoba-water-operator-certification-guide": {
    related: [
      { slug: "canadian-water-operator-certification-by-province", title: "Canadian Water Operator Certification by Province: Complete Comparison" },
      { slug: "saskatchewan-water-operator-certification-guide", title: "Saskatchewan Water Operator Certification: OCB Exam Guide" },
      { slug: "ontario-water-operator-exam-math-formulas-cheat-sheet", title: "Ontario Water Operator Exam: Essential Math Formulas and Practice Problems" },
    ],
    courseLink: "/wpi",
    courseName: "WPI Practice (Water & Process Industry)",
  },
  // National comparison
  "canadian-water-operator-certification-by-province": {
    related: [
      { slug: "how-to-pass-ontario-oit-water-exam", title: "How to Pass the Ontario OIT Water Exam: A Complete Study Guide" },
      { slug: "bc-water-operator-certification-guide", title: "BC Water Operator Certification: A Complete Guide (EOCP Classes D-A)" },
      { slug: "alberta-water-operator-certification-guide", title: "Alberta Water Operator Certification: Levels 1-4 Complete Guide" },
    ],
    courseLink: "/pricing",
    courseName: "View All Practice Courses",
  },
};

function buildInternalLinksSection(slug) {
  const info = linkMap[slug];
  if (!info) return "";

  const relatedLinks = info.related
    .map(r => `<li><a href="/blog/${r.slug}">${r.title}</a></li>`)
    .join("\n");

  return `
<hr>
<h2>Related Articles</h2>
<ul>
${relatedLinks}
</ul>

<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:16px 20px;margin-top:24px;">
  <strong>Ready to practise what you just read?</strong><br>
  Echelon Institute has 15,000+ adaptive practice questions mapped to every Canadian certification exam. The first 15 questions are always free.<br><br>
  <a href="${info.courseLink}" style="background:#2563EB;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">${info.courseName} &rarr;</a>
</div>
`;
}

// Fetch all posts
const [rows] = await conn.execute("SELECT id, slug, content FROM blog_posts");

let updated = 0;
for (const row of rows) {
  const addition = buildInternalLinksSection(row.slug);
  if (!addition) {
    console.log(`⚠ No link map entry for: ${row.slug}`);
    continue;
  }

  // Only add if not already present
  if (row.content.includes("Related Articles")) {
    console.log(`⏭ Already has internal links: ${row.slug}`);
    continue;
  }

  const newContent = row.content + addition;
  await conn.execute("UPDATE blog_posts SET content = ? WHERE id = ?", [newContent, row.id]);
  updated++;
  console.log(`✓ ${row.slug}`);
}

console.log(`\nDone — ${updated} posts updated with internal links.`);
await conn.end();
