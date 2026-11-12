'use strict';
// Test-only defense in depth. This is not an OS security sandbox; see docs/test-safety.md.
const Module = require('node:module');
const net = require('node:net');

const OPT_IN = 'I_UNDERSTAND_THIS_IS_A_DISPOSABLE_LOCAL_DATABASE';
const schema = /^(?:echelon_ci|echelon_upgrade_ci|echelon_standalone_ci|exam_dates_test_[0-9a-f]{32})$/;
const denied = () => { throw new Error('[test safety] blocked unsafe test environment or connection (details redacted)'); };
function validDatabase(config) {
  return process.env.ECHELON_TEST_DATABASE === OPT_IN &&
    config && !config.stream && !config.socketPath &&
    config.host === '127.0.0.1' && Number(config.port) === 3306 &&
    typeof config.database === 'string' && schema.test(config.database);
}
function assertUrl(value) {
  let u;
  try { u = new URL(value); } catch { return denied(); }
  // No query parameters: mysql2 can interpret them as connection options.
  if (u.protocol !== 'mysql:' || u.hostname !== '127.0.0.1' ||
      (u.port && u.port !== '3306') || u.search || u.hash ||
      !schema.test(u.pathname.slice(1)) || process.env.ECHELON_TEST_DATABASE !== OPT_IN) denied();
}
function preflight() {
  const guardOption = `--require=${JSON.stringify(__filename)}`;
  if (process.env.NODE_OPTIONS && process.env.NODE_OPTIONS !== guardOption) denied();
  for (const name of ['DATABASE_URL', 'EXTERNAL_DATABASE_URL']) {
    if (process.env[name]) assertUrl(process.env[name]);
  }
  // Cutover rewrites the selected schema; refuse it outright during tests.
  if (process.env.DATABASE_CUTOVER_USE_EXTERNAL_TARGET || process.env.DATABASE_CUTOVER_TARGET_DATABASE || process.env.EXTERNAL_DATABASE_CA) denied();
  // No inherited service credentials or live probe endpoints. Explicit fixture values
  // required by CI are exact matches, not a general test-key exemption.
  const fixtures = {
    JWT_SECRET: ['test-only-not-for-production'],
    STRIPE_SECRET_KEY: ['sk_test_ci_placeholder'],
    STRIPE_WEBHOOK_SECRET: ['whsec_ci_placeholder'],
    SMTP_PASS: ['test-only-placeholder'],
  };
  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue;
    if (key === 'DATABASE_URL' || key === 'EXTERNAL_DATABASE_URL') continue;
    if (/(?:^|_)(?:API_KEY|SECRET|SECRET_KEY|PASSWORD|TOKEN|PRIVATE_KEY|ACCESS_KEY|CREDENTIALS)$/.test(key) || key === 'SMTP_PASS') {
      if (!(fixtures[key] || []).includes(value)) denied();
    }
  }
  for (const name of ['ECHELON_CUTOVER_STATUS_URL', 'PRACTICE_TEST_MYSQL_SOCKET']) if (process.env[name]) denied();
  // Prevent dotenv from loading a developer's .env in child scripts.
  process.env.DOTENV_CONFIG_PATH = '/dev/null';
}
function install() {
  if (globalThis.__echelonTestSafetyInstalled) return;
  preflight();
  globalThis.__echelonTestSafetyInstalled = true;
  // Parent runner and Node children, including tsx, inherit the same guard.
  process.env.NODE_OPTIONS = `--require=${JSON.stringify(__filename)}`;
  const child = require('node:child_process');
  for (const name of ['spawn', 'spawnSync', 'execFile', 'execFileSync', 'exec', 'execSync', 'fork']) {
    const original = child[name];
    child[name] = function(...args) {
      // The optional options object follows the command and optional arguments.
      let index = 1;
      if (Array.isArray(args[index])) index++;
      const supplied = args[index] && typeof args[index] === 'object' ? args[index] : {};
      const options = { ...supplied, env: { ...(supplied.env || process.env),
        NODE_OPTIONS: process.env.NODE_OPTIONS, DOTENV_CONFIG_PATH: '/dev/null' } };
      if (supplied === args[index]) args[index] = options;
      else args.splice(index, 0, options);
      return original.apply(this, args);
    };
  }
  require('node:module').syncBuiltinESMExports();
  const originalLoad = Module._load;
  let openingValidatedDatabase = false;
  const guardedClasses = new WeakMap();
  Module._load = function(request, parent, isMain) {
    const resolved = Module._resolveFilename(request, parent, isMain);
    const result = originalLoad.apply(this, arguments);
    if (typeof resolved === 'string' && /[\\/]mysql2[\\/]lib[\\/]base[\\/]connection\.js$/.test(resolved)) {
      if (!guardedClasses.has(result)) {
        class GuardedConnection extends result {
          constructor(options) {
            if (!validDatabase(options && options.config)) denied();
            openingValidatedDatabase = true;
            try { super(options); } finally { openingValidatedDatabase = false; }
          }
          changeUser() { return denied(); }
        }
        guardedClasses.set(result, GuardedConnection);
      }
      return guardedClasses.get(result);
    }
    return result;
  };
  // Block external socket connections, including fetch/http/TLS and most clients.
  // Allow loopback for local HTTP test servers; MySQL has the stronger check above.
  const originalConnect = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function(...args) {
    let options = args[0];
    if (Array.isArray(options)) options = options[0];
    if (typeof options === 'number') options = { port: options, host: args[1] };
    // Do not trust DNS/hosts-file resolution for the loopback alias.
    if (options && typeof options === 'object' && options.host === 'localhost') {
      if (options.lookup) denied();
      options.host = '127.0.0.1';
      if (typeof args[0] === 'number') args[1] = '127.0.0.1';
    }
    if (!options || typeof options !== 'object' || options.path ||
        !['127.0.0.1', '::1'].includes(options.host) ||
        (Number(options.port) === 3306 && !openingValidatedDatabase)) denied();
    return originalConnect.apply(this, args);
  };
}
module.exports = { install, preflight, assertUrl, validDatabase, OPT_IN };
// NODE_OPTIONS preload in workers and child tooling.
if (require.main !== module) install();
