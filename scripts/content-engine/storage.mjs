import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { PRIVATE_ROOT } from './constants.mjs';
const inside = (root, value) => value === root || (!path.relative(root, value).startsWith(`..${path.sep}`) && path.relative(root, value) !== '..' && !path.isAbsolute(path.relative(root, value)));
function noSymlinks(value) {
  let cursor = path.parse(value).root;
  for (const piece of value.slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, piece);
    try { if (fs.lstatSync(cursor).isSymbolicLink()) throw Error('private-path-symlink-denied'); }
    catch (error) { if (error.code === 'ENOENT') break; throw error; }
  }
}
function projectedRealPath(value) {
  let cursor = value; const missing = [];
  while (!fs.existsSync(cursor)) { missing.unshift(path.basename(cursor)); const parent = path.dirname(cursor); if (parent === cursor) throw Error('private-path-invalid'); cursor = parent; }
  return path.join(fs.realpathSync(cursor), ...missing);
}
/** root injection is for disposable fixtures only; the CLI always uses PRIVATE_ROOT. */
export function createPrivateStore({ root = PRIVATE_ROOT, repoRoot } = {}) {
  if (!repoRoot || !path.isAbsolute(root)) throw Error('absolute-private-root-and-repository-required');
  const repo = fs.realpathSync(repoRoot); const allowed = path.resolve(root);
  function assertRoot() {
    noSymlinks(allowed);
    if (inside(repo, allowed) || inside(repo, projectedRealPath(allowed))) throw Error('repository-output-denied');
    for (const denied of ['client', 'shared', 'public', path.join('dist', 'public')]) {
      const candidate = path.join(repoRoot, denied);
      const real = projectedRealPath(candidate);
      if (inside(real, projectedRealPath(allowed))) throw Error('public-or-shared-output-denied');
    }
  }
  function destination(name) {
    assertRoot();
    if (typeof name !== 'string' || !name || path.isAbsolute(name) || name.split(/[\\/]/).some(p => p === '..' || p === '.' || !p)) throw Error('private-relative-destination-required');
    const dest = path.resolve(allowed, name);
    if (!inside(allowed, dest) || dest === allowed) throw Error('private-path-escape');
    noSymlinks(dest);
    const realRoot = projectedRealPath(allowed); const realDest = projectedRealPath(dest);
    if (!inside(realRoot, realDest)) throw Error('private-realpath-escape');
    return dest;
  }
  function write(name, content, { replace = false } = {}) {
    const dest = destination(name);
    fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o700 });
    destination(name);
    const temp = path.join(path.dirname(dest), `.${path.basename(dest)}.${randomUUID()}.tmp`);
    let fd;
    try {
      fd = fs.openSync(temp, 'wx', 0o600); fs.writeFileSync(fd, content); fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined;
      destination(name);
      if (replace) {
        if (fs.existsSync(dest) && !fs.lstatSync(dest).isFile()) throw Error('private-regular-file-required');
        fs.renameSync(temp, dest);
      } else { fs.linkSync(temp, dest); fs.unlinkSync(temp); }
      const dirFd = fs.openSync(path.dirname(dest), 'r'); try { fs.fsyncSync(dirFd); } finally { fs.closeSync(dirFd); }
      return dest;
    } finally { if (fd !== undefined) fs.closeSync(fd); if (fs.existsSync(temp)) fs.unlinkSync(temp); }
  }
  function read(name) {
    const dest = destination(name); if (!fs.lstatSync(dest).isFile()) throw Error('private-regular-file-required');
    return fs.readFileSync(dest, 'utf8');
  }
  function ledger(name) {
    const dest = destination(name); if (!fs.existsSync(dest)) return [];
    const value = read(name); if (value && !value.endsWith('\n')) throw Error('ledger-truncated-refuse-resume');
    return value.split('\n').filter(Boolean).map(line => JSON.parse(line));
  }
  function appendLedger(name, event) {
    const events = ledger(name); events.push(event);
    // Atomic rewrite is intentional: the bounded pilot ledger remains small; no partial JSONL appends.
    write(name, events.map(e => JSON.stringify(e)).join('\n') + '\n', { replace: true });
    return events;
  }
  assertRoot();
  return Object.freeze({ destination, write, read, ledger, appendLedger });
}
