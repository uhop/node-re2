'use strict';

const unit = require('heya-unit');
const RE2 = require('../re2');

// tests

unit.add(module, [
  // These tests are copied from MDN:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll

  function test_matchAll(t) {
    'use strict';

    const str = 'test1test2';
    const re = new RE2(/t(e)(st(\d?))/g);
    const result = Array.from(str.matchAll(re));

    eval(t.TEST('result.length === 2'));
    eval(t.TEST('result[0].input === str'));
    eval(t.TEST('result[0].index === 0'));
    eval(t.TEST('result[0].length === 4'));
    eval(t.TEST("result[0][0] === 'test1'"));
    eval(t.TEST("result[0][1] === 'e'"));
    eval(t.TEST("result[0][2] === 'st1'"));
    eval(t.TEST("result[0][3] === '1'"));
    eval(t.TEST('result[1].input === str'));
    eval(t.TEST('result[1].index === 5'));
    eval(t.TEST('result[1].length === 4'));
    eval(t.TEST("result[1][0] === 'test2'"));
    eval(t.TEST("result[1][1] === 'e'"));
    eval(t.TEST("result[1][2] === 'st2'"));
    eval(t.TEST("result[1][3] === '2'"));
  },

  function test_matchAll_iterator(t) {
    'use strict';

    const str = 'table football, foosball';
    const re = new RE2('foo[a-z]*', 'g');

    const expected = [
      {start: 6, finish: 14},
      {start: 16, finish: 24}
    ];
    let i = 0;
    for (const match of str.matchAll(re)) {
      eval(t.TEST('match.index === expected[i].start'));
      eval(t.TEST('match.index + match[0].length === expected[i].finish'));
      ++i;
    }
  },

  function test_matchAll_non_global(t) {
    'use strict';

    const re = RE2('b');

    try {
      'abc'.matchAll(re);
      t.test(false); // shouldn't be here
    } catch (e) {
      eval(t.TEST('e instanceof TypeError'));
    }
  },

  function test_matchAll_lastIndex(t) {
    'use strict';

    const re = RE2('[a-c]', 'g');
    re.lastIndex = 1;

    const expected = ['b', 'c'];
    let i = 0;
    for (const match of 'abc'.matchAll(re)) {
      eval(t.TEST('re.lastIndex === 1'));
      eval(t.TEST('match[0] === expected[i]'));
      ++i;
    }
  }
]);
