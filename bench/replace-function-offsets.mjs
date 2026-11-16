// GHSA-8c7q: a doubling subject should double the time, ASCII or not.

import {RE2} from '../re2.js';

export const params = [2000, 4000, 8000];

export default size => {
  const re = new RE2('', 'g');
  const replacer = () => '';
  const ascii = 'a'.repeat(size);
  const nonAscii = 'é'.repeat(size);
  return {
    ASCII: n => {
      const x = [];
      for (let i = 0; i < n; ++i) {
        x.pop();
        x.push(ascii.replace(re, replacer));
      }
      return x;
    },
    'non-ASCII': n => {
      const x = [];
      for (let i = 0; i < n; ++i) {
        x.pop();
        x.push(nonAscii.replace(re, replacer));
      }
      return x;
    }
  };
};
