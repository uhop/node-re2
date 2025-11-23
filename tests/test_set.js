'use strict';

var unit = require('heya-unit');
var RE2 = require('../re2');

unit.add(module, [
  function test_setBasics(t) {
    var set = new RE2.Set(['foo', 'bar'], 'im');

    eval(t.TEST('set instanceof Object'));
    eval(t.TEST("typeof set.match === 'function'"));
    eval(t.TEST('set.size === 2'));
    eval(t.TEST("set.flags === 'imu'"));
    eval(t.TEST("set.anchor === 'unanchored'"));
    eval(t.TEST("Array.isArray(set.sources)"));
    eval(t.TEST("set.sources[0] === 'foo'"));
    eval(t.TEST("set.source === 'foo|bar'"));
    eval(t.TEST("set.toString() === '/foo|bar/imu'"));
  },
  function test_setMatching(t) {
    var set = new RE2.Set(['foo', 'bar'], 'i');

    var result = set.match('xxFOOxxbar');
    eval(t.TEST('result.length === 2'));
    eval(t.TEST('result[0] === 0'));
    eval(t.TEST('result[1] === 1'));
    eval(t.TEST('set.test("nothing here") === false'));
    eval(t.TEST('set.match("nothing here").length === 0'));
  },
  function test_setAnchors(t) {
    var start = new RE2.Set(['abc'], {anchor: 'start'});
    var both = new RE2.Set(['abc'], {anchor: 'both'});

    eval(t.TEST('start.test("zabc") === false'));
    eval(t.TEST('start.test("abc") === true'));
    eval(t.TEST('both.test("abc") === true'));
    eval(t.TEST('both.test("abc1") === false'));
  },
  function test_setIterable(t) {
    function *gen() {
      yield 'cat';
      yield 'dog';
    }

    var set = new RE2.Set(gen());
    eval(t.TEST('set.size === 2'));
    var result = set.match('hotdog');
    eval(t.TEST('result.length === 1'));
    eval(t.TEST('result[0] === 1'));
  },
  function test_setFlagsOverride(t) {
    var set = new RE2.Set([/abc/], 'i');
    eval(t.TEST('set.test("ABC") === true'));
    eval(t.TEST('set.flags === "iu"'));
  },
  function test_setInvalid(t) {
    try {
      var set = new RE2.Set([null]);
      t.test(false);
    } catch (e) {
      eval(t.TEST('e instanceof TypeError'));
    }
  },
  function test_setPerformance(t) {
    var patternCount = 200;
    var iterations = 4000;

    var patterns = [];
    for (var i = 0; i < patternCount; ++i) {
      patterns.push('token' + i + '(?:[a-z]+)?');
    }

    var inputs = [];
    for (var j = 0; j < iterations; ++j) {
      inputs.push('xx' + (j % patternCount) + ' ' + (j & 7) + ' token' + (j % patternCount) + ' tail');
    }

    var set = new RE2.Set(patterns);
    var re2List = patterns.map(function (p) { return new RE2(p); });
    var jsList = patterns.map(function (p) { return new RegExp(p); });

    function measure(fn) {
      var start = process.hrtime.bigint();
      var matches = 0;
      for (var i = 0; i < inputs.length; ++i) {
        matches += fn(inputs[i]);
      }
      var duration = Number(process.hrtime.bigint() - start) / 1e6;
      return {time: duration, matches: matches};
    }

    var setResult = measure(function (str) { return set.test(str) ? 1 : 0; });
    var re2Result = measure(function (str) {
      for (var i = 0; i < re2List.length; ++i) {
        if (re2List[i].test(str)) return 1;
      }
      return 0;
    });
    var jsResult = measure(function (str) {
      for (var i = 0; i < jsList.length; ++i) {
        if (jsList[i].test(str)) return 1;
      }
      return 0;
    });

    eval(t.TEST('setResult.matches === re2Result.matches'));
    eval(t.TEST('setResult.matches === jsResult.matches'));
    eval(t.TEST('setResult.time < re2Result.time'));
  }
]);
