"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [

	// These tests are copied from MDN:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split

	function test_split(t) {
		"use strict";

		var re = new RE2(/\s+/);
		var result = re.split("Oh brave new world that has such people in it.");
		eval(t.TEST("t.unify(result, ['Oh', 'brave', 'new', 'world', 'that', 'has', 'such', 'people', 'in', 'it.'])"));

		re = new RE2(",");
		result = re.split("Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec");
		eval(t.TEST("t.unify(result, ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])"));

		re = new RE2(",");
		result = re.split(",Jan,Feb,Mar,Apr,May,Jun,,Jul,Aug,Sep,Oct,Nov,Dec,");
		eval(t.TEST("t.unify(result, ['','Jan','Feb','Mar','Apr','May','Jun','','Jul','Aug','Sep','Oct','Nov','Dec',''])"));

		re = new RE2(/\s*;\s*/);
		result = re.split("Harry Trump ;Fred Barney; Helen Rigby ; Bill Abel ;Chris Hand ");
		eval(t.TEST("t.unify(result, ['Harry Trump', 'Fred Barney', 'Helen Rigby', 'Bill Abel', 'Chris Hand '])"));

		re = new RE2(/\s+/);
		result = re.split("Hello World. How are you doing?", 3);
		eval(t.TEST("t.unify(result, ['Hello', 'World.', 'How'])"));

		re = new RE2(/(\d)/);
		result = re.split("Hello 1 word. Sentence number 2.");
		eval(t.TEST("t.unify(result, ['Hello ', '1', ' word. Sentence number ', '2', '.'])"));

		eval(t.TEST("RE2(/[x-z]*/).split('asdfghjkl').reverse().join('') === 'lkjhgfdsa'"));
	},
	function test_splitInvalid(t) {
		"use strict";

		var re = RE2('');

		try {
			re.split({ toString() { throw "corner"; } });
			t.test(false); // shouldn't be here
		} catch(e) {
			eval(t.TEST("e === 'corner'"));
		}
	},

	function test_cornerCases(t) {
		"use strict";

		var re = new RE2(/1/);
		var result = re.split("23456");
		eval(t.TEST("t.unify(result, ['23456'])"));
	},

	// Unicode tests

	function test_splitUnicode(t) {
		"use strict";

		var re = new RE2(/\s+/);
		var result = re.split("Она не понимает, что этим убивает меня.");
		eval(t.TEST("t.unify(result, ['Она', 'не', 'понимает,', 'что', 'этим', 'убивает', 'меня.'])"));

		re = new RE2(",");
		result = re.split("Пн,Вт,Ср,Чт,Пт,Сб,Вс");
		eval(t.TEST("t.unify(result, ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'])"));

		re = new RE2(/\s*;\s*/);
		result = re.split("Ваня Иванов ;Петро Петренко; Саша Машин ; Маша Сашина");
		eval(t.TEST("t.unify(result, ['Ваня Иванов', 'Петро Петренко', 'Саша Машин', 'Маша Сашина'])"));

		re = new RE2(/\s+/);
		result = re.split("Привет мир. Как дела?", 3);
		eval(t.TEST("t.unify(result, ['Привет', 'мир.', 'Как'])"));

		re = new RE2(/(\d)/);
		result = re.split("Привет 1 слово. Предложение номер 2.");
		eval(t.TEST("t.unify(result, ['Привет ', '1', ' слово. Предложение номер ', '2', '.'])"));

		eval(t.TEST("RE2(/[э-я]*/).split('фывапролд').reverse().join('') === 'длорпавыф'"));
	},

	// Buffer tests

	function test_splitBuffer(t) {
		"use strict";

		var re = new RE2(/\s+/);
		var result = re.split(new Buffer("Она не понимает, что этим убивает меня."));
		eval(t.TEST("t.unify(verifyBuffer(result, t), ['Она', 'не', 'понимает,', 'что', 'этим', 'убивает', 'меня.'])"));

		re = new RE2(",");
		result = re.split(new Buffer("Пн,Вт,Ср,Чт,Пт,Сб,Вс"));
		eval(t.TEST("t.unify(verifyBuffer(result, t), ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'])"));

		re = new RE2(/\s*;\s*/);
		result = re.split(new Buffer("Ваня Иванов ;Петро Петренко; Саша Машин ; Маша Сашина"));
		eval(t.TEST("t.unify(verifyBuffer(result, t), ['Ваня Иванов', 'Петро Петренко', 'Саша Машин', 'Маша Сашина'])"));

		re = new RE2(/\s+/);
		result = re.split(new Buffer("Привет мир. Как дела?"), 3);
		eval(t.TEST("t.unify(verifyBuffer(result, t), ['Привет', 'мир.', 'Как'])"));

		re = new RE2(/(\d)/);
		result = re.split(new Buffer("Привет 1 слово. Предложение номер 2."));
		eval(t.TEST("t.unify(verifyBuffer(result, t), ['Привет ', '1', ' слово. Предложение номер ', '2', '.'])"));

		eval(t.TEST("RE2(/[э-я]*/).split(new Buffer('фывапролд')).map(function(x) { return x.toString(); }).reverse().join('') === 'длорпавыф'"));
	},

	// Sticky tests

	function test_splitSticky(t) {
		"use strict";

		var re = new RE2(/\s+/y); // sticky is ignored

		var result = re.split("Oh brave new world that has such people in it.");
		eval(t.TEST("t.unify(result, ['Oh', 'brave', 'new', 'world', 'that', 'has', 'such', 'people', 'in', 'it.'])"));

		var result2 = re.split(" Oh brave new world that has such people in it.");
		eval(t.TEST("t.unify(result2, ['', 'Oh', 'brave', 'new', 'world', 'that', 'has', 'such', 'people', 'in', 'it.'])"));
	}
]);


function verifyBuffer(buf, t) {
	return buf.map(function(x) {
				t.test(x instanceof Buffer);
				return x.toString();
			});
}
