"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [
	function test_noMemoryLimit(t) {
		"use strict";

		var re1 = new RE2("[0-9]+".repeat(1000));
		eval(t.TEST("!!re1"));
		eval(t.TEST("re1 instanceof RE2"));

		var re2 = new RE2("[0-9]+".repeat(1000), undefined, {});
		eval(t.TEST("!!re2"));
		eval(t.TEST("re2 instanceof RE2"));
	},
	function test_memoryLimit(t) {
		"use strict";

		var re1 = new RE2("[0-9]+".repeat(100), undefined,
					{max_mem: 2 << 10});
		eval(t.TEST("!!re1"));
		eval(t.TEST("re1 instanceof RE2"));

		try {
			var re2 = new RE2("[0-9]+".repeat(1000), undefined,
					{max_mem: 2 << 10});
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e instanceof SyntaxError"));
			eval(t.TEST("e.message.startsWith('pattern too large')"));
		}
	},
	function test_memoryLimitCapturing(t) {
		"use strict";

		var re1 = new RE2("(a)".repeat(50), undefined,
					{max_mem: 2 << 10, never_capture: true});
		eval(t.TEST("!!re1"));
		eval(t.TEST("re1 instanceof RE2"));

		try {
			var re2 = new RE2("(a)".repeat(50), undefined,
						{max_mem: 2 << 10,
						never_capture: false});
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e instanceof SyntaxError"));
			eval(t.TEST("e.message.startsWith('pattern too large')"));
		}

		try {
			var re3 = new RE2("(a)".repeat(50), undefined,
						{max_mem: 2 << 10});
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e instanceof SyntaxError"));
			eval(t.TEST("e.message.startsWith('pattern too large')"));
		}
	}
]);
