import test from 'tape-six';
import {default as RE2} from '../re2.js';

// tests

test('groups normal', t => {
  t.equal(RE2('(?<a>\\d)').test('9'), true);
  t.deepEqual(RE2('(?<a>-)', 'g').match('a-b-c'), ['-', '-']);
  t.deepEqual(RE2('(?<a>-)').split('a-b-c'), ['a', '-', 'b', '-', 'c']);
  t.equal(RE2('(?<a>-)', 'g').search('a-b-c'), 1);
});

test('groups exec', t => {
  let result = new RE2('(\\d)').exec('k9');
  t.ok(result);
  t.equal(result[0], '9');
  t.equal(result[1], '9');
  t.equal(result.index, 1);
  t.equal(result.input, 'k9');
  t.equal(typeof result.groups, 'undefined');

  result = new RE2('(?<a>\\d)').exec('k9');
  t.ok(result);
  t.equal(result[0], '9');
  t.equal(result[1], '9');
  t.equal(result.index, 1);
  t.equal(result.input, 'k9');
  t.deepEqual(result.groups, {a: '9'});
});

test('groups match', t => {
  let result = new RE2('(\\d)').match('k9');
  t.ok(result);
  t.equal(result[0], '9');
  t.equal(result[1], '9');
  t.equal(result.index, 1);
  t.equal(result.input, 'k9');
  t.equal(typeof result.groups, 'undefined');

  result = new RE2('(?<a>\\d)').match('k9');
  t.ok(result);
  t.equal(result[0], '9');
  t.equal(result[1], '9');
  t.equal(result.index, 1);
  t.equal(result.input, 'k9');
  t.deepEqual(result.groups, {a: '9'});
});

test('groups match', t => {
  t.equal(RE2('(?<w>\\w)(?<d>\\d)', 'g').replace('a1b2c', '$2$1'), '1a2bc');
  t.equal(RE2('(?<w>\\w)(?<d>\\d)', 'g').replace('a1b2c', '$<d>$<w>'), '1a2bc');

  t.equal(
    RE2('(?<w>\\w)(?<d>\\d)', 'g').replace('a1b2c', replacerByNumbers),
    '1a2bc'
  );
  t.equal(
    RE2('(?<w>\\w)(?<d>\\d)', 'g').replace('a1b2c', replacerByNames),
    '1a2bc'
  );

  function replacerByNumbers(match, group1, group2, index, source, groups) {
    return group2 + group1;
  }
  function replacerByNames(match, group1, group2, index, source, groups) {
    return groups.d + groups.w;
  }
});

test('groups invalid', t => {
  try {
    RE2('(?<>.)');
    t.fail(); // shouldn'be here
  } catch (e) {
    t.ok(e instanceof SyntaxError);
  }

  // TODO: do we need to enforce the correct id?
  // try {
  // 	RE2('(?<1>.)');
  // 	t.fail(); // shouldn'be here
  // } catch(e) {
  // 	eval(t.TEST("e instanceof SyntaxError"));
  // }

  try {
    RE2('(?<a>.)(?<a>.)');
    t.fail(); // shouldn'be here
  } catch (e) {
    t.ok(e instanceof SyntaxError);
  }
});
