import test from 'tape-six';
import {default as RE2} from '../re2.js';

// tests

test('test toString', t => {
  t.equal(RE2('').toString(), '/(?:)/u');
  t.equal(RE2('a').toString(), '/a/u');
  t.equal(RE2('b', 'i').toString(), '/b/iu');
  t.equal(RE2('c', 'g').toString(), '/c/gu');
  t.equal(RE2('d', 'm').toString(), '/d/mu');
  t.equal(RE2('\\d+', 'gi') + '', '/\\d+/giu');
  t.equal(RE2('\\s*', 'gm') + '', '/\\s*/gmu');
  t.equal(RE2('\\S{1,3}', 'ig') + '', '/\\S{1,3}/giu');
  t.equal(RE2('\\D{,2}', 'mig') + '', '/\\D{,2}/gimu');
  t.equal(RE2('^a{2,}', 'mi') + '', '/^a{2,}/imu');
  t.equal(RE2('^a{5}$', 'gim') + '', '/^a{5}$/gimu');
  t.equal(RE2('\\u{1F603}/', 'iy') + '', '/\\u{1F603}\\//iuy');
  t.equal(RE2('^a{2,}', 'smi') + '', '/^a{2,}/imsu');

  t.equal(RE2('c', 'ug').toString(), '/c/gu');
  t.equal(RE2('d', 'um').toString(), '/d/mu');
});
