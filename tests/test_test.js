"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [

	// These tests are copied from MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test

	function test_testFromExec(t) {
		"use strict";

		var re = new RE2("quick\\s(brown).+?(jumps)", "i");

		eval(t.TEST("re.test('The Quick Brown Fox Jumps Over The Lazy Dog')"));
		eval(t.TEST("re.test('tHE qUICK bROWN fOX jUMPS oVER tHE lAZY dOG')"));
		eval(t.TEST("re.test('the quick brown fox jumps over the lazy dog')"));
		eval(t.TEST("re.test('THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG')"));
		eval(t.TEST("!re.test('THE KWIK BROWN FOX JUMPS OVER THE LAZY DOG')"));

		re = new RE2("ab*", "g");

		eval(t.TEST("re.test('abbcdefabh')"));
		eval(t.TEST("!re.test('qwerty')"));

		re = new RE2("(hello \\S+)");

		eval(t.TEST("re.test('This is a hello world!')"));
		eval(t.TEST("!re.test('This is a Hello world!')"));
	},
	function test_testSucc(t) {
		"use strict";

		var str = "abbcdefabh";

		var re = new RE2("ab*", "g");
		var result = re.test(str);

		eval(t.TEST("result"));
		eval(t.TEST("re.lastIndex === 3"));

		result = re.test(str);

		eval(t.TEST("result"));
		eval(t.TEST("re.lastIndex === 9"));

		result = re.test(str);

		eval(t.TEST("!result"));
	},
	function test_testSimple(t) {
		"use strict";

		var str = "abbcdefabh";

		var re1 = new RE2("ab*", "g");

		eval(t.TEST("re1.test(str)"));

		var re2 = new RE2("ab*");

		eval(t.TEST("re2.test(str)"));

		var re3 = new RE2("abc");

		eval(t.TEST("!re3.test(str)"));
	},
	function test_testAnchoredToBeginning(t) {
		"use strict";

		var re = RE2('^hello', 'g');

		eval(t.TEST("re.test('hellohello')"));
		eval(t.TEST("!re.test('hellohello')"));
	},
	function test_testInvalid(t) {
		"use strict";

		var re = RE2('');

		try {
			re.test({ toString() { throw "corner"; } });
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e === 'corner'"));
		}
	},
	function test_testAnchor1(t) {
		"use strict";

		var re = new RE2("b|^a", "g");

		var result = re.test("aabc");
		eval(t.TEST("result"));
		eval(t.TEST("re.lastIndex === 1"));

		result = re.test("aabc");
		eval(t.TEST("result"));
		eval(t.TEST("re.lastIndex === 3"));

		result = re.test("aabc");
		eval(t.TEST("!result"));
	},
	function test_testAnchor2(t) {
		"use strict";

		var re = new RE2("(?:^a)", "g");

		var result = re.test("aabc");
		eval(t.TEST("result"));
		eval(t.TEST("re.lastIndex === 1"));

		result = re.test("aabc");
		eval(t.TEST("!result"));
	},

	// Unicode tests

	function test_testUnicode(t) {
		"use strict";

		var re = new RE2("охотник\\s(желает).+?(где)", "i");

		eval(t.TEST("re.test('Каждый Охотник Желает Знать Где Сидит Фазан')"));
		eval(t.TEST("re.test('кАЖДЫЙ оХОТНИК жЕЛАЕТ зНАТЬ гДЕ сИДИТ фАЗАН')"));
		eval(t.TEST("re.test('каждый охотник желает знать где сидит фазан')"));
		eval(t.TEST("re.test('КАЖДЫЙ ОХОТНИК ЖЕЛАЕТ ЗНАТЬ ГДЕ СИДИТ ФАЗАН')"));
		eval(t.TEST("!re.test('Кажный Стрелок Хочет Найти Иде Прячется Птица')"));

		re = new RE2("аб*", "g");

		eval(t.TEST("re.test('аббвгдеабё')"));
		eval(t.TEST("!re.test('йцукен')"));

		re = new RE2("(привет \\S+)");

		eval(t.TEST("re.test('Это просто привет всем.')"));
		eval(t.TEST("!re.test('Это просто Привет всем.')"));
	},
	function test_testUnicodeSubsequent(t) {
		"use strict";

		var str = "аббвгдеабё";

		var re = new RE2("аб*", "g");
		var result = re.test(str);

		eval(t.TEST("result"));
		eval(t.TEST("re.lastIndex === 3"));

		result = re.test(str);

		eval(t.TEST("result"));
		eval(t.TEST("re.lastIndex === 9"));

		result = re.test(str);

		eval(t.TEST("!result"));
	},

	// Buffer tests

	function test_testBuffer(t) {
		"use strict";

		var re = new RE2("охотник\\s(желает).+?(где)", "i");

		eval(t.TEST("re.test(new Buffer('Каждый Охотник Желает Знать Где Сидит Фазан'))"));
		eval(t.TEST("re.test(new Buffer('кАЖДЫЙ оХОТНИК жЕЛАЕТ зНАТЬ гДЕ сИДИТ фАЗАН'))"));
		eval(t.TEST("re.test(new Buffer('каждый охотник желает знать где сидит фазан'))"));
		eval(t.TEST("re.test(new Buffer('КАЖДЫЙ ОХОТНИК ЖЕЛАЕТ ЗНАТЬ ГДЕ СИДИТ ФАЗАН'))"));
		eval(t.TEST("!re.test(new Buffer('Кажный Стрелок Хочет Найти Иде Прячется Птица'))"));

		re = new RE2("аб*", "g");

		eval(t.TEST("re.test(new Buffer('аббвгдеабё'))"));
		eval(t.TEST("!re.test(new Buffer('йцукен'))"));

		re = new RE2("(привет \\S+)");

		eval(t.TEST("re.test(new Buffer('Это просто привет всем.'))"));
		eval(t.TEST("!re.test(new Buffer('Это просто Привет всем.'))"));
	},

	// Sticky tests

	function test_testSticky(t) {
		"use strict";

		var re = new RE2("\\s+", "y");

		eval(t.TEST("!re.test('Hello world, how are you?')"));

		re.lastIndex = 5;

		eval(t.TEST("re.test('Hello world, how are you?')"));
		eval(t.TEST("re.lastIndex === 6"));

		var re2 = new RE2("\\s+", "gy");

		eval(t.TEST("!re2.test('Hello world, how are you?')"));

		re2.lastIndex = 5;

		eval(t.TEST("re2.test('Hello world, how are you?')"));
		eval(t.TEST("re2.lastIndex === 6"));
	}
]);
