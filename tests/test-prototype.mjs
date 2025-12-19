import test from 'tape-six';
import {default as RE2} from '../re2.js';

// tests

test('test prototype', t => {
  t.equal(RE2.prototype.source, '(?:)');
  t.equal(RE2.prototype.flags, '');
  t.equal(RE2.prototype.global, undefined);
  t.equal(RE2.prototype.ignoreCase, undefined);
  t.equal(RE2.prototype.multiline, undefined);
  t.equal(RE2.prototype.dotAll, undefined);
  t.equal(RE2.prototype.sticky, undefined);
  t.equal(RE2.prototype.lastIndex, undefined);
});
