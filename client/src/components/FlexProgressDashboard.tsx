import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Clock, Target, TrendingUp, UserCheck, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Activity }> = {
  active: { label: "Studying", color: "bg-emerald-100 text-emerald-800", icon: Activity },
  assigned: { label: "Awaiting Activation", color: "bg-amber-100 text-amber-800", icon: Clock },
  invited: { label: "Invited", color: "bg-blue-100 text-blue-800", icon: Mail },
};

function readinessLabel(score: number): string {
  if (score >= 85) return "Study Ready";
  if (score >= 75) return "Approaching Ready";
  if (score >= 60) return "Building";
  if (score >= 30) return "Developing";
  return "Exploring";
}

function readinessColor(score: number): string {
  if (score >= 85) return "text-emerald-600";
  if (score >= 75) return "text-teal-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 30) return "text-amber-600";
  return "text-slate-500";
}

function daysRemaining(accessEndsAt: string | Date | null): string | null {
  if (!accessEndsAt) return null;
  const end = new Date(accessEndsAt);
  const now = new Date();
  const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

function formatCourseKey(key: string): string {
  return key
    .replace(/^wpi-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Oit", "OIT")
    .replace("Ww", "WW");
}

export function FlexProgressDashboard({ orgId }: { orgId: number }) {
  const progressQuery = trpc.teamFlex.getFlexProgress.useQuery({ orgId }, {
    retry: false,
    refetchInterval: 60_000, // Refresh every minute
  });

  const data = progressQuery.data ?? [];

  if (data.length === 0) {
    return null; // No Flex licences to show progress for
  }

  const activeOperators = data.filter((d) => d.status === "active");
  const totalAttempts = data.reduce((sum, d) => sum + d.totalAttempts, 0);
  const avgAccuracy = activeOperators.length > 0
    ? Math.round(activeOperators.reduce((sum, d) => sum + d.accuracy, 0) / activeOperators.length)
    : 0;
  const avgReadiness = activeOperators.length > 0
    ? Math.round(activeOperators.reduce((sum, d) => sum + d.readinessScore, 0) / activeOperators.length)
    : 0;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-teal-600" />
          <span>Course Pass Progress</span>
          <Badge variant="outline" className="text-xs ml-2">
            {activeOperators.length} active / {data.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-lg border border-slate-200 p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{totalAttempts.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Questions Answered</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{avgAccuracy}%</p>
            <p className="text-xs text-slate-500">Avg Accuracy</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-center">
            <p className={`text-2xl font-bold ${readinessColor(avgReadiness)}`}>{avgReadiness}</p>
            <p className="text-xs text-slate-500">Avg Readiness</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{activeOperators.length}</p>
            <p className="text-xs text-slate-500">Actively Studying</p>
          </div>
        </div>

        {/* Per-operator progress table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Operator</th>
                <th className="pb-2 pr-4">Course</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Questions</th>
                <th className="pb-2 pr-4">Accuracy</th>
                <th className="pb-2 pr-4">Readiness</th>
                <th className="pb-2">Time Left</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const config = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.invited;
                const remaining = daysRemaining(row.accessEndsAt);
                const Icon = config.icon;
                return (
                  <tr key={row.licenceId} className="border-b last:border-0 hover:bg-slate-50/50">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="text-slate-700 truncate max-w-[160px]" title={row.operatorEmail ?? ""}>
                          {row.operatorEmail ?? "Unassigned"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {formatCourseKey(row.courseKey)}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700 tabular-nums">
                      {row.totalAttempts > 0 ? row.totalAttempts.toLocaleString() : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {row.totalAttempts > 0 ? (
                        <div className="flex items-center gap-2">
                          <Progress value={row.accuracy} className="h-1.5 w-16" />
                          <span className="text-xs tabular-nums text-slate-600">{row.accuracy}%</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {row.status === "active" && row.totalAttempts > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-slate-400" />
                          <span className={`text-xs font-semibold ${readinessColor(row.readinessScore)}`}>
                            {row.readinessScore}% — {readinessLabel(row.readinessScore)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Not started</span>
                      )}
                    </td>
                    <td className="py-3">
                      {remaining ? (
                        <span className={`text-xs ${remaining === "Expired" ? "text-red-600 font-medium" : "text-slate-500"}`}>
                          {remaining}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
