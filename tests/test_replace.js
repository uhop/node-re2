'use strict';

var unit = require('heya-unit');
var RE2 = require('../re2');

// tests

unit.add(module, [
  // These tests are copied from MDN:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace

  function test_replaceString(t) {
    'use strict';

    var re = new RE2(/apples/gi);
    var result = re.replace(
      'Apples are round, and apples are juicy.',
      'oranges'
    );
    eval(t.TEST("result === 'oranges are round, and oranges are juicy.'"));

    re = new RE2(/xmas/i);
    result = re.replace('Twas the night before Xmas...', 'Christmas');
    eval(t.TEST("result === 'Twas the night before Christmas...'"));

    re = new RE2(/(\w+)\s(\w+)/);
    result = re.replace('John Smith', '$2, $1');
    eval(t.TEST("result === 'Smith, John'"));
  },
  function test_replaceFunReplacer(t) {
    'use strict';

    function replacer(match, p1, p2, p3, offset, string) {
      // p1 is nondigits, p2 digits, and p3 non-alphanumerics
      return [p1, p2, p3].join(' - ');
    }

    var re = new RE2(/([^\d]*)(\d*)([^\w]*)/);
    var result = re.replace('abc12345#$*%', replacer);
    eval(t.TEST("result === 'abc - 12345 - #$*%'"));
  },
  function test_replaceFunUpper(t) {
    'use strict';

    function upperToHyphenLower(match) {
      return '-' + match.toLowerCase();
    }

    var re = new RE2(/[A-Z]/g);
    var result = re.replace('borderTop', upperToHyphenLower);
    eval(t.TEST("result === 'border-top'"));
  },
  function test_replaceFunConvert(t) {
    'use strict';

    function convert(str, p1, offset, s) {
      return ((p1 - 32) * 5) / 9 + 'C';
    }

    var re = new RE2(/(\d+(?:\.\d*)?)F\b/g);

    eval(t.TEST("re.replace('32F', convert) === '0C'"));
    eval(t.TEST("re.replace('41F', convert) === '5C'"));
    eval(t.TEST("re.replace('50F', convert) === '10C'"));
    eval(t.TEST("re.replace('59F', convert) === '15C'"));
    eval(t.TEST("re.replace('68F', convert) === '20C'"));
    eval(t.TEST("re.replace('77F', convert) === '25C'"));
    eval(t.TEST("re.replace('86F', convert) === '30C'"));
    eval(t.TEST("re.replace('95F', convert) === '35C'"));
    eval(t.TEST("re.replace('104F', convert) === '40C'"));
    eval(t.TEST("re.replace('113F', convert) === '45C'"));
    eval(t.TEST("re.replace('212F', convert) === '100C'"));
  },
  {
    test: function test_replaceFunLoop(t) {
      'use strict';

      RE2(/(x_*)|(-)/g).replace('x-x_', function (match, p1, p2) {
        if (p1) {
          t.info('on:  ' + p1.length);
        }
        if (p2) {
          t.info('off: 1');
        }
      });
    },
    logs: [{text: 'on:  1'}, {text: 'off: 1'}, {text: 'on:  2'}]
  },
  function test_replaceInvalid(t) {
    'use strict';

    var re = RE2('');

    try {
      re.replace(
        {
          toString() {
            throw 'corner1';
          }
        },
        ''
      );
      t.test(false); // shouldn't be here
    } catch (e) {
      eval(t.TEST("e === 'corner1'"));
    }

    try {
      re.replace('', {
        toString() {
          throw 'corner2';
        }
      });
      t.test(false); // shouldn't be here
    } catch (e) {
      eval(t.TEST("e === 'corner2'"));
    }

    var arg2Stringified = false;

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
      t.test(false); // shouldn't be here
    } catch (e) {
      eval(t.TEST("e === 'corner1'"));
      eval(t.TEST('!arg2Stringified'));
    }

    try {
      re.replace('', () => {
        throw 'corner2';
      });
      t.test(false); // shouldn't be here
    } catch (e) {
      eval(t.TEST("e === 'corner2'"));
    }

    try {
      re.replace('', () => ({
        toString() {
          throw 'corner2';
        }
      }));
      t.test(false); // shouldn't be here
    } catch (e) {
      eval(t.TEST("e === 'corner2'"));
    }
  },

  // Unicode tests

  function test_replaceStrUnicode(t) {
    'use strict';

    var re = new RE2(/яблоки/gi);
    var result = re.replace('Яблоки красны, яблоки сочны.', 'апельсины');
    eval(t.TEST("result === 'апельсины красны, апельсины сочны.'"));

    re = new RE2(/иван/i);
    result = re.replace('Могуч Иван Иванов...', 'Сидор');
    eval(t.TEST("result === 'Могуч Сидор Иванов...'"));

    re = new RE2(/иван/gi);
    result = re.replace('Могуч Иван Иванов...', 'Сидор');
    eval(t.TEST("result === 'Могуч Сидор Сидоров...'"));

    re = new RE2(/([а-яё]+)\s+([а-яё]+)/i);
    result = re.replace('Пётр Петров', '$2, $1');
    eval(t.TEST("result === 'Петров, Пётр'"));
  },
  function test_replaceFunUnicode(t) {
    'use strict';

    function replacer(match, offset, string) {
      t.test(typeof offset == 'number');
      t.test(typeof string == 'string');
      t.test(offset === 0 || offset === 7);
      t.test(string === 'ИВАН и пЁтр');
      return match.charAt(0).toUpperCase() + match.substr(1).toLowerCase();
    }

    var re = new RE2(/(?:иван|пётр|сидор)/gi);
    var result = re.replace('ИВАН и пЁтр', replacer);
    eval(t.TEST("result === 'Иван и Пётр'"));
  },

  // Buffer tests

  function test_replaceStrBuffer(t) {
    'use strict';

    var re = new RE2(/яблоки/gi);
    var result = re.replace(
      new Buffer('Яблоки красны, яблоки сочны.'),
      'апельсины'
    );
    eval(t.TEST('result instanceof Buffer'));
    eval(t.TEST("result.toString() === 'апельсины красны, апельсины сочны.'"));

    result = re.replace(
      new Buffer('Яблоки красны, яблоки сочны.'),
      new Buffer('апельсины')
    );
    eval(t.TEST('result instanceof Buffer'));
    eval(t.TEST("result.toString() === 'апельсины красны, апельсины сочны.'"));

    result = re.replace(
      'Яблоки красны, яблоки сочны.',
      new Buffer('апельсины')
    );
    eval(t.TEST("typeof result == 'string'"));
    eval(t.TEST("result === 'апельсины красны, апельсины сочны.'"));
  },
  function test_replaceFunBuffer(t) {
    'use strict';

    function replacer(match, offset, string) {
      eval(t.TEST('match instanceof Buffer'));
      eval(t.TEST("typeof offset == 'number'"));
      eval(t.TEST("typeof string == 'string'"));
      eval(t.TEST('offset === 0 || offset === 12'));
      eval(t.TEST("string === 'ИВАН и пЁтр'"));
      var s = match.toString();
      return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
    }
    replacer.useBuffers = true;

    var re = new RE2(/(?:иван|пётр|сидор)/gi);
    var result = re.replace('ИВАН и пЁтр', replacer);
    eval(t.TEST("typeof result == 'string'"));
    eval(t.TEST("result === 'Иван и Пётр'"));
  },
  function test_replace0(t) {
    'use strict';

    function replacer(match) {
      return 'MARKER' + match;
    }

    var re = new RE2(/^/g);
    var result = re.replace('foo bar', 'MARKER');
    eval(t.TEST("result === 'MARKERfoo bar'"));
    result = re.replace('foo bar', replacer);
    eval(t.TEST("result === 'MARKERfoo bar'"));

    re = new RE2(/$/g);
    result = re.replace('foo bar', 'MARKER');
    eval(t.TEST("result === 'foo barMARKER'"));
    result = re.replace('foo bar', replacer);
    eval(t.TEST("result === 'foo barMARKER'"));

    re = new RE2(/\b/g);
    result = re.replace('foo bar', 'MARKER');
    eval(t.TEST("result === 'MARKERfooMARKER MARKERbarMARKER'"));
    result = re.replace('foo bar', replacer);
    eval(t.TEST("result === 'MARKERfooMARKER MARKERbarMARKER'"));
  },

  // Sticky tests

  function test_replaceSticky(t) {
    'use strict';

    var re = new RE2(/[A-E]/y);

    eval(t.TEST("re.replace('ABCDEFABCDEF', '!') === '!BCDEFABCDEF'"));
    eval(t.TEST("re.replace('ABCDEFABCDEF', '!') === 'A!CDEFABCDEF'"));
    eval(t.TEST("re.replace('ABCDEFABCDEF', '!') === 'AB!DEFABCDEF'"));
    eval(t.TEST("re.replace('ABCDEFABCDEF', '!') === 'ABC!EFABCDEF'"));
    eval(t.TEST("re.replace('ABCDEFABCDEF', '!') === 'ABCD!FABCDEF'"));
    eval(t.TEST("re.replace('ABCDEFABCDEF', '!') === 'ABCDEFABCDEF'"));
    eval(t.TEST("re.replace('ABCDEFABCDEF', '!') === '!BCDEFABCDEF'"));

    var re2 = new RE2(/[A-E]/gy);

    eval(t.TEST("re2.replace('ABCDEFABCDEF', '!') === '!!!!!FABCDEF'"));
    eval(t.TEST("re2.replace('FABCDEFABCDE', '!') === 'FABCDEFABCDE'"));

    re2.lastIndex = 3;

    eval(t.TEST("re2.replace('ABCDEFABCDEF', '!') === '!!!!!FABCDEF'"));
    eval(t.TEST('re2.lastIndex === 0'));
  },

  // Non-matches

  function test_replaceOneNonMatch(t) {
    'use strict';

    function replacer(match, capture, offset, string) {
      t.test(typeof offset == 'number');
      t.test(typeof match == 'string');
      t.test(typeof string == 'string');
      t.test(typeof capture == 'undefined');
      t.test(offset === 0);
      t.test(string === 'hello ');
      return '';
    }

    var re = new RE2(/hello (world)?/);
    re.replace('hello ', replacer);
  },
  function test_replaceTwoNonMatches(t) {
    'use strict';

    function replacer(match, capture1, capture2, offset, string, groups) {
      t.test(typeof offset == 'number');
      t.test(typeof match == 'string');
      t.test(typeof string == 'string');
      t.test(typeof capture1 == 'undefined');
      t.test(typeof capture2 == 'undefined');
      t.test(offset === 1);
      t.test(match === 'b & y');
      t.test(string === 'ab & yz');
      t.test(typeof groups == 'object');
      t.test(Object.keys(groups).length == 2);
      t.test(groups.a === undefined);
      t.test(groups.b == undefined);
      return '';
    }

    var re = new RE2(/b(?<a>1)? & (?<b>2)?y/);
    var result = re.replace('ab & yz', replacer);
    eval(t.TEST("result === 'az'"));
  },
  function test_replaceGroupSimple(t) {
    'use strict';

    var re = new RE2(/(2)/);

    var result = re.replace('123', '$0');
    eval(t.TEST("result === '1$03'"));
    result = re.replace('123', '$1');
    eval(t.TEST("result === '123'"));
    result = re.replace('123', '$2');
    eval(t.TEST("result === '1$23'"));

    result = re.replace('123', '$00');
    eval(t.TEST("result === '1$003'"));
    result = re.replace('123', '$01');
    eval(t.TEST("result === '123'"));
    result = re.replace('123', '$02');
    eval(t.TEST("result === '1$023'"));
  },
  function test_replaceGroupCases(t) {
    'use strict';

    var re = new RE2(/(test)/g);
    var result = re.replace('123', '$1$20');
    eval(t.TEST("result === '123'"));

    re = new RE2(/(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)/g);
    result = re.replace('abcdefghijklmnopqrstuvwxyz123', '$10$20');
    eval(t.TEST("result === 'jb0wo0123'"));

    re = new RE2(/(.)(.)(.)(.)(.)/g);
    result = re.replace('abcdefghijklmnopqrstuvwxyz123', '$10$20');
    eval(t.TEST("result === 'a0b0f0g0k0l0p0q0u0v0z123'"));

    re = new RE2(
      /(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)/g
    );
    result = re.replace('abcdefghijklmnopqrstuvwxyz123', '$10$20');
    eval(t.TEST("result === 'jtvwxyz123'"));

    re = new RE2(/abcd/g);
    result = re.replace('abcd123', '$1$2');
    eval(t.TEST("result === '$1$2123'"));
  },
  function test_emptyReplacement(t) {
    'use strict';

    eval(t.TEST("'ac' === 'abc'.replace(RE2('b'), '')"));
  }
]);
