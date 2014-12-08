"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [
	function test_toString(t) {
		"use strict";

		eval(t.TEST("RE2('a').toString() === '/a/'"));
		eval(t.TEST("RE2('b', 'i').toString() === '/b/i'"));
		eval(t.TEST("RE2('c', 'g').toString() === '/c/g'"));
		eval(t.TEST("RE2('d', 'm').toString() === '/d/m'"));
		eval(t.TEST("RE2('\\\\d+', 'gi') + '' === '/\\\\d+/ig'"));
		eval(t.TEST("RE2('\\\\s*', 'gm') + '' === '/\\\\s*/gm'"));
		eval(t.TEST("RE2('\\\\S{1,3}', 'ig') + '' === '/\\\\S{1,3}/ig'"));
		eval(t.TEST("RE2('\\\\D{,2}', 'mig') + '' === '/\\\\D{,2}/igm'"));
		eval(t.TEST("RE2('^a{2,}', 'mi') + '' === '/^a{2,}/im'"));
		eval(t.TEST("RE2('^a{5}$', 'gim') + '' === '/^a{5}$/igm'"));
	}
]);
