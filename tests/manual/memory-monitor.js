'use strict';

const RE2 = require('../../re2');

const N = 5_000_000;

console.log('Never-ending loop: exit with Ctrl+C.');

const aCharCode = 'a'.charCodeAt(0);
const randomAlpha = () => String.fromCharCode(aCharCode + Math.floor(Math.random() * 26));

const humanizeNumber = n => {
	const negative = n < 0;
	if (negative) n = -n;

	const s = n.toFixed();
	let group1 = s.length % 3;
	if (!group1) group1 = 3;

	let result = s.substring(0, group1);
	for (let i = group1; i < s.length; i += 3) {
		result += ',' + s.substring(i, i + 3);
	}

	return (negative ? '-' : '') + result;
};

const CSI = '\x1B[';
const cursorUp = (n = 1) => CSI + (n > 1 ? n.toFixed() : '') + 'A';
const sgr = (cmd = '') => CSI + (Array.isArray(cmd) ? cmd.join(';') : cmd) + 'm';
const RESET = sgr();
const NOTE = sgr(91);

let first = true;
const maxMemory = {heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0, rss: 0},
	labels = {
		heapTotal: 'heap total',
		heapUsed: 'heap used',
		external: 'external',
		arrayBuffers: 'array buffers',
		rss: 'resident set size'
	},
	maxLabelSize = Math.max(...Array.from(Object.values(labels)).map(label => label.length));

const report = () => {
	const memoryUsage = process.memoryUsage(),
		previousMax = {...maxMemory};

	console.log((first ? '' : '\r' + cursorUp(6)) +
	            ''.padStart(maxLabelSize + 1), 'Current'.padStart(15), 'Max'.padStart(15));
  for (const name in maxMemory) {
  	const prefix = previousMax[name] && previousMax[name] < memoryUsage[name] ? NOTE : RESET;
  	console.log(
  		(labels[name] + ':').padStart(maxLabelSize + 1),
  		prefix + humanizeNumber(memoryUsage[name]).padStart(15) + RESET,
  		humanizeNumber(maxMemory[name]).padStart(15)
  	);
  }

	for (const [name, value] of Object.entries(maxMemory)) {
		maxMemory[name] = Math.max(value, memoryUsage[name]);
	}

	first = false;
}

for (;;) {
	const re2 = new RE2(randomAlpha(), 'g');

	let s = '';
	for (let i = 0; i < N; ++i) s += randomAlpha();

	let n = 0;
	for (const _ of s.matchAll(re2)) ++n;

	re2.lastIndex = 0;
	const r = s.replace(re2, '');
	if (r.length + n != s.length) {
		console.log('ERROR!', 's:', s.length, 'r:', r.length, 'n:', n, 're2:', re2.toString());
		break;
	}

	report();
}
