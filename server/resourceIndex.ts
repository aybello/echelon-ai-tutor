/**
 * Resource Index — Phase 3 of the Agentic AI Tutor
 *
 * Curated, topic-mapped study resources for Canadian water & wastewater operators.
 * The AI tutor uses getResourcesForProfile() to select the most relevant resources
 * based on a student's weak topics, exam type, and study history.
 *
 * Resource categories:
 *   - official    → Regulatory bodies, need-to-know criteria, certification guides
 *   - textbook    → AWWA, Sacramento State OWP, WEF reference manuals
 *   - video       → YouTube channels and specific videos
 *   - practice    → Practice exams, sample questions, study guides
 *   - community   → Reddit, forums, operator communities
 *   - tool        → Calculators, formula sheets, interactive tools
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: "official" | "textbook" | "video" | "practice" | "community" | "tool";
  /** Which broad topic areas this resource covers */
  topics: string[];
  /** Which exam families this is relevant to: "oit", "ontario", "wpi", "wqa", "all" */
  examFamilies: string[];
  /** Brief description the AI can include in its response */
  description: string;
  /** Priority 1-5 (1 = most important) for ranking when multiple resources match */
  priority: number;
}

// ─── Master Resource List ────────────────────────────────────────────────────

export const RESOURCES: Resource[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // OFFICIAL — Regulatory & Certification Bodies
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "owwco-exam-prep",
    title: "OWWCO — Preparing for Your Exam",
    url: "https://owwco.ca/preparing-for-your-exam/",
    type: "official",
    topics: ["general", "regulations", "certification"],
    examFamilies: ["oit", "ontario"],
    description: "Ontario's official exam preparation page with need-to-know documents, study material lists, and exam format details. Free access to all need-to-know guides.",
    priority: 1,
  },
  {
    id: "owwco-bookstore",
    title: "OWWCO Bookstore — Official Study Guides",
    url: "https://bookstore.owwco.ca/",
    type: "official",
    topics: ["general", "water treatment", "wastewater treatment", "distribution", "collection"],
    examFamilies: ["oit", "ontario"],
    description: "Official OWWCO study guides for OIT, Water Treatment, Wastewater Treatment, Water Distribution, and Water Quality Analyst exams.",
    priority: 1,
  },
  {
    id: "eocp-exam-prep",
    title: "EOCP — Preparing for Your Exam",
    url: "https://eocp.ca/certified-operators/preparing-for-your-exam/",
    type: "official",
    topics: ["general", "regulations", "certification"],
    examFamilies: ["wpi"],
    description: "BC's Environmental Operators Certification Program exam preparation guide. Study the Need-to-Know Criteria for your discipline and level.",
    priority: 1,
  },
  {
    id: "eocp-program-guide",
    title: "EOCP Program Guide",
    url: "https://eocp.ca/about-us/program-guide/",
    type: "official",
    topics: ["general", "regulations", "certification"],
    examFamilies: ["wpi"],
    description: "Complete guide to the EOCP certification program — levels, disciplines, requirements, and exam structure for BC operators.",
    priority: 2,
  },
  {
    id: "wpi-ww-ntk",
    title: "WPI Need-to-Know Criteria — Wastewater Treatment",
    url: "https://gowpi.org/services/abc-testing/standardized-exams/standardized-wastewater-treatment-operator-exams/",
    type: "official",
    topics: ["wastewater treatment", "regulations"],
    examFamilies: ["wpi"],
    description: "WPI's official need-to-know criteria for wastewater treatment operator exams. Includes formulas, references, and exam coverage by class level.",
    priority: 1,
  },
  {
    id: "wpi-water-ntk",
    title: "WPI Need-to-Know Criteria — Water Treatment",
    url: "https://gowpi.org/services/abc-testing/standardized-exams/",
    type: "official",
    topics: ["water treatment", "regulations"],
    examFamilies: ["wpi"],
    description: "WPI's official need-to-know criteria for water treatment operator exams. Outlines the content covered on each class level exam.",
    priority: 1,
  },
  {
    id: "bcwwa-courses",
    title: "BCWWA Course Catalogue",
    url: "https://bcwwa.org/site/education/catalogue",
    type: "official",
    topics: ["general", "water treatment", "wastewater treatment", "distribution", "collection"],
    examFamilies: ["wpi"],
    description: "BC Water & Waste Association's training catalogue — courses aligned with EOCP operator certification requirements.",
    priority: 2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXTBOOKS & REFERENCE MANUALS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "awwa-wt-handbook",
    title: "AWWA Water Treatment Operator Training Handbook (3rd Ed.)",
    url: "https://store.awwa.org/Water-Treatment-Operator-Training-Handbook-Third-Edition",
    type: "textbook",
    topics: ["water treatment", "disinfection", "filtration", "coagulation", "sedimentation", "water quality"],
    examFamilies: ["all"],
    description: "The industry-standard reference for water treatment operators. Covers source water, treatment processes, disinfection, filtration, and plant operations. Essential for all certification levels.",
    priority: 1,
  },
  {
    id: "awwa-wd-handbook",
    title: "AWWA Water Distribution Operator Training Handbook",
    url: "https://www.awwa.org/books/",
    type: "textbook",
    topics: ["distribution", "hydraulics", "water quality", "system maintenance"],
    examFamilies: ["all"],
    description: "Comprehensive reference for water distribution system operators. Covers hydraulics, pipe materials, valves, pumps, storage, and water quality in distribution.",
    priority: 1,
  },
  {
    id: "owp-sac-state",
    title: "Sacramento State Office of Water Programs — Operator Training",
    url: "https://www.owp.csus.edu/operator-training/",
    type: "textbook",
    topics: ["water treatment", "wastewater treatment", "distribution", "collection"],
    examFamilies: ["all"],
    description: "Industry-leading self-paced operator training programs from Sacramento State. Widely used across North America for certification preparation.",
    priority: 2,
  },
  {
    id: "owp-ww-courses",
    title: "Sacramento State OWP — Wastewater Courses",
    url: "https://www.owp.csus.edu/courses/wastewater.php",
    type: "textbook",
    topics: ["wastewater treatment", "collection", "biosolids", "nutrient removal"],
    examFamilies: ["all"],
    description: "Self-paced wastewater treatment courses covering primary/secondary treatment, solids handling, advanced processes, and collection systems.",
    priority: 2,
  },
  {
    id: "wef-ww-fundamentals",
    title: "WEF — Wastewater Treatment Fundamentals",
    url: "http://www.wef.org/publications/publications/books/wastewater-treatment-fundamentals/shortcourses/",
    type: "textbook",
    topics: ["wastewater treatment", "biological treatment", "nutrient removal", "solids handling"],
    examFamilies: ["all"],
    description: "Water Environment Federation's foundational wastewater treatment course. Covers wastewater characteristics, preliminary treatment, biological processes, and solids handling.",
    priority: 2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VIDEO — YouTube Channels & Specific Videos
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "yt-ww-courses",
    title: "Water and Wastewater Courses (YouTube Channel)",
    url: "https://www.youtube.com/c/WaterandWastewaterCourses",
    type: "video",
    topics: ["water treatment", "wastewater treatment", "math & calculations", "disinfection"],
    examFamilies: ["all"],
    description: "Popular YouTube channel with practice problems, exam walkthroughs, and concept explanations for water and wastewater operators. Over 100K views on certification exam prep videos.",
    priority: 1,
  },
  {
    id: "yt-water-operator-training",
    title: "Water Operator Training Resources (YouTube Channel)",
    url: "https://www.youtube.com/@wateroperatortrainingresou1356/videos",
    type: "video",
    topics: ["water treatment", "distribution", "math & calculations", "water quality"],
    examFamilies: ["all"],
    description: "Dedicated channel providing instruction and information for water and wastewater operators seeking higher certification levels.",
    priority: 2,
  },
  {
    id: "yt-wt-practice-test",
    title: "Water Treatment Practice Test — Exam Questions",
    url: "https://www.youtube.com/watch?v=L7VvdVeL1E4",
    type: "video",
    topics: ["water treatment", "disinfection", "filtration", "water quality"],
    examFamilies: ["all"],
    description: "Practice test video with water treatment exam questions and detailed explanations. Great for testing your knowledge before the real exam.",
    priority: 3,
  },
  {
    id: "yt-wd-practice",
    title: "Water Distribution Operator Certification Exam Practice",
    url: "https://www.youtube.com/watch?v=LC5tOJU_Hr8",
    type: "video",
    topics: ["distribution", "hydraulics", "math & calculations"],
    examFamilies: ["all"],
    description: "Practice problems for water distribution operator certification exams. Covers the types of questions you'll see on the actual exam.",
    priority: 3,
  },
  {
    id: "yt-ww-exam-study",
    title: "Wastewater Operator Exam Study Guide — 600 Questions",
    url: "https://www.youtube.com/watch?v=pxGH5DMbT2w",
    type: "video",
    topics: ["wastewater treatment", "collection", "biosolids", "lab analysis"],
    examFamilies: ["all"],
    description: "Comprehensive wastewater operator exam study guide with 600 unique questions and detailed solutions.",
    priority: 2,
  },
  {
    id: "yt-efcn-ww-overview",
    title: "EFC Network — Wastewater Treatment Overview",
    url: "https://www.youtube.com/watch?v=DM2otzMnRr8",
    type: "video",
    topics: ["wastewater treatment", "biological treatment", "solids handling"],
    examFamilies: ["all"],
    description: "Webinar designed to help small wastewater system operators understand treatment processes and pass certification exams.",
    priority: 3,
  },
  {
    id: "yt-efcn-study-tips",
    title: "EFC Network — Study Tips and Test Preparation",
    url: "https://www.youtube.com/watch?v=Hu9ZLgAU9sQ",
    type: "video",
    topics: ["general", "certification"],
    examFamilies: ["all"],
    description: "Webinar on study strategies and test-taking techniques specifically for wastewater operator certification exams.",
    priority: 3,
  },
  {
    id: "yt-opcert-water-s1",
    title: "Op Cert Water Session 1 — Program Overview & Study Tips",
    url: "https://www.youtube.com/watch?v=RVCTOq2L5KY",
    type: "video",
    topics: ["water treatment", "general", "certification"],
    examFamilies: ["all"],
    description: "First session of a water operator certification prep series. Covers program overview, study tips, and test preparation strategies.",
    priority: 3,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRACTICE — Sample Exams & Study Guides
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "waternuggets-practice",
    title: "WaterNuggets — Water Operator Practice Tests",
    url: "https://waternuggets.com/water-operator-practice-tests/",
    type: "practice",
    topics: ["water treatment", "distribution", "math & calculations"],
    examFamilies: ["all"],
    description: "Free practice tests for water distribution and water treatment operator exams. Good supplementary resource for exam preparation.",
    priority: 2,
  },
  {
    id: "wcwc-study-guides",
    title: "WCWC — Study Guides & Math Practice Problems",
    url: "https://wcwc.ca/dwrl/math-practice-problems-and-study-guides-for-examinations/",
    type: "practice",
    topics: ["math & calculations", "water treatment", "water quality"],
    examFamilies: ["oit", "ontario"],
    description: "Walkerton Clean Water Centre's study guides and math practice problems. Recommended study materials available through OWWCO.",
    priority: 2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNITY — Forums & Operator Networks
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "reddit-wastewater",
    title: "r/Wastewater — Reddit Community",
    url: "https://www.reddit.com/r/Wastewater/",
    type: "community",
    topics: ["wastewater treatment", "collection", "general", "certification"],
    examFamilies: ["all"],
    description: "Active Reddit community for wastewater operators. Great for asking questions, sharing study tips, and connecting with experienced operators.",
    priority: 3,
  },
  {
    id: "reddit-watertreatment",
    title: "r/WaterTreatment — Reddit Community",
    url: "https://www.reddit.com/r/WaterTreatment/",
    type: "community",
    topics: ["water treatment", "distribution", "water quality", "general"],
    examFamilies: ["all"],
    description: "Reddit community for water treatment professionals. Discussions on treatment processes, certification, career advice, and industry news.",
    priority: 3,
  },
  {
    id: "wateroperator-org",
    title: "WaterOperator.org — Training & Resources",
    url: "https://wateroperator.org/blog?Category=training%2Fceus",
    type: "community",
    topics: ["general", "certification", "water treatment", "distribution"],
    examFamilies: ["all"],
    description: "Free training resources, webinars, and study materials for small system water operators. Regularly updated with new content.",
    priority: 2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOLS — Calculators, Formula Sheets
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "epa-drinking-water",
    title: "US EPA — Drinking Water Training Resources",
    url: "https://www.epa.gov/dwreginfo/drinking-water-training",
    type: "tool",
    topics: ["water treatment", "regulations", "water quality", "disinfection"],
    examFamilies: ["all"],
    description: "EPA's drinking water training resources including webinars, technical guidance documents, and regulatory information.",
    priority: 3,
  },
];

