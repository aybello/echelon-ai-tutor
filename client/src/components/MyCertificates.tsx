import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CertificateStatusBand } from "@shared/certificates";

const BAND_COLORS: Record<CertificateStatusBand, string> = {
  expired: "bg-red-100 text-red-700",
  within30: "bg-orange-100 text-orange-700",
  within90: "bg-yellow-100 text-yellow-800",
  current: "bg-green-100 text-green-700",
};

const BAND_LABELS: Record<CertificateStatusBand, string> = {
  expired: "Expired",
  within30: "30 days or less",
  within90: "90 days or less",
  current: "Current",
};

/**
 * The operator's own provincial certificates, as tracked by their
 * organization's manager. Renders nothing when no certificates are on file,
 * so the account page is unchanged for learners without a tracked register.
 * The operator also receives the same 90/60/30/7/0-day email alerts as their
 * managers.
 */
export function MyCertificates() {
  const query = trpc.certificates.myCertificates.useQuery(undefined, { retry: false });
  const rows = query.data ?? [];
  if (query.isLoading || query.isError || rows.length === 0) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>My Certificates</CardTitle>
        <p className="mt-1 text-sm text-slate-600">
          Your provincial certificates as tracked by your organization. You and your managers are
          emailed at 90, 60, 30, and 7 days before a certificate expires, and on the expiry date.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rows.map((row) => {
            const expiresAt = row.expiresAt instanceof Date ? row.expiresAt : new Date(row.expiresAt);
            return (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <div>
                  <div className="font-medium">{row.certificateLabel}</div>
                  <div className="text-sm text-slate-600">
                    No. {row.certificateNumber} · Expires{" "}
                    {expiresAt.toLocaleDateString("en-CA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}{" "}
                    ({row.daysUntilExpiry < 0
                      ? `${Math.abs(row.daysUntilExpiry)} days ago`
                      : `${row.daysUntilExpiry} days left`})
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={BAND_COLORS[row.statusBand]}>{BAND_LABELS[row.statusBand]}</Badge>
                  {row.coursePath && (
                    <Link href={row.coursePath} className="text-sm text-blue-700 underline">
                      Prepare for renewal
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
