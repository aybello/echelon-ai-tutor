import PurchaseEmailDelivery from "@/components/PurchaseEmailDelivery";
// ADMIN DASHBOARD — /admin
// Gated to role === 'admin'. Shows trial emails, waitlist signups, and error reports.

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import ChangelogManager from "@/components/ChangelogManager";
import { ECHELON_LOGO_URL } from "@/components/SiteNav";
import { buildDataExplorerCsv } from "@/lib/dataExplorerCsv";
import { consentedTrialEmails, isActionableLead, matchesLeadTriageFilter, type LeadTriageFilter } from "@shared/adminLeadTriage";
import { describePurchaseCheck, formatReviewSteps, parseReviewOptions } from "@/lib/adminReview";
import { formatAdminCurrency, formatAdminPercent, rateFromCounts } from "@/lib/adminDashboard";
import { formatScoreSavedAt, scoreHistoryCsvRow, scoreLearnerIdentity } from "@/lib/adminScoreHistory";
import {
  Activity,
  Building2,
  ChartNoAxesCombined,
  CircleCheck,
  ClipboardList,
  CreditCard,
  Database,
  FileText,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquare,
  Repeat2,
  ShieldCheck,
  TriangleAlert,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "./admin.css";

type Tab = "insights" | "leads" | "trials" | "waitlist" | "errors" | "scores" | "revenue" | "subscriptions" | "health" | "feedback" | "orgs" | "questions" | "changelog" | "recovery" | "explorer";
type ReviewStatus = "unreviewed" | "in_review" | "approved" | "rejected";

type AdminNavigationGroup = {
  label: string;
  tabs: { id: Tab; label: string; icon: LucideIcon }[];
};

const ADMIN_NAVIGATION: AdminNavigationGroup[] = [
  { label: "Overview", tabs: [{ id: "insights", label: "Business overview", icon: LayoutDashboard }] },
  {
    label: "Customers & sales",
    tabs: [
      { id: "revenue", label: "Sales & purchases", icon: CreditCard },
      { id: "subscriptions", label: "Subscriptions", icon: Repeat2 },
      { id: "orgs", label: "Organizations", icon: Building2 },
      { id: "leads", label: "Captured leads", icon: Mail },
      { id: "trials", label: "Trial signups", icon: Mail },
      { id: "waitlist", label: "Waitlist", icon: ClipboardList },
    ],
  },
  {
    label: "Learning & content",
    tabs: [
      { id: "questions", label: "Question review", icon: CircleCheck },
      { id: "scores", label: "Score history", icon: ChartNoAxesCombined },
      { id: "feedback", label: "Feedback", icon: MessageSquare },
      { id: "changelog", label: "Changelog", icon: FileText },
    ],
  },
  {
    label: "Operations & data",
    tabs: [
      { id: "errors", label: "Error reports", icon: TriangleAlert },
      { id: "health", label: "System health", icon: Activity },
      { id: "recovery", label: "Recovery review", icon: ShieldCheck },
      { id: "explorer", label: "Data explorer", icon: Database },
    ],
  },
];

const EXAM_TYPE_LABELS: Record<string, string> = {
  // OIT
  oit: "OIT Water",
  "oit-ww": "OIT Wastewater",
  // Ontario Class 1–4 Water
  "class1-water": "Class 1 Water",
  "class2-water": "Class 2 Water",
  "class2-wastewater": "Class 2 Wastewater",
  "class3-water": "Class 3 Water",
  "class4-water": "Class 4 Water",
  // Ontario Class 1–4 Wastewater
  "class1-ww": "Class 1 Wastewater",
  "class2-ww": "Class 2 Wastewater",
  "class3-ww": "Class 3 Wastewater",
  "class4-ww": "Class 4 Wastewater",
  // Ontario Class 1–4 Water Distribution
  "class1-water-dist": "Class 1 Distribution & Supply",
  "class2-water-dist": "Class 2 Distribution & Supply",
  "class3-water-dist": "Class 3 Distribution & Supply",
  "class4-water-dist": "Class 4 Distribution & Supply",
  // Ontario Class 1–4 Wastewater Collection
  "class1-wastewater-coll": "Class 1 WW Coll",
  "class2-wastewater-coll": "Class 2 WW Coll",
  "class3-wastewater-coll": "Class 3 WW Coll",
  "class4-wastewater-coll": "Class 4 WW Coll",
  // Legacy
  class1: "Class 1 (Legacy)",
  // WQA
  wqa: "WQA",
  // WPI Water Treatment
  "wpi-class1-water": "WPI Class I Water",
  "wpi-class2-water": "WPI Class II Water",
  "wpi-class3-water": "WPI Class III Water",
  "wpi-class4-water": "WPI Class IV Water",
  // WPI Wastewater
  "wpi-class1-wastewater": "WPI Class I Wastewater",
  "wpi-class2-wastewater": "WPI Class II Wastewater",
  "wpi-class3-wastewater": "WPI Class III Wastewater",
  "wpi-class4-wastewater": "WPI Class IV Wastewater",
  // WPI Distribution
  "wpi-class1-water-dist": "WPI Class I Distribution",
  "wpi-class2-water-dist": "WPI Class II Distribution",
  "wpi-class3-water-dist": "WPI Class III Distribution",
  "wpi-class4-water-dist": "WPI Class IV Distribution",
  // WPI Collection
  "wpi-class1-water-coll": "WPI Class I Collection",
  "wpi-class2-water-coll": "WPI Class II Collection",
  "wpi-class2-wastewater-coll": "WPI Class II Collection",
  "wpi-class3-water-coll": "WPI Class III Collection",
  "wpi-class4-water-coll": "WPI Class IV Collection",
};

const EXAM_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  oit: { bg: "#DBEAFE", color: "#1D4ED8" },
  "oit-ww": { bg: "#CCFBF1", color: "#0F766E" },
  "class1-water": { bg: "#DCFCE7", color: "#15803D" },
  "class2-water": { bg: "#DCFCE7", color: "#15803D" },
  "class2-wastewater": { bg: "#CCFBF1", color: "#0F766E" },
  "class3-water": { bg: "#DCFCE7", color: "#15803D" },
  "class4-water": { bg: "#DCFCE7", color: "#15803D" },
  "class1-ww": { bg: "#CCFBF1", color: "#0F766E" },
  "class2-ww": { bg: "#CCFBF1", color: "#0F766E" },
  "class3-ww": { bg: "#CCFBF1", color: "#0F766E" },
  "class4-ww": { bg: "#CCFBF1", color: "#0F766E" },
  "class1-water-dist": { bg: "#E0F2FE", color: "#0369A1" },
  "class2-water-dist": { bg: "#E0F2FE", color: "#0369A1" },
  "class3-water-dist": { bg: "#E0F2FE", color: "#0369A1" },
  "class4-water-dist": { bg: "#E0F2FE", color: "#0369A1" },
  "class1-wastewater-coll": { bg: "#FEE2E2", color: "#B91C1C" },
  "class2-wastewater-coll": { bg: "#FEE2E2", color: "#B91C1C" },
  "class3-wastewater-coll": { bg: "#FEE2E2", color: "#B91C1C" },
  "class4-wastewater-coll": { bg: "#FEE2E2", color: "#B91C1C" },
  class1: { bg: "#F1F5F9", color: "#475569" },
  wqa: { bg: "#EDE9FE", color: "#6D28D9" },
  "wpi-class1-water": { bg: "#FEF9C3", color: "#A16207" },
  "wpi-class2-water": { bg: "#FEF9C3", color: "#A16207" },
  "wpi-class3-water": { bg: "#FEF9C3", color: "#A16207" },
  "wpi-class4-water": { bg: "#FEF9C3", color: "#A16207" },
  "wpi-class1-wastewater": { bg: "#FFEDD5", color: "#C2410C" },
  "wpi-class2-wastewater": { bg: "#FFEDD5", color: "#C2410C" },
  "wpi-class3-wastewater": { bg: "#FFEDD5", color: "#C2410C" },
  "wpi-class4-wastewater": { bg: "#FFEDD5", color: "#C2410C" },
  "wpi-class1-water-dist": { bg: "#E0F2FE", color: "#0369A1" },
  "wpi-class2-water-dist": { bg: "#E0F2FE", color: "#0369A1" },
  "wpi-class3-water-dist": { bg: "#E0F2FE", color: "#0369A1" },
  "wpi-class4-water-dist": { bg: "#E0F2FE", color: "#0369A1" },
  "wpi-class1-water-coll": { bg: "#FEE2E2", color: "#B91C1C" },
  "wpi-class2-water-coll": { bg: "#FEE2E2", color: "#B91C1C" },
  "wpi-class2-wastewater-coll": { bg: "#FEE2E2", color: "#B91C1C" },
  "wpi-class3-water-coll": { bg: "#FEE2E2", color: "#B91C1C" },
  "wpi-class4-water-coll": { bg: "#FEE2E2", color: "#B91C1C" },
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  wrong_answer: "Wrong Answer",
  wrong_calculation: "Wrong Calculation",
  unclear_question: "Unclear Question",
  other: "Other",
};

