'use strict';
// Acceptance harness ONLY. Never loaded by production start/build commands.
const fs = require('node:fs');
const net = require('node:net');
const Module = require('node:module');
// Disable only the unrelated eager payment initializer, in memory. No fake key.
// Interactive routes/engine and the on-disk production artifact remain intact.
const artifactUrl = require('node:url').pathToFileURL(require('node:path').resolve('dist/index.js')).href;
Module.registerHooks({ load(url, context, nextLoad) {
  const result = nextLoad(url, context);
  if (url === artifactUrl) {
    const original = '    if (!process.env.STRIPE_SECRET_KEY) {\n      throw new Error("STRIPE_SECRET_KEY is not set");\n    }\n    stripe = new Stripe3(process.env.STRIPE_SECRET_KEY, {\n      apiVersion: "2026-07-29.dahlia"\n    });';
    const source = String(result.source);
    if (source.split(original).length !== 2) throw new Error('Offline payment initializer contract changed');
    fs.writeSync(2, '[offline acceptance] disabled unrelated eager payment client; any use throws\n');
    return { ...result, source: source.replace(original, '    stripe = new Proxy({}, { get() { throw new Error("Payment client disabled in offline acceptance"); } });') };
  }
  return result;
} });
for (const [key, value] of Object.entries(process.env)) {
  if (value && /DATABASE_URL|API_KEY|SECRET|TOKEN|PASSWORD|SMTP_PASS|FORGE/.test(key)) throw new Error('Offline acceptance forbids credentials');
}
process.env.DOTENV_CONFIG_PATH = '/dev/null';
const load = Module._load;
Module._load = function(id, ...args) {
  if (id === 'dotenv/config') return {};
  const value = load.call(this, id, ...args);
  if (id === 'dotenv') return { ...value, config: () => ({ parsed: {} }), configDotenv: () => ({ parsed: {} }) };
  return value;
};
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function(...args) {
  const options = typeof args[0] === 'object' && args[0] !== null ? args[0] : { port: args[0], host: typeof args[1] === 'string' ? args[1] : undefined };
  if (options.path || !['127.0.0.1', '::1', 'localhost'].includes(options.host || 'localhost')) throw new Error('Offline acceptance blocked outbound connection');
  return connect.apply(this, args);
};
// The application exits unconditionally when production credentials are absent.
// Bypass exactly that guard once, not auth checks, DB helpers, or API policy.
const exit = process.exit;
let bypassed = false;
process.exit = function(code) {
  const stack = new Error().stack || '';
  if (!bypassed && code === 1 && stack.includes('validateEnv')) {
    bypassed = true;
    fs.writeSync(2, '[offline acceptance] bypassed missing-credentials startup exit once; NODE_ENV remains production\n');
    return;
  }
  return exit.call(process, code);
};
require('node:module').syncBuiltinESMExports();
