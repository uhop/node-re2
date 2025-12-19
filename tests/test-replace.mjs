import test from 'tape-six';
import {default as RE2} from '../re2.js';

// tests

// These tests are copied from MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace

test('test replace string', t => {
  let re = new RE2(/apples/gi);
  let result = re.replace('Apples are round, and apples are juicy.', 'oranges');
  t.equal(result, 'oranges are round, and oranges are juicy.');

  re = new RE2(/xmas/i);
  result = re.replace('Twas the night before Xmas...', 'Christmas');
  t.equal(result, 'Twas the night before Christmas...');

  re = new RE2(/(\w+)\s(\w+)/);
  result = re.replace('John Smith', '$2, $1');
  t.equal(result, 'Smith, John');
});

test('test replace functional replacer', t => {
  function replacer(match, p1, p2, p3, offset, string) {
    // p1 is nondigits, p2 digits, and p3 non-alphanumerics
    return [p1, p2, p3].join(' - ');
  }

  const re = new RE2(/([^\d]*)(\d*)([^\w]*)/);
  const result = re.replace('abc12345#$*%', replacer);
  t.equal(result, 'abc - 12345 - #$*%');
});

test('test replace functional upper to hyphen lower', t => {
  function upperToHyphenLower(match) {
    return '-' + match.toLowerCase();
  }

  const re = new RE2(/[A-Z]/g);
  const result = re.replace('borderTop', upperToHyphenLower);
  t.equal(result, 'border-top');
});

test('test replace functional convert', t => {
  function convert(str, p1, offset, s) {
    return ((p1 - 32) * 5) / 9 + 'C';
  }

  const re = new RE2(/(\d+(?:\.\d*)?)F\b/g);

  t.equal(re.replace('32F', convert), '0C');
  t.equal(re.replace('41F', convert), '5C');
  t.equal(re.replace('50F', convert), '10C');
  t.equal(re.replace('59F', convert), '15C');
  t.equal(re.replace('68F', convert), '20C');
  t.equal(re.replace('77F', convert), '25C');
  t.equal(re.replace('86F', convert), '30C');
  t.equal(re.replace('95F', convert), '35C');
  t.equal(re.replace('104F', convert), '40C');
  t.equal(re.replace('113F', convert), '45C');
  t.equal(re.replace('212F', convert), '100C');
});

test('test replace functional loop', t => {
  const logs = [];
  RE2(/(x_*)|(-)/g).replace('x-x_', function (match, p1, p2) {
    if (p1) {
      logs.push('on:  ' + p1.length);
    }
    if (p2) {
      logs.push('off: 1');
    }
  });
  t.deepEqual(logs, ['on:  1', 'off: 1', 'on:  2']);
});

test('test replace invalid', t => {
  const re = RE2('');

  try {
    re.replace(
      {
        toString() {
          throw 'corner1';
        }
      },
      ''
    );
    t.fail(); // shouldn't be here
  } catch (e) {
    t.equal(e, 'corner1');
  }

  try {
    re.replace('', {
      toString() {
        throw 'corner2';
      }
    });
    t.fail(); // shouldn't be here
  } catch (e) {
    t.equal(e, 'corner2');
  }

  let arg2Stringified = false;

  try {
    re.replace(
      {
        toString() {
          throw 'corner1';
        }
      },
      {
        toString() {
          arg2Stringified = true;
          throw 'corner2';
        }
      }
    );
    t.fail(); // shouldn't be here
  } catch (e) {
    t.equal(e, 'corner1');
    t.notOk(arg2Stringified);
  }

  try {
    re.replace('', () => {
      throw 'corner2';
    });
    t.fail(); // shouldn't be here
  } catch (e) {
    t.equal(e, 'corner2');
  }

  try {
    re.replace('', () => ({
      toString() {
        throw 'corner2';
      }
    }));
    t.fail(); // shouldn't be here
  } catch (e) {
    t.equal(e, 'corner2');
  }
});

