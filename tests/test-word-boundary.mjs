import test from 'tape-six';
import {RE2} from '../re2.js';
import {Buffer} from 'node:buffer';

// utilities

const indices = (text, flags = 'g') =>
  [...text.matchAll(new RE2('\\B', flags))].map(match => match.index);

// tests

test('test \\B with no position between characters', t => {
  const text = 'b中c';

  t.equal(new RE2('\\B').test(text), false);
  t.equal(new RE2('\\B').search(text), -1);
  t.equal(new RE2('\\B').exec(text), null);
  t.equal(new RE2('\\B').match(text), null);
  t.equal(new RE2('\\B', 'g').match(text), null);
  t.deepEqual(indices(text), []);
  t.equal(new RE2('\\B', 'g').replace(text, '-'), text);
  t.equal(
    new RE2('\\B', 'g').replace(text, () => '-'),
    text
  );
  t.deepEqual(new RE2('\\B').split(text), [text]);

  const global = new RE2('\\B', 'g');
  t.equal(global.test(text), false);
  t.equal(global.lastIndex, 0);
});

test('test \\B between two multi-byte characters', t => {
  const text = 'a中中b';

  t.equal(new RE2('\\B').test(text), true);
  t.equal(new RE2('\\B').search(text), 2);
  t.equal(new RE2('\\B').exec(text).index, 2);
  t.equal(new RE2('\\B').match(text).index, 2);
  t.deepEqual([...new RE2('\\B', 'g').match(text)], ['']);
  t.deepEqual(indices(text), [2]);
  t.equal(new RE2('\\B', 'g').replace(text, '-'), 'a中-中b');
  t.equal(
    new RE2('\\B', 'g').replace(text, () => '-'),
    'a中-中b'
  );
  t.deepEqual(new RE2('\\B').split(text), ['a中', '中b']);

  const global = new RE2('\\B', 'g');
  t.equal(global.test(text), true);
  t.equal(global.lastIndex, 2);
});

// V8 evaluates \B on code units here and reports 2: the specification steps by code point
test('test \\B between two characters outside the BMP', t => {
  const text = 'a😀😀b';

  t.equal(new RE2('\\B').search(text), 3);
  t.equal(new RE2('\\B').exec(text).index, 3);
  t.deepEqual(indices(text), [3]);
  t.equal(new RE2('\\B', 'g').replace(text, '-'), 'a😀-😀b');
  t.deepEqual(new RE2('\\B').split(text), ['a😀', '😀b']);
});

test('test \\B at the ends of a multi-byte subject', t => {
  t.equal(new RE2('\\B').search('é'), 0);
  t.deepEqual(indices('é'), [0, 1]);
  t.equal(new RE2('\\B', 'g').replace('é', '-'), '-é-');
});

test('test \\B in a binary subject', t => {
  const none = Buffer.from('b中c'),
    one = Buffer.from('a中中b');

  t.equal(new RE2('\\B').test(none), false);
  t.equal(new RE2('\\B').search(none), -1);
  t.equal(new RE2('\\B').exec(none), null);
  t.equal(new RE2('\\B', 'g').match(none), null);
  t.ok(new RE2('\\B', 'g').replace(none, '-').equals(none));

  t.equal(new RE2('\\B').test(one), true);
  t.equal(new RE2('\\B').search(one), 4);
  t.equal(new RE2('\\B').exec(one).index, 4);
  t.equal(new RE2('\\B', 'g').match(one).length, 1);
  t.equal(new RE2('\\B', 'g').replace(one, '-').toString(), 'a中-中b');
});

test('test \\B combined with other terms', t => {
  const match = new RE2('\\B.').exec('a中中b');
  t.equal(match.index, 2);
  t.equal(match[0], '中');

  const alternative = new RE2('\\Bz|中').exec('a中');
  t.equal(alternative.index, 1);
  t.equal(alternative[0], '中');

  t.equal(new RE2('a\\B').test('a中'), false);
});

test('test \\B with a literal backslash in the pattern', t => {
  t.equal(new RE2('\\\\B').test('a\\Bc'), true);
  t.equal(new RE2('\\\\B').search('中\\B'), 1);
});

test('test sticky \\B keeps its position', t => {
  const re = new RE2('\\B', 'y');

  re.lastIndex = 2;
  t.equal(re.test('a中中b'), true);
  t.equal(re.lastIndex, 2);

  re.lastIndex = 1;
  t.equal(re.test('a中中b'), false);
  t.equal(re.lastIndex, 0);

  re.lastIndex = 2;
  t.equal(re.exec('a中中b').index, 2);
});

test('test \\b never lands inside a character', t => {
  t.deepEqual(
    [...'a中 b'.matchAll(new RE2('\\b', 'g'))].map(match => match.index),
    [...'a中 b'.matchAll(/\b/gu)].map(match => match.index)
  );
  t.equal(new RE2('\\b').test('中中'), false);
});
