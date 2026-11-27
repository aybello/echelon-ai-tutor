import { useCallback, useEffect, useRef, useState } from "react";
import { getQueryKey } from "@trpc/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ECHELON_LOGO_URL } from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { signInHref } from "@shared/funnelNavigation";
import {
  RECRUITMENT_CONSENT_VERSION,
  RECRUITMENT_NOTICE,
  type RecruitmentCandidateView,
} from "@shared/recruitmentAssessment";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const card =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8";
const isTerminal = (status: RecruitmentCandidateView["status"]) =>
  ["submitted", "timed_out", "expired", "revoked"].includes(status);
const date = (ms: number) =>
  new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
function timeRemaining(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(seconds / 3600);
  return `${hours > 0 ? `${hours}:` : ""}${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The server could not be reached. Check your connection and try again.";
}
function errorCode(error: unknown) {
  return (error as { data?: { code?: string } } | null)?.data?.code;
}
function ErrorNotice({
  message,
  onRetry,
  pending,
}: {
  message: string;
  onRetry?: () => void;
  pending?: boolean;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <p>{message}</p>
      {onRetry && (
        <Button
          type="button"
          className="mt-3 min-h-11"
          variant="outline"
          disabled={pending}
          onClick={onRetry}
        >
          {pending ? "Checking…" : "Try again"}
        </Button>
      )}
    </div>
  );
}

export default function RecruitmentAssessment({
  params,
}: { params?: { assignmentId?: string } } = {}) {
  const [, routeParams] = useRoute("/recruitment/:assignmentId");
  const assignmentId = params?.assignmentId ?? routeParams?.assignmentId ?? "";
  usePageMeta({
    title: "Recruitment assessment | Echelon Institute",
    description: "Complete your employer's knowledge assessment.",
    noindex: true,
  });
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <a
            href="/"
            className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <img src={ECHELON_LOGO_URL} alt="" className="h-8 w-8" />
            <span className="text-sm font-semibold">Echelon Institute</span>
          </a>
          <span className="text-xs font-medium text-slate-500 sm:text-sm">
            Recruitment assessment
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8 sm:py-12">
        {UUID.test(assignmentId) ? (
          <CandidateAssessment key={assignmentId} assignmentId={assignmentId} />
        ) : (
          <div className={card}>
            <h1 className="text-2xl font-bold">
              This invitation link is not valid
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Ask the hiring team for the full assessment invitation link.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function CandidateAssessment({ assignmentId }: { assignmentId: string }) {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const query = trpc.recruitment.candidateGet.useQuery(
    { assignmentId },
    {
      retry: false,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: "always",
    }
  );
  const start = trpc.recruitment.start.useMutation();
  const save = trpc.recruitment.saveAnswer.useMutation();
  const submit = trpc.recruitment.submit.useMutation();
  const [view, setView] = useState<RecruitmentCandidateView | null>(null);
  const viewRef = useRef<RecruitmentCandidateView | null>(null);
  const live = useRef(true);
  // Includes manual reads and writes: a new action cannot overtake an in-flight save.
  const operation = useRef(false);
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine
  );
  const [now, setNow] = useState(Date.now());
  const clockOffset = useRef(0);
  const [accepted, setAccepted] = useState(false);
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const expectedRevision = useRef<number | null>(null);
  const entryConsumed = useRef(false);
  // Responses from an earlier session must not restore its candidate data.
  const sessionEpoch = useRef(0);
  const [sessionRefreshPending, setSessionRefreshPending] = useState(false);
  const deadlineChecked = useRef<number | null>(null);
  const questionHeading = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  useEffect(() => {
    const connected = () => setOnline(true),
      disconnected = () => setOnline(false);
    window.addEventListener("online", connected);
    window.addEventListener("offline", disconnected);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.removeEventListener("online", connected);
      window.removeEventListener("offline", disconnected);
      window.clearInterval(tick);
    };
  }, []);
  const clearCandidate = useCallback(() => {
    viewRef.current = null;
    setView(null);
    setAccepted(false);
    setIndex(0);
    setMessage("");
    setSaveState("idle");
    expectedRevision.current = null;
    setSubmitOpen(false);
    deadlineChecked.current = null;
    // Remove only this assignment, never another candidate's query cache.
    void utils.recruitment.candidateGet.cancel({ assignmentId });
    queryClient.removeQueries({
      queryKey: getQueryKey(
        trpc.recruitment.candidateGet,
        { assignmentId },
        "query"
      ),
      exact: true,
    });
  }, [assignmentId, queryClient, utils]);
  const handleAccessFailure = useCallback(
    (failure: unknown) => {
      const code = errorCode(failure);
      if (code !== "UNAUTHORIZED" && code !== "FORBIDDEN") return false;
      entryConsumed.current = true;
      sessionEpoch.current += 1;
      clearCandidate();
      setNeedsRefresh(true);
      setAuthRequired(code === "UNAUTHORIZED");
      setForbidden(code === "FORBIDDEN");
      setError(errorMessage(failure));
      return true;
    },
    [clearCandidate]
  );
  function changeSubmitOpen(open: boolean) {
    expectedRevision.current = open
      ? (viewRef.current?.revision ?? null)
      : null;
    setSubmitOpen(open && expectedRevision.current !== null);
  }
  const mergeServerView = useCallback(
    (next: RecruitmentCandidateView) => {
      if (!live.current || next.assignmentId !== assignmentId) return;
      const current = viewRef.current;
      if (
        current &&
        (next.revision < current.revision ||
          (next.revision === current.revision &&
            next.serverNowMs < current.serverNowMs) ||
          (isTerminal(current.status) && !isTerminal(next.status)))
      )
        return;
      if (
        expectedRevision.current !== null &&
        expectedRevision.current !== next.revision
      ) {
        expectedRevision.current = null;
        setSubmitOpen(false);
        setMessage(
          "Saved answers changed. Review the latest answers and open submission confirmation again."
        );
      }
      if (!isTerminal(next.status) && next.serverNowMs < next.deadlineMs)
        deadlineChecked.current = null;
      clockOffset.current = next.serverNowMs - Date.now();
      viewRef.current = next;
      setView(next);
      setNow(Date.now());
    },
    [assignmentId]
  );
  useEffect(() => {
    // Cached success is not proof that the current session owns this invitation.
    if (query.isError) {
      handleAccessFailure(query.error);
      return;
    }
    const mayConsume =
      !entryConsumed.current ||
      (!needsRefresh && !sessionRefreshPending && !authRequired && !forbidden);
    if (
      mayConsume &&
      query.isFetchedAfterMount &&
      !query.isFetching &&
      query.isSuccess &&
      query.data
    ) {
      entryConsumed.current = true;
      mergeServerView(query.data);
    }
  }, [
    query.data,
    query.error,
    query.isError,
    query.isSuccess,
    query.isFetchedAfterMount,
    query.isFetching,
    needsRefresh,
    sessionRefreshPending,
    authRequired,
    forbidden,
    mergeServerView,
    handleAccessFailure,
  ]);
  function commitServerView(next: RecruitmentCandidateView) {
    mergeServerView(next);
    // The exact assignment cache receives only the server candidate DTO.
    utils.recruitment.candidateGet.setData({ assignmentId }, next);
  }
  const refreshServer = useCallback(
    async (reason: "retry" | "deadline" | "session" = "retry") => {
      if (operation.current || !live.current || !navigator.onLine) return;
      const epoch = sessionEpoch.current;
      operation.current = true;
      setBusy(true);
      setError("");
      try {
        await utils.recruitment.candidateGet.cancel({ assignmentId });
        if (!live.current || epoch !== sessionEpoch.current) return;
        const next = await utils.recruitment.candidateGet.fetch(
          { assignmentId },
          { staleTime: 0 }
        );
        if (!live.current || epoch !== sessionEpoch.current) return;
        entryConsumed.current = true;
        mergeServerView(next);
        setNeedsRefresh(false);
        setAuthRequired(false);
        setForbidden(false);
        setSaveState("idle");
        if (reason === "retry")
          setMessage(
            "Saved answers refreshed from the server. Choose any answer again if your last save was not confirmed."
          );
        if (reason === "deadline" && !isTerminal(next.status))
          setMessage(
            "The server is checking your assessment deadline. Refresh status before continuing."
          );
      } catch (failure) {
        if (!live.current || epoch !== sessionEpoch.current) return;
        if (handleAccessFailure(failure)) return;
        setError(errorMessage(failure));
        setNeedsRefresh(true);
      } finally {
        operation.current = false;
        if (live.current) setBusy(false);
      }
    },
    [assignmentId, handleAccessFailure, mergeServerView, utils]
  );
  useEffect(() => {
    const revalidate = () => {
      if (!live.current) return;
      entryConsumed.current = true;
      sessionEpoch.current += 1;
      clearCandidate();
      setNeedsRefresh(true);
      setSessionRefreshPending(true);
    };
    const visibility = () => {
      // Clear even while hidden, before an account-switched tab becomes visible.
      revalidate();
    };
    const storage = (event: StorageEvent) => {
      if (event.key === null || event.key === "manus-runtime-user-info")
        revalidate();
    };
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      const path = event.query.queryKey[0];
      const identity = Array.isArray(path) ? path.join(".") : "";
      if (
        (identity === "auth.me" || identity === "dashboardAuth.me") &&
        (event.type === "removed" ||
          (event.type === "updated" && event.action.type === "success"))
      )
        revalidate();
    });
    window.addEventListener("focus", revalidate);
    window.addEventListener("storage", storage);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", revalidate);
      window.removeEventListener("storage", storage);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [clearCandidate, queryClient]);
  useEffect(() => {
    if (
      !sessionRefreshPending ||
      busy ||
      operation.current ||
      !online ||
      document.visibilityState === "hidden"
    )
      return;
    setSessionRefreshPending(false);
    // Reads wait for any in-flight write, but old saves are never replayed.
    void refreshServer("session");
  }, [sessionRefreshPending, busy, online, refreshServer]);

  const serverNow = now + clockOffset.current;
  const deadlineReached = !!view && serverNow >= view.deadlineMs;
  useEffect(() => {
    if (
      !view ||
      isTerminal(view.status) ||
      !deadlineReached ||
      !online ||
      busy ||
      operation.current ||
      query.isFetching ||
      deadlineChecked.current === view.deadlineMs
    )
      return;
    deadlineChecked.current = view.deadlineMs;
    // Never score from a browser timer. candidateGet applies the server deadline.
    void refreshServer("deadline");
  }, [view, deadlineReached, online, busy, query.isFetching, refreshServer]);

  async function begin() {
    if (
      !accepted ||
      operation.current ||
      query.isFetching ||
      !view ||
      view.status !== "invited" ||
      !online ||
      deadlineReached ||
      needsRefresh
    )
      return;
    const epoch = sessionEpoch.current;
    operation.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await utils.recruitment.candidateGet.cancel({ assignmentId });
      if (epoch !== sessionEpoch.current) return;
      const next = await start.mutateAsync({
        assignmentId,
        acceptedNotice: true,
        consentVersion: RECRUITMENT_CONSENT_VERSION,
      });
      if (live.current && epoch === sessionEpoch.current) {
        commitServerView(next);
        setIndex(0);
      }
    } catch (failure) {
      if (live.current && epoch === sessionEpoch.current) {
        if (handleAccessFailure(failure)) return;
        setError(errorMessage(failure));
        setNeedsRefresh(true);
      }
    } finally {
      operation.current = false;
      if (live.current) setBusy(false);
    }
  }
  async function selectAnswer(
    questionId: string,
    selectedIndex: number | null
  ) {
    const current = viewRef.current;
    if (
      !current ||
      current.status !== "active" ||
      operation.current ||
      query.isFetching ||
      !online ||
      needsRefresh ||
      deadlineReached
    )
      return;
    const epoch = sessionEpoch.current;
    operation.current = true;
    setBusy(true);
    setSaveState("saving");
    setError("");
    setMessage("");
    try {
      await utils.recruitment.candidateGet.cancel({ assignmentId });
      if (epoch !== sessionEpoch.current) return;
      const next = await save.mutateAsync({
        assignmentId,
        questionId,
        selectedIndex,
        revision: current.revision,
      });
      if (live.current && epoch === sessionEpoch.current) {
        commitServerView(next);
        setSaveState("saved");
      }
    } catch (failure) {
      if (!live.current || epoch !== sessionEpoch.current) return;
      if (handleAccessFailure(failure)) return;
      setSaveState("error");
      if (errorCode(failure) === "CONFLICT") {
        changeSubmitOpen(false);
        setMessage(
          "Another session changed your answers. Loading the latest saved answers; choose your answer again after the refresh. Your last choice was not replayed."
        );
        try {
          const latest = await utils.recruitment.candidateGet.fetch(
            { assignmentId },
            { staleTime: 0 }
          );
          if (live.current && epoch === sessionEpoch.current) {
            commitServerView(latest);
            setNeedsRefresh(false);
          }
        } catch (refreshFailure) {
          if (live.current && epoch === sessionEpoch.current) {
            if (handleAccessFailure(refreshFailure)) return;
            setError(errorMessage(refreshFailure));
            setNeedsRefresh(true);
          }
        }
      } else {
        setError(
          `${errorMessage(failure)} Your choice has not been confirmed as saved. Refresh the saved answers, then choose again.`
        );
        setNeedsRefresh(true);
      }
    } finally {
      operation.current = false;
      if (live.current) setBusy(false);
    }
  }
  async function finish() {
    const current = viewRef.current;
    if (
      operation.current ||
      query.isFetching ||
      !online ||
      !current ||
      current.status !== "active" ||
      !submitOpen ||
      expectedRevision.current === null ||
      expectedRevision.current !== current.revision ||
      needsRefresh ||
      deadlineReached
    )
      return;
    const revision = expectedRevision.current;
    const epoch = sessionEpoch.current;
    operation.current = true;
    setBusy(true);
    setError("");
    try {
      await utils.recruitment.candidateGet.cancel({ assignmentId });
      // The server verifies exactly the revision reviewed in this confirmation.
      if (epoch !== sessionEpoch.current) return;
      const next = await submit.mutateAsync({ assignmentId, revision });
      if (live.current && epoch === sessionEpoch.current) {
        commitServerView(next);
        changeSubmitOpen(false);
      }
    } catch (failure) {
      if (!live.current || epoch !== sessionEpoch.current) return;
      changeSubmitOpen(false);
      if (handleAccessFailure(failure)) return;
      if (errorCode(failure) === "CONFLICT") {
        setNeedsRefresh(true);
        setMessage(
          "Another session changed your answers. Loading the latest saved answers; review them and confirm submission again. Submission was not retried."
        );
        try {
          const latest = await utils.recruitment.candidateGet.fetch(
            { assignmentId },
            { staleTime: 0 }
          );
          if (live.current && epoch === sessionEpoch.current) {
            commitServerView(latest);
            setNeedsRefresh(false);
          }
        } catch (refreshFailure) {
          if (live.current && epoch === sessionEpoch.current) {
            if (handleAccessFailure(refreshFailure)) return;
            setError(errorMessage(refreshFailure));
          }
        }
      } else {
        setError(errorMessage(failure));
        setNeedsRefresh(true);
      }
    } finally {
      operation.current = false;
      if (live.current) setBusy(false);
    }
  }
  function goTo(nextIndex: number) {
    if (busy) return;
    setIndex(nextIndex);
    requestAnimationFrame(() => {
      if (live.current) questionHeading.current?.focus({ preventScroll: true });
    });
  }
  const loginLink = signInHref(`/recruitment/${assignmentId}`);
  const signedOut = authRequired || query.error?.data?.code === "UNAUTHORIZED";
  const accessDenied = forbidden || query.error?.data?.code === "FORBIDDEN";
  const blocked =
    busy || query.isFetching || !online || needsRefresh || deadlineReached;
  const networkNotice = !online ? (
    <div
      role="alert"
      className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <WifiOff className="h-5 w-5 shrink-0" aria-hidden="true" />
      <p>
        You are offline. This assessment requires an internet connection;
        answers cannot be saved offline. Reconnect, then refresh saved answers
        before continuing. Server time continues while you are disconnected.
      </p>
    </div>
  ) : null;
  // A disconnected tab must reconcile with the server before the next write.
  useEffect(() => {
    if (!online && viewRef.current) setNeedsRefresh(true);
  }, [online]);

  if (signedOut)
    return (
      <div className={`${card} space-y-4`}>
        <h1 className="text-2xl font-bold">Sign in to open your invitation</h1>
        <p className="text-sm leading-relaxed text-slate-600">
          Use the verified email address the hiring team invited. An assessment
          link cannot be used by a different account.
        </p>
        <Button
          asChild
          className="min-h-11 bg-blue-700 text-white hover:bg-blue-800"
        >
          <a href={loginLink}>Sign in with your invited email</a>
        </Button>
        <p className="text-xs text-slate-500">
          After signing in, you will return to this assessment.
        </p>
      </div>
    );
  if (accessDenied)
    return (
      <div className={`${card} space-y-4`}>
        <h1 className="text-2xl font-bold">
          This invitation is not available to this account
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">
          Sign in with the verified email address the hiring team invited, or
          contact the hiring team for help.
        </p>
        <Button
          asChild
          className="min-h-11 bg-blue-700 text-white hover:bg-blue-800"
        >
          <a href={loginLink}>Sign in with your invited email</a>
        </Button>
        <ErrorNotice
          message={error || "Your account cannot open this invitation."}
          onRetry={() => void refreshServer()}
          pending={busy || query.isFetching}
        />
      </div>
    );
  if (!view) {
    if (query.isError)
      return (
        <div className={`${card} space-y-4`}>
          <h1 className="text-2xl font-bold">
            We could not open this assessment
          </h1>
          {networkNotice}
          <ErrorNotice
            message={
              query.error.message ||
              "Check the invitation link and your connection."
            }
            onRetry={() => void refreshServer()}
            pending={busy || query.isFetching}
          />
          <p className="text-sm text-slate-600">
            If this invitation belongs to another account,{" "}
            <a className="font-medium text-blue-700 underline" href={loginLink}>
              sign in with the invited email
            </a>
            . Otherwise, contact the hiring team for help.
          </p>
        </div>
      );
    return (
      <div className={`${card} space-y-4`}>
        {networkNotice}
        <p role="status" className="text-sm text-slate-600">
          {busy || query.isLoading || query.isFetching || sessionRefreshPending
            ? "Loading your assessment…"
            : "Waiting for a connection…"}
        </p>
        {error && (
          <ErrorNotice
            message={error}
            onRetry={() => void refreshServer()}
            pending={busy}
          />
        )}
      </div>
    );
  }
  if (isTerminal(view.status)) {
    const completed =
      view.status === "submitted" || view.status === "timed_out";
    const heading =
      view.status === "submitted"
        ? "Assessment submitted"
        : view.status === "timed_out"
          ? "Assessment time has ended"
          : view.status === "revoked"
            ? "This invitation has been revoked"
            : "This invitation has expired";
    return (
      <div className={`${card} space-y-6`}>
        <div className="flex items-start gap-4">
          <div
            className={`rounded-xl p-3 ${completed ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"}`}
          >
            {completed ? (
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Clock className="h-6 w-6" aria-hidden="true" />
            )}
          </div>
          <div>
            <p className="text-sm text-slate-500">{view.orgName}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {heading}
            </h1>
          </div>
        </div>
        <p className="font-semibold">{view.title}</p>
        <p className="text-sm leading-relaxed text-slate-600">
          {completed
            ? view.status === "timed_out"
              ? "Your saved answers have been recorded. The hiring team has your results and will review them as part of a human-led recruitment process."
              : "The hiring team has your results and will review them as part of a human-led recruitment process."
            : "You can no longer start or continue this assessment. Contact the hiring team if you need a new invitation."}
        </p>
        {completed && (
          <p className="text-sm text-slate-600">
            Scores and the answer key are not shown here. This knowledge
            assessment does not make an automatic hiring decision.
          </p>
        )}
      </div>
    );
  }
  if (view.status === "invited")
    return (
      <div className={`${card} space-y-6`}>
        <div>
          <p className="text-sm font-semibold text-blue-700">
            Invitation from {view.orgName}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {view.title}
          </h1>
          <p className="mt-3 text-slate-600">{view.courseLabel}</p>
        </div>
        <dl className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-slate-500">Length</dt>
            <dd className="mt-1 font-semibold">
              {view.questionCount} questions
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Time limit</dt>
            <dd className="mt-1 font-semibold">
              {view.timeLimitMinutes === null
                ? "No time limit"
                : `${view.timeLimitMinutes} minutes`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Invitation expires</dt>
            <dd className="mt-1 text-sm font-semibold">
              {date(view.expiresAtMs)}
            </dd>
          </div>
        </dl>
        <div>
          <h2 className="text-sm font-semibold">Topics covered</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {view.modules.map(module => (
              <li
                key={module}
                className="rounded-full bg-blue-50 px-3 py-2 text-sm text-blue-800"
              >
                {module}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
          <h2 className="flex items-center gap-2 font-semibold text-teal-900">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            Before you start
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-teal-900">
            {RECRUITMENT_NOTICE}
          </p>
          {view.notice && view.notice !== RECRUITMENT_NOTICE && (
            <p className="mt-3 text-sm leading-relaxed text-teal-900">
              {view.notice}
            </p>
          )}
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          All candidates for this assessment receive the same form. Prior
          exposure through study tools is not prevented. This assessment is not
          proctored. There is no tutor, answer key, or explanation during the
          assessment, and it does not update your study readiness progress.
        </p>
        <p className="text-sm leading-relaxed text-slate-600">
          An internet connection is required to save answers. You can return to
          this link to resume saved answers before the server deadline.{" "}
          {view.timeLimitMinutes === null
            ? "You must submit before the invitation expires."
            : "The timer starts when you select Start assessment and does not pause if you leave the page."}{" "}
          Request any accommodation from the hiring team before starting.
        </p>
        {networkNotice}
        {error && (
          <ErrorNotice
            message={error}
            onRetry={() => void refreshServer()}
            pending={busy}
          />
        )}
        {(needsRefresh || deadlineReached) && !error && (
          <ErrorNotice
            message={
              deadlineReached
                ? "The invitation deadline has been reached. Check the server status."
                : "Refresh the server status before continuing."
            }
            onRetry={() => void refreshServer()}
            pending={busy}
          />
        )}
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-relaxed">
          <Checkbox
            className="mt-1"
            checked={accepted}
            onCheckedChange={value => setAccepted(value === true)}
            disabled={busy}
          />
          <span>
            I have read the notice above and consent to the hiring team viewing
            my assessment answers, completion time, and topic scores.
          </span>
        </label>
        <Button
          type="button"
          className="min-h-11 w-full bg-blue-700 text-white hover:bg-blue-800 sm:w-auto"
          onClick={() => void begin()}
          disabled={!accepted || blocked}
        >
          {start.isPending ? "Starting assessment…" : "Start assessment"}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    );

  const answered = view.questions.filter(question =>
    Number.isInteger(view.answers[question.id])
  ).length;
  const unanswered = Math.max(0, view.questionCount - answered);
  const question =
    view.questions[Math.min(index, Math.max(0, view.questions.length - 1))];
  if (!question)
    return (
      <div className={card}>
        <ErrorNotice
          message="The assessment questions are unavailable. Refresh the server status or contact the hiring team."
          onRetry={() => void refreshServer()}
          pending={busy}
        />
      </div>
    );
  const selectedIndex = view.answers[question.id];
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">{view.orgName}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {view.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {view.courseLabel} · {answered} of {view.questionCount} answered
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {view.timeLimitMinutes === null
              ? "Invitation deadline"
              : "Time remaining"}
          </p>
          <p
            role="timer"
            aria-label={
              view.timeLimitMinutes === null
                ? `Invitation expires ${date(view.deadlineMs)}`
                : "Time remaining"
            }
            className={`mt-1 text-lg font-semibold tabular-nums ${deadlineReached ? "text-amber-800" : "text-slate-900"}`}
          >
            {view.timeLimitMinutes === null
              ? date(view.deadlineMs)
              : timeRemaining(view.deadlineMs - serverNow)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Server deadline applies</p>
        </div>
      </div>
      {networkNotice}
      {error && (
        <ErrorNotice
          message={error}
          onRetry={() => void refreshServer()}
          pending={busy}
        />
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900"
        >
          {message}
        </p>
      )}
      {(needsRefresh || deadlineReached) && !error && (
        <ErrorNotice
          message={
            deadlineReached
              ? "Time has ended on this display. Checking the server determines the final assessment state."
              : "Refresh your saved answers before continuing."
          }
          onRetry={() => void refreshServer()}
          pending={busy}
        />
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <section
          className={`${card} space-y-6`}
          aria-labelledby="candidate-question-heading"
        >
          <div className="flex flex-wrap justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Question {index + 1} of {view.questionCount} · {question.module}
            </p>
            <p
              role="status"
              aria-live="polite"
              className={`text-xs font-medium ${saveState === "error" ? "text-amber-800" : "text-teal-800"}`}
            >
              {saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                  ? "Saved to server"
                  : saveState === "error"
                    ? "Last choice not confirmed saved"
                    : "Answers save when selected"}
            </p>
          </div>
          <h2
            id="candidate-question-heading"
            ref={questionHeading}
            tabIndex={-1}
            className="whitespace-pre-wrap text-xl font-semibold leading-relaxed focus:outline-none"
          >
            {question.prompt}
          </h2>
          <RadioGroup
            aria-labelledby="candidate-question-heading"
            value={selectedIndex === undefined ? "" : String(selectedIndex)}
            onValueChange={value =>
              void selectAnswer(question.id, Number(value))
            }
            disabled={blocked}
            className="gap-3"
          >
            {question.options.map((option, optionIndex) => (
              <Label
                key={`${question.id}:${optionIndex}`}
                htmlFor={`assessment-answer-${optionIndex}`}
                className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm font-normal leading-relaxed ${selectedIndex === optionIndex ? "border-blue-400 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"} ${blocked ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <RadioGroupItem
                  id={`assessment-answer-${optionIndex}`}
                  value={String(optionIndex)}
                  className="mt-0.5 shrink-0"
                />
                <span className="whitespace-pre-wrap">{option}</span>
              </Label>
            ))}
          </RadioGroup>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 text-slate-600"
              disabled={selectedIndex === undefined || blocked}
              onClick={() => void selectAnswer(question.id, null)}
            >
              Clear answer
            </Button>
            <span className="text-xs text-slate-500">
              No answer is selected until saved by the server.
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={index === 0 || busy}
              onClick={() => goTo(index - 1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
            {index < view.questions.length - 1 ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={busy}
                onClick={() => goTo(index + 1)}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="button"
                className="min-h-11 bg-blue-700 text-white hover:bg-blue-800"
                disabled={blocked}
                onClick={() => changeSubmitOpen(true)}
              >
                Review submission
              </Button>
            )}
          </div>
        </section>
        <aside
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          aria-label="Question navigation"
        >
          <div>
            <h2 className="text-sm font-semibold">Your questions</h2>
            <p className="mt-2 text-xs text-slate-500">
              {answered} answered · {unanswered} unanswered
            </p>
          </div>
          <nav
            aria-label="Jump to a question"
            className="grid grid-cols-5 gap-2 lg:grid-cols-4"
          >
            {view.questions.map((item, itemIndex) => {
              const done = Number.isInteger(view.answers[item.id]);
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`min-h-11 min-w-11 rounded-lg border text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${index === itemIndex ? "border-blue-700 bg-blue-700 text-white" : done ? "border-teal-200 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  aria-label={`Question ${itemIndex + 1}, ${done ? "answered" : "unanswered"}`}
                  aria-current={index === itemIndex ? "step" : undefined}
                  disabled={busy}
                  onClick={() => goTo(itemIndex)}
                >
                  {itemIndex + 1}
                </button>
              );
            })}
          </nav>
          <p className="text-xs text-slate-500">
            Teal: answered · Blue: current question
          </p>
          <Button
            type="button"
            className="min-h-11 w-full bg-blue-700 text-white hover:bg-blue-800"
            disabled={blocked}
            onClick={() => changeSubmitOpen(true)}
          >
            Review submission
          </Button>
          <p className="text-xs leading-relaxed text-slate-500">
            Online only. Saved answers resume from this link. The hiring team
            reviews results; there is no automatic hiring decision.
          </p>
        </aside>
      </div>
      <Dialog
        open={submitOpen && view.status === "active"}
        onOpenChange={open => {
          if (!busy) changeSubmitOpen(open);
        }}
      >
        <DialogContent className="motion-reduce:animate-none">
          <DialogHeader>
            <DialogTitle>Submit your assessment?</DialogTitle>
            <DialogDescription>
              {answered} of {view.questionCount} questions are answered.{" "}
              {unanswered > 0
                ? `${unanswered} ${unanswered === 1 ? "question is" : "questions are"} unanswered. You can return to the questions before submitting.`
                : "All questions have a saved answer."}{" "}
              After submission, you cannot change your answers. The hiring team
              will receive the results for human review.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={busy}
              onClick={() => changeSubmitOpen(false)}
            >
              Return to questions
            </Button>
            <Button
              type="button"
              className="min-h-11 bg-blue-700 text-white hover:bg-blue-800"
              disabled={blocked || expectedRevision.current !== view.revision}
              onClick={() => void finish()}
            >
              {submit.isPending ? "Submitting…" : "Submit assessment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
