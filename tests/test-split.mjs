import test from 'tape-six';
import {default as RE2} from '../re2.js';

// utilities

const verifyBuffer = (bufArray, t) =>
  bufArray.map(x => {
    t.ok(x instanceof Buffer);
    return x.toString();
  });

// tests

// These tests are copied from MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split

test('test split', t => {
  let re = new RE2(/\s+/);
  let result = re.split('Oh brave new world that has such people in it.');
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
  result = re.split('Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec');
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

  re = new RE2(',');
  result = re.split(',Jan,Feb,Mar,Apr,May,Jun,,Jul,Aug,Sep,Oct,Nov,Dec,');
  t.deepEqual(result, [
    '',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    '',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
    ''
  ]);

  re = new RE2(/\s*;\s*/);
  result = re.split(
    'Harry Trump ;Fred Barney; Helen Rigby ; Bill Abel ;Chris Hand '
  );
  t.deepEqual(result, [
    'Harry Trump',
    'Fred Barney',
    'Helen Rigby',
    'Bill Abel',
    'Chris Hand '
  ]);

  re = new RE2(/\s+/);
  result = re.split('Hello World. How are you doing?', 3);
  t.deepEqual(result, ['Hello', 'World.', 'How']);

  re = new RE2(/(\d)/);
  result = re.split('Hello 1 word. Sentence number 2.');
  t.deepEqual(result, ['Hello ', '1', ' word. Sentence number ', '2', '.']);

  t.deepEqual(
    RE2(/[x-z]*/)
      .split('asdfghjkl')
      .reverse()
      .join(''),
    'lkjhgfdsa'
  );
});

test('test_splitInvalid', t => {
  const re = RE2('');

  try {
    re.split({
      toString() {
        throw 'corner';
      }
    });
    t.fail(); // shouldn't be here
  } catch (e) {
    t.equal(e, 'corner');
  }
});

test('test_cornerCases', t => {
  const re = new RE2(/1/);
  const result = re.split('23456');
  t.deepEqual(result, ['23456']);
});

// Unicode tests

test('test split unicode', t => {
  let re = new RE2(/\s+/);
  let result = re.split('Она не понимает, что этим убивает меня.');
  t.deepEqual(result, [
    'Она',
    'не',
    'понимает,',
    'что',
    'этим',
    'убивает',
    'меня.'
  ]);

  re = new RE2(',');
  result = re.split('Пн,Вт,Ср,Чт,Пт,Сб,Вс');
  t.deepEqual(result, ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']);

  re = new RE2(/\s*;\s*/);
  result = re.split('Ваня Иванов ;Петро Петренко; Саша Машин ; Маша Сашина');
  t.deepEqual(result, [
    'Ваня Иванов',
    'Петро Петренко',
    'Саша Машин',
    'Маша Сашина'
  ]);

  re = new RE2(/\s+/);
  result = re.split('Привет мир. Как дела?', 3);
  t.deepEqual(result, ['Привет', 'мир.', 'Как']);

  re = new RE2(/(\d)/);
  result = re.split('Привет 1 слово. Предложение номер 2.');
  t.deepEqual(result, ['Привет ', '1', ' слово. Предложение номер ', '2', '.']);

  t.deepEqual(
    RE2(/[э-я]*/)
      .split('фывапролд')
      .reverse()
      .join(''),
    'длорпавыф'
  );
});

// Buffer tests

test('test split buffer', t => {
  let re = new RE2(/\s+/);
  let result = re.split(Buffer.from('Она не понимает, что этим убивает меня.'));
  t.deepEqual(verifyBuffer(result, t), [
    'Она',
    'не',
    'понимает,',
    'что',
    'этим',
    'убивает',
    'меня.'
  ]);

  re = new RE2(',');
  result = re.split(Buffer.from('Пн,Вт,Ср,Чт,Пт,Сб,Вс'));
  t.deepEqual(verifyBuffer(result, t), [
    'Пн',
    'Вт',
    'Ср',
    'Чт',
    'Пт',
    'Сб',
    'Вс'
  ]);

  re = new RE2(/\s*;\s*/);
  result = re.split(
    Buffer.from('Ваня Иванов ;Петро Петренко; Саша Машин ; Маша Сашина')
  );
  t.deepEqual(verifyBuffer(result, t), [
    'Ваня Иванов',
    'Петро Петренко',
    'Саша Машин',
    'Маша Сашина'
  ]);

  re = new RE2(/\s+/);
  result = re.split(Buffer.from('Привет мир. Как дела?'), 3);
  t.deepEqual(verifyBuffer(result, t), ['Привет', 'мир.', 'Как']);

  re = new RE2(/(\d)/);
  result = re.split(Buffer.from('Привет 1 слово. Предложение номер 2.'));
  t.deepEqual(verifyBuffer(result, t), [
    'Привет ',
    '1',
    ' слово. Предложение номер ',
    '2',
    '.'
  ]);

  t.deepEqual(
    RE2(/[э-я]*/)
      .split(Buffer.from('фывапролд'))
      .reverse()
      .join(''),
    'длорпавыф'
  );
});

// Sticky tests

test('test split sticky', t => {
  const re = new RE2(/\s+/y); // sticky is ignored

  const result = re.split('Oh brave new world that has such people in it.');
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

  const result2 = re.split(' Oh brave new world that has such people in it.');
  t.deepEqual(result2, [
    '',
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
});
