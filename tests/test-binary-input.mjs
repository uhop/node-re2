import test from 'tape-six';
import {RE2} from '../re2.js';

const enc = new TextEncoder();

test('binary input: exec accepts every binary type', t => {
  const u8 = enc.encode('abcd');
  const inputs = [
    ['Buffer', Buffer.from('abcd')],
    ['Uint8Array', u8],
    ['DataView', new DataView(u8.buffer.slice(0))],
    ['ArrayBuffer', u8.buffer.slice(0)]
  ];
  for (const [name, value] of inputs) {
    const re = new RE2('b(c)', 'g');
    const m = re.exec(value);
    t.ok(m, name + ' matches');
    t.ok(Buffer.isBuffer(m[0]), name + ' match is a Buffer');
    t.ok(Buffer.isBuffer(m[1]), name + ' group is a Buffer');
    t.equal(m[0].toString(), 'bc', name + ' match bytes');
    t.equal(m[1].toString(), 'c', name + ' group bytes');
    t.equal(m.index, 1, name + ' byte index');
    t.equal(m.input, value, name + ' input echoed verbatim');
    t.equal(re.lastIndex, 3, name + ' lastIndex in bytes');
  }
});

test('binary input: SharedArrayBuffer is matched as bytes', t => {
  const sab = new SharedArrayBuffer(4);
  new Uint8Array(sab).set(enc.encode('abcd'));
  t.ok(new RE2('abcd').test(sab));
  t.ok(new RE2('b').test(new Uint8Array(sab)));
  t.notOk(new RE2('object Shared').test(sab));
});

test('binary input: ArrayBuffer is no longer stringified', t => {
  t.notOk(new RE2('object').test(new ArrayBuffer(4)));
  t.notOk(new RE2('object').test(new SharedArrayBuffer(4)));
});

test('binary input: views with a byte offset', t => {
  const u8 = enc.encode('xxabc');
  const sub = u8.subarray(2);
  let m = new RE2('b').exec(sub);
  t.equal(m.index, 1, 'subarray index is relative to the view');
  m = new RE2('b').exec(new DataView(u8.buffer, 2, 3));
  t.equal(m.index, 1, 'DataView index is relative to the view');
});

test('binary input: non-ASCII byte offsets', t => {
  const u8 = enc.encode('тест');
  const m = new RE2('ес').exec(u8);
  t.equal(m.index, 2, 'index counts UTF-8 bytes');
  t.equal(m[0].length, 4, 'match length in bytes');
});

test('binary input: any TypedArray is raw bytes', t => {
  t.ok(new RE2('\\x00{8}').test(new Float64Array(1)));
  t.notOk(new RE2('0').test(new Float64Array(1)));
});

test('binary input: match, search, split, matchAll counterparts', t => {
  const u8 = enc.encode('a,b,c');
  t.equal(new RE2('c[^,]*').search(u8.buffer.slice(0)), 4);
  const parts = new RE2(',').split(new DataView(u8.buffer.slice(0)));
  t.deepEqual(
    parts.map(p => p.toString()),
    ['a', 'b', 'c']
  );
  t.ok(parts.every(p => Buffer.isBuffer(p)));
  const m = new RE2('(\\w)', 'g').match(u8);
  t.deepEqual(
    Array.from(m, p => p.toString()),
    ['a', 'b', 'c']
  );
});

test('binary input: replace', t => {
  const u8 = enc.encode('abc');
  let r = new RE2('b').replace(u8, 'X');
  t.ok(Buffer.isBuffer(r), 'binary subject produces a Buffer');
  t.equal(r.toString(), 'aXc');
  r = new RE2('b').replace(u8.buffer.slice(0), enc.encode('YZ'));
  t.equal(r.toString(), 'aYZc', 'replacement template as a view');
  r = new RE2('b').replace('abc', enc.encode('W'));
  t.equal(r, 'aWc', 'string subject with a binary template stays a string');
  r = new RE2('b').replace(u8, () => enc.encode('V'));
  t.equal(r.toString(), 'aVc', 'replacer function returning a view');
});

test('binary input: patterns and flags', t => {
  t.ok(new RE2(enc.encode('b(c)')).test('abc'), 'Uint8Array pattern');
  t.ok(
    new RE2(enc.encode('bc').buffer.slice(0)).test('abc'),
    'ArrayBuffer pattern'
  );
  t.ok(
    new RE2(new DataView(enc.encode('bc').buffer.slice(0))).test('abc'),
    'DataView pattern'
  );
  const re = new RE2('b', enc.encode('gi'));
  t.ok(re.global && re.ignoreCase, 'flags as a view');
  t.ok(
    new RE2(Buffer.alloc(0)).test('x'),
    'empty Buffer pattern acts as an empty pattern'
  );
  t.ok(
    new RE2(new ArrayBuffer(0)).test('x'),
    'empty ArrayBuffer pattern acts as an empty pattern'
  );
});

test('binary input: detached ArrayBuffer reads as empty', t => {
  const ab = enc.encode('abc').buffer.slice(0);
  structuredClone(ab, {transfer: [ab]});
  t.notOk(new RE2('a').test(ab));
  t.ok(new RE2('').test(ab));
});

test('binary input: RE2.Set', t => {
  const set = new RE2.Set([enc.encode('b'), 'x']);
  t.deepEqual(set.match(enc.encode('abc').buffer.slice(0)), [0]);
  t.ok(set.test(new DataView(enc.encode('xyz').buffer.slice(0))));
});

test('binary input: truncated lead at a view boundary stays inside the view', t => {
  // underlying bytes: 'a' + full 2-byte 'б' (0xd0 0xb1); the view cuts the char in half,
  // so the byte past the view exists in the backing store and must not leak (GHSA-j4r3)
  const u8 = enc.encode('aб');
  const view = u8.subarray(0, 2);
  const r = new RE2('a').replace(view, 'X');
  t.deepEqual(Array.from(r), [0x58, 0xd0]);
  const parts = new RE2('a').split(view);
  t.deepEqual(Array.from(parts[1]), [0xd0]);
});

test('binary input: getUtf16Length', t => {
  const u8 = enc.encode('тест');
  t.equal(RE2.getUtf16Length(u8), 4);
  t.equal(RE2.getUtf16Length(new DataView(u8.buffer.slice(0))), 4);
  t.equal(RE2.getUtf16Length(u8.buffer.slice(0)), 4);
  t.equal(RE2.getUtf16Length('not binary'), -1);
});
