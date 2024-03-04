'use strict';

const RE2 = require('./build/Release/re2.node');

const bufferReplace = RE2.prototype.replace;
RE2.prototype.replace = function (str, repl) {
  const convert = makeFormatConverter(str);
  return bufferReplace.call(this, convert.buf, convert.toInternalReplacer(repl));
}

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
      const convert = makeFormatConverter(str);
      const re = new RE2(this);
      re.lastIndex = convert.toInternalIndex(this.lastIndex);
      for (;;) {
        const result = re.exec(convert.buf);
        if (!result) break;
        if (result[0] === '') ++re.lastIndex;
        yield convert.toExternalMatch(result);
      }
    });
}

function makeFormatConverter(str) {
  if (str instanceof Buffer) {
    return {
      buf: str,
      toInternalIndex(extIdx) { return extIdx; },
      toInternalReplacer(repl) { return repl; },
      toExternalIndex(intIdx) { return intIdx; },
      toExternalMatch(match) { return match; },
    };
  }

  const buf = Buffer.from(str, 'utf-8');

  function toInternalIndex(extIdx) {
    return RE2.getUtf8Length(str.slice(0, extIdx));
  }

  function toInternalReplacer(repl) {
    if (typeof repl !== 'function') {
      return repl instanceof Buffer ? repl : Buffer.from(repl, 'utf-8');
    }
    if (repl.useBuffers === true) {
      return repl;
    }

    const wrapped = (...args) => {
      const offsetPos = args.findIndex(x => typeof x === 'number');
      for (let i = 0; i < offsetPos; i++) {
        if (args[i]) args[i] = args[i].toString('utf-8');
      }
      args[offsetPos] = toExternalIndex(args[args.length - 3]);
      args[offsetPos + 1] = str;

      const groups = args[offsetPos + 2];
      if (groups) {
        for (const name of Object.keys(groups)) {
          if (groups[name]) groups[name] = groups[name].toString('utf-8');
        }
      }

      return repl(...args);
    };
    wrapped.useBuffers = true;
    return wrapped;
  }

  let lastIntIdx = 0;
  let lastExtIdx = 0;
  function toExternalIndex(intIdx) {
    if (intIdx < lastIntIdx) {
      lastIntIdx = 0;
      lastExtIdx = 0;
    }
    if (intIdx !== lastIntIdx) {
      lastExtIdx += RE2.getUtf16Length(buf, lastIntIdx, intIdx);
      lastIntIdx = intIdx;
    }
    return lastExtIdx;
  }

  function toExternalMatch(match) {
    // Convert all the utf-8 Buffers into utf-16 strings.
    match.input = str;
    for (let i = 0; i < match.length; i++) {
      if (match[i]) match[i] = match[i].toString('utf-8');
    }
    if (match.groups) {
      for (const name of Object.keys(match.groups)) {
        if (match.groups[name]) match.groups[name] = match.groups[name].toString('utf-8');
      }
    }

    // Convert all the utf-8 indices into utf-16 indices.
    // To use the index converter efficiently, go from least to greatest index.
    const toConvert = [match.index];
    if (match.indices) {
      for (const xs of match.indices) {
        if (xs) toConvert.push(xs[0], xs[1]);
      }
      if (match.indices.groups) {
        for (const xs of Object.values(match.indices.groups)) {
          if (xs) toConvert.push(xs[0], xs[1]);
        }
      }
    }
    toConvert.sort();

    const converted = new Map();
    for (const idx of toConvert) {
      if (!converted.has(idx)) converted.set(idx, toExternalIndex(idx));
    }

    match.index = converted.get(match.index);
    if (match.indices) {
      for (const xs of match.indices) {
        if (xs) {
          xs[0] = converted.get(xs[0]);
          xs[1] = converted.get(xs[1]);  
        }
      }
      if (match.indices.groups) {
        for (const xs of Object.values(match.indices.groups)) {
          if (xs) {
            xs[0] = converted.get(xs[0]);
            xs[1] = converted.get(xs[1]);  
          }
        }
      }
    }

    return match;
  }

  return { buf, toInternalIndex, toInternalReplacer, toExternalIndex, toExternalMatch };
}

module.exports = RE2;
