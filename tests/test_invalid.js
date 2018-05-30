"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [

	function test_inval(t) {
		"use strict";

		var threw;

		// Backreferences
		threw = false;
		try {
			new RE2(/(a)\1/);
		} catch (e) {
			threw = true;
			eval(t.TEST("e instanceof SyntaxError"));
			eval(t.TEST("e.message === 'invalid escape sequence: \\\\1'"));
		}
		t.test(threw);

		// Lookahead assertions

		// Positive
		threw = false;
		try {
			new RE2(/a(?=b)/);
		} catch (e) {
			threw = true;
			eval(t.TEST("e instanceof SyntaxError"));
			eval(t.TEST("e.message === 'invalid perl operator: (?='"));
		}
		t.test(threw);

		// Negative
		threw = false;
		try {
			new RE2(/a(?!b)/);
		} catch (e) {
			threw = true;
			eval(t.TEST("e instanceof SyntaxError"));
			eval(t.TEST("e.message === 'invalid perl operator: (?!'"));
		}
		t.test(threw);
	},
]);
