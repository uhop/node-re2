import test from 'tape-six';
import {default as RE2} from '../re2.js';

// tests

// These tests are copied from MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test

test('test test from exec', t => {
  let re = new RE2('quick\\s(brown).+?(jumps)', 'i');

  t.equal(re.test('The Quick Brown Fox Jumps Over The Lazy Dog'), true);
  t.equal(re.test('tHE qUICK bROWN fOX jUMPS oVER tHE lAZY dOG'), true);
  t.equal(re.test('the quick brown fox jumps over the lazy dog'), true);
  t.equal(re.test('THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG'), true);
  t.equal(re.test('THE KWIK BROWN FOX JUMPS OVER THE LAZY DOG'), false);

  re = new RE2('ab*', 'g');

  t.ok(re.test('abbcdefabh'));
  t.notOk(re.test('qwerty'));

  re = new RE2('(hello \\S+)');

  t.ok(re.test('This is a hello world!'));
  t.notOk(re.test('This is a Hello world!'));
});

test('test test successive', t => {
  const str = 'abbcdefabh';

  const re = new RE2('ab*', 'g');
  let result = re.test(str);

  t.ok(result);
  t.equal(re.lastIndex, 3);

  result = re.test(str);

  t.ok(result);
  t.equal(re.lastIndex, 9);

  result = re.test(str);

  t.notOk(result);
});

test('test test simple', t => {
  const str = 'abbcdefabh';

  const re1 = new RE2('ab*', 'g');
  t.ok(re1.test(str));

  const re2 = new RE2('ab*');
  t.ok(re2.test(str));

  const re3 = new RE2('abc');
  t.notOk(re3.test(str));
});

test('test test anchored to beginning', t => {
  const re = RE2('^hello', 'g');

  t.ok(re.test('hellohello'));
  t.notOk(re.test('hellohello'));
});

test('test test invalid', t => {
  const re = RE2('');

  try {
    re.test({
      toString() {
        throw 'corner';
      }
    });
    t.fail(); // shouldn't be here
  } catch (e) {
    t.equal(e, 'corner');
  }
});

test('test test anchor 1', t => {
  const re = new RE2('b|^a', 'g');

  let result = re.test('aabc');
  t.ok(result);
  t.equal(re.lastIndex, 1);

  result = re.test('aabc');
  t.ok(result);
  t.equal(re.lastIndex, 3);

  result = re.test('aabc');
  t.notOk(result);
});

test('test test anchor 2', t => {
  const re = new RE2('(?:^a)', 'g');

  let result = re.test('aabc');
  t.ok(result);
  t.equal(re.lastIndex, 1);

  result = re.test('aabc');
  t.notOk(result);
});

// Unicode tests

test('test test unicode', t => {
  let re = new RE2('охотник\\s(желает).+?(где)', 'i');

  t.ok(re.test('Каждый Охотник Желает Знать Где Сидит Фазан'));
  t.ok(re.test('кАЖДЫЙ оХОТНИК жЕЛАЕТ зНАТЬ гДЕ сИДИТ фАЗАН'));
  t.ok(re.test('каждый охотник желает знать где сидит фазан'));
  t.ok(re.test('КАЖДЫЙ ОХОТНИК ЖЕЛАЕТ ЗНАТЬ ГДЕ СИДИТ ФАЗАН'));
  t.notOk(re.test('Кажный Стрелок Хочет Найти Иде Прячется Птица'));

  re = new RE2('аб*', 'g');

  t.ok(re.test('аббвгдеабё'));
  t.notOk(re.test('йцукен'));

  re = new RE2('(привет \\S+)');

  t.ok(re.test('Это просто привет всем.'));
  t.notOk(re.test('Это просто Привет всем.'));
});

test('test test unicode subsequent', t => {
  const str = 'аббвгдеабё';

  const re = new RE2('аб*', 'g');
  let result = re.test(str);

  t.ok(result);
  t.equal(re.lastIndex, 3);

  result = re.test(str);

  t.ok(result);
  t.equal(re.lastIndex, 9);

  result = re.test(str);

  t.notOk(result);
});

// Buffer tests

test('test test buffer', t => {
  let re = new RE2('охотник\\s(желает).+?(где)', 'i');

  t.ok(re.test(Buffer.from('Каждый Охотник Желает Знать Где Сидит Фазан')));
  t.ok(re.test(Buffer.from('кАЖДЫЙ оХОТНИК жЕЛАЕТ зНАТЬ гДЕ сИДИТ фАЗАН')));
  t.ok(re.test(Buffer.from('каждый охотник желает знать где сидит фазан')));
  t.ok(re.test(Buffer.from('КАЖДЫЙ ОХОТНИК ЖЕЛАЕТ ЗНАТЬ ГДЕ СИДИТ ФАЗАН')));
  t.notOk(re.test(Buffer.from('Кажный Стрелок Хочет Найти Иде Прячется Птица')));

  re = new RE2('аб*', 'g');

  t.ok(re.test(Buffer.from('аббвгдеабё')));
  t.notOk(re.test(Buffer.from('йцукен')));

  re = new RE2('(привет \\S+)');

  t.ok(re.test(Buffer.from('Это просто привет всем.')));
  t.notOk(re.test(Buffer.from('Это просто Привет всем.')));
});

// Sticky tests

test('test test sticky', t => {
  const re = new RE2('\\s+', 'y');

  t.notOk(re.test('Hello world, how are you?'));

  re.lastIndex = 5;

  t.ok(re.test('Hello world, how are you?'));
  t.equal(re.lastIndex, 6);

  const re2 = new RE2('\\s+', 'gy');

  t.notOk(re2.test('Hello world, how are you?'));

  re2.lastIndex = 5;

  t.ok(re2.test('Hello world, how are you?'));
  t.equal(re2.lastIndex, 6);
});
