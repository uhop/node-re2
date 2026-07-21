import test from 'tape-six';
import {RE2} from '../re2.js';

// Buffer input is passed to C++ verbatim (only strings are re-encoded), so a
// multi-byte lead byte at the very end promises continuation bytes the buffer
// does not hold. Every assertion here is exact-length: the bug appended bytes
// read past the end, so a leak shows up as output longer than the input allows.
// Issue #272.

const hex = buf => [...buf].map(b => b.toString(16).padStart(2, '0')).join(' ');

// lead byte -> continuation bytes it promises
const truncated = [
  ['2-byte lead', 0xc2],
  ['3-byte lead', 0xe2],
  ['4-byte lead', 0xf0]
];

test('replace: truncated trailing lead byte does not over-read', t => {
  for (const [name, lead] of truncated) {
    const input = Buffer.from([0x41, lead]);
    const result = new RE2('', 'g').replace(input, '');
    t.equal(result.length, input.length, `${name}: length preserved`);
    t.equal(hex(result), hex(input), `${name}: bytes preserved`);
  }
});

test('replace with callback: truncated trailing lead byte does not over-read', t => {
  for (const [name, lead] of truncated) {
    const input = Buffer.from([0x41, lead]);
    const result = new RE2('', 'g').replace(input, () => '');
    t.equal(result.length, input.length, `${name}: length preserved`);
    t.equal(hex(result), hex(input), `${name}: bytes preserved`);
  }
});

test('replace: truncated lead byte in the replacement does not over-read', t => {
  for (const [name, lead] of truncated) {
    const replacement = Buffer.from([0x42, lead]);
    const result = new RE2('A', 'g').replace(Buffer.from('A'), replacement);
    t.equal(result.length, replacement.length, `${name}: length preserved`);
    t.equal(hex(result), hex(replacement), `${name}: bytes preserved`);
  }
});

test('split: truncated trailing lead byte does not over-read', t => {
  for (const [name, lead] of truncated) {
    const input = Buffer.from([0x41, lead]);
    const pieces = new RE2('', 'g').split(input);
    const total = pieces.reduce((n, piece) => n + piece.length, 0);
    t.equal(total, input.length, `${name}: total length preserved`);
    t.equal(hex(Buffer.concat(pieces)), hex(input), `${name}: bytes preserved`);
  }
});

test('partially truncated 4-byte sequence does not over-read', t => {
  // 0xF0 promises 3 continuations; supply only 1 and 2.
  for (const tail of [
    [0xf0, 0x9f],
    [0xf0, 0x9f, 0x98]
  ]) {
    const input = Buffer.from([0x41, ...tail]);
    const result = new RE2('', 'g').replace(input, '');
    t.equal(hex(result), hex(input), `${tail.length} of 3 continuations`);
  }
});

test('well-formed trailing multi-byte characters still round-trip', t => {
  // The clamp must not truncate sequences that are actually complete.
  for (const char of ['é', '€', '😀']) {
    const input = Buffer.from('A' + char);
    t.equal(hex(new RE2('', 'g').replace(input, '')), hex(input), char);
    t.equal(
      hex(Buffer.concat(new RE2('', 'g').split(input))),
      hex(input),
      `${char} (split)`
    );
  }
});

test('truncated lead byte in a pattern Buffer is rejected, not read past', t => {
  // RE2 rejects the malformed pattern, so the over-read this covers is not
  // observable from JS -- the assertion is that it stays a clean SyntaxError
  // rather than a crash. Only a sanitizer build proves the read itself.
  for (const [name, lead] of truncated) {
    let threw = false;
    try {
      new RE2(Buffer.from([lead]));
    } catch (e) {
      threw = true;
      t.ok(e instanceof SyntaxError, `${name}: SyntaxError`);
    }
    t.ok(threw, `${name}: threw`);
  }
});
