# node-re2 [![NPM version][npm-img]][npm-url]

[npm-img]: https://img.shields.io/npm/v/re2.svg
[npm-url]: https://npmjs.org/package/re2

This project provides Node.js bindings for [RE2](https://github.com/google/re2):
a fast, safe alternative to backtracking regular expression engines written by [Russ Cox](http://swtch.com/~rsc/) in C++.
To learn more about RE2, start with [Regular Expression Matching in the Wild](http://swtch.com/~rsc/regexp/regexp3.html). More resources are on his [Implementing Regular Expressions](http://swtch.com/~rsc/regexp/) page.

`RE2`'s regular expression language is almost a superset of what `RegExp` provides
(see [Syntax](https://github.com/google/re2/wiki/Syntax)),
but it lacks backreferences and lookahead assertions. See below for details.

`RE2` always works in [Unicode mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicode) &mdash; character codes are interpreted as Unicode code points, not as binary values of UTF-16.
See `RE2.unicodeWarningLevel` below for details.

`RE2` emulates standard `RegExp`, making it a practical drop-in replacement in most cases.
It also provides `String`-based regular expression methods. The constructor accepts `RegExp` directly, honoring all properties.

It can work with [Node.js Buffers](https://nodejs.org/api/buffer.html) directly, reducing overhead and making processing of long files fast.

The project is a C++ addon built with [nan](https://github.com/nodejs/nan). It cannot be used in web browsers.
All documentation is in this README and in the [wiki](https://github.com/uhop/node-re2/wiki).

## Why use node-re2?

The built-in Node.js regular expression engine can run in exponential time with a special combination:
 - A vulnerable regular expression
 - "Evil input"

This can lead to what is known as a [Regular Expression Denial of Service (ReDoS)](https://www.owasp.org/index.php/Regular_expression_Denial_of_Service_-_ReDoS).
To check if your regular expressions are vulnerable, try one of these projects:
 - [rxxr2](http://www.cs.bham.ac.uk/~hxt/research/rxxr2/)
 - [safe-regex](https://github.com/substack/safe-regex)

Neither project is perfect.

node-re2 protects against ReDoS by evaluating patterns in `RE2` instead of the built-in regex engine.

To run the bundled benchmark (make sure node-re2 is built first):

```bash
npx nano-bench bench/bad-pattern.mjs
```

## Standard features

`RE2` objects are created just like `RegExp`:

* [`new RE2(pattern[, flags])`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

Supported flags: `g` (global), `i` (ignoreCase), `m` (multiline), `s` (dotAll), `u` (unicode, always on), `y` (sticky), `d` (hasIndices).

Supported properties:

* [`re2.lastIndex`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex)
* [`re2.global`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/global)
* [`re2.ignoreCase`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/ignoreCase)
* [`re2.multiline`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/multiline)
* [`re2.dotAll`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/dotAll)
* [`re2.unicode`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicode) &mdash; always `true`; see details below.
* [`re2.sticky`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky)
* [`re2.hasIndices`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/hasIndices)
* [`re2.source`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/source)
* [`re2.flags`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/flags)

Supported methods:

* [`re2.exec(str)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
* [`re2.test(str)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test)
* [`re2.toString()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/toString)

Well-known symbol-based methods are supported (see [Symbols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)):

* [`re2[Symbol.match](str)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/match)
* [`re2[Symbol.matchAll](str)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/matchAll)
* [`re2[Symbol.search](str)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/search)
* [`re2[Symbol.replace](str, newSubStr|function)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/replace)
* [`re2[Symbol.split](str[, limit])`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/split)

This lets you use `RE2` instances on strings directly, just like `RegExp`:

```js
const re = new RE2('1');
'213'.match(re);        // [ '1', index: 1, input: '213' ]
'213'.search(re);       // 1
'213'.replace(re, '+'); // 2+3
'213'.split(re);        // [ '2', '3' ]

Array.from('2131'.matchAll(new RE2('1', 'g'))); // matchAll requires the g flag
// [['1', index: 1, input: '2131'], ['1', index: 3, input: '2131']]
```

[Named groups](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Named_capturing_group) are supported.

## Extensions

### Shortcut construction

`RE2` can be created from a regular expression:

```js
const re1 = new RE2(/ab*/ig); // from a RegExp object
const re2 = new RE2(re1);     // from another RE2 object
```

### `String` methods

`RE2` provides the standard `String` regex methods with swapped receiver and argument:

* `re2.match(str)`
  * See [`str.match(regexp)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match)
* `re2.replace(str, newSubStr|function)`
  * See [`str.replace(regexp, newSubStr|function)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace)
* `re2.search(str)`
  * See [`str.search(regexp)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/search)
* `re2.split(str[, limit])`
  * See [`str.split(regexp[, limit])`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split)

These methods are also available as well-known symbol-based methods for transparent use with ES6 string/regex machinery.

### `Buffer` support

Most methods accept Buffers instead of strings for direct UTF-8 processing:

* `re2.exec(buf)`
* `re2.test(buf)`
* `re2.match(buf)`
* `re2.search(buf)`
* `re2.split(buf[, limit])`
* `re2.replace(buf, replacer)`

Differences from string-based versions:

* All buffers are assumed to be encoded as [UTF-8](https://en.wikipedia.org/wiki/UTF-8)
  (ASCII is a proper subset of UTF-8).
* Results are `Buffer` objects, even in composite objects. Convert with
  [`buf.toString()`](https://nodejs.org/api/buffer.html#buffer_buf_tostring_encoding_start_end).
* All offsets and lengths are in bytes, not characters (each UTF-8 character occupies 1–4 bytes).
  This lets you slice buffers directly without costly character-to-byte recalculations.

When `re2.replace()` is used with a replacer function, the replacer receives string arguments and character offsets by default. Set `useBuffers` to `true` on the function to receive byte offsets instead:

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

This works for both string and buffer inputs. Buffer input produces buffer output; string input produces string output.

### `RE2.Set`

Use `RE2.Set` when the same string must be tested against many patterns. It builds a single automaton and frequently beats running individual regular expressions one by one.

While `test()` can be simulated by combining patterns with `|`, `match()` returns which patterns matched &mdash; something a single regular expression cannot do.

* `new RE2.Set(patterns[, flagsOrOptions][, options])`
  * `patterns` is any iterable of strings, `Buffer`s, `RegExp`, or `RE2` instances; flags (if provided) apply to the whole set.
  * `flagsOrOptions` can be a string/`Buffer` with standard flags (`i`, `m`, `s`, `u`, `g`, `y`, `d`).
  * `options.anchor` can be `'unanchored'` (default), `'start'`, or `'both'`.
* `set.test(str)` returns `true` if any pattern matches and `false` otherwise.
* `set.match(str)` returns an array of indexes of matching patterns.
  * This is an array of integer indices of patterns that matched sorted in ascending order.
  * If no patterns matched, an empty array is returned.
* Read-only properties:
  * `set.size` (number of patterns), `set.flags` (`RegExp` flags as a string), `set.anchor` (anchor mode as a string)
  * `set.source` (all patterns joined with `|` as a string), `set.sources` (individual pattern sources as an array of strings)

It is based on [RE2::Set](https://github.com/google/re2/blob/main/re2/set.h).

Example:

```js
const routes = new RE2.Set([
  '^/users/\\d+$',
  '^/posts/\\d+$'
], 'i', {anchor: 'start'});

routes.test('/users/7');     // true
routes.match('/posts/42');   // [1]
routes.sources;              // ['^/users/\\d+$', '^/posts/\\d+$']
routes.toString();           // '/^/users/\\d+$|^/posts/\\d+$/iu'
```

To run the bundled benchmark (make sure node-re2 is built first):

```bash
npx nano-bench bench/set-match.mjs
```

### Calculate length

Two helpers convert between UTF-8 and UTF-16 sizes:

* `RE2.getUtf8Length(str)` &mdash; byte size needed to encode a string as a UTF-8 buffer.
* `RE2.getUtf16Length(buf)` &mdash; character count needed to decode a UTF-8 buffer as a string.

### Property: `internalSource`

`source` emulates the standard `RegExp` property and can recreate an identical `RE2` or `RegExp` instance. To inspect the RE2-translated pattern (useful for debugging), use the read-only `internalSource` property.

### Unicode warning level

`RE2` always works in Unicode mode. In most cases this is either invisible or preferred. For applications that need tight control, the static property `RE2.unicodeWarningLevel` governs what happens when a non-Unicode regular expression is created.

If a regular expression lacks the `u` flag, it is added silently by default:

```js
const x = /./;
x.flags; // ''
const y = new RE2(x);
y.flags; // 'u'
```

Values of `RE2.unicodeWarningLevel`:

* `'nothing'` (default) &mdash; silently add `u`.
* `'warnOnce'` &mdash; warn once, then silently add `u`. Assigning this value resets the one-time flag.
* `'warn'` &mdash; warn every time, still add `u`.
* `'throw'` &mdash; throw `SyntaxError`.
* Any other value is silently ignored, leaving the previous value unchanged.

Warnings and exceptions help audit an application for stray non-Unicode regular expressions.

`RE2.unicodeWarningLevel` is global. Be careful in multi-threaded environments &mdash; it is shared across threads.

## How to install

```bash
npm install re2
```

The project works with other package managers but is not tested with them.
See the wiki for notes on [yarn](https://github.com/uhop/node-re2/wiki/Using-with-yarn) and [pnpm](https://github.com/uhop/node-re2/wiki/Using-with-pnpm).

### Precompiled artifacts

The [install script](https://github.com/uhop/install-artifact-from-github/blob/master/bin/install-from-cache.js) attempts to download a prebuilt artifact from GitHub Releases. Override the download location with the `RE2_DOWNLOAD_MIRROR` environment variable.

If the download fails, the script builds RE2 locally using [node-gyp](https://github.com/nodejs/node-gyp).

## How to use

It is used just like `RegExp`.

```js
const RE2 = require('re2');

// with default flags
let re = new RE2('a(b*)');
let result = re.exec('abbc');
console.log(result[0]); // 'abb'
console.log(result[1]); // 'bb'

result = re.exec('aBbC');
console.log(result[0]); // 'a'
console.log(result[1]); // ''

// with explicit flags
re = new RE2('a(b*)', 'i');
result = re.exec('aBbC');
console.log(result[0]); // 'aBb'
console.log(result[1]); // 'Bb'

// from regular expression object
const regexp = new RegExp('a(b*)', 'i');
re = new RE2(regexp);
result = re.exec('aBbC');
console.log(result[0]); // 'aBb'
console.log(result[1]); // 'Bb'

// from regular expression literal
re = new RE2(/a(b*)/i);
result = re.exec('aBbC');
console.log(result[0]); // 'aBb'
console.log(result[1]); // 'Bb'

// from another RE2 object
const rex = new RE2(re);
result = rex.exec('aBbC');
console.log(result[0]); // 'aBb'
console.log(result[1]); // 'Bb'

// shortcut
result = new RE2('ab*').exec('abba');

// factory
result = RE2('ab*').exec('abba');
```

## Limitations (things RE2 does not support)

`RE2` avoids any regular expression features that require worst-case exponential time to evaluate.
The most notable missing features are backreferences and lookahead assertions.
If your application uses them, you should continue to use `RegExp` &mdash;
but since they are fundamentally vulnerable to
[ReDoS](https://www.owasp.org/index.php/Regular_expression_Denial_of_Service_-_ReDoS),
consider replacing them.

`RE2` throws `SyntaxError` for unsupported features.
Wrap `RE2` declarations in a try-catch to fall back to `RegExp`:

```js
let re = /(a)+(b)*/;
try {
  re = new RE2(re);
  // use RE2 as a drop-in replacement
} catch (e) {
  // use the original RegExp
}
const result = re.exec(sample);
```

`RE2` may also behave differently from the built-in engine in corner cases.

### Backreferences

`RE2` does not support backreferences &mdash; numbered references to previously
matched groups (`\1`, `\2`, etc.). Example:

```js
/(cat|dog)\1/.test("catcat"); // true
/(cat|dog)\1/.test("dogdog"); // true
/(cat|dog)\1/.test("catdog"); // false
/(cat|dog)\1/.test("dogcat"); // false
```

### Lookahead assertions

`RE2` does not support lookahead assertions, which make a match depend on subsequent contents.

```js
/abc(?=def)/; // match abc only if it is followed by def
/abc(?!def)/; // match abc only if it is not followed by def
```

### Mismatched behavior

`RE2` and the built-in engine may disagree in edge cases. Verify your regular expressions before switching. They should work in the vast majority of cases.

Example:

```js
const RE2 = require('re2');

const pattern = '(?:(a)|(b)|(c))+';

const built_in = new RegExp(pattern);
const re2 = new RE2(pattern);

const input = 'abc';

const bi_res = built_in.exec(input);
const re2_res = re2.exec(input);

console.log('bi_res: ' + bi_res);    // prints: bi_res: abc,,,c
console.log('re2_res : ' + re2_res); // prints: re2_res : abc,a,b,c
```

### Unicode

`RE2` always works in Unicode mode. See `RE2.unicodeWarningLevel` above for details.

#### Unicode classes `\p{...}` and `\P{...}`

`RE2` supports a subset of Unicode classes as defined in [RE2 Syntax](https://github.com/google/re2/wiki/Syntax). Google RE2 natively supports only short names (e.g., `L` for `Letter`). Like `RegExp`, node-re2 also accepts long names by translating them to short names.

Only the `\p{name}` form is supported, not `\p{name=value}` in general.
The exception is `Script` and `sc`, e.g., `\p{Script=Latin}` and `\p{sc=Cyrillic}`.
The same applies to `\P{...}`.

## Release history

- 1.24.0 *Fixed multi-threaded crash in worker threads (#235). Added named import: `import {RE2} from 're2'`. Added CJS test. Updated docs and dependencies.*
- 1.23.3 *Updated Abseil and dev dependencies.*
- 1.23.2 *Updated dev dependencies.*
- 1.23.1 *Updated Abseil and dev dependencies.*
- 1.23.0 *Updated all dependencies, upgraded tooling. New feature: `RE2.Set` (thx, [Wes](https://github.com/wrmedford)).*
- 1.22.3 *Technical release: upgraded QEMU emulations to native ARM runners to speed up the build process.*
- 1.22.2 *Updated all dependencies and the list of pre-compiled targets: Node 20, 22, 24, 25 (thx, [Jiayu Liu](https://github.com/jimexist)).*
- 1.22.1 *Added support for translation of scripts as Unicode classes.*
- 1.22.0 *Added support for translation of Unicode classes (thx, [John Livingston](https://github.com/JohnXLivingston)). Added [attestations](https://github.com/uhop/node-re2/attestations).*
- 1.21.5 *Updated all dependencies and the list of pre-compiled targets. Fixed minor bugs. C++ style fix (thx, [Benjamin Brienen](https://github.com/BenjaminBrienen)). Added Windows 11 ARM build runner (thx, [Kagami Sascha Rosylight](https://github.com/saschanaz)).*
- 1.21.4 *Fixed a regression reported by [caroline-matsec](https://github.com/caroline-matsec), thx! Added pre-compilation targets for Alpine Linux on ARM. Updated deps.*
- 1.21.3 *Fixed an empty string regression reported by [Rhys Arkins](https://github.com/rarkins), thx! Updated deps.*
- 1.21.2 *Fixed another memory regression reported by [matthewvalentine](https://github.com/matthewvalentine), thx! Updated deps. Added more tests and benchmarks.*
- 1.21.1 *Fixed a memory regression reported by [matthewvalentine](https://github.com/matthewvalentine), thx! Updated deps.*
- 1.21.0 *Fixed the performance problem reported by [matthewvalentine](https://github.com/matthewvalentine) (thx!). The change improves performance for multiple use cases.*
- 1.20.12 *Updated deps. Maintenance chores. Fixes for buffer-related bugs: `exec()` index (reported by [matthewvalentine](https://github.com/matthewvalentine), thx) and `match()` index.*
- 1.20.11 *Updated deps. Added support for Node 22 (thx, [Elton Leong](https://github.com/eltonkl)).*
- 1.20.10 *Updated deps. Removed files the pack used for development (thx, [Haruaki OTAKE](https://github.com/aaharu)). Added arm64 Linux prebilds (thx, [Christopher M](https://github.com/cmanou)). Fixed non-`npm` `corepack` problem (thx, [Steven](https://github.com/styfle)).*
- 1.20.9 *Updated deps. Added more `absail-cpp` files that manifested itself on NixOS. Thx, [Laura Hausmann](https://github.com/zotanmew).*
- 1.20.8 *Updated deps: `install-artifact-from-github`. A default HTTPS agent is used for fetching precompiled artifacts avoiding unnecessary long wait times.*
- 1.20.7 *Added more `absail-cpp` files that manifested itself on ARM Alpine. Thx, [Laura Hausmann](https://github.com/zotanmew).*
- 1.20.6 *Updated deps, notably `node-gyp`.*
- 1.20.5 *Updated deps, added Node 21 and retired Node 16 as pre-compilation targets.*
- 1.20.4 *Updated deps. Fix: the 2nd argument of the constructor overrides flags. Thx, [gost-serb](https://github.com/gost-serb).*
- 1.20.3 *Fix: subsequent numbers are incorporated into group if they would form a legal group reference. Thx, [Oleksii Vasyliev](https://github.com/le0pard).*
- 1.20.2 *Fix: added a missing C++ file, which caused a bug on Alpine Linux. Thx, [rbitanga-manticore](https://github.com/rbitanga-manticore).*
- 1.20.1 *Fix: files included in the npm package to build the C++ code.*
- 1.20.0 *Updated RE2. New version uses `abseil-cpp` and required the adaptation work. Thx, [Stefano Rivera](https://github.com/stefanor).*

The rest can be consulted in the project's wiki [Release history](https://github.com/uhop/node-re2/wiki/Release-history).

## License

BSD-3-Clause
