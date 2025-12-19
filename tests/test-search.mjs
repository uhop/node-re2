import test from 'tape-six';
import {default as RE2} from '../re2.js';

// tests

test('test search', t => {
  const str = 'Total is 42 units.';

  let re = new RE2(/\d+/i);
  let result = re.search(str);
  t.equal(result, 9);

  re = new RE2('\\b[a-z]+\\b');
  result = re.search(str);
  t.equal(result, 6);

  re = new RE2('\\b\\w+\\b');
  result = re.search(str);
  t.equal(result, 0);

  re = new RE2('z', 'gm');
  result = re.search(str);
  t.equal(result, -1);
});

test('test search invalid', t => {
  const re = RE2('');

  try {
    re.search({
      toString() {
        throw 'corner';
      }
    });
    t.fail(); // shouldn't be here
  } catch (e) {
    t.equal(e, 'corner');
  }
});

test('test search unicode', t => {
  const str = 'Всего 42 штуки.';

  let re = new RE2(/\d+/i);
  let result = re.search(str);
  t.equal(result, 6);

  re = new RE2('\\s[а-я]+');
  result = re.search(str);
  t.equal(result, 8);

  re = new RE2('[а-яА-Я]+');
  result = re.search(str);
  t.equal(result, 0);

  re = new RE2('z', 'gm');
  result = re.search(str);
  t.equal(result, -1);
});

test('test search buffer', t => {
  const buf = Buffer.from('Всего 42 штуки.');

  let re = new RE2(/\d+/i);
  let result = re.search(buf);
  t.equal(result, 11);

  re = new RE2('\\s[а-я]+');
  result = re.search(buf);
  t.equal(result, 13);

  re = new RE2('[а-яА-Я]+');
  result = re.search(buf);
  t.equal(result, 0);

  re = new RE2('z', 'gm');
  result = re.search(buf);
  t.equal(result, -1);
});

test('test search sticky', t => {
  const str = 'Total is 42 units.';

  let re = new RE2(/\d+/y);
  let result = re.search(str);
  t.equal(result, -1);

  re = new RE2('\\b[a-z]+\\b', 'y');
  result = re.search(str);
  t.equal(result, -1);

  re = new RE2('\\b\\w+\\b', 'y');
  result = re.search(str);
  t.equal(result, 0);

  re = new RE2('z', 'gmy');
  result = re.search(str);
  t.equal(result, -1);
});
