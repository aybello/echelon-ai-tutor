/**
 * Seed province-specific blog posts for BC, AB, SK, MB
 * Run: node server/scripts/seedProvinceBlog.mjs
 */
import mysql from "mysql2/promise";
import { eocpArticleCorrections } from "../content/eocpArticleCorrections.mjs";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const posts = [
  // ─── BRITISH COLUMBIA ───────────────────────────────────────────────────────
  {
    ...eocpArticleCorrections.find(post => post.slug === "bc-water-operator-certification-guide"),
    author: "Echelon Institute",
    tags: "British Columbia,EOCP,BC water operator,BCWWA,water certification",
    published: 1,
    publishedAt: new Date("2026-05-20"),
  },
  {
    ...eocpArticleCorrections.find(post => post.slug === "eocp-exam-study-tips-bc"),
    author: "Echelon Institute",
    tags: "British Columbia,EOCP exam,study tips,BC water operator,exam prep",
    published: 1,
    publishedAt: new Date("2026-05-28"),
  },

  // ─── ALBERTA ────────────────────────────────────────────────────────────────
  {
    slug: "alberta-water-operator-certification-guide",
    title: "Alberta Water Operator Certification: Levels 1–4 and How to Get Certified",
    excerpt:
      "A complete guide to water and wastewater operator certification in Alberta — covering the four certification levels, AWWOA training, Alberta Environment exams, and career pathways.",
    content: `## Certification in Alberta: Who Governs It?

In Alberta, water and wastewater operator certification is governed by **Alberta Environment and Protected Areas** (formerly Alberta Environment and Parks). The provincial government sets the certification requirements under the *Water Act* and the *Environmental Protection and Enhancement Act (EPEA)*. The **Alberta Water & Wastewater Operators Association (AWWOA)** is the primary training provider and professional association for operators in the province.

## Alberta's Four Certification Levels

Alberta uses a numbered level system (1 through 4) for both water treatment and wastewater treatment operators. The level required depends on the size and complexity of the facility you operate.

| Level | Facility Complexity | Typical Population Served |
|-------|--------------------|-----------------------------|
| 1 | Small, simple systems | Under 500 people |
| 2 | Medium systems | 500–5,000 people |
| 3 | Large systems | 5,000–50,000 people |
| 4 | Large, complex systems | Over 50,000 people |

Separate certification streams exist for:
- **Water Treatment (WT)**
- **Water Distribution (WD)**
- **Wastewater Treatment (WWT)**
- **Wastewater Collection (WWC)**

## How to Become Certified in Alberta

### Step 1: Meet the Eligibility Requirements
Each level has minimum education and experience requirements. For Level 1, you typically need a high school diploma and some hands-on operating experience. Higher levels require progressively more years of experience at the previous level.

### Step 2: Complete an AWWOA Training Course
The AWWOA offers **Level I Certification Preparation Courses** for both water treatment and wastewater treatment. These courses are available in three formats: online self-study, in-class (two days), and home study. The course covers all competencies tested on the Alberta Environment certification exam.

### Step 3: Write the Alberta Environment Exam
After completing your training course, you apply to write the provincial certification exam through Alberta Environment. Exams are written at approved locations across Alberta. The passing mark is **70%**.

### Step 4: Apply for Your Certificate
Once you pass the exam, you submit your application to Alberta Environment with proof of education, experience, and exam results. Your certificate is issued for a fixed term and must be renewed by earning Continuing Education Units (CEUs).

## What the Alberta Level 1 Exam Covers

The Level 1 exam tests foundational knowledge across all major areas of water or wastewater operations:

- **Water sources and quality:** surface water, groundwater, raw water characteristics
- **Treatment processes:** coagulation, filtration, disinfection, softening
- **Distribution systems:** pipe materials, pressure, cross-connection control, flushing
- **Regulations:** Alberta's *Water Act*, *EPEA*, and relevant standards
- **Safety:** WHMIS, confined space entry, chemical handling
- **Math:** flow calculations, chemical dosing, chlorine residuals, detention time

## AWWOA Resources

The AWWOA (awwoa.ca) is an excellent resource for Alberta operators. In addition to certification preparation courses, they offer:
- Annual training conferences
- Regional workshops and seminars
- A job board for Alberta water sector positions
- Networking with experienced operators across the province

## How Echelon Helps Alberta Operators

The core science tested on Alberta's certification exams — disinfection, hydraulics, treatment processes, and calculations — is the same as what Echelon covers in our practice question banks. Our **WPI course track** is designed for operators across Western Canada, including Alberta. Use Echelon's adaptive practice questions to master the calculation skills and process knowledge you need to pass your Level 1 exam and advance through the certification levels.`,
    author: "Echelon Institute",
    tags: "Alberta,AWWOA,water operator certification,Alberta Environment,Level 1",
    metaTitle: "Alberta Water Operator Certification: Levels 1–4 Complete Guide | Echelon",
    metaDescription:
      "Complete guide to Alberta water and wastewater operator certification. Learn about Levels 1–4, AWWOA training courses, Alberta Environment exams, and career pathways.",
    readingTimeMinutes: 8,
    published: 1,
    publishedAt: new Date("2026-06-02"),
  },
  {
    slug: "awwoa-level-1-exam-prep-alberta",
    title: "AWWOA Level 1 Exam Prep: Study Guide for Alberta Water Operators",
    excerpt:
      "How to prepare for the Alberta Level 1 water or wastewater operator certification exam — key topics, math formulas, study strategies, and AWWOA course recommendations.",
    content: `## Understanding the Alberta Level 1 Exam

The Alberta Level 1 certification exam is administered by Alberta Environment and Protected Areas. It is a multiple-choice exam covering the fundamental knowledge required to safely operate a small water treatment or wastewater treatment facility. The passing score is **70%**, and candidates who fail may re-write after a waiting period.

The exam is challenging because it tests applied knowledge — you need to understand *how* and *why* treatment processes work, not just recall definitions. Many candidates who have been working in the field for years still find the exam difficult because the questions require you to apply concepts in unfamiliar scenarios.

## Key Topics for the Level 1 Water Treatment Exam

### Source Water and Intake
- Differences between surface water and groundwater
- Seasonal water quality variations (turbidity, temperature, organic matter)
- Raw water sampling and monitoring

### Coagulation and Flocculation
- Purpose of coagulation: destabilizing colloidal particles
- Common coagulants: alum (aluminum sulfate), ferric sulfate, polyaluminum chloride (PAC)
- Jar test procedure and interpretation
- pH effects on coagulation efficiency

### Sedimentation
- Settling velocity and surface overflow rate
- Detention time calculation: HDT = Volume ÷ Flow rate
- Sludge blanket management

### Filtration
- Rapid sand filtration vs. slow sand filtration
- Filter media: sand, anthracite, garnet
- Backwash procedures and turbidity monitoring
- Filter-to-waste after backwash

### Disinfection
- Chlorine chemistry: free chlorine, combined chlorine, chloramines
- CT concept: CT = Concentration (mg/L) × Contact Time (minutes)
- Chlorine demand vs. chlorine residual
- UV disinfection: dose calculation, lamp maintenance

### Distribution
- Pressure requirements and pressure zones
- Cross-connection control and backflow prevention
- Flushing procedures and dead-end management
- Residual monitoring in the distribution system

## Essential Math Formulas

| Formula | Application |
|---------|-------------|
| Q = A × V | Flow rate from pipe area and velocity |
| Dose (kg/day) = C (mg/L) × Q (m³/day) ÷ 1000 | Chemical feed rate |
| CT = C × T | Disinfection credit |
| HDT = V ÷ Q | Hydraulic detention time |
| % Removal = (In − Out) ÷ In × 100 | Process efficiency |

## Study Plan: 8 Weeks to Exam Ready

**Weeks 1–2:** Complete the AWWOA Level I Certification Preparation Course (online or in-class). Take notes on every topic in the course outline.

**Weeks 3–4:** Focus on treatment processes. Draw process flow diagrams from memory. Understand each step: why it is done, what can go wrong, and how to fix it.

**Weeks 5–6:** Work through regulations and safety. Know the key provisions of Alberta's *Water Act* and *EPEA*. Understand WHMIS, confined space entry, and chemical handling requirements.

**Week 7:** Daily math practice. Do at least 10 calculation questions per day. Focus on chemical dosing, CT values, and flow rate conversions.

**Week 8:** Full practice exams. Review every wrong answer. Identify patterns in your mistakes.

## Tips From Experienced Alberta Operators

- **Read every question twice.** Many exam questions contain qualifiers like "most likely," "best describes," or "except." Missing these words is a common source of errors.
- **Show your work on calculations.** Even on multiple-choice exams, writing out your steps helps you catch unit conversion errors.
- **Know your regulations.** Alberta-specific regulatory questions appear on every exam. The AWWOA course covers these in detail.
- **Use Echelon for adaptive practice.** Our question engine identifies your weak areas and serves targeted questions to close the gaps before exam day.`,
    author: "Echelon Institute",
    tags: "Alberta,AWWOA Level 1,exam prep,water operator,study guide",
    metaTitle: "AWWOA Level 1 Exam Prep: Alberta Water Operator Study Guide | Echelon",
    metaDescription:
      "Study guide for the Alberta Level 1 water operator certification exam. Key topics, math formulas, 8-week study plan, and AWWOA course recommendations.",
    readingTimeMinutes: 9,
    published: 1,
    publishedAt: new Date("2026-06-05"),
  },

  // ─── SASKATCHEWAN ────────────────────────────────────────────────────────────
  {
    slug: "saskatchewan-water-operator-certification-guide",
    title: "Saskatchewan Water Operator Certification: OCB Exams and How to Get Certified",
    excerpt:
      "A complete guide to water and wastewater operator certification in Saskatchewan — covering the OCB certification process, exam levels, Saskatchewan Polytechnic training, and career pathways.",
    content: `## Who Certifies Operators in Saskatchewan?

In Saskatchewan, water and wastewater operator certification is managed by the **Saskatchewan Operator Certification Board (OCB)**. The OCB is an independent body responsible for issuing certificates, administering exams, and maintaining the registry of certified operators in the province. Certification is required under the *Safe Drinking Water Act* and the *Environmental Management and Protection Act*.

## Certification Levels in Saskatchewan

Saskatchewan uses a numbered level system for water and wastewater operators. The level required depends on the classification of the facility you operate.

| Level | Water Treatment | Water Distribution | Wastewater Treatment | Wastewater Collection |
|-------|----------------|-------------------|---------------------|----------------------|
| 1 | Small, simple | Small, simple | Small, simple | Small, simple |
| 2 | Medium | Medium | Medium | Medium |
| 3 | Large | Large | Large | Large |
| 4 | Large, complex | Large, complex | Large, complex | Large, complex |

Most new operators in Saskatchewan begin with a **Level 1** certification in their primary stream (water treatment, water distribution, wastewater treatment, or wastewater collection).

## How to Get Certified in Saskatchewan

### Step 1: Gain Operating Experience
Before writing a certification exam, you must accumulate hands-on operating experience at a certified facility. The amount of experience required varies by level — Level 1 typically requires six months to one year of relevant experience.

### Step 2: Complete an Approved Training Course
Saskatchewan Polytechnic offers water and wastewater operator training programs that prepare candidates for OCB certification exams. Suncrest College and other regional providers also offer approved training. These courses cover the technical content tested on OCB exams and are a requirement for certification at most levels.

### Step 3: Apply to Write the OCB Exam
Submit your application to the OCB (saskocb.ca) with proof of education, experience, and training course completion. Exams are written at approved testing locations across Saskatchewan.

### Step 4: Maintain Your Certification
Saskatchewan operators must renew their certification every two years by demonstrating continued education and professional development.

## What the Saskatchewan Level 1 Exam Covers

The OCB Level 1 exam tests fundamental knowledge of water or wastewater operations:

- **Water sources:** surface water, groundwater, aquifer characteristics
- **Treatment processes:** coagulation, flocculation, sedimentation, filtration, disinfection
- **Distribution:** pipe materials, pressure management, cross-connection control
- **Wastewater:** primary and secondary treatment, effluent quality
- **Regulations:** *Safe Drinking Water Act*, *Environmental Management and Protection Act*
- **Safety:** WHMIS, confined space, chemical handling
- **Math:** flow calculations, chemical dosing, CT values, detention time

## Training Resources in Saskatchewan

- **Saskatchewan Polytechnic** (saskpolytech.ca): Offers Water and Wastewater Operator training courses aligned with OCB exam content. Available part-time and online.
- **Suncrest College**: Offers CEU-credit water and wastewater training for operators in northern and rural Saskatchewan.
- **OCB Study Materials**: The OCB website provides candidate information packages and exam outlines to guide your study.

## Career Outlook for Saskatchewan Operators

Saskatchewan's water sector is growing, driven by infrastructure investment in municipalities, First Nations communities, and resource industry operations. Certified operators are in demand across the province, particularly in smaller communities that struggle to attract and retain qualified staff. A Level 1 certification is the entry point to a stable, well-paying career with clear advancement pathways to Level 2, 3, and 4.

## How Echelon Helps Saskatchewan Operators

The process science behind Saskatchewan's OCB exams is the same as what Echelon covers in our adaptive practice question banks. Disinfection chemistry, hydraulic calculations, treatment process knowledge — these are universal. Our **WPI course track** is designed for operators across Western Canada, including Saskatchewan. Use Echelon to build your technical foundation and practice the calculation skills that will carry you through your OCB exam.`,
    author: "Echelon Institute",
    tags: "Saskatchewan,OCB,water operator certification,Saskatchewan Polytechnic,exam prep",
    metaTitle: "Saskatchewan Water Operator Certification: OCB Exam Guide | Echelon",
    metaDescription:
      "Complete guide to Saskatchewan water operator certification through the OCB. Learn about certification levels, Saskatchewan Polytechnic training, and exam preparation.",
    readingTimeMinutes: 8,
    published: 1,
    publishedAt: new Date("2026-06-07"),
  },

  // ─── MANITOBA ────────────────────────────────────────────────────────────────
  {
    slug: "manitoba-water-operator-certification-guide",
    title: "Manitoba Water Operator Certification: ABC Exams and How to Get Certified",
    excerpt:
      "A complete guide to water and wastewater operator certification in Manitoba — covering the ABC certification system, exam categories, MWWA training, and career pathways for Manitoba operators.",
    content: `## Operator Certification in Manitoba

In Manitoba, water and wastewater operator certification is administered by **Manitoba Environment and Climate Change** under the *Environment Act* and the *Drinking Water Safety Act*. Manitoba uses the **ABC (Association of Boards of Certification)** examination system — the same standardized exams used in several other Canadian provinces and US states, making Manitoba certifications broadly recognized.

## Manitoba's Certification Categories

Manitoba has **18 different exam categories** covering the full range of water and wastewater operations:

| Category Group | Categories |
|----------------|-----------|
| Small Systems | Small Water, Small Wastewater |
| Water | Water Treatment (Levels 1–4), Water Distribution (Levels 1–4) |
| Wastewater | Wastewater Treatment (Levels 1–4), Wastewater Collection (Levels 1–4) |

The level required depends on the classification of the facility you operate. Most new operators begin with a **Level 1** or **Small Water/Small Wastewater** certification.

## How to Get Certified in Manitoba

### Step 1: Meet the Eligibility Requirements
Each certification level has minimum education and experience requirements. For Level 1, you typically need a high school diploma and some hands-on operating experience at a certified facility. Higher levels require progressively more experience.

### Step 2: Complete an Approved Training Course
Red River College Polytechnic (RRC) offers Manitoba water and wastewater training programs that prepare candidates for ABC certification exams. The MWWA (Manitoba Water & Wastewater Association) also offers training workshops and seminars. Completing an approved course is strongly recommended and may be required for certain levels.

### Step 3: Write the ABC Exam
Apply to write the ABC exam through Manitoba Environment and Climate Change. Exams are written at approved testing centres across Manitoba. The passing score is **70%**.

### Step 4: Maintain Your Certification
Manitoba operators must renew their certification every **five years** by earning a minimum of **6.0 Continuing Education Units (CEUs)**. The MWWA offers CEU-approved training events throughout the year.

## What the Manitoba Level 1 Water Treatment Exam Covers

The ABC Level 1 Water Treatment exam tests fundamental knowledge of water treatment operations:

- **Source water:** surface water and groundwater characteristics, seasonal variations
- **Treatment processes:** coagulation, flocculation, sedimentation, filtration, disinfection
- **Disinfection:** chlorination, CT values, contact time, residual monitoring, chloramines
- **Distribution:** pressure management, cross-connection control, water quality monitoring
- **Regulations:** *Drinking Water Safety Act*, Manitoba Regulation 330/88, Health Canada Guidelines
- **Safety:** WHMIS, confined space entry, chemical handling and storage
- **Math:** flow rate calculations, chemical dosing, CT values, detention time

## MWWA Training Resources

The **Manitoba Water & Wastewater Association (MWWA)** at mwwa.net is the professional association for Manitoba operators. They offer:
- Annual training conference
- Regional workshops and seminars
- CEU-approved courses for certification renewal
- Networking with experienced operators across Manitoba

**Red River College Polytechnic** (rrc.ca) offers the Manitoba Water and Wastewater Training program, which covers the foundational skills and knowledge operators need for ABC certification exams.

## Career Outlook in Manitoba

Manitoba's water sector offers stable, well-paying careers for certified operators. The province's commitment to clean water infrastructure — including investments in rural and remote communities — means demand for certified operators remains strong. A Level 1 certification opens the door to entry-level positions, while advancement to Level 2, 3, and 4 brings higher salaries and greater responsibility.

## How Echelon Helps Manitoba Operators

Because Manitoba uses the ABC examination system, the technical content tested on Manitoba exams is closely aligned with what Echelon covers in our practice question banks. Disinfection chemistry, hydraulic calculations, treatment process knowledge, and regulatory frameworks — these are the same core competencies tested across Canada.

Our **WPI course track** is designed for operators across Western Canada, including Manitoba. Use Echelon's adaptive practice questions to build your technical foundation, master the math, and prepare for your ABC certification exam.`,
    author: "Echelon Institute",
    tags: "Manitoba,ABC exam,water operator certification,MWWA,Red River College",
    metaTitle: "Manitoba Water Operator Certification: ABC Exam Guide | Echelon",
    metaDescription:
      "Complete guide to Manitoba water operator certification. Learn about ABC exam categories, MWWA training, RRC programs, and how to prepare for your Level 1 exam.",
    readingTimeMinutes: 8,
    published: 1,
    publishedAt: new Date("2026-06-09"),
  },

  // ─── CANADA-WIDE ─────────────────────────────────────────────────────────────
  {
    ...eocpArticleCorrections.find(post => post.slug === "canadian-water-operator-certification-by-province"),
    author: "Echelon Institute",
    tags: "Canada,water operator certification,Ontario,BC,Alberta,Saskatchewan,Manitoba,comparison",
    published: 1,
    publishedAt: new Date("2026-06-11"),
  },
];

// Insert all posts
let inserted = 0;
for (const post of posts) {
  await conn.execute(
    `INSERT IGNORE INTO blog_posts
      (slug, title, excerpt, content, author, tags, metaTitle, metaDescription, readingTimeMinutes, published, publishedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      post.published,
      post.publishedAt,
    ]
  );
  inserted++;
  console.log(`✓ ${post.slug}`);
}

console.log(`\nDone — ${inserted} province-specific posts seeded.`);
await conn.end();
