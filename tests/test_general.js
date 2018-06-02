"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


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

		var re1 = new RE2("\\d+");

		eval(t.TEST("!!re1"));
		eval(t.TEST("re1 instanceof RE2"));

		var re2 = RE2("\\d+");

		eval(t.TEST("!!re2"));
		eval(t.TEST("re2 instanceof RE2"));
		compare(re1, re2, t);

		re1 = new RE2("\\d+", "m");

		eval(t.TEST("!!re1"));
		eval(t.TEST("re1 instanceof RE2"));

		re2 = RE2("\\d+", "m");

		eval(t.TEST("!!re2"));
		eval(t.TEST("re2 instanceof RE2"));
		compare(re1, re2, t);
	},
	function test_instErrors(t) {
		try {
			var re = new RE2([]);
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e instanceof TypeError"));
		}

		try {
			var re = new RE2({});
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e instanceof TypeError"));
		}

		try {
			var re = new RE2(new Date());
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e instanceof TypeError"));
		}

		try {
			var re = new RE2(null);
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e instanceof TypeError"));
		}

		try {
			var re = new RE2();
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e instanceof TypeError"));
		}

		try {
			var re = RE2();
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e instanceof TypeError"));
		}

		try {
			var re = RE2({ toString() { throw "corner"; } });
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e instanceof TypeError"));
		}
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
		eval(t.TEST("'flags' in re"));
		eval(t.TEST("'global' in re"));
		eval(t.TEST("'ignoreCase' in re"));
		eval(t.TEST("'multiline' in re"));
		eval(t.TEST("'sticky' in re"));
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
		eval(t.TEST("typeof re.flags == 'string'"));
		eval(t.TEST("typeof re.global == 'boolean'"));
		eval(t.TEST("typeof re.ignoreCase == 'boolean'"));
		eval(t.TEST("typeof re.multiline == 'boolean'"));
		eval(t.TEST("typeof re.sticky == 'boolean'"));
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
	},
	function test_generalRegExp(t) {
		"use strict";

		var re1 = new RegExp("\\d+");
		var re2 = new RE2("\\d+");

		compare(re1, re2, t);

		re2 = new RE2(re1);

		compare(re1, re2, t);

		re1 = new RegExp("a", "ig");
		re2 = new RE2("a", "ig");

		compare(re1, re2, t);

		re2 = new RE2(re1);

		compare(re1, re2, t);

		re1 = /\s/gm;
		re2 = new RE2("\\s", "mg");

		compare(re1, re2, t);

		re2 = new RE2(re1);

		compare(re1, re2, t);

		re2 = new RE2(/\s/gm);

		compare(/\s/gm, re2, t);

		re1 = new RE2("b", "gm");
		re2 = new RE2(re1);

		compare(re1, re2, t);
	},
	function test_utf8(t) {
		"use strict";

		var s = "Привет!";

		eval(t.TEST("s.length === 7"));
		eval(t.TEST("RE2.getUtf8Length(s) === 13"));

		var b = new Buffer(s);
		eval(t.TEST("b.length === 13"));
		eval(t.TEST("RE2.getUtf16Length(b) === 7"));

		var s2 = "\u{1F603}";

		eval(t.TEST("s2.length === 2"));
		eval(t.TEST("RE2.getUtf8Length(s2) === 4"));

		var b2 = new Buffer(s2);

		eval(t.TEST("b2.length === 4"));
		eval(t.TEST("RE2.getUtf16Length(b2) === 2"));

		var s3 = "\uD83D";

		eval(t.TEST("s3.length === 1"));
		eval(t.TEST("RE2.getUtf8Length(s3) === 3"));

		var b3 = new Buffer([0xF0]);

		eval(t.TEST("b3.length === 1"));
		eval(t.TEST("RE2.getUtf16Length(b3) === 2"));

		try {
			RE2.getUtf8Length({ toString() { throw "corner"; } });
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e === 'corner'"));
		}

		eval(t.TEST("RE2.getUtf16Length({ toString() { throw 'corner'; } }) === -1"));
	},
	function test_flags(t) {
		"use strict";

		var re = new RE2("a", "u");
		eval(t.TEST("re.flags === 'u'"));

		re = new RE2("a", "iu");
		eval(t.TEST("re.flags === 'iu'"));

		re = new RE2("a", "mu");
		eval(t.TEST("re.flags === 'mu'"));

		re = new RE2("a", "gu");
		eval(t.TEST("re.flags === 'gu'"));

		re = new RE2("a", "yu");
		eval(t.TEST("re.flags === 'uy'"));

		re = new RE2("a", "yiu");
		eval(t.TEST("re.flags === 'iuy'"));

		re = new RE2("a", "yigu");
		eval(t.TEST("re.flags === 'giuy'"));

		re = new RE2("a", "miu");
		eval(t.TEST("re.flags === 'imu'"));

		re = new RE2("a", "ygu");
		eval(t.TEST("re.flags === 'guy'"));

		re = new RE2("a", "myu");
		eval(t.TEST("re.flags === 'muy'"));

		re = new RE2("a", "migyu");
		eval(t.TEST("re.flags === 'gimuy'"));
	}
]);


// utilitites

function compare(re1, re2, t) {
	// compares regular expression objects
	eval(t.TEST("re1.source === re2.source"));
	eval(t.TEST("re1.global === re2.global"));
	eval(t.TEST("re1.ignoreCase === re2.ignoreCase"));
	eval(t.TEST("re1.multiline  === re2.multiline"));
	// eval(t.TEST("re1.unicode    === re2.unicode"));
	eval(t.TEST("re1.sticky     === re2.sticky"));
}
