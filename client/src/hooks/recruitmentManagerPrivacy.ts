import {
  createContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

export type RecruitmentManagerAccess = {
  epoch: number;
  ready?: boolean;
  isCurrent: () => boolean;
  reset: () => void;
};

// Results are private even when supplied as props. Only a freshly authorized
// detail inside the panel provides this capability; direct use fails closed.
export const RecruitmentManagerPrivacyContext =
  createContext<RecruitmentManagerAccess | null>(null);

export function useFreshRecruitmentQuery(
  queryKey: readonly unknown[],
  access: RecruitmentManagerAccess
) {
  const client = useQueryClient();
  const serializedKey = JSON.stringify(queryKey);
  const [fresh, setFresh] = useState(false);
  // Install before the tRPC query hook's layout subscription begins fetching.
  useLayoutEffect(() => {
    let fetching = false;
    setFresh(false);
    return client.getQueryCache().subscribe(event => {
      if (
        event.type !== "updated" ||
        JSON.stringify(event.query.queryKey) !== serializedKey
      )
        return;
      if (event.action.type === "fetch") {
        fetching = access.isCurrent();
        setFresh(false);
      } else if (event.action.type === "success") {
        setFresh(fetching && !event.action.manual && access.isCurrent());
        fetching = false;
      } else if (event.action.type === "error") {
        fetching = false;
        setFresh(false);
      }
    });
  }, [client, serializedKey, access]);
  return fresh && access.isCurrent();
}

export function clearRecruitmentManagerQueries(
  client: QueryClient,
  orgId: number
) {
  const predicate = (query: { queryKey: readonly unknown[] }) => {
    const [path, options] = query.queryKey;
    const name = Array.isArray(path) ? path.join(".") : "";
    return (
      [
        "recruitment.catalog",
        "recruitment.list",
        "recruitment.results",
        "hiring.status",
      ].includes(name) &&
      (options as { input?: { orgId?: number } } | undefined)?.input?.orgId ===
        orgId
    );
  };
  // Cancellation detaches old requests before removing their private snapshots.
  void client.cancelQueries({ predicate });
  client.removeQueries({ predicate });
}

export function useRecruitmentManagerPrivacy(
  orgId: number
): RecruitmentManagerAccess {
  const client = useQueryClient();
  const current = useRef(0);
  const live = useRef(true);
  const [epoch, setEpoch] = useState(0);
  const [ready, setReady] = useState(false);
  const access = useMemo(
    () => ({
      epoch,
      ready,
      isCurrent: () => live.current && current.current === epoch,
      reset: () => {
        if (!live.current) return;
        // Fence reads, writes and retained DOM handlers before React re-renders.
        current.current += 1;
        clearRecruitmentManagerQueries(client, orgId);
        setEpoch(current.current);
      },
    }),
    [client, orgId, epoch, ready]
  );

  useLayoutEffect(() => {
    live.current = true;
    setEpoch(current.current);
    clearRecruitmentManagerQueries(client, orgId);
    setReady(true);
    const reset = () => access.reset();
    const unsubscribe = client.getQueryCache().subscribe(event => {
      const path = event.query.queryKey[0];
      const name = Array.isArray(path) ? path.join(".") : "";
      if (
        (name === "auth.me" || name === "dashboardAuth.me") &&
        (event.type === "removed" ||
          (event.type === "updated" &&
            ["success", "error", "invalidate"].includes(event.action.type)))
      )
        reset();
    });
    window.addEventListener("focus", reset);
    window.addEventListener("storage", reset);
    window.addEventListener("online", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      live.current = false;
      current.current += 1;
      unsubscribe();
      window.removeEventListener("focus", reset);
      window.removeEventListener("storage", reset);
      window.removeEventListener("online", reset);
      document.removeEventListener("visibilitychange", reset);
      clearRecruitmentManagerQueries(client, orgId);
    };
    // Listeners intentionally retain the first reset callback: it advances the
    // shared ref, rather than comparing against its captured epoch.
  }, [client, orgId]);
  return access;
}
