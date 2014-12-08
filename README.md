# node-re2

[![Build status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]
[![Dependencies][deps-image]][deps-url]
[![devDependencies][dev-deps-image]][dev-deps-url]

node.js bindings for [RE2](https://code.google.com/p/re2/):
fast, safe alternative to backtracking regular expression engines. The trade-offs for speed: lack of backreferences
and zero-width assertions. See below for more details.

`RE2` object emulates standard `RegExp`, and supports folowing properties:

* [`lastIndex`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex)
* [`global`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/global)
* [`ignoreCase`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/ignoreCase)
* [`multiline`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/multiline)
* [`source`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/source)

And following methods:

* [`exec(str)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
* [`test(str)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test)

It can be created like `RegExp`:

* [`new RE2(pattern[, flags])`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

Additionally it can be created from a regular expression `new RE2(regexp)`:

```js
var re1 = new RE2(/ab*/ig); // from RegExp object
var re2 = new RE2(re1);     // from RE2 object
```

## How to install

Installation:

```
npm install re2
```

## Backreferences

Unlike the standard `RegExp`, `RE2` doesn't support backreferences, which are numbered references to previously
matched groups, like so: `\1`, `\2`, and so on. Example of backrefrences:

```js
/(cat|dog)\1/.test("catcat"); // true
/(cat|dog)\1/.test("dogdog"); // true
/(cat|dog)\1/.test("catdog"); // false
/(cat|dog)\1/.test("dogcat"); // false
```

If this kind of matching is essential for your application, you should use `RegExp`.

## Release history

- 0.9.0 *the initial public release*


[npm-image]:      https://img.shields.io/npm/v/re2.svg?style=flat-square
[npm-url]:        https://npmjs.org/package/re2
[deps-image]:     https://img.shields.io/david/uhop/node-re2.svg
[deps-url]:       https://david-dm.org/uhop/node-re2
[dev-deps-image]: https://img.shields.io/david/dev/uhop/node-re2.svg
[dev-deps-url]:   https://david-dm.org/uhop/node-re2#info=devDependencies
[travis-image]:   https://img.shields.io/travis/uhop/node-re2.svg
[travis-url]:     https://travis-ci.org/uhop/node-re2
