"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [
	function test_split(t) {
		"use strict";

		var re = new RE2(/\s+/);
		var result = re.split("Oh brave new world that has such people in it.");
		eval(t.TEST("t.unify(result, ['Oh', 'brave', 'new', 'world', 'that', 'has', 'such', 'people', 'in', 'it.'])"));

		re = new RE2(",");
		result = re.split("Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec");
		eval(t.TEST("t.unify(result, ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])"));

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
	}
]);
