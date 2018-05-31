"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [
	function test_search(t) {
		"use strict";

		var str = "Total is 42 units.";

		var re = new RE2(/\d+/iu);
		var result = re.search(str);
		eval(t.TEST("result === 9"));

		re = new RE2("\\b[a-z]+\\b", "u");
		result = re.search(str);
		eval(t.TEST("result === 6"));

		re = new RE2("\\b\\w+\\b", "u");
		result = re.search(str);
		eval(t.TEST("result === 0"));

		re = new RE2("z", "gmu");
		result = re.search(str);
		eval(t.TEST("result === -1"));
	},
	function test_searchInvalid(t) {
		"use strict";

		var re = RE2('', "u");

		try {
			re.search({ toString() { throw "corner"; } });
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e === 'corner'"));
		}
	},
	function test_searchUnicode(t) {
		"use strict";

		var str = "Всего 42 штуки.";

		var re = new RE2(/\d+/iu);
		var result = re.search(str);
		eval(t.TEST("result === 6"));

		re = new RE2("\\s[а-я]+", "u");
		result = re.search(str);
		eval(t.TEST("result === 8"));

		re = new RE2("[а-яА-Я]+", "u");
		result = re.search(str);
		eval(t.TEST("result === 0"));

		re = new RE2("z", "gmu");
		result = re.search(str);
		eval(t.TEST("result === -1"));
	},
	function test_searchBuffer(t) {
		"use strict";

		var buf = new Buffer("Всего 42 штуки.");

		var re = new RE2(/\d+/iu);
		var result = re.search(buf);
		eval(t.TEST("result === 11"));

		re = new RE2("\\s[а-я]+", "u");
		result = re.search(buf);
		eval(t.TEST("result === 13"));

		re = new RE2("[а-яА-Я]+", "u");
		result = re.search(buf);
		eval(t.TEST("result === 0"));

		re = new RE2("z", "gmu");
		result = re.search(buf);
		eval(t.TEST("result === -1"));
	},
	function test_searchSticky(t) {
		"use strict";

		var str = "Total is 42 units.";

		var re = new RE2(/\d+/yu);
		var result = re.search(str);
		eval(t.TEST("result === -1"));

		re = new RE2("\\b[a-z]+\\b", "yu");
		result = re.search(str);
		eval(t.TEST("result === -1"));

		re = new RE2("\\b\\w+\\b", "yu");
		result = re.search(str);
		eval(t.TEST("result === 0"));

		re = new RE2("z", "gmyu");
		result = re.search(str);
		eval(t.TEST("result === -1"));
	}
]);
