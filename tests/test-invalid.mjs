import test from 'tape-six';
import {default as RE2} from '../re2.js';

// tests

test('invalid', t => {
  let threw;

  // Backreferences
  threw = false;
  try {
    new RE2(/(a)\1/);
  } catch (e) {
    threw = true;
    t.ok(e instanceof SyntaxError);
    t.equal(e.message, 'invalid escape sequence: \\1');
  }
  t.ok(threw);

  // Lookahead assertions

  // Positive
  threw = false;
  try {
    new RE2(/a(?=b)/);
  } catch (e) {
    threw = true;
    t.ok(e instanceof SyntaxError);
    t.equal(e.message, 'invalid perl operator: (?=');
  }
  t.ok(threw);

  // Negative
  threw = false;
  try {
    new RE2(/a(?!b)/);
  } catch (e) {
    threw = true;
    t.ok(e instanceof SyntaxError);
    t.equal(e.message, 'invalid perl operator: (?!');
  }
  t.ok(threw);
});
