/**
 * OrgDashboard.tsx — Manager dashboard for Echelon for Teams.
 *
 * Auth: OTP session (same echelon_dashboard_session cookie as student dashboard).
 *       The server's requireOrgManager resolves the org from the manager's email.
 *
 * Layout:
 *   - Header: org name, term end, status badge, "Manage Seats" button
 *   - 4 metric cards: Seats Assigned, Active This Week, Avg Readiness, On Track
 *   - Attention panel: at-risk (exam approaching) + stalled operators
 *   - Operator roster table with per-row assign/revoke actions
 *   - Assign Seat modal (single email or bulk paste)
 */

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Link, useLocation } from "wouter";
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
  not_started: { label: "Not Started", color: "text-white/40", bg: "bg-white/10" },
  behind:       { label: "Behind",      color: "text-red-400",   bg: "bg-red-500/20" },
  needs_focus:  { label: "Needs Focus", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  on_track:     { label: "On Track",    color: "text-green-400", bg: "bg-green-500/20" },
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
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className={`text-3xl font-bold ${accent ?? "text-white"}`}>{value}</div>
      {sub && <div className="text-xs text-white/40 mt-1">{sub}</div>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OrgDashboard() {
  const [, navigate] = useLocation();
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignEmail, setAssignEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  const utils = trpcClient.useUtils();

  // Queries
  const overviewQuery = trpc.org.getOrgOverview.useQuery(undefined, { retry: false });
  const membersQuery = trpc.org.listMembers.useQuery(undefined, { retry: false });
  const attentionQuery = trpc.org.getAttention.useQuery(undefined, { retry: false });

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

  const logoutMutation = trpc.dashboardAuth.logout.useMutation({
    onSuccess: () => navigate("/team-login"),
  });

  // ── Auth check ─────────────────────────────────────────────────────────────

  if (overviewQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-white/50 text-sm animate-pulse">Loading your dashboard...</div>
      </div>
    );
  }

  if (overviewQuery.error) {
    const msg = overviewQuery.error.message;
    const isUnauth = msg.includes("sign in") || msg.includes("manager account");
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Building2 className="w-12 h-12 text-white/20" />
        <h1 className="text-xl font-semibold text-white">Manager Dashboard</h1>
        <p className="text-white/50 max-w-sm">
          {isUnauth
            ? "Please sign in with your manager email to access the team dashboard."
            : msg}
        </p>
        <Link href="/team-login">
          <Button className="bg-blue-600 hover:bg-blue-500 text-white">
            Sign In
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
        <p className="text-white/30 text-sm">
          Don't have a team plan?{" "}
          <Link href="/teams">
            <span className="text-blue-400 hover:text-blue-300 cursor-pointer">Get started</span>
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
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-lg font-semibold leading-tight">{overview.orgName}</h1>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span>Manager Dashboard</span>
                <span>·</span>
                <span className="capitalize">{overview.province === "ontario" ? "Ontario (EOCP)" : "Western Canada (WPI)"}</span>
                {termDays !== null && (
                  <>
                    <span>·</span>
                    <span className={termDays < 30 ? "text-yellow-400" : ""}>
                      Renews in {termDays} day{termDays === 1 ? "" : "s"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={
                overview.status === "active"
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : overview.status === "past_due"
                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }
            >
              {overview.status === "active" ? "Active" : overview.status === "past_due" ? "Past Due" : "Cancelled"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/50 hover:text-white"
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
            accent={seatsAvailable === 0 ? "text-yellow-400" : "text-white"}
          />
          <MetricCard
            icon={Activity}
            label="Active This Week"
            value={overview.activeThisWeek}
            sub={`of ${overview.seatsAssigned} operators`}
            accent="text-blue-400"
          />
          <MetricCard
            icon={Target}
            label="Avg Readiness"
            value={`${overview.avgReadiness}%`}
            sub="across all operators"
            accent={
              overview.avgReadiness >= 75
                ? "text-green-400"
                : overview.avgReadiness >= 50
                ? "text-yellow-400"
                : "text-red-400"
            }
          />
          <MetricCard
            icon={TrendingUp}
            label="On Track to Pass"
            value={overview.onTrackCount}
            sub={`≥75% accuracy`}
            accent="text-green-400"
          />
        </div>

        {/* Attention panel */}
        {(attention.atRisk.length > 0 || attention.stalled.length > 0) && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-yellow-400 font-medium">
              <AlertTriangle className="w-5 h-5" />
              Needs Attention ({attention.atRisk.length + attention.stalled.length})
            </div>
            {attention.atRisk.length > 0 && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Exam approaching — below readiness threshold</p>
                <div className="space-y-2">
                  {attention.atRisk.map(op => (
                    <div key={op.email} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                      <div>
                        <div className="text-sm font-medium">{op.email}</div>
                        <div className="text-xs text-white/40">
                          Exam in {op.daysUntilExam} day{op.daysUntilExam === 1 ? "" : "s"} · {op.accuracy}% readiness
                        </div>
                      </div>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">At Risk</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {attention.stalled.length > 0 && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Stalled operators</p>
                <div className="space-y-2">
                  {attention.stalled.map(op => (
                    <div key={op.email} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                      <div>
                        <div className="text-sm font-medium">{op.email}</div>
                        <div className="text-xs text-white/40">
                          {op.reason === "never_started"
                            ? "Never started — assigned 7+ days ago"
                            : `Inactive for ${op.daysSinceActivity} day${op.daysSinceActivity === 1 ? "" : "s"}`}
                        </div>
                      </div>
                      <Badge className="bg-white/10 text-white/50 border-white/20 text-xs">
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
            <h2 className="text-lg font-semibold">Operator Roster</h2>
            <Button
              onClick={() => setAssignOpen(true)}
              disabled={seatsAvailable === 0}
              className="bg-blue-600 hover:bg-blue-500 text-white"
              size="sm"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Assign Seat
            </Button>
          </div>

          {activeMembers.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center text-white/40">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No operators assigned yet.</p>
              <p className="text-xs mt-1">Click "Assign Seat" to add your first operator.</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
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
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                          i === activeMembers.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-white/90">{m.email}</td>
                        <td className="px-4 py-3 text-white/50 hidden md:table-cell">
                          {formatDate(m.assignedAt)}
                        </td>
                        <td className="px-4 py-3 text-white/50 hidden md:table-cell">
                          {m.lastActive ? formatDate(m.lastActive) : <span className="text-white/25">Never</span>}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {m.accuracy !== null ? (
                            <span
                              className={
                                m.accuracy >= 75
                                  ? "text-green-400"
                                  : m.accuracy >= 40
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }
                            >
                              {m.accuracy}%
                            </span>
                          ) : (
                            <span className="text-white/25">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/30 hover:text-red-400 hover:bg-red-500/10 h-7 px-2"
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
              <summary className="text-xs text-white/30 cursor-pointer hover:text-white/50 select-none">
                {revokedMembers.length} revoked operator{revokedMembers.length === 1 ? "" : "s"}
              </summary>
              <div className="mt-2 space-y-1">
                {revokedMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-4 py-2 bg-white/3 rounded-lg text-sm text-white/30">
                    <span>{m.email}</span>
                    <span className="text-xs">Revoked {formatDate(m.revokedAt)}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Footer links */}
        <div className="flex items-center gap-4 text-xs text-white/30 pt-4 border-t border-white/10">
          <Link href="/teams">
            <span className="hover:text-white/60 cursor-pointer flex items-center gap-1">
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
        <DialogContent className="bg-[#0f1929] border-white/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Seat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <button
                onClick={() => setBulkMode(false)}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  !bulkMode ? "bg-blue-600 text-white" : "bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                Single email
              </button>
              <button
                onClick={() => setBulkMode(true)}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  bulkMode ? "bg-blue-600 text-white" : "bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                Bulk (paste list)
              </button>
            </div>

            {!bulkMode ? (
              <div className="space-y-2">
                <Label className="text-white/70">Operator email</Label>
                <Input
                  type="email"
                  placeholder="operator@utility.ca"
                  value={assignEmail}
                  onChange={e => setAssignEmail(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
                  onKeyDown={e => e.key === "Enter" && handleAssign()}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-white/70">Paste emails (one per line, or comma-separated)</Label>
                <Textarea
                  placeholder={"operator1@utility.ca\noperator2@utility.ca"}
                  value={bulkEmails}
                  onChange={e => setBulkEmails(e.target.value)}
                  rows={6}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/30 resize-none"
                />
                <p className="text-xs text-white/40">
                  {bulkEmails.split(/[\n,;]+/).filter(e => e.trim().includes("@")).length} valid email{
                    bulkEmails.split(/[\n,;]+/).filter(e => e.trim().includes("@")).length === 1 ? "" : "s"
                  } detected
                </p>
              </div>
            )}

            <p className="text-xs text-white/40">
              {seatsAvailable} seat{seatsAvailable === 1 ? "" : "s"} available. The operator will
              get immediate access to all Echelon content using this email address.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignOpen(false)} className="text-white/50">
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assignSeat.isPending || assignSeats.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {assignSeat.isPending || assignSeats.isPending ? "Assigning..." : "Assign Seat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation modal */}
      <Dialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <DialogContent className="bg-[#0f1929] border-white/20 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke Seat</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-white/70 text-sm">
              Remove access for <span className="text-white font-medium">{revokeTarget}</span>?
            </p>
            <p className="text-white/40 text-xs">
              They will immediately lose access to all Echelon content. You can re-assign this
              seat to them or another operator at any time.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRevokeTarget(null)} className="text-white/50">
              Cancel
            </Button>
            <Button
              onClick={() => revokeTarget && revokeSeat.mutate({ email: revokeTarget })}
              disabled={revokeSeat.isPending}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {revokeSeat.isPending ? "Revoking..." : "Revoke Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
