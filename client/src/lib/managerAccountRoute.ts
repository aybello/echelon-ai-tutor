/**
 * Active managers belong in the team workspace, not the individual purchase
 * empty state, unless they explicitly choose their separate personal billing.
 * Only preserve a same-application team route from `next`.
 */
export function managerAccountDestination(search: string): string | null {
  const params = new URLSearchParams(search);
  const billing = params.getAll("billing");
  if (billing.length === 1 && billing[0] === "personal" && !params.has("orgId")) {
    return null;
  }
  const requested = params.get("next") ?? "";
  if (
    /^\/team(?:\/|$)/.test(requested) &&
    !requested.startsWith("//") &&
    !requested.includes(":")
  ) {
    return requested;
  }
  return "/team";
}
