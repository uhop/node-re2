import test from 'tape-six';
import {default as RE2} from '../re2.js';

// tests

test('test match symbol', t => {
  if (typeof Symbol == 'undefined' || !Symbol.match) return;

  const str = 'For more information, see Chapter 3.4.5.1';

  const re = new RE2(/(chapter \d+(\.\d)*)/i);
  const result = str.match(re);

  t.equal(result.input, str);
  t.equal(result.index, 26);
  t.equal(result.length, 3);
  t.equal(result[0], 'Chapter 3.4.5.1');
  t.equal(result[1], 'Chapter 3.4.5.1');
  t.equal(result[2], '.1');
});

test('test search symbol', t => {
  if (typeof Symbol == 'undefined' || !Symbol.search) return;

  const str = 'Total is 42 units.';

  let re = new RE2(/\d+/i);
  let result = str.search(re);
  t.equal(result, 9);

  re = new RE2('\\b[a-z]+\\b');
  result = str.search(re);
  t.equal(result, 6);

  re = new RE2('\\b\\w+\\b');
  result = str.search(re);
  t.equal(result, 0);

  re = new RE2('z', 'gm');
  result = str.search(re);
  t.equal(result, -1);
});

test('test replace symbol', t => {
  if (typeof Symbol == 'undefined' || !Symbol.replace) return;

  let re = new RE2(/apples/gi);
  let result = 'Apples are round, and apples are juicy.'.replace(re, 'oranges');
  t.equal(result, 'oranges are round, and oranges are juicy.');

  re = new RE2(/xmas/i);
  result = 'Twas the night before Xmas...'.replace(re, 'Christmas');
  t.equal(result, 'Twas the night before Christmas...');

  re = new RE2(/(\w+)\s(\w+)/);
  result = 'John Smith'.replace(re, '$2, $1');
  t.equal(result, 'Smith, John');
});

test('test split symbol', t => {
  if (typeof Symbol == 'undefined' || !Symbol.split) return;

  let re = new RE2(/\s+/);
  let result = 'Oh brave new world that has such people in it.'.split(re);
  t.deepEqual(result, [
    'Oh',
    'brave',
    'new',
    'world',
    'that',
    'has',
    'such',
    'people',
    'in',
    'it.'
  ]);

  re = new RE2(',');
  result = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(re);
  t.deepEqual(result, [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]);

  re = new RE2(/\s*;\s*/);
  result =
    'Harry Trump ;Fred Barney; Helen Rigby ; Bill Abel ;Chris Hand '.split(re);
  t.deepEqual(result, [
    'Harry Trump',
    'Fred Barney',
    'Helen Rigby',
    'Bill Abel',
    'Chris Hand '
  ]);

  re = new RE2(/\s+/);
  result = 'Hello World. How are you doing?'.split(re, 3);
  t.deepEqual(result, ['Hello', 'World.', 'How']);

  re = new RE2(/(\d)/);
  result = 'Hello 1 word. Sentence number 2.'.split(re);
  t.deepEqual(result, ['Hello ', '1', ' word. Sentence number ', '2', '.']);

  t.equal(
    'asdfghjkl'
      .split(RE2(/[x-z]*/))
      .reverse()
      .join(''),
    'lkjhgfdsa'
  );
});
