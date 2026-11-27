import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ClipboardList, Copy, Plus, ShieldCheck } from "lucide-react";
import { getQueryKey } from "@trpc/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  RecruitmentManagerPrivacyContext,
  useRecruitmentManagerPrivacy,
  useFreshRecruitmentQuery,
  type RecruitmentManagerAccess,
} from "@/hooks/recruitmentManagerPrivacy";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  recruitmentCreateInput,
  type RecruitmentCatalog,
  type RecruitmentDefinitionSummary,
  type RecruitmentResult,
} from "@shared/recruitmentAssessment";
import {
  RecruitmentError,
  RecruitmentResults,
  downloadRecruitmentCsv,
  recruitmentCard,
  recruitmentDate,
  recruitmentSelect,
} from "@/components/recruitment/RecruitmentResults";

type InvitationOutcome = {
  assessmentId: string;
  assignmentId: string;
  message: string;
};

function useLifetime() {
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  return live;
}

/** A keyed body also protects drafts if the caller does not key the panel. */
export default function RecruitmentPanel({ orgId }: { orgId: number }) {
  return <RecruitmentManagerScope key={orgId} orgId={orgId} />;
}
export { RecruitmentPanel };

function RecruitmentManagerScope({ orgId }: { orgId: number }) {
  const access = useRecruitmentManagerPrivacy(orgId);
  if (!access.ready) return <p role="status">Verifying recruitment access…</p>;
  return (
    <RecruitmentPanelBody key={access.epoch} orgId={orgId} access={access} />
  );
}

const privateQueryOptions = {
  retry: false,
  staleTime: 0,
  refetchOnMount: "always" as const,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  trpc: { abortOnUnmount: true },
};

function accessDenied(error: unknown) {
  const code = (error as { data?: { code?: string } } | null)?.data?.code;
  return code === "UNAUTHORIZED" || code === "FORBIDDEN";
}

