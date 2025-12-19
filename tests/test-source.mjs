import test from 'tape-six';
import {default as RE2} from '../re2.js';

// tests

test('test source identity', t => {
  let re = new RE2('a\\cM\\u34\\u1234\\u10abcdz');
  t.equal(re.source, 'a\\cM\\u34\\u1234\\u10abcdz');

  re = new RE2('a\\cM\\u34\\u1234\\u{10abcd}z');
  t.equal(re.source, 'a\\cM\\u34\\u1234\\u{10abcd}z');

  re = new RE2('');
  t.equal(re.source, '(?:)');

  re = new RE2('foo/bar');
  t.equal(re.source, 'foo\\/bar');

  re = new RE2('foo\\/bar');
  t.equal(re.source, 'foo\\/bar');

  re = new RE2('(?<foo>bar)', 'u');
  t.equal(re.source, '(?<foo>bar)');
});

test('test source translation', t => {
  let re = new RE2('a\\cM\\u34\\u1234\\u10abcdz');
  t.equal(re.internalSource, 'a\\x0D\\x{34}\\x{1234}\\x{10ab}cdz');

  re = new RE2('a\\cM\\u34\\u1234\\u{10abcd}z');
  t.equal(re.internalSource, 'a\\x0D\\x{34}\\x{1234}\\x{10abcd}z');

  re = new RE2('');
  t.equal(re.internalSource, '(?:)');

  re = new RE2('foo/bar');
  t.equal(re.internalSource, 'foo\\/bar');

  re = new RE2('foo\\/bar');
  t.equal(re.internalSource, 'foo\\/bar');

  re = new RE2('(?<foo>bar)', 'u');
  t.equal(re.internalSource, '(?P<foo>bar)');

  re = new RE2('foo\\/bar', 'm');
  t.equal(re.internalSource, '(?m)foo\\/bar');
});

test('test source backslashes', t => {
  const compare = (source, expected) => {
    const s = new RE2(source).source;
    t.equal(s, expected);
  };

  compare('a/b', 'a\\/b');
  compare('a\/b', 'a\\/b');
  compare('a\\/b', 'a\\/b');
  compare('a\\\/b', 'a\\/b');
  compare('a\\\\/b', 'a\\\\\\/b');
  compare('a\\\\\/b', 'a\\\\\\/b');

  compare('/a/b', '\\/a\\/b');
  compare('\\/a/b', '\\/a\\/b');
  compare('\\/a\\/b', '\\/a\\/b');
  compare('\\/a\\\\/b', '\\/a\\\\\\/b');
});
