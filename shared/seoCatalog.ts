import { getAllCourses, type CourseEntry } from "./courseRegistry";
import { INDIVIDUAL_PRODUCTS } from "./products";

export const SITE_URL = "https://echeloninstitute.ca";

export interface RegionSeoPage {
  slug: string;
  path: string;
  name: string;
  shortName: string;
  authorityName: string;
  authorityUrl: string;
  title: string;
  description: string;
  heading: string;
  summary: string;
  frameworkNote: string;
  courseFamily: CourseEntry["examFamily"];
}

export const REGION_SEO_PAGES: RegionSeoPage[] = [
  {
    slug: "ontario",
    path: "/canada/ontario",
    name: "Ontario",
    shortName: "Ontario",
    authorityName: "Ontario Water Wastewater Certification Office (OWWCO)",
    authorityUrl: "https://owwco.ca/preparing-for-your-exam/",
    title: "Ontario Water & Wastewater Operator Exam Prep",
    description:
      "Prepare for Ontario OIT and Class 1–4 water and wastewater operator exams with course-specific practice, mock exams, flashcards, process guides, and an AI tutor.",
    heading: "Ontario Water and Wastewater Operator Exam Prep",
    summary:
      "Echelon provides Ontario-specific preparation for OIT, Water Quality Analyst, Water Treatment, Water Distribution, Wastewater Treatment, and Wastewater Collection candidates.",
    frameworkNote:
      "Ontario candidates should use the current OWWCO exam information and need-to-know material as the authority for eligibility, registration, permitted references, and exam requirements.",
    courseFamily: "ontario",
  },
  {
    slug: "british-columbia",
    path: "/canada/british-columbia",
    name: "British Columbia",
    shortName: "BC",
    authorityName: "Environmental Operators Certification Program (EOCP)",
    authorityUrl:
      "https://eocp.ca/certified-operators/preparing-for-your-exam/",
    title: "BC EOCP Water & Wastewater Operator Exam Prep",
    description:
      "WPI-aligned water treatment, wastewater treatment, distribution, and collection exam practice for British Columbia operators preparing through EOCP.",
    heading: "British Columbia EOCP Operator Exam Prep",
    summary:
      "Echelon's WPI-aligned courses support British Columbia operators studying across water treatment, wastewater treatment, water distribution, and wastewater collection.",
    frameworkNote:
      "EOCP controls British Columbia certification and examination requirements. Confirm your facility type, classification, exam syllabus, and eligibility with EOCP before selecting a course.",
    courseFamily: "western",
  },
  {
    slug: "alberta",
    path: "/canada/alberta",
    name: "Alberta",
    shortName: "Alberta",
    authorityName: "Government of Alberta operator certification program",
    authorityUrl:
      "https://www.alberta.ca/water-and-wastewater-operator-certification",
    title: "Alberta Water & Wastewater Operator Exam Prep",
    description:
      "WPI-aligned practice for Alberta water treatment, wastewater treatment, distribution, and collection operator certification exams, Class I–IV.",
    heading: "Alberta Water and Wastewater Operator Exam Prep",
    summary:
      "Echelon provides WPI-aligned practice courses for Alberta operators studying water treatment, wastewater treatment, water distribution, and wastewater collection.",
    frameworkNote:
      "The Government of Alberta controls operator certification and examination requirements. Confirm the current certification pathway and exam blueprint with the province before purchasing preparation material.",
    courseFamily: "western",
  },
  {
    slug: "saskatchewan",
    path: "/canada/saskatchewan",
    name: "Saskatchewan",
    shortName: "Saskatchewan",
    authorityName: "Water Security Agency",
    authorityUrl: "https://www.wsask.ca/",
    title: "Saskatchewan Water & Wastewater Operator Exam Prep",
    description:
      "WPI-aligned water and wastewater operator exam practice for Saskatchewan treatment, distribution, and collection candidates, Class I–IV.",
    heading: "Saskatchewan Water and Wastewater Operator Exam Prep",
    summary:
      "Echelon provides WPI-aligned practice for Saskatchewan operators across treatment, distribution, and collection certification streams.",
    frameworkNote:
      "The Water Security Agency controls Saskatchewan operator certification requirements. Confirm the current exam, classification, and eligibility requirements with the agency before choosing a course.",
    courseFamily: "western",
  },
  {
    slug: "manitoba",
    path: "/canada/manitoba",
    name: "Manitoba",
    shortName: "Manitoba",
    authorityName: "Government of Manitoba operator certification program",
    authorityUrl: "https://www.gov.mb.ca/sd/",
    title: "Manitoba Water & Wastewater Operator Exam Prep",
    description:
      "WPI-aligned water treatment, wastewater treatment, distribution, and collection operator exam practice for Manitoba candidates, Class I–IV.",
    heading: "Manitoba Water and Wastewater Operator Exam Prep",
    summary:
      "Echelon provides WPI-aligned preparation for Manitoba water and wastewater operators studying treatment, distribution, and collection topics.",
    frameworkNote:
      "The Government of Manitoba controls operator certification requirements. Confirm the current exam, classification, and eligibility rules with the province before selecting a preparation course.",
    courseFamily: "western",
  },
];

