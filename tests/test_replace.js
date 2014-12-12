"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [

	// These tests are copied from MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace

	function test_replaceString(t) {
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
	},
	function test_replaceFunReplacer(t) {
		"use strict";

		function replacer(match, p1, p2, p3, offset, string) {
			// p1 is nondigits, p2 digits, and p3 non-alphanumerics
			return [p1, p2, p3].join(' - ');
		}

		var re = new RE2(/([^\d]*)(\d*)([^\w]*)/);
		var result = re.replace("abc12345#$*%", replacer);
		eval(t.TEST("result === 'abc - 12345 - #$*%'"));
	},
	function test_replaceFunUpper(t) {
		"use strict";

		function upperToHyphenLower(match) {
			return '-' + match.toLowerCase();
		}

		var re = new RE2(/[A-Z]/g);
		var result = re.replace("borderTop", upperToHyphenLower);
		eval(t.TEST("result === 'border-top'"));
	},
	function test_replaceFunConvert(t) {
		"use strict";

		function convert(str, p1, offset, s) {
			return ((p1 - 32) * 5/9) + 'C';
		}

		var re = new RE2(/(\d+(?:\.\d*)?)F\b/g);

		eval(t.TEST("re.replace('32F', convert) === '0C'"));
		eval(t.TEST("re.replace('41F', convert) === '5C'"));
		eval(t.TEST("re.replace('50F', convert) === '10C'"));
		eval(t.TEST("re.replace('59F', convert) === '15C'"));
		eval(t.TEST("re.replace('68F', convert) === '20C'"));
		eval(t.TEST("re.replace('77F', convert) === '25C'"));
		eval(t.TEST("re.replace('86F', convert) === '30C'"));
		eval(t.TEST("re.replace('95F', convert) === '35C'"));
		eval(t.TEST("re.replace('104F', convert) === '40C'"));
		eval(t.TEST("re.replace('113F', convert) === '45C'"));
		eval(t.TEST("re.replace('212F', convert) === '100C'"));
	},
	{
		test: function test_replaceFunLoop(t) {
			"use strict";

			RE2(/(x_*)|(-)/g).replace("x-x_", function(match, p1, p2) {
				if (p1) { t.info("on:  " + p1.length); }
				if (p2) { t.info("off: 1"); }
			});
		},
		logs: [
			{text: "on:  1"},
			{text: "off: 1"},
			{text: "on:  2"}
		]
	}
]);
