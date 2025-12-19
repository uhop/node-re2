import test from 'tape-six';
import {default as RE2} from '../re2.js';

// tests

// These tests are copied from MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec

test('exec basic', t => {
  const re = new RE2('quick\\s(brown).+?(jumps)', 'ig');

  t.equal(re.source, 'quick\\s(brown).+?(jumps)');
  t.ok(re.ignoreCase);
  t.ok(re.global);
  t.ok(!re.multiline);

  const result = re.exec('The Quick Brown Fox Jumps Over The Lazy Dog');

  t.deepEqual(Array.from(result), ['Quick Brown Fox Jumps', 'Brown', 'Jumps']);
  t.equal(result.index, 4);
  t.equal(result.input, 'The Quick Brown Fox Jumps Over The Lazy Dog');
  t.equal(re.lastIndex, 25);
});

test('exec succ', t => {
  const str = 'abbcdefabh';

  const re = new RE2('ab*', 'g');
  let result = re.exec(str);

  t.ok(result);
  t.equal(result[0], 'abb');
  t.equal(result.index, 0);
  t.equal(re.lastIndex, 3);

  result = re.exec(str);

  t.ok(result);
  t.equal(result[0], 'ab');
  t.equal(result.index, 7);
  t.equal(re.lastIndex, 9);

  result = re.exec(str);

  t.notOk(result);
});

test('exec simple', t => {
  const re = new RE2('(hello \\S+)');
  const result = re.exec('This is a hello world!');

  t.equal(result[1], 'hello world!');
});

test('exec fail', t => {
  const re = new RE2('(a+)?(b+)?');
  let result = re.exec('aaabb');

  t.equal(result[1], 'aaa');
  t.equal(result[2], 'bb');

  result = re.exec('aaacbb');

  t.equal(result[1], 'aaa');
  t.equal(result[2], undefined);
  t.equal(result.length, 3);
});

test('exec anchored to beginning', t => {
  const re = RE2('^hello', 'g');

  const result = re.exec('hellohello');

  t.deepEqual(Array.from(result), ['hello']);
  t.equal(result.index, 0);
  t.equal(re.lastIndex, 5);

  t.equal(re.exec('hellohello'), null);
});

test('exec invalid', t => {
  const re = RE2('');

  try {
    re.exec({
      toString() {
        throw 'corner';
      }
    });
    t.fail(); // shouldn't be here
  } catch (e) {
    t.equal(e, 'corner');
  }
});

test('exec anchor 1', t => {
  const re = new RE2('b|^a', 'g');

  var result = re.exec('aabc');
  t.ok(result);
  t.equal(result.index, 0);
  t.equal(re.lastIndex, 1);

  result = re.exec('aabc');
  t.ok(result);
  t.equal(result.index, 2);
  t.equal(re.lastIndex, 3);

  result = re.exec('aabc');
  t.notOk(result);
});

test('exec anchor 2', t => {
  const re = new RE2('(?:^a)', 'g');

  let result = re.exec('aabc');
  t.ok(result);
  t.equal(result.index, 0);
  t.equal(re.lastIndex, 1);

  result = re.exec('aabc');
  t.notOk(result);
});

// Unicode tests

test('exec unicode', t => {
  const re = new RE2('охотник\\s(желает).+?(где)', 'ig');

  t.equal(re.source, 'охотник\\s(желает).+?(где)');
  t.ok(re.ignoreCase);
  t.ok(re.global);
  t.ok(!re.multiline);

  const result = re.exec('Каждый Охотник Желает Знать Где Сидит Фазан');

  t.deepEqual(Array.from(result), [
    'Охотник Желает Знать Где',
    'Желает',
    'Где'
  ]);
  t.equal(result.index, 7);
  t.equal(result.input, 'Каждый Охотник Желает Знать Где Сидит Фазан');
  t.equal(re.lastIndex, 31);

  t.equal(
    result.input.substr(result.index),
    'Охотник Желает Знать Где Сидит Фазан'
  );
  t.equal(result.input.substr(re.lastIndex), ' Сидит Фазан');
});

