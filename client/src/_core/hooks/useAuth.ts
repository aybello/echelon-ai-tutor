import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLogout } from "./useLogout";
import { useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
  /**
   * When true, the auth.me query is disabled on mount and will NOT fire until
   * the component explicitly calls `refresh()`. Use this on public pages (e.g.
   * the landing page) so the DB is not woken up just by loading the page.
   * The page will render immediately with `isAuthenticated: false` and update
   * once the user navigates to a feature page that enables the query.
   */
  lazy?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl(), lazy = false } =
    options ?? {};
  const { logout, isPending, error: logoutError } = useLogout();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    // When lazy=true, disable the query entirely on mount so no DB call is made.
    // The query will still fire if the cache already has data from a previous
    // navigation (e.g. user visited a quiz page first), so returning users
    // still see the correct "Dashboard" button on the landing page.
    enabled: !lazy,
  });

  const state = useMemo(() => {
    try {
      if (meQuery.data) localStorage.setItem("manus-runtime-user-info", JSON.stringify(meQuery.data));
      else localStorage.removeItem("manus-runtime-user-info");
    } catch { /* storage unavailable */ }
    return {
      user: meQuery.data ?? null,
      // When lazy=true and query is disabled, isLoading stays false so the
      // page renders immediately without a loading spinner.
      loading: meQuery.isLoading || isPending,
      error: meQuery.error ?? logoutError ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutError,
    isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
