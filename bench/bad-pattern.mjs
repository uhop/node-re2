import {default as RE2} from '../re2.js';

const BAD_PATTERN = '([a-z]+)+$';
const BAD_INPUT = 'a'.repeat(10) + '!';

const regExp = new RegExp(BAD_PATTERN);
const re2 = new RE2(BAD_PATTERN);

export default {
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
