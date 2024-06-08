'use strict';

const RE2 = require('../../re2');

const N = 1_000_000;

const s = 'a'.repeat(N),
  re = new RE2('a', 'g'),
  matches = s.matchAll(re);

let n = 0;
for (const _ of matches) ++n;

if (n !== s.length) console.log('Wrong result.');

console.log('Done.');
