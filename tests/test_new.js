"use strict";

const unit = require("heya-unit");
const RE2 = require("../re2");

// tests

unit.add(module, [
	function test_newUnicodeWarnOnce(t) {
		"use strict";

		let errorMessage = null;

		const consoleError = console.error;
		console.error = msg => (errorMessage = msg);
		RE2.unicodeWarningLevel = "warnOnce";

		let a = new RE2(".*");
		eval(t.TEST("errorMessage"));
		errorMessage = null;

		a = new RE2(".?");
		eval(t.TEST("errorMessage === null"));

		RE2.unicodeWarningLevel = "warnOnce";
		a = new RE2(".+");
		eval(t.TEST("errorMessage"));

		RE2.unicodeWarningLevel = "nothing";
		console.error = consoleError;
	},
	function test_newUnicodeWarn(t) {
		"use strict";

		let errorMessage = null;

		const consoleError = console.error;
		console.error = msg => (errorMessage = msg);
		RE2.unicodeWarningLevel = "warn";

		let a = new RE2(".*");
		eval(t.TEST("errorMessage"));
		errorMessage = null;

		a = new RE2(".?");
		eval(t.TEST("errorMessage"));

		RE2.unicodeWarningLevel = "nothing";
		console.error = consoleError;
	},
	function test_newUnicodeWarn(t) {
		"use strict";

		RE2.unicodeWarningLevel = "throw";

		try {
			let a = new RE2(".");
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e instanceof SyntaxError"));
		}

		RE2.unicodeWarningLevel = "nothing";
	}
]);