const PRODUCT_BY_KEY = new Map(
  INDIVIDUAL_PRODUCTS.map(product => [product.key, product])
);

const TRACK_LABELS: Record<CourseEntry["track"], string> = {
  "water-treatment": "Water Treatment",
  "wastewater-treatment": "Wastewater Treatment",
  "water-distribution": "Water Distribution",
  "wastewater-collection": "Wastewater Collection",
  "water-quality": "Water Quality Analyst",
  oit: "Operator-in-Training",
};

export interface CourseSeoPage {
  courseKey: string;
  path: string;
  displayName: string;
  title: string;
  description: string;
  heading: string;
  jurisdictionLabel: string;
  trackLabel: string;
  levelLabel: string;
  priceCAD: number;
  quizPath: string;
  mockExamPath: string;
  flashcardPath: string | null;
  formulaPath: string | null;
  regionPath: string;
  regionLabel: string;
}

function levelLabel(course: CourseEntry): string {
  if (course.classLevel === 0) return "Entry level";
  return course.examFamily === "western"
    ? `Class ${["", "I", "II", "III", "IV"][course.classLevel]}`
    : `Class ${course.classLevel}`;
}

export const COURSE_SEO_PAGES: CourseSeoPage[] = getAllCourses()
  .filter(course => course.isActive && PRODUCT_BY_KEY.has(course.productKey))
  .map(course => {
    const product = PRODUCT_BY_KEY.get(course.productKey)!;
    const isOntario = course.examFamily === "ontario";
    const jurisdictionLabel = isOntario
      ? "Ontario"
      : "WPI-aligned jurisdictions";
    const trackLabel = TRACK_LABELS[course.track];
    const level = levelLabel(course);
    return {
      courseKey: course.courseKey,
      path: `/courses/${course.courseKey}`,
      displayName: course.displayName,
      title: `${course.displayName} Exam Prep & Practice Questions`,
      description: `Prepare for ${course.displayName} with a free 15-question preview, course-specific practice, a timed mock exam, flashcards, process guides, and AI-supported explanations.`,
      heading: `${course.displayName} Exam Prep`,
      jurisdictionLabel,
      trackLabel,
      levelLabel: level,
      priceCAD: product.priceCAD,
      quizPath: course.quizPath,
      mockExamPath: course.mockExamPath,
      flashcardPath: course.flashcardPath,
      formulaPath: course.formulaPath,
      regionPath: isOntario ? "/canada/ontario" : "/wpi",
      regionLabel: isOntario ? "Ontario exam prep" : "WPI exam prep",
    };
  });

export function getRegionSeoPage(slug: string): RegionSeoPage | undefined {
  return REGION_SEO_PAGES.find(page => page.slug === slug);
}

export function getCourseSeoPage(courseKey: string): CourseSeoPage | undefined {
  return COURSE_SEO_PAGES.find(page => page.courseKey === courseKey);
}

export function getCoursesForRegion(page: RegionSeoPage): CourseSeoPage[] {
  return COURSE_SEO_PAGES.filter(course =>
    page.courseFamily === "ontario"
      ? course.jurisdictionLabel === "Ontario"
      : course.jurisdictionLabel === "WPI-aligned jurisdictions"
  );
}

export function formatCad(cents: number): string {
  return `CA$${(cents / 100).toFixed(0)}`;
}
