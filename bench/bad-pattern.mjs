import {RE2} from '../re2.js';

const BAD_PATTERN = '([a-z]+)+$';
const BAD_INPUT = 'a'.repeat(10) + '!';

const regExp = new RegExp(BAD_PATTERN);
const re2 = new RE2(BAD_PATTERN);

// V8's experimental linear-time engine — only available under
// `node --enable-experimental-regexp-engine`; the 'l' flag throws otherwise.
let linear;
try {
  linear = new RegExp(BAD_PATTERN, 'l');
} catch {}

const cases = {
  RegExp: n => {
    let count = 0;
    for (let i = 0; i < n; ++i) {
      if (regExp.test(BAD_INPUT)) ++count;
    }
    return count;
  },
  RE2: n => {
    let count = 0;
    for (let i = 0; i < n; ++i) {
      if (re2.test(BAD_INPUT)) ++count;
    }
    return count;
  }
};

if (linear) {
  cases.Linear = n => {
    let count = 0;
    for (let i = 0; i < n; ++i) {
      if (linear.test(BAD_INPUT)) ++count;
    }
    return count;
  };
}

export default cases;
