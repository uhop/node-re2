"use strict";


var unit  = require("heya-unit");
var RE2  = require("../build/Release/re2.node");


// tests

// This tests are copied from MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test

unit.add(module, [
	function test_execSucc(t) {
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
