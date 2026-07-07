import test from 'tape-six';
import {RE2} from '../../re2.js';

// Heavy manual regression for GHSA-8hcv-x26h-mcgp: allocates a >536 MB result
// (past V8's String::kMaxLength) to reach the over-length path, so it lives here
// out of the default `npm test` suite. Verifies re2 throws a catchable RangeError
// like the built-in engine instead of an uncatchable abort() (SIGABRT).
test('replace over-max-length result throws instead of aborting', t => {
  const re = new RE2('a', 'g');
  const input = 'a'.repeat(50000);
  t.throws(() => re.replace(input, "$'"), RangeError, "trailing-context $' throws RangeError");
  t.throws(() => re.replace(input, '$`'), RangeError, 'leading-context $` throws RangeError');
  t.equal(re.replace('aaa', 'X'), 'XXX', 'sub-threshold replace still works');
});
