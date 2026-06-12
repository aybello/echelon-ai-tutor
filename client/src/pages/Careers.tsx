import { useState } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  DollarSign,
  Calendar,
  Globe,
} from "lucide-react";

const PROVINCES = [
  { value: null, label: "All Provinces" },
  { value: "ON", label: "Ontario" },
  { value: "BC", label: "British Columbia" },
  { value: "AB", label: "Alberta" },
  { value: "SK", label: "Saskatchewan" },
  { value: "MB", label: "Manitoba" },
  { value: "other", label: "Other" },
] as const;

type Province = "ON" | "BC" | "AB" | "SK" | "MB" | "other" | null;

type Job = {
  id: number;
  title: string;
  company: string | null;
  location: string | null;
  province: string | null;
  salary: string | null;
  jobType: string | null;
  sourceUrl: string;
  sourceName: string | null;
  description: string | null;
  postedAt: Date | null;
  isFeatured: number | null;
};

function formatDate(date: Date | string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function timeAgo(date: Date | string | null) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatDate(date);
}

function ProvinceBadge({ province }: { province: string | null }) {
  const colors: Record<string, string> = {
    ON: "bg-blue-50 text-blue-700 border-blue-100",
    BC: "bg-teal-50 text-teal-700 border-teal-100",
    AB: "bg-amber-50 text-amber-700 border-amber-100",
    SK: "bg-green-50 text-green-700 border-green-100",
    MB: "bg-purple-50 text-purple-700 border-purple-100",
    other: "bg-slate-50 text-slate-600 border-slate-200",
  };
  const labels: Record<string, string> = {
    ON: "Ontario",
    BC: "British Columbia",
    AB: "Alberta",
    SK: "Saskatchewan",
    MB: "Manitoba",
    other: "Canada",
  };
  const key = province ?? "other";
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${colors[key] ?? colors.other}`}
    >
      {labels[key] ?? key}
    </span>
  );
}

// ─── Job Detail Modal ─────────────────────────────────────────────────────────

function JobModal({ job, onClose }: { job: Job; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
          <div className="min-w-0">
            {job.isFeatured ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                Featured
              </div>
            ) : null}
            <h2 className="text-xl font-bold text-slate-900 leading-snug capitalize">
              {job.title}
            </h2>
            {job.company && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{job.company}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
          {job.location && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              {job.location}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <DollarSign className="w-4 h-4 text-slate-400" />
              {job.salary}
            </span>
          )}
          {job.jobType && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              {job.jobType}
            </span>
          )}
          <ProvinceBadge province={job.province} />
          {job.postedAt && (
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              Posted {formatDate(job.postedAt)}
            </span>
          )}
        </div>

        {/* Body — description */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {job.description ? (
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <Globe className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium text-slate-500">Full description on the employer's site</p>
              <p className="text-xs mt-1 max-w-xs mx-auto">
                Click "View Full Posting" below to see the complete job description, requirements, and how to apply.
              </p>
            </div>
          )}
        </div>

        {/* Footer — source + apply CTA */}
        <div className="border-t border-slate-100 px-5 py-4 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            <span className="font-medium text-slate-500">{job.sourceName ?? "Job Bank Canada"}</span>
            {job.postedAt && <span> · {timeAgo(job.postedAt)}</span>}
          </div>
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors w-full sm:w-auto justify-center"
          >
            View Full Posting
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-xl border transition-all group ${
        job.isFeatured
          ? "border-blue-300 shadow-sm ring-1 ring-blue-100"
          : "border-slate-200 hover:border-blue-300 hover:shadow-sm"
      }`}
    >
      <div className="p-5">
        {job.isFeatured ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
            Featured
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug capitalize">
              {job.title}
            </h2>
            {job.company && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{job.company}</span>
              </div>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors shrink-0 mt-0.5" />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3">
          {job.location && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {job.location}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <span className="text-slate-400">$</span>
              {job.salary}
            </span>
          )}
          {job.jobType && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {job.jobType}
            </span>
          )}
          <ProvinceBadge province={job.province} />
        </div>

        {job.description && (
          <p className="mt-3 text-xs text-slate-500 leading-relaxed line-clamp-2">
            {job.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            {job.sourceName ?? "Job Bank Canada"} · {timeAgo(job.postedAt)}
          </span>
          <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700">
            View details →
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Careers() {
  usePageMeta({
    title: "Water & Wastewater Operator Jobs in Canada | Echelon Institute",
    description:
      "Browse live water and wastewater operator job postings across Canada — Ontario, BC, Alberta, Saskatchewan, and Manitoba. Updated daily from Job Bank Canada and OWWA.",
    keywords:
      "water operator jobs Canada, wastewater operator jobs, water treatment operator employment, Ontario water operator jobs, BC water operator jobs, Alberta water operator jobs",
  });

  const [province, setProvince] = useState<Province>(null);
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { data, isLoading } = trpc.jobs.listJobs.useQuery(
    { page, province },
    { placeholderData: (prev) => prev }
  );
  const { data: stats } = trpc.jobs.stats.useQuery();

  const jobs = data?.jobs ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  function handleProvinceChange(p: Province) {
    setProvince(p);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav currentPath="/jobs" />

      {/* Job detail modal */}
      {selectedJob && (
        <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}

      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-3">
            <Briefcase className="w-4 h-4" />
            <span>Operator Job Board</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Water &amp; Wastewater Operator Jobs in Canada
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl">
            Live job postings for certified water and wastewater operators across Ontario, BC,
            Alberta, Saskatchewan, and Manitoba. Updated daily from Job Bank Canada, OWWA, and
            municipal employers.
          </p>
          {stats && stats.total > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 text-sm text-blue-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              {stats.total} active posting{stats.total !== 1 ? "s" : ""} right now
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Province filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PROVINCES.map((p) => (
            <button
              key={String(p.value)}
              onClick={() => handleProvinceChange(p.value as Province)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                province === p.value
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!isLoading && total > 0 && (
          <p className="text-sm text-slate-500 mb-4">
            Showing {jobs.length} of {total} posting{total !== 1 ? "s" : ""}
            {province ? ` in ${PROVINCES.find((p) => p.value === province)?.label}` : ""}
          </p>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse"
              >
                <div className="h-5 bg-slate-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-slate-200 rounded w-full mb-1" />
                <div className="h-3 bg-slate-200 rounded w-4/5" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && jobs.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium text-slate-700">No postings found</p>
            <p className="text-sm mt-1 max-w-sm mx-auto">
              {province
                ? `No active postings in ${PROVINCES.find((p) => p.value === province)?.label} right now. Try "All Provinces" or check back soon.`
                : "No active postings right now. The board refreshes daily — check back soon."}
            </p>
            {province && (
              <button
                onClick={() => handleProvinceChange(null)}
                className="mt-4 text-blue-600 text-sm font-medium hover:underline"
              >
                View all provinces
              </button>
            )}
          </div>
        )}

        {/* Job cards */}
        {!isLoading && jobs.length > 0 && (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-300 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-300 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-lg">Need your certification first?</p>
              <p className="text-blue-100 text-sm mt-0.5">
                Prepare for your operator exam with Echelon's AI-powered practice questions.
              </p>
            </div>
            <a
              href="/quiz"
              className="shrink-0 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-blue-50 transition-colors"
            >
              Start Free Practice
            </a>
          </div>
        </div>

        {/* Source note */}
        <p className="mt-6 text-xs text-slate-400 text-center">
          Job postings sourced from{" "}
          <a
            href="https://www.jobbank.gc.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-600"
          >
            Government of Canada Job Bank
          </a>
          ,{" "}
          <a
            href="https://owwa.ca/job-board/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-600"
          >
            OWWA
          </a>
          , and municipal employers. Echelon Institute is not affiliated with any employer. Always verify postings directly.
        </p>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-bold text-sm">Echelon Institute</p>
              <p className="text-xs mt-0.5">Canadian Water &amp; Wastewater Operator Certification</p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <a href="/quiz" className="hover:text-white transition-colors">Practice</a>
              <a href="/blog" className="hover:text-white transition-colors">Blog</a>
              <a href="/jobs" className="hover:text-white transition-colors">Jobs</a>
              <a href="/pricing" className="hover:text-white transition-colors">Pricing</a>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-6 pt-6 text-xs text-center">
            © {new Date().getFullYear()} Echelon Institute. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