test('exec unicode subsequent', t => {
  const str = 'аббвгдеабё';

  const re = new RE2('аб*', 'g');
  let result = re.exec(str);

  t.ok(result);
  t.equal(result[0], 'абб');
  t.equal(result.index, 0);
  t.equal(re.lastIndex, 3);

  result = re.exec(str);

  t.ok(result);
  t.equal(result[0], 'аб');
  t.equal(result.index, 7);
  t.equal(re.lastIndex, 9);

  result = re.exec(str);

  t.notOk(result);
});

test('exec unicode supplementary', t => {
  const re = new RE2('\\u{1F603}', 'g');

  t.equal(re.source, '\\u{1F603}');
  t.notOk(re.ignoreCase);
  t.ok(re.global);
  t.notOk(re.multiline);

  const result = re.exec('\u{1F603}'); // 1F603 is the SMILING FACE WITH OPEN MOUTH emoji

  t.deepEqual(Array.from(result), ['\u{1F603}']);
  t.equal(result.index, 0);
  t.equal(result.input, '\u{1F603}');
  t.equal(re.lastIndex, 2);

  const re2 = new RE2('.', 'g');

  t.equal(re2.source, '.');
  t.notOk(re2.ignoreCase);
  t.ok(re2.global);
  t.notOk(re2.multiline);

  const result2 = re2.exec('\u{1F603}');

  t.deepEqual(Array.from(result2), ['\u{1F603}']);
  t.equal(result2.index, 0);
  t.equal(result2.input, '\u{1F603}');
  t.equal(re2.lastIndex, 2);

  const re3 = new RE2('[\u{1F603}-\u{1F605}]', 'g');

  t.equal(re3.source, '[\u{1F603}-\u{1F605}]');
  t.notOk(re3.ignoreCase);
  t.ok(re3.global);
  t.notOk(re3.multiline);

  const result3 = re3.exec('\u{1F604}');

  t.deepEqual(Array.from(result3), ['\u{1F604}']);
  t.equal(result3.index, 0);
  t.equal(result3.input, '\u{1F604}');
  t.equal(re3.lastIndex, 2);
});

// Buffer tests

test('exec buffer', t => {
  const re = new RE2('охотник\\s(желает).+?(где)', 'ig');
  const buf = Buffer.from('Каждый Охотник Желает Знать Где Сидит Фазан');

  const result = re.exec(buf);

  t.equal(result.length, 3);
  t.ok(result[0] instanceof Buffer);
  t.ok(result[1] instanceof Buffer);
  t.ok(result[2] instanceof Buffer);

  t.equal(result[0].toString(), 'Охотник Желает Знать Где');
  t.equal(result[1].toString(), 'Желает');
  t.equal(result[2].toString(), 'Где');

  t.equal(result.index, 13);
  t.ok(result.input instanceof Buffer);
  t.equal(
    result.input.toString(),
    'Каждый Охотник Желает Знать Где Сидит Фазан'
  );

  t.equal(re.lastIndex, 58);

  t.equal(
    result.input.toString('utf8', result.index),
    'Охотник Желает Знать Где Сидит Фазан'
  );
  t.equal(result.input.toString('utf8', re.lastIndex), ' Сидит Фазан');
});

// Sticky tests

test('exec sticky', t => {
  const re = new RE2('\\s+', 'y');

  t.equal(re.exec('Hello world, how are you?'), null);

  re.lastIndex = 5;

  const result = re.exec('Hello world, how are you?');

  t.deepEqual(Array.from(result), [' ']);
  t.equal(result.index, 5);
  t.equal(re.lastIndex, 6);

  const re2 = new RE2('\\s+', 'gy');

  t.equal(re2.exec('Hello world, how are you?'), null);

  re2.lastIndex = 5;

  const result2 = re2.exec('Hello world, how are you?');

  t.deepEqual(Array.from(result2), [' ']);
  t.equal(result2.index, 5);
  t.equal(re2.lastIndex, 6);
});

test('exec supplemental', t => {
  const re = new RE2('\\w+', 'g');
  const testString = '🤡🤡🤡 Hello clown world!';

  let result = re.exec(testString);
  t.deepEqual(Array.from(result), ['Hello']);

  result = re.exec(testString);
  t.deepEqual(Array.from(result), ['clown']);

  result = re.exec(testString);
  t.deepEqual(Array.from(result), ['world']);
});

// Multiline test

