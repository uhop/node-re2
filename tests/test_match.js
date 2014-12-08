"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

// This tests are copied from MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match

unit.add(module, [
	function test_match(t) {
		"use strict";
		var re = new RE2(/(chapter \d+(\.\d)*)/i);
		var str = "For more information, see Chapter 3.4.5.1";
		var result = re.match(str);
		eval(t.TEST("result.input === str"));
		eval(t.TEST("result.index === 26"));
		eval(t.TEST("result[0] === 'Chapter 3.4.5.1'"));
		eval(t.TEST("result[1] === 'Chapter 3.4.5.1'"));
		eval(t.TEST("result[2] === '.1'"));
	},
	function test_matchGlobal(t) {
		"use strict";
		var re = new RE2(/[A-E]/gi);
		var result = re.match("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");
		eval(t.TEST("t.unify(result, ['A', 'B', 'C', 'D', 'E', 'a', 'b', 'c', 'd', 'e'])"));
	}
]);
