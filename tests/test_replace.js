"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [
	function test_replace(t) {
		"use strict";

		var re = new RE2(/apples/gi);
		var result = re.replace("Apples are round, and apples are juicy.", "oranges");
		eval(t.TEST("result === 'oranges are round, and oranges are juicy.'"));

		re = new RE2(/xmas/i);
		result = re.replace("Twas the night before Xmas...", "Christmas");
		eval(t.TEST("result === 'Twas the night before Christmas...'"));

		re = new RE2(/(\w+)\s(\w+)/);
		result = re.replace("John Smith", "$2, $1");
		eval(t.TEST("result === 'Smith, John'"));
	}
]);