test('exec multiline', t => {
  const re = new RE2('^xy', 'm'),
    pattern = ` xy1
xy2 (at start of line)
xy3`;

  const result = re.exec(pattern);

  t.ok(result);
  t.equal(result[0], 'xy');
  t.ok(result.index > 3);
  t.ok(result.index < pattern.length - 4);
  t.equal(
    result[0],
    pattern.substring(result.index, result.index + result[0].length)
  );
});

// dotAll tests

test('exec dotAll', t => {
  t.ok(new RE2('a.c').test('abc'));
  t.ok(new RE2(/a.c/).test('a c'));
  t.notOk(new RE2(/a.c/).test('a\nc'));

  t.ok(new RE2('a.c', 's').test('abc'));
  t.ok(new RE2(/a.c/s).test('a c'));
  t.ok(new RE2(/a.c/s).test('a\nc'));
});

// hasIndices tests

test('exec hasIndices', t => {
  t.notOk(new RE2('1').hasIndices);
  t.notOk(new RE2(/1/).hasIndices);

  const re = new RE2('(aa)(?<b>b)?(?<c>ccc)', 'd');

  t.ok(re.hasIndices);

  let result = re.exec('1aabccc2');

  t.equal(result.length, 4);
  t.equal(result.input, '1aabccc2');
  t.equal(result.index, 1);
  t.equal(Object.keys(result.groups).length, 2);
  t.equal(result.groups.b, 'b');
  t.equal(result.groups.c, 'ccc');
  t.equal(result[0], 'aabccc');
  t.equal(result[1], 'aa');
  t.equal(result[2], 'b');
  t.equal(result[3], 'ccc');
  t.equal(result.indices.length, 4);
  t.deepEqual(Array.from(result.indices), [
    [1, 7],
    [1, 3],
    [3, 4],
    [4, 7]
  ]);
  t.equal(Object.keys(result.indices.groups).length, 2);
  t.deepEqual(result.indices.groups.b, [3, 4]);
  t.deepEqual(result.indices.groups.c, [4, 7]);

  result = re.exec('1aaccc2');

  t.equal(result.length, 4);
  t.equal(result.input, '1aaccc2');
  t.equal(result.index, 1);
  t.equal(Object.keys(result.groups).length, 2);
  t.equal(result.groups.b, undefined);
  t.equal(result.groups.c, 'ccc');
  t.equal(result[0], 'aaccc');
  t.equal(result[1], 'aa');
  t.equal(result[2], undefined);
  t.equal(result[3], 'ccc');
  t.equal(result.indices.length, 4);
  t.deepEqual(Array.from(result.indices), [[1, 6], [1, 3], undefined, [3, 6]]);
  t.equal(Object.keys(result.indices.groups).length, 2);
  t.deepEqual(result.indices.groups.b, undefined);
  t.deepEqual(result.indices.groups.c, [3, 6]);

  try {
    const re = new RE2(new RegExp('1', 'd'));
    t.ok(re.hasIndices);
  } catch (e) {
    // squelch
  }
});

test('exec hasIndices lastIndex', t => {
  const re2 = new RE2('a', 'dg');

  t.equal(re2.lastIndex, 0);

  let result = re2.exec('abca');
  t.equal(re2.lastIndex, 1);
  t.equal(result.index, 0);
  t.deepEqual(Array.from(result.indices), [[0, 1]]);

  result = re2.exec('abca');
  t.equal(re2.lastIndex, 4);
  t.equal(result.index, 3);
  t.deepEqual(Array.from(result.indices), [[3, 4]]);

  result = re2.exec('abca');
  t.equal(re2.lastIndex, 0);
  t.equal(result, null);
});

test('exec buffer vs string', t => {
  const re2 = new RE2('.', 'g'),
    pattern = 'abcdefg';

  re2.lastIndex = 2;
  const result1 = re2.exec(pattern);

  re2.lastIndex = 2;
  const result2 = re2.exec(Buffer.from(pattern));

  t.equal(result1[0], 'c');
  t.deepEqual(result2[0], Buffer.from('c'));

  t.equal(result1.index, 2);
  t.equal(result2.index, 2);
});

test('exec found empty string', t => {
  const re2 = new RE2('^.*?'),
    match = re2.exec('');

  t.equal(match[0], '');
  t.equal(match.index, 0);
  t.equal(match.input, '');
  t.equal(match.groups, undefined);
});
