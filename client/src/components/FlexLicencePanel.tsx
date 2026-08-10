import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface FlexLicencePanelProps {
  organizationId: number;
}

const STATUS_COLORS: Record<string, string> = {
  unused: "bg-gray-100 text-gray-700",
  invited: "bg-blue-100 text-blue-700",
  assigned: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-700",
  revoked: "bg-red-200 text-red-800",
  suspended: "bg-orange-100 text-orange-700",
};

export function FlexLicencePanel({ organizationId }: FlexLicencePanelProps) {
  const [inviteEmail, setInviteEmail] = useState<Record<number, string>>({});
  const [invitingId, setInvitingId] = useState<number | null>(null);

  const licencesQuery = trpc.teamFlex.listLicences.useQuery({ organizationId });
  const inviteMutation = trpc.teamFlex.inviteLicence.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent");
      licencesQuery.refetch();
      setInvitingId(null);
    },
    onError: (err) => toast.error(err.message),
  });
  const cancelMutation = trpc.teamFlex.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation cancelled");
      licencesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const licences = licencesQuery.data ?? [];

  if (licences.length === 0) {
    return null; // No Flex licences — don't show the panel
  }

  const grouped = {
    unused: licences.filter(l => l.status === "unused"),
    invited: licences.filter(l => l.status === "invited"),
    assigned: licences.filter(l => l.status === "assigned"),
    active: licences.filter(l => l.status === "active"),
    expired: licences.filter(l => l.status === "expired" || l.status === "revoked"),
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Flex Licences</span>
          <Badge variant="outline" className="text-xs">
            {licences.filter(l => l.status === "active").length} active / {licences.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Course</th>
                <th className="pb-2 pr-4">Term</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Operator</th>
                <th className="pb-2 pr-4">Expires</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {licences.map((lic) => (
                <tr key={lic.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{lic.courseKey}</td>
                  <td className="py-2 pr-4">{lic.termMonths}mo</td>
                  <td className="py-2 pr-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[lic.status] ?? "bg-gray-100"}`}>
                      {lic.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {lic.invitedEmail ?? (lic.operatorUserId ? `User #${lic.operatorUserId}` : "—")}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {lic.accessEndsAt ? new Date(lic.accessEndsAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2">
                    {lic.status === "unused" && (
                      <div className="flex items-center gap-1">
                        {invitingId === lic.id ? (
                          <>
                            <Input
                              type="email"
                              placeholder="operator@email.com"
                              className="h-7 w-44 text-xs"
                              value={inviteEmail[lic.id] ?? ""}
                              onChange={(e) => setInviteEmail(prev => ({ ...prev, [lic.id]: e.target.value }))}
                            />
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
                              disabled={!inviteEmail[lic.id]}
                              onClick={() => inviteMutation.mutate({
                                licenceId: lic.id,
                                operatorEmail: inviteEmail[lic.id] ?? "",
                                organizationId,
                              })}
                            >
                              Send
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setInvitingId(null)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setInvitingId(lic.id)}>
                            Invite
                          </Button>
                        )}
                      </div>
                    )}
                    {lic.status === "invited" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-600"
                        onClick={() => cancelMutation.mutate({ licenceId: lic.id, organizationId })}
                      >
                        Cancel Invite
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
