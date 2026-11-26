import { lookup as dnsLookup } from "node:dns/promises";
import { get as httpsGet } from "node:https";
import { isIP } from "node:net";
import { Readable } from "node:stream";

const refused = () => new Error("Unapproved posting destination");
const ipv4Number = address => address.split(".").reduce((value, octet) => value * 256 + Number(octet), 0);
const inV4Range = (value, base, bits) => Math.floor(value / 2 ** (32 - bits)) === Math.floor(ipv4Number(base) / 2 ** (32 - bits));
const nonPublicV4 = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
];
function ipv6Number(address) {
  // isIP has already validated the syntax. Expand a dotted IPv4 tail before ::.
  const expandedTail = address.replace(/(\d+\.\d+\.\d+\.\d+)$/, tail => {
    const value = ipv4Number(tail);
    return `${Math.floor(value / 65536).toString(16)}:${(value % 65536).toString(16)}`;
  });
  const [left, right] = expandedTail.split("::");
  const head = left ? left.split(":") : [];
  const tail = right ? right.split(":") : [];
  const words = right === undefined ? head : [...head, ...Array(8 - head.length - tail.length).fill("0"), ...tail];
  return words.reduce((value, word) => (value << 16n) + BigInt(`0x${word}`), 0n);
}
const inV6Range = (value, base, bits) => value >> BigInt(128 - bits) === ipv6Number(base) >> BigInt(128 - bits);

/** Conservative globally routable unicast only; all mapped/transition/local ranges fail closed. */
export function isPublicPostingAddress(address) {
  if (typeof address !== "string" || address.includes("%")) return false;
  const family = isIP(address);
  if (family === 4) return !nonPublicV4.some(([base, bits]) => inV4Range(ipv4Number(address), base, bits));
  if (family !== 6) return false;
  const value = ipv6Number(address);
  // Outside 2000::/3 includes unspecified, loopback, IPv4-mapped/compatible,
  // NAT64, ULA, link/site-local and multicast. Inside it exclude IETF special
  // assignments (including Teredo/ORCHID), documentation, 6to4 and old 6bone.
  return inV6Range(value, "2000::", 3) && ![
    ["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3ffe::", 16], ["3fff::", 20],
  ].some(([base, bits]) => inV6Range(value, base, bits));
}

export function postingDestination(raw) {
  const input = String(raw).trim();
  if (!/^https:\/\//i.test(input) || input.includes("\\")) throw refused();
  const url = new URL(input);
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  // Keep the previous no-literal-IP policy, including WHATWG-normalized numeric
  // IPv4 spellings. Only public DNS names on the ordinary HTTPS port are allowed.
  if (url.protocol !== "https:" || url.username || url.password || /^https:\/\/[^/?#]*@/i.test(input) || (url.port && url.port !== "443") ||
      !host.includes(".") || isIP(host) || host.startsWith("[") ||
      /(?:^|\.)(?:localhost|local|internal|localdomain|home|lan|onion)$/.test(host)) throw refused();
  url.hash = "";
  const drive = host === "drive.google.com" && url.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)\//);
  return drive ? `https://drive.google.com/uc?export=download&id=${drive[1]}` : url.toString();
}

async function abortableLookup(hostname, lookup, signal) {
  signal?.throwIfAborted();
  let onAbort;
  try {
    return await Promise.race([
      lookup(hostname, { all: true, verbatim: true }),
      new Promise((_, reject) => {
        if (!signal) return;
        onAbort = () => reject(signal.reason ?? new Error("Posting verification timeout"));
        signal.addEventListener("abort", onAbort, { once: true });
      }),
    ]);
  } finally { if (onAbort) signal.removeEventListener("abort", onAbort); }
}

/**
 * Resolve EVERY address then pin exactly one approved answer into https.get's
 * lookup. No fetch/redirect agent can re-resolve it between validation and use.
 * URL hostname/Host/SNI and Node's certificate hostname checks remain intact.
 * agent:false prevents reuse of a socket resolved by a different request; IPv4
 * and IPv6 answers are never raced/fallback-resolved after this check.
 * lookup/get are explicit test seams, not production fetch dispatchers.
 */
export async function fetchPostingResponse(raw, { signal, lookup = dnsLookup, get = httpsGet } = {}) {
  const destination = new URL(postingDestination(raw));
  const answers = await abortableLookup(destination.hostname, lookup, signal);
  if (!Array.isArray(answers) || !answers.length || answers.some(answer =>
    !answer || !isPublicPostingAddress(answer.address) || isIP(answer.address) !== answer.family)) throw refused();
  signal?.throwIfAborted();
  const approved = { address: answers[0].address, family: answers[0].family };
  const pinnedLookup = (hostname, options, callback) => {
    if (typeof options === "function") { callback = options; options = {}; }
    if (hostname !== destination.hostname) { callback(refused()); return; }
    if (options?.all) callback(null, [{ ...approved }]);
    else callback(null, approved.address, approved.family);
  };
  return new Promise((resolve, reject) => {
    const request = get(destination, {
      signal, agent: false, lookup: pinnedLookup, family: approved.family,
      autoSelectFamily: false, servername: destination.hostname, rejectUnauthorized: true,
      headers: { "Accept-Encoding": "identity", "User-Agent": "EchelonInstituteJobBot/1.0", Accept: "text/html, application/pdf, */*" },
    }, incoming => {
      try {
        const headers = new Headers();
        for (let index = 0; index < incoming.rawHeaders.length; index += 2) headers.append(incoming.rawHeaders[index], incoming.rawHeaders[index + 1]);
        const status = incoming.statusCode;
        if ([204, 205, 304].includes(status)) {
          incoming.resume();
          resolve(new Response(null, { status, headers }));
        } else resolve(new Response(Readable.toWeb(incoming), { status, headers }));
      } catch (error) { incoming.destroy(); reject(error); }
    });
    request.once("error", reject);
  });
}
