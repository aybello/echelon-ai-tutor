import { useMemo } from "react";
import { Link } from "wouter";
import { CheckCircle2, Clock3, GraduationCap, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import LandingNav from "@/components/LandingNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function CoursePassClaim() {
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);

  // This page is visited anonymously, sends the operator through OTP, then is
  // mounted again in the same SPA. The query cache still contains the earlier
  // unauthenticated result unless we explicitly re-check the verified cookie.
  const session = trpc.dashboardAuth.me.useQuery(undefined, {
    refetchOnMount: "always",
  });
  const invitation = trpc.teamFlex.getInvitation.useQuery(
    { token },
    { enabled: /^[a-f0-9]{64}$/i.test(token), retry: false },
  );
  const myLicences = trpc.teamFlex.myLicences.useQuery(undefined, {
    enabled: !!session.data?.email,
    retry: false,
  });

  const claim = trpc.teamFlex.claimInvitation.useMutation({
    onSuccess: async () => {
      toast.success("Course Pass claimed");
      await myLicences.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const activate = trpc.teamFlex.activateLicence.useMutation({
    onSuccess: async () => {
      toast.success("Course activated. Your access starts now.");
      await myLicences.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const targetLicenceId = claim.data?.licenceId ?? invitation.data?.licenceId;
  const pass = myLicences.data?.find((item) => item.id === targetLicenceId)
    ?? myLicences.data?.find((item) => item.status === "assigned" || item.status === "active");
  const nextPath = `/course-pass/claim?token=${encodeURIComponent(token)}`;
  const loginUrl = `/login/otp?next=${encodeURIComponent(nextPath)}`;

  const courseName = pass?.courseName ?? invitation.data?.courseName ?? "your assigned course";
  const termMonths = pass?.termMonths ?? invitation.data?.termMonths;
  const isActive = pass?.status === "active";
  const isAssigned = pass?.status === "assigned";
  const isVerified = !!session.data?.email;

  return (
    <div className="min-h-screen bg-slate-50">
      <LandingNav currentPath="/course-pass/claim" />
      <main className="mx-auto max-w-2xl px-5 py-14">
        <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Echelon Course Pass</p>
              <CardTitle className="text-2xl text-slate-900">{courseName}</CardTitle>
              {termMonths && <p className="mt-2 text-sm text-slate-600">{termMonths}-month access, beginning when you activate</p>}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!token || invitation.error && !pass ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                This invitation is invalid, expired, or has already been used. Sign in with the invited email to view any Course Pass you already claimed.
              </div>
            ) : null}

            {!isVerified && invitation.data ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                  <div className="mb-1 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Verify your work email</div>
                  Sign in as {invitation.data.maskedEmail}. We will send a one-time code to confirm the Course Pass belongs to you.
                </div>
                <Button asChild className="h-12 w-full bg-teal-700 text-base hover:bg-teal-800">
                  <Link href={loginUrl}>Verify Email &amp; Continue</Link>
                </Button>
              </div>
            ) : null}

            {isVerified && invitation.data && !pass ? (
              <div className="space-y-4">
                <p className="text-center text-sm text-slate-600">Signed in as <strong>{session.data?.email}</strong></p>
                <Button
                  className="h-12 w-full bg-teal-700 text-base hover:bg-teal-800"
                  disabled={claim.isPending}
                  onClick={() => claim.mutate({ token })}
                >
                  {claim.isPending ? "Claiming…" : "Claim Course Pass"}
                </Button>
              </div>
            ) : null}

            {isAssigned ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <div className="mb-1 flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4" /> Activation starts the clock</div>
                  Choose Activate Course only when you are ready to begin. Your {pass.termMonths}-month study period starts immediately and cannot be paused.
                </div>
                <Button
                  className="h-12 w-full bg-teal-700 text-base hover:bg-teal-800"
                  disabled={activate.isPending}
                  onClick={() => activate.mutate({ licenceId: pass.id })}
                >
                  {activate.isPending ? "Activating…" : "Activate Course"}
                </Button>
              </div>
            ) : null}

            {isActive ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <div className="mb-1 flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" /> Course access is active</div>
                  You can now use the full question bank and mock exams. Access ends {pass.accessEndsAt ? new Date(pass.accessEndsAt).toLocaleDateString() : "at the end of your term"}.
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button asChild className="h-12 bg-teal-700 hover:bg-teal-800"><Link href={`/activate/${encodeURIComponent(pass.courseKey)}`}>Set Up My Study Plan</Link></Button>
                  <Button asChild variant="outline" className="h-12"><Link href={pass.mockExamPath}>Take a Mock Exam</Link></Button>
                </div>
              </div>
            ) : null}

            {isVerified && !invitation.data && !pass && !myLicences.isLoading ? (
              <Button asChild variant="outline" className="w-full"><Link href="/dashboard">Go to Dashboard</Link></Button>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
