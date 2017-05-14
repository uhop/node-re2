# node-re2

[![Build status][travis-image]][travis-url]
[![Dependencies][deps-image]][deps-url]
[![devDependencies][dev-deps-image]][dev-deps-url]
[![NPM version][npm-image]][npm-url]

This project provides bindings for [RE2](https://github.com/google/re2):
fast, safe alternative to backtracking regular expression engines written by [Russ Cox](http://swtch.com/~rsc/).
To learn more about RE2, start with an overview
[Regular Expression Matching in the Wild](http://swtch.com/~rsc/regexp/regexp3.html). More resources can be found
at his [Implementing Regular Expressions](http://swtch.com/~rsc/regexp/) page.

`RE2`'s regular expression language is almost a superset of what is provided by `RegExp`
(see [Syntax](https://github.com/google/re2/wiki/Syntax)),
but it lacks two features: backreferences and lookahead assertions. See below for more details.

`RE2` object emulates standard `RegExp` making it a practical drop-in replacement in most cases.
`RE2` is extended to provide `String`-based regular expression methods as well. To help converting
`RegExp` objects to `RE2` its constructor can take `RegExp` directly honoring all properties.

It can work with [node.js buffers](http://nodejs.org/api/buffer.html) directly reducing overhead
on recoding and copying characters, and making processing/parsing long files fast.

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
* [`re2.source`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/source)

Supported methods:

* [`re2.exec(str)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
* [`re2.test(str)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test)
* [`re2.toString()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/toString)

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

## How to install

Installation:

```
npm install re2
```

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

## Limitations (Things RE2 does not support)

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

`RE2` and the built-in regex engines disagree a bit.
Before you switch to `RE2`, verify that your regular expressions continue to work as expected.
They should do so in the vast majority of cases.

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

## Working on this project

This project uses git submodules, so the correct way to get it is:

    git clone git@github.com:uhop/node-re2.git
    cd node-re2
    git submodule update --init --recursive

In order to build it, make sure that you have all necessary `gyp` dependencies
for your platform, then run:

    npm install

Or:

    yarn

## Release history

- 1.5.0 *Bug fixes, error checks, better docs. Thx [Jamie Davis](https://github.com/davisjam), and [omg](https://github.com/omg)!*
- 1.4.1 *Minor corrections in README.*
- 1.4.0 *Use re2 as a git submodule. Thx [Ben James](https://github.com/benhjames)!*
- 1.3.3 *Refreshed dependencies.*
- 1.3.2 *Updated references in README (re2 was moved to github).*
- 1.3.1 *Refreshed dependencies, new Travis-CI config.*
- 1.3.0 *Upgraded NAN to 1.6.3, now we support node.js 0.10.36, 0.12.0, and io.js 1.3.0. Thx @reid!*
- 1.2.0 *Documented getUtfXLength() functions. Added support for `\c` and `\u` commands.*
- 1.1.1 *Minor corrections in README.*
- 1.1.0 *Buffer-based API is public. Unicode is fully supported.*
- 1.0.0 *Implemented all `RegExp` methods, and all relevant `String` methods.*
- 0.9.0 *The initial public release.*

## License

BSD

[npm-image]:      https://img.shields.io/npm/v/re2.svg
[npm-url]:        https://npmjs.org/package/re2
[deps-image]:     https://img.shields.io/david/uhop/node-re2.svg
[deps-url]:       https://david-dm.org/uhop/node-re2
[dev-deps-image]: https://img.shields.io/david/dev/uhop/node-re2.svg
[dev-deps-url]:   https://david-dm.org/uhop/node-re2#info=dev
[travis-image]:   https://img.shields.io/travis/uhop/node-re2.svg
[travis-url]:     https://travis-ci.org/uhop/node-re2
