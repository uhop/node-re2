import test from 'tape-six';
import {RE2} from '../re2.js';

// The ASCII fast path: when an input string is pure ASCII, byte offsets equal
// UTF-16 offsets, so the C++ side skips the UTF-8 -> UTF-16 scan. These tests
// pin the optimization as behavior-preserving:
//  - for ASCII strings, reported offsets must equal the equivalent Buffer's
//    byte offsets (the byte-native reference path);
//  - for non-ASCII strings, offsets must still be UTF-16 (conversion happens),
//    i.e. they must differ from the Buffer's byte offsets.

test('ascii fast path: exec offsets match buffer offsets (g, d)', t => {
  const s = 'ab 12 cd 345 ef';
  const b = Buffer.from(s);
  const reS = new RE2('(\\d+)', 'dg'),
    reB = new RE2('(\\d+)', 'dg');

  for (;;) {
    const rs = reS.exec(s),
      rb = reB.exec(b);
    if (rs === null) {
      t.equal(rb, null);
      break;
    }
    t.equal(rs.index, rb.index);
    t.equal(reS.lastIndex, reB.lastIndex);
    t.deepEqual(Array.from(rs.indices), Array.from(rb.indices));
  }
});

test('non-ascii: exec offsets are UTF-16, differ from buffer bytes', t => {
  // 'é' (U+00E9) is 1 UTF-16 unit but 2 UTF-8 bytes.
  const s = 'né 12';
  const rs = new RE2('(\\d+)', 'd').exec(s);
  const rb = new RE2('(\\d+)', 'd').exec(Buffer.from(s));

  t.equal(rs.index, 3); // n, é, space -> 3 UTF-16 units
  t.equal(rb.index, 4); // n(1) é(2) space(1) -> 4 bytes
  t.deepEqual(Array.from(rs.indices), [
    [3, 5],
    [3, 5]
  ]);
  t.deepEqual(Array.from(rb.indices), [
    [4, 6],
    [4, 6]
  ]);
});

test('non-ascii: global exec lastIndex stays UTF-16 across matches', t => {
  const re = new RE2('\\d', 'g');
  const s = 'é1é2'; // é at 0 and 2, digits at 1 and 3

  let r = re.exec(s);
  t.equal(r.index, 1);
  t.equal(re.lastIndex, 2);

  r = re.exec(s);
  t.equal(r.index, 3);
  t.equal(re.lastIndex, 4);

  t.equal(re.exec(s), null);
});

test('ascii fast path: match index matches buffer', t => {
  const s = 'xx99yy';
  t.equal(new RE2('(\\d+)').match(s).index, 2);
  t.equal(new RE2('(\\d+)').match(Buffer.from(s)).index, 2);
});

test('ascii fast path: search index matches buffer', t => {
  const s = 'abc12';
  t.equal(new RE2('\\d').search(s), 3);
  t.equal(new RE2('\\d').search(Buffer.from(s)), 3);
});

test('non-ascii: search index is UTF-16, differs from buffer', t => {
  t.equal(new RE2('\\d').search('é12'), 1);
  t.equal(new RE2('\\d').search(Buffer.from('é12')), 2);
});

test('ascii fast path: replace function receives UTF-16 offsets', t => {
  const offsets = [];
  const out = new RE2('\\d', 'g').replace('a1b2c3', (_m, off) => {
    offsets.push(off);
    return '#';
  });
  t.equal(out, 'a#b#c#');
  t.deepEqual(offsets, [1, 3, 5]);
});

test('non-ascii: replace function offset is UTF-16', t => {
  const offsets = [];
  const out = new RE2('\\d', 'g').replace('é1é2', (_m, off) => {
    offsets.push(off);
    return '#';
  });
  t.equal(out, 'é#é#');
  t.deepEqual(offsets, [1, 3]);
});

test('ascii fast path: sticky lastIndex advancement matches buffer', t => {
  const s = 'a b c';
  const reS = new RE2('\\S', 'y'),
    reB = new RE2('\\S', 'y');

  reS.lastIndex = reB.lastIndex = 2;
  const rs = reS.exec(s),
    rb = reB.exec(Buffer.from(s));

  t.equal(rs.index, rb.index);
  t.equal(reS.lastIndex, reB.lastIndex);
});