// Unicode tests

test('test replace string unicode', t => {
  let re = new RE2(/яблоки/gi);
  let result = re.replace('Яблоки красны, яблоки сочны.', 'апельсины');
  t.equal(result, 'апельсины красны, апельсины сочны.');

  re = new RE2(/иван/i);
  result = re.replace('Могуч Иван Иванов...', 'Сидор');
  t.equal(result, 'Могуч Сидор Иванов...');

  re = new RE2(/иван/gi);
  result = re.replace('Могуч Иван Иванов...', 'Сидор');
  t.equal(result, 'Могуч Сидор Сидоров...');

  re = new RE2(/([а-яё]+)\s+([а-яё]+)/i);
  result = re.replace('Пётр Петров', '$2, $1');
  t.equal(result, 'Петров, Пётр');
});

test('test replace functional unicode', t => {
  function replacer(match, offset, string) {
    t.equal(typeof offset, 'number');
    t.equal(typeof string, 'string');
    t.ok(offset === 0 || offset === 7);
    t.equal(string, 'ИВАН и пЁтр');
    return match.charAt(0).toUpperCase() + match.substr(1).toLowerCase();
  }

  const re = new RE2(/(?:иван|пётр|сидор)/gi);
  const result = re.replace('ИВАН и пЁтр', replacer);
  t.equal(result, 'Иван и Пётр');
});

// Buffer tests

test('test replace string buffer', t => {
  const re = new RE2(/яблоки/gi);
  let result = re.replace(
    Buffer.from('Яблоки красны, яблоки сочны.'),
    'апельсины'
  );
  t.ok(result instanceof Buffer);
  t.equal(result.toString(), 'апельсины красны, апельсины сочны.');

  result = re.replace(
    Buffer.from('Яблоки красны, яблоки сочны.'),
    Buffer.from('апельсины')
  );
  t.ok(result instanceof Buffer);
  t.equal(result.toString(), 'апельсины красны, апельсины сочны.');

  result = re.replace('Яблоки красны, яблоки сочны.', Buffer.from('апельсины'));
  t.equal(typeof result, 'string');
  t.equal(result, 'апельсины красны, апельсины сочны.');
});

test('test replace functional buffer', t => {
  function replacer(match, offset, string) {
    t.ok(match instanceof Buffer);
    t.equal(typeof offset, 'number');
    t.equal(typeof string, 'string');
    t.ok(offset === 0 || offset === 12);
    t.equal(string, 'ИВАН и пЁтр');
    const s = match.toString();
    return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
  }
  replacer.useBuffers = true;

  const re = new RE2(/(?:иван|пётр|сидор)/gi);
  const result = re.replace('ИВАН и пЁтр', replacer);
  t.equal(typeof result, 'string');
  t.equal(result, 'Иван и Пётр');
});

test('test replace0', t => {
  const replacer = match => 'MARKER' + match;

  let re = new RE2(/^/g);
  let result = re.replace('foo bar', 'MARKER');
  t.equal(result, 'MARKERfoo bar');
  result = re.replace('foo bar', replacer);
  t.equal(result, 'MARKERfoo bar');

  re = new RE2(/$/g);
  result = re.replace('foo bar', 'MARKER');
  t.equal(result, 'foo barMARKER');
  result = re.replace('foo bar', replacer);
  t.equal(result, 'foo barMARKER');

  re = new RE2(/\b/g);
  result = re.replace('foo bar', 'MARKER');
  t.equal(result, 'MARKERfooMARKER MARKERbarMARKER');
  result = re.replace('foo bar', replacer);
  t.equal(result, 'MARKERfooMARKER MARKERbarMARKER');
});

// Sticky tests