const REPORT_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  wrong_answer: { bg: "#FEE2E2", color: "#B91C1C" },
  wrong_calculation: { bg: "#FFEDD5", color: "#C2410C" },
  unclear_question: { bg: "#FEF9C3", color: "#A16207" },
  other: { bg: "#F1F5F9", color: "#475569" },
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleString("en-CA", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function Admin() {
  usePageMeta({
    title: "Admin Dashboard",
    description: "Echelon Institute administration panel.",
    noindex: true
  });

  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("insights");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [isMobileNavigation, setIsMobileNavigation] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [leadFilter, setLeadFilter] = useState<LeadTriageFilter>("actionable");
  const [reviewFilter, setReviewFilter] = useState<ReviewStatus>("unreviewed");
  const [reviewBank, setReviewBank] = useState("");
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewingQuestionId, setReviewingQuestionId] = useState<number | null>(null);
  const [reviewDraft, setReviewDraft] = useState({ sourceTitle: "", sourceReference: "", sourceUrl: "", blueprintObjective: "" });
  const [explorerDatasetKey, setExplorerDatasetKey] = useState("users");
  const [explorerPage, setExplorerPage] = useState(1);
  const [explorerPageSize, setExplorerPageSize] = useState(50);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigationPanelRef = useRef<HTMLElement>(null);
  // Data queries
  const stats = trpc.admin.stats.useQuery(undefined, { enabled: user?.role === "admin" });
  const kpisQ = trpc.admin.getProductKpis.useQuery(undefined, { enabled: user?.role === "admin" && activeTab === "insights" });
  const businessQ = trpc.admin.getBusinessRevenue.useQuery(undefined, { enabled: user?.role === "admin" && (activeTab === "insights" || activeTab === "revenue") });
  const ceuKpisQ = trpc.admin.getCeuKpis.useQuery(undefined, { enabled: user?.role === "admin" && activeTab === "insights" });
  const trialsQ = trpc.admin.getTrialEmails.useQuery({ limit: 200 }, { enabled: user?.role === "admin" && activeTab === "trials" });
  const leadsQ = trpc.admin.getLeadCapture.useQuery({ limit: 300 }, { enabled: user?.role === "admin" && (activeTab === "leads" || activeTab === "insights") });
  const waitlistQ = trpc.admin.getWaitlist.useQuery({ limit: 200 }, { enabled: user?.role === "admin" && activeTab === "waitlist" });
  const errorsQ = trpc.admin.getErrorReports.useQuery({ limit: 200 }, { enabled: user?.role === "admin" && activeTab === "errors" });
  const scoresQ = trpc.admin.getScoreHistory.useQuery({ limit: 500, examType: "all" }, { enabled: user?.role === "admin" && activeTab === "scores" });
  const purchasesQ = trpc.admin.getPurchases.useQuery({ limit: 500 }, { enabled: user?.role === "admin" && activeTab === "revenue" });
  const healthQ = trpc.admin.getSystemHealth.useQuery(undefined, { enabled: user?.role === "admin" && activeTab === "health", refetchInterval: 60_000 });
  const feedbackQ = trpc.admin.getFeedback.useQuery({ limit: 200 }, { enabled: user?.role === "admin" && activeTab === "feedback" });
  const orgsQ = trpc.admin.listOrganizations.useQuery(undefined, { enabled: user?.role === "admin" && activeTab === "orgs" });
  const subscriptionsQ = trpc.admin.getSubscriptions.useQuery({ limit: 500 }, { enabled: user?.role === "admin" && activeTab === "subscriptions" });
  const governanceStatsQ = trpc.admin.getQuestionGovernanceStats.useQuery(undefined, { enabled: user?.role === "admin" && activeTab === "questions" });
  const governanceBanksQ = trpc.admin.getQuestionGovernanceBanks.useQuery(undefined, { enabled: user?.role === "admin" && activeTab === "questions" });
  const governanceQueueQ = trpc.admin.getQuestionGovernanceQueue.useQuery(
    { limit: 25, page: reviewPage, status: reviewFilter, bankKey: reviewBank || undefined },
    { enabled: user?.role === "admin" && activeTab === "questions" },
  );
  const recoveryEvidenceQ = trpc.admin.getCustomerRecoveryEvidence.useQuery(
    { limit: 100 },
    { enabled: user?.role === "admin" && activeTab === "recovery" },
  );
  const explorerCatalogQ = trpc.admin.getDataExplorerCatalog.useQuery(
    undefined,
    { enabled: user?.role === "admin" && activeTab === "explorer" },
  );
  const explorerPageQ = trpc.admin.getDataExplorerPage.useQuery(
    { datasetKey: explorerDatasetKey, page: explorerPage, pageSize: explorerPageSize },
    { enabled: user?.role === "admin" && activeTab === "explorer" },
  );
  const reconcileSubs = trpc.admin.reconcileSubscriptions.useMutation({
    onSuccess: (data) => {
      if (data.recovered > 0) {
        alert(`Subscription backfill complete. Recovered ${data.recovered} missing subscription(s): ${data.details.map((d: any) => `${d.email} → ${d.tier} (${d.province})`).join(", ")}`);
      } else {
        alert(`All subscriptions are already in sync. Skipped: ${data.skipped}. No missing records found.`);
      }
    },
    onError: (err) => alert(`Subscription reconciliation failed: ${err.message}`),
  });
  const backfillContact = trpc.admin.backfillContactInfo.useMutation({
    onSuccess: (data) => {
      purchasesQ.refetch();
      if (data.updated > 0) {
        alert(`Contact backfill complete. Updated ${data.updated} record(s): ${data.details.map((d: any) => `${d.email} (${d.type}): phone=${d.phone}, name=${d.name}`).join("\n")}`);
      } else {
        alert(`All records already have phone/name. No updates needed.${data.errors.length > 0 ? ` Errors: ${data.errors.join(", ")}` : ""}`);
      }
    },
    onError: (err) => alert(`Contact backfill failed: ${err.message}`),
  });
  const reconcile = trpc.admin.reconcilePurchases.useMutation({
    onSuccess: (data) => {
      purchasesQ.refetch();
      alert(describePurchaseCheck(data));
    },
    onError: (err) => alert(`Reconciliation failed: ${err.message}`),
  });

  const utils = trpc.useUtils();
  const markContactFollowUp = trpc.admin.setContactFollowUpStatus.useMutation({
    onSuccess: () => { void utils.admin.getLeadCapture.invalidate(); },
    onError: (error) => alert("Contact follow-up status was not saved: " + error.message),
  });

  const reviewQuestion = trpc.admin.reviewQuestion.useMutation({
    onSuccess: () => {
      utils.admin.getQuestionGovernanceStats.invalidate();
      utils.admin.getQuestionGovernanceQueue.invalidate();
      setReviewingQuestionId(null);
    },
    onError: (err) => alert(`Question review could not be saved: ${err.message}`),
  });
  const classifyRecoveryEvidence = trpc.admin.classifyCustomerRecoveryEvidence.useMutation({
    onSuccess: () => recoveryEvidenceQ.refetch(),
    onError: (err) => alert(`Recovery classification could not be saved: ${err.message}`),
  });

  const classifyRecovery = (row: NonNullable<typeof recoveryEvidenceQ.data>[number], subjectType: "individual" | "organization_manager") => {
    let organizationName: string | null = null;
    let organizationGroup: "treatment" | "distribution" | "unspecified" | null = null;
    let seatCount: number | null = null;
    if (subjectType === "organization_manager") {
      organizationName = window.prompt("Organization name", row.recoveryOrganizationName ?? "")?.trim() || null;
      if (!organizationName) return;
      const group = window.prompt("Group: treatment, distribution, or unspecified", row.recoveryOrganizationGroup ?? "unspecified");
      if (group === null) return;
      if (!["treatment", "distribution", "unspecified"].includes(group)) {
        alert("Choose treatment, distribution, or unspecified.");
        return;
      }
      organizationGroup = group as "treatment" | "distribution" | "unspecified";
      const seatInput = window.prompt("Confirmed seat count, if known. Leave blank when not yet reconciled.", row.recoverySeatCount?.toString() ?? "");
      if (seatInput === null) return;
      if (seatInput.trim()) {
        const parsed = Number(seatInput);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 500) {
          alert("Seat count must be a whole number from 1 to 500.");
          return;
        }
        seatCount = parsed;
      }
    }
    const reviewNote = window.prompt("Internal evidence note. This does not grant access.", row.reviewNote ?? "");
    if (!reviewNote?.trim() || reviewNote.trim().length < 3) return;
    classifyRecoveryEvidence.mutate({
      id: row.id,
      subjectType,
      organizationName,
      organizationGroup,
      seatCount,
      reviewNote: reviewNote.trim(),
    });
  };

  const setQuestionReviewState = (row: any, reviewStatus: ReviewStatus) => {
    reviewQuestion.mutate({
      id: row.id,
      sourceTitle: row.sourceTitle || null,
      sourceReference: row.sourceReference || null,
      sourceUrl: row.sourceUrl || null,
      blueprintObjective: row.blueprintObjective || null,
      reviewStatus,
    });
  };

  const sourceAndApproveQuestion = (row: any) => {
    if (!reviewDraft.sourceTitle.trim() || !reviewDraft.sourceReference.trim()) {
      alert("Approval requires both a source title and a precise source reference.");
      return;
    }
    if (reviewDraft.sourceUrl.trim()) {
      try { new URL(reviewDraft.sourceUrl.trim()); } catch { alert("Enter a valid source URL or leave it blank."); return; }
    }
    if (!window.confirm(`Publish ${row.bankKey} #${row.questionNum} to learners? Confirm the keyed answer, rationale, distractors and source against the cited primary material.`)) return;
    reviewQuestion.mutate({
      id: row.id,
      sourceTitle: reviewDraft.sourceTitle.trim(),
      sourceReference: reviewDraft.sourceReference.trim(),
      sourceUrl: reviewDraft.sourceUrl.trim() || null,
      blueprintObjective: reviewDraft.blueprintObjective.trim() || null,
      reviewStatus: "approved",
    });
  };

  const dismissError = trpc.admin.dismissErrorReport.useMutation({
    onSuccess: () => utils.admin.getErrorReports.invalidate(),
  });
  const removeWaitlist = trpc.admin.removeWaitlistEntry.useMutation({
    onSuccess: () => { utils.admin.getWaitlist.invalidate(); utils.admin.stats.invalidate(); },
  });
  const dismissFeedback = trpc.admin.dismissFeedback.useMutation({
    onSuccess: () => { utils.admin.getFeedback.invalidate(); utils.admin.stats.invalidate(); },
  });

  const selectSection = (section: Tab) => {
    setActiveTab(section);
    setNavigationOpen(false);
  };

  const refreshActiveSection = () => {
    stats.refetch();
    if (activeTab === "insights") {
      kpisQ.refetch();
      ceuKpisQ.refetch();
      businessQ.refetch();
      leadsQ.refetch();
    }
    if (activeTab === "leads") leadsQ.refetch();
    if (activeTab === "trials") trialsQ.refetch();
    if (activeTab === "waitlist") waitlistQ.refetch();
    if (activeTab === "errors") errorsQ.refetch();
    if (activeTab === "scores") scoresQ.refetch();
    if (activeTab === "revenue") { purchasesQ.refetch(); businessQ.refetch(); }
    if (activeTab === "subscriptions") subscriptionsQ.refetch();
    if (activeTab === "health") healthQ.refetch();
    if (activeTab === "feedback") feedbackQ.refetch();
    if (activeTab === "orgs") orgsQ.refetch();
    if (activeTab === "questions") {
      governanceStatsQ.refetch();
      governanceBanksQ.refetch();
      governanceQueueQ.refetch();
    }
    if (activeTab === "recovery") recoveryEvidenceQ.refetch();
    if (activeTab === "explorer") {
      explorerCatalogQ.refetch();
      explorerPageQ.refetch();
    }
  };

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const syncViewport = () => setIsMobileNavigation(media.matches);
    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (!isMobileNavigation) setNavigationOpen(false);
  }, [isMobileNavigation]);

  useEffect(() => {
    if (!navigationOpen || !isMobileNavigation) return;
    const previousOverflow = document.body.style.overflow;
    const panel = navigationPanelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>("button, a[href]");
    document.body.style.overflow = "hidden";
    firstFocusable?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNavigationOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [isMobileNavigation, navigationOpen]);

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 1500);
  };

  const copyAllEmails = (emails: string[]) => {
    navigator.clipboard.writeText(emails.join("\n"));
    setCopiedEmail("__all__");
    setTimeout(() => setCopiedEmail(null), 1500);
  };

  const formatExplorerValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "—";
    const text = String(value);
    return text.length > 180 ? `${text.slice(0, 180)}…` : text;
  };

  const displayExplorerColumn = (column: string) => column
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");

  const downloadCSV = (rows: Record<string, unknown>[], filename: string) => {
    if (!rows.length) return;
    const blob = new Blob([buildDataExplorerCsv(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Auth gate ──
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#64748B", fontFamily: "'Sora', sans-serif", fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <ShieldCheck size={42} strokeWidth={1.6} style={{ color: "#173A4C", marginBottom: 16 }} aria-hidden="true" />
          <div style={{ color: "#1E293B", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Sign in required</div>
          <button type="button" onClick={() => { window.location.href = getLoginUrl(); }} style={{ background: "transparent", border: 0, color: "#38BDF8", cursor: "pointer", fontFamily: "inherit", fontSize: 14, padding: 8 }}>Sign in</button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <ShieldCheck size={42} strokeWidth={1.6} style={{ color: "#B91C1C", marginBottom: 16 }} aria-hidden="true" />
          <div style={{ color: "#1E293B", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Admin access only</div>
          <div style={{ color: "#64748B", fontSize: 13, marginBottom: 20 }}>Your account ({user.email ?? user.name}) does not have admin privileges.</div>
          <Link href="/" style={{ display: "inline-block", padding: "10px 24px", borderRadius: 20, background: "#1D4ED8", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit", textDecoration: "none" }}>Back to home</Link>
        </div>
      </div>
    );
  }

  // ── Founder dashboard ──
  const checkoutCompletionRate = rateFromCounts(
    kpisQ.data?.funnel?.checkoutCompletions,
    kpisQ.data?.funnel?.checkoutStarts,
  );
  const founderLedgerRows = [
    {
      label: "Recorded order value",
      value: formatAdminCurrency(stats.data?.totalRevenueCAD),
      definition: stats.data?.revenueBreakdown
        ? `${formatAdminCurrency(stats.data.revenueBreakdown.purchasesCAD)} individual purchases, ${formatAdminCurrency(stats.data.revenueBreakdown.subscriptionsCAD)} active subscriptions, ${formatAdminCurrency(stats.data.revenueBreakdown.teamFlexAddedCAD)} team orders. Team money is paid in Stripe but stored separately, so it is added here and deduplicated against purchases. Not net of refunds, disputes or fees.`
        : "Individual purchases, active subscriptions and team orders, deduplicated by Stripe payment. Not net of refunds, disputes or fees.",
      action: "Review purchases",
      tab: "revenue" as Tab,
    },
    {
      label: "Team revenue",
      value: formatAdminCurrency(stats.data?.revenueBreakdown?.teamFlexGrossCAD),
      definition: stats.data?.revenueBreakdown
        ? `${stats.data.revenueBreakdown.paidFlexOrders} paid team orders covering ${stats.data.revenueBreakdown.flexLicencesSold} licences. This money never reaches the purchases table, so any view built on purchases alone reports it as zero.`
        : "Paid team orders. This money is stored outside the purchases table.",
      action: "Open teams",
      tab: "orgs" as Tab,
    },
    {
      label: "Team orders left unpaid",
      value: businessQ.data
        ? `${businessQ.data.abandonedOrders} · ${formatAdminCurrency(businessQ.data.abandonedValueCAD)}`
        : "—",
      definition: "Managers who built a team order and did not complete payment. Our own internal accounts are excluded, so this is real recoverable demand. Quoted at the pre-tax amount, since no payment was captured.",
      action: "Open teams",
      tab: "orgs" as Tab,
    },
    {
      label: "Checkout event ratio",
      value: formatAdminPercent(checkoutCompletionRate),
      definition: kpisQ.data?.funnel
        ? `${kpisQ.data.funnel.checkoutCompletions} recorded completed events / ${kpisQ.data.funnel.checkoutStarts} recorded starts in the last 30 days. This is an event-count ratio, not a matched conversion cohort.`
        : "Recorded completed checkout events divided by recorded starts in the last 30 days. This is an event-count ratio, not a matched conversion cohort.",
      action: "Inspect checkouts",
      tab: "revenue" as Tab,
    },
    {
      label: "7-day learner return",
      value: formatAdminPercent(kpisQ.data?.engagement?.sevenDayReturnRate),
      definition: kpisQ.data?.engagement
        ? `${kpisQ.data.engagement.sevenDayReturners} of ${kpisQ.data.engagement.sevenDayReturnCohort} eligible learners returned to a learning activity within seven days.`
        : "Eligible learners who returned to a learning activity within seven days.",
      action: "Review learning",
      tab: "scores" as Tab,
    },
  ];
  const founderActions = [
    { number: "01", title: "Inspect paid conversion", detail: "Review purchase records and use the guarded Stripe check when a stored record needs verification.", status: "Revenue", action: "Review", tab: "revenue" as Tab },
    { number: "02", title: "Check team-seat health", detail: "Confirm available seats and active organization access without changing member assignments from this overview.", status: "Teams", action: "Open", tab: "orgs" as Tab },
    { number: "03", title: "Review question release queue", detail: "Validate sources and rationales before any question becomes learner-visible.", status: "Content", action: "Review", tab: "questions" as Tab },
  ];
  const revenueBreakdown = stats.data?.revenueBreakdown;
  const teamIndividualSplit = revenueBreakdown
    ? {
        teamCAD: revenueBreakdown.teamFlexGrossCAD,
        individualCAD:
          revenueBreakdown.purchasesCAD +
          revenueBreakdown.subscriptionsCAD -
          revenueBreakdown.teamFlexAlreadyCountedCAD,
      }
    : null;
  const operatingMetrics = [
    // Part of the team money sits inside purchases because of the legacy
    // backfill. Removing it from the individual side is what makes team plus
    // individual equal the headline total instead of overstating by $358.
    { label: "Team vs individual", value: teamIndividualSplit ? `${Math.round(teamIndividualSplit.teamCAD / Math.max(teamIndividualSplit.teamCAD + teamIndividualSplit.individualCAD, 1) * 100)}% team` : "—", note: teamIndividualSplit ? `${formatAdminCurrency(teamIndividualSplit.teamCAD)} team, ${formatAdminCurrency(teamIndividualSplit.individualCAD)} individual` : "Share of money from team orders", tab: "orgs" as Tab },
    { label: "Buyer organizations", value: businessQ.data?.buyerOrganizations ?? "—", note: businessQ.data ? `${businessQ.data.activeTeamPlans} active plans, ${businessQ.data.activeTeamSeats} seats` : "Distinct employers that have ordered", tab: "orgs" as Tab },
    { label: "Purchase records", value: stats.data?.purchaseCount ?? "—", note: "All stored purchase records", tab: "revenue" as Tab },
    { label: "Subscribers", value: stats.data?.subscriptionCount ?? "—", note: "Current stored subscription records", tab: "subscriptions" as Tab },
    { label: "Captured leads", value: leadsQ.data?.uniquePeople ?? "—", note: leadsQ.data ? `${leadsQ.data.openLeads} open, ${leadsQ.data.newLast7Days} new in 7 days` : "Every email captured across the product", tab: "leads" as Tab },
    { label: "Trial signups", value: stats.data?.trialCount ?? "—", note: "All stored trial-signup records", tab: "trials" as Tab },
    { label: "Weekly active learners", value: kpisQ.data?.engagement?.weeklyActiveLearners ?? "—", note: "Recorded learning activity in 7 days", tab: "scores" as Tab },
    { label: "Learning activation", value: formatAdminPercent(kpisQ.data?.commercial?.learningActivationRate), note: kpisQ.data?.commercial ? `${kpisQ.data.commercial.learningActivated} of ${kpisQ.data.commercial.accessCohortSize} new activations in 30 days` : "Newly activated learners who started learning in 30 days", tab: "scores" as Tab },
    { label: "Team seats used", value: kpisQ.data?.teams ? `${kpisQ.data.teams.assignedSeats}/${kpisQ.data.teams.totalSeats}` : "—", note: "Current allocation across active team plans", tab: "orgs" as Tab },
    { label: "Feedback", value: stats.data ? `${stats.data.feedbackCount} · ${stats.data.avgRating}/5` : "—", note: "All submitted learner feedback", tab: "feedback" as Tab },
  ];
  const activeSection = ADMIN_NAVIGATION.flatMap(group => group.tabs).find(tab => tab.id === activeTab);
  const activeDescription: Record<Tab, string> = {
    insights: "A clear view of revenue signals, learner activity and open work.",
    revenue: "Review stored purchase records and check Stripe for missing records.",
    subscriptions: "Review subscription records and their current lifecycle state.",
    trials: "Review people who requested trial access or product updates.",
    leads: "Every email captured across the product in one list, newest first.",
    waitlist: "Review people waiting for future course availability.",
    questions: "Review learner-visible questions against their source material.",
    scores: "Review learner performance and study outcomes across courses.",
    feedback: "Read learner ratings and resolve submitted feedback.",
    changelog: "Document product changes and customer-facing release notes.",
    errors: "Review reported product errors and close resolved issues.",
    health: "Check live application health and operational dependencies.",
    orgs: "Review team organizations, seats and manager access.",
    recovery: "Classify recovery evidence without granting access automatically.",
    explorer: "Browse approved datasets with protected fields and audit boundaries.",
  };

  return (
    <div className="admin-portal" style={{ minHeight: "100vh", background: "#F3F7F9", fontFamily: "'Sora', sans-serif", color: "#15283A" }}>
      <a className="admin-skip-link" href="#admin-main-content">Skip to content</a>
      <style>{`
        .admin-row:hover { background: rgba(0,0,0,0.04) !important; }
        .admin-btn:hover { opacity: 0.8; }
        @media (max-width: 640px) {
          .admin-stats { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .admin-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
        }
      `}</style>

      <div className="admin-shell">
        {navigationOpen && <button className="admin-drawer-backdrop" aria-label="Close navigation" type="button" onClick={() => setNavigationOpen(false)} />}
        <aside
          id="admin-navigation"
          className={`admin-sidebar${navigationOpen ? " is-open" : ""}`}
          ref={navigationPanelRef}
          aria-label="Echelon administration navigation"
          aria-hidden={isMobileNavigation && !navigationOpen ? true : undefined}
          aria-modal={isMobileNavigation && navigationOpen ? true : undefined}
          inert={isMobileNavigation && !navigationOpen ? true : undefined}
          role={isMobileNavigation && navigationOpen ? "dialog" : undefined}
        >
          <div className="admin-sidebar-brand">
            <img src={ECHELON_LOGO_URL} alt="Echelon Institute" width={44} height={42} />
            <div><strong>Echelon Institute</strong><span>Administration</span></div>
            <button type="button" className="admin-sidebar-close" aria-label="Close navigation" onClick={() => setNavigationOpen(false)}><X size={20} aria-hidden="true" /></button>
          </div>
          <nav className="admin-sidebar-navigation" aria-label="Admin sections">
            {ADMIN_NAVIGATION.map(group => (
              <section className="admin-sidebar-group" key={group.label} aria-label={group.label}>
                <h2>{group.label}</h2>
                {group.tabs.map(tab => {
                  const Icon = tab.icon;
                  return <button className="admin-sidebar-button" aria-current={activeTab === tab.id ? "page" : undefined} key={tab.id} type="button" onClick={() => selectSection(tab.id)}><Icon size={17} aria-hidden="true" /><span>{tab.label}</span></button>;
                })}
              </section>
            ))}
          </nav>
          <div className="admin-sidebar-footer">
            <div className="admin-sidebar-user"><UsersRound size={17} aria-hidden="true" /><span>{user.name ?? user.email}</span></div>
            <Link href="/" className="admin-back-to-site">Back to website</Link>
          </div>
        </aside>

        <main id="admin-main-content" className="admin-content" tabIndex={-1} aria-hidden={isMobileNavigation && navigationOpen ? true : undefined} inert={isMobileNavigation && navigationOpen ? true : undefined}>
          <div className="admin-mobile-header">
            <button ref={menuButtonRef} className="admin-menu-trigger" type="button" aria-label="Open navigation" aria-controls="admin-navigation" aria-expanded={navigationOpen} onClick={() => setNavigationOpen(true)}><Menu size={20} aria-hidden="true" /></button>
            <span>{activeSection?.label}</span>
            <Link href="/" className="admin-mobile-site-link">Site</Link>
          </div>
          <div className="admin-content-inner">
        {/* Page header */}
        {activeTab === "insights" ? (
          <section className="admin-founder-header" aria-labelledby="admin-founder-title">
            <div className="admin-founder-topline">
              <div className="admin-eyebrow">Founder view <span aria-hidden="true">/</span> All Echelon</div>
              <div className="admin-founder-controls">
                <span className="admin-founder-period">Mixed reporting windows</span>
                <button className="admin-btn admin-refresh-button" onClick={refreshActiveSection} disabled={stats.isFetching || kpisQ.isFetching}>
                  {stats.isFetching || kpisQ.isFetching ? "Refreshing…" : "Refresh view"}
                </button>
              </div>
            </div>
            <div className="admin-founder-title-row">
              <div>
                <p className="admin-section-label">Founder decision surface</p>
                <h1 id="admin-founder-title">Make the <em>next right move</em>,<br />with evidence.</h1>
              </div>
              <div className="admin-founder-purpose">
                <strong>Purpose of this screen</strong>
                <p>Show the few revenue, learner, and operations decisions that deserve attention before opening a full report.</p>
              </div>
            </div>
          </section>
        ) : (
          <div className="admin-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26, gap: 16 }}>
            <div>
              <div className="admin-eyebrow">Echelon / administration</div>
              <h1 style={{ fontSize: "clamp(27px, 3vw, 38px)", fontWeight: 800, margin: "5px 0 6px" }}>{activeSection?.label}</h1>
              <p style={{ fontSize: 14, color: "#526779", margin: 0 }}>{activeDescription[activeTab]}</p>
            </div>
            <button className="admin-btn admin-refresh-button" onClick={refreshActiveSection}>Refresh</button>
          </div>
        )}

        {activeTab === "insights" && (
          <>
            <div className="admin-founder-layout">
              <section className="admin-ledger-card" aria-labelledby="decision-ledger-title">
                <div className="admin-panel-heading">
                  <div>
                    <p className="admin-section-label">Decision ledger</p>
                    <h2 id="decision-ledger-title">What needs a founder decision?</h2>
                    <p>Each measure shows a defined source, an honest current value, and its fastest useful next step.</p>
                  </div>
                  <span className="admin-live-marker">{kpisQ.isFetching || stats.isFetching ? "UPDATING" : kpisQ.error || stats.error ? "REFRESH NEEDED" : "STORED RECORDS"}</span>
                </div>
                <div className="admin-ledger-table-wrap" role="region" aria-label="Founder decision ledger" tabIndex={0}>
                  <table className="admin-ledger-table">
                    <thead>
                      <tr><th scope="col">Measure</th><th scope="col">Current</th><th scope="col">Meaning</th><th scope="col">Next action</th></tr>
                    </thead>
                    <tbody>
                      {founderLedgerRows.map((row) => (
                        <tr key={row.label}>
                          <th scope="row">{row.label}</th>
                          <td className="admin-ledger-value">{stats.isLoading || kpisQ.isLoading ? "…" : row.value}</td>
                          <td>{row.definition}</td>
                          <td><button type="button" className="admin-text-action" onClick={() => selectSection(row.tab)}>{row.action}</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="admin-founder-aside" aria-label="Founder operating principles">
                <section className="admin-trust-panel">
                  <p className="admin-section-label">Trust layer</p>
                  <h2>No metric without a trail.</h2>
                  <p>Every decision stays tied to a period, a definition, and a source you can inspect.</p>
                  <ol>
                    <li><strong>Period and denominator</strong><span>Percentages state who is counted and which time window applies.</span></li>
                    <li><strong>Source and freshness</strong><span>Consequential numbers come from stored operational records, not copied figures.</span></li>
                    <li><strong>Human action</strong><span>Recommendations never quietly change money, access, or learner records.</span></li>
                  </ol>
                  <button type="button" className="admin-trust-link" onClick={() => selectSection("explorer")}>Open Data Explorer</button>
                </section>

                <section className="admin-operating-health" aria-labelledby="operating-health-title">
                  <div className="admin-operating-heading"><h2 id="operating-health-title">Operating health</h2><span>Mixed windows</span></div>
                  <div className="admin-operating-grid">
                    {operatingMetrics.map((metric) => (
                      <button key={metric.label} type="button" className="admin-operating-metric" onClick={() => selectSection(metric.tab)}>
                        <span>{metric.label}</span>
                        <strong>{kpisQ.isLoading || stats.isLoading ? "…" : metric.value}</strong>
                        <small>{metric.note}</small>
                      </button>
                    ))}
                  </div>
                </section>
              </aside>
            </div>

            <section className="admin-priority-card" aria-labelledby="priority-title">
              <div className="admin-panel-heading admin-priority-heading">
                <div>
                  <p className="admin-section-label">Needs attention</p>
                  <h2 id="priority-title">The work that changes the next outcome.</h2>
                  <p>These are deliberate entry points, not an unfiltered alert feed.</p>
                </div>
                <span className="admin-priority-count">{founderActions.length} FOCUS AREAS</span>
              </div>
            </section>

            <section className="admin-ledger-card" aria-labelledby="business-pipeline-title">
              <div className="admin-panel-heading">
                <div>
                  <p className="admin-section-label">Business revenue</p>
                  <h2 id="business-pipeline-title">Which employers are buying, and who stopped short.</h2>
                  <p>Team money is paid through Stripe but stored outside the purchases table. Internal accounts are excluded so the pipeline reflects real demand.</p>
                </div>
                <span className="admin-live-marker">{businessQ.isFetching ? "UPDATING" : businessQ.error ? "REFRESH NEEDED" : "STORED RECORDS"}</span>
              </div>
              <div className="admin-operating-grid" style={{ marginBottom: 18 }}>
                <div className="admin-operating-metric" style={{ cursor: "default" }}>
                  <span>Paid team orders</span>
                  <strong>{businessQ.isLoading ? "…" : businessQ.data?.paidOrders ?? "—"}</strong>
                  <small>{businessQ.data ? `${formatAdminCurrency(businessQ.data.paidRevenueCAD)} across ${businessQ.data.licencesSold} licences` : "Completed team payments"}</small>
                </div>
                <div className="admin-operating-metric" style={{ cursor: "default" }}>
                  <span>Unpaid team orders</span>
                  <strong>{businessQ.isLoading ? "…" : businessQ.data?.abandonedOrders ?? "—"}</strong>
                  <small>{businessQ.data ? `${formatAdminCurrency(businessQ.data.abandonedValueCAD)} quoted and not captured` : "Built but never paid"}</small>
                </div>
                <div className="admin-operating-metric" style={{ cursor: "default" }}>
                  <span>Active team plans</span>
                  <strong>{businessQ.isLoading ? "…" : businessQ.data?.activeTeamPlans ?? "—"}</strong>
                  <small>{businessQ.data ? `${businessQ.data.activeTeamSeats} seats under contract` : "Current organization plans"}</small>
                </div>
              </div>
              <div className="admin-ledger-table-wrap" role="region" aria-label="Team orders" tabIndex={0}>
                <table className="admin-ledger-table">
                  <thead>
                    <tr><th scope="col">Manager</th><th scope="col">Licences</th><th scope="col">Value</th><th scope="col">Status</th><th scope="col">Date</th></tr>
                  </thead>
                  <tbody>
                    {businessQ.isLoading && (
                      <tr><td colSpan={5}>Loading team orders…</td></tr>
                    )}
                    {!businessQ.isLoading && (businessQ.data?.orders.length ?? 0) === 0 && (
                      <tr><td colSpan={5}>No team orders recorded yet.</td></tr>
                    )}
                    {businessQ.data?.orders.map((order) => {
                      const paid = order.status === "paid";
                      const cents = paid ? order.paidCents : order.beforeTaxCents;
                      return (
                        <tr key={order.id}>
                          <th scope="row">{order.managerEmail}</th>
                          <td className="admin-ledger-value">{order.licences}</td>
                          <td className="admin-ledger-value">{formatAdminCurrency(Number(cents ?? 0) / 100)}</td>
                          <td>{paid ? "Paid" : "Not completed"}</td>
                          <td>{formatDate((paid ? order.paidAt : order.createdAt) ?? order.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-priority-card" aria-label="Founder priorities">
              <div className="admin-priority-list">
                {founderActions.map((item) => (
                  <button key={item.number} type="button" className="admin-priority-item" onClick={() => selectSection(item.tab)}>
                    <span className="admin-priority-number">{item.number}</span>
                    <span className="admin-priority-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
                    <span className="admin-priority-meta"><small>{item.status}</small><b>{item.action}</b></span>
                  </button>
                ))}
              </div>
              <div className="admin-priority-note">
                <span>REVENUE / NEXT STEP</span>
                <strong>Use the source and denominator before treating a rate as a decision signal.</strong>
                <p>Checkout event ratios show recorded event counts. A matched conversion cohort needs identity and timing rules before it can guide a decision.</p>
              </div>
            </section>

            <section className="admin-product-scorecard" aria-labelledby="product-scorecard-title">
              <div className="admin-product-scorecard-header">
                <div>
                  <p className="admin-section-label">Product scorecard</p>
                  <h2 id="product-scorecard-title">Deeper operating signals</h2>
                  <p>Last 30 days unless stated otherwise. A dash means the denominator or outcome sample does not exist yet.</p>
                </div>
                {kpisQ.data && <span className="admin-scorecard-updated">Updated {formatDate(kpisQ.data.generatedAt)}</span>}
              </div>

              {kpisQ.isLoading && <div className="admin-panel-loading">Calculating product metrics…</div>}
              {kpisQ.error && <div className="admin-panel-error" role="alert">Metrics could not be loaded: {kpisQ.error.message}</div>}
              {kpisQ.data && (
                <>
                  <div className="admin-product-metrics">
                    {[
                      { label: "Marketing page views", value: kpisQ.data.funnel.marketingPageViews, note: "Privacy-safe public buyer-page views" },
                      { label: "Course choices", value: kpisQ.data.funnel.productSelections, note: `${kpisQ.data.funnel.buyerPathSelections} individual or team path selections` },
                      { label: "Free preview exhausted", value: kpisQ.data.funnel.previewGateHits, note: `${kpisQ.data.funnel.courseBrowses} course views while browsing` },
                      {
                        label: "Paywall email capture",
                        value: kpisQ.data.funnel.previewGateHits > 0
                          ? formatAdminPercent(kpisQ.data.funnel.previewPlansRequested / kpisQ.data.funnel.previewGateHits)
                          : "—",
                        note: `${kpisQ.data.funnel.previewPlansRequested} study plans requested by learners who finished the free preview`,
                      },
                      {
                        label: "Study plan capture",
                        value: kpisQ.data.funnel.previewPlansOffered > 0
                          ? formatAdminPercent(kpisQ.data.funnel.previewPlansRequested / kpisQ.data.funnel.previewPlansOffered)
                          : "—",
                        note: `${kpisQ.data.funnel.previewPlansRequested} of ${kpisQ.data.funnel.previewPlansOffered} learners shown the offer gave us their email`,
                      },
                      { label: "Checkout starts", value: kpisQ.data.funnel.checkoutStarts, note: `${kpisQ.data.funnel.checkoutCompletions} paid completions` },
                      {
                        label: "Team orders awaiting payment",
                        value: kpisQ.data.teamPipeline.ordersAwaitingPayment,
                        note: `CA$${kpisQ.data.teamPipeline.valueAwaitingPaymentCAD} unpaid of ${kpisQ.data.teamPipeline.ordersStarted} started, ${kpisQ.data.teamPipeline.ordersFollowedUp} followed up`,
                      },
                      {
                        label: "Team order close rate",
                        value: kpisQ.data.teamPipeline.ordersStarted > 0
                          ? formatAdminPercent(kpisQ.data.teamPipeline.ordersPaid / kpisQ.data.teamPipeline.ordersStarted)
                          : "—",
                        note: `${kpisQ.data.teamPipeline.ordersPaid} paid of ${kpisQ.data.teamPipeline.ordersStarted} manager orders configured`,
                      },
                      { label: "30-day learner return", value: formatAdminPercent(kpisQ.data.engagement.thirtyDayReturnRate), note: `${kpisQ.data.engagement.thirtyDayReturners} of ${kpisQ.data.engagement.thirtyDayReturnCohort} returned` },
                      { label: "Recorded study sessions", value: `${kpisQ.data.engagement.recordedStudySessionCompletions}/${kpisQ.data.engagement.recordedStudySessionStarts}`, note: "Completed / started sessions" },
                      { label: "Training records", value: kpisQ.data.engagement.trainingRecordsAttested, note: `${kpisQ.data.engagement.trainingHoursExports} training-hour exports` },
                      { label: "Time to first quiz", value: kpisQ.data.engagement.medianMinutesToFirstQuiz == null ? "—" : `${kpisQ.data.engagement.medianMinutesToFirstQuiz} min`, note: "Median after signup or activation" },
                      { label: "Comparable quiz improvement", value: kpisQ.data.engagement.quizImprovementPercentagePoints == null ? "—" : `${kpisQ.data.engagement.quizImprovementPercentagePoints >= 0 ? "+" : ""}${kpisQ.data.engagement.quizImprovementPercentagePoints} pts`, note: `${kpisQ.data.engagement.quizImprovementSampleSize} repeat standard-quiz series with the same course and length` },
                      { label: "Quiz completion", value: formatAdminPercent(kpisQ.data.commercial.quizCompletionRate), note: `${kpisQ.data.commercial.quizCompleters} of ${kpisQ.data.commercial.quizStarterCohortSize} identified starters` },
                      { label: "Pricing to checkout", value: formatAdminPercent(kpisQ.data.commercial.pricingToCheckoutRate), note: `${kpisQ.data.commercial.attributedCheckouts} of ${kpisQ.data.commercial.pricingCohortSize} pricing visitors` },
                      { label: "Team seat utilization", value: formatAdminPercent(kpisQ.data.teams.utilizationRate), note: `${kpisQ.data.teams.assignedSeats} allocated / ${kpisQ.data.teams.totalSeats} purchased` },
                      { label: "Reported exam pass rate", value: formatAdminPercent(kpisQ.data.outcomes.passRate), note: `${kpisQ.data.outcomes.passed} passed / ${kpisQ.data.outcomes.failed} failed` },
                      { label: "Refund rate", value: formatAdminPercent(kpisQ.data.commercial.refundRate), note: "Individual purchases created in period" },
                      { label: "Renewals / cancellations", value: `${kpisQ.data.commercial.renewals} / ${kpisQ.data.commercial.cancellations}`, note: "Tracked lifecycle events" },
                    ].map(metric => (
                      <div key={metric.label} className="admin-product-metric">
                        <div>{metric.label}</div>
                        <strong>{metric.value}</strong>
                        <small>{metric.note}</small>
                      </div>
                    ))}
                  </div>
                  <div className="admin-scorecard-notes">
                    <p><strong>Readiness calibration:</strong> learners who passed averaged <b>{kpisQ.data.outcomes.averageReadinessPassed ?? "—"}</b>; learners who failed averaged <b>{kpisQ.data.outcomes.averageReadinessFailed ?? "—"}</b>. Diagnostic completions: <b>{kpisQ.data.funnel.diagnosticCompletions}</b>. Mock exams completed: <b>{kpisQ.data.funnel.mockExamCompletions}</b>.</p>
                    <p><strong>Team breakdown:</strong> All-Access <b>{kpisQ.data.teams.allAccess.assignedSeats}/{kpisQ.data.teams.allAccess.totalSeats}</b> assigned; Course Pass <b>{kpisQ.data.teams.coursePass.allocatedLicences}/{kpisQ.data.teams.coursePass.totalLicences}</b> allocated and <b>{kpisQ.data.teams.coursePass.activatedLicences}</b> activated.</p>
                  </div>
                </>
              )}
            </section>

            <section className="admin-ceu-summary" aria-labelledby="ceu-summary-title">
              <div>
                <p className="admin-section-label">Continuing education pilot</p>
                <h2 id="ceu-summary-title">Learning records at a glance</h2>
                <p>Courses enrolled in the last 30 days, counted once per learner and course edition. Passing this pilot does not award CEUs.</p>
              </div>
              {ceuKpisQ.isLoading && <p className="admin-panel-loading">Loading course metrics…</p>}
              {ceuKpisQ.error && <p className="admin-panel-error" role="alert">Course metrics could not be loaded. <button type="button" className="admin-text-action" onClick={() => ceuKpisQ.refetch()}>Retry</button></p>}
              {ceuKpisQ.data && <div className="admin-ceu-table-wrap" role="region" aria-label="Continuing education pilot metrics" tabIndex={0}><table className="admin-ceu-table"><thead><tr><th>Enrolled</th><th>Started lessons</th><th>Modules completed</th><th>Final opened</th><th>Final submitted</th><th>Retakes</th><th>Passed</th><th>Certificate opened</th><th>Feedback</th></tr></thead><tbody><tr>
                {[ceuKpisQ.data.enrollments, ceuKpisQ.data.learningStarted, ceuKpisQ.data.modulesCompleted, ceuKpisQ.data.finalStarted, ceuKpisQ.data.finalSubmitted, ceuKpisQ.data.retries, ceuKpisQ.data.completed, ceuKpisQ.data.certificatesViewed, `${ceuKpisQ.data.evaluations} ratings (${ceuKpisQ.data.averageRating ?? "—"}/5)`].map((value, index) => <td key={index}>{value}</td>)}
              </tr></tbody></table><p className="admin-ceu-disclosure">Certificate views are measured from this release onward. Public views and failed network saves are not included in these record-based counts.</p></div>}
            </section>
          </>
        )}

        {/* ── CAPTURED LEADS TAB ── */}
        {activeTab === "leads" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
              {[
                { label: "People captured", value: leadsQ.data?.uniquePeople ?? "—", note: "Unique email addresses across every capture point" },
                { label: "Open leads", value: leadsQ.data?.openLeads ?? "—", note: "Captured and not yet a paying customer" },
                { label: "Enquiries to reply to", value: leadsQ.data?.actionableOpenLeads ?? "—", note: "Open inbound enquiries; not marketing consent" },
                { label: "Already bought", value: leadsQ.data?.convertedLeads ?? "—", note: "Captured people who later paid" },
                { label: "New in 7 days", value: leadsQ.data?.newLast7Days ?? "—", note: "Fresh leads worth contacting first" },
                { label: "New in 30 days", value: leadsQ.data?.newLast30Days ?? "—", note: "Recent capture volume" },
                { label: "Gave a phone", value: leadsQ.data?.withPhone ?? "—", note: "Reachable by call or text, not only email" },
              ].map(card => (
                <div key={card.label} style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{card.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{card.value}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, lineHeight: 1.4 }}>{card.note}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#F8FAFC", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    Every captured email
                    {leadsQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{leadsQ.data.uniquePeople} people</span>}
                  </div>
                  <p style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>Capture is not marketing consent. Copy enquiry addresses only to reply about that request; exports are operational records, not a promotional mailing list. Honour recorded opt-outs.</p>
                  {leadsQ.data && (
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                      Course trial {leadsQ.data.bySource.courseTrial} · Abandoned checkout {leadsQ.data.bySource.abandonedCheckout} · Contact form {leadsQ.data.bySource.contactForm} · Exam date booked {leadsQ.data.bySource.examDateBooked} · Waitlist {leadsQ.data.bySource.waitlist}
                    </div>
                  )}
                </div>
                {leadsQ.data && leadsQ.data.people.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      className="admin-btn"
                      onClick={() => copyAllEmails(leadsQ.data!.people.filter(isActionableLead).map(p => p.email))}
                      style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(0,0,0,0.1)", background: "transparent", color: "#0369A1", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {copiedEmail === "__all__" ? "✓ Copied" : "Copy open enquiry replies"}
                    </button>
                    <button
                      className="admin-btn"
                      onClick={() => downloadCSV(
                        leadsQ.data!.people.map(p => ({
                          email: p.email,
                          name: p.name ?? "",
                          phone: p.phone ?? "",
                          source: p.source,
                          all_sources: p.sources.join("; "),
                          detail: p.detail ?? "",
                          inquiry_subject: p.inquirySubject ?? "",
                          inquiry_organization: p.inquiryOrganization ?? "",
                          inquiry_message: p.inquiryMessage ?? "",
                          follow_up_status: p.contactFollowUpStatus ?? "",
                          trial_follow_up_stage: p.followUpStage ?? "",
                          opted_out: p.optedOut,
                          recovery_email_sent: p.recoveryEmailSentAt ? new Date(p.recoveryEmailSentAt).toISOString() : "",
                          touchpoints: p.touchpoints,
                          status: p.converted ? "bought" : "not_bought",
                          captured: new Date(p.createdAt).toISOString(),
                        })),
                        `echelon-captured-leads-${new Date().toISOString().slice(0, 10)}.csv`
                      )}
                      style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(0,0,0,0.1)", background: "transparent", color: "#6D28D9", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Download CSV
                    </button>
                  </div>
                )}
              </div>
              {leadsQ.data && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 20px", borderBottom: "1px solid #E2E8F0" }}>
                  <label htmlFor="admin-lead-filter" style={{ fontSize: 12, fontWeight: 700 }}>Show</label>
                  <select id="admin-lead-filter" value={leadFilter} onChange={event => setLeadFilter(event.target.value as typeof leadFilter)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff", fontSize: 12 }}>
                    <option value="actionable">Open inbound enquiries to reply to</option>
                    <option value="all">All captured people</option>
                    <option value="bought">Already bought</option>
                    <option value="opted_out">Opted out</option>
                  </select>
                  <span style={{ fontSize: 11, color: "#64748B" }}>{leadFilter === "actionable" ? leadsQ.data.actionableOpenLeads : leadFilter === "all" ? leadsQ.data.uniquePeople : leadFilter === "bought" ? leadsQ.data.convertedLeads : leadsQ.data.optedOutPeople} matching people</span>
                </div>
              )}
              {leadsQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
              {leadsQ.error && (
                <div style={{ padding: 32, textAlign: "center", color: "#B91C1C", fontSize: 13 }}>
                  Captured leads could not be loaded. Use Refresh to try again.
                </div>
              )}
              {leadsQ.data && leadsQ.data.people.length === 0 && (
                <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No captured leads yet.</div>
              )}
              {leadsQ.data && leadsQ.data.people.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                        {["#", "Email", "Name", "Phone", "Source", "Inquiry & product", "Sales status", "Follow-up", "Captured", ""].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leadsQ.data.people.filter(person => matchesLeadTriageFilter(person, leadFilter)).map((person, index) => (
                        <tr key={person.email.toLowerCase()} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#64748B" }}>{index + 1}</td>
                          <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 600 }}>{person.email}</td>
                          <td style={{ padding: "10px 16px", fontSize: 12 }}>{person.name ?? "—"}</td>
                          <td style={{ padding: "10px 16px", fontSize: 12 }}>{person.phone ?? "—"}</td>
                          <td style={{ padding: "10px 16px", fontSize: 12, whiteSpace: "nowrap" }}>{person.sources.join(", ")}{person.touchpoints > 1 ? ` · ${person.touchpoints} entries` : ""}</td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#475569", maxWidth: 320 }}>
                            {person.inquirySubject ?? person.detail ?? "—"}
                            {person.inquiryOrganization && <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>Organization: {person.inquiryOrganization}</div>}
                            {person.inquiryMessage ? (
                              <details style={{ marginTop: 4 }}>
                                <summary style={{ cursor: "pointer", color: "#0369A1", fontSize: 11 }}>Read contact message</summary>
                                <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 11, marginTop: 4 }}>{person.inquiryMessage}</div>
                              </details>
                            ) : person.note ? <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{person.note}</div> : null}
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: person.converted ? "#15803D" : "#B45309", whiteSpace: "nowrap" }}>
                            {person.converted ? "Bought" : "Not bought"}
                            {person.optedOut && <div style={{ color: "#B91C1C" }}>Opted out — no marketing</div>}
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 11, minWidth: 160 }}>
                            {person.contactRequestId ? (
                              <label style={{ display: "grid", gap: 4, color: "#475569" }}>
                                Inquiry follow-up
                                <select
                                  aria-label={"Follow-up status for " + person.email}
                                  value={person.contactFollowUpStatus ?? "new"}
                                  disabled={markContactFollowUp.isPending}
                                  onChange={event => markContactFollowUp.mutate({ id: person.contactRequestId!, status: event.target.value as "new" | "contacted" | "closed" })}
                                  style={{ fontSize: 11, background: "#fff", border: "1px solid #CBD5E1", padding: "4px 6px", borderRadius: 6 }}
                                >
                                  <option value="new">New</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="closed">Closed</option>
                                </select>
                              </label>
                            ) : person.followUpStage !== null ? <span>Trial sequence: {person.followUpStage}/2</span>
                              : person.recoveryEmailSentAt ? <span>Checkout recovery email sent</span>
                              : <span style={{ color: "#64748B" }}>No follow-up recorded</span>}
                            {person.recoveredAt && <div style={{ color: "#15803D", marginTop: 4 }}>Checkout recovered</div>}
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>{formatDate(person.createdAt)}</td>
                          <td style={{ padding: "10px 16px" }}>
                            <button
                              className="admin-btn"
                              onClick={() => { if (isActionableLead(person)) copyEmail(person.email); }}
                              disabled={!isActionableLead(person)}
                              title={isActionableLead(person) ? "Reply only about the submitted enquiry; not marketing permission" : "No open inbound enquiry eligible for reply"}
                              style={{ padding: "4px 10px", borderRadius: 16, border: "1px solid rgba(0,0,0,0.1)", background: "transparent", color: "#0369A1", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                            >
                              {copiedEmail === person.email ? "✓" : "Copy for reply"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TRIAL EMAILS TAB ── */}
        {activeTab === "trials" && (
          <div style={{ background: "#F8FAFC", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                📧 Trial Email Signups
                {trialsQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{trialsQ.data.length} total</span>}
              </div>
              {trialsQ.data && trialsQ.data.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="admin-btn"
                      onClick={() => copyAllEmails(consentedTrialEmails(trialsQ.data!))}
                      disabled={consentedTrialEmails(trialsQ.data).length === 0}
                      title="Trial capture alone is not marketing consent. No consent evidence is available for bulk copying."
                    style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#38BDF8", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {copiedEmail === "__all__" ? "✓ Copied!" : "No marketing consent verified"}
                  </button>
                  <button
                    className="admin-btn"
                    onClick={() => downloadCSV(
                      trialsQ.data!.map(r => ({ email: r.email, phone: r.phone ?? "", course: r.source, follow_up_stage: r.followUpStage, last_follow_up_at: r.lastFollowUpAt ? new Date(r.lastFollowUpAt).toISOString() : "", opted_out: r.optOut, signed_up: new Date(r.createdAt).toISOString() })),
                      `echelon-trial-emails-${new Date().toISOString().slice(0,10)}.csv`
                    )}
                    style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#A78BFA", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    ⬇ Download CSV
                  </button>
                </div>
              )}
            </div>
            {trialsQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
            {trialsQ.data && trialsQ.data.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No trial signups yet.</div>
            )}
            {trialsQ.data && trialsQ.data.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                    {["#", "Email", "Phone", "Course", "Follow-up", "Date"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                    <th style={{ padding: "10px 16px" }} />
                  </tr>
                </thead>
                <tbody>
                  {trialsQ.data.map((row, i) => (
                    <tr key={row.id} className="admin-row" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: "#475569" }}>{i + 1}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#334155" }}>{row.email}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12 }}>
                        {row.phone
                          ? <a href={`tel:${row.phone}`} style={{ color: "#0369A1", textDecoration: "none" }}>{row.phone}</a>
                          : <span style={{ color: "#94A3B8" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 100, background: "#1D4ED820", color: "#38BDF8", fontSize: 10, fontWeight: 700 }}>{row.source}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: row.optOut ? "#B91C1C" : "#475569" }}>
                        {row.optOut ? "Opted out" : "Stage " + row.followUpStage + "/2"}
                        {row.lastFollowUpAt && <div>{formatDate(row.lastFollowUpAt)}</div>}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748B" }}>{formatDate(row.createdAt)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          className="admin-btn"
                          onClick={() => { if (!row.optOut) copyEmail(row.email); }}
                          disabled={row.optOut}
                          title={row.optOut ? "Marketing opt-out" : "Copy address for operational use only; no marketing consent verified"}
                          style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", background: "transparent", color: "#64748B", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          {row.optOut ? "Opted out" : copiedEmail === row.email ? "✓" : "Copy"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── WAITLIST TAB ── */}
        {activeTab === "waitlist" && (
          <div style={{ background: "#F8FAFC", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                📋 Waitlist Signups
                {waitlistQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{waitlistQ.data.length} total</span>}
              </div>
              {waitlistQ.data && waitlistQ.data.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="admin-btn"
                    onClick={() => copyAllEmails(waitlistQ.data!.map(r => r.email))}
                    style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#34D399", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {copiedEmail === "__all__" ? "✓ Copied!" : "📋 Copy All Emails"}
                  </button>
                  <button
                    className="admin-btn"
                    onClick={() => downloadCSV(
                      waitlistQ.data!.map(r => ({ email: r.email, course_code: r.courseCode, course_title: r.courseTitle, signed_up: new Date(r.createdAt).toISOString() })),
                      `echelon-waitlist-${new Date().toISOString().slice(0,10)}.csv`
                    )}
                    style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#A78BFA", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    ⬇ Download CSV
                  </button>
                </div>
              )}
            </div>
            {waitlistQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
            {waitlistQ.data && waitlistQ.data.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No waitlist signups yet.</div>
            )}
            {waitlistQ.data && waitlistQ.data.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                    {["#", "Email", "Course", "Date"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                    <th style={{ padding: "10px 16px" }} />
                  </tr>
                </thead>
                <tbody>
                  {waitlistQ.data.map((row, i) => (
                    <tr key={row.id} className="admin-row" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: "#475569" }}>{i + 1}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#334155" }}>{row.email}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#34D399" }}>{row.courseCode}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{row.courseTitle}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748B" }}>{formatDate(row.createdAt)}</td>
                      <td style={{ padding: "12px 16px", display: "flex", gap: 6 }}>
                        <button
                          className="admin-btn"
                          onClick={() => copyEmail(row.email)}
                          style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", background: "transparent", color: "#64748B", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          {copiedEmail === row.email ? "✓" : "Copy"}
                        </button>
                        <button
                          className="admin-btn"
                          onClick={() => { if (confirm(`Remove ${row.email} from ${row.courseCode} waitlist?`)) removeWaitlist.mutate({ id: row.id }); }}
                          style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#F87171", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── SCORE HISTORY TAB ── */}
        {activeTab === "scores" && (
          <div style={{ background: "#F8FAFC", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                📊 Exam Score History
                {scoresQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{scoresQ.data.length} results</span>}
              </div>
              {scoresQ.data && scoresQ.data.length > 0 && (
                <button
                  className="admin-btn"
                  onClick={() => downloadCSV(
                    scoresQ.data!.map(scoreHistoryCsvRow),
                    `echelon-score-history-${new Date().toISOString().slice(0,10)}.csv`
                  )}
                  style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#A78BFA", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  ⬇ Download CSV
                </button>
              )}
            </div>
            <p style={{ padding: "12px 20px", margin: 0, fontSize: 11, color: "#475569" }}>Saved at shows when the result was recorded, in your browser's local time zone. Duration is the time spent on the exam.</p>
            {scoresQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
            {scoresQ.error && <div role="alert" className="admin-panel-error">Score history could not be loaded. Use Refresh to try again.</div>}
            {scoresQ.data && scoresQ.data.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No exam results yet.</div>
            )}
            {scoresQ.data && scoresQ.data.length > 0 && (
              <div className="admin-score-table-wrap" role="region" aria-label="Exam score history" tabIndex={0}>
              <table className="admin-score-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                    {["#", "Learner", "Exam", "Score", "Result", "Duration", "Saved at"].map(h => (
                      <th scope="col" key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scoresQ.data.map((row, i) => {
                    const pct = Math.round(row.score / row.total * 100);
                    const passed = row.passed === "yes";
                    const typeStyle = EXAM_TYPE_COLORS[row.examType] ?? { bg: "rgba(0,0,0,0.07)", color: "#64748B" };
                    const timeTaken = row.timeTakenSeconds !== null ? `${Math.floor(row.timeTakenSeconds / 60)}m ${row.timeTakenSeconds % 60}s` : "Not recorded";
                    const learner = scoreLearnerIdentity(row);
                    const savedAt = formatScoreSavedAt(row.createdAt);
                    return (
                      <tr key={row.id} className="admin-row" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: "#475569" }}>{i + 1}</td>
                        <td className="admin-score-learner" style={{ padding: "12px 16px" }}>
                          <strong>{learner.name}</strong>
                          <span>{learner.email}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 100, background: typeStyle.bg + "30", color: typeStyle.color, fontSize: 10, fontWeight: 700 }}>
                            {EXAM_TYPE_LABELS[row.examType] ?? row.examType.toUpperCase()}
                          </span>
                          {row.stream && <span style={{ marginLeft: 6, fontSize: 10, color: "#64748B" }}>{row.stream}</span>}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: passed ? "#34D399" : "#F87171" }}>{pct}%</span>
                          <span style={{ marginLeft: 6, fontSize: 11, color: "#64748B" }}>{row.score}/{row.total}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 100, background: passed ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", color: passed ? "#34D399" : "#F87171", fontSize: 10, fontWeight: 700 }}>
                            {passed ? "PASS" : "FAIL"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748B" }}>{timeTaken}</td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: "#475569" }}>
                          <time dateTime={savedAt.iso} className="admin-score-saved-at"><strong>{savedAt.date}</strong><span>{savedAt.time}</span></time>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        )}

        {/* -- REVENUE TAB -- */}
        {activeTab === "revenue" && (
          <div style={{ background: "#F8FAFC", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
            <PurchaseEmailDelivery />
            <section aria-label="Reconciled revenue breakdown" style={{ padding: "20px", background: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0F172A" }}>Reconciled recorded revenue</h2>
                  <p style={{ fontSize: 12, color: "#64748B", marginTop: 5 }}>Includes qualifying individual purchases, active paid subscriptions and team payments — with known recovery backfill duplicates removed.</p>
                </div>
                <strong style={{ color: "#0F766E", fontSize: 24 }}>{stats.isLoading ? "…" : stats.data ? formatAdminCurrency(stats.data.totalRevenueCAD) : "Unavailable"}</strong>
              </div>
              {stats.error && <p role="alert" className="admin-panel-error">Revenue reconciliation could not be loaded. Refresh the page to retry.</p>}
              {stats.data && (
                <div className="admin-operating-grid" style={{ marginTop: 12 }}>
                  {[
                    { label: "Individual purchase payments", amount: stats.data.revenueBreakdown.purchasesCAD },
                    { label: "Active subscription records", amount: stats.data.revenueBreakdown.subscriptionsCAD },
                    { label: "Team Flex revenue added", amount: stats.data.revenueBreakdown.teamFlexAddedCAD },
                    { label: "Team payments already counted", amount: stats.data.revenueBreakdown.teamFlexAlreadyCountedCAD },
                  ].map(entry => (
                    <div key={entry.label} className="admin-operating-metric" style={{ cursor: "default" }}>
                      <span>{entry.label}</span><strong style={{ fontSize: 20 }}>{formatAdminCurrency(entry.amount)}</strong>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ color: "#64748B", fontSize: 11, marginTop: 12 }}>The last figure is a duplicate-detection cross-check and is not added again. Do not sum the individual purchase rows or gross team orders below to reproduce total revenue.</p>
            </section>
            <section aria-label="Team Flex order ledger" style={{ padding: "18px 20px", background: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div><h2 style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#0F172A" }}>Team Flex orders</h2>
                  <p style={{ margin: "5px 0 0", color: "#64748B", fontSize: 11 }}>Latest 50 team orders, paid and pending. Pending orders are not revenue.</p></div>
                {businessQ.data && businessQ.data.orders.length > 0 && (
                  <button type="button" className="admin-btn" style={{ border: "1px solid #CBD5E1", borderRadius: 8, padding: "7px 12px", background: "#F8FAFC", cursor: "pointer" }}
                    onClick={() => downloadCSV(businessQ.data!.orders.map(order => ({
                      id: order.id,
                      manager: order.managerEmail,
                      organization_id: order.organizationId,
                      licences: order.licences,
                      status: order.status,
                      paid_cad: order.status === "paid" ? Number(order.paidCents ?? 0) / 100 : "",
                      quoted_pre_tax_cad: order.status === "pending" ? Number(order.beforeTaxCents ?? 0) / 100 : "",
                      created_at: new Date(order.createdAt).toISOString(),
                    })), "echelon-team-order-ledger.csv")}>Export team orders</button>
                )}
              </div>
              {businessQ.error && <p role="alert" className="admin-panel-error">Team orders could not be loaded. Select Refresh to retry.</p>}
              {businessQ.isLoading && <p style={{ fontSize: 12, color: "#64748B" }}>Loading team orders…</p>}
              {businessQ.data && (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 16, margin: "12px 0", fontSize: 12, color: "#334155" }}>
                    <span><strong>{businessQ.data.paidOrders}</strong> paid orders · {formatAdminCurrency(businessQ.data.paidRevenueCAD)} gross team payments</span>
                    <span><strong>{businessQ.data.abandonedOrders}</strong> pending orders · {formatAdminCurrency(businessQ.data.abandonedValueCAD)} quoted pre-tax</span>
                  </div>
                  {businessQ.data.orders.length === 0 ? <p style={{ fontSize: 12, color: "#64748B" }}>No team orders recorded.</p> : (
                    <div role="region" aria-label="Team order history" tabIndex={0} style={{ overflowX: "auto" }}>
                      <table className="admin-ledger-table">
                        <thead><tr><th>Manager</th><th>Seats</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead>
                        <tbody>{businessQ.data.orders.map(order => (
                          <tr key={order.id}>
                            <td style={{ overflowWrap: "anywhere" }}>{order.managerEmail}</td>
                            <td>{order.licences}</td>
                            <td>{order.status === "paid" ? formatAdminCurrency(Number(order.paidCents ?? 0) / 100) : formatAdminCurrency(Number(order.beforeTaxCents ?? 0) / 100)} <small>{order.status === "paid" ? "received" : "quoted pre-tax"}</small></td>
                            <td>{order.status}</td>
                            <td>{formatDate(order.createdAt)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </section>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                Individual purchase records
                {purchasesQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{purchasesQ.data.length} latest rows (up to 500)</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {purchasesQ.data && purchasesQ.data.length > 0 && (
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#34D399" }}>
                    Listed row amounts only; not a reconciled revenue total
                  </div>
                )}
                <button
                  className="admin-btn"
                  onClick={() => reconcile.mutate({ hoursBack: 48 })}
                  disabled={reconcile.isPending}
                  title="Check Stripe for missing paid purchase records. This is read-only and will not grant access."
                  style={{ fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "1px solid #A5C8D1", background: "#E7F2F4", color: "#115368", cursor: reconcile.isPending ? "not-allowed" : "pointer", opacity: reconcile.isPending ? 0.6 : 1, fontFamily: "inherit" }}
                >
                  {reconcile.isPending ? "Checking..." : "Check Stripe (48h)"}
                </button>
                <button
                  className="admin-btn"
                  onClick={() => reconcileSubs.mutate()}
                  disabled={reconcileSubs.isPending}
                  title="Backfill any subscriptions dropped by the period-end bug. Safe to run multiple times — idempotent."
                  style={{ fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.12)", color: "#34D399", cursor: reconcileSubs.isPending ? "not-allowed" : "pointer", opacity: reconcileSubs.isPending ? 0.6 : 1, fontFamily: "inherit" }}
                >
                  {reconcileSubs.isPending ? "Syncing..." : "Sync Subscriptions"}
                </button>
                <button
                  className="admin-btn"
                  onClick={() => backfillContact.mutate()}
                  disabled={backfillContact.isPending}
                  title="Look up phone & name from Stripe for any purchases or subscriptions that are missing them. Safe to run multiple times."
                  style={{ fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(251,191,36,0.4)", background: "rgba(251,191,36,0.12)", color: "#FCD34D", cursor: backfillContact.isPending ? "not-allowed" : "pointer", opacity: backfillContact.isPending ? 0.6 : 1, fontFamily: "inherit" }}
                >
                  {backfillContact.isPending ? "Backfilling..." : "Backfill Contact Info"}
                </button>
              </div>
            </div>
            {purchasesQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
            {purchasesQ.data && purchasesQ.data.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No purchases yet. Share the pricing page to get your first sale!</div>
            )}
            {purchasesQ.data && purchasesQ.data.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                      {["#", "Product", "Name", "Email", "Phone", "Amount", "Date"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {purchasesQ.data.map((row, i) => (
                      <tr key={row.id} className="admin-row" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: "#475569" }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#1E293B" }}>{row.productName}</div>
                          <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{row.productKey}</div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#1E293B", fontWeight: 600 }}>{(row as any).customerName ?? <span style={{ color: "#334155", fontWeight: 400 }}>—</span>}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748B" }}>{row.email}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748B" }}>{(row as any).phone ?? <span style={{ color: "#334155" }}>—</span>}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "#34D399" }}>CA${(row.amountCAD / 100).toFixed(2)}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748B" }}>{formatDate(row.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* -- SUBSCRIPTIONS TAB -- */}
        {activeTab === "subscriptions" && (
          <div style={{ background: "#F8FAFC", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                🔄 Active Subscribers
                {subscriptionsQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{subscriptionsQ.data.length} subscriber{subscriptionsQ.data.length === 1 ? "" : "s"}</span>}
              </div>
              <button
                className="admin-btn"
                onClick={() => reconcileSubs.mutate()}
                disabled={reconcileSubs.isPending}
                title="Backfill any subscriptions dropped by the period-end bug."
                style={{ fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.12)", color: "#34D399", cursor: reconcileSubs.isPending ? "not-allowed" : "pointer", opacity: reconcileSubs.isPending ? 0.6 : 1, fontFamily: "inherit" }}
              >
                {reconcileSubs.isPending ? "Syncing..." : "Sync Subscriptions"}
              </button>
            </div>
            {subscriptionsQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
            {subscriptionsQ.data && subscriptionsQ.data.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No subscribers yet.</div>
            )}
            {subscriptionsQ.data && subscriptionsQ.data.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                      {["#", "Tier", "Name", "Email", "Phone", "Province", "Status", "Renews", "Date"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionsQ.data.map((row, i) => {
                      const statusColors: Record<string, { bg: string; color: string }> = {
                        active: { bg: "rgba(52,211,153,0.15)", color: "#059669" },
                        past_due: { bg: "rgba(251,191,36,0.15)", color: "#D97706" },
                        cancelled: { bg: "rgba(239,68,68,0.15)", color: "#DC2626" },
                        expired: { bg: "rgba(100,116,139,0.15)", color: "#64748B" },
                      };
                      const sc = statusColors[row.status] ?? { bg: "rgba(0,0,0,0.07)", color: "#475569" };
                      const tierLabel = row.tier === "all-access" ? "All Access" : row.tier.charAt(0).toUpperCase() + row.tier.slice(1);
                      return (
                        <tr key={row.id} className="admin-row" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                          <td style={{ padding: "12px 16px", fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>#{i + 1}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#6366F1" }}>{tierLabel}</span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "#1E293B", fontWeight: 500 }}>{row.customerName || <span style={{ color: "#94A3B8" }}>—</span>}</td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "#475569" }}>{row.email}</td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "#475569" }}>{row.phone || <span style={{ color: "#94A3B8" }}>—</span>}</td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "#475569", textTransform: "capitalize" }}>{row.province}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ padding: "3px 8px", borderRadius: 100, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 700, textTransform: "capitalize" }}>{row.status}</span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748B" }}>
                            {row.currentPeriodEnd ? new Date(row.currentPeriodEnd).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748B" }}>{formatDate(row.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* -- SYSTEM HEALTH TAB -- */}
        {activeTab === "health" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#F8FAFC", borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  🩺 System Health
                  {healthQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>Last checked: {formatDate(healthQ.data.timestamp)}</span>}
                </div>
                <button className="admin-btn" onClick={() => healthQ.refetch()} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>↻ Refresh</button>
              </div>
              {healthQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Running checks…</div>}
              {healthQ.data && (
                <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                  {healthQ.data.checks.map((c) => {
                    const statusColor = c.status === "ok" ? "#34D399" : c.status === "warn" ? "#FBBF24" : "#F87171";
                    const statusBg = c.status === "ok" ? "rgba(52,211,153,0.08)" : c.status === "warn" ? "rgba(251,191,36,0.08)" : "rgba(248,113,113,0.08)";
                    const statusIcon = c.status === "ok" ? "✅" : c.status === "warn" ? "⚠️" : "❌";
                    return (
                      <div key={c.name} style={{ padding: "14px 16px", borderRadius: 12, background: statusBg, border: `1px solid ${statusColor}30` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 14 }}>{statusIcon}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{c.name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>{c.detail}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent activity in last 24h (purchases + new subscriptions) */}
            {healthQ.data && (
              <div style={{ background: "#F8FAFC", borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    💳 Recent Activity (Last 24h)
                    <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{healthQ.data.recentPurchases.length} transaction(s)</span>
                  </div>
                </div>
                {healthQ.data.recentPurchases.length === 0 && (
                  <div style={{ padding: 32, textAlign: "center", color: "#475569", fontSize: 13 }}>No purchases or new subscriptions in the last 24 hours.</div>
                )}
                {healthQ.data.recentPurchases.length > 0 && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                          {["Type", "Product / Tier", "Email", "Amount", "Time"].map(h => (
                            <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {healthQ.data.recentPurchases.map((row: any, i: number) => (
                          <tr key={i} className="admin-row" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ padding: "3px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                                background: row.type === "subscription" ? "rgba(244,114,182,0.15)" : "rgba(56,189,248,0.15)",
                                color: row.type === "subscription" ? "#DB2777" : "#0284C7"
                              }}>
                                {row.type === "subscription" ? "Subscription" : "Purchase"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#1E293B" }}>{row.productKey}</td>
                            <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748B" }}>{row.email}</td>
                            <td style={{ padding: "12px 16px" }}>
                              {row.type === "subscription"
                                ? <span style={{ fontSize: 12, color: "#94A3B8" }}>Monthly</span>
                                : <span style={{ fontSize: 13, fontWeight: 800, color: "#34D399" }}>CA${(row.amountCAD / 100).toFixed(2)}</span>
                              }
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748B" }}>{formatDate(row.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* -- ERROR REPORTS TAB -- */}
        {activeTab === "errors" && (
          <div style={{ background: "#F8FAFC", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                🐛 Question Error Reports
                {errorsQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{errorsQ.data.length} open</span>}
              </div>
            </div>
            {errorsQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
            {errorsQ.data && errorsQ.data.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No error reports. 🎉</div>
            )}
            {errorsQ.data && errorsQ.data.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {errorsQ.data.map((row) => {
                  const typeStyle = REPORT_TYPE_COLORS[row.reportType] ?? REPORT_TYPE_COLORS.other;
                  return (
                    <div key={row.id} className="admin-row" style={{ padding: "16px 20px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ padding: "3px 10px", borderRadius: 100, background: typeStyle.bg, color: typeStyle.color, fontSize: 10, fontWeight: 700 }}>
                              {REPORT_TYPE_LABELS[row.reportType] ?? row.reportType}
                            </span>
                            <span style={{ padding: "3px 10px", borderRadius: 100, background: "rgba(0,0,0,0.07)", color: "#64748B", fontSize: 10, fontWeight: 600 }}>
                              Q{row.questionId} · {row.module}
                            </span>
                            <span style={{ fontSize: 10, color: "#475569" }}>{formatDate(row.createdAt)}</span>
                          </div>
                          <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, marginBottom: row.details ? 6 : 0 }}>
                            {row.questionText}
                          </div>
                          {row.details && (
                            <div style={{ fontSize: 12, color: "#64748B", marginTop: 6, padding: "8px 12px", background: "rgba(0,0,0,0.04)", borderRadius: 8, lineHeight: 1.5 }}>
                              <strong style={{ color: "#64748B" }}>Details:</strong> {row.details}
                            </div>
                          )}
                        </div>
                        <button
                          className="admin-btn"
                          onClick={() => { if (confirm("Mark this error report as resolved and dismiss it?")) dismissError.mutate({ id: row.id }); }}
                          disabled={dismissError.isPending}
                          style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(52,211,153,0.3)", background: "transparent", color: "#34D399", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
                        >
                          ✓ Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -- FEEDBACK TAB -- */}
        {activeTab === "feedback" && (
          <div style={{ background: "#F8FAFC", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                💬 User Feedback
                {feedbackQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{feedbackQ.data.length} entries</span>}
              </div>
              {feedbackQ.data && feedbackQ.data.length > 0 && (
                <button
                  className="admin-btn"
                  onClick={() => downloadCSV(feedbackQ.data!.map(r => ({
                    id: r.id,
                    rating: r.rating,
                    comment: r.comment ?? "",
                    examType: r.examType,
                    feedbackType: r.feedbackType,
                    email: r.email ?? "",
                    userId: r.userId ?? "",
                    createdAt: formatDate(r.createdAt),
                  })), "echelon-feedback.csv")}
                  style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(56,189,248,0.3)", background: "transparent", color: "#38BDF8", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  ⬇ Export CSV
                </button>
              )}
            </div>
            {feedbackQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
            {feedbackQ.data && feedbackQ.data.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No feedback yet.</div>
            )}
            {feedbackQ.data && feedbackQ.data.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {feedbackQ.data.map((row) => {
                  const examStyle = EXAM_TYPE_COLORS[row.examType] ?? { bg: "#F1F5F9", color: "#475569" };
                  const stars = "★".repeat(row.rating) + "☆".repeat(5 - row.rating);
                  return (
                    <div key={row.id} className="admin-row" style={{ padding: "16px 20px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 16, color: "#FBBF24", letterSpacing: 2 }}>{stars}</span>
                            <span style={{ padding: "3px 10px", borderRadius: 100, background: examStyle.bg, color: examStyle.color, fontSize: 10, fontWeight: 700 }}>
                              {EXAM_TYPE_LABELS[row.examType] ?? row.examType}
                            </span>
                            <span style={{ padding: "3px 10px", borderRadius: 100, background: row.feedbackType === "quiz_gate" ? "#FEF9C3" : "#DBEAFE", color: row.feedbackType === "quiz_gate" ? "#A16207" : "#1D4ED8", fontSize: 10, fontWeight: 700 }}>
                              {row.feedbackType === "quiz_gate" ? "Trial Gate" : "Session End"}
                            </span>
                            <span style={{ fontSize: 10, color: "#475569" }}>{formatDate(row.createdAt)}</span>
                          </div>
                          {row.comment && (
                            <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, marginBottom: 4 }}>
                              "{row.comment}"
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                            {row.email ? row.email : row.userId ? `User #${row.userId}` : "Anonymous"}
                          </div>
                        </div>
                        <button
                          className="admin-btn"
                          onClick={() => { if (confirm("Delete this feedback entry?")) dismissFeedback.mutate({ id: row.id }); }}
                          disabled={dismissFeedback.isPending}
                          style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#F87171", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -- QUESTION GOVERNANCE TAB -- */}
        {activeTab === "questions" && (
          <div style={{ background: "#F8FAFC", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>✓ Question sourcing and review</div>
              <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
                Review the answer, rationale and distractors against a primary source. Publishing an approval makes the question learner-visible. Reviewer identity and time are recorded by the server.
              </div>
            </div>
            {governanceStatsQ.data && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(110px, 1fr))", gap: 8, padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", overflowX: "auto" }}>
                {[
                  ["Total", governanceStatsQ.data.total],
                  ["Unreviewed", governanceStatsQ.data.unreviewed],
                  ["In review", governanceStatsQ.data.inReview],
                  ["Approved", governanceStatsQ.data.approved],
                  ["Missing source", governanceStatsQ.data.missingSource],
                ].map(([label, value]) => (
                  <div key={String(label)} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>{String(value)}</div>
                    <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700 }}>{String(label)}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <label htmlFor="question-review-filter" style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>Queue:</label>
              <select
                id="question-review-filter"
                value={reviewFilter}
                onChange={(event) => { setReviewFilter(event.target.value as ReviewStatus); setReviewPage(1); setReviewingQuestionId(null); }}
                style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff", fontFamily: "inherit", fontSize: 11 }}
              >
                <option value="unreviewed">Unreviewed</option>
                <option value="in_review">In review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <label htmlFor="question-review-bank" style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>Bank:</label>
              <select id="question-review-bank" value={reviewBank} onChange={event => { setReviewBank(event.target.value); setReviewPage(1); setReviewingQuestionId(null); }} style={{ maxWidth: "min(100%, 330px)", padding: "7px 10px", borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff", fontFamily: "inherit", fontSize: 11 }}>
                <option value="">All banks</option>
                {governanceBanksQ.data?.map(bank => <option value={bank.bankKey} key={bank.bankKey}>{EXAM_TYPE_LABELS[bank.bankKey] || bank.bankKey} ({bank.total})</option>)}
              </select>
              {governanceQueueQ.data && <span style={{ fontSize: 11, color: "#526779" }}>{governanceQueueQ.data.total} matching questions</span>}
            </div>
            {governanceQueueQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading review queue…</div>}
            {governanceQueueQ.error && <div role="alert" style={{ padding: 20, color: "#B91C1C" }}>Question review could not be loaded: {governanceQueueQ.error.message}</div>}
            {governanceQueueQ.data?.rows.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#64748B", fontSize: 13 }}>No questions in this review state.</div>}
            {governanceQueueQ.data?.rows.map((row) => {
              const options = parseReviewOptions(row.options);
              const answerValid = !!options && row.correctIndex >= 0 && row.correctIndex < 4;
              return (
              <div key={row.id} className="admin-review-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 580px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 100, background: "#DBEAFE", color: "#1D4ED8", fontSize: 10, fontWeight: 800 }}>{row.bankKey} #{row.questionNum}</span>
                      <span style={{ fontSize: 10, color: "#64748B" }}>{row.module}</span>
                      <span style={{ fontSize: 10, color: "#64748B", textTransform: "capitalize" }}>{row.reviewStatus.replace("_", " ")}</span>
                    </div>
                    <div style={{ fontSize: 14, color: "#15283A", lineHeight: 1.6, fontWeight: 700 }}>{row.question}</div>
                    {answerValid ? <ol className="admin-review-options">{options!.map((option, index) => <li className="admin-review-option" data-correct={index === row.correctIndex} key={index}><strong>{String.fromCharCode(65 + index)}.</strong> {option} {index === row.correctIndex && <span> · Keyed answer</span>}</li>)}</ol>
                      : <div role="alert" className="admin-review-detail" style={{ color: "#B91C1C" }}>Answer options or keyed answer are invalid. Fix the source data before approving.</div>}
                    <div className="admin-review-detail"><strong>Rationale:</strong> {row.explanation || "Missing explanation"}</div>
                    {row.steps && <div className="admin-review-detail"><strong>Calculation steps:</strong><ol style={{ margin: "8px 0 0", paddingLeft: 20 }}>{formatReviewSteps(row.steps).map((step, index) => <li key={index}>{step}</li>)}</ol></div>}
                    <div style={{ fontSize: 11, color: "#526779" }}>Difficulty: {row.difficulty || "not set"} · Calculation: {row.isCalc === "yes" ? "yes" : "no"}</div>
                    {(row.sourceTitle || row.sourceReference) && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
                        Source: {row.sourceTitle || "—"}{row.sourceReference ? ` — ${row.sourceReference}` : ""}{row.sourceUrl && <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, color: "#036B71" }}>Open source ↗</a>}
                        {row.reviewedBy ? ` · Reviewed by ${row.reviewedBy}` : ""}
                        {row.reviewedAt ? ` on ${formatDate(row.reviewedAt)}` : ""}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {row.reviewStatus === "unreviewed" && (
                      <button className="admin-btn" onClick={() => setQuestionReviewState(row, "in_review")} disabled={reviewQuestion.isPending} style={{ padding: "7px 12px", borderRadius: 20, border: "1px solid #CBD5E1", background: "#fff", color: "#475569", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Start review</button>
                    )}
                    {row.reviewStatus !== "approved" && <button className="admin-btn" onClick={() => { setReviewingQuestionId(row.id); setReviewDraft({ sourceTitle: row.sourceTitle || "", sourceReference: row.sourceReference || "", sourceUrl: row.sourceUrl || "", blueprintObjective: row.blueprintObjective || "" }); }} disabled={reviewQuestion.isPending || !answerValid || !row.explanation} style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: "#08775e", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Review source and publish</button>}
                    {row.reviewStatus !== "rejected" && (
                      <button className="admin-btn" onClick={() => setQuestionReviewState(row, "rejected")} disabled={reviewQuestion.isPending} style={{ padding: "7px 12px", borderRadius: 20, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#DC2626", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Reject</button>
                    )}
                  </div>
                </div>
                {reviewingQuestionId === row.id && <form className="admin-review-form" onSubmit={event => { event.preventDefault(); sourceAndApproveQuestion(row); }}>
                  <label>Primary source title *<input required maxLength={255} value={reviewDraft.sourceTitle} onChange={event => setReviewDraft({ ...reviewDraft, sourceTitle: event.target.value })} /></label>
                  <label>Exact section, page or table *<input required maxLength={512} value={reviewDraft.sourceReference} onChange={event => setReviewDraft({ ...reviewDraft, sourceReference: event.target.value })} /></label>
                  <label>Source URL<input type="url" maxLength={1024} value={reviewDraft.sourceUrl} onChange={event => setReviewDraft({ ...reviewDraft, sourceUrl: event.target.value })} /></label>
                  <label>Blueprint objective<input maxLength={255} value={reviewDraft.blueprintObjective} onChange={event => setReviewDraft({ ...reviewDraft, blueprintObjective: event.target.value })} /></label>
                  <div className="admin-review-form-actions"><button type="button" onClick={() => setReviewingQuestionId(null)}>Cancel</button><button type="submit" disabled={reviewQuestion.isPending}>Approve and publish</button></div>
                </form>}
              </div>
            );})}
            {governanceQueueQ.data && governanceQueueQ.data.total > 0 && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderTop: "1px solid #DCE7EA", gap: 12 }}>
              <button className="admin-btn" disabled={reviewPage <= 1 || governanceQueueQ.isFetching} onClick={() => { setReviewPage(page => page - 1); setReviewingQuestionId(null); }}>← Previous</button>
              <span style={{ fontSize: 11, color: "#526779" }}>Page {reviewPage} of {Math.ceil(governanceQueueQ.data.total / governanceQueueQ.data.pageSize)}</span>
              <button className="admin-btn" disabled={reviewPage * governanceQueueQ.data.pageSize >= governanceQueueQ.data.total || governanceQueueQ.isFetching} onClick={() => { setReviewPage(page => page + 1); setReviewingQuestionId(null); }}>Next →</button>
            </div>}
          </div>
        )}

        {/* -- PLATFORM CHANGELOG TAB -- */}
        {activeTab === "changelog" && <ChangelogManager />}

        {/* -- ORGANIZATIONS TAB -- */}
        {activeTab === "orgs" && (
          <div style={{ background: "#F8FAFC", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                🏢 Organizations
                {orgsQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{orgsQ.data.length} org{orgsQ.data.length === 1 ? "" : "s"}</span>}
              </div>
            </div>
            {orgsQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
            {orgsQ.data && orgsQ.data.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No organizations yet.</div>
            )}
            {orgsQ.data && orgsQ.data.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.04)", textAlign: "left" }}>
                      <th style={{ padding: "10px 16px", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Organization</th>
                      <th style={{ padding: "10px 16px", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Manager</th>
                      <th style={{ padding: "10px 16px", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Province</th>
                      <th style={{ padding: "10px 16px", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Seats</th>
                      <th style={{ padding: "10px 16px", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Billing</th>
                      <th style={{ padding: "10px 16px", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Term End</th>
                      <th style={{ padding: "10px 16px", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgsQ.data.map((org) => {
                      const statusColor = org.status === "active" ? { bg: "rgba(52,211,153,0.15)", color: "#059669" }
                        : org.status === "past_due" ? { bg: "rgba(251,191,36,0.15)", color: "#D97706" }
                        : { bg: "rgba(239,68,68,0.15)", color: "#DC2626" };
                      return (
                        <tr key={org.id} className="admin-row" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 600, color: "#1E293B" }}>{org.name}</div>
                            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>ID #{org.id}</div>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>{org.managerEmail}</td>
                          <td style={{ padding: "12px 16px", color: "#475569", textTransform: "capitalize" }}>{org.province === "ontario" ? "Ontario" : "Western CA"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontWeight: 600, color: "#1E293B" }}>{(org as any).seatsUsed ?? 0}</span>
                            <span style={{ color: "#94A3B8" }}> / {org.seatsTotal}</span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ padding: "3px 8px", borderRadius: 100, background: org.billingType === "stripe" ? "rgba(99,102,241,0.12)" : "rgba(0,0,0,0.07)", color: org.billingType === "stripe" ? "#6366F1" : "#475569", fontSize: 10, fontWeight: 700 }}>
                              {org.billingType === "stripe" ? "Stripe" : "Invoice"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#475569", fontSize: 12 }}>
                            {org.termEnd ? new Date(org.termEnd).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ padding: "3px 10px", borderRadius: 100, background: statusColor.bg, color: statusColor.color, fontSize: 10, fontWeight: 700, textTransform: "capitalize" }}>
                              {org.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* -- READ-ONLY DATA EXPLORER TAB -- */}
        {activeTab === "explorer" && (
          <div style={{ background: "#F8FAFC", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1E293B" }}>▦ Data Explorer</div>
                <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.55, marginTop: 5, maxWidth: 670 }}>
                  Read the live Echelon application database from this dashboard. This view is admin-only and read-only. It cannot run SQL or change records.
                </div>
              </div>
              <div style={{ padding: "7px 10px", borderRadius: 8, background: "#EFF6FF", color: "#1D4ED8", fontSize: 10, fontWeight: 800, whiteSpace: "nowrap" }}>
                READ-ONLY PRODUCTION VIEW
              </div>
            </div>

            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
              <label style={{ display: "grid", gap: 5, minWidth: 260, flex: "1 1 320px" }}>
                <span style={{ fontSize: 10, color: "#475569", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>Dataset</span>
                <select
                  aria-label="Data Explorer dataset"
                  value={explorerDatasetKey}
                  onChange={(event) => { setExplorerDatasetKey(event.target.value); setExplorerPage(1); }}
                  style={{ minHeight: 38, borderRadius: 8, border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#1E293B", padding: "0 10px", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}
                >
                  {(explorerCatalogQ.data?.datasets ?? []).reduce<string[]>((categories, dataset) => categories.includes(dataset.category) ? categories : [...categories, dataset.category], []).map(category => (
                    <optgroup key={category} label={category}>
                      {(explorerCatalogQ.data?.datasets ?? []).filter(dataset => dataset.category === category).map(dataset => (
                        <option key={dataset.key} value={dataset.key}>{dataset.label} · {dataset.tableName}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 5 }}>
                <span style={{ fontSize: 10, color: "#475569", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>Rows per page</span>
                <select
                  aria-label="Data Explorer rows per page"
                  value={explorerPageSize}
                  onChange={(event) => { setExplorerPageSize(Number(event.target.value)); setExplorerPage(1); }}
                  style={{ minHeight: 38, borderRadius: 8, border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#1E293B", padding: "0 10px", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}
                >
                  {[25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>

              <button
                className="admin-btn"
                onClick={() => { explorerCatalogQ.refetch(); explorerPageQ.refetch(); }}
                disabled={explorerPageQ.isFetching}
                style={{ minHeight: 38, padding: "0 14px", borderRadius: 8, border: "1px solid #BFDBFE", background: "#FFFFFF", color: "#1D4ED8", fontSize: 11, fontWeight: 800, cursor: explorerPageQ.isFetching ? "wait" : "pointer", fontFamily: "inherit" }}
              >
                {explorerPageQ.isFetching ? "Refreshing…" : "↻ Refresh data"}
              </button>
              {explorerPageQ.data?.rows.length ? (
                <button
                  className="admin-btn"
                  onClick={() => downloadCSV(explorerPageQ.data!.rows, `echelon-${explorerPageQ.data!.dataset.tableName}-page-${explorerPageQ.data!.page}.csv`)}
                  style={{ minHeight: 38, padding: "0 14px", borderRadius: 8, border: "1px solid rgba(15,118,110,0.25)", background: "#F0FDFA", color: "#0F766E", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                >
                  ↓ Download page CSV
                </button>
              ) : null}
            </div>

            {explorerCatalogQ.isLoading || explorerPageQ.isLoading ? (
              <div style={{ padding: 44, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading the read-only database view…</div>
            ) : null}
            {explorerCatalogQ.error || explorerPageQ.error ? (
              <div role="alert" style={{ margin: 20, padding: 14, borderRadius: 10, background: "#FEF2F2", color: "#B91C1C", fontSize: 12, lineHeight: 1.5 }}>
                The Data Explorer could not load this dataset: {(explorerCatalogQ.error ?? explorerPageQ.error)?.message}
              </div>
            ) : null}
            {explorerPageQ.data ? (
              <>
                <div style={{ padding: "13px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#1E293B", fontWeight: 800 }}>{explorerPageQ.data.dataset.label}</div>
                    <div style={{ marginTop: 3, fontSize: 11, color: "#64748B" }}>{explorerPageQ.data.dataset.description} · <code style={{ color: "#1D4ED8" }}>{explorerPageQ.data.dataset.tableName}</code></div>
                  </div>
                  <div aria-live="polite" style={{ fontSize: 11, color: "#64748B", textAlign: "right" }}>
                    <strong style={{ color: "#1E293B" }}>{explorerPageQ.data.total.toLocaleString()}</strong> rows · Updated {formatDate(explorerPageQ.data.generatedAt)}
                  </div>
                </div>

                {explorerPageQ.data.dataset.restrictedColumns.length > 0 ? (
                  <div style={{ margin: "12px 20px 0", padding: "9px 11px", borderRadius: 8, background: "#FFFBEB", color: "#92400E", fontSize: 10, lineHeight: 1.5 }}>
                    Protected operational fields are excluded: {explorerPageQ.data.dataset.restrictedColumns.join(", ")}.
                  </div>
                ) : null}

                {explorerPageQ.data.rows.length === 0 ? (
                  <div style={{ padding: 44, textAlign: "center", color: "#64748B", fontSize: 13 }}>This table has no rows yet.</div>
                ) : (
                  <div style={{ overflowX: "auto", marginTop: 12 }}>
                    <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "rgba(0,0,0,0.035)", textAlign: "left" }}>
                          {explorerPageQ.data.columns.map(column => (
                            <th key={column} scope="col" style={{ padding: "10px 14px", color: "#475569", fontWeight: 800, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{displayExplorerColumn(column)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {explorerPageQ.data.rows.map((row, index) => (
                          <tr key={`${explorerPageQ.data!.page}-${index}`} className="admin-row" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                            {explorerPageQ.data!.columns.map(column => {
                              const value = row[column];
                              const fullValue = value === null || value === undefined ? "" : String(value);
                              return <td key={column} title={fullValue} style={{ padding: "10px 14px", color: "#334155", maxWidth: 280, verticalAlign: "top", lineHeight: 1.45, overflowWrap: "anywhere" }}>{formatExplorerValue(value)}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 11, color: "#64748B" }}>Page {explorerPageQ.data.page} of {explorerPageQ.data.totalPages}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="admin-btn" onClick={() => setExplorerPage(page => Math.max(1, page - 1))} disabled={explorerPageQ.data.page <= 1 || explorerPageQ.isFetching} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#475569", fontSize: 11, fontWeight: 700, cursor: explorerPageQ.data.page <= 1 ? "not-allowed" : "pointer", opacity: explorerPageQ.data.page <= 1 ? 0.5 : 1, fontFamily: "inherit" }}>← Previous</button>
                    <button className="admin-btn" onClick={() => setExplorerPage(page => Math.min(explorerPageQ.data!.totalPages, page + 1))} disabled={explorerPageQ.data.page >= explorerPageQ.data.totalPages || explorerPageQ.isFetching} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #1D4ED8", background: "#1D4ED8", color: "#FFFFFF", fontSize: 11, fontWeight: 700, cursor: explorerPageQ.data.page >= explorerPageQ.data.totalPages ? "not-allowed" : "pointer", opacity: explorerPageQ.data.page >= explorerPageQ.data.totalPages ? 0.5 : 1, fontFamily: "inherit" }}>Next →</button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* -- PRIVATE RECOVERY REVIEW TAB -- */}
        {activeTab === "recovery" && (
          <div style={{ background: "#F8FAFC", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>↺ Historical recovery evidence</div>
              <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, marginTop: 5 }}>
                Evidence review only. Classification does not send email, create an organization or seat, approve a claim, or grant course access.
              </div>
            </div>
            {recoveryEvidenceQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading protected evidence…</div>}
            {recoveryEvidenceQ.error && <div style={{ margin: 20, padding: 14, borderRadius: 10, background: "#FEF2F2", color: "#B91C1C", fontSize: 12 }}>Recovery evidence could not be loaded: {recoveryEvidenceQ.error.message}</div>}
            {recoveryEvidenceQ.data?.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#64748B", fontSize: 13 }}>No staged recovery evidence.</div>}
            {recoveryEvidenceQ.data && recoveryEvidenceQ.data.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.04)", textAlign: "left" }}>
                      {['Evidence', 'Purchase email', 'Paid', 'Classification', 'Review status', 'Actions'].map((label) => (
                        <th key={label} style={{ padding: "10px 16px", color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recoveryEvidenceQ.data.map((row) => (
                      <tr key={row.id} className="admin-row" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                        <td style={{ padding: "12px 16px", color: "#64748B" }}>#{row.id}<br /><span style={{ fontSize: 10 }}>{row.sourceType.replace("_", " ")}</span></td>
                        <td style={{ padding: "12px 16px", color: "#334155", fontWeight: 600 }}>{row.customerEmail}</td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>{row.paymentStatus}<br /><span style={{ fontSize: 10 }}>{row.paymentCreatedAt ? formatDate(row.paymentCreatedAt) : "Date unavailable"}</span></td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>
                          {row.recoverySubjectType === "organization_manager" ? (
                            <><strong>{row.recoveryOrganizationName}</strong><br /><span style={{ fontSize: 10 }}>{row.recoveryOrganizationGroup}{row.recoverySeatCount ? ` · ${row.recoverySeatCount} seats` : " · seats pending"}</span></>
                          ) : row.recoverySubjectType === "individual" ? "Individual review" : "Unclassified"}
                        </td>
                        <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 8px", borderRadius: 100, background: "#DBEAFE", color: "#1D4ED8", fontSize: 10, fontWeight: 700 }}>{row.reviewStatus.replace("_", " ")}</span></td>
                        <td style={{ padding: "12px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button className="admin-btn" onClick={() => classifyRecovery(row, "individual")} disabled={classifyRecoveryEvidence.isPending || row.reviewStatus === "imported" || row.reviewStatus === "rejected"} style={{ padding: "5px 9px", borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff", color: "#475569", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Individual</button>
                          <button className="admin-btn" onClick={() => classifyRecovery(row, "organization_manager")} disabled={classifyRecoveryEvidence.isPending || row.reviewStatus === "imported" || row.reviewStatus === "rejected"} style={{ padding: "5px 9px", borderRadius: 8, border: "none", background: "#1D4ED8", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Manager</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
          </div>
        </main>
      </div>
    </div>
  );
}

/** Release marker: PR 161 admin ledger and lead triage. */
