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
	},
	function test_searchInvalid(t) {
		"use strict";

		var re = RE2('');

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

		var re = new RE2(/\d+/i);
		var result = re.search(str);
		eval(t.TEST("result === 6"));

		re = new RE2("\\s[а-я]+");
		result = re.search(str);
		eval(t.TEST("result === 8"));

		re = new RE2("[а-яА-Я]+");
		result = re.search(str);
		eval(t.TEST("result === 0"));

		re = new RE2("z", "gm");
		result = re.search(str);
		eval(t.TEST("result === -1"));
	},
	function test_searchBuffer(t) {
		"use strict";

		var buf = new Buffer("Всего 42 штуки.");

		var re = new RE2(/\d+/i);
		var result = re.search(buf);
		eval(t.TEST("result === 11"));

		re = new RE2("\\s[а-я]+");
		result = re.search(buf);
		eval(t.TEST("result === 13"));

		re = new RE2("[а-яА-Я]+");
		result = re.search(buf);
		eval(t.TEST("result === 0"));

		re = new RE2("z", "gm");
		result = re.search(buf);
		eval(t.TEST("result === -1"));
	},
	function test_searchSticky(t) {
		"use strict";

		var str = "Total is 42 units.";

		var re = new RE2(/\d+/y);
		var result = re.search(str);
		eval(t.TEST("result === -1"));

		re = new RE2("\\b[a-z]+\\b", "y");
		result = re.search(str);
		eval(t.TEST("result === -1"));

		re = new RE2("\\b\\w+\\b", "y");
		result = re.search(str);
		eval(t.TEST("result === 0"));

		re = new RE2("z", "gmy");
		result = re.search(str);
		eval(t.TEST("result === -1"));
	}
]);
