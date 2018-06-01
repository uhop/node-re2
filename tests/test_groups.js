"use strict";


var unit = require("heya-unit");
var RE2  = require("../re2");


// tests

unit.add(module, [
	function test_groupsNormal(t) {
		"use strict";

		eval(t.TEST("RE2('(?<a>\\\\d)').test('9')"));
		eval(t.TEST("t.unify(RE2('(?<a>-)', 'g').match('a-b-c'), ['-', '-'])"));
		eval(t.TEST("t.unify(RE2('(?<a>-)').split('a-b-c'), ['a', '-', 'b', '-', 'c'])"));
		eval(t.TEST("RE2('(?<a>-)', 'g').search('a-b-c') === 1"));
	},
	function test_groupsExec(t) {
		"use strict";

		var result = new RE2('(\\d)').exec('k9');
		eval(t.TEST("result"));
		eval(t.TEST("result[0] === '9'"));
		eval(t.TEST("result[1] === '9'"));
		eval(t.TEST("result.index === 1"));
		eval(t.TEST("result.input === 'k9'"));
		eval(t.TEST("typeof result.groups == 'undefined'"));

		result = new RE2('(?<a>\\d)').exec('k9');
		eval(t.TEST("result"));
		eval(t.TEST("result[0] === '9'"));
		eval(t.TEST("result[1] === '9'"));
		eval(t.TEST("result.index === 1"));
		eval(t.TEST("result.input === 'k9'"));
		eval(t.TEST("t.unify(result.groups, {a: '9'})"));
	},
	function test_groupsMatch(t) {
		"use strict";

		var result = new RE2('(\\d)').match('k9');
		eval(t.TEST("result"));
		eval(t.TEST("result[0] === '9'"));
		eval(t.TEST("result[1] === '9'"));
		eval(t.TEST("result.index === 1"));
		eval(t.TEST("result.input === 'k9'"));
		eval(t.TEST("typeof result.groups == 'undefined'"));

		result = new RE2('(?<a>\\d)').match('k9');
		eval(t.TEST("result"));
		eval(t.TEST("result[0] === '9'"));
		eval(t.TEST("result[1] === '9'"));
		eval(t.TEST("result.index === 1"));
		eval(t.TEST("result.input === 'k9'"));
		eval(t.TEST("t.unify(result.groups, {a: '9'})"));
	},
	function test_groupsMatch(t) {
		"use strict";

		eval(t.TEST("RE2('(?<w>\\\\w)(?<d>\\\\d)', 'g').replace('a1b2c', '$2$1') === '1a2bc'"));
		eval(t.TEST("RE2('(?<w>\\\\w)(?<d>\\\\d)', 'g').replace('a1b2c', '$<d>$<w>') === '1a2bc'"));

		eval(t.TEST("RE2('(?<w>\\\\w)(?<d>\\\\d)', 'g').replace('a1b2c', replacerByNumbers) === '1a2bc'"));
		eval(t.TEST("RE2('(?<w>\\\\w)(?<d>\\\\d)', 'g').replace('a1b2c', replacerByNames) === '1a2bc'"));

		function replacerByNumbers(match, group1, group2, index, source, groups) {
			return group2 + group1;
		}
		function replacerByNames(match, group1, group2, index, source, groups) {
			return groups.d + groups.w;
		}
	},
	function test_groupsInvalid(t) {
		"use strict";

		try {
			RE2('(?<>.)');
			t.test(false); // shouldn'be here
		} catch(e) {
			eval(t.TEST("e instanceof SyntaxError"));
		}

		// TODO: do we need to enforce the correct id?
		// try {
		// 	RE2('(?<1>.)');
		// 	t.test(false); // shouldn'be here
		// } catch(e) {
		// 	eval(t.TEST("e instanceof SyntaxError"));
		// }

		try {
			RE2('(?<a>.)(?<a>.)');
			t.test(false); // shouldn'be here
		} catch(e) {
			eval(t.TEST("e instanceof SyntaxError"));
		}
	}
]);
