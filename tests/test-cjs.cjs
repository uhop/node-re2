const {test} = require('tape-six');
const RE2 = require('../re2.js');

test('CJS require', t => {
  t.ok(RE2, 'RE2 is loaded');
  t.equal(typeof RE2, 'function', 'RE2 is a constructor');
});

test('CJS construct and test', t => {
  const re = new RE2('a(b*)', 'u');
  t.ok(re instanceof RE2, 'instanceof RE2');
  t.ok(re.test('aBb'), 'test matches');
  t.notOk(re.test('xyz'), 'test rejects non-match');
});

test('CJS exec', t => {
  const re = new RE2('(\\d+)', 'u');
  const result = re.exec('abc 123 def');
  t.ok(result, 'exec returns a result');
  t.equal(result[0], '123');
  t.equal(result[1], '123');
  t.equal(result.index, 4);
});

test('CJS exec with Buffer', t => {
  const re = new RE2('(\\d+)', 'u');
  const result = re.exec(Buffer.from('abc 123 def'));
  t.ok(result, 'exec returns a result');
  t.ok(Buffer.isBuffer(result[0]), 'result is a Buffer');
  t.equal(result[0].toString(), '123');
});

test('CJS match', t => {
  const re = new RE2('\\w+', 'gu');
  const result = 'hello world'.match(re);
  t.ok(result, 'match returns a result');
  t.deepEqual(result, ['hello', 'world']);
});

test('CJS search', t => {
  const re = new RE2('world', 'u');
  const idx = 'hello world'.search(re);
  t.equal(idx, 6);
});

test('CJS replace', t => {
  const re = new RE2('world', 'u');
  const result = 'hello world'.replace(re, 'RE2');
  t.equal(result, 'hello RE2');
});

test('CJS split', t => {
  const re = new RE2('\\s+', 'u');
  const result = 'a b  c'.split(re);
  t.deepEqual(result, ['a', 'b', 'c']);
});

test('CJS named groups', t => {
  const re = new RE2('(?P<year>\\d{4})-(?P<month>\\d{2})', 'u');
  const result = re.exec('2025-03');
  t.ok(result, 'exec returns a result');
  t.equal(result.groups.year, '2025');
  t.equal(result.groups.month, '03');
});

test('CJS RE2.Set', t => {
  const set = new RE2.Set(['abc', 'def', 'ghi'], 'u');
  t.ok(set, 'set is created');
  t.ok(set.test('abc'), 'test matches first pattern');
  t.deepEqual(set.match('abcghi'), [0, 2]);
});

test('CJS named import pattern', t => {
  const {RE2: NamedRE2} = require('../re2.js');
  t.equal(NamedRE2, RE2, 'RE2.RE2 === RE2');
  const re = new NamedRE2('abc', 'u');
  t.ok(re instanceof RE2, 'instance created via named import');
  t.ok(re.test('abc'), 'works correctly');
});

test('CJS static helpers', t => {
  t.equal(RE2.getUtf8Length('hello'), 5);
  t.equal(RE2.getUtf16Length(Buffer.from('hello')), 5);
});
