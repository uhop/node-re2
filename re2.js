'use strict';

const RE2 = require('./build/Release/re2.node');
// const RE2 = require('./build/Debug/re2.node');

const setAliases = (object, dict) => {
  for (let [name, alias] of Object.entries(dict)) {
    Object.defineProperty(
      object,
      alias,
      Object.getOwnPropertyDescriptor(object, name)
    );
  }
};

setAliases(RE2.prototype, {
  match: Symbol.match,
  search: Symbol.search,
  replace: Symbol.replace,
  split: Symbol.split
});

RE2.prototype[Symbol.matchAll] = function* (str) {
  if (!this.global)
    throw TypeError(
      'String.prototype.matchAll() is called with a non-global RE2 argument'
    );

  const re = new RE2(this);
  re.lastIndex = this.lastIndex;
  for (;;) {
    const result = re.exec(str);
    if (!result) break;
    if (result[0] === '') ++re.lastIndex;
    yield result;
  }
};

module.exports = RE2;
