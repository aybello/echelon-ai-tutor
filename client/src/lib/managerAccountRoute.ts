/**
 * Active managers belong in the team workspace, not the individual purchase
 * empty state. Only preserve a same-application team route from `next`.
 */
export function managerAccountDestination(search: string): string {
  const requested = new URLSearchParams(search).get("next") ?? "";
  if (
    /^\/team(?:\/|$)/.test(requested) &&
    !requested.startsWith("//") &&
    !requested.includes(":")
  ) {
    return requested;
  }
  return "/team";
}