// ─── Topic Normalization ─────────────────────────────────────────────────────

/**
 * Maps module names from the question bank to broad topic categories
 * used in the resource index. This handles the many-to-few mapping
 * between specific exam modules and resource topics.
 */
const TOPIC_ALIASES: Record<string, string[]> = {
  // OIT / Ontario modules
  "Disinfection": ["disinfection", "water treatment"],
  "Hydraulics": ["hydraulics", "distribution", "math & calculations"],
  "Regulations": ["regulations", "certification", "general"],
  "Math & Calculations": ["math & calculations"],
  "Health & Safety": ["general", "regulations"],
  "Wastewater": ["wastewater treatment"],
  "Water Quality": ["water quality", "water treatment"],
  "Distribution": ["distribution", "hydraulics"],
  "Collection": ["collection", "wastewater treatment"],

  // WPI Water Treatment modules
  "Treatment Process": ["water treatment", "disinfection", "filtration", "coagulation", "sedimentation"],
  "Equipment O&M": ["water treatment", "distribution", "general"],
  "Laboratory Analysis": ["water quality", "lab analysis"],
  "Lab Analysis": ["water quality", "lab analysis"],
  "Source Water": ["water quality", "water treatment"],
  "Safety & Admin": ["general", "regulations"],

  // WPI Water Treatment advanced
  "Advanced Treatment Processes": ["water treatment", "filtration", "disinfection"],
  "System Design & Engineering": ["water treatment", "hydraulics", "distribution"],
  "Advanced Laboratory & Monitoring": ["water quality", "lab analysis"],
  "Source Water & Environmental": ["water quality", "water treatment"],
  "Management, Regulations & Safety": ["regulations", "general"],
  "Advanced Treatment & Disinfection": ["water treatment", "disinfection"],
  "Filtration & Membrane Systems": ["water treatment", "filtration"],
  "Process Control & Optimization": ["water treatment", "general"],
  "Distribution System Management": ["distribution", "hydraulics"],
  "Regulatory Compliance & QMS": ["regulations", "general"],
  "Advanced Process Control": ["water treatment", "general"],
  "Advanced Water Quality": ["water quality", "water treatment"],
  "Emergency Response & Contingency Planning": ["general", "regulations"],
  "Plant Management & Leadership": ["general", "regulations"],
  "Regulatory Compliance & Reporting": ["regulations", "general"],
  "Source Water Protection": ["water quality", "water treatment"],

  // WPI Wastewater modules
  "Wastewater Collection Systems": ["collection", "wastewater treatment"],
  "Primary & Secondary Treatment": ["wastewater treatment", "biological treatment"],
  "Solids Handling & Biosolids": ["wastewater treatment", "biosolids", "solids handling"],
  "Laboratory & Monitoring": ["water quality", "lab analysis"],
  "Safety & Regulations": ["regulations", "general"],

  // WPI Wastewater advanced
  "Secondary Treatment": ["wastewater treatment", "biological treatment"],
  "Nutrient Removal": ["wastewater treatment", "nutrient removal"],
  "Biosolids Management": ["wastewater treatment", "biosolids", "solids handling"],
  "Advanced Treatment": ["wastewater treatment"],
  "Process Control & Safety": ["wastewater treatment", "regulations"],
  "Advanced Biological Treatment": ["wastewater treatment", "biological treatment"],
  "Biological Nutrient Removal": ["wastewater treatment", "nutrient removal"],
  "Membrane Bioreactors & Advanced Processes": ["wastewater treatment", "filtration"],
  "Industrial Pretreatment & Toxicity": ["wastewater treatment", "regulations"],
  "Advanced Biosolids Management": ["wastewater treatment", "biosolids", "solids handling"],
  "Advanced Process Control & Troubleshooting": ["wastewater treatment", "general"],
  "Health, Safety & Environmental Management": ["general", "regulations"],
  "Advanced Nutrient Removal & Resource Recovery": ["wastewater treatment", "nutrient removal"],
  "Emerging Technologies & Innovation": ["wastewater treatment", "water treatment"],
  "Plant Management": ["general", "regulations"],
  "Asset Management & Leadership": ["general", "regulations"],
  "Regulatory Compliance, Reporting & Environmental Management": ["regulations", "general"],
  "Emergency Response & Resilience Planning": ["general", "regulations"],
  "Health, Safety & Environmental Stewardship": ["general", "regulations"],

  // WPI Distribution modules
  "Distribution System Operations": ["distribution", "hydraulics"],
  "Water Quality in Distribution": ["distribution", "water quality"],
  "System Maintenance & Repair": ["distribution", "general"],
  "Pumps & Hydraulics": ["distribution", "hydraulics", "math & calculations"],
  "Regulatory & Safety": ["regulations", "general"],

  // WPI Collection modules
  "Collection System Operations": ["collection", "wastewater treatment"],
  "Collection System Maintenance": ["collection", "general"],
  "Lift Stations & Pumping": ["collection", "hydraulics", "math & calculations"],
  "Infiltration & Inflow": ["collection", "wastewater treatment"],
  "Safety & Environmental": ["general", "regulations"],

  // WQA modules
  "Water Quality Analysis": ["water quality", "lab analysis"],
  "Sampling & Monitoring": ["water quality", "lab analysis"],
  "Chemistry & Microbiology": ["water quality", "lab analysis"],
  "Instrumentation": ["water quality", "lab analysis", "general"],
  "Quality Assurance": ["water quality", "regulations"],
};

