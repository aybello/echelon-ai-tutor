import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import {
  deepCatalogResponseSchema, deepSessionResponseSchema,
  type DeepGameMode, type DeepCatalogResponse, type DeepSessionResponse,
} from "@shared/deepGames";

export type DeepGameAuthority = { accessToken: string | undefined; revision: number };
export type DeepGameLifecycle = {
  courseKey: string;
  /** Null while the existing classic family is selected. Catalog discovery remains available. */
  mode: DeepGameMode | null;
  authority: DeepGameAuthority;
  /** Already verified/stabilized by the page; a token is never an actor ID. */
  actorScope: string;
  ready: boolean;
};
export class DeepGameVersionMismatch extends Error {}

export function isDeepGameVersionMismatch(error: unknown): boolean {
  if (error instanceof DeepGameVersionMismatch) return true;
  // The strict server rejects an explicitly stale requested version with CONFLICT.
  return error !== null && typeof error === "object" && "data" in error &&
    error.data !== null && typeof error.data === "object" && "code" in error.data && error.data.code === "CONFLICT";
}

export function validateDeepCatalog(raw: unknown, courseKey: string): DeepCatalogResponse {
  const catalog = deepCatalogResponseSchema.parse(raw);
  if (catalog.courseKey !== courseKey) throw new Error("Deep practice catalog course mismatch");
  return catalog;
}
export function validateDeepSession(raw: unknown, catalog: DeepCatalogResponse, mode: DeepGameMode, requestedSize: number): DeepSessionResponse {
  // Recognize a valid version before parsing a possibly newer release's shape.
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw) && Object.hasOwn(raw, "version")) {
    const version = deepSessionResponseSchema.shape.version.safeParse((raw as { version: unknown }).version);
    if (version.success && version.data !== catalog.version) throw new DeepGameVersionMismatch("Deep practice release changed");
  }
  const session = deepSessionResponseSchema.parse(raw);
  const published = catalog.modes.find(entry => entry.mode === mode);
  if (!catalog.available || !published || session.courseKey !== catalog.courseKey || session.version !== catalog.version || session.mode !== mode ||
      (mode !== "exam-escape-room" && (session.tasks.length > requestedSize || session.tasks.length > published.count))) {
    throw new Error("Deep practice session does not match its published catalog");
  }
  // The strict shared schema also validates mission references/order/revisions,
  // unique occurrence IDs, source IDs, task modes, and course/level isolation.
  return session;
}

/** No auth listeners, local identity inference, second tracker, persisted run, or classic wire changes. */
export function useDeepGameSession({ courseKey, mode, authority, actorScope, ready }: DeepGameLifecycle) {
  const queryClient = useQueryClient();
  const { client } = trpc.useUtils();
  const prefix = useMemo(() => ["course-deep-games", courseKey] as const, [courseKey]);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [roundRevision, setRoundRevision] = useState(0);
  const mismatchRetried = useRef(false);
  const lifecycleKey = JSON.stringify([courseKey, authority.revision, authority.accessToken, actorScope, mode]);
  const lifecycle = useRef(lifecycleKey);
  if (lifecycle.current !== lifecycleKey) {
    lifecycle.current = lifecycleKey;
    mismatchRetried.current = false;
  }
  const scope = [...prefix, authority.revision, authority.accessToken, actorScope] as const;
  const catalogQuery = useQuery({
    queryKey: [...scope, "catalog", catalogRevision],
    queryFn: async ({ signal }) => validateDeepCatalog(await client.deepGames.getCatalog.mutate({ courseKey, accessToken: authority.accessToken }, { signal }), courseKey),
    enabled: ready,
    staleTime: 0, gcTime: 0, retry: false, refetchOnMount: "always", refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
  const catalog = ready && !catalogQuery.isPending && !catalogQuery.isError && catalogQuery.fetchStatus === "idle" ? catalogQuery.data : undefined;
  const catalogMode = mode ? catalog?.modes.find(entry => entry.mode === mode) : undefined;
  const sessionSize = 5;
  const sessionKey = [...scope, "session", catalogRevision, catalog?.version ?? null, mode, roundRevision] as const;
  const sessionQuery = useQuery({
    queryKey: sessionKey,
    queryFn: async ({ signal }) => {
      if (!mode || !catalog?.version) throw new Error("No published deep practice selected");
      return validateDeepSession(await client.deepGames.startSession.mutate({ courseKey, mode, sessionSize, version: catalog.version, accessToken: authority.accessToken }, { signal }), catalog, mode, sessionSize);
    },
    enabled: Boolean(ready && mode && catalog?.available && catalogMode && catalogMode.count > 0),
    staleTime: 0, gcTime: 0, retry: false, refetchOnMount: "always", refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
  const clearSessions = useCallback(() => {
    const matches = (query: { queryKey: readonly unknown[] }) => query.queryKey.includes("session");
    void queryClient.cancelQueries({ queryKey: prefix, predicate: matches });
    queryClient.removeQueries({ queryKey: prefix, predicate: query => matches(query) && query.getObserversCount() === 0 });
  }, [prefix, queryClient]);
  const refresh = useCallback(() => {
    mismatchRetried.current = false;
    clearSessions();
    setCatalogRevision(value => value + 1);
    setRoundRevision(value => value + 1);
  }, [clearSessions]);
  const newRound = useCallback(() => {
    clearSessions();
    setRoundRevision(value => value + 1);
  }, [clearSessions]);
  useEffect(() => {
    if (ready && mode && isDeepGameVersionMismatch(sessionQuery.error) && !mismatchRetried.current) {
      mismatchRetried.current = true;
      clearSessions();
      setCatalogRevision(value => value + 1);
      setRoundRevision(value => value + 1);
    }
  }, [ready, mode, sessionQuery.error, clearSessions]);
  // Authority, actor and family are supplied by the existing page lifecycle. Old
  // late transports have different keys and cannot become the current delivery.
  useEffect(() => {
    queryClient.removeQueries({ queryKey: prefix, predicate: query => query.getObserversCount() === 0 });
    return () => {
      void queryClient.cancelQueries({ queryKey: scope });
      queryClient.removeQueries({ queryKey: scope, predicate: query => query.getObserversCount() === 0 });
    };
  }, [courseKey, authority.revision, authority.accessToken, actorScope, prefix, queryClient]);
  const sessionIdentity = JSON.stringify(sessionKey);
  useEffect(() => () => {
    void queryClient.cancelQueries({ queryKey: sessionKey, exact: true });
    queryClient.removeQueries({ queryKey: sessionKey, exact: true, predicate: query => query.getObserversCount() === 0 });
  }, [sessionIdentity, queryClient]);
  const session = ready && mode && catalog?.available && catalogMode && !sessionQuery.isPending && !sessionQuery.isError && sessionQuery.fetchStatus === "idle" ? sessionQuery.data : undefined;
  return { catalog, catalogQuery, session, sessionQuery, refresh, newRound, clearSessions, roundRevision };
}
