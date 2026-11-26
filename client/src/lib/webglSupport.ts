let cachedWebGL2Support: boolean | undefined;

/** Three.js requires WebGL 2. Probe once, release that disposable context, and reuse the result across route mounts. */
export function supportsWebGL2(): boolean {
  if (typeof document === "undefined") return false;
  if (cachedWebGL2Support !== undefined) return cachedWebGL2Support;
  try {
    const context = document.createElement("canvas").getContext("webgl2");
    cachedWebGL2Support = Boolean(context);
    if (!context) return cachedWebGL2Support;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return cachedWebGL2Support;
  } catch {
    cachedWebGL2Support = false;
    return cachedWebGL2Support;
  }
}
