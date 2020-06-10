"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [
	function test_sourceIdentity(t) {
		"use strict";

		var re = new RE2("a\\cM\\u34\\u1234\\u10abcdz");
		eval(t.TEST("re.source === 'a\\\\cM\\\\u34\\\\u1234\\\\u10abcdz'"));

		re = new RE2("a\\cM\\u34\\u1234\\u{10abcd}z");
		eval(t.TEST("re.source === 'a\\\\cM\\\\u34\\\\u1234\\\\u{10abcd}z'"));

		re = new RE2("");
		eval(t.TEST("re.source === '(?:)'"));

		re = new RE2("foo/bar");
		eval(t.TEST("re.source === 'foo\\\\/bar'"));

		re = new RE2("foo\\/bar");
		eval(t.TEST("re.source === 'foo\\\\/bar'"));

		re = new RE2("(?<foo>bar)", "u");
		eval(t.TEST("re.source === '(?<foo>bar)'"));
	},
	function test_sourceTranslation(t) {
		"use strict";

		var re = new RE2("a\\cM\\u34\\u1234\\u10abcdz");
		eval(t.TEST("re.internalSource === 'a\\\\x0D\\\\x{34}\\\\x{1234}\\\\x{10ab}cdz'"));

		re = new RE2("a\\cM\\u34\\u1234\\u{10abcd}z");
		eval(t.TEST("re.internalSource === 'a\\\\x0D\\\\x{34}\\\\x{1234}\\\\x{10abcd}z'"));

		re = new RE2("");
		eval(t.TEST("re.internalSource === '(?:)'"));

		re = new RE2("foo/bar");
		eval(t.TEST("re.internalSource === 'foo\\\\/bar'"));

		re = new RE2("foo\\/bar");
		eval(t.TEST("re.internalSource === 'foo\\\\/bar'"));

		re = new RE2("(?<foo>bar)", "u");
		eval(t.TEST("re.internalSource === '(?P<foo>bar)'"));

		re = new RE2("foo\\/bar", "m");
		eval(t.TEST("re.internalSource === '(?m)foo\\\\/bar'"));
	},
	function test_sourceBackSlashes(t) {
		"use strict";

		function compare(source, expected) {
			var s = new RE2(source).source;
			eval(t.TEST("s === expected"));
		}

		compare("a/b",        "a\\/b");
		compare("a\/b",       "a\\/b");
		compare("a\\/b",      "a\\/b");
		compare("a\\\/b",     "a\\/b");
		compare("a\\\\/b",    "a\\\\\\/b");
		compare("a\\\\\/b",   "a\\\\\\/b");

		compare("/a/b",       "\\/a\\/b");
		compare("\\/a/b",     "\\/a\\/b");
		compare("\\/a\\/b",   "\\/a\\/b");
		compare("\\/a\\\\/b", "\\/a\\\\\\/b");
	}
]);