/**
 * Normalize a module name from the question bank into broad topic categories.
 * Falls back to a lowercase version of the module name if no alias exists.
 */
function normalizeTopics(moduleName: string): string[] {
  return TOPIC_ALIASES[moduleName] ?? [moduleName.toLowerCase()];
}

// ─── Exam Family Mapping ─────────────────────────────────────────────────────

/**
 * Maps an examType string to an exam family for resource filtering.
 */
function getExamFamily(examType: string): string {
  if (examType === "oit" || examType === "oit-ww") return "oit";
  if (examType === "wqa") return "wqa";
  if (examType.startsWith("wpi-")) return "wpi";
  // class1-water, class2-ww, etc. → Ontario
  if (examType.startsWith("class")) return "ontario";
  return "all";
}

// ─── Smart Resource Selection ────────────────────────────────────────────────

export interface StudentResourceProfile {
  examType: string;
  weakTopics: string[];   // module names from student_profiles
  strongTopics: string[]; // module names from student_profiles
}

export interface RecommendedResource extends Resource {
  /** Why this resource was selected */
  reason: string;
  /** Relevance score (higher = more relevant) */
  relevance: number;
}

/**
 * Select the most relevant resources for a student based on their profile.
 *
 * Strategy:
 * 1. Filter resources by exam family (+ "all" resources)
 * 2. Score each resource by how many of the student's weak topics it covers
 * 3. Boost official and textbook resources (they're more authoritative)
 * 4. Return top N resources, sorted by relevance
 */
