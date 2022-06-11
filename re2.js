'use strict';

const RE2 = require('./build/Release/re2');

if (typeof Symbol != 'undefined') {
  Symbol.match &&
    (RE2.prototype[Symbol.match] = function (str) {
      return this.match(str);
    });
  Symbol.search &&
    (RE2.prototype[Symbol.search] = function (str) {
      return this.search(str);
    });
  Symbol.replace &&
    (RE2.prototype[Symbol.replace] = function (str, repl) {
      return this.replace(str, repl);
    });
  Symbol.split &&
    (RE2.prototype[Symbol.split] = function (str, limit) {
      return this.split(str, limit);
    });
    Symbol.matchAll &&
    (RE2.prototype[Symbol.matchAll] = function* (str) {
      if (!this.global) {
        throw TypeError('String.prototype.matchAll called with a non-global RE2 argument');
      }
      const re = new RE2(this);
      re.lastIndex = this.lastIndex;
      for (;;) {
        const result = re.exec(str);
        if (!result) break;
        yield result;
      }
    });
}

module.exports = RE2;
