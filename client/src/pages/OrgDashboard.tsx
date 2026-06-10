/**
 * OrgDashboard.tsx — Manager dashboard for Echelon for Teams.
 *
 * Auth: OTP session (same echelon_dashboard_session cookie as student dashboard).
 *       The server's requireOrgManager resolves the org from the manager's email.
 *
 * Layout (light theme — matches rest of echeloninstitute.ca):
 *   - Header: org name, term end, status badge, Manage Seats + Manage Billing buttons
 *   - 4 metric cards: Seats Assigned, Active This Week, Avg Readiness, On Track
 *   - Attention panel: at-risk (exam approaching) + stalled operators
 *   - Operator roster table with per-row assign/revoke actions
 *   - Assign Seat modal (single email or bulk paste)
 *   - Manage Seats modal (update seat count, Stripe proration)
 *
 * Bug fixes applied:
 *   1. Route mismatch: /team-login → /team/login
 *   2. Dark theme → light theme (bg-white, gray borders, blue accents)
 *   3. ?session_id= param handled: welcome banner shown after Stripe checkout
 *   4. Manage Seats button wired to updateTeamSeats mutation
 *   5. Manage Billing button calls createBillingPortalSession
 */

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users,
  Activity,
  Target,
  TrendingUp,
  AlertTriangle,
  Clock,
  UserPlus,
  UserMinus,
  LogOut,
  ExternalLink,
  ChevronRight,
  Building2,
  CreditCard,
  Settings,
  CheckCircle2,
} from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { trpc as trpcClient } from "@/lib/trpc";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(d: Date | null | undefined): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

type OperatorStatus = "not_started" | "behind" | "needs_focus" | "on_track";