function RecruitmentPanelBody({
  orgId,
  access,
}: {
  orgId: number;
  access: RecruitmentManagerAccess;
}) {
  const live = useLifetime();
  const isCurrent = () => live.current && access.isCurrent();
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const catalogKey = getQueryKey(trpc.recruitment.catalog, { orgId }, "query");
  const catalogFresh = useFreshRecruitmentQuery(
    catalogKey,
    access
  );
  const listFresh = useFreshRecruitmentQuery(
    getQueryKey(trpc.recruitment.list, { orgId }, "query"),
    access
  );
  const catalogQuery = trpc.recruitment.catalog.useQuery(
    { orgId },
    privateQueryOptions
  );
  const listQuery = trpc.recruitment.list.useQuery(
    { orgId },
    privateQueryOptions
  );
  const create = trpc.recruitment.create.useMutation();
  const [title, setTitle] = useState("");
  const [courseKey, setCourseKey] = useState("");
  const [modules, setModules] = useState<string[]>([]);
  const [count, setCount] = useState("20");
  const [timed, setTimed] = useState(false);
  const [minutes, setMinutes] = useState("30");
  const [expiry, setExpiry] = useState("7");
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // This parent survives ordinary refetches but is keyed by privacy epoch.
  // Outcomes stay hidden until fresh authorization and vanish on session reset.
  const [invitationOutcome, setInvitationOutcome] =
    useState<InvitationOutcome | null>(null);
  const authorized =
    access.isCurrent() &&
    listFresh &&
    listQuery.isFetchedAfterMount &&
    listQuery.isSuccess &&
    !listQuery.isFetching;
  // Reporting endpoints authorize historical access independently of the
  // current Annual term enforced by the catalog. Never infer authority from a
  // catalog denial, and never use cached catalog data to create or invite.
  const catalogAuthorized =
    authorized &&
    catalogFresh &&
    catalogQuery.isFetchedAfterMount &&
    catalogQuery.isSuccess &&
    !catalogQuery.isFetching;
  const catalogAuthorization = catalogAuthorized
    ? queryClient.getQueryState(catalogKey)
    : undefined;
  // Retained same-epoch form handlers must see a later catalog denial/refetch.
  // State identity also fences cache writes/fetches before React re-renders.
  const canUseCatalog = () =>
    isCurrent() &&
    !!catalogAuthorization &&
    queryClient.getQueryState(catalogKey) === catalogAuthorization &&
    catalogAuthorization.status === "success" &&
    catalogAuthorization.fetchStatus === "idle";
  const reportingVerified = useRef(false);
  if (authorized) reportingVerified.current = true;
  useEffect(() => {
    if (
      reportingVerified.current &&
      listQuery.isError &&
      accessDenied(listQuery.error) &&
      access.isCurrent()
    )
      access.reset();
  }, [listQuery.isError, listQuery.error, access]);
  const catalog: RecruitmentCatalog | undefined = catalogAuthorized
    ? catalogQuery.data
    : undefined;
  const definitions: RecruitmentDefinitionSummary[] | undefined =
    listQuery.data;
  const course = catalog?.courses.find(item => item.courseKey === courseKey);
  const selectedModules =
    course?.modules.filter(item => modules.includes(item.name)) ?? [];
  const available = selectedModules.reduce(
    (total, item) => total + item.count,
    0
  );
  const parsed = recruitmentCreateInput.safeParse({
    orgId,
    title: title.trim(),
    courseKey,
    modules,
    questionCount: Number(count),
    timeLimitMinutes: timed ? Number(minutes) : null,
    expiresInDays: Number(expiry),
  });
  const validation = !parsed.success
    ? (parsed.error.issues[0]?.message ?? "Check the assessment details.")
    : !course
      ? "Choose an available course."
      : modules.length !== selectedModules.length ||
          selectedModules.some(item => !item.count)
        ? "Choose topics with available questions."
        : Number(count) < modules.length
          ? "Use at least one question per selected topic."
          : Number(count) > available
            ? `Only ${available} questions are available in the selected topics. Choose fewer questions or more topics.`
            : "";
  async function createAssessment(event: React.FormEvent) {
    event.preventDefault();
    if (!isCurrent() || !authorized || !canUseCatalog()) return;
    setAttempted(true);
    setError("");
    setNotice("");
    if (!parsed.success || validation || create.isPending) return;
    const submittedOrg = orgId;
    try {
      const data = await create.mutateAsync(parsed.data);
      if (!isCurrent()) return;
      void utils.recruitment.list.invalidate({ orgId: submittedOrg });
      setSelectedId(data.assessmentId);
      setNotice(
        "Assessment created. Invite candidates with an eligible team seat below."
      );
      setTitle("");
      setCourseKey("");
      setModules([]);
      setAttempted(false);
    } catch (failure) {
      if (!isCurrent()) return;
      if (accessDenied(failure)) {
        access.reset();
        return;
      }
      if (isCurrent())
        setError(
          failure instanceof Error
            ? failure.message
            : "The assessment could not be created. Try again."
        );
    }
  }
  if (!authorized) {
    const failed = listQuery.isError;
    return (
      <section className={recruitmentCard}>
        <h2 className="text-xl font-semibold">Recruitment assessments</h2>
        {failed ? (
          <RecruitmentError
            message="Recruitment access could not be verified. Your session may have changed."
            onRetry={access.reset}
            pending={listQuery.isFetching}
          />
        ) : (
          <p role="status" className="mt-4 text-sm text-slate-500">
            Verifying recruitment access…
          </p>
        )}
      </section>
    );
  }
  return (
    <section
      aria-labelledby="recruitment-heading"
      className="space-y-6 text-slate-900"
    >
      <header className="flex items-start gap-4">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
          <ClipboardList className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h2
            id="recruitment-heading"
            className="text-2xl font-bold tracking-tight"
          >
            Recruitment assessments
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Build a knowledge assessment for a human-led recruitment process.
            Candidates need a current team seat and access to the assessment
            course. Assign that seat first in the existing Operators tab.
          </p>
        </div>
      </header>
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm leading-relaxed text-teal-900">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            Each assessment uses the same question form for all invited
            candidates. Prior exposure through study tools is not prevented, and
            this is not proctored. Results are not certification, proof of
            practical competence, or a hiring recommendation.
          </p>
        </div>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={recruitmentCard}>
          <h3 className="text-lg font-semibold">Create an assessment</h3>
          <p className="mt-1 text-sm text-slate-600">
            Choose a course and topics from the available question pool.
          </p>
          {!catalogAuthorized && !catalogQuery.isError ? (
            <p role="status" className="py-8 text-sm text-slate-500">
              Verifying current-term course and team-seat catalog access…
            </p>
          ) : catalogQuery.isError && accessDenied(catalogQuery.error) ? (
            <p role="status" className="mt-4 text-sm text-slate-600">
              Current-term recruitment creation and invitations are unavailable.
              Historical assessments and results remain available while reporting
              access is authorized.
            </p>
          ) : !catalog ? (
            <div className="mt-4">
              <RecruitmentError
                message={"The assessment catalog could not load."}
                onRetry={() => void catalogQuery.refetch()}
                pending={catalogQuery.isFetching}
              />
            </div>
          ) : !catalog.courses.length ? (
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No courses with usable questions are available for this
              organization. Check course access in the Operators tab or contact
              support.
            </p>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={createAssessment}>
              <fieldset disabled={create.isPending} className="space-y-4">
                <legend className="sr-only">Assessment settings</legend>
                <div className="space-y-2">
                  <Label htmlFor="recruitment-title">Assessment title</Label>
                  <Input
                    id="recruitment-title"
                    className="min-h-11"
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    placeholder="e.g. Water operations knowledge review"
                    minLength={3}
                    maxLength={160}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recruitment-course">Course</Label>
                  <select
                    id="recruitment-course"
                    className={recruitmentSelect}
                    value={courseKey}
                    required
                    onChange={event => {
                      setCourseKey(event.target.value);
                      setModules([]);
                      setAttempted(false);
                    }}
                  >
                    <option value="">Choose a course</option>
                    {catalog.courses.map(item => (
                      <option key={item.courseKey} value={item.courseKey}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-medium">Topics</legend>
                  {!course ? (
                    <p className="text-sm text-slate-500">
                      Choose a course to view topics.
                    </p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 p-2">
                      {course.modules.map(module => (
                        <label
                          key={module.name}
                          className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-3 text-sm hover:bg-slate-50 ${!module.count ? "text-slate-400" : "text-slate-700"}`}
                        >
                          <Checkbox
                            checked={modules.includes(module.name)}
                            disabled={!module.count || create.isPending}
                            onCheckedChange={checked =>
                              setModules(previous =>
                                checked === true
                                  ? [...previous, module.name]
                                  : previous.filter(
                                      name => name !== module.name
                                    )
                              )
                            }
                          />
                          <span className="min-w-0 flex-1">{module.name}</span>
                          <span className="shrink-0 text-xs">
                            {module.count} questions
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    {modules.length} topics selected · {available} questions
                    available. Each selected topic appears at least once.
                  </p>
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="recruitment-count">Question count</Label>
                    <Input
                      id="recruitment-count"
                      type="number"
                      className="min-h-11"
                      min={5}
                      max={100}
                      step={1}
                      required
                      value={count}
                      onChange={event => setCount(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recruitment-expiry">
                      Invitation expires in (days)
                    </Label>
                    <Input
                      id="recruitment-expiry"
                      type="number"
                      className="min-h-11"
                      min={1}
                      max={30}
                      step={1}
                      required
                      value={expiry}
                      onChange={event => setExpiry(event.target.value)}
                    />
                  </div>
                </div>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                  <Checkbox
                    checked={timed}
                    onCheckedChange={checked => setTimed(checked === true)}
                    disabled={create.isPending}
                  />
                  Set a time limit
                </label>
                {timed ? (
                  <div className="space-y-2">
                    <Label htmlFor="recruitment-minutes">
                      Time limit (minutes)
                    </Label>
                    <Input
                      id="recruitment-minutes"
                      className="min-h-11"
                      type="number"
                      min={5}
                      max={180}
                      step={1}
                      required
                      value={minutes}
                      onChange={event => setMinutes(event.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      Time starts when the candidate accepts the notice and
                      starts. The invitation expiry still applies.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No time limit. Candidates must still finish before the
                    invitation expires.
                  </p>
                )}
              </fieldset>
              {attempted && validation && (
                <p role="alert" className="text-sm text-amber-800">
                  {validation}
                </p>
              )}
              {error && <RecruitmentError message={error} />}
              <Button
                type="submit"
                className="min-h-11 w-full bg-blue-700 text-white hover:bg-blue-800 motion-reduce:transition-none"
                disabled={create.isPending}
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                {create.isPending
                  ? "Creating assessment…"
                  : "Create assessment"}
              </Button>
            </form>
          )}
        </div>
        <div className={recruitmentCard}>
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">Your assessments</h3>
            <Button
              variant="ghost"
              type="button"
              className="min-h-11 text-blue-700"
              disabled={listQuery.isFetching}
              onClick={() => void listQuery.refetch()}
            >
              {listQuery.isFetching ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
          {notice && (
            <p
              role="status"
              className="mt-4 rounded-xl bg-teal-50 p-4 text-sm text-teal-900"
            >
              {notice}
            </p>
          )}
          {listQuery.isLoading ? (
            <p role="status" className="py-8 text-sm text-slate-500">
              Loading assessments…
            </p>
          ) : listQuery.isError || !definitions ? (
            <div className="mt-4">
              <RecruitmentError
                message={"Assessments could not load."}
                onRetry={() => void listQuery.refetch()}
                pending={listQuery.isFetching}
              />
            </div>
          ) : !definitions.length ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-6">
              <p className="font-medium">No assessments yet</p>
              <p className="mt-2 text-sm text-slate-600">
                Create your first assessment, then invite eligible candidates
                and review their results here.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {definitions.map(assessment => (
                <li key={assessment.id}>
                  <button
                    type="button"
                    className={`w-full rounded-xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${selectedId === assessment.id ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                    onClick={() => setSelectedId(assessment.id)}
                    aria-pressed={selectedId === assessment.id}
                  >
                    <span className="block font-semibold text-slate-900">
                      {assessment.title}
                    </span>
                    <span className="mt-1 block text-sm text-slate-600">
                      {assessment.courseLabel} · {assessment.questionCount}{" "}
                      questions ·{" "}
                      {assessment.timeLimitMinutes === null
                        ? "No time limit"
                        : `${assessment.timeLimitMinutes} minutes`}
                    </span>
                    <span className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-600">
                      <span>
                        {assessment.completed} completed /{" "}
                        {assessment.candidates} invited
                      </span>
                      <span>
                        Created {recruitmentDate(assessment.createdAtMs)}
                      </span>
                    </span>
                    <span className="mt-2 block text-xs text-slate-500">
                      Expires {recruitmentDate(assessment.expiresAtMs)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {selectedId ? (
        <RecruitmentDetail
          key={`${orgId}:${selectedId}`}
          orgId={orgId}
          assessmentId={selectedId}
          catalog={catalog}
          canUseCatalog={canUseCatalog}
          access={access}
          invitationOutcome={
            invitationOutcome?.assessmentId === selectedId
              ? invitationOutcome
              : undefined
          }
          onInvitationOutcome={outcome => {
            if (isCurrent()) setInvitationOutcome(outcome);
          }}
        />
      ) : (
        <p className="text-sm text-slate-500">
          Select an assessment to invite candidates and view results.
        </p>
      )}
    </section>
  );
}

function RecruitmentDetail({
  orgId,
  assessmentId,
  catalog,
  canUseCatalog,
  access,
  invitationOutcome,
  onInvitationOutcome,
}: {
  orgId: number;
  assessmentId: string;
  catalog?: RecruitmentCatalog;
  canUseCatalog: () => boolean;
  access: RecruitmentManagerAccess;
  invitationOutcome?: InvitationOutcome;
  onInvitationOutcome: (outcome: InvitationOutcome | null) => void;
}) {
  const live = useLifetime();
  const isCurrent = () => live.current && access.isCurrent();
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const resultKey = getQueryKey(
    trpc.recruitment.results,
    { orgId, assessmentId },
    "query"
  );
  const resultFresh = useFreshRecruitmentQuery(
    resultKey,
    access
  );
  const query = trpc.recruitment.results.useQuery(
    { orgId, assessmentId },
    privateQueryOptions
  );
  const invite = trpc.recruitment.invite.useMutation();
  const revoke = trpc.recruitment.revoke.useMutation();
  const [memberId, setMemberId] = useState("");
  const [error, setError] = useState("");
  const [link, setLink] = useState(() =>
    invitationOutcome
      ? new URL(
          `/recruitment/${encodeURIComponent(invitationOutcome.assignmentId)}`,
          window.location.origin
        ).href
      : ""
  );
  const [copyMessage, setCopyMessage] = useState(
    invitationOutcome?.message ?? ""
  );
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const downloadPending = useRef(false);
  const [revokeTarget, setRevokeTarget] = useState<RecruitmentResult | null>(
    null
  );
  const revokeReview = useRef<{
    target: RecruitmentResult;
    confirmed: boolean;
  } | null>(null);
  const revokePending = useRef(false);
  const [confirmed, setConfirmed] = useState(false);
  const renderingReview = revokeReview.current;
  const busy = invite.isPending || revoke.isPending || copying || downloading;
  const authorized =
    access.isCurrent() &&
    resultFresh &&
    query.isFetchedAfterMount &&
    query.isSuccess &&
    !query.isFetching;
  const resultAuthorization = authorized
    ? queryClient.getQueryState(resultKey)
    : undefined;
  // Retained handlers cannot use a pre-refetch result, even before React updates.
  const canReviewResults = () =>
    isCurrent() &&
    !!resultAuthorization &&
    queryClient.getQueryState(resultKey) === resultAuthorization &&
    resultAuthorization.status === "success" &&
    resultAuthorization.fetchStatus === "idle" &&
    resultAuthorization.data === query.data &&
    query.data?.assessment.id === assessmentId;
  function clearRevocation() {
    revokeReview.current = null;
    setRevokeTarget(null);
    setConfirmed(false);
  }
  useLayoutEffect(() => {
    const filters = { queryKey: resultKey, exact: true };
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      const reviewed = revokeReview.current;
      if (
        !reviewed ||
        JSON.stringify(event.query.queryKey) !== JSON.stringify(resultKey)
      )
        return;
      if (event.type === "removed") {
        clearRevocation();
      } else if (event.type === "updated") {
        const data = event.query.state.data as typeof query.data;
        const target = data?.results.find(
          item => item.assignmentId === reviewed.target.assignmentId
        );
        if (
          event.query !== queryClient.getQueryCache().find(filters) ||
          event.action.type === "fetch" ||
          event.action.type === "error" ||
          event.action.type === "invalidate" ||
          (event.action.type === "success" &&
            (event.action.manual ||
              data?.assessment.id !== assessmentId ||
              target !== reviewed.target ||
              target.revision !== reviewed.target.revision ||
              target.status !== reviewed.target.status))
        )
          clearRevocation();
      }
    });
    return () => {
      unsubscribe();
      revokeReview.current = null;
    };
  }, [orgId, assessmentId, queryClient]);
  useEffect(() => {
    if (query.isError && accessDenied(query.error) && access.isCurrent())
      access.reset();
  }, [query.isError, query.error, access]);
  async function downloadResults() {
    if (!isCurrent() || !authorized || busy || downloadPending.current) return;
    // This detail survives its own results refresh (only the results child is
    // hidden). Never retain that child's delivered props for a later export.
    const submittedScope = { orgId, assessmentId };
    const capturedAccess = access;
    const capturedEpoch = access.epoch;
    const canDownload = () =>
      live.current &&
      capturedAccess.epoch === capturedEpoch &&
      capturedAccess.isCurrent();
    downloadPending.current = true;
    setDownloading(true);
    setError("");
    try {
      // Do not join a pre-click read or accept even recently cached results.
      await utils.recruitment.results.cancel(submittedScope);
      if (!canDownload()) return;
      const fresh = await utils.recruitment.results.fetch(submittedScope, {
        staleTime: 0,
        retry: false,
      });
      if (!canDownload()) return;
      if (fresh.assessment.id !== submittedScope.assessmentId)
        throw new Error("The returned assessment did not match. Try again.");
      downloadRecruitmentCsv(fresh.assessment, fresh.results);
    } catch (failure) {
      if (!canDownload()) return;
      if (accessDenied(failure)) {
        capturedAccess.reset();
        return;
      }
      setError(
        failure instanceof Error
          ? failure.message
          : "CSV could not be downloaded. Try again."
      );
    } finally {
      if (canDownload()) {
        downloadPending.current = false;
        setDownloading(false);
      }
    }
  }
  async function copyLink(assignmentId: string) {
    if (!isCurrent() || !authorized) return;
    const href = new URL(
      `/recruitment/${encodeURIComponent(assignmentId)}`,
      window.location.origin
    ).href;
    setLink(href);
    setCopyMessage("");
    setCopying(true);
    onInvitationOutcome({
      assessmentId,
      assignmentId,
      message: "Select and copy the invitation link below. No email was sent.",
    });
    try {
      await navigator.clipboard.writeText(href);
      if (isCurrent()) {
        const message =
          "Link copied. Share it directly with the invited candidate. No email was sent.";
        setCopyMessage(message);
        onInvitationOutcome({ assessmentId, assignmentId, message });
      }
    } catch {
      if (isCurrent()) {
        const message =
          "Clipboard access was unavailable. Select and copy the link below. No email was sent.";
        setCopyMessage(message);
        onInvitationOutcome({ assessmentId, assignmentId, message });
      }
    } finally {
      if (isCurrent()) setCopying(false);
    }
  }
  function refreshSubmittedScope() {
    if (!isCurrent()) return;
    void utils.recruitment.results.invalidate({ orgId, assessmentId });
    void utils.recruitment.list.invalidate({ orgId });
    void utils.recruitment.catalog.invalidate({ orgId });
  }
  async function inviteCandidate(event: React.FormEvent) {
    event.preventDefault();
    if (
      !isCurrent() ||
      !authorized ||
      !canUseCatalog() ||
      !catalog ||
      !memberId ||
      busy ||
      !query.data
    )
      return;
    const eligible = catalog?.candidates.some(
      item =>
        item.memberId === Number(memberId) &&
        item.courseKeys.includes(query.data.assessment.courseKey)
    );
    if (!eligible) {
      setError(
        "Choose a candidate with a current team seat and access to this course."
      );
      return;
    }
    setError("");
    setLink("");
    setCopyMessage("");
    onInvitationOutcome(null);
    try {
      const data = await invite.mutateAsync({
        orgId,
        assessmentId,
        memberId: Number(memberId),
      });
      if (!isCurrent()) return;
      await copyLink(data.assignmentId);
      if (!isCurrent()) return;
      setMemberId("");
      refreshSubmittedScope();
    } catch (failure) {
      if (!isCurrent()) return;
      if (accessDenied(failure)) {
        access.reset();
        return;
      }
      if (isCurrent())
        setError(
          failure instanceof Error
            ? failure.message
            : "The invitation could not be created. Try again."
        );
    }
  }
  async function revokeCandidate() {
    const reviewedTarget = revokeTarget;
    const review = renderingReview;
    const canRevoke = () =>
      canReviewResults() &&
      !!reviewedTarget &&
      (reviewedTarget.status === "invited" || reviewedTarget.status === "active") &&
      revokeReview.current === review &&
      review?.target === reviewedTarget &&
      review.confirmed &&
      query.data?.results.find(
        item => item.assignmentId === reviewedTarget.assignmentId
      ) === reviewedTarget;
    if (!canRevoke() || !confirmed || !reviewedTarget || busy || revokePending.current)
      return;
    revokePending.current = true;
    setError("");
    try {
      await revoke.mutateAsync({
        orgId,
        assignmentId: reviewedTarget.assignmentId,
        expectedRevision: reviewedTarget.revision,
      });
      // Review authority fences dispatch, not reconciliation of a sent write.
      // A same-session refetch may have delivered a pre-revocation snapshot.
      if (!isCurrent()) return;
      const stillReviewed = canRevoke();
      onInvitationOutcome(null);
      clearRevocation();
      setLink("");
      setCopyMessage(
        stillReviewed
          ? "Invitation revoked. The candidate can no longer use this link."
          : ""
      );
      refreshSubmittedScope();
    } catch (failure) {
      if (!isCurrent()) return;
      if (accessDenied(failure)) {
        clearRevocation();
        access.reset();
        return;
      }
      const stillReviewed = canRevoke();
      clearRevocation();
      if ((failure as { data?: { code?: string } } | null)?.data?.code === "CONFLICT") {
        if (stillReviewed)
          setError(
            "The candidate's assessment changed. Refresh results, review the latest status and confirm revocation again. Revocation was not retried."
          );
        // Reconcile even when a pending results read already cleared review.
        void query.refetch();
        return;
      }
      if (stillReviewed)
        setError(
          failure instanceof Error
            ? failure.message
            : "The invitation could not be revoked. Try again."
        );
    } finally {
      revokePending.current = false;
    }
  }
  if (!authorized && !query.isError)
    return (
      <div className={recruitmentCard}>
        <p role="status" className="text-sm text-slate-500">
          Loading assessment results…
        </p>
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className={recruitmentCard}>
        <RecruitmentError
          message={query.error?.message || "Results could not load."}
          onRetry={() => void query.refetch()}
          pending={query.isFetching}
        />
      </div>
    );
  const assessment: RecruitmentDefinitionSummary = query.data.assessment;
  const candidates =
    catalog?.candidates.filter(item =>
      item.courseKeys.includes(assessment.courseKey)
    ) ?? [];
  const invitationClosed = assessment.expiresAtMs <= Date.now();
  return (
    <div className={`${recruitmentCard} space-y-6`}>
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Assessment details
          </p>
          <h3 className="mt-2 text-xl font-semibold">{assessment.title}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {assessment.courseLabel} · {assessment.questionCount} questions ·{" "}
            {assessment.timeLimitMinutes === null
              ? "No time limit"
              : `${assessment.timeLimitMinutes} minutes`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Expires {recruitmentDate(assessment.expiresAtMs)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => void query.refetch()}
          disabled={query.isFetching || busy}
        >
          {query.isFetching ? "Refreshing…" : "Refresh results"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Assessment topics">
        {assessment.modules.map(module => (
          <span
            key={module}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
          >
            {module}
          </span>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="font-semibold">Invite a candidate</h4>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          A current team seat with this course is required. To add someone, use
          the Operators tab first; this action does not grant a seat. The link
          only works for the invited candidate's verified email. No automatic
          invitation email is sent.
        </p>
        {invitationClosed ? (
          <p className="mt-4 text-sm text-amber-800">
            This assessment has expired. Create a new assessment to invite
            candidates.
          </p>
        ) : !catalog || !canUseCatalog() ? (
          <p className="mt-4 text-sm text-slate-600">
            Creating invitations is unavailable until current-term catalog access
            is verified. Authorized results, CSV, and revocation remain available.
          </p>
        ) : !candidates.length ? (
          <p className="mt-4 text-sm text-slate-600">
            No eligible candidates for this course. Assign a current team seat
            and course access in Operators first.
          </p>
        ) : (
          <form
            onSubmit={inviteCandidate}
            className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="recruitment-candidate">Team-seat candidate</Label>
              <select
                id="recruitment-candidate"
                value={memberId}
                onChange={event => setMemberId(event.target.value)}
                className={recruitmentSelect}
                disabled={busy}
                required
              >
                <option value="">Choose a candidate</option>
                {candidates.map(candidate => (
                  <option key={candidate.memberId} value={candidate.memberId}>
                    {candidate.name ? `${candidate.name} — ` : ""}
                    {candidate.email}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              className="min-h-11 bg-blue-700 text-white hover:bg-blue-800"
              disabled={!memberId || busy}
            >
              {invite.isPending ? "Creating link…" : "Create invitation link"}
            </Button>
          </form>
        )}
        {copyMessage && (
          <p role="status" className="mt-4 text-sm text-slate-700">
            {copyMessage}
          </p>
        )}
        {link && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="recruitment-link">Candidate invitation link</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="recruitment-link"
                className="min-h-11 bg-white"
                value={link}
                readOnly
                onFocus={event => event.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={busy}
                onClick={() =>
                  void copyLink(new URL(link).pathname.split("/").pop()!)
                }
              >
                <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                {copying ? "Copying…" : "Copy link"}
              </Button>
            </div>
          </div>
        )}
      </div>
      {error && <RecruitmentError message={error} />}
      {revokeTarget && (
        <div
          role="group"
          aria-labelledby="recruitment-revoke-title"
          className="rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <h4
            id="recruitment-revoke-title"
            className="font-semibold text-red-900"
          >
            Revoke invitation for {revokeTarget.candidateEmail}?
          </h4>
          <p className="mt-2 text-sm text-red-900">
            This removes access to this assessment. It does not remove the
            candidate's team seat.
          </p>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-red-900">
            <Checkbox
              checked={confirmed}
              onCheckedChange={checked => {
                if (
                  !canReviewResults() ||
                  !renderingReview ||
                  revokeReview.current !== renderingReview ||
                  renderingReview.target !== revokeTarget
                ) return;
                revokeReview.current.confirmed = checked === true;
                setConfirmed(checked === true);
              }}
              disabled={busy}
            />
            I confirm I want to revoke this assessment invitation.
          </label>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={busy}
              onClick={() => {
                clearRevocation();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-11 bg-red-700 text-white hover:bg-red-800"
              disabled={!confirmed || busy}
              onClick={() => void revokeCandidate()}
            >
              {revoke.isPending ? "Revoking…" : "Confirm revoke"}
            </Button>
          </div>
        </div>
      )}
      <RecruitmentManagerPrivacyContext.Provider value={access}>
        <RecruitmentResults
          assessment={assessment}
          results={query.data.results}
          onDownload={() => void downloadResults()}
          onCopy={assignmentId => void copyLink(assignmentId)}
          onRevoke={result => {
            if (
              !canReviewResults() ||
              (result.status !== "invited" && result.status !== "active") ||
              query.data?.results.find(item => item.assignmentId === result.assignmentId) !== result
            ) return;
            revokeReview.current = { target: result, confirmed: false };
            setRevokeTarget(result);
            setConfirmed(false);
            setError("");
          }}
          busy={busy}
        />
      </RecruitmentManagerPrivacyContext.Provider>
    </div>
  );
}
