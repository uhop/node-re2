import test from 'tape-six';
import {default as RE2} from '../re2.js';

// utilities

const compare = (re1, re2, t) => {
  // compares regular expression objects
  t.equal(re1.source, re2.source);
  t.equal(re1.global, re2.global);
  t.equal(re1.ignoreCase, re2.ignoreCase);
  t.equal(re1.multiline, re2.multiline);
  // (t.equal(re1.unicode, re2.unicode));
  t.equal(re1.sticky, re2.sticky);
};

// tests

test('general ctr', t => {
  t.ok(!!RE2);
  t.ok(!!RE2.prototype);
  t.equal(RE2.toString(), 'function RE2() { [native code] }');
});

test('general inst', t => {
  let re1 = new RE2('\\d+');

  t.ok(!!re1);
  t.ok(re1 instanceof RE2);

  let re2 = RE2('\\d+');

  t.ok(!!re2);
  t.ok(re2 instanceof RE2);
  compare(re1, re2, t);

  re1 = new RE2('\\d+', 'm');

  t.ok(!!re1);
  t.ok(re1 instanceof RE2);

  re2 = RE2('\\d+', 'm');

  t.ok(!!re2);
  t.ok(re2 instanceof RE2);
  compare(re1, re2, t);
});

test('general inst errors', t => {
  try {
    const re = new RE2([]);
    t.fail(); // shouldn't be here
  } catch (e) {
    t.ok(e instanceof TypeError);
  }

  try {
    const re = new RE2({});
    t.fail(); // shouldn't be here
  } catch (e) {
    t.ok(e instanceof TypeError);
  }

  try {
    const re = new RE2(new Date());
    t.fail(); // shouldn't be here
  } catch (e) {
    t.ok(e instanceof TypeError);
  }

  try {
    const re = new RE2(null);
    t.fail(); // shouldn't be here
  } catch (e) {
    t.ok(e instanceof TypeError);
  }

  try {
    const re = new RE2();
    t.fail(); // shouldn't be here
  } catch (e) {
    t.ok(e instanceof TypeError);
  }

  try {
    const re = RE2();
    t.fail(); // shouldn't be here
  } catch (e) {
    t.ok(e instanceof TypeError);
  }

  try {
    const re = RE2({
      toString() {
        throw 'corner';
      }
    });
    t.fail(); // shouldn't be here
  } catch (e) {
    t.ok(e instanceof TypeError);
  }
});

test('general in', t => {
  const re = new RE2('\\d+');

  t.ok('exec' in re);
  t.ok('test' in re);
  t.ok('match' in re);
  t.ok('replace' in re);
  t.ok('search' in re);
  t.ok('split' in re);
  t.ok('source' in re);
  t.ok('flags' in re);
  t.ok('global' in re);
  t.ok('ignoreCase' in re);
  t.ok('multiline' in re);
  t.ok('dotAll' in re);
  t.ok('sticky' in re);
  t.ok('lastIndex' in re);
});

test('general present', t => {
  const re = new RE2('\\d+');

  t.equal(typeof re.exec, 'function');
  t.equal(typeof re.test, 'function');
  t.equal(typeof re.match, 'function');
  t.equal(typeof re.replace, 'function');
  t.equal(typeof re.search, 'function');
  t.equal(typeof re.split, 'function');
  t.equal(typeof re.source, 'string');
  t.equal(typeof re.flags, 'string');
  t.equal(typeof re.global, 'boolean');
  t.equal(typeof re.ignoreCase, 'boolean');
  t.equal(typeof re.multiline, 'boolean');
  t.equal(typeof re.dotAll, 'boolean');
  t.equal(typeof re.sticky, 'boolean');
  t.equal(typeof re.lastIndex, 'number');
});

test('general lastIndex', t => {
  const re = new RE2('\\d+');

  t.equal(re.lastIndex, 0);

  re.lastIndex = 5;
  t.equal(re.lastIndex, 5);

  re.lastIndex = 0;
  t.equal(re.lastIndex, 0);
});

