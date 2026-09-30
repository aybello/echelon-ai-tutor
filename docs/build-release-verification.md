# Verify the code serving production

`pnpm build` stamps the server bundle with the checkout's full commit SHA. `/api/health` exposes that value in its existing `release` field, for public and internal callers. Capability names remain separate from release identity.

Use the existing Manus deployment workflow. After deployment, compare `/api/health`'s `release` to the commit actually built. When building a merged release, use the merge commit, not the earlier PR branch head.

A checkout with uncommitted changes reports `<sha>-dirty`. When building a source archive without `.git`, supply `BUILD_COMMIT_SHA` at build time, or use the build runner's `GITHUB_SHA`. Only a full hexadecimal commit SHA is accepted. Without provenance, the application still builds and starts, but health reports `unknown` instead of claiming an old release.

The value is baked into the bundle. Changing environment variables after deployment cannot relabel old code. No additional approval step or infrastructure change is introduced.
