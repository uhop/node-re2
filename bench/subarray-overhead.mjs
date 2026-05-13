// Isolate the Buffer.subarray() overhead that issue #216 cites as
// "super expensive". Compares:
//   - test against the full buffer (baseline)
//   - test against a fresh subarray per call (the case the issue wants
//     to optimize)
//   - test against a pre-allocated subarray (the workaround available
//     today)
//   - subarray-only with no test (isolates the JS-side cost)
//
// Short buffer (64 bytes) — the regime where subarray's fixed cost is
// most visible relative to the per-match work.

import {RE2} from '../re2.js';

const re = new RE2('error', 'i');

const N = 64;
const buf = Buffer.alloc(N);
for (let i = 0; i < N; ++i) buf[i] = 65 + (i % 26);
// Plant a match a third of the way in.
buf.write('error', (N / 3) | 0);

const subPrecomputed = buf.subarray(1, N - 1);

export default {
  'subarray() alone': n => {
    const out = [];
    for (let i = 0; i < n; ++i) {
      out.pop();
      out.push(buf.subarray(1, N - 1));
    }
    return out;
  },
  'test(full)': n => {
    const out = [];
    for (let i = 0; i < n; ++i) {
      out.pop();
      out.push(re.test(buf));
    }
    return out;
  },
  'test(precomputed subarray)': n => {
    const out = [];
    for (let i = 0; i < n; ++i) {
      out.pop();
      out.push(re.test(subPrecomputed));
    }
    return out;
  },
  'test(fresh subarray per call)': n => {
    const out = [];
    for (let i = 0; i < n; ++i) {
      out.pop();
      out.push(re.test(buf.subarray(1, N - 1)));
    }
    return out;
  }
};