test('general RegExp', t => {
  let re1 = new RegExp('\\d+');
  let re2 = new RE2('\\d+');

  compare(re1, re2, t);

  re2 = new RE2(re1);

  compare(re1, re2, t);

  re1 = new RegExp('a', 'ig');
  re2 = new RE2('a', 'ig');

  compare(re1, re2, t);

  re2 = new RE2(re1);

  compare(re1, re2, t);

  re1 = /\s/gm;
  re2 = new RE2('\\s', 'mg');

  compare(re1, re2, t);

  re2 = new RE2(re1);

  compare(re1, re2, t);

  re2 = new RE2(/\s/gm);

  compare(/\s/gm, re2, t);

  re1 = new RE2('b', 'gm');
  re2 = new RE2(re1);

  compare(re1, re2, t);

  re1 = new RE2('b', 'sgm');
  re2 = new RE2(re1);

  compare(re1, re2, t);

  re2 = new RE2(/\s/gms);

  compare(/\s/gms, re2, t);
});

test('general utf8', t => {
  const s = 'Привет!';

  t.equal(s.length, 7);
  t.equal(RE2.getUtf8Length(s), 13);

  const b = new Buffer.from(s);
  t.equal(b.length, 13);
  t.equal(RE2.getUtf16Length(b), 7);

  const s2 = '\u{1F603}';

  t.equal(s2.length, 2);
  t.equal(RE2.getUtf8Length(s2), 4);

  const b2 = new Buffer.from(s2);

  t.equal(b2.length, 4);
  t.equal(RE2.getUtf16Length(b2), 2);

  const s3 = '\uD83D';

  t.equal(s3.length, 1);
  t.equal(RE2.getUtf8Length(s3), 3);

  const s4 = '🤡';

  t.equal(s4.length, 2);
  t.equal(RE2.getUtf8Length(s4), 4);
  t.equal(RE2.getUtf16Length(Buffer.from(s4, 'utf8')), s4.length);

  const b3 = new Buffer.from([0xf0]);

  t.equal(b3.length, 1);
  t.equal(RE2.getUtf16Length(b3), 2);

  try {
    RE2.getUtf8Length({
      toString() {
        throw 'corner';
      }
    });
    t.fail(); // shouldn't be here
  } catch (e) {
    t.equal(e, 'corner');
  }

  t.equal(
    RE2.getUtf16Length({
      toString() {
        throw 'corner';
      }
    }),
    -1
  );
});

test('general flags', t => {
  let re = new RE2('a', 'u');
  t.equal(re.flags, 'u');

  re = new RE2('a', 'iu');
  t.equal(re.flags, 'iu');

  re = new RE2('a', 'mu');
  t.equal(re.flags, 'mu');

  re = new RE2('a', 'gu');
  t.equal(re.flags, 'gu');

  re = new RE2('a', 'yu');
  t.equal(re.flags, 'uy');

  re = new RE2('a', 'yiu');
  t.equal(re.flags, 'iuy');

  re = new RE2('a', 'yigu');
  t.equal(re.flags, 'giuy');

  re = new RE2('a', 'miu');
  t.equal(re.flags, 'imu');

  re = new RE2('a', 'ygu');
  t.equal(re.flags, 'guy');

  re = new RE2('a', 'myu');
  t.equal(re.flags, 'muy');

  re = new RE2('a', 'migyu');
  t.equal(re.flags, 'gimuy');

  re = new RE2('a', 'smigyu');
  t.equal(re.flags, 'gimsuy');
});

test('general flags 2nd', t => {
  let re = new RE2(/a/, 'u');
  t.equal(re.flags, 'u');

  re = new RE2(/a/gm, 'iu');
  t.equal(re.flags, 'iu');

  re = new RE2(/a/gi, 'mu');
  t.equal(re.flags, 'mu');

  re = new RE2(/a/g, 'gu');
  t.equal(re.flags, 'gu');

  re = new RE2(/a/m, 'yu');
  t.equal(re.flags, 'uy');

  re = new RE2(/a/, 'yiu');
  t.equal(re.flags, 'iuy');

  re = new RE2(/a/gim, 'yigu');
  t.equal(re.flags, 'giuy');

  re = new RE2(/a/gm, 'miu');
  t.equal(re.flags, 'imu');

  re = new RE2(/a/i, 'ygu');
  t.equal(re.flags, 'guy');

  re = new RE2(/a/g, 'myu');
  t.equal(re.flags, 'muy');

  re = new RE2(/a/, 'migyu');
  t.equal(re.flags, 'gimuy');

  re = new RE2(/a/s, 'smigyu');
  t.equal(re.flags, 'gimsuy');
});
