// Shape 4 of the FilteredRE2 evaluation suite: large pattern count over
// moderate-size inputs. The regime where RE2.Set's union-DFA is expected
// to strain (state-count blowup is exponential worst case) while an
// AC-based prefilter scales linearly with atom-count.
//
// All entrants use AllMatches semantics — they must report every pattern
// that hit each input. Iteration body processes the full batch of inputs
// once, matching the convention from set-match.mjs.

import {RE2} from '../re2.js';

const mulberry32 = seed => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// 2000 domain-blocklist-style patterns with varied literal anchors.
const adjectives = [
  'fast', 'quick', 'evil', 'sneaky', 'shady', 'mega', 'super',
  'ultra', 'cyber', 'crypto', 'dark', 'neon', 'rapid', 'silent',
  'zero', 'phantom', 'rogue', 'hidden', 'stealth', 'shadow'
];
const tlds = ['com', 'net', 'org', 'io', 'co', 'dev', 'xyz', 'site'];

const PATTERN_COUNT = 2000;
const patterns = [];
for (let i = 0; i < PATTERN_COUNT; ++i) {
  const adj = adjectives[i % adjectives.length];
  const tld = tlds[(i / adjectives.length) | 0 % tlds.length];
  patterns.push(`${adj}-site${i}\\.${tld}`);
}

// 200 short log lines; ~30% contain a literal that one of the patterns
// will match. The remaining ~70% are pure non-matches — the cost the
// prefilter is meant to absorb.
const INPUT_COUNT = 200;
const rng = mulberry32(7);
const inputs = [];
for (let j = 0; j < INPUT_COUNT; ++j) {
  if (rng() < 0.3) {
    const i = Math.floor(rng() * PATTERN_COUNT);
    const adj = adjectives[i % adjectives.length];
    const tld = tlds[(i / adjectives.length) | 0 % tlds.length];
    inputs.push(
      `2026-05-12T22:31:04Z client=10.0.0.${j & 255} GET https://${adj}-site${i}.${tld}/path?q=${j} 200 42ms`
    );
  } else {
    inputs.push(
      `2026-05-12T22:31:04Z client=10.0.0.${j & 255} GET https://normal-${j}.example.com/path?q=${j} 200 42ms`
    );
  }
}

// Compile each engine's pattern set once, outside the timed loop.
// Setup cost itself is interesting — print it for visibility.
const tCompileJs = process.hrtime.bigint();
const jsList = patterns.map(p => new RegExp(p));
const dCompileJs = Number(process.hrtime.bigint() - tCompileJs) / 1e6;

const tCompileRe2 = process.hrtime.bigint();
const re2List = patterns.map(p => new RE2(p));
const dCompileRe2 = Number(process.hrtime.bigint() - tCompileRe2) / 1e6;

const tCompileSet = process.hrtime.bigint();
const re2Set = new RE2.Set(patterns);
const dCompileSet = Number(process.hrtime.bigint() - tCompileSet) / 1e6;

console.error(
  `# Shape 4 setup: ${PATTERN_COUNT} patterns, ${INPUT_COUNT} inputs\n` +
  `# compile RegExp: ${dCompileJs.toFixed(1)}ms · RE2: ${dCompileRe2.toFixed(1)}ms · RE2.Set: ${dCompileSet.toFixed(1)}ms`
);

export default {
  RegExp: n => {
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
  },
  RE2: n => {
    const out = [];
    for (let i = 0; i < n; ++i) {
      let total = 0;
      for (const input of inputs) {
        for (let k = 0; k < re2List.length; ++k) {
          if (re2List[k].test(input)) ++total;
        }
      }
      out.pop();
      out.push(total);
    }
    return out;
  },
  'RE2.Set': n => {
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
  }
};