export function getResourcesForProfile(
  profile: StudentResourceProfile,
  maxResults: number = 5
): RecommendedResource[] {
  const family = getExamFamily(profile.examType);

  // Expand weak topics into broad categories
  const weakCategories = new Set<string>();
  for (const topic of profile.weakTopics) {
    for (const cat of normalizeTopics(topic)) {
      weakCategories.add(cat);
    }
  }

  // If no weak topics, use general categories
  if (weakCategories.size === 0) {
    weakCategories.add("general");
    weakCategories.add("certification");
  }

  const scored: RecommendedResource[] = [];

  for (const resource of RESOURCES) {
    // Filter by exam family
    if (!resource.examFamilies.includes(family) && !resource.examFamilies.includes("all")) {
      continue;
    }

    // Score by topic overlap with weak areas
    let topicOverlap = 0;
    const matchedTopics: string[] = [];
    for (const rTopic of resource.topics) {
      if (weakCategories.has(rTopic)) {
        topicOverlap++;
        matchedTopics.push(rTopic);
      }
    }

    // Skip resources with zero topic overlap (unless general/certification)
    if (topicOverlap === 0 && !resource.topics.includes("general")) {
      continue;
    }

    // Calculate relevance score
    let relevance = topicOverlap * 10;

    // Boost by resource type (official > textbook > video > practice > community > tool)
    const typeBoost: Record<string, number> = {
      official: 8,
      textbook: 6,
      video: 4,
      practice: 5,
      community: 2,
      tool: 3,
    };
    relevance += typeBoost[resource.type] ?? 0;

    // Boost by priority (lower priority number = higher boost)
    relevance += (6 - resource.priority) * 2;

    // Build reason string
    const reason = matchedTopics.length > 0
      ? `Covers your weak area${matchedTopics.length > 1 ? "s" : ""}: ${matchedTopics.join(", ")}`
      : "General study resource for your certification level";

    scored.push({ ...resource, reason, relevance });
  }

  // Sort by relevance (descending), then priority (ascending)
  scored.sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    return a.priority - b.priority;
  });

  return scored.slice(0, maxResults);
}

/**
 * Format resources into a string block for injection into the AI tutor system prompt.
 */
export function formatResourcesForPrompt(resources: RecommendedResource[]): string {
  if (resources.length === 0) return "";

  const lines = resources.map((r, i) => {
    return `${i + 1}. **${r.title}** (${r.type})\n   ${r.description}\n   Link: ${r.url}\n   Why: ${r.reason}`;
  });

  return `\n── RECOMMENDED RESOURCES ──\nBased on this student's weak areas, here are the most relevant study resources you can recommend:\n\n${lines.join("\n\n")}\n\nWhen the student asks for help or is struggling with a topic, naturally weave in 1-2 relevant resources from this list. Don't dump all resources at once — mention them contextually when they're most helpful.`;
}
