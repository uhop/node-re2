"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [

	// These tests are copied from MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test

	function test_testFromExec(t) {
		"use strict";

		var re = new RE2("quick\\s(brown).+?(jumps)", "ig");

		eval(t.TEST("re.test('The Quick Brown Fox Jumps Over The Lazy Dog')"));
		eval(t.TEST("re.test('tHE qUICK bROWN fOX jUMPS oVER tHE lAZY dOG')"));
		eval(t.TEST("re.test('the quick brown fox jumps over the lazy dog')"));
		eval(t.TEST("re.test('THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG')"));
		eval(t.TEST("!re.test('THE KWIK BROWN FOX JUMPS OVER THE LAZY DOG')"));

		re = new RE2("ab*", "g");

		eval(t.TEST("re.test('abbcdefabh')"));
		eval(t.TEST("!re.test('qwerty')"));

		re = new RE2("(hello \\S+)");

		eval(t.TEST("re.test('This is a hello world!')"));
		eval(t.TEST("!re.test('This is a Hello world!')"));
	},
	function test_testSimple(t) {
		"use strict";

		var str = "abbcdefabh";

		var re1 = new RE2("ab*", "g");

		eval(t.TEST("re1.test(str)"));

		var re2 = new RE2("ab*");

		eval(t.TEST("re2.test(str)"));

		var re3 = new RE2("abc");

		eval(t.TEST("!re3.test(str)"));
	}
]);
