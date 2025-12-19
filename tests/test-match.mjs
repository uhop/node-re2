import test from 'tape-six';
import {default as RE2} from '../re2.js';

// tests

// These tests are copied from MDN:
// https://developer-US/docs/Web/JavaScript/Reference/Global_Objects/String/match

test('test match', t => {
  const str = 'For more information, see Chapter 3.4.5.1';

  const re = new RE2(/(chapter \d+(\.\d)*)/i);
  const result = re.match(str);

  t.equal(result.input, str);
  t.equal(result.index, 26);
  t.equal(result.length, 3);
  t.equal(result[0], 'Chapter 3.4.5.1');
  t.equal(result[1], 'Chapter 3.4.5.1');
  t.equal(result[2], '.1');
});

test('test_matchGlobal', t => {
  const re = new RE2(/[A-E]/gi);
  const result = re.match(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  );

  t.deepEqual(result, ['A', 'B', 'C', 'D', 'E', 'a', 'b', 'c', 'd', 'e']);
});

test('test match fail', t => {
  const re = new RE2('(a+)?(b+)?');
  let result = re.match('aaabb');

  t.equal(result[1], 'aaa');
  t.equal(result[2], 'bb');

  result = re.match('aaacbb');

  t.equal(result[1], 'aaa');
  t.equal(result[2], undefined);
});

test('test match invalid', t => {
  const re = RE2('');

  try {
    re.match({
      toString() {
        throw 'corner';
      }
    });
    t.fail(); // shouldn't be here
  } catch (e) {
    t.equal(e, 'corner');
  }
});

// Unicode tests

test('test match unicode', t => {
  const str = 'Это ГЛАВА 3.4.5.1';

  const re = new RE2(/(глава \d+(\.\d)*)/i);
  const result = re.match(str);

  t.equal(result.input, str);
  t.equal(result.index, 4);
  t.equal(result.length, 3);
  t.equal(result[0], 'ГЛАВА 3.4.5.1');
  t.equal(result[1], 'ГЛАВА 3.4.5.1');
  t.equal(result[2], '.1');
});

// Buffer tests

test('test match buffer', t => {
  const buf = Buffer.from('Это ГЛАВА 3.4.5.1');

  const re = new RE2(/(глава \d+(\.\d)*)/i);
  const result = re.match(buf);

  t.ok(result.input instanceof Buffer);
  t.equal(result.length, 3);
  t.ok(result[0] instanceof Buffer);
  t.ok(result[1] instanceof Buffer);
  t.ok(result[2] instanceof Buffer);

  t.equal(result.input, buf);
  t.equal(result.index, 7);
  t.equal(result.input.toString('utf8', result.index), 'ГЛАВА 3.4.5.1');
  t.equal(result[0].toString(), 'ГЛАВА 3.4.5.1');
  t.equal(result[1].toString(), 'ГЛАВА 3.4.5.1');
  t.equal(result[2].toString(), '.1');
});

// Sticky tests

test('test match sticky', t => {
  const re = new RE2('\\s+', 'y');

  t.equal(re.match('Hello world, how are you?'), null);

  re.lastIndex = 5;

  const result = re.match('Hello world, how are you?');

  t.deepEqual(Array.from(result), [' ']);
  t.equal(result.index, 5);
  t.equal(re.lastIndex, 6);

  const re2 = new RE2('\\s+', 'gy');

  t.equal(re2.match('Hello world, how are you?'), null);

  re2.lastIndex = 5;

  t.equal(re2.match('Hello world, how are you?'), null);

  const re3 = new RE2(/[A-E]/giy);
  const result3 = re3.match(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  );

  t.deepEqual(result3, ['A', 'B', 'C', 'D', 'E']);
});

// hasIndices tests

test('test match has indices', t => {
  const re = new RE2('(aa)(?<b>b)?(?<c>ccc)', 'd'),
    str1 = '1aabccc2',
    str2 = '1aaccc2';

  t.deepEqual(str1.match(re), re.exec(str1));
  t.deepEqual(str2.match(re), re.exec(str2));
});

test('test match has indices global', t => {
  const re = new RE2('(?<zzz>a)', 'dg'),
    result = 'abca'.match(re);

  t.deepEqual(result, ['a', 'a']);
  t.notOk('indices' in result);
  t.notOk('groups' in result);
});

test('test match lastIndex', t => {
  const re = new RE2(/./g),
    pattern = 'Я123';

  re.lastIndex = 2;
  const result1 = pattern.match(re);
  t.deepEqual(result1, ['Я', '1', '2', '3']);
  t.equal(re.lastIndex, 0);

  const re2 = RE2(re);
  re2.lastIndex = 2;
  const result2 = re2.match(Buffer.from(pattern));
  t.deepEqual(
    result2.map(b => b.toString()),
    ['Я', '1', '2', '3']
  );
  t.equal(re2.lastIndex, 0);
});
