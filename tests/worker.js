'use strict';

const {Worker, isMainThread} = require('worker_threads');

const RE2 = require('../re2');

if (isMainThread) {
  // This re-loads the current file inside a Worker instance.
  console.log('Inside Master!');
  const worker = new Worker(__filename);
  worker.on('exit', code => {
    console.log('Exit code:', code);
    test('#2');
  });
  test('#1');
} else {
  console.log('Inside Worker!');
  test();
}

function test(msg) {
  msg && console.log(isMainThread ? 'Main' : 'Worker', msg);

  const a = new RE2('^\\d+$');
  console.log(isMainThread, a.test('123'), a.test('abc'), a.test('123abc'), a instanceof RE2);

  const b = RE2('^\\d+$');
  console.log(isMainThread, b.test('123'), b.test('abc'), b.test('123abc'), b instanceof RE2);
}
