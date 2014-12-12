"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [

	// These tests are copied from MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match

	function test_match(t) {
		"use strict";

		var str = "For more information, see Chapter 3.4.5.1";

		var re = new RE2(/(chapter \d+(\.\d)*)/i);
		var result = re.match(str);

		eval(t.TEST("result.input === str"));
		eval(t.TEST("result.index === 26"));
		eval(t.TEST("result.length === 3"));
		eval(t.TEST("result[0] === 'Chapter 3.4.5.1'"));
		eval(t.TEST("result[1] === 'Chapter 3.4.5.1'"));
		eval(t.TEST("result[2] === '.1'"));
	},
	function test_matchGlobal(t) {
		"use strict";

		var re = new RE2(/[A-E]/gi);
		var result = re.match("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");

		eval(t.TEST("t.unify(result, ['A', 'B', 'C', 'D', 'E', 'a', 'b', 'c', 'd', 'e'])"));
	},

	// Unicode tests

	function test_matchUnicode(t) {
		"use strict";

		var str = "Это ГЛАВА 3.4.5.1";

		var re = new RE2(/(глава \d+(\.\d)*)/i);
		var result = re.match(str);

		eval(t.TEST("result.input === str"));
		eval(t.TEST("result.index === 4"));
		eval(t.TEST("result.length === 3"));
		eval(t.TEST("result[0] === 'ГЛАВА 3.4.5.1'"));
		eval(t.TEST("result[1] === 'ГЛАВА 3.4.5.1'"));
		eval(t.TEST("result[2] === '.1'"));
	},

	// Buffer tests

	function test_matchBuffer(t) {
		"use strict";

		var buf = new Buffer("Это ГЛАВА 3.4.5.1");

		var re = new RE2(/(глава \d+(\.\d)*)/i);
		var result = re.match(buf);

		eval(t.TEST("result.input instanceof Buffer"));
		eval(t.TEST("result.length === 3"));
		eval(t.TEST("result[0] instanceof Buffer"));
		eval(t.TEST("result[1] instanceof Buffer"));
		eval(t.TEST("result[2] instanceof Buffer"));

		eval(t.TEST("result.input === buf"));
		eval(t.TEST("result.index === 7"));
		eval(t.TEST("result.input.toString('utf8', result.index) === 'ГЛАВА 3.4.5.1'"));
		eval(t.TEST("result[0].toString() === 'ГЛАВА 3.4.5.1'"));
		eval(t.TEST("result[1].toString() === 'ГЛАВА 3.4.5.1'"));
		eval(t.TEST("result[2].toString() === '.1'"));
	}
]);
