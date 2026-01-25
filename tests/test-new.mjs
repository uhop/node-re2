import test from 'tape-six';
import {default as RE2} from '../re2.js';

// tests
// these tests modify the global state of RE2 and cannot be run in parallel with other tests in the same process

test('test new unicode warnOnce', t => {
  let errorMessage = '';

  const oldConsole = console;
  console = {error: msg => (errorMessage = msg)};
  RE2.unicodeWarningLevel = 'warnOnce';

  let a = new RE2('.*');
  t.ok(errorMessage);
  errorMessage = '';

  a = new RE2('.?');
  t.notOk(errorMessage);

  RE2.unicodeWarningLevel = 'warnOnce';
  a = new RE2('.+');
  t.ok(errorMessage);

  RE2.unicodeWarningLevel = 'nothing';
  console = oldConsole;
});

test('test new unicode warn', t => {
  let errorMessage = '';

  const oldConsole = console;
  console = {error: msg => (errorMessage = msg)};
  RE2.unicodeWarningLevel = 'warn';

  let a = new RE2('.*');
  t.ok(errorMessage);
  errorMessage = '';

  a = new RE2('.?');
  t.ok(errorMessage);

  RE2.unicodeWarningLevel = 'nothing';
  console = oldConsole;
});

test('test new unicode throw', t => {
  RE2.unicodeWarningLevel = 'throw';

  try {
    let a = new RE2('.');
    t.fail(); // shouldn't be here
  } catch (e) {
    t.ok(e instanceof SyntaxError);
  }

  RE2.unicodeWarningLevel = 'nothing';
});
