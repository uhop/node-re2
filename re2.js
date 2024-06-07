'use strict';

const RE2 = require('./build/Release/re2.node');

const setAliases = (object, dict, force) => {
  for (let [name, aliases] of Object.entries(dict)) {
    if (typeof aliases == 'string') aliases = aliases.split(/\s*,\s*/);
    if (!Array.isArray(aliases)) aliases = [aliases];
    for (const alias of aliases) {
      const descriptor = Object.getOwnPropertyDescriptor(object, name);
      if (!descriptor) continue;
      if (!force && object.hasOwnProperty(alias)) continue;
      Object.defineProperty(object, alias, descriptor);
    }
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
