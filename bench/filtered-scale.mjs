// Shape 5 of the FilteredRE2 evaluation suite: scale N to find where
// RE2.Set's union-DFA approach breaks down, if it does. Patterns are
// pseudo-random unique literals — no shared prefix structure for the
// DFA to factor cleanly — to stress the union construction.
//
// Compile times printed to stderr; runtime measured in the loop.

import {RE2} from '../re2.js';

const mulberry32 = seed => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// 8-char pseudo-random literal token. 26^8 ≈ 2.1×10^11 unique strings —
// no collisions at our scales. Distinct first letter per token so the
// union-DFA can't trivially factor by prefix.
const alpha = 'abcdefghijklmnopqrstuvwxyz';
const token = i => {
  const r = mulberry32(i ^ 0xc0ffee);
  let s = '';
  for (let k = 0; k < 8; ++k) s += alpha[(r() * 26) | 0];
  return s;
};

// RE2.Set has a hard compile ceiling at N≈13,500 for random-prefix
// patterns (DFA memory limit, default 8 MB). Levels chosen below that.
const N_LEVELS = [1000, 5000, 10000, 13000];
const MAX_N = N_LEVELS[N_LEVELS.length - 1];

const allTokens = [];
for (let i = 0; i < MAX_N; ++i) allTokens.push(token(i));

// 200 short log-like inputs; ~30% contain a token drawn from the *full*
// pool, so a higher-N set matches more inputs (the high-N entrant pays
// for its bigger surface).
const INPUT_COUNT = 200;
const rngInputs = mulberry32(7);
const inputs = [];
for (let j = 0; j < INPUT_COUNT; ++j) {
  if (rngInputs() < 0.3) {
    const idx = (rngInputs() * MAX_N) | 0;
    inputs.push(
      `2026-05-12T22:31:04Z client=10.0.0.${j & 255} request token=${allTokens[idx]} action=allow 200 42ms`
    );
  } else {
    inputs.push(
      `2026-05-12T22:31:04Z client=10.0.0.${j & 255} request token=zzzzzzzz action=allow 200 42ms`
    );
  }
}

// Build one RE2.Set per N level, timed.
const sets = {};
const compileTimes = {};
for (const n of N_LEVELS) {
  const t0 = process.hrtime.bigint();
  sets[n] = new RE2.Set(allTokens.slice(0, n));
  const dt = Number(process.hrtime.bigint() - t0) / 1e6;
  compileTimes[n] = dt;
}

// Reference: V8 RegExp loop at the smallest N (anything larger would be
// painful — we already know from Shape 4 it's ~46× slower than RE2.Set
// at N=2000).
const tJs = process.hrtime.bigint();
const jsList = allTokens.slice(0, N_LEVELS[0]).map(p => new RegExp(p));
const dtJs = Number(process.hrtime.bigint() - tJs) / 1e6;

console.error(
  `# Shape 5 setup: ${INPUT_COUNT} inputs\n` +
    N_LEVELS.map(
      n => `# compile RE2.Set@${n}: ${compileTimes[n].toFixed(1)}ms`
    ).join('\n') +
    `\n# compile RegExp@${N_LEVELS[0]} (loop, reference): ${dtJs.toFixed(1)}ms`
);

const runSet = re2Set => n => {
  const out = [];
  for (let i = 0; i < n; ++i) {
    let total = 0;
    for (const input of inputs) {
      total += re2Set.match(input).length;
    }
    out.pop();
    out.push(total);
  }
  return out;
};

const cases = {};
for (const n of N_LEVELS) cases[`RE2.Set@${n}`] = runSet(sets[n]);

cases[`RegExp@${N_LEVELS[0]}`] = n => {
  const out = [];
  for (let i = 0; i < n; ++i) {
    let total = 0;
    for (const input of inputs) {
      for (let k = 0; k < jsList.length; ++k) {
        if (jsList[k].test(input)) ++total;
      }
    }
    out.pop();
    out.push(total);
  }
  return out;
};

export default cases;
