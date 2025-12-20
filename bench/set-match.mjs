import {default as RE2} from '../re2.js';

const PATTERN_COUNT = 200;

const patterns = [];
for (let i = 0; i < PATTERN_COUNT; ++i) {
  patterns.push('token' + i + '(?:[a-z]+)?');
}

const INPUT_COUNT = 500;

const inputs = [];
for (let j = 0; j < INPUT_COUNT; ++j) {
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

const re2Set = new RE2.Set(patterns);
const re2List = patterns.map(p => new RE2(p));
const jsList = patterns.map(p => new RegExp(p));

export default {
  RegExp: n => {
    let count = 0;
    for (let i = 0; i < n; ++i) {
      for (const input of inputs) {
        const matches = [];
        for (const pattern of jsList) {
          if (pattern.test(input)) matches.push(pattern);
        }
        count += matches.length;
      }
    }
    return count;
  },
  RE2: n => {
    let count = 0;
    for (let i = 0; i < n; ++i) {
      for (const input of inputs) {
        const matches = [];
        for (const pattern of re2List) {
          if (pattern.test(input)) matches.push(pattern);
        }
        count += matches.length;
      }
    }
    return count;
  },
  'RE2.Set': n => {
    let count = 0;
    for (let i = 0; i < n; ++i) {
      for (const input of inputs) {
        const matches = re2Set.match(input);
        count += matches.length;
      }
    }
    return count;
  }
};