test('test replace sticky', t => {
  const re = new RE2(/[A-E]/y);

  t.equal(re.replace('ABCDEFABCDEF', '!'), '!BCDEFABCDEF');
  t.equal(re.replace('ABCDEFABCDEF', '!'), 'A!CDEFABCDEF');
  t.equal(re.replace('ABCDEFABCDEF', '!'), 'AB!DEFABCDEF');
  t.equal(re.replace('ABCDEFABCDEF', '!'), 'ABC!EFABCDEF');
  t.equal(re.replace('ABCDEFABCDEF', '!'), 'ABCD!FABCDEF');
  t.equal(re.replace('ABCDEFABCDEF', '!'), 'ABCDEFABCDEF');
  t.equal(re.replace('ABCDEFABCDEF', '!'), '!BCDEFABCDEF');

  const re2 = new RE2(/[A-E]/gy);

  t.equal(re2.replace('ABCDEFABCDEF', '!'), '!!!!!FABCDEF');
  t.equal(re2.replace('FABCDEFABCDE', '!'), 'FABCDEFABCDE');

  re2.lastIndex = 3;

  t.equal(re2.replace('ABCDEFABCDEF', '!'), '!!!!!FABCDEF');
  t.equal(re2.lastIndex, 0);
});

// Non-matches

test('test replace one non-match', t => {
  const replacer = (match, capture, offset, string) => {
    t.equal(typeof offset, 'number');
    t.equal(typeof match, 'string');
    t.equal(typeof string, 'string');
    t.equal(typeof capture, 'undefined');
    t.equal(offset, 0);
    t.equal(string, 'hello ');
    return '';
  };

  const re = new RE2(/hello (world)?/);
  re.replace('hello ', replacer);
});

test('test replace two non-matches', t => {
  const replacer = (match, capture1, capture2, offset, string, groups) => {
    t.equal(typeof offset, 'number');
    t.equal(typeof match, 'string');
    t.equal(typeof string, 'string');
    t.equal(typeof capture1, 'undefined');
    t.equal(typeof capture2, 'undefined');
    t.equal(offset, 1);
    t.equal(match, 'b & y');
    t.equal(string, 'ab & yz');
    t.equal(typeof groups, 'object');
    t.equal(Object.keys(groups).length, 2);
    t.equal(groups.a, undefined);
    t.equal(groups.b, undefined);
    return '';
  };

  const re = new RE2(/b(?<a>1)? & (?<b>2)?y/);
  const result = re.replace('ab & yz', replacer);
  t.equal(result, 'az');
});

test('test replace group simple', t => {
  const re = new RE2(/(2)/);

  let result = re.replace('123', '$0');
  t.equal(result, '1$03');
  result = re.replace('123', '$1');
  t.equal(result, '123');
  result = re.replace('123', '$2');
  t.equal(result, '1$23');

  result = re.replace('123', '$00');
  t.equal(result, '1$003');
  result = re.replace('123', '$01');
  t.equal(result, '123');
  result = re.replace('123', '$02');
  t.equal(result, '1$023');
});

test('test replace group cases', t => {
  let re = new RE2(/(test)/g);
  let result = re.replace('123', '$1$20');
  t.equal(result, '123');

  re = new RE2(/(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)/g);
  result = re.replace('abcdefghijklmnopqrstuvwxyz123', '$10$20');
  t.equal(result, 'jb0wo0123');

  re = new RE2(/(.)(.)(.)(.)(.)/g);
  result = re.replace('abcdefghijklmnopqrstuvwxyz123', '$10$20');
  t.equal(result, 'a0b0f0g0k0l0p0q0u0v0z123');

  re = new RE2(
    /(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)/g
  );
  result = re.replace('abcdefghijklmnopqrstuvwxyz123', '$10$20');
  t.equal(result, 'jtvwxyz123');

  re = new RE2(/abcd/g);
  result = re.replace('abcd123', '$1$2');
  t.equal(result, '$1$2123');
});

test('test replace empty replacement', t => {
  t.equal('ac', 'abc'.replace(RE2('b'), ''));
});