const STATUS_CONFIG: Record<OperatorStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: "Not Started", color: "text-slate-500",  bg: "bg-slate-100" },
  behind:      { label: "Behind",      color: "text-red-700",    bg: "bg-red-50" },
  needs_focus: { label: "Needs Focus", color: "text-amber-700",  bg: "bg-amber-50" },
  on_track:    { label: "On Track",    color: "text-green-700",  bg: "bg-green-50" },
};

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className={`text-3xl font-bold ${accent ?? "text-slate-900"}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OrgDashboard() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignEmail, setAssignEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [manageSeatsOpen, setManageSeatsOpen] = useState(false);
  const [newSeatCount, setNewSeatCount] = useState<number>(0);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const welcomeShownRef = useRef(false);

  const utils = trpcClient.useUtils();

  // Queries
  const overviewQuery = trpc.org.getOrgOverview.useQuery(undefined, { retry: false });
  const membersQuery = trpc.org.listMembers.useQuery(undefined, { retry: false });
  const attentionQuery = trpc.org.getAttention.useQuery(undefined, { retry: false });

  // Bug fix: handle ?session_id= param — show welcome banner after Stripe checkout
  useEffect(() => {
    if (welcomeShownRef.current) return;
    const params = new URLSearchParams(search);
    if (params.get("session_id")) {
      welcomeShownRef.current = true;
      setShowWelcomeBanner(true);
      // Clean up URL without reloading
      window.history.replaceState({}, "", "/team");
    }
  }, [search]);

  // Mutations
  const assignSeat = trpc.org.assignSeat.useMutation({
    onSuccess: (data) => {
      toast.success(`Seat assigned to ${data.email}`);
      utils.org.getOrgOverview.invalidate();
      utils.org.listMembers.invalidate();
      utils.org.getAttention.invalidate();
      setAssignOpen(false);
      setAssignEmail("");
    },
    onError: (err) => toast.error(err.message),
  });

  const assignSeats = trpc.org.assignSeats.useMutation({
    onSuccess: (data) => {
      const ok = data.results.filter(r => r.success).length;
      const fail = data.results.filter(r => !r.success).length;
      if (ok > 0) toast.success(`${ok} seat${ok === 1 ? "" : "s"} assigned`);
      if (fail > 0) toast.error(`${fail} assignment${fail === 1 ? "" : "s"} failed`);
      utils.org.getOrgOverview.invalidate();
      utils.org.listMembers.invalidate();
      utils.org.getAttention.invalidate();
      setAssignOpen(false);
      setBulkEmails("");
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeSeat = trpc.org.revokeSeat.useMutation({
    onSuccess: (data) => {
      toast.success(`Seat revoked for ${data.email}`);
      utils.org.getOrgOverview.invalidate();
      utils.org.listMembers.invalidate();
      utils.org.getAttention.invalidate();
      setRevokeTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateSeats = trpc.stripe.updateTeamSeats.useMutation({
    onSuccess: (data) => {
      toast.success(`Seat count updated to ${data.seats}`);
      utils.org.getOrgOverview.invalidate();
      setManageSeatsOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const billingPortal = trpc.stripe.createBillingPortalSession.useMutation({
    onSuccess: (data) => {
      if (data?.url) window.open(data.url, "_blank");
    },
    onError: (err) => toast.error("Could not open billing portal: " + err.message),
  });

  const logoutMutation = trpc.dashboardAuth.logout.useMutation({
    // Bug fix: was "/team-login", correct route is "/team/login"
    onSuccess: () => navigate("/team/login"),
  });

  // ── Auth check ─────────────────────────────────────────────────────────────

  if (overviewQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading your dashboard...</div>
      </div>
    );
  }

  if (overviewQuery.error) {
    const msg = overviewQuery.error.message;
    const isUnauth = msg.includes("sign in") || msg.includes("manager account");
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Building2 className="w-12 h-12 text-slate-300" />
        <h1 className="text-xl font-semibold text-slate-900">Manager Dashboard</h1>
        <p className="text-slate-500 max-w-sm">
          {isUnauth
            ? "Please sign in with your manager email to access the team dashboard."
            : msg}
        </p>
        {/* Bug fix: was "/team-login", correct route is "/team/login" */}
        <Link href="/team/login">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Sign In
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
        <p className="text-slate-400 text-sm">
          Don't have a team plan?{" "}
          <Link href="/teams">
            <span className="text-blue-600 hover:text-blue-700 cursor-pointer">Get started</span>
          </Link>
        </p>
      </div>
    );
  }

  const overview = overviewQuery.data!;
  const members = membersQuery.data ?? [];
  const attention = attentionQuery.data ?? { atRisk: [], stalled: [] };

  const seatsAvailable = overview.seatsTotal - overview.seatsAssigned;
  const termDays = daysUntil(overview.termEnd);
  const hasStripe = overview.billingType === "stripe" && !!overview.stripeSubscriptionId;

  // ── Assign handler ─────────────────────────────────────────────────────────

  const handleAssign = () => {
    if (bulkMode) {
      const emails = bulkEmails
        .split(/[\n,;]+/)
        .map(e => e.trim().toLowerCase())
        .filter(e => e.includes("@"));
      if (emails.length === 0) {
        toast.error("No valid emails found.");
        return;
      }
      assignSeats.mutate({ emails });
    } else {
      if (!assignEmail.trim() || !assignEmail.includes("@")) {
        toast.error("Please enter a valid email address.");
        return;
      }
      assignSeat.mutate({ email: assignEmail.trim().toLowerCase() });
    }
  };

  // ── Active members for roster ──────────────────────────────────────────────

  const activeMembers = members.filter(m => m.status === "assigned");
  const revokedMembers = members.filter(m => m.status === "revoked");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Bug fix: welcome banner shown after Stripe checkout redirect */}
      {showWelcomeBanner && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Team plan activated! Welcome to Echelon for Teams.
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Your organization is ready. Start assigning seats to your operators below.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWelcomeBanner(false)}
              className="text-green-500 hover:text-green-700 text-lg leading-none flex-shrink-0"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 leading-tight">{overview.orgName}</h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Manager Dashboard</span>
                <span>·</span>
                <span className="capitalize">{overview.province === "ontario" ? "Ontario (EOCP)" : "Western Canada (WPI)"}</span>
                {termDays !== null && (
                  <>
                    <span>·</span>
                    <span className={termDays < 30 ? "text-amber-600 font-medium" : ""}>
                      Renews in {termDays} day{termDays === 1 ? "" : "s"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                overview.status === "active"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : overview.status === "past_due"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }
            >
              {overview.status === "active" ? "Active" : overview.status === "past_due" ? "Past Due" : "Cancelled"}
            </Badge>
            {/* Bug fix: Manage Seats button wired to updateTeamSeats */}
            {hasStripe && (
              <Button
                variant="outline"
                size="sm"
                className="text-slate-600 border-slate-200 hover:bg-slate-50 hidden sm:flex"
                onClick={() => {
                  setNewSeatCount(overview.seatsTotal);
                  setManageSeatsOpen(true);
                }}
              >
                <Settings className="w-4 h-4 mr-1.5" />
                Manage Seats
              </Button>
            )}
            {/* Bug fix: Manage Billing button calls createBillingPortalSession */}
            {hasStripe && (
              <Button
                variant="outline"
                size="sm"
                className="text-slate-600 border-slate-200 hover:bg-slate-50 hidden sm:flex"
                onClick={() => billingPortal.mutate({ origin: window.location.origin })}
                disabled={billingPortal.isPending}
              >
                <CreditCard className="w-4 h-4 mr-1.5" />
                {billingPortal.isPending ? "Opening..." : "Manage Billing"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-700"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="w-4 h-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Users}
            label="Seats Assigned"
            value={`${overview.seatsAssigned} / ${overview.seatsTotal}`}
            sub={`${seatsAvailable} available`}
            accent={seatsAvailable === 0 ? "text-amber-600" : "text-slate-900"}
          />
          <MetricCard
            icon={Activity}
            label="Active This Week"
            value={overview.activeThisWeek}
            sub={`of ${overview.seatsAssigned} operators`}
            accent="text-blue-600"
          />
          <MetricCard
            icon={Target}
            label="Avg Readiness"
            value={`${overview.avgReadiness}%`}
            sub="across all operators"
            accent={
              overview.avgReadiness >= 75
                ? "text-green-600"
                : overview.avgReadiness >= 50
                ? "text-amber-600"
                : "text-red-600"
            }
          />
          <MetricCard
            icon={TrendingUp}
            label="On Track to Pass"
            value={overview.onTrackCount}
            sub="≥75% accuracy"
            accent="text-green-600"
          />
        </div>

        {/* Attention panel */}
        {(attention.atRisk.length > 0 || attention.stalled.length > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-700 font-medium">
              <AlertTriangle className="w-5 h-5" />
              Needs Attention ({attention.atRisk.length + attention.stalled.length})
            </div>
            {attention.atRisk.length > 0 && (
              <div>
                <p className="text-xs text-amber-600 uppercase tracking-wider mb-2 font-semibold">Exam approaching — below readiness threshold</p>
                <div className="space-y-2">
                  {attention.atRisk.map(op => (
                    <div key={op.email} className="flex items-center justify-between bg-white border border-amber-100 rounded-lg px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{op.email}</div>
                        <div className="text-xs text-slate-500">
                          Exam in {op.daysUntilExam} day{op.daysUntilExam === 1 ? "" : "s"} · {op.accuracy}% readiness
                        </div>
                      </div>
                      <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">At Risk</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {attention.stalled.length > 0 && (
              <div>
                <p className="text-xs text-amber-600 uppercase tracking-wider mb-2 font-semibold">Stalled operators</p>
                <div className="space-y-2">
                  {attention.stalled.map(op => (
                    <div key={op.email} className="flex items-center justify-between bg-white border border-amber-100 rounded-lg px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{op.email}</div>
                        <div className="text-xs text-slate-500">
                          {op.reason === "never_started"
                            ? "Never started — assigned 7+ days ago"
                            : `Inactive for ${op.daysSinceActivity} day${op.daysSinceActivity === 1 ? "" : "s"}`}
                        </div>
                      </div>
                      <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {op.reason === "never_started" ? "Never Started" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Roster */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Operator Roster</h2>
            <Button
              onClick={() => setAssignOpen(true)}
              disabled={seatsAvailable === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Assign Seat
            </Button>
          </div>

          {activeMembers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 shadow-sm">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No operators assigned yet.</p>
              <p className="text-xs mt-1">Click "Assign Seat" to add your first operator.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider bg-slate-50">
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Assigned</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Last Active</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Accuracy</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {activeMembers.map((m, i) => {
                    const cfg = STATUS_CONFIG[m.operatorStatus as OperatorStatus];
                    return (
                      <tr
                        key={m.id}
                        className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                          i === activeMembers.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">{m.email}</td>
                        <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                          {formatDate(m.assignedAt)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                          {m.lastActive ? formatDate(m.lastActive) : <span className="text-slate-300">Never</span>}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {m.accuracy !== null ? (
                            <span
                              className={
                                m.accuracy >= 75
                                  ? "text-green-600 font-medium"
                                  : m.accuracy >= 40
                                  ? "text-amber-600 font-medium"
                                  : "text-red-600 font-medium"
                              }
                            >
                              {m.accuracy}%
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-300 hover:text-red-600 hover:bg-red-50 h-7 px-2"
                            onClick={() => setRevokeTarget(m.email)}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Revoked members (collapsed) */}
          {revokedMembers.length > 0 && (
            <details className="mt-4">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 select-none">
                {revokedMembers.length} revoked operator{revokedMembers.length === 1 ? "" : "s"}
              </summary>
              <div className="mt-2 space-y-1">
                {revokedMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-4 py-2 bg-white border border-slate-100 rounded-lg text-sm text-slate-400">
                    <span>{m.email}</span>
                    <span className="text-xs">Revoked {formatDate(m.revokedAt)}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Footer links */}
        <div className="flex items-center gap-4 text-xs text-slate-400 pt-4 border-t border-slate-200">
          <Link href="/teams">
            <span className="hover:text-slate-600 cursor-pointer flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Add more seats
            </span>
          </Link>
          <span>·</span>
          <span>Term ends {formatDate(overview.termEnd)}</span>
        </div>
      </main>

      {/* Assign Seat modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="bg-white border-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Assign Seat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <button
                onClick={() => setBulkMode(false)}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  !bulkMode ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-700"
                }`}
              >
                Single email
              </button>
              <button
                onClick={() => setBulkMode(true)}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  bulkMode ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-700"
                }`}
              >
                Bulk (paste list)
              </button>
            </div>

            {!bulkMode ? (
              <div className="space-y-2">
                <Label className="text-slate-700">Operator email</Label>
                <Input
                  type="email"
                  placeholder="operator@utility.ca"
                  value={assignEmail}
                  onChange={e => setAssignEmail(e.target.value)}
                  className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                  onKeyDown={e => e.key === "Enter" && handleAssign()}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-slate-700">Paste emails (one per line, or comma-separated)</Label>
                <Textarea
                  placeholder={"operator1@utility.ca\noperator2@utility.ca"}
                  value={bulkEmails}
                  onChange={e => setBulkEmails(e.target.value)}
                  rows={6}
                  className="border-slate-200 text-slate-900 placeholder:text-slate-400 resize-none"
                />
                <p className="text-xs text-slate-400">
                  {bulkEmails.split(/[\n,;]+/).filter(e => e.trim().includes("@")).length} valid email{
                    bulkEmails.split(/[\n,;]+/).filter(e => e.trim().includes("@")).length === 1 ? "" : "s"
                  } detected
                </p>
              </div>
            )}

            <p className="text-xs text-slate-400">
              {seatsAvailable} seat{seatsAvailable === 1 ? "" : "s"} available. The operator will
              get immediate access to all Echelon content using this email address.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignOpen(false)} className="text-slate-500">
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assignSeat.isPending || assignSeats.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {assignSeat.isPending || assignSeats.isPending ? "Assigning..." : "Assign Seat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Seats modal — wires updateTeamSeats mutation */}
      <Dialog open={manageSeatsOpen} onOpenChange={setManageSeatsOpen}>
        <DialogContent className="bg-white border-slate-200 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Manage Seats</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Update your team's seat count. Stripe will prorate the charge for the remaining term.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700">New seat count</Label>
              <Input
                type="number"
                min={overview.seatsAssigned}
                max={500}
                value={newSeatCount}
                onChange={e => setNewSeatCount(Math.max(overview.seatsAssigned, parseInt(e.target.value) || 0))}
                className="border-slate-200 text-slate-900"
              />
              <p className="text-xs text-slate-400">
                Current: {overview.seatsTotal} seats · {overview.seatsAssigned} assigned.
                Minimum is {overview.seatsAssigned} (currently assigned).
              </p>
            </div>
            {newSeatCount !== overview.seatsTotal && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
                {newSeatCount > overview.seatsTotal
                  ? `Adding ${newSeatCount - overview.seatsTotal} seat${newSeatCount - overview.seatsTotal === 1 ? "" : "s"}. Stripe will charge a prorated amount for the remaining term.`
                  : `Removing ${overview.seatsTotal - newSeatCount} seat${overview.seatsTotal - newSeatCount === 1 ? "" : "s"}. Stripe will credit the prorated amount.`}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setManageSeatsOpen(false)} className="text-slate-500">
              Cancel
            </Button>
            <Button
              onClick={() => updateSeats.mutate({ seats: newSeatCount, origin: window.location.origin })}
              disabled={updateSeats.isPending || newSeatCount === overview.seatsTotal || newSeatCount < overview.seatsAssigned}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateSeats.isPending ? "Updating..." : "Update Seats"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation modal */}
      <Dialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <DialogContent className="bg-white border-slate-200 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Revoke Seat</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-slate-600 text-sm">
              Remove access for <span className="text-slate-900 font-medium">{revokeTarget}</span>?
            </p>
            <p className="text-slate-400 text-xs">
              They will immediately lose access to all Echelon content. You can re-assign this
              seat to them or another operator at any time.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRevokeTarget(null)} className="text-slate-500">
              Cancel
            </Button>
            <Button
              onClick={() => revokeTarget && revokeSeat.mutate({ email: revokeTarget })}
              disabled={revokeSeat.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {revokeSeat.isPending ? "Revoking..." : "Revoke Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
