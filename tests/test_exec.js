"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [

	// These tests are copied from MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec

	function test_execBasic(t) {
		"use strict";

		var re = new RE2("quick\\s(brown).+?(jumps)", "ig");

		eval(t.TEST("re.source === 'quick\\\\s(brown).+?(jumps)'"));
		eval(t.TEST("re.ignoreCase"));
		eval(t.TEST("re.global"));
		eval(t.TEST("!re.multiline"));

		var result = re.exec("The Quick Brown Fox Jumps Over The Lazy Dog");

		eval(t.TEST("t.unify(result, ['Quick Brown Fox Jumps', 'Brown', 'Jumps'])"));
		eval(t.TEST("result.index === 4"));
		eval(t.TEST("result.input === 'The Quick Brown Fox Jumps Over The Lazy Dog'"));
		eval(t.TEST("re.lastIndex === 25"));
	},
	function test_execSucc(t) {
		"use strict";

		var str = "abbcdefabh";

		var re = new RE2("ab*", "g");
		var result = re.exec(str);

		eval(t.TEST("!!result"));
		eval(t.TEST("result[0] === 'abb'"));
		eval(t.TEST("re.lastIndex === 3"));

		result = re.exec(str);

		eval(t.TEST("!!result"));
		eval(t.TEST("result[0] === 'ab'"));
		eval(t.TEST("re.lastIndex === 9"));

		result = re.exec(str);

		eval(t.TEST("!result"));
	},
	function test_execSimple(t) {
		"use strict";

		var re = new RE2("(hello \\S+)");
		var result = re.exec("This is a hello world!");

		eval(t.TEST("result[1] === 'hello world!'"));
	},

	// Unicode tests

	function test_execUnicode(t) {
		"use strict";

		var re = new RE2("охотник\\s(желает).+?(где)", "ig");

		eval(t.TEST("re.source === 'охотник\\\\s(желает).+?(где)'"));
		eval(t.TEST("re.ignoreCase"));
		eval(t.TEST("re.global"));
		eval(t.TEST("!re.multiline"));

		var result = re.exec("Каждый Охотник Желает Знать Где Сидит Фазан");

		eval(t.TEST("t.unify(result, ['Охотник Желает Знать Где', 'Желает', 'Где'])"));
		eval(t.TEST("result.index === 7"));
		eval(t.TEST("result.input === 'Каждый Охотник Желает Знать Где Сидит Фазан'"));
		eval(t.TEST("re.lastIndex === 31"));

		eval(t.TEST("result.input.substr(result.index) === 'Охотник Желает Знать Где Сидит Фазан'"));
		eval(t.TEST("result.input.substr(re.lastIndex) === ' Сидит Фазан'"));
	},

	// Buffer tests

	function test_execBuffer(t) {
		"use strict";

		var re  = new RE2("охотник\\s(желает).+?(где)", "ig");
		var buf = new Buffer("Каждый Охотник Желает Знать Где Сидит Фазан");

		var result = re.exec(buf);

		eval(t.TEST("result.length === 3"));
		eval(t.TEST("result[0] instanceof Buffer"));
		eval(t.TEST("result[1] instanceof Buffer"));
		eval(t.TEST("result[2] instanceof Buffer"));

		eval(t.TEST("result[0].toString() === 'Охотник Желает Знать Где'"));
		eval(t.TEST("result[1].toString() === 'Желает'"));
		eval(t.TEST("result[2].toString() === 'Где'"));

		eval(t.TEST("result.index === 13"));
		eval(t.TEST("result.input instanceof Buffer"));
		eval(t.TEST("result.input.toString() === 'Каждый Охотник Желает Знать Где Сидит Фазан'"));
		eval(t.TEST("re.lastIndex === 58"));

		eval(t.TEST("result.input.toString('utf8', result.index) === 'Охотник Желает Знать Где Сидит Фазан'"));
		eval(t.TEST("result.input.toString('utf8', re.lastIndex) === ' Сидит Фазан'"));	}
]);
