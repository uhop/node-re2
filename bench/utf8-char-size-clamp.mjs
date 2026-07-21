// Cost of the bounds-aware getUtf8CharSize() clamp (issue #272). Each case
// drives one clamped call site as hard as the public API allows:
//
//   - zero-width global replace/split hit the clamp once per code point;
//   - the replacement-template scan hits it once per replacement character,
//     per match;
//   - RE2 construction hits it once per pattern character.
//
// 'test() control' touches no clamped site: it calibrates run-to-run variance
// between two separately-built binaries, which is the only way to tell a real
// delta from process noise.

import {RE2} from '../re2.js';

const ascii = Buffer.from(
  'The quick brown fox jumps over the lazy dog. '.repeat(40)
);
const mixed = Buffer.from(
  'Ünïcödé — ждём 😀 mixed-width text for the scan. '.repeat(40)
);
const template = '[$&$&$&$&$&]';
const longPattern = '(?:alpha|beta|gamma|delta)+\\d{2,4}[a-z]*\\s?'.repeat(20);

const empty = new RE2('', 'g');
const word = new RE2('o', 'g');
const control = new RE2('fox', 'i');

export default {
  'replace(empty, ascii)': n => {
    let out;
    for (let i = 0; i < n; ++i) out = empty.replace(ascii, '');
    return out;
  },
  'replace(empty, mixed)': n => {
    let out;
    for (let i = 0; i < n; ++i) out = empty.replace(mixed, '');
    return out;
  },
  'split(empty, mixed)': n => {
    let out;
    for (let i = 0; i < n; ++i) out = empty.split(mixed);
    return out;
  },
  'replace(template, mixed)': n => {
    let out;
    for (let i = 0; i < n; ++i) out = word.replace(mixed, template);
    return out;
  },
  'new RE2(long pattern)': n => {
    let out;
    for (let i = 0; i < n; ++i) out = new RE2(longPattern);
    return out;
  },
  'test() control': n => {
    let out;
    for (let i = 0; i < n; ++i) out = control.test(ascii);
    return out;
  }
};
