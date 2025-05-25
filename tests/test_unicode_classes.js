'use strict';

var unit = require('heya-unit');
var RE2 = require('../re2');

// tests

unit.add(module, [
  function test_unicodeClasses(t) {
    'use strict';

    let re2 = new RE2(/\p{L}/u);
    eval(t.TEST("re2.test('a') === true"));
    eval(t.TEST("re2.test('1') === false"));

    re2 = new RE2(/\p{Letter}/u);
    eval(t.TEST("re2.test('a') === true"));
    eval(t.TEST("re2.test('1') === false"));

    re2 = new RE2(/\p{Lu}/u);
    eval(t.TEST("re2.test('A') === true"));
    eval(t.TEST("re2.test('a') === false"));

    re2 = new RE2(/\p{Uppercase_Letter}/u);
    eval(t.TEST("re2.test('A') === true"));
    eval(t.TEST("re2.test('a') === false"));
  }
]);
