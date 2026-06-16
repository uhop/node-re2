// Quantify the ASCII offset fast path (commit 54e5a87). When an input string
// is pure ASCII, a byte offset equals its UTF-16 offset, so the per-match
// `getUtf16Length` byte-scan (O(offset)) is replaced by `to - from` (O(1)).
//
// Controlled isolation: each pair of cases runs the *same* operation on two
// strings that differ only by a single leading multibyte character. That one
// non-ASCII codepoint flips `StrVal.isAscii` to false for the whole string, so
// every offset conversion falls back to the linear scan — i.e. the pre-54e5a87
// behavior. The ASCII-vs-non-ASCII gap is the fast path's gain; the regex match
// work itself is identical across the pair.
//
// The amplifier is a match deep in a long string: the slow path scans the
// whole prefix to convert the match index, the fast path returns it directly.

import {RE2} from '../re2.js';

// --- Deep single match in a long string -------------------------------------
const L = 200_000;
const asciiLong = 'a'.repeat(L) + 'NEEDLE'; // match index == L, pure ASCII
const nonAsciiLong = '€' + asciiLong; // one leading 3-byte '€' flips isAscii

const reExec = new RE2('NEEDLE'); // non-global: converts index 0 -> match start

// --- Many matches drained with a /g loop ------------------------------------
const GAP = 99,
  K = 2000;
const asciiMany = ('a'.repeat(GAP) + 'M').repeat(K); // K matches across ~200k chars
const nonAsciiMany = '€' + asciiMany;

const reGlobal = new RE2('M', 'g');

const drain = str => {
  reGlobal.lastIndex = 0;
  let count = 0;
  while (reGlobal.exec(str) !== null) ++count;
  return count;
};

// --- Short string control (fast path should be a wash here) -----------------
const asciiShort = 'aaaaaNEEDLE';
const nonAsciiShort = '€' + asciiShort;

export default {
  'exec deep — ASCII': n => {
    const out = [];
    for (let i = 0; i < n; ++i) {
      out.pop();
      out.push(reExec.exec(asciiLong));
    }
    return out;
  },
  'exec deep — 1 non-ASCII': n => {
    const out = [];
    for (let i = 0; i < n; ++i) {
      out.pop();
      out.push(reExec.exec(nonAsciiLong));
    }
    return out;
  },
  'drain /g — ASCII': n => {
    let count = 0;
    for (let i = 0; i < n; ++i) count += drain(asciiMany);
    return count;
  },
  'drain /g — 1 non-ASCII': n => {
    let count = 0;
    for (let i = 0; i < n; ++i) count += drain(nonAsciiMany);
    return count;
  },
  'exec short — ASCII': n => {
    const out = [];
    for (let i = 0; i < n; ++i) {
      out.pop();
      out.push(reExec.exec(asciiShort));
    }
    return out;
  },
  'exec short — 1 non-ASCII': n => {
    const out = [];
    for (let i = 0; i < n; ++i) {
      out.pop();
      out.push(reExec.exec(nonAsciiShort));
    }
    return out;
  }
};
