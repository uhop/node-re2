"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

// This tests are copied from MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec

unit.add(module, [
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
	}
]);
