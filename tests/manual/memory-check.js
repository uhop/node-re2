'use strict';

const RE2 = require('../../re2.js');

const L = 20 * 1024 * 1024,
  N = 100;

if (typeof globalThis.gc != 'function')
  console.log(
    "Warning: to run it with explicit gc() calls, you should use --expose-gc as a node's argument."
  );

const gc = typeof globalThis.gc == 'function' ? globalThis.gc : () => {};

const s = 'a'.repeat(L),
  objects = [];

for (let i = 0; i < N; ++i) {
  const re2 = new RE2('x', 'g');
  objects.push(re2);
  const result = s.replace(re2, '');
  if (result.length !== s.length) console.log('Wrong result.');
  gc();
}

console.log(
  'Done. Now it is spinning: check the memory consumption! To stop it, press Ctrl+C.'
);

for (;;);
