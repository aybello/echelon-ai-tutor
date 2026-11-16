import { useQuery } from "@tanstack/react-query";
import { interactiveCatalogResponseSchema } from "@shared/interactiveSessions";
import { trpc } from "@/lib/trpc";
import { getCourseInteractiveHref } from "@/lib/courseNavigation";
import { catalogHasEnoughGames } from "@/lib/courseGames";

function readToken(): string | undefined {
  try {
    const token = localStorage.getItem("echelon_access_token");
    return token && token.trim() && token.length <= 8192 ? token : undefined;
  } catch { return undefined; }
}

/** The link to a course's games, or undefined until we know the course has enough to play. Never shows a broken link. */
export function useCourseGamesHref(courseKey: string | undefined, enabled = true): string | undefined {
  const { client } = trpc.useUtils();
  const href = getCourseInteractiveHref(courseKey, "");
  const query = useQuery({
    queryKey: ["games-available", courseKey],
    enabled: enabled && Boolean(courseKey && href),
    retry: false,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => catalogHasEnoughGames(interactiveCatalogResponseSchema.parse(
      await client.interactive.getCatalog.mutate({ courseKey: courseKey!, accessToken: readToken() }),
    )),
  });
  return query.data === true ? href : undefined;
}
