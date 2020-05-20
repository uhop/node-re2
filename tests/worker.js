'use strict';

const {Worker, isMainThread} = require('worker_threads');

const RE2 = require('../re2');

if (isMainThread) {
  // This re-loads the current file inside a Worker instance.
  console.log('Inside Master!');
  new Worker(__filename);
  test();
} else {
  console.log('Inside Worker!');
  test();
}

function test() {
  const a = new RE2('^\\d+$');
  console.log(isMainThread, a.test('123'), a.test('abc'), a.test('123abc'));

  const b = RE2('^\\d+$');
  console.log(isMainThread, b.test('123'), b.test('abc'), b.test('123abc'));
}
