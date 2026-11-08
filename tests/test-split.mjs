import test from 'tape-six';
import {RE2} from '../re2.js';
import {Buffer} from 'node:buffer';

// utilities

const verifyBuffer = (bufArray, t) =>
  bufArray.map(x => {
    t.ok(x instanceof Buffer);
    return x.toString();
  });

// tests

// These tests are copied from MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split

test('test split', t => {
  let re = new RE2(/\s+/);
  let result = re.split('Oh brave new world that has such people in it.');
  t.deepEqual(result, [
    'Oh',
    'brave',
    'new',
    'world',
    'that',
    'has',
    'such',
    'people',
    'in',
    'it.'
  ]);

  re = new RE2(',');
  result = re.split('Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec');
  t.deepEqual(result, [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]);

  re = new RE2(',');
  result = re.split(',Jan,Feb,Mar,Apr,May,Jun,,Jul,Aug,Sep,Oct,Nov,Dec,');
  t.deepEqual(result, [
    '',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    '',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
    ''
  ]);

  re = new RE2(/\s*;\s*/);
  result = re.split(
    'Harry Trump ;Fred Barney; Helen Rigby ; Bill Abel ;Chris Hand '
  );
  t.deepEqual(result, [
    'Harry Trump',
    'Fred Barney',
    'Helen Rigby',
    'Bill Abel',
    'Chris Hand '
  ]);

  re = new RE2(/\s+/);
  result = re.split('Hello World. How are you doing?', 3);
  t.deepEqual(result, ['Hello', 'World.', 'How']);

  re = new RE2(/(\d)/);
  result = re.split('Hello 1 word. Sentence number 2.');
  t.deepEqual(result, ['Hello ', '1', ' word. Sentence number ', '2', '.']);

  t.deepEqual(
    RE2(/[x-z]*/)
      .split('asdfghjkl')
      .reverse()
      .join(''),
    'lkjhgfdsa'
  );
});

test('test_splitInvalid', t => {
  const re = RE2('');

  try {
    re.split({
      toString() {
        throw 'corner';
      }
    });
    t.fail(); // shouldn't be here
  } catch (e) {
    t.equal(e, 'corner');
  }
});

test('test_cornerCases', t => {
  const re = new RE2(/1/);
  const result = re.split('23456');
  t.deepEqual(result, ['23456']);
});

// Unicode tests

