import test from 'tape-six';
import {default as RE2} from '../re2.js';

// tests

// These tests are copied from MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll

test('test matchAll', t => {
  const str = 'test1test2';
  const re = new RE2(/t(e)(st(\d?))/g);
  const result = Array.from(str.matchAll(re));

  t.equal(result.length, 2);
  t.equal(result[0].input, str);
  t.equal(result[0].index, 0);
  t.equal(result[0].length, 4);
  t.equal(result[0][0], 'test1');
  t.equal(result[0][1], 'e');
  t.equal(result[0][2], 'st1');
  t.equal(result[0][3], '1');
  t.equal(result[1].input, str);
  t.equal(result[1].index, 5);
  t.equal(result[1].length, 4);
  t.equal(result[1][0], 'test2');
  t.equal(result[1][1], 'e');
  t.equal(result[1][2], 'st2');
  t.equal(result[1][3], '2');
});

test('test matchAll iterator', t => {
  const str = 'table football, foosball';
  const re = new RE2('foo[a-z]*', 'g');

  const expected = [
    {start: 6, finish: 14},
    {start: 16, finish: 24}
  ];
  let i = 0;
  for (const match of str.matchAll(re)) {
    t.equal(match.index, expected[i].start);
    t.equal(match.index + match[0].length, expected[i].finish);
    ++i;
  }
});

test('test matchAll non global', t => {
  const re = RE2('b');

  try {
    'abc'.matchAll(re);
    t.fail(); // shouldn't be here
  } catch (e) {
    t.ok(e instanceof TypeError);
  }
});

test('test matchAll lastIndex', t => {
  const re = RE2('[a-c]', 'g');
  re.lastIndex = 1;

  const expected = ['b', 'c'];
  let i = 0;
  for (const match of 'abc'.matchAll(re)) {
    t.equal(re.lastIndex, 1);
    t.equal(match[0], expected[i]);
    ++i;
  }
});

test('test matchAll empty match', t => {
  const str = 'foo';
  // Matches empty strings, but should not cause an infinite loop
  const re = new RE2('(?:)', 'g');
  const result = Array.from(str.matchAll(re));

  t.equal(result.length, str.length + 1);
  for (let i = 0; i < result.length; ++i) {
    t.equal(result[i][0], '');
  }
});
