"use strict";


var unit = require("heya-unit");
var RE2  = require("../build/Release/re2.node");


// tests

unit.add(module, [
	function test_generalCtr(t) {
		"use strict";
		eval(t.TEST("!!RE2"));
		eval(t.TEST("RE2.toString() === 'function RE2() { [native code] }'"));
		eval(t.TEST("!!RE2.prototype"));
	},
	function test_generalInst(t) {
		"use strict";
		var re = new RE2("\\d+");
		eval(t.TEST("!!re"));
		eval(t.TEST("re instanceof RE2"));
	},
	function test_generalIn(t) {
		"use strict";
		var re = new RE2("\\d+");
		eval(t.TEST("'exec' in re"));
		eval(t.TEST("'test' in re"));
		eval(t.TEST("'match' in re"));
		eval(t.TEST("'replace' in re"));
		eval(t.TEST("'search' in re"));
		eval(t.TEST("'split' in re"));
		eval(t.TEST("'source' in re"));
		eval(t.TEST("'global' in re"));
		eval(t.TEST("'ignoreCase' in re"));
		eval(t.TEST("'multiline' in re"));
		eval(t.TEST("'lastIndex' in re"));
	},
	function test_generalPresent(t) {
		"use strict";
		var re = new RE2("\\d+");
		eval(t.TEST("typeof re.exec == 'function'"));
		eval(t.TEST("typeof re.test == 'function'"));
		eval(t.TEST("typeof re.match == 'function'"));
		eval(t.TEST("typeof re.replace == 'function'"));
		eval(t.TEST("typeof re.search == 'function'"));
		eval(t.TEST("typeof re.split == 'function'"));
		eval(t.TEST("typeof re.source == 'string'"));
		eval(t.TEST("typeof re.global == 'boolean'"));
		eval(t.TEST("typeof re.ignoreCase == 'boolean'"));
		eval(t.TEST("typeof re.multiline == 'boolean'"));
		eval(t.TEST("typeof re.lastIndex == 'number'"));
	},
	function test_generalLastIndex(t) {
		"use strict";
		var re = new RE2("\\d+");
		eval(t.TEST("re.lastIndex === 0"));
		re.lastIndex = 5;
		eval(t.TEST("re.lastIndex === 5"));
		re.lastIndex = 0;
		eval(t.TEST("re.lastIndex === 0"));
	}
]);
