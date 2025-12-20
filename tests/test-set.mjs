import test from 'tape-six';
import {default as RE2} from '../re2.js';

test('test set basics', t => {
  const set = new RE2.Set(['foo', 'bar'], 'im');

  t.ok(set instanceof Object);
  t.equal(typeof set.match, 'function');
  t.equal(set.size, 2);
  t.equal(set.flags, 'imu');
  t.equal(set.anchor, 'unanchored');
  t.ok(Array.isArray(set.sources));
  t.equal(set.sources[0], 'foo');
  t.equal(set.source, 'foo|bar');
  t.equal(set.toString(), '/foo|bar/imu');
});

test('test set matching', t => {
  const set = new RE2.Set(['foo', 'bar'], 'i');

  const result = set.match('xxFOOxxbar');
  t.equal(result.length, 2);
  result.sort((a, b) => a - b);
  t.deepEqual(result, [0, 1]);
  t.equal(set.test('nothing here'), false);
  t.equal(set.match('nothing here').length, 0);
});

test('test set anchors', t => {
  const start = new RE2.Set(['abc'], {anchor: 'start'});
  const both = new RE2.Set(['abc'], {anchor: 'both'});

  t.equal(start.test('zabc'), false);
  t.equal(start.test('abc'), true);
  t.ok(both.test('abc'));
  t.notOk(both.test('abc1'));
});

test('test set iterable', t => {
  function* gen() {
    yield 'cat';
    yield 'dog';
  }

  const set = new RE2.Set(gen());
  t.equal(set.size, 2);
  const result = set.match('hotdog');
  t.equal(result.length, 1);
  t.equal(result[0], 1);
});

test('test set flags override', t => {
  const set = new RE2.Set([/abc/], 'i');
  t.ok(set.test('ABC'));
  t.equal(set.flags, 'iu');
});

test('test set unicode inputs', t => {
  const patterns = ['🙂', '猫', '🍣+', '東京', '\\p{Hiragana}+'];
  const set = new RE2.Set(patterns, 'u');
  const input = 'prefix🙂と猫と🍣🍣を食べる東京ひらがな';

  const result = set.match(input);
  t.equal(result.length, 5);
  t.notEqual(result.indexOf(0), -1);
  t.notEqual(result.indexOf(1), -1);
  t.notEqual(result.indexOf(2), -1);
  t.notEqual(result.indexOf(3), -1);
  t.notEqual(result.indexOf(4), -1);

  const buf = Buffer.from(input);
  const bufResult = set.match(buf);
  t.equal(bufResult.length, 5);
  t.ok(set.test(buf));

  const miss = new RE2.Set(['🚀', '漢字'], 'u');
  t.notOk(miss.test(input));
  t.equal(miss.match(input).length, 0);
});

test('test set empty and duplicates', t => {
  const emptySet = new RE2.Set([]);
  t.equal(emptySet.size, 0);
  t.equal(emptySet.test('anything'), false);

  const dup = new RE2.Set(['foo', 'foo', 'bar']);
  const r = dup.match('foo bar');
  // two foo entries plus bar
  t.equal(r.length, 3);
  r.sort((a, b) => a - b);
  t.deepEqual(r, [0, 1, 2]);
});

test('test set inconsistent flags', t => {
  try {
    const set = new RE2.Set([/abc/i, /abc/m]);
    t.fail();
  } catch (e) {
    t.ok(e instanceof TypeError);
  }
});

test('test set invalid flags char', t => {
  try {
    const set = new RE2.Set(['foo'], 'q');
    t.fail();
  } catch (e) {
    t.ok(e instanceof TypeError);
  }
});

test('test set anchor option with flags', t => {
  const set = new RE2.Set(['^foo', '^bar'], 'i', {anchor: 'both'});
  t.equal(set.anchor, 'both');
  t.equal(set.match('foo').length, 1);
  t.equal(set.match('xfoo').length, 0);
});

test('test set invalid', t => {
  try {
    const set = new RE2.Set([null]);
    t.fail();
  } catch (e) {
    t.ok(e instanceof TypeError);
  }
});