test('test split unicode', t => {
  let re = new RE2(/\s+/);
  let result = re.split('Она не понимает, что этим убивает меня.');
  t.deepEqual(result, [
    'Она',
    'не',
    'понимает,',
    'что',
    'этим',
    'убивает',
    'меня.'
  ]);

  re = new RE2(',');
  result = re.split('Пн,Вт,Ср,Чт,Пт,Сб,Вс');
  t.deepEqual(result, ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']);

  re = new RE2(/\s*;\s*/);
  result = re.split('Ваня Иванов ;Петро Петренко; Саша Машин ; Маша Сашина');
  t.deepEqual(result, [
    'Ваня Иванов',
    'Петро Петренко',
    'Саша Машин',
    'Маша Сашина'
  ]);

  re = new RE2(/\s+/);
  result = re.split('Привет мир. Как дела?', 3);
  t.deepEqual(result, ['Привет', 'мир.', 'Как']);

  re = new RE2(/(\d)/);
  result = re.split('Привет 1 слово. Предложение номер 2.');
  t.deepEqual(result, ['Привет ', '1', ' слово. Предложение номер ', '2', '.']);

  t.deepEqual(
    RE2(/[э-я]*/)
      .split('фывапролд')
      .reverse()
      .join(''),
    'длорпавыф'
  );
});

// Buffer tests

test('test split buffer', t => {
  let re = new RE2(/\s+/);
  let result = re.split(Buffer.from('Она не понимает, что этим убивает меня.'));
  t.deepEqual(verifyBuffer(result, t), [
    'Она',
    'не',
    'понимает,',
    'что',
    'этим',
    'убивает',
    'меня.'
  ]);

  re = new RE2(',');
  result = re.split(Buffer.from('Пн,Вт,Ср,Чт,Пт,Сб,Вс'));
  t.deepEqual(verifyBuffer(result, t), [
    'Пн',
    'Вт',
    'Ср',
    'Чт',
    'Пт',
    'Сб',
    'Вс'
  ]);

  re = new RE2(/\s*;\s*/);
  result = re.split(
    Buffer.from('Ваня Иванов ;Петро Петренко; Саша Машин ; Маша Сашина')
  );
  t.deepEqual(verifyBuffer(result, t), [
    'Ваня Иванов',
    'Петро Петренко',
    'Саша Машин',
    'Маша Сашина'
  ]);

  re = new RE2(/\s+/);
  result = re.split(Buffer.from('Привет мир. Как дела?'), 3);
  t.deepEqual(verifyBuffer(result, t), ['Привет', 'мир.', 'Как']);

  re = new RE2(/(\d)/);
  result = re.split(Buffer.from('Привет 1 слово. Предложение номер 2.'));
  t.deepEqual(verifyBuffer(result, t), [
    'Привет ',
    '1',
    ' слово. Предложение номер ',
    '2',
    '.'
  ]);

  t.deepEqual(
    RE2(/[э-я]*/)
      .split(Buffer.from('фывапролд'))
      .reverse()
      .join(''),
    'длорпавыф'
  );
});

test('test split alternation groups', t => {
  const re = new RE2(/(a)|(b)/);
  const result = re.split('xaxbx');
  t.deepEqual(result, ['x', 'a', undefined, 'x', undefined, 'b', 'x']);

  const re2 = new RE2(/(a)|(b)/);
  const bufResult = re2.split(Buffer.from('xaxbx'));
  t.equal(bufResult.length, 7);
  t.ok(bufResult[0] instanceof Buffer);
  t.equal(bufResult[0].toString(), 'x');
  t.ok(bufResult[1] instanceof Buffer);
  t.equal(bufResult[1].toString(), 'a');
  t.equal(bufResult[2], undefined);
  t.equal(bufResult[4], undefined);
  t.ok(bufResult[5] instanceof Buffer);
  t.equal(bufResult[5].toString(), 'b');
});

// Zero-width matches

test('test split zero-width matches like the built-in engine', t => {
  const cases = [
    ['  a', '\\b'],
    ['abc', '$', 'm'],
    ['abc', '^', 'm'],
    ['a\nb', '^', 'm'],
    ['a\nb', '$', 'm'],
    ['foo bar', '\\B'],
    ['abc', '(a)?'],
    ['abc', '(a)|'],
    ['abc', ''],
    ['😀a😀', ''],
    ['😀 a', '\\b'],
    ['', 'a*'],
    ['', ''],
    ['', 'x']
  ];
  for (const [text, source, flags = ''] of cases) {
    t.deepEqual(
      new RE2(source, flags).split(text),
      text.split(new RegExp(source, flags + 'u')),
      JSON.stringify(text) + ' on /' + source + '/' + flags
    );
  }
});

test('test split uses a distant zero-width match', t => {
  const text = '中'.repeat(50000);
  const result = new RE2('\\b').split(text + 'a');
  t.equal(result.length, 2);
  t.ok(result[0] === text);
  t.equal(result[1], 'a');
});

test('test split never divides a multi-byte character', t => {
  t.deepEqual(new RE2('\\B').split('aab😀'), ['a', 'a', 'b😀']);
  t.deepEqual(new RE2('\\B').split('b中é'), ['b中', 'é']);
  t.deepEqual(verifyBuffer(new RE2('\\B').split(Buffer.from('aab😀')), t), [
    'a',
    'a',
    'b😀'
  ]);
});

test('test split zero-width matches in a buffer', t => {
  const result = new RE2('\\b').split(Buffer.from('中文 a'));
  t.deepEqual(verifyBuffer(result, t), ['中文 ', 'a']);
});

test('test split zero-width match before a truncated character', t => {
  const result = new RE2('').split(Buffer.from([0x61, 0xe4]));
  t.deepEqual(
    result.map(x => [...x]),
    [[0x61], [0xe4]]
  );
});

// Limit coercion: expected values come from ECMA-262 RegExp.prototype[%Symbol.split%] and ToUint32

test('test split converts its limit with ToUint32', t => {
  const all = ['a', 'b', 'c'],
    one = ['a'],
    two = ['a', 'b'];
  const cases = [
    [undefined, all],
    [0, []],
    [-0, []],
    [NaN, []],
    [null, []],
    [false, []],
    ['', []],
    ['x', []],
    [{}, []],
    [Infinity, []],
    [-Infinity, []],
    [2 ** 32, []],
    [1, one],
    [true, one],
    [1.9, one],
    [2 ** 32 + 1, one],
    [-(2 ** 32) + 1, one],
    ['2', two],
    [[2], two],
    [{valueOf: () => 2}, two],
    [3, all],
    [4, all],
    [-1, all],
    [2 ** 32 - 1, all]
  ];
  cases.forEach(([limit, expected], index) => {
    t.deepEqual(new RE2(',').split('a,b,c', limit), expected, 'case ' + index);
    t.deepEqual(
      'a,b,c'.split(/,/u, limit),
      expected,
      'built-in, case ' + index
    );
  });
});

test('test split with a limit of 0 searches nothing', t => {
  t.deepEqual(new RE2('x').split('', 0), []);
  t.deepEqual(new RE2('').split('', 0), []);
  t.deepEqual(new RE2(',').split(Buffer.from('a,b'), 0), []);
  t.deepEqual('a,b'.split(new RE2(','), 0), []);
});

test('test split limit on a binary subject', t => {
  const result = new RE2(',').split(Buffer.from('a,b,c'), '2');
  t.deepEqual(verifyBuffer(result, t), ['a', 'b']);
});

test('test split passes on limit conversion errors', t => {
  const re = new RE2(',');

  try {
    re.split('a,b', {
      valueOf() {
        throw 'corner';
      }
    });
    t.fail('expected an exception');
  } catch (error) {
    t.equal(error, 'corner');
  }

  for (const limit of [1n, Symbol.for('re2.test')]) {
    try {
      re.split('a,b', limit);
      t.fail('expected a TypeError');
    } catch (error) {
      t.ok(error instanceof TypeError);
    }
  }
});

test('test split converts the subject before the limit', t => {
  const order = [];
  const result = new RE2(',').split(
    {
      toString() {
        order.push('subject');
        return 'a,b';
      }
    },
    {
      valueOf() {
        order.push('limit');
        return 1;
      }
    }
  );
  t.deepEqual(order, ['subject', 'limit']);
  t.deepEqual(result, ['a']);
});

test('test split survives a limit that uses the same object', t => {
  const re = new RE2(',');
  const result = re.split('a,b', {
    valueOf() {
      re.exec('z,z,z');
      return 1;
    }
  });
  t.deepEqual(result, ['a']);
});

test('test split returns a converted subject', t => {
  t.deepEqual(new RE2('x').split(123), ['123']);
  t.deepEqual(new RE2('2').split(123), ['1', '3']);
  t.deepEqual(new RE2('x').split(''), ['']);
  t.deepEqual(new RE2('x').split([]), ['']);
});

// Sticky tests

test('test split sticky', t => {
  const re = new RE2(/\s+/y); // sticky is ignored

  const result = re.split('Oh brave new world that has such people in it.');
  t.deepEqual(result, [
    'Oh',
    'brave',
    'new',
    'world',
    'that',
    'has',
    'such',
    'people',
    'in',
    'it.'
  ]);

  const result2 = re.split(' Oh brave new world that has such people in it.');
  t.deepEqual(result2, [
    '',
    'Oh',
    'brave',
    'new',
    'world',
    'that',
    'has',
    'such',
    'people',
    'in',
    'it.'
  ]);
});
