"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [
	function test_toString(t) {
		"use strict";

		eval(t.TEST("RE2('').toString() === '/(?:)/u'"));
		eval(t.TEST("RE2('a').toString() === '/a/u'"));
		eval(t.TEST("RE2('b', 'i').toString() === '/b/iu'"));
		eval(t.TEST("RE2('c', 'g').toString() === '/c/gu'"));
		eval(t.TEST("RE2('d', 'm').toString() === '/d/mu'"));
		eval(t.TEST("RE2('\\\\d+', 'gi') + '' === '/\\\\d+/giu'"));
		eval(t.TEST("RE2('\\\\s*', 'gm') + '' === '/\\\\s*/gmu'"));
		eval(t.TEST("RE2('\\\\S{1,3}', 'ig') + '' === '/\\\\S{1,3}/giu'"));
		eval(t.TEST("RE2('\\\\D{,2}', 'mig') + '' === '/\\\\D{,2}/gimu'"));
		eval(t.TEST("RE2('^a{2,}', 'mi') + '' === '/^a{2,}/imu'"));
		eval(t.TEST("RE2('^a{5}$', 'gim') + '' === '/^a{5}$/gimu'"));
		eval(t.TEST("RE2('\\\\u{1F603}/', 'iy') + '' === '/\\\\u{1F603}\\\\//iuy'"));

		eval(t.TEST("RE2('c', 'ug').toString() === '/c/gu'"));
		eval(t.TEST("RE2('d', 'um').toString() === '/d/mu'"));
	}
]);
