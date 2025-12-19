import test from 'tape-six';
import {default as RE2} from '../re2.js';

// tests

test('test_unicodeClasses', t => {
  'use strict';

  let re2 = new RE2(/\p{L}/u);
  t.ok(re2.test('a'));
  t.notOk(re2.test('1'));

  re2 = new RE2(/\p{Letter}/u);
  t.ok(re2.test('a'));
  t.notOk(re2.test('1'));

  re2 = new RE2(/\p{Lu}/u);
  t.ok(re2.test('A'));
  t.notOk(re2.test('a'));

  re2 = new RE2(/\p{Uppercase_Letter}/u);
  t.ok(re2.test('A'));
  t.notOk(re2.test('a'));

  re2 = new RE2(/\p{Script=Latin}/u);
  t.ok(re2.test('a'));
  t.notOk(re2.test('ф'));

  re2 = new RE2(/\p{sc=Cyrillic}/u);
  t.notOk(re2.test('a'));
  t.ok(re2.test('ф'));
});
