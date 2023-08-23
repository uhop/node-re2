# node-re2 [![NPM version][npm-img]][npm-url]

[npm-img]: https://img.shields.io/npm/v/re2.svg
[npm-url]: https://npmjs.org/package/re2

This project provides bindings for [RE2](https://github.com/google/re2):
fast, safe alternative to backtracking regular expression engines written by [Russ Cox](http://swtch.com/~rsc/).
To learn more about RE2, start with an overview
[Regular Expression Matching in the Wild](http://swtch.com/~rsc/regexp/regexp3.html). More resources can be found
at his [Implementing Regular Expressions](http://swtch.com/~rsc/regexp/) page.

`RE2`'s regular expression language is almost a superset of what is provided by `RegExp`
(see [Syntax](https://github.com/google/re2/wiki/Syntax)),
but it lacks two features: backreferences and lookahead assertions. See below for more details.

`RE2` always works in the [Unicode mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicode), which means that all matches that use character codes are interpret as Unicode code points, not as binary values of UTF-16.
See `RE2.unicodeWarningLevel` below for more details.


`RE2` object emulates standard `RegExp` making it a practical drop-in replacement in most cases.
`RE2` is extended to provide `String`-based regular expression methods as well. To help to convert
`RegExp` objects to `RE2` its constructor can take `RegExp` directly honoring all properties.

It can work with [node.js buffers](http://nodejs.org/api/buffer.html) directly reducing overhead
on recoding and copying characters, and making processing/parsing long files fast.

All documentation can be found in this README and in the [wiki](https://github.com/uhop/node-re2/wiki).

## Why use node-re2?

The built-in Node.js regular expression engine can run in exponential time with a special combination:
 - A vulnerable regular expression
 - "Evil input"

This can lead to what is known as a [Regular Expression Denial of Service (ReDoS)](https://www.owasp.org/index.php/Regular_expression_Denial_of_Service_-_ReDoS).
To tell if your regular expressions are vulnerable, you might try the one of these projects:
 - [rxxr2](http://www.cs.bham.ac.uk/~hxt/research/rxxr2/)
 - [safe-regex](https://github.com/substack/safe-regex)

However, neither project is perfect.

node-re2 can protect your Node.js application from ReDoS.
node-re2 makes vulnerable regular expression patterns safe by evaluating them in `RE2` instead of the built-in Node.js regex engine.

## Standard features

`RE2` object can be created just like `RegExp`:

* [`new RE2(pattern[, flags])`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

Supported properties:

* [`re2.lastIndex`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex)
* [`re2.global`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/global)
* [`re2.ignoreCase`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/ignoreCase)
* [`re2.multiline`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/multiline)
* [`re2.dotAll`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/dotAll) &mdash; *since 1.17.6.*
* [`re2.unicode`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicode)
  * `RE2` engine always works in the Unicode mode. See details below.
* [`re2.sticky`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky) &mdash; *since 1.7.0.*
* [`re2.hasIndices`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/hasIndices) &mdash; *since 1.19.0.*
* [`re2.source`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/source)
* [`re2.flags`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/flags)

Supported methods:

* [`re2.exec(str)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
* [`re2.test(str)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test)
* [`re2.toString()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/toString)

Starting with 1.6.0 following well-known symbol-based methods are supported (see [Symbols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)):

* [`re2[Symbol.match](str)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/match)
* [`re2[Symbol.matchAll](str)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/matchAll) &mdash; *since 1.17.5.*
* [`re2[Symbol.search](str)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/search)
* [`re2[Symbol.replace](str, newSubStr|function)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/replace)
* [`re2[Symbol.split](str[, limit])`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/split)

It allows to use `RE2` instances on strings directly, just like `RegExp` instances:

```js
var re = new RE2("1");
"213".match(re);        // [ '1', index: 1, input: '213' ]
"213".search(re);       // 1
"213".replace(re, "+"); // 2+3
"213".split(re);        // [ '2', '3' ]

Array.from("2131".matchAll(re)); // returns a generator!
// [['1', index: 1, input: '2131'], ['1', index: 3, input: '2131']]
```

Starting with 1.8.0 [named groups](https://tc39.github.io/proposal-regexp-named-groups/) are supported.

## Extensions

### Shortcut construction

`RE2` object can be created from a regular expression:

```js
var re1 = new RE2(/ab*/ig); // from a RegExp object
var re2 = new RE2(re1);     // from another RE2 object
```

### `String` methods

Standard `String` defines four more methods that can use regular expressions. `RE2` provides them as methods
exchanging positions of a string, and a regular expression:

* `re2.match(str)`
  * See [`str.match(regexp)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match)
* `re2.replace(str, newSubStr|function)`
  * See [`str.replace(regexp, newSubStr|function)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace)
* `re2.search(str)`
  * See [`str.search(regexp)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/search)
* `re2.split(str[, limit])`
  * See [`str.split(regexp[, limit])`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split)

Starting with 1.6.0, these methods added as well-known symbol-based methods to be used transparently with ES6 string/regex machinery.

### `Buffer` support

In order to support `Buffer` directly, most methods can accept buffers instead of strings. It speeds up all operations.
Following signatures are supported:

* `re2.exec(buf)`
* `re2.test(buf)`
* `re2.match(buf)`
* `re2.search(buf)`
* `re2.split(buf[, limit])`
* `re2.replace(buf, replacer)`

Differences with their string-based versions:

* All buffers are assumed to be encoded as [UTF-8](http://en.wikipedia.org/wiki/UTF-8)
  (ASCII is a proper subset of UTF-8).
* Instead of strings they return `Buffer` objects, even in composite objects. A buffer can be converted to a string with
  [`buf.toString()`](http://nodejs.org/api/buffer.html#buffer_buf_tostring_encoding_start_end).
* All offsets and lengths are in bytes, rather than characters (each UTF-8 character can occupy from 1 to 4 bytes).
  This way users can properly slice buffers without costly recalculations from characters to bytes.

When `re2.replace()` is used with a replacer function, the replacer can return a buffer, or a string. But all arguments
(except for an input object) will be strings, and an offset will be in characters. If you prefer to deal
with buffers and byte offsets in a replacer function, set a property `useBuffers` to `true` on the function:

```js
function strReplacer(match, offset, input) {
	// typeof match == "string"
	return "<= " + offset + " characters|";
}

RE2("б").replace("абв", strReplacer);
// "а<= 1 characters|в"

function bufReplacer(match, offset, input) {
	// typeof match == "string"
	return "<= " + offset + " bytes|";
}
bufReplacer.useBuffers = true;

RE2("б").replace("абв", bufReplacer);
// "а<= 2 bytes|в"
```

This feature works for string and buffer inputs. If a buffer was used as an input, its output will be returned as
a buffer too, otherwise a string will be returned.

### Calculate length

Two functions to calculate string sizes between
[UTF-8](http://en.wikipedia.org/wiki/UTF-8) and
[UTF-16](http://en.wikipedia.org/wiki/UTF-16) are exposed on `RE2`:

* `RE2.getUtf8Length(str)` &mdash; calculates a buffer size in bytes to encode a UTF-16 string as
  a UTF-8 buffer.
* `RE2.getUtf16Length(buf)` &mdash; calculates a string size in characters to encode a UTF-8 buffer as
  a UTF-16 string.

JavaScript supports UCS-2 strings with 16-bit characters, while node.js 0.11 supports full UTF-16 as
a default string.

### Property: `internalSource`

Starting 1.8.0 property `source` emulates the same property of `RegExp`, meaning that it can be used to create an identical `RE2` or `RegExp` instance. Sometimes, for troubleshooting purposes, a user wants to inspect a `RE2` translated source. It is available as a read-only property called `internalSource`.

### Unicode warning level

`RE2` engine always works in the Unicode mode. In most cases either there is no difference or the Unicode mode is actually preferred. But sometimes a user wants a tight control over their regular expressions. For those cases, there is a static string property `RE2.unicodeWarningLevel`.

Regular expressions in the Unicode mode work as usual. But if a regular expression lacks the Unicode flag, it is always added silently.

```js
const x = /./;
x.flags; // ''
const y = new RE2(x);
y.flags; // 'u'
```

In the latter case `RE2` can do following actions depending on `RE2.unicodeWarningLevel`:

* `'nothing'` (the default): no warnings or notifications of any kind, a regular expression will be created with `'u'` flag.
* `'warnOnce'`: warns exactly once the very first time, a regular expression will be created with `'u'` flag.
  * Assigning this value resets an internal flag, so `RE2` will warn once again.
* `'warn'`: warns every time, a regular expression will be created with `'u'` flag.
* `'throw'`: throws a `SyntaxError` every time.
* All other warning level values are silently ignored on asignment leaving the previous value unchanged.

Warnings and exceptions help to audit an application for stray non-Unicode regular expressions.

## How to install

Installation:

```
npm install --save re2
```

While the project is known to work with other package managers, it is not guaranteed nor tested.
For example, [yarn](https://yarnpkg.com/) is known to fail in some scenarios
(see this [Wiki article](https://github.com/uhop/node-re2/wiki/Problem:-unusual-errors-with-yarn)).

### Precompiled artifacts

When installing re2 the [install script](https://github.com/uhop/install-artifact-from-github/blob/master/bin/install-from-cache.js) attempts to download a prebuilt artifact for your system from the Github releases. The download location can be overridden by setting the `RE2_DOWNLOAD_MIRROR` environment variable as seen in the install script.

If all attempts to download the prebuilt artifact for your system fails the script attempts to built re2 locally on your machine using [node-gyp](https://github.com/nodejs/node-gyp).

## How to use

It is used just like a `RegExp` object.

```js
var RE2 = require("re2");

// with default flags
var re = new RE2("a(b*)");
var result = re.exec("abbc");
console.log(result[0]); // "abb"
console.log(result[1]); // "bb"

result = re.exec("aBbC");
console.log(result[0]); // "a"
console.log(result[1]); // ""

// with explicit flags
re = new RE2("a(b*)", "i");
result = re.exec("aBbC");
console.log(result[0]); // "aBb"
console.log(result[1]); // "Bb"

// from regular expression object
var regexp = new RegExp("a(b*)", "i");
re = new RE2(regexp);
result = re.exec("aBbC");
console.log(result[0]); // "aBb"
console.log(result[1]); // "Bb"

// from regular expression literal
re = new RE2(/a(b*)/i);
result = re.exec("aBbC");
console.log(result[0]); // "aBb"
console.log(result[1]); // "Bb"

// from another RE2 object
var rex = new RE2(re);
result = rex.exec("aBbC");
console.log(result[0]); // "aBb"
console.log(result[1]); // "Bb"

// shortcut
result = new RE2("ab*").exec("abba");

// factory
result = RE2("ab*").exec("abba");
```

## Limitations (things RE2 does not support)

`RE2` consciously avoids any regular expression features that require worst-case exponential time to evaluate.
These features are essentially those that describe a Context-Free Language (CFL) rather than a Regular Expression,
and are extensions to the traditional regular expression language because some people don't know when enough is enough.

The most noteworthy missing features are backreferences and lookahead assertions.
If your application uses these features, you should continue to use `RegExp`.
But since these features are fundamentally vulnerable to
[ReDoS](https://www.owasp.org/index.php/Regular_expression_Denial_of_Service_-_ReDoS),
you should strongly consider replacing them.

`RE2` will throw a `SyntaxError` if you try to declare a regular expression using these features.
If you are evaluating an externally-provided regular expression, wrap your `RE2` declarations in a try-catch block. It allows to use `RegExp`, when `RE2` misses a feature:

```js
var re = /(a)+(b)*/;
try {
  re = new RE2(re);
  // use RE2 as a drop-in replacement
} catch (e) {
  // suppress an error, and use
  // the original RegExp
}
var result = re.exec(sample);
```

In addition to these missing features, `RE2` also behaves somewhat differently from the built-in regular expression engine in corner cases.

### Backreferences

`RE2` doesn't support backreferences, which are numbered references to previously
matched groups, like so: `\1`, `\2`, and so on. Example of backrefrences:

```js
/(cat|dog)\1/.test("catcat"); // true
/(cat|dog)\1/.test("dogdog"); // true
/(cat|dog)\1/.test("catdog"); // false
/(cat|dog)\1/.test("dogcat"); // false
```

### Lookahead assertions

`RE2` doesn't support lookahead assertions, which are ways to allow a matching dependent on subsequent contents.

```js
/abc(?=def)/; // match abc only if it is followed by def
/abc(?!def)/; // match abc only if it is not followed by def
```

### Mismatched behavior

`RE2` and the built-in regex engines disagree a bit. Before you switch to `RE2`, verify that your regular expressions continue to work as expected. They should do so in the vast majority of cases.

Here is an example of a case where they may not:

```js
var RE2  = require("../re2");

var pattern = '(?:(a)|(b)|(c))+';

var built_in = new RegExp(pattern);
var re2 = new RE2(pattern);

var input = 'abc';

var bi_res = built_in.exec(input);
var re2_res = re2.exec(input);

console.log('bi_res: ' + bi_res);    // prints: bi_res: abc,,,c
console.log('re2_res : ' + re2_res); // prints: re2_res : abc,a,b,c
```

### Unicode

`RE2` always works in the Unicode mode. See `RE2.unicodeWarningLevel` above for more details on how to control warnings about this feature.

## Release history

- 1.20.3 *Fix: subsequent numbers are incorporated into group if they would form a legal group reference. Thx, [Oleksii Vasyliev](https://github.com/le0pard).*
- 1.20.2 *Fix: added a missing C++ file, which caused a bug on Alpine Linux. Thx, [rbitanga-manticore](https://github.com/rbitanga-manticore).*
- 1.20.1 *Fix: files included in the npm package to build the C++ code.*
- 1.20.0 *Updated RE2. New version uses `abseil-cpp` and required the adaptation work. Thx, [Stefano Rivera](https://github.com/stefanor).*
- 1.19.2 *Bugfix: infinite loop in matchAll() with empty matches. Thx, [ziyunfei](https://github.com/ziyunfei).*
- 1.19.1 *Bugfix: indices for the `d` flag when `lastIndex` is non zero. Bugfix: the match result. Thx, [teebu](https://github.com/teebu).*
- 1.19.0 *Added `hasIndices` AKA the `d` flag. Thx, [teebu](https://github.com/teebu).*
- 1.18.3 *Fixed bug with non-matched groups. Thx, [Dan Setterquist](https://github.com/dset).*
- 1.18.2 *Reference to the binary module by its full name.*
- 1.18.1 *Support for Node 16, 18, 20 + Darwin arm64 precompiled binaries.*
- 1.18.0 *Modified TS bindings, added a type test (thx, [Kenichi Kamiya](https://github.com/kachick) and [Jamie Magee](https://github.com/JamieMagee)).*
- 1.17.8 *Updated deps, added Node 19 as a pre-compilation target.*
- 1.17.7 *Added support for a cross-platform fetching of a pre-compiled version by updating [install-artifact-from-github](https://github.com/uhop/install-artifact-from-github).*
- 1.17.6 *Implemented `dotAll`. Thx [Michael Kriese](https://github.com/viceice).*
- 1.17.5 *Updated deps, updated test/build targets, implemented `matchAll()` (thx, [ThePendulum](https://github.com/ThePendulum) and [David Sichau](https://github.com/DavidSichau)).*
- 1.17.4 *Updated deps.*
- 1.17.3 *Fixed bug with zero-length replacements.*
- 1.17.2 *Added support for the enhanced local mirroring by updating [install-artifact-from-github](https://github.com/uhop/install-artifact-from-github).*
- 1.17.1 *Fix for `lastIndex` for U+10000 - U+10FFFF UTF characters. Thx, [omg](https://github.com/omg).*
- 1.17.0 *Updated GYP, added support for Node 17, updated deps.*
- 1.16.0 *Updated the compiler (thx, [Sergei Dyshel](https://github.com/sergei-dyshel)), updated GYP, removed support for Node 10, added support for Node 16, updated TS bindings (thx, [BannerBomb](https://github.com/BannerBomb)).*
- 1.15.9 *Updated deps.*
- 1.15.8 *Updated deps.*
- 1.15.7 *Updated deps.*
- 1.15.6 *Technical release: less dependencies for the build.*
- 1.15.5 *Updated deps. Fixed a `node2nix`-related problem (thx [malte-v](https://github.com/malte-v)).*
- 1.15.4 *Updated deps. Fixed a yarn-related bug (thx [Michael Kriese](https://github.com/viceice)).*
- 1.15.3 *Extracted caching artifacts to separate packages. Added support for `RE2_DOWNLOAD_MIRROR` environment variable for precompiled artifact download during installation.*
- 1.15.2 *Added `linux-musl` target for precompiled images (thx [Uzlopak](https://github.com/Uzlopak)).*
- 1.15.1 *Refreshed dependencies, updated the verification check on installation, general maintenance.*
- 1.15.0 *Fix for multiline expressions (thx [Frederic Rudman](https://github.com/frudman)), `toString()` uses `source` now, updated deps.*

The rest can be consulted in the project's wiki [Release history](https://github.com/uhop/node-re2/wiki/Release-history).

## License

BSD
