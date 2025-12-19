import {default as RE2} from '../re2.js';

const PATTERN_COUNT = 200;

const patterns = [];
for (let i = 0; i < PATTERN_COUNT; ++i) {
  patterns.push('token' + i + '(?:[a-z]+)?');
}

const ITERATIONS = 4_000;

const inputs = [];
for (let j = 0; j < ITERATIONS; ++j) {
  inputs.push(
    'xx' +
      (j % PATTERN_COUNT) +
      ' ' +
      (j & 7) +
      ' token' +
      (j % PATTERN_COUNT) +
      ' tail'
  );
}

const set = new RE2.Set(patterns);
const re2List = patterns.map(p => new RE2(p));
const jsList = patterns.map(p => new RegExp(p));

export default {
  RegExp: n => {
    let count = 0;
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < jsList.length; ++j) {
        if (jsList[j].test(inputs[i])) {
          ++count;
          break;
        }
      }
    }
    return count;
  },
  RE2: n => {
    let count = 0;
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < re2List.length; ++j) {
        if (re2List[j].test(inputs[i])) {
          ++count;
          break;
        }
      }
    }
    return count;
  },
  'RE2.Set': n => {
    let count = 0;
    for (let i = 0; i < n; ++i) {
      if (set.test(inputs[i])) ++count;
    }
    return count;
  }
};
