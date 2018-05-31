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
	},
	function test_replaceInvalid(t) {
		"use strict";

		var re = RE2('');

		try {
			re.replace({ toString() { throw "corner1"; } }, '');
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e === 'corner1'"));
		}

		try {
			re.replace('', { toString() { throw "corner2"; } });
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e === 'corner2'"));
		}

		var arg2Stringified = false;

		try {
			re.replace({ toString() { throw "corner1"; } }, { toString() { arg2Stringified = true; throw "corner2"; } });
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e === 'corner1'"));
			eval(t.TEST("!arg2Stringified"));
		}

		try {
			re.replace('', () => { throw "corner2"; });
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e === 'corner2'"));
		}

		try {
			re.replace('', () => ({ toString() { throw "corner2"; } }));
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e === 'corner2'"));
		}
	},

	// Unicode tests

	function test_replaceStrUnicode(t) {
		"use strict";

		var re = new RE2(/яблоки/gi);
		var result = re.replace("Яблоки красны, яблоки сочны.", "апельсины");
		eval(t.TEST("result === 'апельсины красны, апельсины сочны.'"));

		re = new RE2(/иван/i);
		result = re.replace("Могуч Иван Иванов...", "Сидор");
		eval(t.TEST("result === 'Могуч Сидор Иванов...'"));

		re = new RE2(/иван/ig);
		result = re.replace("Могуч Иван Иванов...", "Сидор");
		eval(t.TEST("result === 'Могуч Сидор Сидоров...'"));

		re = new RE2(/([а-яё]+)\s+([а-яё]+)/i);
		result = re.replace("Пётр Петров", "$2, $1");
		eval(t.TEST("result === 'Петров, Пётр'"));
	},
	function test_replaceFunUnicode(t) {
		"use strict";

		function replacer(match, offset, string) {
			t.test(typeof offset == "number");
			t.test(typeof string == "string");
			t.test(offset === 0 || offset === 7);
			t.test(string === "ИВАН и пЁтр");
			return match.charAt(0).toUpperCase() + match.substr(1).toLowerCase();
		}

		var re = new RE2(/(?:иван|пётр|сидор)/ig);
		var result = re.replace("ИВАН и пЁтр", replacer);
		eval(t.TEST("result === 'Иван и Пётр'"));
	},

	// Buffer tests

	function test_replaceStrBuffer(t) {
		"use strict";

		var re = new RE2(/яблоки/gi);
		var result = re.replace(new Buffer("Яблоки красны, яблоки сочны."), "апельсины");
		eval(t.TEST("result instanceof Buffer"));
		eval(t.TEST("result.toString() === 'апельсины красны, апельсины сочны.'"));

		result = re.replace(new Buffer("Яблоки красны, яблоки сочны."), new Buffer("апельсины"));
		eval(t.TEST("result instanceof Buffer"));
		eval(t.TEST("result.toString() === 'апельсины красны, апельсины сочны.'"));

		result = re.replace("Яблоки красны, яблоки сочны.", new Buffer("апельсины"));
		eval(t.TEST("typeof result == 'string'"));
		eval(t.TEST("result === 'апельсины красны, апельсины сочны.'"));
	},
	function test_replaceFunBuffer(t) {
		"use strict";

		function replacer(match, offset, string) {
			eval(t.TEST("match instanceof Buffer"));
			eval(t.TEST("typeof offset == 'number'"));
			eval(t.TEST("typeof string == 'string'"));
			eval(t.TEST("offset === 0 || offset === 12"));
			eval(t.TEST("string === 'ИВАН и пЁтр'"));
			var s = match.toString();
			return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
		}
		replacer.useBuffers = true;

		var re = new RE2(/(?:иван|пётр|сидор)/ig);
		var result = re.replace("ИВАН и пЁтр", replacer);
		eval(t.TEST("typeof result == 'string'"));
		eval(t.TEST("result === 'Иван и Пётр'"));
	},

	// Sticky tests

	function test_replaceSticky(t) {
		"use strict";

		var re = new RE2(/[A-E]/y);

		eval(t.TEST("re.replace('ABCDEFABCDEF', '!') === '!BCDEFABCDEF'"));
		eval(t.TEST("re.replace('ABCDEFABCDEF', '!') === 'A!CDEFABCDEF'"));
		eval(t.TEST("re.replace('ABCDEFABCDEF', '!') === 'AB!DEFABCDEF'"));
		eval(t.TEST("re.replace('ABCDEFABCDEF', '!') === 'ABC!EFABCDEF'"));
		eval(t.TEST("re.replace('ABCDEFABCDEF', '!') === 'ABCD!FABCDEF'"));
		eval(t.TEST("re.replace('ABCDEFABCDEF', '!') === 'ABCDEFABCDEF'"));
		eval(t.TEST("re.replace('ABCDEFABCDEF', '!') === '!BCDEFABCDEF'"));

		var re2 = new RE2(/[A-E]/gy);

		eval(t.TEST("re2.replace('ABCDEFABCDEF', '!') === '!!!!!FABCDEF'"));
		eval(t.TEST("re2.replace('FABCDEFABCDE', '!') === 'FABCDEFABCDE'"));

		re2.lastIndex = 3;

		eval(t.TEST("re2.replace('ABCDEFABCDEF', '!') === '!!!!!FABCDEF'"));
		eval(t.TEST("re2.lastIndex === 0"));
	}
]);
