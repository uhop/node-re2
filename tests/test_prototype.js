"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [
	function test_prototype(t) {
		"use strict";

		eval(t.TEST("RE2.prototype.source === '(?:)'"));
		eval(t.TEST("RE2.prototype.global === false"));
		eval(t.TEST("RE2.prototype.ignoreCase === false"));
		eval(t.TEST("RE2.prototype.multiline === false"));
		eval(t.TEST("RE2.prototype.lastIndex === 0'"));
	}
]);
