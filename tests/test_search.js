"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [
	function test_search(t) {
		"use strict";

		var str = "Total is 42 units.";

		var re = new RE2(/\d+/i);
		var result = re.search(str);
		eval(t.TEST("result === 9"));

		re = new RE2("\\b[a-z]+\\b");
		result = re.search(str);
		eval(t.TEST("result === 6"));

		re = new RE2("\\b\\w+\\b");
		result = re.search(str);
		eval(t.TEST("result === 0"));

		re = new RE2("z", "gm");
		result = re.search(str);
		eval(t.TEST("result === -1"));
	}
]);
