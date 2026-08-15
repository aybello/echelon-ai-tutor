import { Link, Redirect, useRoute } from "wouter";
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ExternalLink,
  MapPin,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData } from "@/hooks/useStructuredData";
import {
  SITE_URL,
  formatCad,
  getCourseSeoPage,
  getCoursesForRegion,
  getRegionSeoPage,
  type CourseSeoPage,
  type RegionSeoPage,
} from "@shared/seoCatalog";

function graph(nodes: Record<string, unknown>[]) {
  return [{ "@context": "https://schema.org", "@graph": nodes }];
}

function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 text-sm text-slate-500"
    >
      {items.map((item, index) => (
        <span
          key={`${item.label}-${index}`}
          className="flex items-center gap-2"
        >
          {index > 0 && <span aria-hidden="true">/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="font-medium text-blue-700 hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function CourseCard({ course }: { course: CourseSeoPage }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            {course.trackLabel}
          </p>
          <h3 className="mt-2 text-lg font-bold text-slate-950">
            {course.displayName}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {course.levelLabel}
        </span>
      </div>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
        Practice, mock exam, explanations, progress tracking, and a free
        15-question preview.
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="font-bold text-slate-900">
          {formatCad(course.priceCAD)} / 12 months
        </span>
        <Link
          href={course.path}
          className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline"
        >
          Course details <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

function RegionPage({ page }: { page: RegionSeoPage }) {
  const courses = getCoursesForRegion(page);
  usePageMeta({
    title: page.title,
    description: page.description,
    path: page.path,
  });
  useStructuredData(
    graph([
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}${page.path}#page`,
        name: page.heading,
        description: page.description,
        url: `${SITE_URL}${page.path}`,
        inLanguage: "en-CA",
        about: [
          "water operator certification",
          "wastewater operator certification",
          page.name,
        ],
        isPartOf: {
          "@type": "WebSite",
          name: "Echelon Institute",
          url: SITE_URL,
        },
      },
      {
        "@type": "ItemList",
        name: `${page.name} operator exam-prep courses`,
        numberOfItems: courses.length,
        itemListElement: courses.map((course, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}${course.path}`,
          name: course.displayName,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: page.name,
            item: `${SITE_URL}${page.path}`,
          },
        ],
      },
    ])
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav currentPath={page.path} variant="marketing" />
      <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-teal-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Canada" },
              { label: page.name },
            ]}
          />
          <p className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
            <MapPin size={16} /> {page.name} certification preparation
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            {page.heading}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
            {page.summary}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#courses"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-slate-950"
            >
              Browse courses <ArrowRight size={17} />
            </a>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 font-bold text-white"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 lg:grid-cols-[1.5fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
            Certification context
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            Study with the official requirements beside you
          </h2>
          <p className="mt-4 leading-7 text-slate-600">{page.frameworkNote}</p>
          <a
            href={page.authorityUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 font-semibold text-blue-700 hover:underline"
          >
            Visit {page.authorityName} <ExternalLink size={16} />
          </a>
        </article>
        <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-7">
          <h2 className="text-lg font-bold text-amber-950">
            Independent preparation provider
          </h2>
          <p className="mt-3 text-sm leading-6 text-amber-900">
            Echelon Institute is independent and is not affiliated with or
            endorsed by OWWCO, MOECP, EOCP, WPI, or any provincial certifying
            authority. Requirements can change; the authority's current
            documents control.
          </p>
        </aside>
      </section>

      <section id="courses" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-700">
            Course catalogue
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            Choose the stream and level on your exam
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            Every course has its own public overview and a separate practice
            workspace. The overview can be indexed; your practice activity and
            account pages remain private.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map(course => (
            <CourseCard key={course.courseKey} course={course} />
          ))}
        </div>
      </section>
    </main>
  );
}

function CoursePage({ course }: { course: CourseSeoPage }) {
  usePageMeta({
    title: course.title,
    description: course.description,
    path: course.path,
  });
  useStructuredData(
    graph([
      {
        "@type": "Course",
        "@id": `${SITE_URL}${course.path}#course`,
        name: course.displayName,
        description: course.description,
        url: `${SITE_URL}${course.path}`,
        inLanguage: "en-CA",
        educationalLevel: course.levelLabel,
        about: [
          course.trackLabel,
          course.jurisdictionLabel,
          "operator certification exam preparation",
        ],
        provider: {
          "@type": "EducationalOrganization",
          name: "Echelon Institute",
          url: SITE_URL,
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
        },
        offers: {
          "@type": "Offer",
          price: (course.priceCAD / 100).toFixed(0),
          priceCurrency: "CAD",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/pricing`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Courses",
            item: `${SITE_URL}/#courses`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: course.displayName,
            item: `${SITE_URL}${course.path}`,
          },
        ],
      },
    ])
  );

  const tools = [
    "A free 15-question preview with no account or credit card",
    "Course-specific practice with explanations and weak-topic tracking",
    "A timed mock exam for a realistic readiness check",
    course.flashcardPath
      ? "Digital flashcards for recall and review"
      : "Process guides and formula support",
    "AI-supported explanations for difficult concepts and calculations",
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav currentPath={course.path} variant="marketing" />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: course.regionLabel, href: course.regionPath },
              { label: course.displayName },
            ]}
          />
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1.45fr_0.75fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                {[
                  course.jurisdictionLabel,
                  course.trackLabel,
                  course.levelLabel,
                ].map(label => (
                  <span
                    key={label}
                    className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {course.heading}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                {course.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={course.quizPath}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white shadow-sm hover:bg-blue-800"
                >
                  Start the free preview <ArrowRight size={17} />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-900"
                >
                  View Exam Pass pricing
                </Link>
              </div>
            </div>
            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Individual Exam Pass
              </p>
              <p className="mt-2 text-3xl font-black">
                {formatCad(course.priceCAD)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                One course · 12 months · one-time payment
              </p>
              <div className="mt-5 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-600">
                Need licences for a utility or municipality?{" "}
                <Link
                  href="/teams"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  Explore Echelon Teams
                </Link>
                .
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr]">
        <article>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-700">
            Included study tools
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            Prepare with one connected study workflow
          </h2>
          <ul className="mt-7 space-y-4">
            {tools.map(tool => (
              <li
                key={tool}
                className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-teal-700"
                  size={20}
                />
                <span className="leading-6 text-slate-700">{tool}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl bg-slate-950 p-7 text-white">
          <BookOpenCheck size={30} className="text-teal-300" />
          <h2 className="mt-5 text-2xl font-bold">
            Use the exam blueprint as the source of truth
          </h2>
          <p className="mt-4 leading-7 text-slate-300">
            Echelon is an independent preparation platform. It does not issue
            certificates and cannot guarantee an exam result. Confirm your
            eligibility, exam version, permitted references, and current
            requirements with your certifying authority.
          </p>
          <Link
            href={course.regionPath}
            className="mt-6 inline-flex items-center gap-2 font-bold text-teal-300 hover:underline"
          >
            <Building2 size={17} /> Review jurisdiction guidance
          </Link>
        </article>
      </section>
    </main>
  );
}

export default function SeoLandingPage() {
  const [courseMatch, courseParams] = useRoute("/courses/:courseKey");
  const [regionMatch, regionParams] = useRoute("/canada/:regionSlug");

  if (courseMatch) {
    const course = getCourseSeoPage(courseParams.courseKey);
    return course ? <CoursePage course={course} /> : <Redirect to="/404" />;
  }
  if (regionMatch) {
    const region = getRegionSeoPage(regionParams.regionSlug);
    return region ? <RegionPage page={region} /> : <Redirect to="/404" />;
  }
  return <Redirect to="/404" />;
}
