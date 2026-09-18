import { randomUUID } from "node:crypto";

export const APPROVED_CUTOVER_STATUS_URL = "https://echeloninstitute.ca/api/cutover/status";

export function approvedCutoverStatusUrl(statusUrl) {
  if (!statusUrl) {
    throw new Error("ECHELON_CUTOVER_STATUS_URL is required for a final clone.");
  }
  if (statusUrl !== APPROVED_CUTOVER_STATUS_URL) {
    throw new Error("ECHELON_CUTOVER_STATUS_URL must be the approved production cutover status endpoint.");
  }
  let url;
  try {
    url = new URL(statusUrl);
  } catch {
    throw new Error("ECHELON_CUTOVER_STATUS_URL must be a valid HTTPS URL.");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.hash || url.search) {
    throw new Error("ECHELON_CUTOVER_STATUS_URL must be the approved production cutover status endpoint.");
  }
  return url;
}

/**
 * Confirm twice that the only approved production application reports that its
 * server-side write fence is active. Each request carries a fresh challenge,
 * which the endpoint must echo, so a cached or redirected response cannot be
 * accepted as a current confirmation.
 */
export async function assertLiveCutoverWriteFence(
  statusUrl,
  {
    fetchImpl = fetch,
    createChallenge = randomUUID,
    sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
  } = {}
) {
  const endpoint = approvedCutoverStatusUrl(statusUrl);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const challenge = createChallenge();
    const url = new URL(endpoint);
    url.searchParams.set("challenge", challenge);
    const response = await fetchImpl(url, {
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok || response.url !== url.href) {
      throw new Error("The live production cutover status endpoint did not return an accepted response.");
    }
    if (!response.headers?.get("cache-control")?.toLowerCase().includes("no-store")) {
      throw new Error("The live production cutover status endpoint did not disable response caching.");
    }
    let status;
    try {
      status = await response.json();
    } catch {
      throw new Error("The live production cutover status endpoint returned invalid JSON.");
    }
    if (
      status?.writesFrozen !== true ||
      status?.mode !== "freeze" ||
      status?.challenge !== challenge
    ) {
      throw new Error("The live production application has not confirmed its database write freeze.");
    }
    if (attempt === 0) await sleep(1_000);
  }
}
